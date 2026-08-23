using Microsoft.EntityFrameworkCore;
using VAOIG.FwaRiskTriage.Domain.Entities;
using VAOIG.FwaRiskTriage.Infrastructure.Data;

namespace VAOIG.FwaRiskTriage.Tests;

public sealed class ChatRepositoryTests
{
    [Fact]
    public async Task ChatEntitiesCanBePersistedWithRelationships()
    {
        await using var dbContext = CreateDbContext();
        var session = new ChatSession
        {
            PublicId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            UserEmail = "demo.analyst@local",
            Title = "Open cases",
            CreatedAt = new DateTime(2026, 6, 3, 14, 0, 0, DateTimeKind.Utc),
            LastMessageAt = new DateTime(2026, 6, 3, 14, 1, 0, DateTimeKind.Utc)
        };
        dbContext.ChatSessions.Add(session);
        await dbContext.SaveChangesAsync();

        var message = new ChatMessage
        {
            ChatSessionId = session.ChatSessionId,
            Role = "user",
            Content = "How many open cases are pending by status?",
            CreatedAt = session.CreatedAt
        };
        dbContext.ChatMessages.Add(message);
        await dbContext.SaveChangesAsync();

        dbContext.ChatToolCalls.Add(new ChatToolCall
        {
            ChatSessionId = session.ChatSessionId,
            ChatMessageId = message.ChatMessageId,
            ToolName = "getCaseCounts",
            AllowedSurface = "CaseFiles",
            ArgumentsJson = "{\"groupBy\":\"status\"}",
            ResultSummary = "Grouped 4 active statuses.",
            RowCount = 4,
            DurationMs = 12,
            Succeeded = true,
            CreatedAt = session.CreatedAt
        });
        dbContext.ChatContextItems.Add(new ChatContextItem
        {
            ChatSessionId = session.ChatSessionId,
            ChatMessageId = message.ChatMessageId,
            ContextType = "filter",
            EntityType = "CaseStatus",
            EntityId = "Open",
            Label = "Open case statuses",
            SnapshotJson = "{\"statuses\":[\"New\",\"UnderReview\",\"Escalated\"]}",
            CreatedAt = session.CreatedAt
        });
        await dbContext.SaveChangesAsync();

        var saved = await dbContext.ChatSessions
            .Include(x => x.Messages)
            .Include(x => x.ToolCalls)
            .Include(x => x.ContextItems)
            .SingleAsync(x => x.PublicId == session.PublicId);

        Assert.Equal("demo.analyst@local", saved.UserEmail);
        Assert.Single(saved.Messages);
        Assert.Single(saved.ToolCalls);
        Assert.Single(saved.ContextItems);
    }

    private static FwaRiskTriageDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<FwaRiskTriageDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new FwaRiskTriageDbContext(options);
    }
}
