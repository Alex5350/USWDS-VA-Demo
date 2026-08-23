using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VAOIG.FwaRiskTriage.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChatCaseAssistant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChatSessions",
                columns: table => new
                {
                    ChatSessionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PublicId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserEmail = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastMessageAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatSessions", x => x.ChatSessionId);
                });

            migrationBuilder.CreateTable(
                name: "ChatMessages",
                columns: table => new
                {
                    ChatMessageId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChatSessionId = table.Column<int>(type: "int", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Model = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PromptTokens = table.Column<int>(type: "int", nullable: true),
                    CompletionTokens = table.Column<int>(type: "int", nullable: true),
                    FinishReason = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessages", x => x.ChatMessageId);
                    table.ForeignKey(
                        name: "FK_ChatMessages_ChatSessions_ChatSessionId",
                        column: x => x.ChatSessionId,
                        principalTable: "ChatSessions",
                        principalColumn: "ChatSessionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatContextItems",
                columns: table => new
                {
                    ChatContextItemId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChatSessionId = table.Column<int>(type: "int", nullable: false),
                    ChatMessageId = table.Column<int>(type: "int", nullable: true),
                    ContextType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EntityType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EntityId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Label = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatContextItems", x => x.ChatContextItemId);
                    table.ForeignKey(
                        name: "FK_ChatContextItems_ChatMessages_ChatMessageId",
                        column: x => x.ChatMessageId,
                        principalTable: "ChatMessages",
                        principalColumn: "ChatMessageId");
                    table.ForeignKey(
                        name: "FK_ChatContextItems_ChatSessions_ChatSessionId",
                        column: x => x.ChatSessionId,
                        principalTable: "ChatSessions",
                        principalColumn: "ChatSessionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatToolCalls",
                columns: table => new
                {
                    ChatToolCallId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChatSessionId = table.Column<int>(type: "int", nullable: false),
                    ChatMessageId = table.Column<int>(type: "int", nullable: true),
                    ToolName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AllowedSurface = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ArgumentsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ResultSummary = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RowCount = table.Column<int>(type: "int", nullable: true),
                    DurationMs = table.Column<int>(type: "int", nullable: true),
                    Succeeded = table.Column<bool>(type: "bit", nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatToolCalls", x => x.ChatToolCallId);
                    table.ForeignKey(
                        name: "FK_ChatToolCalls_ChatMessages_ChatMessageId",
                        column: x => x.ChatMessageId,
                        principalTable: "ChatMessages",
                        principalColumn: "ChatMessageId");
                    table.ForeignKey(
                        name: "FK_ChatToolCalls_ChatSessions_ChatSessionId",
                        column: x => x.ChatSessionId,
                        principalTable: "ChatSessions",
                        principalColumn: "ChatSessionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatContextItems_ChatMessageId",
                table: "ChatContextItems",
                column: "ChatMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatContextItems_ChatSessionId_ContextType_CreatedAt",
                table: "ChatContextItems",
                columns: new[] { "ChatSessionId", "ContextType", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatContextItems_EntityType_EntityId",
                table: "ChatContextItems",
                columns: new[] { "EntityType", "EntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ChatSessionId_CreatedAt",
                table: "ChatMessages",
                columns: new[] { "ChatSessionId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatSessions_CreatedAt",
                table: "ChatSessions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ChatSessions_PublicId",
                table: "ChatSessions",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatSessions_UserEmail_IsDeleted_LastMessageAt",
                table: "ChatSessions",
                columns: new[] { "UserEmail", "IsDeleted", "LastMessageAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatToolCalls_ChatMessageId",
                table: "ChatToolCalls",
                column: "ChatMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatToolCalls_ChatSessionId_CreatedAt",
                table: "ChatToolCalls",
                columns: new[] { "ChatSessionId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatToolCalls_Succeeded_CreatedAt",
                table: "ChatToolCalls",
                columns: new[] { "Succeeded", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatToolCalls_ToolName_CreatedAt",
                table: "ChatToolCalls",
                columns: new[] { "ToolName", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatContextItems");

            migrationBuilder.DropTable(
                name: "ChatToolCalls");

            migrationBuilder.DropTable(
                name: "ChatMessages");

            migrationBuilder.DropTable(
                name: "ChatSessions");
        }
    }
}
