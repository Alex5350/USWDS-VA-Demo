namespace VAOIG.FwaRiskTriage.Application.Chat;

public interface IChatRepository
{
    Task<ChatSessionDto> CreateSessionAsync(Guid publicId, string userEmail, string? title, DateTime createdAt, CancellationToken cancellationToken);
    Task<IReadOnlyList<ChatSessionSummaryDto>> ListSessionsAsync(string userEmail, CancellationToken cancellationToken);
    Task<ChatConversationDto?> GetConversationAsync(Guid publicId, string userEmail, CancellationToken cancellationToken);
    Task<ChatMessageDto?> AddMessageAsync(Guid publicId, string userEmail, AddChatMessageRequest request, DateTime createdAt, CancellationToken cancellationToken);
    Task<ChatToolCallDto?> AddToolCallAsync(Guid publicId, string userEmail, AddChatToolCallRequest request, DateTime createdAt, CancellationToken cancellationToken);
    Task<ChatContextItemDto?> AddContextItemAsync(Guid publicId, string userEmail, AddChatContextItemRequest request, DateTime createdAt, CancellationToken cancellationToken);
    Task<bool> DeleteContextItemAsync(Guid publicId, string userEmail, int contextItemId, CancellationToken cancellationToken);
    Task<bool> RenameSessionAsync(Guid publicId, string userEmail, string title, CancellationToken cancellationToken);
    Task<bool> SoftDeleteSessionAsync(Guid publicId, string userEmail, CancellationToken cancellationToken);
}
