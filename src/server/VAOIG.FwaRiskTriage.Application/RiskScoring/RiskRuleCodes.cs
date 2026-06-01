namespace VAOIG.FwaRiskTriage.Application.RiskScoring;

public static class RiskRuleCodes
{
    public const string DuplicateClaim = "DUPLICATE_CLAIM";
    public const string MissingAuthorization = "MISSING_AUTHORIZATION";
    public const string ExpiredAuthorization = "EXPIRED_AUTHORIZATION";
    public const string HighDollarOutlier = "HIGH_DOLLAR_OUTLIER";
    public const string HotlineMatch = "HOTLINE_MATCH";
    public const string ServiceAfterDeathDate = "SERVICE_AFTER_DEATH_DATE";
    public const string ProviderRepeatPattern = "PROVIDER_REPEAT_PATTERN";
    public const string PriorCaseHistory = "PRIOR_CASE_HISTORY";
    public const string RapidResubmission = "RAPID_RESUBMISSION";
}
