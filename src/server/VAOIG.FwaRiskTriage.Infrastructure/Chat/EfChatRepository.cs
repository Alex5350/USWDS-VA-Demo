using Microsoft.EntityFrameworkCore;
using VAOIG.FwaRiskTriage.Application.Chat;
using VAOIG.FwaRiskTriage.Domain.Entities;
using VAOIG.FwaRiskTriage.Infrastructure.Data;

namespace VAOIG.FwaRiskTriage.Infrastructure.Chat;

public sealed class EfChatRepository(FwaRiskTriageDbContext dbContext) : IChatRepository
{
    public async Task<ChatSessionDto> CreateSessionAsync(
        Guid publicId,
        string userEmail,
        string? title,
        DateTime createdAt,
        CancellationToken cancellationToken)
    {
        var session = new ChatSession
        {
            PublicId = publicId,
            UserEmail = userEmail,
            Title = title,
            CreatedAt = createdAt,
            LastMessageAt = createdAt
        };

        dbContext.ChatSessions.Add(session);
        await dbContext.SaveChangesAsync(cancellationToken);

        return ToDto(session);
    }

    public async Task<IReadOnlyList<ChatSessionSummaryDto>> ListSessionsAsync(
        string userEmail,
        CancellationToken cancellationToken) =>
        await dbContext.ChatSessions.AsNoTracking()
            .Where(x => x.UserEmail == userEmail && !x.IsDeleted)
            .OrderByDescending(x => x.LastMessageAt ?? x.CreatedAt)
            .ThenByDescending(x => x.ChatSessionId)
            .Take(50)
            .Select(x => new ChatSessionSummaryDto(x.PublicId, x.Title, x.CreatedAt, x.LastMessageAt))
            .ToListAsync(cancellationToken);

    public async Task<ChatConversationDto?> GetConversationAsync(
        Guid publicId,
        string userEmail,
        CancellationToken cancellationToken)
    {
        var session = await dbContext.ChatSessions.AsNoTracking()
            .Where(x => x.PublicId == publicId && x.UserEmail == userEmail && !x.IsDeleted)
            .Select(x => new
            {
                x.ChatSessionId,
                Dto = new ChatSessionDto(x.PublicId, x.Title, x.CreatedAt, x.LastMessageAt)
            })
            .FirstOrDefaultAsync(cancellationToken);
        if (session is null)
        {
            return null;
        }

        var messages = await dbContext.ChatMessages.AsNoTracking()
            .Where(x => x.ChatSessionId == session.ChatSessionId)
            .OrderBy(x => x.CreatedAt)
            .ThenBy(x => x.ChatMessageId)
            .Select(x => new ChatMessageDto(
                x.ChatMessageId,
                x.Role,
                x.Content,
                x.ClientMessageId,
                x.Model,
                x.PromptTokens,
                x.CompletionTokens,
                x.FinishReason,
                x.CreatedAt))
            .ToListAsync(cancellationToken);

        var toolCalls = await dbContext.ChatToolCalls.AsNoTracking()
            .Where(x => x.ChatSessionId == session.ChatSessionId)
            .OrderBy(x => x.CreatedAt)
            .ThenBy(x => x.ChatToolCallId)
            .Select(x => new ChatToolCallDto(
                x.ChatToolCallId,
                x.ChatMessageId,
                x.ToolName,
                x.AllowedSurface,
                x.ArgumentsJson,
                x.ResultSummary,
                x.RowCount,
                x.DurationMs,
                x.Succeeded,
                x.ErrorMessage,
                x.CreatedAt))
            .ToListAsync(cancellationToken);

        var contextItems = await dbContext.ChatContextItems.AsNoTracking()
            .Where(x => x.ChatSessionId == session.ChatSessionId)
            .OrderBy(x => x.CreatedAt)
            .ThenBy(x => x.ChatContextItemId)
            .Select(x => new ChatContextItemDto(
                x.ChatContextItemId,
                x.ChatMessageId,
                x.ContextType,
                x.EntityType,
                x.EntityId,
                x.Label,
                x.SnapshotJson,
                x.CreatedAt))
            .ToListAsync(cancellationToken);

        return new ChatConversationDto(session.Dto, messages, toolCalls, contextItems);
    }

