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
GO
