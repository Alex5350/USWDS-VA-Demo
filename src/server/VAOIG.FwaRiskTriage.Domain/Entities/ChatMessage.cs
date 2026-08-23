namespace VAOIG.FwaRiskTriage.Domain.Entities;

public sealed class ChatMessage
{
    public int ChatMessageId { get; set; }
    public int ChatSessionId { get; set; }
    public string Role { get; set; } = "";
    public string Content { get; set; } = "";
    public string? ClientMessageId { get; set; }
    public string? Model { get; set; }
    public int? PromptTokens { get; set; }
    public int? CompletionTokens { get; set; }
    public string? FinishReason { get; set; }
    public DateTime CreatedAt { get; set; }
}
