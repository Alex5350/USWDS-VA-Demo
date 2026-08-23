using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using VAOIG.FwaRiskTriage.Api.Endpoints;
using VAOIG.FwaRiskTriage.Api.Security;
using VAOIG.FwaRiskTriage.Application.Cases;
using VAOIG.FwaRiskTriage.Application.Chat;
using VAOIG.FwaRiskTriage.Application.Common;
using VAOIG.FwaRiskTriage.Application.Dashboard;
using VAOIG.FwaRiskTriage.Application.Reports;
using VAOIG.FwaRiskTriage.Application.RiskScoring;
using VAOIG.FwaRiskTriage.Application.Security;
using VAOIG.FwaRiskTriage.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpContextAccessor();
builder.Services.AddHealthChecks();

builder.Services.AddCors(options =>
{
    options.AddPolicy("LocalNextJs", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services
    .AddAuthentication(DemoAuthenticationHandler.SchemeName)
    .AddScheme<AuthenticationSchemeOptions, DemoAuthenticationHandler>(
        DemoAuthenticationHandler.SchemeName,
        _ => { });
builder.Services.AddAuthorization(Policies.AddDemoPolicies);

builder.Services.AddSingleton<IClock, VAOIG.FwaRiskTriage.Application.Common.SystemClock>();
builder.Services.AddSingleton<DemoAuthorizationService>();
builder.Services.AddSingleton<DemoUserStore>();
builder.Services.AddScoped<IDemoUserContext, HttpDemoUserContext>();
builder.Services.AddScoped<IRiskScoringService, RiskScoringService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<CaseWorkflowService>();
builder.Services.AddScoped<ChatService>();
builder.Services.AddScoped<ReportExportService>();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors("LocalNextJs");
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapHealthChecks("/api/health", new HealthCheckOptions());

app.MapDashboardEndpoints();
app.MapReferenceDataEndpoints();
app.MapRiskQueueEndpoints();
app.MapRiskRecordEndpoints();
app.MapCaseEndpoints();
app.MapRulesEndpoints();
app.MapReportsEndpoints();
app.MapChatEndpoints();
app.MapSecurityEndpoints();

app.Run();

public partial class Program;
