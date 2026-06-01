SET NOCOUNT ON;

DELETE FROM dbo.DemoUserPermissionOverrides;
DELETE FROM dbo.AuditEvents;
DELETE FROM dbo.CaseNotes;
DELETE FROM dbo.CaseFiles;
DELETE FROM dbo.RiskFindings;
DELETE FROM dbo.HotlineComplaints;
DELETE FROM dbo.Claims;
DELETE FROM dbo.Authorizations;
DELETE FROM dbo.RiskRules;
DELETE FROM dbo.Providers;
DELETE FROM dbo.VeteranProfiles;
DELETE FROM dbo.ProcedureCodes;
DELETE FROM dbo.StateTerritories;

DBCC CHECKIDENT ('dbo.DemoUserPermissionOverrides', RESEED, 1);
DBCC CHECKIDENT ('dbo.AuditEvents', RESEED, 1);
DBCC CHECKIDENT ('dbo.CaseNotes', RESEED, 1);
DBCC CHECKIDENT ('dbo.CaseFiles', RESEED, 1);
DBCC CHECKIDENT ('dbo.RiskFindings', RESEED, 1);
DBCC CHECKIDENT ('dbo.HotlineComplaints', RESEED, 1);
DBCC CHECKIDENT ('dbo.Claims', RESEED, 1);
DBCC CHECKIDENT ('dbo.Authorizations', RESEED, 1);
DBCC CHECKIDENT ('dbo.RiskRules', RESEED, 1);
DBCC CHECKIDENT ('dbo.Providers', RESEED, 1);
DBCC CHECKIDENT ('dbo.VeteranProfiles', RESEED, 1);
DBCC CHECKIDENT ('dbo.ProcedureCodes', RESEED, 1);

DECLARE @AsOfDate date = '2026-05-31';

INSERT INTO dbo.StateTerritories (Code, Name, Type, IsEnabled)
VALUES
    (N'AL', N'Alabama', N'State', 1),
    (N'AK', N'Alaska', N'State', 1),
    (N'AZ', N'Arizona', N'State', 1),
    (N'AR', N'Arkansas', N'State', 1),
    (N'CA', N'California', N'State', 1),
    (N'CO', N'Colorado', N'State', 1),
    (N'CT', N'Connecticut', N'State', 1),
    (N'DE', N'Delaware', N'State', 1),
    (N'DC', N'District of Columbia', N'District', 1),
    (N'FL', N'Florida', N'State', 1),
    (N'GA', N'Georgia', N'State', 1),
    (N'HI', N'Hawaii', N'State', 1),
    (N'ID', N'Idaho', N'State', 1),
    (N'IL', N'Illinois', N'State', 1),
    (N'IN', N'Indiana', N'State', 1),
    (N'IA', N'Iowa', N'State', 1),
    (N'KS', N'Kansas', N'State', 1),
    (N'KY', N'Kentucky', N'State', 1),
    (N'LA', N'Louisiana', N'State', 1),
    (N'ME', N'Maine', N'State', 1),
    (N'MD', N'Maryland', N'State', 1),
    (N'MA', N'Massachusetts', N'State', 1),
    (N'MI', N'Michigan', N'State', 1),
    (N'MN', N'Minnesota', N'State', 1),
    (N'MS', N'Mississippi', N'State', 1),
    (N'MO', N'Missouri', N'State', 1),
    (N'MT', N'Montana', N'State', 1),
    (N'NE', N'Nebraska', N'State', 1),
    (N'NV', N'Nevada', N'State', 1),
    (N'NH', N'New Hampshire', N'State', 1),
    (N'NJ', N'New Jersey', N'State', 1),
    (N'NM', N'New Mexico', N'State', 1),
    (N'NY', N'New York', N'State', 1),
    (N'NC', N'North Carolina', N'State', 1),
    (N'ND', N'North Dakota', N'State', 1),
    (N'OH', N'Ohio', N'State', 1),
    (N'OK', N'Oklahoma', N'State', 1),
    (N'OR', N'Oregon', N'State', 1),
    (N'PA', N'Pennsylvania', N'State', 1),
    (N'RI', N'Rhode Island', N'State', 1),
    (N'SC', N'South Carolina', N'State', 1),
    (N'SD', N'South Dakota', N'State', 1),
    (N'TN', N'Tennessee', N'State', 1),
    (N'TX', N'Texas', N'State', 1),
    (N'UT', N'Utah', N'State', 1),
    (N'VT', N'Vermont', N'State', 1),
    (N'VA', N'Virginia', N'State', 1),
    (N'WA', N'Washington', N'State', 1),
    (N'WV', N'West Virginia', N'State', 1),
    (N'WI', N'Wisconsin', N'State', 1),
    (N'WY', N'Wyoming', N'State', 1),
    (N'AS', N'American Samoa', N'Territory', 1),
    (N'GU', N'Guam', N'Territory', 1),
    (N'MP', N'Northern Mariana Islands', N'Territory', 1),
    (N'PR', N'Puerto Rico', N'Territory', 1),
    (N'VI', N'U.S. Virgin Islands', N'Territory', 1),
    (N'UM', N'U.S. Minor Outlying Islands', N'Territory', 1);

