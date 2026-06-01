using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VAOIG.FwaRiskTriage.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Providers",
                columns: table => new
                {
                    ProviderId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProviderName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NPI = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ProviderType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    State = table.Column<string>(type: "nvarchar(2)", maxLength: 2, nullable: false),
                    RiskTier = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Providers", x => x.ProviderId);
                });

            migrationBuilder.CreateTable(
                name: "RiskRules",
                columns: table => new
                {
                    RiskRuleId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RuleCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RuleName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Weight = table.Column<int>(type: "int", nullable: false),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskRules", x => x.RiskRuleId);
                });

            migrationBuilder.CreateTable(
                name: "VeteranProfiles",
                columns: table => new
                {
                    VeteranId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AnonymizedIdentifier = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: true),
                    DateOfDeath = table.Column<DateOnly>(type: "date", nullable: true),
                    State = table.Column<string>(type: "nvarchar(2)", maxLength: 2, nullable: false),
                    VISN = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VeteranProfiles", x => x.VeteranId);
                });

            migrationBuilder.CreateTable(
                name: "Authorizations",
                columns: table => new
                {
                    AuthorizationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VeteranId = table.Column<int>(type: "int", nullable: false),
                    ProviderId = table.Column<int>(type: "int", nullable: false),
                    ProcedureCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    AuthorizedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Authorizations", x => x.AuthorizationId);
                    table.ForeignKey(
                        name: "FK_Authorizations_Providers_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "Providers",
                        principalColumn: "ProviderId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Authorizations_VeteranProfiles_VeteranId",
                        column: x => x.VeteranId,
                        principalTable: "VeteranProfiles",
                        principalColumn: "VeteranId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HotlineComplaints",
                columns: table => new
                {
                    ComplaintId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReceivedDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ComplaintType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ProviderId = table.Column<int>(type: "int", nullable: true),
                    VeteranId = table.Column<int>(type: "int", nullable: true),
                    NarrativeSummary = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HotlineComplaints", x => x.ComplaintId);
                    table.ForeignKey(
                        name: "FK_HotlineComplaints_Providers_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "Providers",
                        principalColumn: "ProviderId");
                    table.ForeignKey(
                        name: "FK_HotlineComplaints_VeteranProfiles_VeteranId",
                        column: x => x.VeteranId,
                        principalTable: "VeteranProfiles",
                        principalColumn: "VeteranId");
                });

            migrationBuilder.CreateTable(
                name: "Claims",
                columns: table => new
                {
                    ClaimId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VeteranId = table.Column<int>(type: "int", nullable: false),
                    ProviderId = table.Column<int>(type: "int", nullable: false),
                    AuthorizationId = table.Column<int>(type: "int", nullable: true),
                    ProcedureCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ServiceDate = table.Column<DateOnly>(type: "date", nullable: false),
                    SubmittedDate = table.Column<DateOnly>(type: "date", nullable: false),
                    PaidDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ClaimAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaidAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ClaimStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Claims", x => x.ClaimId);
                    table.ForeignKey(
                        name: "FK_Claims_Authorizations_AuthorizationId",
                        column: x => x.AuthorizationId,
                        principalTable: "Authorizations",
                        principalColumn: "AuthorizationId");
                    table.ForeignKey(
                        name: "FK_Claims_Providers_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "Providers",
                        principalColumn: "ProviderId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Claims_VeteranProfiles_VeteranId",
                        column: x => x.VeteranId,
                        principalTable: "VeteranProfiles",
                        principalColumn: "VeteranId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CaseFiles",
                columns: table => new
                {
                    CaseId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClaimId = table.Column<int>(type: "int", nullable: false),
                    AssignedTo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RiskScore = table.Column<int>(type: "int", nullable: false),
                    RiskLevel = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EstimatedQuestionedCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ClosedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseFiles", x => x.CaseId);
                    table.ForeignKey(
                        name: "FK_CaseFiles_Claims_ClaimId",
                        column: x => x.ClaimId,
                        principalTable: "Claims",
                        principalColumn: "ClaimId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RiskFindings",
                columns: table => new
                {
                    RiskFindingId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClaimId = table.Column<int>(type: "int", nullable: false),
                    RiskRuleId = table.Column<int>(type: "int", nullable: false),
                    ScoreContribution = table.Column<int>(type: "int", nullable: false),
                    Explanation = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskFindings", x => x.RiskFindingId);
                    table.ForeignKey(
                        name: "FK_RiskFindings_Claims_ClaimId",
                        column: x => x.ClaimId,
                        principalTable: "Claims",
                        principalColumn: "ClaimId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RiskFindings_RiskRules_RiskRuleId",
                        column: x => x.RiskRuleId,
                        principalTable: "RiskRules",
                        principalColumn: "RiskRuleId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CaseNotes",
                columns: table => new
                {
                    NoteId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CaseId = table.Column<int>(type: "int", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NoteText = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseNotes", x => x.NoteId);
                    table.ForeignKey(
                        name: "FK_CaseNotes_CaseFiles_CaseId",
                        column: x => x.CaseId,
                        principalTable: "CaseFiles",
                        principalColumn: "CaseId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Authorizations_ProviderId",
                table: "Authorizations",
                column: "ProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_Authorizations_VeteranId",
                table: "Authorizations",
                column: "VeteranId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseFiles_ClaimId",
                table: "CaseFiles",
                column: "ClaimId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseNotes_CaseId",
                table: "CaseNotes",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_Claims_AuthorizationId",
                table: "Claims",
                column: "AuthorizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Claims_ProviderId",
                table: "Claims",
                column: "ProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_Claims_VeteranId",
                table: "Claims",
                column: "VeteranId");

            migrationBuilder.CreateIndex(
                name: "IX_HotlineComplaints_ProviderId",
                table: "HotlineComplaints",
                column: "ProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_HotlineComplaints_VeteranId",
                table: "HotlineComplaints",
                column: "VeteranId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskFindings_ClaimId",
                table: "RiskFindings",
                column: "ClaimId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskFindings_RiskRuleId",
                table: "RiskFindings",
                column: "RiskRuleId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskRules_RuleCode",
                table: "RiskRules",
                column: "RuleCode",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CaseNotes");

            migrationBuilder.DropTable(
                name: "HotlineComplaints");

            migrationBuilder.DropTable(
                name: "RiskFindings");

            migrationBuilder.DropTable(
                name: "CaseFiles");

            migrationBuilder.DropTable(
                name: "RiskRules");

            migrationBuilder.DropTable(
                name: "Claims");

            migrationBuilder.DropTable(
                name: "Authorizations");

            migrationBuilder.DropTable(
                name: "Providers");

            migrationBuilder.DropTable(
                name: "VeteranProfiles");
        }
    }
}
