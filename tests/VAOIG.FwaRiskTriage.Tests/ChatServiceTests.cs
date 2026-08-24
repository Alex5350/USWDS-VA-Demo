using VAOIG.FwaRiskTriage.Application.Chat;
using VAOIG.FwaRiskTriage.Application.Common;

namespace VAOIG.FwaRiskTriage.Tests;

public sealed class ChatServiceTests
{
    [Fact]
    public async Task CreateSessionNormalizesTitleAndUserEmail()
    {
        var repository = new FakeChatRepository();
        var service = new ChatService(repository, new FixedClock());

        var session = await service.CreateSessionAsync(
            " demo.analyst@local ",
            new CreateChatSessionRequest(" How many open cases are pending by status? "),
            CancellationToken.None);

        Assert.Equal("demo.analyst@local", repository.CreatedUserEmail);
        Assert.Equal("How many open cases are pending by status?", session.Title);
        Assert.NotEqual(Guid.Empty, session.ChatId);
    }

    [Fact]
    public async Task AddMessageRejectsEmptyContent()
    {
        var service = new ChatService(new FakeChatRepository(), new FixedClock());

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.AddMessageAsync(
                Guid.Parse("11111111-1111-1111-1111-111111111111"),
                "demo.analyst@local",
                new AddChatMessageRequest("user", " "),
                CancellationToken.None));
    }

    private sealed class FixedClock : IClock
    {
        public DateTime UtcNow { get; } = new(2026, 6, 3, 14, 0, 0, DateTimeKind.Utc);
    }

    private sealed class FakeChatRepository : IChatRepository
    {
        public string? CreatedUserEmail { get; private set; }

        public Task<ChatSessionDto> CreateSessionAsync(
            Guid publicId,
            string userEmail,
            string? title,
            DateTime createdAt,
            CancellationToken cancellationToken)
        {
            CreatedUserEmail = userEmail;
            return Task.FromResult(new ChatSessionDto(publicId, title, createdAt, null));
        }

        public Task<IReadOnlyList<ChatSessionSummaryDto>> ListSessionsAsync(string userEmail, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<ChatSessionSummaryDto>>([]);

        public Task<ChatConversationDto?> GetConversationAsync(Guid publicId, string userEmail, CancellationToken cancellationToken) =>
            Task.FromResult<ChatConversationDto?>(null);

        public Task<ChatMessageDto?> AddMessageAsync(
            Guid publicId,
            string userEmail,
            AddChatMessageRequest request,
            DateTime createdAt,
            CancellationToken cancellationToken) =>
            Task.FromResult<ChatMessageDto?>(new ChatMessageDto(1, request.Role, request.Content, null, null, null, null, createdAt));

        public Task<ChatToolCallDto?> AddToolCallAsync(
            Guid publicId,
            string userEmail,
            AddChatToolCallRequest request,
            DateTime createdAt,
            CancellationToken cancellationToken) =>
            Task.FromResult<ChatToolCallDto?>(null);

        public Task<ChatContextItemDto?> AddContextItemAsync(
            Guid publicId,
            string userEmail,
            AddChatContextItemRequest request,
            DateTime createdAt,
            CancellationToken cancellationToken) =>
            Task.FromResult<ChatContextItemDto?>(null);

        public Task<bool> DeleteContextItemAsync(Guid publicId, string userEmail, int contextItemId, CancellationToken cancellationToken) =>
            Task.FromResult(false);

        public Task<bool> RenameSessionAsync(Guid publicId, string userEmail, string title, CancellationToken cancellationToken) =>
            Task.FromResult(false);

        public Task<bool> SoftDeleteSessionAsync(Guid publicId, string userEmail, CancellationToken cancellationToken) =>
            Task.FromResult(false);
    }
}