INSERT INTO dbo.ProcedureCodes (Code, Description, Category, DefaultAmount, IsEnabled)
VALUES
    (N'D2740', N'Crown - porcelain or ceramic substrate', N'Dental', 1850.00, 1),
    (N'97110', N'Therapeutic exercise service, each 15 minutes', N'Physical Therapy', 325.00, 1),
    (N'73721', N'MRI lower extremity joint without contrast material', N'Imaging', 1400.00, 1),
    (N'G0151', N'Home health physical therapy visit', N'Home Health', 290.00, 1),
    (N'E1390', N'Oxygen concentrator equipment rental', N'Durable Medical Equipment', 850.00, 1),
    (N'99213', N'Established patient office visit, low complexity', N'Clinical Visit', 210.00, 1),
    (N'98940', N'Chiropractic manipulative treatment, one to two regions', N'Chiropractic', 160.00, 1),
    (N'A0428', N'Non-emergency ambulance transport, basic life support', N'Transportation', 975.00, 1),
    (N'J3490', N'Unclassified drug for community care billing review', N'Pharmacy', 640.00, 1),
    (N'L1833', N'Knee orthosis adjustable joint prefabricated item', N'Durable Medical Equipment', 1125.00, 1),
    (N'92507', N'Speech, language, voice, communication treatment', N'Therapy', 275.00, 1),
    (N'T1019', N'Personal care services, per 15 minutes', N'Home Health', 70.00, 1);

INSERT INTO dbo.RiskRules (RuleCode, RuleName, Description, Weight, IsEnabled)
VALUES
    (N'DUPLICATE_CLAIM', N'Duplicate claim candidate', N'Same synthetic veteran, provider, procedure, service date, and paid amount appears more than once.', 25, 1),
    (N'MISSING_AUTHORIZATION', N'Missing authorization', N'Claim does not have a linked Community Care authorization record.', 25, 1),
    (N'EXPIRED_AUTHORIZATION', N'Expired authorization', N'Claim service date is after the linked authorization end date.', 20, 1),
    (N'HIGH_DOLLAR_OUTLIER', N'High-dollar outlier', N'Paid amount is materially higher than the normal synthetic procedure range.', 15, 1),
    (N'HOTLINE_MATCH', N'Hotline match', N'Claim is associated with a provider or anonymized veteran that has a related synthetic hotline complaint.', 20, 1),
    (N'SERVICE_AFTER_DEATH_DATE', N'Service after synthetic death date', N'Claim service date is after the synthetic date of death on the anonymized veteran profile.', 35, 1),
    (N'PROVIDER_REPEAT_PATTERN', N'Provider repeat pattern', N'Provider has an elevated count of similar paid claims in the synthetic period.', 15, 1),
    (N'PRIOR_CASE_HISTORY', N'Prior case history', N'Provider is in an elevated synthetic risk tier for prior review workload.', 10, 1),
    (N'RAPID_RESUBMISSION', N'Rapid resubmission', N'A similar claim appears shortly after another submission for the same synthetic veteran and provider.', 10, 1);

DECLARE @i int = 1;

