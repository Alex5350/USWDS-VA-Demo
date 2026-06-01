namespace VAOIG.FwaRiskTriage.Application.ReferenceData;

public interface IReferenceDataRepository
{
    Task<IReadOnlyList<StateTerritoryDto>> GetStatesAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<ProviderDto>> GetProvidersAsync(string? search, bool activeOnly, CancellationToken cancellationToken);
    Task<ProviderDto> AddProviderAsync(UpsertProviderRequest request, string actorEmail, DateTime changedAt, CancellationToken cancellationToken);
    Task<ProviderDto?> UpdateProviderAsync(int providerId, UpsertProviderRequest request, string actorEmail, DateTime changedAt, CancellationToken cancellationToken);
    Task<IReadOnlyList<ProcedureCodeDto>> GetProcedureCodesAsync(string? search, bool activeOnly, CancellationToken cancellationToken);
    Task<ProcedureCodeDto> AddProcedureCodeAsync(UpsertProcedureCodeRequest request, string actorEmail, DateTime changedAt, CancellationToken cancellationToken);
    Task<ProcedureCodeDto?> UpdateProcedureCodeAsync(int procedureCodeId, UpsertProcedureCodeRequest request, string actorEmail, DateTime changedAt, CancellationToken cancellationToken);
}
