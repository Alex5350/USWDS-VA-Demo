namespace VAOIG.FwaRiskTriage.Domain.Entities;

public sealed class ChatContextItem
{
    public int ChatContextItemId { get; set; }
    public int ChatSessionId { get; set; }
    public int? ChatMessageId { get; set; }
    public string ContextType { get; set; } = "";
    public string EntityType { get; set; } = "";
    public string? EntityId { get; set; }
    public string? Label { get; set; }
    public string? SnapshotJson { get; set; }
    public DateTime CreatedAt { get; set; }
}
