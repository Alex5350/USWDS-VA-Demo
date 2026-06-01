using VAOIG.FwaRiskTriage.Application.Common;

namespace VAOIG.FwaRiskTriage.Application.Cases;

public sealed class CaseWorkflowService(ICaseRepository repository, IClock clock)
{
    public async Task<CaseNoteDto> AddNoteAsync(int caseId, string noteText, string createdBy, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(noteText))
        {
            throw new ArgumentException("Case note text is required.", nameof(noteText));
        }

        var status = await repository.GetCaseStatusAsync(caseId, cancellationToken);
        if (status is null)
        {
            throw new KeyNotFoundException($"Case {caseId} was not found.");
        }

        if (string.Equals(status, "Closed", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Closed cases cannot be edited unless reopened.");
        }

        return await repository.AddNoteAsync(caseId, noteText.Trim(), createdBy, clock.UtcNow, cancellationToken);
    }

    public async Task<bool> UpdateStatusAsync(int caseId, string nextStatus, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(nextStatus))
        {
            throw new ArgumentException("Case status is required.", nameof(nextStatus));
        }

        var currentStatus = await repository.GetCaseStatusAsync(caseId, cancellationToken);
        if (currentStatus is null)
        {
            throw new KeyNotFoundException($"Case {caseId} was not found.");
        }

        if (string.Equals(currentStatus, "Closed", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(nextStatus, "Reopened", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Closed cases cannot be edited unless reopened.");
        }

        return await repository.UpdateStatusAsync(caseId, nextStatus.Trim(), clock.UtcNow, cancellationToken);
    }
}
