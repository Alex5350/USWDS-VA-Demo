namespace VAOIG.FwaRiskTriage.Application.Security;

public interface IDemoUserContext
{
    DemoUserDto CurrentUser { get; }
}