    public async Task<ChatMessageDto?> AddMessageAsync(
        Guid publicId,
        string userEmail,
        AddChatMessageRequest request,
        DateTime createdAt,
        CancellationToken cancellationToken)
    {
        var session = await FindOwnedSessionForUpdateAsync(publicId, userEmail, cancellationToken);
        if (session is null)
        {
            return null;
        }

        if (request.ClientMessageId is not null)
        {
            var existingMessage = await FindMessageByClientMessageIdAsync(
                session.ChatSessionId,
                request.ClientMessageId,
                cancellationToken);

            if (existingMessage is not null)
            {
                return ReturnExistingMessageOrThrowRoleConflict(existingMessage, request.Role);
            }
        }

        var message = new ChatMessage
        {
            ChatSessionId = session.ChatSessionId,
            Role = request.Role,
            Content = request.Content,
            ClientMessageId = request.ClientMessageId,
            Model = request.Model,
            PromptTokens = request.PromptTokens,
            CompletionTokens = request.CompletionTokens,
            FinishReason = request.FinishReason,
            CreatedAt = createdAt
        };

        session.LastMessageAt = createdAt;
        dbContext.ChatMessages.Add(message);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException) when (request.ClientMessageId is not null)
        {
            dbContext.Entry(message).State = EntityState.Detached;
            var existingMessage = await FindMessageByClientMessageIdAsync(
                session.ChatSessionId,
                request.ClientMessageId,
                cancellationToken);

            if (existingMessage is not null)
            {
                return ReturnExistingMessageOrThrowRoleConflict(existingMessage, request.Role);
            }

            throw;
        }

