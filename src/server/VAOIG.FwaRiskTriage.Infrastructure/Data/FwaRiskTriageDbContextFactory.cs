using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace VAOIG.FwaRiskTriage.Infrastructure.Data;

public sealed class FwaRiskTriageDbContextFactory : IDesignTimeDbContextFactory<FwaRiskTriageDbContext>
{
    public FwaRiskTriageDbContext CreateDbContext(string[] args)
    {
        const string connectionString =
            "Server=localhost,1433;Database=VAOIG_FWA_Demo;User Id=sa;Password=Your_strong_password123!;TrustServerCertificate=True;Encrypt=True;";

        var options = new DbContextOptionsBuilder<FwaRiskTriageDbContext>()
            .UseSqlServer(connectionString)
            .Options;

        return new FwaRiskTriageDbContext(options);
    }
}
