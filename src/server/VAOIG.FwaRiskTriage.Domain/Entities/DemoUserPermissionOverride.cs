namespace VAOIG.FwaRiskTriage.Domain.Entities;

public sealed class DemoUserPermissionOverride
{
    public int DemoUserPermissionOverrideId { get; set; }
    public string Email { get; set; } = "";
    public string Permission { get; set; } = "";
    public bool IsGranted { get; set; }
    public string UpdatedBy { get; set; } = "";
    public DateTime UpdatedAt { get; set; }
}