WHILE @i <= 100
BEGIN
    INSERT INTO dbo.VeteranProfiles
    (
        AnonymizedIdentifier,
        DateOfBirth,
        DateOfDeath,
        State,
        VISN
    )
    VALUES
    (
        CONCAT(N'VET-DEMO-', RIGHT(CONCAT(N'00000', @i), 5)),
        DATEADD(day, -1 * (22000 + ((@i * 47) % 9000)), @AsOfDate),
        CASE
            WHEN @i = 7 THEN CAST('2026-02-15' AS date)
            WHEN @i = 28 THEN CAST('2026-03-10' AS date)
            WHEN @i = 63 THEN CAST('2026-01-20' AS date)
            ELSE NULL
        END,
        CASE @i % 12
            WHEN 0 THEN N'CA'
            WHEN 1 THEN N'TX'
            WHEN 2 THEN N'FL'
            WHEN 3 THEN N'NY'
            WHEN 4 THEN N'PA'
            WHEN 5 THEN N'OH'
            WHEN 6 THEN N'NC'
            WHEN 7 THEN N'GA'
            WHEN 8 THEN N'IL'
            WHEN 9 THEN N'AZ'
            WHEN 10 THEN N'CO'
            ELSE N'VA'
        END,
        CONCAT(N'VISN ', RIGHT(CONCAT(N'00', ((@i - 1) % 23) + 1), 2))
    );

    SET @i += 1;
END;

INSERT INTO dbo.Providers (ProviderName, NPI, ProviderType, State, RiskTier)
VALUES
    (N'Demo Community Dental Group', N'9000000001', N'Dental', N'VA', N'Elevated'),
    (N'Sample Regional Imaging LLC', N'9000000002', N'Imaging', N'MD', N'Elevated'),
    (N'Training Physical Therapy Partners', N'9000000003', N'Physical Therapy', N'NC', N'Medium'),
    (N'Example Home Health Services', N'9000000004', N'Home Health', N'PA', N'Medium'),
    (N'Synthetic Mobility Supply Co', N'9000000005', N'Durable Medical Equipment', N'OH', N'High');

SET @i = 6;
WHILE @i <= 35
BEGIN
    INSERT INTO dbo.Providers (ProviderName, NPI, ProviderType, State, RiskTier)
    VALUES
    (
        CONCAT(N'Demo Provider Network ', RIGHT(CONCAT(N'000', @i), 3)),
        CAST(9000000000 + @i AS nvarchar(20)),
        CASE @i % 7
            WHEN 0 THEN N'Dental'
            WHEN 1 THEN N'Imaging'
            WHEN 2 THEN N'Physical Therapy'
            WHEN 3 THEN N'Home Health'
            WHEN 4 THEN N'Durable Medical Equipment'
            WHEN 5 THEN N'Behavioral Health'
            ELSE N'Chiropractic'
        END,
        CASE @i % 10
            WHEN 0 THEN N'CA'
            WHEN 1 THEN N'TX'
            WHEN 2 THEN N'FL'
            WHEN 3 THEN N'NY'
            WHEN 4 THEN N'PA'
            WHEN 5 THEN N'OH'
            WHEN 6 THEN N'NC'
            WHEN 7 THEN N'GA'
            WHEN 8 THEN N'IL'
            ELSE N'AZ'
        END,
        CASE
            WHEN @i IN (8, 13, 21) THEN N'Elevated'
            WHEN @i IN (17, 29) THEN N'High'
            ELSE N'Standard'
        END
    );

    SET @i += 1;
END;

DECLARE @VeteranIdOffset int = (SELECT COALESCE(MIN(VeteranId), 1) - 1 FROM dbo.VeteranProfiles);
DECLARE @ProviderIdOffset int = (SELECT COALESCE(MIN(ProviderId), 1) - 1 FROM dbo.Providers);

SET @i = 1;
DECLARE @AuthorizationStart date;
DECLARE @AuthorizationEnd date;

WHILE @i <= 250
BEGIN
    SET @AuthorizationStart = DATEADD(day, -1 * (120 + (@i % 300)), @AsOfDate);
    SET @AuthorizationEnd = DATEADD(day, 90, @AuthorizationStart);

    INSERT INTO dbo.Authorizations
    (
        VeteranId,
        ProviderId,
        ProcedureCode,
        StartDate,
        EndDate,
        AuthorizedAmount,
        Status
    )
    VALUES
    (
        @VeteranIdOffset + (((@i - 1) % 100) + 1),
        @ProviderIdOffset + (((@i - 1) % 35) + 1),
        CASE @i % 8
            WHEN 0 THEN N'D2740'
            WHEN 1 THEN N'97110'
            WHEN 2 THEN N'73721'
            WHEN 3 THEN N'G0151'
            WHEN 4 THEN N'E1390'
            WHEN 5 THEN N'99213'
            WHEN 6 THEN N'98940'
            ELSE N'A0428'
        END,
        @AuthorizationStart,
        @AuthorizationEnd,
        CAST(600 + ((@i % 18) * 175) AS decimal(18,2)),
        CASE WHEN @i % 9 = 0 THEN N'Expired' ELSE N'Active' END
    );

    SET @i += 1;
