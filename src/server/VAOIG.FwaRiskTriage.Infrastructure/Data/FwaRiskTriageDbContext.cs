using Microsoft.EntityFrameworkCore;
using VAOIG.FwaRiskTriage.Domain.Entities;
using Authorization = VAOIG.FwaRiskTriage.Domain.Entities.Authorization;

namespace VAOIG.FwaRiskTriage.Infrastructure.Data;

public sealed class FwaRiskTriageDbContext(DbContextOptions<FwaRiskTriageDbContext> options) : DbContext(options)
{
    public DbSet<VeteranProfile> VeteranProfiles => Set<VeteranProfile>();
    public DbSet<Provider> Providers => Set<Provider>();
    public DbSet<StateTerritory> StateTerritories => Set<StateTerritory>();
    public DbSet<ProcedureCode> ProcedureCodes => Set<ProcedureCode>();
    public DbSet<Authorization> Authorizations => Set<Authorization>();
    public DbSet<Claim> Claims => Set<Claim>();
    public DbSet<HotlineComplaint> HotlineComplaints => Set<HotlineComplaint>();
    public DbSet<RiskRule> RiskRules => Set<RiskRule>();
    public DbSet<RiskFinding> RiskFindings => Set<RiskFinding>();
    public DbSet<CaseFile> CaseFiles => Set<CaseFile>();
    public DbSet<CaseNote> CaseNotes => Set<CaseNote>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    public DbSet<DemoUserPermissionOverride> DemoUserPermissionOverrides => Set<DemoUserPermissionOverride>();
    public DbSet<ChatSession> ChatSessions => Set<ChatSession>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<ChatToolCall> ChatToolCalls => Set<ChatToolCall>();
    public DbSet<ChatContextItem> ChatContextItems => Set<ChatContextItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<VeteranProfile>(entity =>
        {
            entity.ToTable("VeteranProfiles");
            entity.HasKey(x => x.VeteranId);
            entity.Property(x => x.AnonymizedIdentifier).HasMaxLength(50).IsRequired();
            entity.Property(x => x.State).HasMaxLength(2).IsRequired();
            entity.Property(x => x.Visn).HasColumnName("VISN").HasMaxLength(20).IsRequired();
        });

