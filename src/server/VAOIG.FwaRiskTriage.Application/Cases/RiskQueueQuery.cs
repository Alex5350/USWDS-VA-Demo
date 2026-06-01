namespace VAOIG.FwaRiskTriage.Application.Cases;

public sealed record RiskQueueQuery(
    string? RiskLevel,
    string? Status,
    DateOnly? FromDate,
    DateOnly? ToDate,
    string? ProviderType,
    string? Search,
    string? SortDirection = "riskScoreDesc",
    int Page = 1,
    int PageSize = 25);
