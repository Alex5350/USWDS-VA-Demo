using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VAOIG.FwaRiskTriage.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCaseSoftDeleteRecycleBin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeleteReason",
                table: "CaseFiles",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "CaseFiles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "CaseFiles",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "CaseFiles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_CaseFiles_DeletedAt",
                table: "CaseFiles",
                column: "DeletedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CaseFiles_IsDeleted_Status_RiskLevel_RiskScore",
                table: "CaseFiles",
                columns: new[] { "IsDeleted", "Status", "RiskLevel", "RiskScore" });

            migrationBuilder.Sql("""
                CREATE OR ALTER VIEW dbo.vw_DashboardSummary
                AS
                SELECT
                    TotalClaimsReviewed = CAST((SELECT COUNT_BIG(*) FROM dbo.Claims) AS int),
                    HighRiskClaims = CAST((SELECT COUNT_BIG(*) FROM dbo.CaseFiles WHERE IsDeleted = 0 AND RiskLevel = N'High') AS int),
                    CriticalRiskClaims = CAST((SELECT COUNT_BIG(*) FROM dbo.CaseFiles WHERE IsDeleted = 0 AND RiskLevel = N'Critical') AS int),
                    EstimatedQuestionedCost = CAST(ISNULL((SELECT SUM(EstimatedQuestionedCost) FROM dbo.CaseFiles WHERE IsDeleted = 0), 0) AS decimal(18,2)),
                    DuplicatePaymentCandidates = CAST((
                        SELECT COUNT_BIG(*)
                        FROM dbo.Claims c
                        WHERE EXISTS
                        (
                            SELECT 1
                            FROM dbo.Claims d
                            WHERE d.ClaimId <> c.ClaimId
                              AND d.VeteranId = c.VeteranId
                              AND d.ProviderId = c.ProviderId
                              AND d.ProcedureCode = c.ProcedureCode
                              AND d.ServiceDate = c.ServiceDate
                              AND d.PaidAmount = c.PaidAmount
                        )
                    ) AS int),
                    ProvidersWithAbnormalPatterns = CAST((
                        SELECT COUNT_BIG(*)
                        FROM
                        (
                            SELECT c.ProviderId
                            FROM dbo.Claims c
                            INNER JOIN dbo.CaseFiles cf ON cf.ClaimId = c.ClaimId
                            WHERE cf.IsDeleted = 0
                              AND cf.RiskLevel IN (N'High', N'Critical')
                            GROUP BY c.ProviderId
                            HAVING COUNT_BIG(*) >= 3
                        ) p
                    ) AS int),
                    OpenCases = CAST((SELECT COUNT_BIG(*) FROM dbo.CaseFiles WHERE IsDeleted = 0 AND Status <> N'Closed') AS int),
                    AverageCaseAgeDays = CAST(ISNULL((
                        SELECT AVG(CAST(DATEDIFF(day, CreatedDate, COALESCE(ClosedDate, SYSUTCDATETIME())) AS decimal(18,2)))
                        FROM dbo.CaseFiles
                        WHERE IsDeleted = 0
                          AND Status <> N'Closed'
                    ), 0) AS decimal(18,1));
                """);

            migrationBuilder.Sql("""
                CREATE OR ALTER VIEW dbo.vw_ProviderRiskSummary
                AS
                SELECT
                    p.ProviderId,
                    p.ProviderName,
                    p.ProviderType,
                    p.State,
                    p.RiskTier,
                    ClaimCount = COUNT(c.ClaimId),
                    TotalPaidAmount = CAST(ISNULL(SUM(c.PaidAmount), 0) AS decimal(18,2)),
                    HighRiskClaimCount = SUM(CASE WHEN cf.RiskLevel = N'High' THEN 1 ELSE 0 END),
                    CriticalRiskClaimCount = SUM(CASE WHEN cf.RiskLevel = N'Critical' THEN 1 ELSE 0 END),
                    EstimatedQuestionedCost = CAST(ISNULL(SUM(cf.EstimatedQuestionedCost), 0) AS decimal(18,2)),
                    AverageRiskScore = CAST(ISNULL(AVG(CAST(cf.RiskScore AS decimal(18,2))), 0) AS decimal(18,1))
                FROM dbo.Providers p
                LEFT JOIN dbo.Claims c ON c.ProviderId = p.ProviderId
                LEFT JOIN dbo.CaseFiles cf ON cf.ClaimId = c.ClaimId AND cf.IsDeleted = 0
                GROUP BY
                    p.ProviderId,
                    p.ProviderName,
                    p.ProviderType,
                    p.State,
                    p.RiskTier;
                """);

            migrationBuilder.Sql("""
                CREATE OR ALTER VIEW dbo.vw_CaseAging
                AS
                SELECT
                    Status,
                    Days0To15 = SUM(CASE WHEN DATEDIFF(day, CreatedDate, COALESCE(ClosedDate, SYSUTCDATETIME())) BETWEEN 0 AND 15 THEN 1 ELSE 0 END),
                    Days16To30 = SUM(CASE WHEN DATEDIFF(day, CreatedDate, COALESCE(ClosedDate, SYSUTCDATETIME())) BETWEEN 16 AND 30 THEN 1 ELSE 0 END),
                    Days31To60 = SUM(CASE WHEN DATEDIFF(day, CreatedDate, COALESCE(ClosedDate, SYSUTCDATETIME())) BETWEEN 31 AND 60 THEN 1 ELSE 0 END),
                    Days61Plus = SUM(CASE WHEN DATEDIFF(day, CreatedDate, COALESCE(ClosedDate, SYSUTCDATETIME())) >= 61 THEN 1 ELSE 0 END),
                    TotalCases = COUNT_BIG(*)
                FROM dbo.CaseFiles
                WHERE IsDeleted = 0
                GROUP BY Status;
                """);

            migrationBuilder.Sql("""
                CREATE OR ALTER VIEW dbo.vw_QuestionedCostByMonth
                AS
                SELECT
                    MonthStart = DATEFROMPARTS(YEAR(c.ServiceDate), MONTH(c.ServiceDate), 1),
                    TotalPaidAmount = CAST(SUM(c.PaidAmount) AS decimal(18,2)),
                    EstimatedQuestionedCost = CAST(ISNULL(SUM(cf.EstimatedQuestionedCost), 0) AS decimal(18,2)),
                    HighRiskClaimCount = SUM(CASE WHEN cf.RiskLevel IN (N'High', N'Critical') THEN 1 ELSE 0 END),
                    CaseCount = COUNT(cf.CaseId)
                FROM dbo.Claims c
                LEFT JOIN dbo.CaseFiles cf ON cf.ClaimId = c.ClaimId AND cf.IsDeleted = 0
                GROUP BY DATEFROMPARTS(YEAR(c.ServiceDate), MONTH(c.ServiceDate), 1);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE OR ALTER VIEW dbo.vw_DashboardSummary
                AS
                SELECT
                    TotalClaimsReviewed = CAST((SELECT COUNT_BIG(*) FROM dbo.Claims) AS int),
                    HighRiskClaims = CAST((SELECT COUNT_BIG(*) FROM dbo.CaseFiles WHERE RiskLevel = N'High') AS int),
                    CriticalRiskClaims = CAST((SELECT COUNT_BIG(*) FROM dbo.CaseFiles WHERE RiskLevel = N'Critical') AS int),
                    EstimatedQuestionedCost = CAST(ISNULL((SELECT SUM(EstimatedQuestionedCost) FROM dbo.CaseFiles), 0) AS decimal(18,2)),
                    DuplicatePaymentCandidates = CAST((SELECT COUNT_BIG(*) FROM dbo.Claims) AS int),
                    ProvidersWithAbnormalPatterns = CAST(0 AS int),
                    OpenCases = CAST((SELECT COUNT_BIG(*) FROM dbo.CaseFiles WHERE Status <> N'Closed') AS int),
                    AverageCaseAgeDays = CAST(0 AS decimal(18,1));
                """);

            migrationBuilder.Sql("""
                CREATE OR ALTER VIEW dbo.vw_ProviderRiskSummary
                AS
                SELECT
                    p.ProviderId,
                    p.ProviderName,
                    p.ProviderType,
                    p.State,
                    p.RiskTier,
                    ClaimCount = COUNT(c.ClaimId),
                    TotalPaidAmount = CAST(ISNULL(SUM(c.PaidAmount), 0) AS decimal(18,2)),
                    HighRiskClaimCount = SUM(CASE WHEN cf.RiskLevel = N'High' THEN 1 ELSE 0 END),
                    CriticalRiskClaimCount = SUM(CASE WHEN cf.RiskLevel = N'Critical' THEN 1 ELSE 0 END),
                    EstimatedQuestionedCost = CAST(ISNULL(SUM(cf.EstimatedQuestionedCost), 0) AS decimal(18,2)),
                    AverageRiskScore = CAST(ISNULL(AVG(CAST(cf.RiskScore AS decimal(18,2))), 0) AS decimal(18,1))
                FROM dbo.Providers p
                LEFT JOIN dbo.Claims c ON c.ProviderId = p.ProviderId
                LEFT JOIN dbo.CaseFiles cf ON cf.ClaimId = c.ClaimId
                GROUP BY
                    p.ProviderId,
                    p.ProviderName,
                    p.ProviderType,
                    p.State,
                    p.RiskTier;
                """);

            migrationBuilder.Sql("""
                CREATE OR ALTER VIEW dbo.vw_CaseAging
                AS
                SELECT
                    Status,
                    Days0To15 = SUM(CASE WHEN DATEDIFF(day, CreatedDate, COALESCE(ClosedDate, SYSUTCDATETIME())) BETWEEN 0 AND 15 THEN 1 ELSE 0 END),
                    Days16To30 = SUM(CASE WHEN DATEDIFF(day, CreatedDate, COALESCE(ClosedDate, SYSUTCDATETIME())) BETWEEN 16 AND 30 THEN 1 ELSE 0 END),
                    Days31To60 = SUM(CASE WHEN DATEDIFF(day, CreatedDate, COALESCE(ClosedDate, SYSUTCDATETIME())) BETWEEN 31 AND 60 THEN 1 ELSE 0 END),
                    Days61Plus = SUM(CASE WHEN DATEDIFF(day, CreatedDate, COALESCE(ClosedDate, SYSUTCDATETIME())) >= 61 THEN 1 ELSE 0 END),
                    TotalCases = COUNT_BIG(*)
                FROM dbo.CaseFiles
                GROUP BY Status;
                """);

            migrationBuilder.Sql("""
                CREATE OR ALTER VIEW dbo.vw_QuestionedCostByMonth
                AS
                SELECT
                    MonthStart = DATEFROMPARTS(YEAR(c.ServiceDate), MONTH(c.ServiceDate), 1),
                    TotalPaidAmount = CAST(SUM(c.PaidAmount) AS decimal(18,2)),
                    EstimatedQuestionedCost = CAST(ISNULL(SUM(cf.EstimatedQuestionedCost), 0) AS decimal(18,2)),
                    HighRiskClaimCount = SUM(CASE WHEN cf.RiskLevel IN (N'High', N'Critical') THEN 1 ELSE 0 END),
                    CaseCount = COUNT(cf.CaseId)
                FROM dbo.Claims c
                LEFT JOIN dbo.CaseFiles cf ON cf.ClaimId = c.ClaimId
                GROUP BY DATEFROMPARTS(YEAR(c.ServiceDate), MONTH(c.ServiceDate), 1);
                """);

            migrationBuilder.DropIndex(
                name: "IX_CaseFiles_DeletedAt",
                table: "CaseFiles");

            migrationBuilder.DropIndex(
                name: "IX_CaseFiles_IsDeleted_Status_RiskLevel_RiskScore",
                table: "CaseFiles");

            migrationBuilder.DropColumn(
                name: "DeleteReason",
                table: "CaseFiles");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "CaseFiles");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "CaseFiles");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "CaseFiles");
        }
    }
}