END;

DECLARE @AuthorizationIdOffset int = (SELECT COALESCE(MIN(AuthorizationId), 1) - 1 FROM dbo.Authorizations);

SET @i = 1;
DECLARE @ClaimVeteranId int;
DECLARE @ClaimProviderId int;
DECLARE @ClaimAuthorizationId int;
DECLARE @ClaimProcedureCode nvarchar(20);
DECLARE @ClaimServiceDate date;
DECLARE @ClaimSubmittedDate date;
DECLARE @ClaimStatus nvarchar(50);
DECLARE @ClaimAmount decimal(18,2);
DECLARE @PaidAmount decimal(18,2);

WHILE @i <= 1500
BEGIN
    SET @ClaimVeteranId = @VeteranIdOffset + CASE WHEN @i % 97 = 0 THEN 7 ELSE ((@i - 1) % 100) + 1 END;
    SET @ClaimProviderId =
        @ProviderIdOffset +
        CASE
            WHEN @i <= 120 THEN 1
            WHEN @i <= 220 THEN 2
            ELSE ((@i - 1) % 35) + 1
        END;
    SET @ClaimAuthorizationId = CASE WHEN @i % 11 = 0 THEN NULL ELSE @AuthorizationIdOffset + (((@i - 1) % 250) + 1) END;

    SELECT @ClaimProcedureCode =
        COALESCE
        (
            (SELECT ProcedureCode FROM dbo.Authorizations WHERE AuthorizationId = @ClaimAuthorizationId),
            CASE @i % 8
                WHEN 0 THEN N'D2740'
                WHEN 1 THEN N'97110'
                WHEN 2 THEN N'73721'
                WHEN 3 THEN N'G0151'
                WHEN 4 THEN N'E1390'
                WHEN 5 THEN N'99213'
                WHEN 6 THEN N'98940'
                ELSE N'A0428'
            END
        );

    SET @ClaimServiceDate = DATEADD(day, -1 * (@i % 180), @AsOfDate);

    IF @i % 13 = 0 AND @ClaimAuthorizationId IS NOT NULL
    BEGIN
        SELECT @ClaimServiceDate = DATEADD(day, 10 + (@i % 11), EndDate)
        FROM dbo.Authorizations
        WHERE AuthorizationId = @ClaimAuthorizationId;
    END;

    IF @i % 97 = 0
    BEGIN
        SET @ClaimVeteranId = @VeteranIdOffset + 7;
        SET @ClaimServiceDate = '2026-04-15';
    END;

    SET @ClaimSubmittedDate = DATEADD(day, 1 + (@i % 9), @ClaimServiceDate);
    SET @ClaimStatus = CASE WHEN @i % 41 = 0 THEN N'Submitted' WHEN @i % 37 = 0 THEN N'Denied' ELSE N'Paid' END;
    SET @ClaimAmount =
        CASE @ClaimProcedureCode
            WHEN N'D2740' THEN 1850
            WHEN N'97110' THEN 325
            WHEN N'73721' THEN 1400
            WHEN N'G0151' THEN 290
            WHEN N'E1390' THEN 850
            WHEN N'99213' THEN 210
            WHEN N'98940' THEN 160
            ELSE 975
        END + ((@i % 12) * 22);
    SET @PaidAmount = CASE WHEN @i % 17 = 0 THEN 8200 + ((@i % 13) * 225) ELSE @ClaimAmount - ((@i % 5) * 15) END;

    INSERT INTO dbo.Claims
    (
        VeteranId,
        ProviderId,
        AuthorizationId,
        ProcedureCode,
        ServiceDate,
        SubmittedDate,
        PaidDate,
        ClaimAmount,
        PaidAmount,
        ClaimStatus
    )
    VALUES
    (
        @ClaimVeteranId,
        @ClaimProviderId,
        @ClaimAuthorizationId,
        @ClaimProcedureCode,
        @ClaimServiceDate,
        @ClaimSubmittedDate,
        CASE WHEN @ClaimStatus = N'Paid' THEN DATEADD(day, 5 + (@i % 6), @ClaimSubmittedDate) ELSE NULL END,
        @ClaimAmount,
        @PaidAmount,
        @ClaimStatus
    );

    SET @i += 1;
