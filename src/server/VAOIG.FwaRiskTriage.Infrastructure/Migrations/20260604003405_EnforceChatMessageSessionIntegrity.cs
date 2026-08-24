using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VAOIG.FwaRiskTriage.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EnforceChatMessageSessionIntegrity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatContextItems_ChatMessages_ChatMessageId",
                table: "ChatContextItems");

            migrationBuilder.DropForeignKey(
                name: "FK_ChatToolCalls_ChatMessages_ChatMessageId",
                table: "ChatToolCalls");

            migrationBuilder.DropIndex(
                name: "IX_ChatToolCalls_ChatMessageId",
                table: "ChatToolCalls");

            migrationBuilder.DropIndex(
                name: "IX_ChatContextItems_ChatMessageId",
                table: "ChatContextItems");

            migrationBuilder.AlterColumn<string>(
                name: "ResultSummary",
                table: "ChatToolCalls",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddUniqueConstraint(
                name: "AK_ChatMessages_ChatSessionId_ChatMessageId",
                table: "ChatMessages",
                columns: new[] { "ChatSessionId", "ChatMessageId" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatToolCalls_ChatSessionId_ChatMessageId",
                table: "ChatToolCalls",
                columns: new[] { "ChatSessionId", "ChatMessageId" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatContextItems_ChatSessionId_ChatMessageId",
                table: "ChatContextItems",
                columns: new[] { "ChatSessionId", "ChatMessageId" });

            migrationBuilder.AddForeignKey(
                name: "FK_ChatContextItems_ChatMessages_ChatSessionId_ChatMessageId",
                table: "ChatContextItems",
                columns: new[] { "ChatSessionId", "ChatMessageId" },
                principalTable: "ChatMessages",
                principalColumns: new[] { "ChatSessionId", "ChatMessageId" });

            migrationBuilder.AddForeignKey(
                name: "FK_ChatToolCalls_ChatMessages_ChatSessionId_ChatMessageId",
                table: "ChatToolCalls",
                columns: new[] { "ChatSessionId", "ChatMessageId" },
                principalTable: "ChatMessages",
                principalColumns: new[] { "ChatSessionId", "ChatMessageId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatContextItems_ChatMessages_ChatSessionId_ChatMessageId",
                table: "ChatContextItems");

            migrationBuilder.DropForeignKey(
                name: "FK_ChatToolCalls_ChatMessages_ChatSessionId_ChatMessageId",
                table: "ChatToolCalls");

            migrationBuilder.DropIndex(
                name: "IX_ChatToolCalls_ChatSessionId_ChatMessageId",
                table: "ChatToolCalls");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_ChatMessages_ChatSessionId_ChatMessageId",
                table: "ChatMessages");

            migrationBuilder.DropIndex(
                name: "IX_ChatContextItems_ChatSessionId_ChatMessageId",
                table: "ChatContextItems");

            migrationBuilder.AlterColumn<string>(
                name: "ResultSummary",
                table: "ChatToolCalls",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatToolCalls_ChatMessageId",
                table: "ChatToolCalls",
                column: "ChatMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatContextItems_ChatMessageId",
                table: "ChatContextItems",
                column: "ChatMessageId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatContextItems_ChatMessages_ChatMessageId",
                table: "ChatContextItems",
                column: "ChatMessageId",
                principalTable: "ChatMessages",
                principalColumn: "ChatMessageId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatToolCalls_ChatMessages_ChatMessageId",
                table: "ChatToolCalls",
                column: "ChatMessageId",
                principalTable: "ChatMessages",
                principalColumn: "ChatMessageId");
        }
    }
}
