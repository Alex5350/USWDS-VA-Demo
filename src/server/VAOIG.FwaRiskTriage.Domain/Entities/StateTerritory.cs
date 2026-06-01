namespace VAOIG.FwaRiskTriage.Domain.Entities;

public sealed class StateTerritory
{
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
    public bool IsEnabled { get; set; } = true;
}