END;

DECLARE @ClaimIdOffset int = (SELECT COALESCE(MIN(ClaimId), 1) - 1 FROM dbo.Claims);

UPDATE target
SET
    VeteranId = source.VeteranId,
    ProviderId = source.ProviderId,
    AuthorizationId = source.AuthorizationId,
    ProcedureCode = source.ProcedureCode,
    ServiceDate = source.ServiceDate,
    SubmittedDate = DATEADD(day, 2, source.SubmittedDate),
    PaidDate = DATEADD(day, 7, source.SubmittedDate),
    ClaimAmount = source.ClaimAmount,
    PaidAmount = source.PaidAmount,
    ClaimStatus = N'Paid'
FROM dbo.Claims target
INNER JOIN dbo.Claims source ON source.ClaimId IN
(
    @ClaimIdOffset + 1,
    @ClaimIdOffset + 101,
    @ClaimIdOffset + 201,
    @ClaimIdOffset + 301,
    @ClaimIdOffset + 401,
    @ClaimIdOffset + 501
)
WHERE target.ClaimId = source.ClaimId + 1;

SET @i = 1;
WHILE @i <= 40
BEGIN
    INSERT INTO dbo.HotlineComplaints
    (
        ReceivedDate,
        ComplaintType,
        ProviderId,
        VeteranId,
        NarrativeSummary,
        Status
    )
    VALUES
    (
        DATEADD(day, -1 * (10 + (@i * 3)), @AsOfDate),
        CASE @i % 5
            WHEN 0 THEN N'Billing concern'
            WHEN 1 THEN N'Authorization concern'
            WHEN 2 THEN N'Duplicate payment concern'
            WHEN 3 THEN N'Provider pattern concern'
            ELSE N'Service date concern'
        END,
        CASE WHEN @i <= 24 THEN @ProviderIdOffset + (((@i - 1) % 8) + 1) ELSE @ProviderIdOffset + (((@i - 1) % 35) + 1) END,
        CASE WHEN @i % 4 = 0 THEN @VeteranIdOffset + (((@i - 1) % 100) + 1) ELSE NULL END,
        CONCAT(N'Synthetic hotline narrative ', @i, N' describing a potential risk indicator for analyst triage.'),
        CASE WHEN @i % 6 = 0 THEN N'Closed' ELSE N'Open' END
    );

    SET @i += 1;
END;

INSERT INTO dbo.RiskFindings (ClaimId, RiskRuleId, ScoreContribution, Explanation)
SELECT
    c.ClaimId,
    rr.RiskRuleId,
    rr.Weight,
    N'Potential duplicate payment candidate based on matching synthetic claim attributes.'
FROM dbo.Claims c
INNER JOIN dbo.RiskRules rr ON rr.RuleCode = N'DUPLICATE_CLAIM' AND rr.IsEnabled = 1
WHERE EXISTS
(
    SELECT 1
    FROM dbo.Claims d
    WHERE d.ClaimId <> c.ClaimId
      AND d.VeteranId = c.VeteranId
      AND d.ProviderId = c.ProviderId
      AND d.ProcedureCode = c.ProcedureCode
      AND d.ServiceDate = c.ServiceDate
      AND d.PaidAmount = c.PaidAmount
);

INSERT INTO dbo.RiskFindings (ClaimId, RiskRuleId, ScoreContribution, Explanation)
SELECT
    c.ClaimId,
    rr.RiskRuleId,
    rr.Weight,
    N'Claim is missing a linked synthetic authorization record.'
FROM dbo.Claims c
INNER JOIN dbo.RiskRules rr ON rr.RuleCode = N'MISSING_AUTHORIZATION' AND rr.IsEnabled = 1
WHERE c.AuthorizationId IS NULL;

INSERT INTO dbo.RiskFindings (ClaimId, RiskRuleId, ScoreContribution, Explanation)
SELECT
    c.ClaimId,
    rr.RiskRuleId,
    rr.Weight,
    N'Claim service date occurs after the linked synthetic authorization end date.'
FROM dbo.Claims c
INNER JOIN dbo.Authorizations a ON a.AuthorizationId = c.AuthorizationId
INNER JOIN dbo.RiskRules rr ON rr.RuleCode = N'EXPIRED_AUTHORIZATION' AND rr.IsEnabled = 1
WHERE c.ServiceDate > a.EndDate;

