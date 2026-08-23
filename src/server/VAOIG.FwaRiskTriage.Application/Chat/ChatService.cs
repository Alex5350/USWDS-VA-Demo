using VAOIG.FwaRiskTriage.Application.Common;

namespace VAOIG.FwaRiskTriage.Application.Chat;

public sealed class ChatService(IChatRepository repository, IClock clock)
{
    public Task<ChatSessionDto> CreateSessionAsync(string userEmail, CreateChatSessionRequest request, CancellationToken cancellationToken)
    {
        var normalizedUser = NormalizeRequired(userEmail, "User email is required.", 200);
        var title = CreateTitle(request.FirstMessage);
        return repository.CreateSessionAsync(Guid.NewGuid(), normalizedUser, title, clock.UtcNow, cancellationToken);
    }

    public Task<IReadOnlyList<ChatSessionSummaryDto>> ListSessionsAsync(string userEmail, CancellationToken cancellationToken) =>
        repository.ListSessionsAsync(NormalizeRequired(userEmail, "User email is required.", 200), cancellationToken);

    public Task<ChatConversationDto?> GetConversationAsync(Guid publicId, string userEmail, CancellationToken cancellationToken) =>
        repository.GetConversationAsync(publicId, NormalizeRequired(userEmail, "User email is required.", 200), cancellationToken);

    public Task<ChatMessageDto?> AddMessageAsync(Guid publicId, string userEmail, AddChatMessageRequest request, CancellationToken cancellationToken)
    {
        var role = NormalizeRequired(request.Role, "Message role is required.", 20);
        if (role is not "user" and not "assistant" and not "system" and not "tool")
        {
            throw new ArgumentException("Message role must be user, assistant, system, or tool.");
        }

        var content = NormalizeRequired(request.Content, "Message content is required.", 20000);
        return repository.AddMessageAsync(
            publicId,
            NormalizeRequired(userEmail, "User email is required.", 200),
            request with
            {
                Role = role,
                Content = content,
                Model = NormalizeOptional(request.Model, 100),
                FinishReason = NormalizeOptional(request.FinishReason, 50)
            },
            clock.UtcNow,
            cancellationToken);
    }

    public Task<ChatToolCallDto?> AddToolCallAsync(Guid publicId, string userEmail, AddChatToolCallRequest request, CancellationToken cancellationToken)
    {
        var toolName = NormalizeRequired(request.ToolName, "Tool name is required.", 100);
        var allowedSurface = NormalizeRequired(request.AllowedSurface, "Allowed surface is required.", 100);
        var argumentsJson = NormalizeRequired(request.ArgumentsJson, "Tool arguments are required.", 20000);
        return repository.AddToolCallAsync(
            publicId,
            NormalizeRequired(userEmail, "User email is required.", 200),
            request with
            {
                ToolName = toolName,
                AllowedSurface = allowedSurface,
                ArgumentsJson = argumentsJson,
                ResultSummary = NormalizeOptional(request.ResultSummary, 2000),
                ErrorMessage = NormalizeOptional(request.ErrorMessage, 1000)
            },
            clock.UtcNow,
            cancellationToken);
    }

    public Task<ChatContextItemDto?> AddContextItemAsync(Guid publicId, string userEmail, AddChatContextItemRequest request, CancellationToken cancellationToken)
    {
        var contextType = NormalizeRequired(request.ContextType, "Context type is required.", 50);
        var entityType = NormalizeRequired(request.EntityType, "Entity type is required.", 50);
        return repository.AddContextItemAsync(
            publicId,
            NormalizeRequired(userEmail, "User email is required.", 200),
            request with
            {
                ContextType = contextType,
                EntityType = entityType,
                EntityId = NormalizeOptional(request.EntityId, 100),
                Label = NormalizeOptional(request.Label, 200),
                SnapshotJson = NormalizeOptional(request.SnapshotJson, 20000)
            },
            clock.UtcNow,
            cancellationToken);
    }

    public Task<bool> DeleteContextItemAsync(Guid publicId, string userEmail, int contextItemId, CancellationToken cancellationToken) =>
        repository.DeleteContextItemAsync(publicId, NormalizeRequired(userEmail, "User email is required.", 200), contextItemId, cancellationToken);

    public Task<bool> RenameSessionAsync(Guid publicId, string userEmail, string title, CancellationToken cancellationToken) =>
        repository.RenameSessionAsync(publicId, NormalizeRequired(userEmail, "User email is required.", 200), NormalizeRequired(title, "Session title is required.", 200), cancellationToken);

    public Task<bool> SoftDeleteSessionAsync(Guid publicId, string userEmail, CancellationToken cancellationToken) =>
        repository.SoftDeleteSessionAsync(publicId, NormalizeRequired(userEmail, "User email is required.", 200), cancellationToken);

    private static string? CreateTitle(string? firstMessage)
    {
        if (string.IsNullOrWhiteSpace(firstMessage))
        {
            return null;
        }

        var title = firstMessage.Trim();
        return title.Length <= 80 ? title : title[..80];
    }

    private static string NormalizeRequired(string? value, string errorMessage, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException(errorMessage);
        }

        var normalized = value.Trim();
        return normalized.Length <= maxLength ? normalized : normalized[..maxLength];
    }

    private static string? NormalizeOptional(string? value, int maxLength)
    {
        if (value is null)
        {
            return null;
        }

        var normalized = value.Trim();
        return normalized.Length <= maxLength ? normalized : normalized[..maxLength];
    }
}
