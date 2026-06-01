namespace VAOIG.FwaRiskTriage.Application.ReferenceData;

public sealed record StateTerritoryDto(string Code, string Name, string Type);

public sealed record ProviderDto(
    int ProviderId,
    string ProviderName,
    string Npi,
    string ProviderType,
    string State,
    string RiskTier,
    bool IsEnabled);

public sealed record UpsertProviderRequest(
    string ProviderName,
    string Npi,
    string ProviderType,
    string State,
    string RiskTier,
    bool IsEnabled);

public sealed record ProcedureCodeDto(
    int ProcedureCodeId,
    string Code,
    string Description,
    string Category,
    decimal? DefaultAmount,
    bool IsEnabled);

public sealed record UpsertProcedureCodeRequest(
    string Code,
    string Description,
    string Category,
    decimal? DefaultAmount,
    bool IsEnabled);
