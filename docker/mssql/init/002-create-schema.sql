USE VAOIG_FWA_Demo;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.CaseNotes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CaseNotes
    (
        NoteId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_CaseNotes PRIMARY KEY,
        CaseId int NOT NULL,
        CreatedBy nvarchar(100) NOT NULL,
        CreatedDate datetime2 NOT NULL CONSTRAINT DF_CaseNotes_CreatedDate DEFAULT SYSUTCDATETIME(),
        NoteText nvarchar(max) NOT NULL
    );
END;
GO

IF OBJECT_ID('dbo.CaseFiles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CaseFiles
    (
        CaseId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_CaseFiles PRIMARY KEY,
        ClaimId int NOT NULL,
        AssignedTo nvarchar(100) NULL,
        Status nvarchar(50) NOT NULL,
        Priority nvarchar(50) NOT NULL,
        RiskScore int NOT NULL,
        RiskLevel nvarchar(50) NOT NULL,
        EstimatedQuestionedCost decimal(18,2) NOT NULL,
        CreatedDate datetime2 NOT NULL CONSTRAINT DF_CaseFiles_CreatedDate DEFAULT SYSUTCDATETIME(),
        ClosedDate datetime2 NULL,
        IsDeleted bit NOT NULL CONSTRAINT DF_CaseFiles_IsDeleted DEFAULT 0,
        DeletedAt datetime2 NULL,
        DeletedBy nvarchar(200) NULL,
        DeleteReason nvarchar(1000) NULL
    );
END;
GO

IF COL_LENGTH('dbo.CaseFiles', 'IsDeleted') IS NULL
BEGIN
    ALTER TABLE dbo.CaseFiles ADD
        IsDeleted bit NOT NULL CONSTRAINT DF_CaseFiles_IsDeleted DEFAULT 0,
        DeletedAt datetime2 NULL,
        DeletedBy nvarchar(200) NULL,
        DeleteReason nvarchar(1000) NULL;
END;
GO

IF OBJECT_ID('dbo.RiskFindings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RiskFindings
    (
        RiskFindingId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_RiskFindings PRIMARY KEY,
        ClaimId int NOT NULL,
        RiskRuleId int NOT NULL,
        ScoreContribution int NOT NULL,
        Explanation nvarchar(1000) NOT NULL,
        CreatedAt datetime2 NOT NULL CONSTRAINT DF_RiskFindings_CreatedAt DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID('dbo.RiskRules', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RiskRules
    (
        RiskRuleId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_RiskRules PRIMARY KEY,
        RuleCode nvarchar(50) NOT NULL,
        RuleName nvarchar(200) NOT NULL,
        Description nvarchar(1000) NOT NULL,
        Weight int NOT NULL,
        IsEnabled bit NOT NULL CONSTRAINT DF_RiskRules_IsEnabled DEFAULT 1,
        CreatedAt datetime2 NOT NULL CONSTRAINT DF_RiskRules_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_RiskRules_RuleCode UNIQUE (RuleCode)
    );
END;
GO

IF OBJECT_ID('dbo.HotlineComplaints', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.HotlineComplaints
    (
        ComplaintId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_HotlineComplaints PRIMARY KEY,
        ReceivedDate date NOT NULL,
        ComplaintType nvarchar(100) NOT NULL,
        ProviderId int NULL,
        VeteranId int NULL,
        NarrativeSummary nvarchar(max) NOT NULL,
        Status nvarchar(50) NOT NULL,
        CreatedAt datetime2 NOT NULL CONSTRAINT DF_HotlineComplaints_CreatedAt DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID('dbo.Claims', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Claims
    (
        ClaimId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Claims PRIMARY KEY,
        VeteranId int NOT NULL,
        ProviderId int NOT NULL,
        AuthorizationId int NULL,
        ProcedureCode nvarchar(20) NOT NULL,
        ServiceDate date NOT NULL,
        SubmittedDate date NOT NULL,
        PaidDate date NULL,
        ClaimAmount decimal(18,2) NOT NULL,
        PaidAmount decimal(18,2) NOT NULL,
        ClaimStatus nvarchar(50) NOT NULL,
        CreatedAt datetime2 NOT NULL CONSTRAINT DF_Claims_CreatedAt DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID('dbo.Authorizations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Authorizations
    (
        AuthorizationId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Authorizations PRIMARY KEY,
        VeteranId int NOT NULL,
        ProviderId int NOT NULL,
        ProcedureCode nvarchar(20) NOT NULL,
        StartDate date NOT NULL,
        EndDate date NOT NULL,
        AuthorizedAmount decimal(18,2) NOT NULL,
        Status nvarchar(50) NOT NULL,
        CreatedAt datetime2 NOT NULL CONSTRAINT DF_Authorizations_CreatedAt DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID('dbo.Providers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Providers
    (
        ProviderId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Providers PRIMARY KEY,
        ProviderName nvarchar(200) NOT NULL,
        NPI nvarchar(20) NOT NULL,
        ProviderType nvarchar(100) NOT NULL,
        State nvarchar(2) NOT NULL,
        RiskTier nvarchar(20) NOT NULL,
        IsEnabled bit NOT NULL CONSTRAINT DF_Providers_IsEnabled DEFAULT 1,
        CreatedAt datetime2 NOT NULL CONSTRAINT DF_Providers_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt datetime2 NULL,
        UpdatedBy nvarchar(200) NULL,
        CONSTRAINT UQ_Providers_NPI UNIQUE (NPI)
    );
END;
GO

IF COL_LENGTH('dbo.Providers', 'IsEnabled') IS NULL
    ALTER TABLE dbo.Providers ADD IsEnabled bit NOT NULL CONSTRAINT DF_Providers_IsEnabled DEFAULT 1;
GO

IF COL_LENGTH('dbo.Providers', 'UpdatedAt') IS NULL
    ALTER TABLE dbo.Providers ADD UpdatedAt datetime2 NULL;
GO

IF COL_LENGTH('dbo.Providers', 'UpdatedBy') IS NULL
    ALTER TABLE dbo.Providers ADD UpdatedBy nvarchar(200) NULL;
GO

IF OBJECT_ID('dbo.VeteranProfiles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.VeteranProfiles
    (
        VeteranId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_VeteranProfiles PRIMARY KEY,
        AnonymizedIdentifier nvarchar(50) NOT NULL,
        DateOfBirth date NULL,
        DateOfDeath date NULL,
        State nvarchar(2) NOT NULL,
        VISN nvarchar(20) NOT NULL,
        CreatedAt datetime2 NOT NULL CONSTRAINT DF_VeteranProfiles_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_VeteranProfiles_AnonymizedIdentifier UNIQUE (AnonymizedIdentifier)
    );
END;
GO

IF OBJECT_ID('dbo.StateTerritories', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.StateTerritories
    (
        Code nvarchar(2) NOT NULL CONSTRAINT PK_StateTerritories PRIMARY KEY,
        Name nvarchar(100) NOT NULL,
        Type nvarchar(30) NOT NULL,
        IsEnabled bit NOT NULL CONSTRAINT DF_StateTerritories_IsEnabled DEFAULT 1
    );
END;
GO

IF OBJECT_ID('dbo.ProcedureCodes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProcedureCodes
    (
        ProcedureCodeId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_ProcedureCodes PRIMARY KEY,
        Code nvarchar(20) NOT NULL,
        Description nvarchar(300) NOT NULL,
        Category nvarchar(100) NOT NULL,
        DefaultAmount decimal(18,2) NULL,
        IsEnabled bit NOT NULL CONSTRAINT DF_ProcedureCodes_IsEnabled DEFAULT 1,
        CreatedAt datetime2 NOT NULL CONSTRAINT DF_ProcedureCodes_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt datetime2 NULL,
        UpdatedBy nvarchar(200) NULL,
        CONSTRAINT UQ_ProcedureCodes_Code UNIQUE (Code)
    );
END;
GO

IF OBJECT_ID('dbo.AuditEvents', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditEvents
    (
        AuditEventId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_AuditEvents PRIMARY KEY,
        ActorEmail nvarchar(200) NOT NULL,
        Action nvarchar(100) NOT NULL,
        TargetType nvarchar(100) NOT NULL,
        TargetId nvarchar(100) NOT NULL,
        Summary nvarchar(1000) NOT NULL,
        CreatedAt datetime2 NOT NULL CONSTRAINT DF_AuditEvents_CreatedAt DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID('dbo.DemoUserPermissionOverrides', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DemoUserPermissionOverrides
    (
        DemoUserPermissionOverrideId int IDENTITY(1,1) NOT NULL CONSTRAINT PK_DemoUserPermissionOverrides PRIMARY KEY,
        Email nvarchar(200) NOT NULL,
        Permission nvarchar(100) NOT NULL,
        IsGranted bit NOT NULL,
        UpdatedBy nvarchar(200) NOT NULL,
        UpdatedAt datetime2 NOT NULL CONSTRAINT DF_DemoUserPermissionOverrides_UpdatedAt DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Authorizations_VeteranProfiles')
BEGIN
    ALTER TABLE dbo.Authorizations ADD CONSTRAINT FK_Authorizations_VeteranProfiles
        FOREIGN KEY (VeteranId) REFERENCES dbo.VeteranProfiles (VeteranId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Authorizations_Providers')
BEGIN
    ALTER TABLE dbo.Authorizations ADD CONSTRAINT FK_Authorizations_Providers
        FOREIGN KEY (ProviderId) REFERENCES dbo.Providers (ProviderId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Claims_VeteranProfiles')
BEGIN
    ALTER TABLE dbo.Claims ADD CONSTRAINT FK_Claims_VeteranProfiles
        FOREIGN KEY (VeteranId) REFERENCES dbo.VeteranProfiles (VeteranId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Claims_Providers')
BEGIN
    ALTER TABLE dbo.Claims ADD CONSTRAINT FK_Claims_Providers
        FOREIGN KEY (ProviderId) REFERENCES dbo.Providers (ProviderId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Claims_Authorizations')
BEGIN
    ALTER TABLE dbo.Claims ADD CONSTRAINT FK_Claims_Authorizations
        FOREIGN KEY (AuthorizationId) REFERENCES dbo.Authorizations (AuthorizationId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HotlineComplaints_Providers')
BEGIN
    ALTER TABLE dbo.HotlineComplaints ADD CONSTRAINT FK_HotlineComplaints_Providers
        FOREIGN KEY (ProviderId) REFERENCES dbo.Providers (ProviderId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HotlineComplaints_VeteranProfiles')
BEGIN
    ALTER TABLE dbo.HotlineComplaints ADD CONSTRAINT FK_HotlineComplaints_VeteranProfiles
        FOREIGN KEY (VeteranId) REFERENCES dbo.VeteranProfiles (VeteranId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_RiskFindings_Claims')
BEGIN
    ALTER TABLE dbo.RiskFindings ADD CONSTRAINT FK_RiskFindings_Claims
        FOREIGN KEY (ClaimId) REFERENCES dbo.Claims (ClaimId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_RiskFindings_RiskRules')
BEGIN
    ALTER TABLE dbo.RiskFindings ADD CONSTRAINT FK_RiskFindings_RiskRules
        FOREIGN KEY (RiskRuleId) REFERENCES dbo.RiskRules (RiskRuleId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_CaseFiles_Claims')
BEGIN
    ALTER TABLE dbo.CaseFiles ADD CONSTRAINT FK_CaseFiles_Claims
        FOREIGN KEY (ClaimId) REFERENCES dbo.Claims (ClaimId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_CaseNotes_CaseFiles')
BEGIN
    ALTER TABLE dbo.CaseNotes ADD CONSTRAINT FK_CaseNotes_CaseFiles
        FOREIGN KEY (CaseId) REFERENCES dbo.CaseFiles (CaseId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_CaseFiles_RiskScore')
BEGIN
    ALTER TABLE dbo.CaseFiles ADD CONSTRAINT CK_CaseFiles_RiskScore CHECK (RiskScore BETWEEN 0 AND 100);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Claims_ServiceDate' AND object_id = OBJECT_ID('dbo.Claims'))
    CREATE INDEX IX_Claims_ServiceDate ON dbo.Claims (ServiceDate);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Claims_Provider_Service' AND object_id = OBJECT_ID('dbo.Claims'))
    CREATE INDEX IX_Claims_Provider_Service ON dbo.Claims (ProviderId, ServiceDate) INCLUDE (PaidAmount, ProcedureCode);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RiskFindings_ClaimId' AND object_id = OBJECT_ID('dbo.RiskFindings'))
    CREATE INDEX IX_RiskFindings_ClaimId ON dbo.RiskFindings (ClaimId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CaseFiles_Status_Risk' AND object_id = OBJECT_ID('dbo.CaseFiles'))
    CREATE INDEX IX_CaseFiles_Status_Risk ON dbo.CaseFiles (Status, RiskLevel, RiskScore DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CaseNotes_CaseId_CreatedDate' AND object_id = OBJECT_ID('dbo.CaseNotes'))
    CREATE INDEX IX_CaseNotes_CaseId_CreatedDate ON dbo.CaseNotes (CaseId, CreatedDate DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Providers_ProviderName' AND object_id = OBJECT_ID('dbo.Providers'))
    CREATE INDEX IX_Providers_ProviderName ON dbo.Providers (ProviderName);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Providers_State_IsEnabled' AND object_id = OBJECT_ID('dbo.Providers'))
    CREATE INDEX IX_Providers_State_IsEnabled ON dbo.Providers (State, IsEnabled);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProcedureCodes_Code' AND object_id = OBJECT_ID('dbo.ProcedureCodes'))
    CREATE UNIQUE INDEX IX_ProcedureCodes_Code ON dbo.ProcedureCodes (Code);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditEvents_CreatedAt' AND object_id = OBJECT_ID('dbo.AuditEvents'))
    CREATE INDEX IX_AuditEvents_CreatedAt ON dbo.AuditEvents (CreatedAt DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DemoUserPermissionOverrides_Email_Permission' AND object_id = OBJECT_ID('dbo.DemoUserPermissionOverrides'))
    CREATE UNIQUE INDEX IX_DemoUserPermissionOverrides_Email_Permission ON dbo.DemoUserPermissionOverrides (Email, Permission);
GO

CREATE OR ALTER VIEW dbo.vw_DashboardSummary
AS
SELECT
    TotalClaimsReviewed = CAST((SELECT COUNT_BIG(*) FROM dbo.Claims) AS int),
    HighRiskClaims = CAST((SELECT COUNT_BIG(*) FROM dbo.CaseFiles WHERE IsDeleted = 0 AND RiskLevel = N'High') AS int),
    CriticalRiskClaims = CAST((SELECT COUNT_BIG(*) FROM dbo.CaseFiles WHERE IsDeleted = 0 AND RiskLevel = N'Critical') AS int),
    EstimatedQuestionedCost = CAST(ISNULL((SELECT SUM(EstimatedQuestionedCost) FROM dbo.CaseFiles WHERE IsDeleted = 0), 0) AS decimal(18,2)),
    DuplicatePaymentCandidates = CAST((
        SELECT COUNT_BIG(*)
        FROM dbo.Claims c
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
        )
    ) AS int),
    ProvidersWithAbnormalPatterns = CAST((
        SELECT COUNT_BIG(*)
        FROM
        (
            SELECT c.ProviderId
            FROM dbo.Claims c
            INNER JOIN dbo.CaseFiles cf ON cf.ClaimId = c.ClaimId
            WHERE cf.IsDeleted = 0
              AND cf.RiskLevel IN (N'High', N'Critical')
            GROUP BY c.ProviderId
            HAVING COUNT_BIG(*) >= 3
        ) p
    ) AS int),
    OpenCases = CAST((SELECT COUNT_BIG(*) FROM dbo.CaseFiles WHERE IsDeleted = 0 AND Status <> N'Closed') AS int),
    AverageCaseAgeDays = CAST(ISNULL((
        SELECT AVG(CAST(DATEDIFF(day, CreatedDate, COALESCE(ClosedDate, SYSUTCDATETIME())) AS decimal(18,2)))
        FROM dbo.CaseFiles
        WHERE IsDeleted = 0
          AND Status <> N'Closed'
    ), 0) AS decimal(18,1));
GO
CREATE OR ALTER VIEW dbo.vw_ProviderRiskSummary
AS
SELECT
    p.ProviderId,
    p.ProviderName,
    p.ProviderType,
    p.State,
    p.RiskTier,
    ClaimCount = COUNT(c.ClaimId),
    TotalPaidAmount = CAST(ISNULL(SUM(c.PaidAmount), 0) AS decimal(18,2)),
    HighRiskClaimCount = SUM(CASE WHEN cf.RiskLevel = N'High' THEN 1 ELSE 0 END),
    CriticalRiskClaimCount = SUM(CASE WHEN cf.RiskLevel = N'Critical' THEN 1 ELSE 0 END),
    EstimatedQuestionedCost = CAST(ISNULL(SUM(cf.EstimatedQuestionedCost), 0) AS decimal(18,2)),
    AverageRiskScore = CAST(ISNULL(AVG(CAST(cf.RiskScore AS decimal(18,2))), 0) AS decimal(18,1))
FROM dbo.Providers p
LEFT JOIN dbo.Claims c ON c.ProviderId = p.ProviderId
LEFT JOIN dbo.CaseFiles cf ON cf.ClaimId = c.ClaimId AND cf.IsDeleted = 0
GROUP BY
    p.ProviderId,
    p.ProviderName,
    p.ProviderType,
    p.State,
    p.RiskTier;
GO
CREATE OR ALTER VIEW dbo.vw_CaseAging
AS
SELECT
    Status,
    Days0To15 = SUM(CASE WHEN DATEDIFF(day, CreatedDate, COALESCE(ClosedDate, SYSUTCDATETIME())) BETWEEN 0 AND 15 THEN 1 ELSE 0 END),
    Days16To30 = SUM(CASE WHEN DATEDIFF(day, CreatedDate, COALESCE(ClosedDate, SYSUTCDATETIME())) BETWEEN 16 AND 30 THEN 1 ELSE 0 END),
    Days31To60 = SUM(CASE WHEN DATEDIFF(day, CreatedDate, COALESCE(ClosedDate, SYSUTCDATETIME())) BETWEEN 31 AND 60 THEN 1 ELSE 0 END),
    Days61Plus = SUM(CASE WHEN DATEDIFF(day, CreatedDate, COALESCE(ClosedDate, SYSUTCDATETIME())) >= 61 THEN 1 ELSE 0 END),
    TotalCases = COUNT_BIG(*)
FROM dbo.CaseFiles
WHERE IsDeleted = 0
GROUP BY Status;
GO
CREATE OR ALTER VIEW dbo.vw_QuestionedCostByMonth
AS
SELECT
    MonthStart = DATEFROMPARTS(YEAR(c.ServiceDate), MONTH(c.ServiceDate), 1),
    TotalPaidAmount = CAST(SUM(c.PaidAmount) AS decimal(18,2)),
    EstimatedQuestionedCost = CAST(ISNULL(SUM(cf.EstimatedQuestionedCost), 0) AS decimal(18,2)),
    HighRiskClaimCount = SUM(CASE WHEN cf.RiskLevel IN (N'High', N'Critical') THEN 1 ELSE 0 END),
    CaseCount = COUNT(cf.CaseId)
FROM dbo.Claims c
LEFT JOIN dbo.CaseFiles cf ON cf.ClaimId = c.ClaimId AND cf.IsDeleted = 0
GROUP BY DATEFROMPARTS(YEAR(c.ServiceDate), MONTH(c.ServiceDate), 1);
GO

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
        WHERE cf.IsDeleted = 0
          AND (@RiskLevel IS NULL OR cf.RiskLevel = @RiskLevel)
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
