namespace VAOIG.FwaRiskTriage.Domain.Entities;

public sealed class Provider
{
    public int ProviderId { get; set; }
    public string ProviderName { get; set; } = "";
    public string Npi { get; set; } = "";
    public string ProviderType { get; set; } = "";
    public string State { get; set; } = "";
    public string RiskTier { get; set; } = "";
    public bool IsEnabled { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}