INSERT INTO dbo.RiskFindings (ClaimId, RiskRuleId, ScoreContribution, Explanation)
SELECT
    c.ClaimId,
    rr.RiskRuleId,
    rr.Weight,
    N'Paid amount is above the synthetic high-dollar threshold for triage.'
FROM dbo.Claims c
INNER JOIN dbo.RiskRules rr ON rr.RuleCode = N'HIGH_DOLLAR_OUTLIER' AND rr.IsEnabled = 1
WHERE c.PaidAmount >= 5000;

INSERT INTO dbo.RiskFindings (ClaimId, RiskRuleId, ScoreContribution, Explanation)
SELECT
    c.ClaimId,
    rr.RiskRuleId,
    rr.Weight,
    N'Provider or anonymized veteran appears in a related open synthetic hotline complaint.'
FROM dbo.Claims c
INNER JOIN dbo.RiskRules rr ON rr.RuleCode = N'HOTLINE_MATCH' AND rr.IsEnabled = 1
WHERE EXISTS
(
    SELECT 1
    FROM dbo.HotlineComplaints hc
    WHERE hc.Status = N'Open'
      AND (hc.ProviderId = c.ProviderId OR hc.VeteranId = c.VeteranId)
);

INSERT INTO dbo.RiskFindings (ClaimId, RiskRuleId, ScoreContribution, Explanation)
SELECT
    c.ClaimId,
    rr.RiskRuleId,
    rr.Weight,
    N'Claim service date is after the synthetic date of death on the anonymized profile.'
FROM dbo.Claims c
INNER JOIN dbo.VeteranProfiles v ON v.VeteranId = c.VeteranId
INNER JOIN dbo.RiskRules rr ON rr.RuleCode = N'SERVICE_AFTER_DEATH_DATE' AND rr.IsEnabled = 1
WHERE v.DateOfDeath IS NOT NULL
  AND c.ServiceDate > v.DateOfDeath;

INSERT INTO dbo.RiskFindings (ClaimId, RiskRuleId, ScoreContribution, Explanation)
SELECT
    c.ClaimId,
    rr.RiskRuleId,
    rr.Weight,
    N'Provider has a repeated synthetic billing pattern that is useful for triage prioritization.'
FROM dbo.Claims c
INNER JOIN dbo.RiskRules rr ON rr.RuleCode = N'PROVIDER_REPEAT_PATTERN' AND rr.IsEnabled = 1
WHERE c.ProviderId IN
(
    SELECT ProviderId
    FROM dbo.Claims
    GROUP BY ProviderId
    HAVING COUNT(*) >= 75
);

INSERT INTO dbo.RiskFindings (ClaimId, RiskRuleId, ScoreContribution, Explanation)
SELECT
    c.ClaimId,
    rr.RiskRuleId,
    rr.Weight,
    N'Provider is assigned an elevated synthetic review tier for demonstration.'
FROM dbo.Claims c
INNER JOIN dbo.Providers p ON p.ProviderId = c.ProviderId
INNER JOIN dbo.RiskRules rr ON rr.RuleCode = N'PRIOR_CASE_HISTORY' AND rr.IsEnabled = 1
WHERE p.RiskTier IN (N'Elevated', N'High')
  AND c.ClaimId % 5 = 0;

INSERT INTO dbo.RiskFindings (ClaimId, RiskRuleId, ScoreContribution, Explanation)
SELECT
    c.ClaimId,
    rr.RiskRuleId,
    rr.Weight,
    N'A similar claim was submitted within seven days, indicating a rapid resubmission pattern.'
FROM dbo.Claims c
INNER JOIN dbo.RiskRules rr ON rr.RuleCode = N'RAPID_RESUBMISSION' AND rr.IsEnabled = 1
WHERE EXISTS
(
    SELECT 1
    FROM dbo.Claims priorClaim
    WHERE priorClaim.ClaimId < c.ClaimId
      AND priorClaim.VeteranId = c.VeteranId
      AND priorClaim.ProviderId = c.ProviderId
      AND priorClaim.ProcedureCode = c.ProcedureCode
      AND ABS(DATEDIFF(day, priorClaim.SubmittedDate, c.SubmittedDate)) BETWEEN 1 AND 7
);

