using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using VAOIG.FwaRiskTriage.Application.Cases;
using VAOIG.FwaRiskTriage.Application.Audit;
using VAOIG.FwaRiskTriage.Application.Dashboard;
using VAOIG.FwaRiskTriage.Application.Reports;
using VAOIG.FwaRiskTriage.Application.ReferenceData;
using VAOIG.FwaRiskTriage.Application.Security;
using VAOIG.FwaRiskTriage.Infrastructure.Data;
using VAOIG.FwaRiskTriage.Infrastructure.Repositories;
using VAOIG.FwaRiskTriage.Infrastructure.Reporting;

namespace VAOIG.FwaRiskTriage.Infrastructure;

public static class InfrastructureServiceCollection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Server=localhost,1433;Database=VAOIG_FWA_Demo;User Id=sa;Password=Your_strong_password123!;TrustServerCertificate=True;Encrypt=True;";

        services.AddDbContext<FwaRiskTriageDbContext>(options => options.UseSqlServer(connectionString));
        services.AddScoped<DemoDataSeeder>();
        services.AddSingleton<SqlConnectionFactory>();
        services.AddScoped<ICaseRepository, EfCaseRepository>();
        services.AddScoped<IRiskQueueRepository, DapperRiskQueueRepository>();
        services.AddScoped<IDashboardRepository, DapperDashboardRepository>();
        services.AddScoped<IReportRepository, DapperReportRepository>();
        services.AddScoped<IReferenceDataRepository, EfReferenceDataRepository>();
        services.AddScoped<IAuditRepository, EfAuditRepository>();
        services.AddScoped<IDemoPermissionRepository, EfDemoPermissionRepository>();
        services.AddScoped<EfRiskRuleRepository>();

        return services;
    }
}
