namespace VAOIG.FwaRiskTriage.Application.Common;

public sealed class SystemClock : IClock
{
    public DateTime UtcNow => DateTime.UtcNow;
}
