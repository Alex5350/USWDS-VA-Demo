namespace VAOIG.FwaRiskTriage.Domain.ValueObjects;

public readonly record struct DateRange(DateOnly StartDate, DateOnly EndDate)
{
    public bool Contains(DateOnly date) => date >= StartDate && date <= EndDate;
}