        modelBuilder.Entity<Provider>(entity =>
        {
            entity.ToTable("Providers");
            entity.HasKey(x => x.ProviderId);
            entity.Property(x => x.ProviderName).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Npi).HasColumnName("NPI").HasMaxLength(20).IsRequired();
            entity.Property(x => x.ProviderType).HasMaxLength(100).IsRequired();
            entity.Property(x => x.State).HasMaxLength(2).IsRequired();
            entity.Property(x => x.RiskTier).HasMaxLength(20).IsRequired();
            entity.Property(x => x.UpdatedBy).HasMaxLength(200);
            entity.Property(x => x.IsEnabled).HasDefaultValue(true);
            entity.HasIndex(x => x.ProviderName);
            entity.HasIndex(x => new { x.State, x.IsEnabled });
        });

        modelBuilder.Entity<StateTerritory>(entity =>
        {
            entity.ToTable("StateTerritories");
            entity.HasKey(x => x.Code);
            entity.Property(x => x.Code).HasMaxLength(2).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Type).HasMaxLength(30).IsRequired();
            entity.Property(x => x.IsEnabled).HasDefaultValue(true);
        });

        modelBuilder.Entity<ProcedureCode>(entity =>
        {
            entity.ToTable("ProcedureCodes");
            entity.HasKey(x => x.ProcedureCodeId);
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.Code).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(300).IsRequired();
            entity.Property(x => x.Category).HasMaxLength(100).IsRequired();
            entity.Property(x => x.DefaultAmount).HasColumnType("decimal(18,2)");
            entity.Property(x => x.UpdatedBy).HasMaxLength(200);
            entity.Property(x => x.IsEnabled).HasDefaultValue(true);
        });

        modelBuilder.Entity<Authorization>(entity =>
        {
            entity.ToTable("Authorizations");
            entity.HasKey(x => x.AuthorizationId);
            entity.Property(x => x.ProcedureCode).HasMaxLength(20).IsRequired();
            entity.Property(x => x.AuthorizedAmount).HasColumnType("decimal(18,2)");
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.HasOne<VeteranProfile>().WithMany().HasForeignKey(x => x.VeteranId);
            entity.HasOne<Provider>().WithMany().HasForeignKey(x => x.ProviderId);
        });

        modelBuilder.Entity<Claim>(entity =>
        {
            entity.ToTable("Claims");
            entity.HasKey(x => x.ClaimId);
            entity.Property(x => x.ProcedureCode).HasMaxLength(20).IsRequired();
            entity.Property(x => x.ClaimAmount).HasColumnType("decimal(18,2)");
            entity.Property(x => x.PaidAmount).HasColumnType("decimal(18,2)");
            entity.Property(x => x.ClaimStatus).HasMaxLength(50).IsRequired();
            entity.HasOne<VeteranProfile>().WithMany().HasForeignKey(x => x.VeteranId);
            entity.HasOne<Provider>().WithMany().HasForeignKey(x => x.ProviderId);
            entity.HasOne<Authorization>().WithMany().HasForeignKey(x => x.AuthorizationId).IsRequired(false);
        });

        modelBuilder.Entity<HotlineComplaint>(entity =>
        {
            entity.ToTable("HotlineComplaints");
            entity.HasKey(x => x.ComplaintId);
            entity.Property(x => x.ComplaintType).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.HasOne<Provider>().WithMany().HasForeignKey(x => x.ProviderId).IsRequired(false);
            entity.HasOne<VeteranProfile>().WithMany().HasForeignKey(x => x.VeteranId).IsRequired(false);
        });

        modelBuilder.Entity<RiskRule>(entity =>
        {
            entity.ToTable("RiskRules");
            entity.HasKey(x => x.RiskRuleId);
            entity.HasIndex(x => x.RuleCode).IsUnique();
            entity.Property(x => x.RuleCode).HasMaxLength(50).IsRequired();
            entity.Property(x => x.RuleName).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(1000).IsRequired();
        });

        modelBuilder.Entity<RiskFinding>(entity =>
        {
            entity.ToTable("RiskFindings");
            entity.HasKey(x => x.RiskFindingId);
            entity.Property(x => x.Explanation).HasMaxLength(1000).IsRequired();
            entity.HasOne<Claim>().WithMany().HasForeignKey(x => x.ClaimId);
            entity.HasOne<RiskRule>().WithMany().HasForeignKey(x => x.RiskRuleId);
        });

        modelBuilder.Entity<CaseFile>(entity =>
        {
            entity.ToTable("CaseFiles");
            entity.HasKey(x => x.CaseId);
            entity.Property(x => x.AssignedTo).HasMaxLength(100);
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Priority).HasMaxLength(50).IsRequired();
            entity.Property(x => x.RiskLevel).HasMaxLength(50).IsRequired();
            entity.Property(x => x.EstimatedQuestionedCost).HasColumnType("decimal(18,2)");
            entity.Property(x => x.IsDeleted).HasDefaultValue(false);
            entity.Property(x => x.DeletedBy).HasMaxLength(200);
            entity.Property(x => x.DeleteReason).HasMaxLength(1000);
            entity.HasOne<Claim>().WithMany().HasForeignKey(x => x.ClaimId);
            entity.HasIndex(x => new { x.IsDeleted, x.Status, x.RiskLevel, x.RiskScore });
            entity.HasIndex(x => x.DeletedAt);
        });

        modelBuilder.Entity<CaseNote>(entity =>
        {
            entity.ToTable("CaseNotes");
            entity.HasKey(x => x.NoteId);
            entity.Property(x => x.CreatedBy).HasMaxLength(100).IsRequired();
            entity.HasOne<CaseFile>().WithMany().HasForeignKey(x => x.CaseId);
        });

        modelBuilder.Entity<AuditEvent>(entity =>
        {
            entity.ToTable("AuditEvents");
            entity.HasKey(x => x.AuditEventId);
            entity.Property(x => x.ActorEmail).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Action).HasMaxLength(100).IsRequired();
            entity.Property(x => x.TargetType).HasMaxLength(100).IsRequired();
            entity.Property(x => x.TargetId).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Summary).HasMaxLength(1000).IsRequired();
            entity.HasIndex(x => x.CreatedAt);
        });

        modelBuilder.Entity<DemoUserPermissionOverride>(entity =>
        {
            entity.ToTable("DemoUserPermissionOverrides");
            entity.HasKey(x => x.DemoUserPermissionOverrideId);
            entity.HasIndex(x => new { x.Email, x.Permission }).IsUnique();
            entity.Property(x => x.Email).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Permission).HasMaxLength(100).IsRequired();
            entity.Property(x => x.UpdatedBy).HasMaxLength(200).IsRequired();
        });

        modelBuilder.Entity<ChatSession>(entity =>
        {
            entity.ToTable("ChatSessions");
            entity.HasKey(x => x.ChatSessionId);
            entity.HasIndex(x => x.PublicId).IsUnique();
            entity.HasIndex(x => new { x.UserEmail, x.IsDeleted, x.LastMessageAt });
            entity.HasIndex(x => x.CreatedAt);
            entity.Property(x => x.UserEmail).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Title).HasMaxLength(200);
            entity.Property(x => x.IsDeleted).HasDefaultValue(false);
            entity.HasMany(x => x.Messages).WithOne().HasForeignKey(x => x.ChatSessionId);
            entity.HasMany(x => x.ToolCalls).WithOne().HasForeignKey(x => x.ChatSessionId);
            entity.HasMany(x => x.ContextItems).WithOne().HasForeignKey(x => x.ChatSessionId);
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.ToTable("ChatMessages");
            entity.HasKey(x => x.ChatMessageId);
            entity.HasAlternateKey(x => new { x.ChatSessionId, x.ChatMessageId });
            entity.HasIndex(x => new { x.ChatSessionId, x.CreatedAt });
            entity.HasIndex(x => new { x.ChatSessionId, x.ClientMessageId }).IsUnique();
            entity.Property(x => x.Role).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Content).IsRequired();
            entity.Property(x => x.ClientMessageId).HasMaxLength(200);
            entity.Property(x => x.Model).HasMaxLength(100);
            entity.Property(x => x.FinishReason).HasMaxLength(50);
        });

        modelBuilder.Entity<ChatToolCall>(entity =>
        {
            entity.ToTable("ChatToolCalls");
            entity.HasKey(x => x.ChatToolCallId);
            entity.HasIndex(x => new { x.ChatSessionId, x.CreatedAt });
            entity.HasIndex(x => new { x.ToolName, x.CreatedAt });
            entity.HasIndex(x => new { x.Succeeded, x.CreatedAt });
            entity.Property(x => x.ToolName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.AllowedSurface).HasMaxLength(100).IsRequired();
            entity.Property(x => x.ArgumentsJson).IsRequired();
            entity.Property(x => x.ResultSummary).HasMaxLength(2000);
            entity.Property(x => x.ErrorMessage).HasMaxLength(1000);
            entity.HasOne<ChatMessage>()
                .WithMany()
                .HasForeignKey(x => new { x.ChatSessionId, x.ChatMessageId })
                .HasPrincipalKey(x => new { x.ChatSessionId, x.ChatMessageId })
                .IsRequired(false);
        });

        modelBuilder.Entity<ChatContextItem>(entity =>
        {
            entity.ToTable("ChatContextItems");
            entity.HasKey(x => x.ChatContextItemId);
            entity.HasIndex(x => new { x.ChatSessionId, x.ContextType, x.CreatedAt });
            entity.HasIndex(x => new { x.EntityType, x.EntityId });
            entity.Property(x => x.ContextType).HasMaxLength(50).IsRequired();
            entity.Property(x => x.EntityType).HasMaxLength(50).IsRequired();
            entity.Property(x => x.EntityId).HasMaxLength(100);
            entity.Property(x => x.Label).HasMaxLength(200);
            entity.HasOne<ChatMessage>()
                .WithMany()
                .HasForeignKey(x => new { x.ChatSessionId, x.ChatMessageId })
                .HasPrincipalKey(x => new { x.ChatSessionId, x.ChatMessageId })
                .IsRequired(false);
        });
    }
}
