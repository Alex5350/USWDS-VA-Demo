namespace VAOIG.FwaRiskTriage.Application.Common;

public interface IClock
{
    DateTime UtcNow { get; }
}