WITH RiskTotals AS
(
    SELECT
        c.ClaimId,
        c.PaidAmount,
        RiskScore = CASE WHEN SUM(rf.ScoreContribution) > 100 THEN 100 ELSE SUM(rf.ScoreContribution) END
    FROM dbo.Claims c
    INNER JOIN dbo.RiskFindings rf ON rf.ClaimId = c.ClaimId
    GROUP BY c.ClaimId, c.PaidAmount
),
Ranked AS
(
    SELECT TOP (100)
        RowNumber = ROW_NUMBER() OVER (ORDER BY RiskScore DESC, PaidAmount DESC, ClaimId),
        ClaimId,
        PaidAmount,
        RiskScore,
        RiskLevel = CASE
            WHEN RiskScore >= 80 THEN N'Critical'
            WHEN RiskScore >= 60 THEN N'High'
            WHEN RiskScore >= 30 THEN N'Medium'
            ELSE N'Low'
        END
    FROM RiskTotals
    ORDER BY RiskScore DESC, PaidAmount DESC, ClaimId
)
INSERT INTO dbo.CaseFiles
(
    ClaimId,
    AssignedTo,
    Status,
    Priority,
    RiskScore,
    RiskLevel,
    EstimatedQuestionedCost,
    CreatedDate,
    ClosedDate
)
SELECT
    ClaimId,
    CASE RowNumber % 5
        WHEN 0 THEN N'Demo Analyst'
        WHEN 1 THEN N'Demo Investigator'
        WHEN 2 THEN N'Demo Supervisor'
        WHEN 3 THEN N'Demo Analyst'
        ELSE NULL
    END,
    CASE
        WHEN RowNumber % 10 = 0 THEN N'Closed'
        WHEN RowNumber % 7 = 0 THEN N'Referred'
        WHEN RowNumber % 3 = 0 THEN N'UnderReview'
        ELSE N'New'
    END,
    CASE
        WHEN RiskLevel = N'Critical' THEN N'Critical'
        WHEN RiskLevel = N'High' THEN N'High'
        WHEN RiskLevel = N'Medium' THEN N'Routine'
        ELSE N'Low'
    END,
    RiskScore,
    RiskLevel,
    CAST(CASE WHEN RiskLevel IN (N'High', N'Critical') THEN PaidAmount ELSE PaidAmount * 0.35 END AS decimal(18,2)),
    DATEADD(day, -1 * (RowNumber % 70), @AsOfDate),
    CASE
        WHEN RowNumber % 10 = 0
            THEN DATEADD(day, -1 * CASE WHEN RowNumber % 70 <= 3 THEN 0 ELSE (RowNumber % 70) - 3 END, @AsOfDate)
        ELSE NULL
    END
FROM Ranked;

SET @i = 1;
DECLARE @CaseCount int = (SELECT COUNT(*) FROM dbo.CaseFiles);
DECLARE @CaseIdOffset int = (SELECT COALESCE(MIN(CaseId), 1) - 1 FROM dbo.CaseFiles);

WHILE @i <= 150 AND @CaseCount > 0
BEGIN
    INSERT INTO dbo.CaseNotes
    (
        CaseId,
        CreatedBy,
        CreatedDate,
        NoteText
    )
    VALUES
    (
        @CaseIdOffset + (((@i - 1) % @CaseCount) + 1),
        CASE @i % 4
            WHEN 0 THEN N'Demo Analyst'
            WHEN 1 THEN N'Demo Investigator'
            WHEN 2 THEN N'Demo Supervisor'
            ELSE N'Demo Analyst'
        END,
        DATEADD(hour, -1 * (6 + @i), SYSUTCDATETIME()),
        CONCAT(N'Synthetic case note ', @i, N': reviewed potential risk indicators for demonstration purposes only.')
    );

    SET @i += 1;
END;

SELECT
    Veterans = (SELECT COUNT(*) FROM dbo.VeteranProfiles),
    Providers = (SELECT COUNT(*) FROM dbo.Providers),
    Authorizations = (SELECT COUNT(*) FROM dbo.Authorizations),
    Claims = (SELECT COUNT(*) FROM dbo.Claims),
    HotlineComplaints = (SELECT COUNT(*) FROM dbo.HotlineComplaints),
    RiskRules = (SELECT COUNT(*) FROM dbo.RiskRules),
    RiskFindings = (SELECT COUNT(*) FROM dbo.RiskFindings),
    CaseFiles = (SELECT COUNT(*) FROM dbo.CaseFiles),
    CaseNotes = (SELECT COUNT(*) FROM dbo.CaseNotes);