        return ToDto(message);
    }

    public async Task<ChatToolCallDto?> AddToolCallAsync(
        Guid publicId,
        string userEmail,
        AddChatToolCallRequest request,
        DateTime createdAt,
        CancellationToken cancellationToken)
    {
        var sessionId = await FindOwnedSessionIdAsync(publicId, userEmail, cancellationToken);
        if (sessionId is null || !await MessageBelongsToSessionAsync(sessionId.Value, request.MessageId, cancellationToken))
        {
            return null;
        }

        var toolCall = new ChatToolCall
        {
            ChatSessionId = sessionId.Value,
            ChatMessageId = request.MessageId,
            ToolName = request.ToolName,
            AllowedSurface = request.AllowedSurface,
            ArgumentsJson = request.ArgumentsJson,
            ResultSummary = request.ResultSummary,
            RowCount = request.RowCount,
            DurationMs = request.DurationMs,
            Succeeded = request.Succeeded,
            ErrorMessage = request.ErrorMessage,
            CreatedAt = createdAt
        };

        dbContext.ChatToolCalls.Add(toolCall);
        await dbContext.SaveChangesAsync(cancellationToken);

        return ToDto(toolCall);
    }

    public async Task<ChatContextItemDto?> AddContextItemAsync(
        Guid publicId,
        string userEmail,
        AddChatContextItemRequest request,
        DateTime createdAt,
        CancellationToken cancellationToken)
    {
        var sessionId = await FindOwnedSessionIdAsync(publicId, userEmail, cancellationToken);
        if (sessionId is null || !await MessageBelongsToSessionAsync(sessionId.Value, request.MessageId, cancellationToken))
        {
            return null;
        }

        var contextItem = new ChatContextItem
        {
            ChatSessionId = sessionId.Value,
            ChatMessageId = request.MessageId,
            ContextType = request.ContextType,
            EntityType = request.EntityType,
            EntityId = request.EntityId,
            Label = request.Label,
            SnapshotJson = request.SnapshotJson,
            CreatedAt = createdAt
        };

        dbContext.ChatContextItems.Add(contextItem);
        await dbContext.SaveChangesAsync(cancellationToken);

        return ToDto(contextItem);
    }

    public async Task<bool> DeleteContextItemAsync(
        Guid publicId,
        string userEmail,
        int contextItemId,
        CancellationToken cancellationToken)
    {
        var sessionId = await FindOwnedSessionIdAsync(publicId, userEmail, cancellationToken);
        if (sessionId is null)
        {
            return false;
        }

        var contextItem = await dbContext.ChatContextItems.FirstOrDefaultAsync(
            x => x.ChatSessionId == sessionId.Value && x.ChatContextItemId == contextItemId,
            cancellationToken);
        if (contextItem is null)
        {
            return false;
        }

        dbContext.ChatContextItems.Remove(contextItem);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RenameSessionAsync(
        Guid publicId,
        string userEmail,
        string title,
        CancellationToken cancellationToken)
    {
        var session = await FindOwnedSessionForUpdateAsync(publicId, userEmail, cancellationToken);
        if (session is null)
        {
            return false;
        }

        session.Title = title;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> SoftDeleteSessionAsync(
        Guid publicId,
        string userEmail,
        CancellationToken cancellationToken)
    {
        var session = await FindOwnedSessionForUpdateAsync(publicId, userEmail, cancellationToken);
        if (session is null)
        {
            return false;
        }

        session.IsDeleted = true;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private Task<ChatSession?> FindOwnedSessionForUpdateAsync(
        Guid publicId,
        string userEmail,
        CancellationToken cancellationToken) =>
        dbContext.ChatSessions.FirstOrDefaultAsync(
            x => x.PublicId == publicId && x.UserEmail == userEmail && !x.IsDeleted,
            cancellationToken);

    private async Task<int?> FindOwnedSessionIdAsync(
        Guid publicId,
        string userEmail,
        CancellationToken cancellationToken)
    {
        var session = await dbContext.ChatSessions.AsNoTracking()
            .Where(x => x.PublicId == publicId && x.UserEmail == userEmail && !x.IsDeleted)
            .Select(x => new { x.ChatSessionId })
            .FirstOrDefaultAsync(cancellationToken);

        return session?.ChatSessionId;
    }

    private async Task<bool> MessageBelongsToSessionAsync(
        int chatSessionId,
        int? chatMessageId,
        CancellationToken cancellationToken)
    {
        if (chatMessageId is null)
        {
            return true;
        }

        return await dbContext.ChatMessages.AsNoTracking()
            .AnyAsync(
                x => x.ChatSessionId == chatSessionId && x.ChatMessageId == chatMessageId.Value,
                cancellationToken);
    }

    private Task<ChatMessageDto?> FindMessageByClientMessageIdAsync(
        int chatSessionId,
        string clientMessageId,
        CancellationToken cancellationToken) =>
        dbContext.ChatMessages
            .AsNoTracking()
            .Where(x => x.ChatSessionId == chatSessionId && x.ClientMessageId == clientMessageId)
            .Select(x => new ChatMessageDto(
                x.ChatMessageId,
                x.Role,
                x.Content,
                x.ClientMessageId,
                x.Model,
                x.PromptTokens,
                x.CompletionTokens,
                x.FinishReason,
                x.CreatedAt))
            .FirstOrDefaultAsync(cancellationToken);

    private static ChatMessageDto ReturnExistingMessageOrThrowRoleConflict(ChatMessageDto existingMessage, string role)
    {
        if (existingMessage.Role != role)
        {
            throw new InvalidOperationException("Client message id already exists for a different message role.");
        }

        return existingMessage;
    }

    private static ChatSessionDto ToDto(ChatSession session) => new(
        session.PublicId,
        session.Title,
        session.CreatedAt,
        session.LastMessageAt);

    private static ChatMessageDto ToDto(ChatMessage message) => new(
        message.ChatMessageId,
        message.Role,
        message.Content,
        message.ClientMessageId,
        message.Model,
        message.PromptTokens,
        message.CompletionTokens,
        message.FinishReason,
        message.CreatedAt);

    private static ChatToolCallDto ToDto(ChatToolCall toolCall) => new(
        toolCall.ChatToolCallId,
        toolCall.ChatMessageId,
        toolCall.ToolName,
        toolCall.AllowedSurface,
        toolCall.ArgumentsJson,
        toolCall.ResultSummary,
        toolCall.RowCount,
        toolCall.DurationMs,
        toolCall.Succeeded,
        toolCall.ErrorMessage,
        toolCall.CreatedAt);

    private static ChatContextItemDto ToDto(ChatContextItem contextItem) => new(
        contextItem.ChatContextItemId,
        contextItem.ChatMessageId,
        contextItem.ContextType,
        contextItem.EntityType,
        contextItem.EntityId,
        contextItem.Label,
        contextItem.SnapshotJson,
        contextItem.CreatedAt);
}
