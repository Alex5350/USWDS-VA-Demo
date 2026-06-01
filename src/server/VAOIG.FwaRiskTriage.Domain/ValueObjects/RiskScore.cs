using VAOIG.FwaRiskTriage.Domain.Enums;

namespace VAOIG.FwaRiskTriage.Domain.ValueObjects;

public readonly record struct RiskScore
{
    public RiskScore(int value)
    {
        Value = Math.Clamp(value, 0, 100);
    }

    public int Value { get; }

    public RiskLevel Level => Value switch
    {
        >= 80 => RiskLevel.Critical,
        >= 60 => RiskLevel.High,
        >= 30 => RiskLevel.Medium,
        _ => RiskLevel.Low
    };
}
