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
GO
