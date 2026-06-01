CREATE OR ALTER PROCEDURE dbo.sp_GetRiskQueue
    @RiskLevel nvarchar(50) = NULL,
    @Status nvarchar(50) = NULL,
    @FromDate date = NULL,
    @ToDate date = NULL,
    @ProviderType nvarchar(100) = NULL,
    @Search nvarchar(200) = NULL,
    @Page int = 1,
    @PageSize int = 25
AS
BEGIN
    SET NOCOUNT ON;

    IF @Page < 1 SET @Page = 1;
    IF @PageSize < 1 SET @PageSize = 25;
    IF @PageSize > 200 SET @PageSize = 200;

    WITH Filtered AS
    (
        SELECT
            cf.CaseId,
            c.ClaimId,
            p.ProviderName,
            p.ProviderType,
            c.ProcedureCode,
            c.ServiceDate,
            c.PaidAmount,
            cf.RiskScore,
            cf.RiskLevel,
            RiskFlags = COALESCE(flags.RiskFlags, N''),
            cf.EstimatedQuestionedCost,
            cf.Status
        FROM dbo.CaseFiles cf
        INNER JOIN dbo.Claims c ON c.ClaimId = cf.ClaimId
        INNER JOIN dbo.Providers p ON p.ProviderId = c.ProviderId
        OUTER APPLY
        (
            SELECT STRING_AGG(CONVERT(nvarchar(max), rr.RuleName), N'; ') WITHIN GROUP (ORDER BY rr.RuleName) AS RiskFlags
            FROM dbo.RiskFindings rf
            INNER JOIN dbo.RiskRules rr ON rr.RiskRuleId = rf.RiskRuleId
            WHERE rf.ClaimId = c.ClaimId
        ) flags
        WHERE (@RiskLevel IS NULL OR cf.RiskLevel = @RiskLevel)
          AND (@Status IS NULL OR cf.Status = @Status)
          AND (@FromDate IS NULL OR c.ServiceDate >= @FromDate)
          AND (@ToDate IS NULL OR c.ServiceDate <= @ToDate)
          AND (@ProviderType IS NULL OR p.ProviderType = @ProviderType)
          AND (@Search IS NULL OR p.ProviderName LIKE N'%' + @Search + N'%')
    )
    SELECT
        TotalCount = COUNT(1) OVER (),
        CaseId,
        ClaimId,
        ProviderName,
        ProviderType,
        ProcedureCode,
        ServiceDate,
        PaidAmount,
        RiskScore,
        RiskLevel,
        RiskFlags,
        EstimatedQuestionedCost,
        Status
    FROM Filtered
    ORDER BY RiskScore DESC, EstimatedQuestionedCost DESC, CaseId
    OFFSET (@Page - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO
