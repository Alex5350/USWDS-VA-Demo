using VAOIG.FwaRiskTriage.Application.Cases;
using VAOIG.FwaRiskTriage.Application.Common;
using VAOIG.FwaRiskTriage.Application.RiskScoring;

namespace VAOIG.FwaRiskTriage.Tests;

public sealed class CaseWorkflowTests
{
    [Fact]
    public async Task CaseStatusCanMoveFromNewToUnderReview()
    {
        var repository = new FakeCaseRepository("New");
        var service = new CaseWorkflowService(repository, new FixedClock());

        var changed = await service.UpdateStatusAsync(1001, "UnderReview", CancellationToken.None);

        Assert.True(changed);
        Assert.Equal("UnderReview", repository.Status);
    }

    [Fact]
    public async Task CaseStatusCanMoveFromUnderReviewToReferred()
    {
        var repository = new FakeCaseRepository("UnderReview");
        var service = new CaseWorkflowService(repository, new FixedClock());

        var changed = await service.UpdateStatusAsync(1001, "Referred", CancellationToken.None);

        Assert.True(changed);
        Assert.Equal("Referred", repository.Status);
    }

    [Fact]
    public async Task ClosedCaseCannotBeEditedUnlessReopened()
    {
        var repository = new FakeCaseRepository("Closed");
        var service = new CaseWorkflowService(repository, new FixedClock());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.AddNoteAsync(1001, "Review note", "Demo Analyst", CancellationToken.None));
    }

    private sealed class FixedClock : IClock
    {
        public DateTime UtcNow { get; } = new(2026, 5, 31, 12, 0, 0, DateTimeKind.Utc);
    }

    private sealed class FakeCaseRepository(string status) : ICaseRepository
    {
        public string Status { get; private set; } = status;

        public Task<CaseDetailDto?> GetCaseDetailAsync(int caseId, CancellationToken cancellationToken) => Task.FromResult<CaseDetailDto?>(null);

        public Task<IReadOnlyList<DeletedCaseRecordDto>> GetDeletedCaseRecordsAsync(string? deletedByScope, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<DeletedCaseRecordDto>>([]);

        public Task<CaseNoteDto> AddNoteAsync(int caseId, string noteText, string createdBy, DateTime createdDate, CancellationToken cancellationToken) =>
            Task.FromResult(new CaseNoteDto(1, caseId, createdBy, createdDate, noteText));

        public Task<CaseDetailDto?> UpdateCaseRecordAsync(
            int caseId,
            UpdateCaseRecordRequest request,
            DateTime changedAt,
            CancellationToken cancellationToken) =>
            Task.FromResult<CaseDetailDto?>(null);

        public Task<bool> SoftDeleteCaseRecordAsync(
            int caseId,
            string deletedBy,
            DateTime deletedAt,
            string? reason,
            CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<bool> RestoreCaseRecordAsync(int caseId, string? deletedByScope, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<bool> UpdateStatusAsync(int caseId, string status, DateTime changedAt, CancellationToken cancellationToken)
        {
            Status = status;
            return Task.FromResult(true);
        }

        public Task<bool> EscalateAsync(int caseId, DateTime changedAt, CancellationToken cancellationToken)
        {
            Status = "Escalated";
            return Task.FromResult(true);
        }

        public Task<bool> DeEscalateAsync(int caseId, DateTime changedAt, CancellationToken cancellationToken)
        {
            Status = "UnderReview";
            return Task.FromResult(true);
        }

        public Task<CreateCaseRecordResponse> CreateCaseRecordAsync(
            CreateCaseRecordRequest request,
            string createdBy,
            DateTime createdAt,
            CancellationToken cancellationToken) =>
            Task.FromResult(new CreateCaseRecordResponse(1, 1, 80, "Critical", "New"));

        public Task<IReadOnlyList<RiskRuleDto>> GetRulesAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<RiskRuleDto>>([]);

        public Task<RiskRuleDto?> UpdateRuleAsync(int riskRuleId, int weight, bool isEnabled, CancellationToken cancellationToken) =>
            Task.FromResult<RiskRuleDto?>(null);

        public Task<string?> GetCaseStatusAsync(int caseId, CancellationToken cancellationToken) =>
            Task.FromResult<string?>(Status);
    }
}
