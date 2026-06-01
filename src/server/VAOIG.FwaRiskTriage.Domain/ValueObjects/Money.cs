namespace VAOIG.FwaRiskTriage.Domain.ValueObjects;

public readonly record struct Money(decimal Amount)
{
    public static Money Zero => new(0);
}
