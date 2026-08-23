namespace VAOIG.FwaRiskTriage.Domain.Entities;

public sealed class ChatToolCall
{
    public int ChatToolCallId { get; set; }
    public int ChatSessionId { get; set; }
    public int? ChatMessageId { get; set; }
    public string ToolName { get; set; } = "";
    public string AllowedSurface { get; set; } = "";
    public string ArgumentsJson { get; set; } = "";
    public string? ResultSummary { get; set; }
    public int? RowCount { get; set; }
    public int? DurationMs { get; set; }
    public bool Succeeded { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; }
}
