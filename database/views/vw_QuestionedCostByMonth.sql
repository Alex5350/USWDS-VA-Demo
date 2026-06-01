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
GO
