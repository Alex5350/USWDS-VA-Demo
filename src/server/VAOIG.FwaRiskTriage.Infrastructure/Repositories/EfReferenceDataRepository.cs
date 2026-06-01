using Microsoft.EntityFrameworkCore;
using VAOIG.FwaRiskTriage.Application.ReferenceData;
using VAOIG.FwaRiskTriage.Domain.Entities;
using VAOIG.FwaRiskTriage.Infrastructure.Data;

namespace VAOIG.FwaRiskTriage.Infrastructure.Repositories;

public sealed class EfReferenceDataRepository(FwaRiskTriageDbContext dbContext) : IReferenceDataRepository
{
    public async Task<IReadOnlyList<StateTerritoryDto>> GetStatesAsync(CancellationToken cancellationToken) =>
        await dbContext.StateTerritories.AsNoTracking()
            .Where(x => x.IsEnabled)
            .OrderBy(x => x.Type)
            .ThenBy(x => x.Name)
            .Select(x => new StateTerritoryDto(x.Code, x.Name, x.Type))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<ProviderDto>> GetProvidersAsync(string? search, bool activeOnly, CancellationToken cancellationToken)
    {
        var query = dbContext.Providers.AsNoTracking();
        if (activeOnly)
        {
            query = query.Where(x => x.IsEnabled);
        }

        var normalizedSearch = search?.Trim();
        if (!string.IsNullOrWhiteSpace(normalizedSearch))
        {
            query = query.Where(x =>
                x.ProviderName.Contains(normalizedSearch)
                || x.ProviderType.Contains(normalizedSearch)
                || x.State.Contains(normalizedSearch)
                || x.Npi.Contains(normalizedSearch));
        }

        return await query
            .OrderBy(x => x.ProviderName)
            .ThenBy(x => x.State)
            .Take(200)
            .Select(x => ToDto(x))
            .ToListAsync(cancellationToken);
    }

    public async Task<ProviderDto> AddProviderAsync(UpsertProviderRequest request, string actorEmail, DateTime changedAt, CancellationToken cancellationToken)
    {
        var provider = new Provider
        {
            ProviderName = NormalizeRequired(request.ProviderName),
            Npi = NormalizeRequired(request.Npi),
            ProviderType = NormalizeRequired(request.ProviderType),
            State = NormalizeState(request.State),
            RiskTier = NormalizeRequired(request.RiskTier),
            IsEnabled = request.IsEnabled,
            CreatedAt = changedAt,
            UpdatedAt = changedAt,
            UpdatedBy = actorEmail
        };

        dbContext.Providers.Add(provider);
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToDto(provider);
    }

    public async Task<ProviderDto?> UpdateProviderAsync(int providerId, UpsertProviderRequest request, string actorEmail, DateTime changedAt, CancellationToken cancellationToken)
    {
        var provider = await dbContext.Providers.FirstOrDefaultAsync(x => x.ProviderId == providerId, cancellationToken);
        if (provider is null)
        {
            return null;
        }

        provider.ProviderName = NormalizeRequired(request.ProviderName);
        provider.Npi = NormalizeRequired(request.Npi);
        provider.ProviderType = NormalizeRequired(request.ProviderType);
        provider.State = NormalizeState(request.State);
        provider.RiskTier = NormalizeRequired(request.RiskTier);
        provider.IsEnabled = request.IsEnabled;
        provider.UpdatedAt = changedAt;
        provider.UpdatedBy = actorEmail;

        await dbContext.SaveChangesAsync(cancellationToken);
        return ToDto(provider);
    }

    public async Task<IReadOnlyList<ProcedureCodeDto>> GetProcedureCodesAsync(string? search, bool activeOnly, CancellationToken cancellationToken)
    {
        var query = dbContext.ProcedureCodes.AsNoTracking();
        if (activeOnly)
        {
            query = query.Where(x => x.IsEnabled);
        }

        var normalizedSearch = search?.Trim();
        if (!string.IsNullOrWhiteSpace(normalizedSearch))
        {
            query = query.Where(x =>
                x.Code.Contains(normalizedSearch)
                || x.Description.Contains(normalizedSearch)
                || x.Category.Contains(normalizedSearch));
        }

        return await query
            .OrderBy(x => x.Category)
            .ThenBy(x => x.Code)
            .Take(200)
            .Select(x => ToDto(x))
            .ToListAsync(cancellationToken);
    }

    public async Task<ProcedureCodeDto> AddProcedureCodeAsync(UpsertProcedureCodeRequest request, string actorEmail, DateTime changedAt, CancellationToken cancellationToken)
    {
        var procedureCode = new ProcedureCode
        {
            Code = NormalizeRequired(request.Code).ToUpperInvariant(),
            Description = NormalizeRequired(request.Description),
            Category = NormalizeRequired(request.Category),
            DefaultAmount = request.DefaultAmount,
            IsEnabled = request.IsEnabled,
            CreatedAt = changedAt,
            UpdatedAt = changedAt,
            UpdatedBy = actorEmail
        };

        dbContext.ProcedureCodes.Add(procedureCode);
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToDto(procedureCode);
    }

    public async Task<ProcedureCodeDto?> UpdateProcedureCodeAsync(int procedureCodeId, UpsertProcedureCodeRequest request, string actorEmail, DateTime changedAt, CancellationToken cancellationToken)
    {
        var procedureCode = await dbContext.ProcedureCodes.FirstOrDefaultAsync(x => x.ProcedureCodeId == procedureCodeId, cancellationToken);
        if (procedureCode is null)
        {
            return null;
        }

        procedureCode.Code = NormalizeRequired(request.Code).ToUpperInvariant();
        procedureCode.Description = NormalizeRequired(request.Description);
        procedureCode.Category = NormalizeRequired(request.Category);
        procedureCode.DefaultAmount = request.DefaultAmount;
        procedureCode.IsEnabled = request.IsEnabled;
        procedureCode.UpdatedAt = changedAt;
        procedureCode.UpdatedBy = actorEmail;

        await dbContext.SaveChangesAsync(cancellationToken);
        return ToDto(procedureCode);
    }

    private static ProviderDto ToDto(Provider provider) => new(
        provider.ProviderId,
        provider.ProviderName,
        provider.Npi,
        provider.ProviderType,
        provider.State,
        provider.RiskTier,
        provider.IsEnabled);

    private static ProcedureCodeDto ToDto(ProcedureCode procedureCode) => new(
        procedureCode.ProcedureCodeId,
        procedureCode.Code,
        procedureCode.Description,
        procedureCode.Category,
        procedureCode.DefaultAmount,
        procedureCode.IsEnabled);

    private static string NormalizeRequired(string value)
    {
        var normalized = value.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new ArgumentException("Required reference data fields cannot be blank.");
        }

        return normalized;
    }

    private static string NormalizeState(string state)
    {
        var normalized = NormalizeRequired(state).ToUpperInvariant();
        if (normalized.Length != 2)
        {
            throw new ArgumentException("State or territory code must be two characters.");
        }

        return normalized;
    }
}
