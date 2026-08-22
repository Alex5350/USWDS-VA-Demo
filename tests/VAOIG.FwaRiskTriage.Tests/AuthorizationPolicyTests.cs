using VAOIG.FwaRiskTriage.Application.Security;

namespace VAOIG.FwaRiskTriage.Tests;

public sealed class AuthorizationPolicyTests
{
    private readonly DemoAuthorizationService _authorization = new();

    [Fact]
    public void ReadOnlyUserCannotAddCaseNote()
    {
        Assert.False(_authorization.HasPermission(["ReadOnly"], "CanAddCaseNote"));
    }

    [Fact]
    public void InvestigatorCanReferCase()
    {
        Assert.True(_authorization.HasPermission(["Investigator"], "CanReferCase"));
    }

    [Fact]
    public void AdministratorCanEditRiskRules()
    {
        Assert.True(_authorization.HasPermission(["Administrator"], "CanEditRiskRules"));
    }

    [Theory]
    [InlineData("Analyst")]
    [InlineData("Investigator")]
    [InlineData("Supervisor")]
    [InlineData("Administrator")]
    public void AnalystInvestigatorSupervisorAndAdministratorCanCreateAndEscalateCaseRecords(string role)
    {
        Assert.True(_authorization.HasPermission([role], "CanCreateCaseRecord"));
        Assert.True(_authorization.HasPermission([role], "CanEscalateCase"));
    }

    [Theory]
    [InlineData("Analyst")]
    [InlineData("Investigator")]
    [InlineData("Supervisor")]
    [InlineData("Administrator")]
    public void AnalystInvestigatorSupervisorAndAdministratorCanEditCases(string role)
    {
        Assert.True(_authorization.HasPermission([role], "CanEditCase"));
    }

    [Theory]
    [InlineData("Analyst")]
    [InlineData("Investigator")]
    [InlineData("Supervisor")]
    [InlineData("Administrator")]
    public void AnalystInvestigatorSupervisorAndAdministratorCanSoftDeleteCases(string role)
    {
        Assert.True(_authorization.HasPermission([role], "CanDeleteCase"));
    }

    [Fact]
    public void AdministratorCanManageDemoPermissionsAndViewAudit()
    {
        Assert.True(_authorization.HasPermission(["Administrator"], "CanManageDemoPermissions"));
        Assert.True(_authorization.HasPermission(["Administrator"], "CanViewAudit"));
    }

    [Theory]
    [InlineData("Investigator")]
    [InlineData("Supervisor")]
    [InlineData("Administrator")]
    public void InvestigatorSupervisorAndAdministratorCanManageProviders(string role)
    {
        Assert.True(_authorization.HasPermission([role], "CanManageProviders"));
    }

    [Theory]
    [InlineData("Supervisor")]
    [InlineData("Administrator")]
    public void SupervisorAndAdministratorCanManageProcedureCodes(string role)
    {
        Assert.True(_authorization.HasPermission([role], "CanManageProcedureCodes"));
    }
}
