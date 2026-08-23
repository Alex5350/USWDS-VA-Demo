namespace VAOIG.FwaRiskTriage.Application.Chat;

public sealed record CreateChatSessionRequest(string? FirstMessage);

public sealed record ChatSessionDto(Guid ChatId, string? Title, DateTime CreatedAt, DateTime? LastMessageAt);

public sealed record ChatSessionSummaryDto(Guid ChatId, string? Title, DateTime CreatedAt, DateTime? LastMessageAt);

public sealed record ChatMessageDto(
    int MessageId,
    string Role,
    string Content,
    string? ClientMessageId,
    string? Model,
    int? PromptTokens,
    int? CompletionTokens,
    string? FinishReason,
    DateTime CreatedAt);

public sealed record AddChatMessageRequest(
    string Role,
    string Content,
    string? Model = null,
    int? PromptTokens = null,
    int? CompletionTokens = null,
    string? FinishReason = null,
    string? ClientMessageId = null);

public sealed record ChatToolCallDto(
    int ToolCallId,
    int? MessageId,
    string ToolName,
    string AllowedSurface,
    string ArgumentsJson,
    string? ResultSummary,
    int? RowCount,
    int? DurationMs,
    bool Succeeded,
    string? ErrorMessage,
    DateTime CreatedAt);

public sealed record AddChatToolCallRequest(
    int? MessageId,
    string ToolName,
    string AllowedSurface,
    string ArgumentsJson,
    string? ResultSummary,
    int? RowCount,
    int? DurationMs,
    bool Succeeded,
    string? ErrorMessage);

public sealed record ChatContextItemDto(
    int ContextItemId,
    int? MessageId,
    string ContextType,
    string EntityType,
    string? EntityId,
    string? Label,
    string? SnapshotJson,
    DateTime CreatedAt);

public sealed record AddChatContextItemRequest(
    int? MessageId,
    string ContextType,
    string EntityType,
    string? EntityId,
    string? Label,
    string? SnapshotJson);

public sealed record ChatConversationDto(
    ChatSessionDto Session,
    IReadOnlyList<ChatMessageDto> Messages,
    IReadOnlyList<ChatToolCallDto> ToolCalls,
    IReadOnlyList<ChatContextItemDto> ContextItems);

public sealed record UpdateChatSessionRequest(string? Title, bool? IsDeleted);
