namespace VAOIG.FwaRiskTriage.Domain.Entities;

public sealed class ChatSession
{
    public int ChatSessionId { get; set; }
    public Guid PublicId { get; set; }
    public string UserEmail { get; set; } = "";
    public string? Title { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public bool IsDeleted { get; set; }

    public List<ChatMessage> Messages { get; set; } = [];
    public List<ChatToolCall> ToolCalls { get; set; } = [];
    public List<ChatContextItem> ContextItems { get; set; } = [];
}
