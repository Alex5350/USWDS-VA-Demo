CREATE OR ALTER PROCEDURE dbo.sp_GetProviderRiskReport
    @State nvarchar(2) = NULL,
    @ProviderType nvarchar(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ProviderId,
        ProviderName,
        ProviderType,
        State,
        RiskTier,
        ClaimCount,
        TotalPaidAmount,
        HighRiskClaimCount,
        CriticalRiskClaimCount,
        EstimatedQuestionedCost,
        AverageRiskScore
    FROM dbo.vw_ProviderRiskSummary
    WHERE (@State IS NULL OR State = @State)
      AND (@ProviderType IS NULL OR ProviderType = @ProviderType)
    ORDER BY EstimatedQuestionedCost DESC, AverageRiskScore DESC, ProviderName;
END;
GO
