using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VAOIG.FwaRiskTriage.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReferenceDataAdministration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsEnabled",
                table: "Providers",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Providers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Providers",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProcedureCodes",
                columns: table => new
                {
                    ProcedureCodeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DefaultAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcedureCodes", x => x.ProcedureCodeId);
                });

            migrationBuilder.CreateTable(
                name: "StateTerritories",
                columns: table => new
                {
                    Code = table.Column<string>(type: "nvarchar(2)", maxLength: 2, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Type = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StateTerritories", x => x.Code);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Providers_ProviderName",
                table: "Providers",
                column: "ProviderName");

            migrationBuilder.CreateIndex(
                name: "IX_Providers_State_IsEnabled",
                table: "Providers",
                columns: new[] { "State", "IsEnabled" });

            migrationBuilder.CreateIndex(
                name: "IX_ProcedureCodes_Code",
                table: "ProcedureCodes",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcedureCodes");

            migrationBuilder.DropTable(
                name: "StateTerritories");

            migrationBuilder.DropIndex(
                name: "IX_Providers_ProviderName",
                table: "Providers");

            migrationBuilder.DropIndex(
                name: "IX_Providers_State_IsEnabled",
                table: "Providers");

            migrationBuilder.DropColumn(
                name: "IsEnabled",
                table: "Providers");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Providers");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Providers");
        }
    }
}
