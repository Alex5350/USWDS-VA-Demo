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
    public async Task AddMessageRejectsEmptyUserContent()
    {
        var service = new ChatService(new FakeChatRepository(), new FixedClock());

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.AddMessageAsync(
                Guid.Parse("11111111-1111-1111-1111-111111111111"),
                "demo.analyst@local",
                new AddChatMessageRequest("user", " "),
                CancellationToken.None));
    }

    [Fact]
    public async Task AddMessageAllowsEmptyAssistantContentAndNormalizesClientMessageId()
    {
        var repository = new FakeChatRepository();
        var service = new ChatService(repository, new FixedClock());

        await service.AddMessageAsync(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            " demo.analyst@local ",
            new AddChatMessageRequest(" assistant ", " ", " model ", null, null, " stop ", $" {Repeat("c", 200)} "),
            CancellationToken.None);

        Assert.NotNull(repository.AddedMessageRequest);
        Assert.Equal("assistant", repository.AddedMessageRequest.Role);
        Assert.Equal("", repository.AddedMessageRequest.Content);
        Assert.Equal("model", repository.AddedMessageRequest.Model);
        Assert.Equal("stop", repository.AddedMessageRequest.FinishReason);
        Assert.Equal(200, repository.AddedMessageRequest.ClientMessageId?.Length);
    }

    [Fact]
    public async Task AddMessageRejectsOverlongClientMessageId()
    {
        var service = new ChatService(new FakeChatRepository(), new FixedClock());

        var error = await Assert.ThrowsAsync<ArgumentException>(() =>
            service.AddMessageAsync(
                Guid.Parse("11111111-1111-1111-1111-111111111111"),
                "demo.analyst@local",
                new AddChatMessageRequest("assistant", "", ClientMessageId: Repeat("c", 201)),
                CancellationToken.None));

        Assert.Equal("Client message id must be 200 characters or fewer.", error.Message);
    }

    [Fact]
    public async Task AddMessageNormalizesRequestBeforeDelegation()
    {
        var repository = new FakeChatRepository();
        var service = new ChatService(repository, new FixedClock());

        await service.AddMessageAsync(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            " demo.analyst@local ",
            new AddChatMessageRequest(
                " user ",
                " Hello analyst ",
                $" {Repeat("m", 120)} ",
                null,
                null,
                $" {Repeat("f", 60)} ",
                " message-1 "),
            CancellationToken.None);

        Assert.NotNull(repository.AddedMessageRequest);
        Assert.Equal("demo.analyst@local", repository.AddedMessageUserEmail);
        Assert.Equal("user", repository.AddedMessageRequest.Role);
        Assert.Equal("Hello analyst", repository.AddedMessageRequest.Content);
        Assert.Equal(100, repository.AddedMessageRequest.Model?.Length);
        Assert.Equal(50, repository.AddedMessageRequest.FinishReason?.Length);
        Assert.Equal("message-1", repository.AddedMessageRequest.ClientMessageId);
    }

    [Fact]
    public async Task AddMessageRejectsInvalidRole()
    {
        var service = new ChatService(new FakeChatRepository(), new FixedClock());

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.AddMessageAsync(
                Guid.Parse("11111111-1111-1111-1111-111111111111"),
                "demo.analyst@local",
                new AddChatMessageRequest("auditor", "Hello analyst"),
                CancellationToken.None));
    }

    [Fact]
    public async Task AddToolCallNormalizesRequestBeforeDelegation()
    {
        var repository = new FakeChatRepository();
        var service = new ChatService(repository, new FixedClock());

        await service.AddToolCallAsync(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            " demo.analyst@local ",
            new AddChatToolCallRequest(
                1,
                $" {Repeat("t", 120)} ",
                $" {Repeat("s", 120)} ",
                " { \"caseId\": 42 } ",
                $" {Repeat("r", 2010)} ",
                3,
                120,
                true,
                $" {Repeat("e", 1010)} "),
            CancellationToken.None);

        Assert.NotNull(repository.AddedToolCallRequest);
        Assert.Equal("demo.analyst@local", repository.AddedToolCallUserEmail);
        Assert.Equal(100, repository.AddedToolCallRequest.ToolName.Length);
        Assert.Equal(100, repository.AddedToolCallRequest.AllowedSurface.Length);
        Assert.Equal("{ \"caseId\": 42 }", repository.AddedToolCallRequest.ArgumentsJson);
        Assert.Equal(2000, repository.AddedToolCallRequest.ResultSummary?.Length);
        Assert.Equal(1000, repository.AddedToolCallRequest.ErrorMessage?.Length);
    }

    [Fact]
    public async Task AddContextItemNormalizesRequestBeforeDelegation()
    {
        var repository = new FakeChatRepository();
        var service = new ChatService(repository, new FixedClock());

        await service.AddContextItemAsync(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            " demo.analyst@local ",
            new AddChatContextItemRequest(
                1,
                $" {Repeat("c", 60)} ",
                $" {Repeat("e", 60)} ",
                $" {Repeat("i", 120)} ",
                $" {Repeat("l", 220)} ",
                " { \"status\": \"Open\" } "),
            CancellationToken.None);

        Assert.NotNull(repository.AddedContextItemRequest);
        Assert.Equal("demo.analyst@local", repository.AddedContextItemUserEmail);
        Assert.Equal(50, repository.AddedContextItemRequest.ContextType.Length);
        Assert.Equal(50, repository.AddedContextItemRequest.EntityType.Length);
        Assert.Equal(100, repository.AddedContextItemRequest.EntityId?.Length);
        Assert.Equal(200, repository.AddedContextItemRequest.Label?.Length);
        Assert.Equal("{ \"status\": \"Open\" }", repository.AddedContextItemRequest.SnapshotJson);
    }

    [Fact]
    public async Task HardDeleteSessionNormalizesUserEmailBeforeDelegation()
    {
        var repository = new FakeChatRepository();
        var service = new ChatService(repository, new FixedClock());
        var chatId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        await service.HardDeleteSessionAsync(chatId, " demo.analyst@local ", CancellationToken.None);

        Assert.Equal(chatId, repository.HardDeletedPublicId);
        Assert.Equal("demo.analyst@local", repository.HardDeletedUserEmail);
    }

    private static string Repeat(string value, int count) => string.Concat(Enumerable.Repeat(value, count));

    private sealed class FixedClock : IClock
    {
        public DateTime UtcNow { get; } = new(2026, 6, 3, 14, 0, 0, DateTimeKind.Utc);
    }

    private sealed class FakeChatRepository : IChatRepository
    {
        public string? CreatedUserEmail { get; private set; }
        public string? AddedMessageUserEmail { get; private set; }
        public AddChatMessageRequest? AddedMessageRequest { get; private set; }
        public string? AddedToolCallUserEmail { get; private set; }
        public AddChatToolCallRequest? AddedToolCallRequest { get; private set; }
        public string? AddedContextItemUserEmail { get; private set; }
        public AddChatContextItemRequest? AddedContextItemRequest { get; private set; }
        public Guid? HardDeletedPublicId { get; private set; }
        public string? HardDeletedUserEmail { get; private set; }

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
            CancellationToken cancellationToken)
        {
            AddedMessageUserEmail = userEmail;
            AddedMessageRequest = request;
            return Task.FromResult<ChatMessageDto?>(
                new ChatMessageDto(1, request.Role, request.Content, request.ClientMessageId, null, null, null, null, createdAt));
        }

        public Task<ChatToolCallDto?> AddToolCallAsync(
            Guid publicId,
            string userEmail,
            AddChatToolCallRequest request,
            DateTime createdAt,
            CancellationToken cancellationToken)
        {
            AddedToolCallUserEmail = userEmail;
            AddedToolCallRequest = request;
            return Task.FromResult<ChatToolCallDto?>(null);
        }

        public Task<ChatContextItemDto?> AddContextItemAsync(
            Guid publicId,
            string userEmail,
            AddChatContextItemRequest request,
            DateTime createdAt,
            CancellationToken cancellationToken)
        {
            AddedContextItemUserEmail = userEmail;
            AddedContextItemRequest = request;
            return Task.FromResult<ChatContextItemDto?>(null);
        }

        public Task<bool> DeleteContextItemAsync(Guid publicId, string userEmail, int contextItemId, CancellationToken cancellationToken) =>
            Task.FromResult(false);

        public Task<bool> RenameSessionAsync(Guid publicId, string userEmail, string title, CancellationToken cancellationToken) =>
            Task.FromResult(false);

        public Task<bool> SoftDeleteSessionAsync(Guid publicId, string userEmail, CancellationToken cancellationToken) =>
            Task.FromResult(false);

        public Task<bool> HardDeleteSessionAsync(Guid publicId, string userEmail, CancellationToken cancellationToken)
        {
            HardDeletedPublicId = publicId;
            HardDeletedUserEmail = userEmail;
            return Task.FromResult(true);
        }
    }
}
