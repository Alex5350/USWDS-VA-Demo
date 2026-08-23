using System.Security.Claims;
using VAOIG.FwaRiskTriage.Api.Security;
using VAOIG.FwaRiskTriage.Application.Cases;
using VAOIG.FwaRiskTriage.Application.Chat;
using VAOIG.FwaRiskTriage.Application.Reports;

namespace VAOIG.FwaRiskTriage.Api.Endpoints;

public static class ChatEndpoints
{
    public static IEndpointRouteBuilder MapChatEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/chat").WithTags("Chat");

        group.MapPost("/sessions", async (
                CreateChatSessionRequest request,
                ClaimsPrincipal user,
                ChatService service,
                CancellationToken cancellationToken) =>
            {
                try
                {
                    var session = await service.CreateSessionAsync(GetUserEmail(user), request, cancellationToken);
                    return Results.Created($"/api/chat/sessions/{session.ChatId}", session);
                }
                catch (ArgumentException ex)
                {
                    return Results.BadRequest(ex.Message);
                }
            })
            .RequireAuthorization(Policies.CanViewRiskQueue);

        group.MapGet("/sessions", async (
                ClaimsPrincipal user,
                ChatService service,
                CancellationToken cancellationToken) =>
            Results.Ok(await service.ListSessionsAsync(GetUserEmail(user), cancellationToken)))
            .RequireAuthorization(Policies.CanViewRiskQueue);

        group.MapGet("/sessions/{chatId:guid}", async (
                Guid chatId,
                ClaimsPrincipal user,
                ChatService service,
                CancellationToken cancellationToken) =>
            {
                var conversation = await service.GetConversationAsync(chatId, GetUserEmail(user), cancellationToken);
                return conversation is null ? Results.NotFound() : Results.Ok(conversation);
            })
            .RequireAuthorization(Policies.CanViewRiskQueue);

        group.MapPatch("/sessions/{chatId:guid}", async (
                Guid chatId,
                UpdateChatSessionRequest request,
                ClaimsPrincipal user,
                ChatService service,
                CancellationToken cancellationToken) =>
            {
                var userEmail = GetUserEmail(user);

                if (request.IsDeleted == true)
                {
                    return await service.SoftDeleteSessionAsync(chatId, userEmail, cancellationToken)
                        ? Results.NoContent()
                        : Results.NotFound();
                }

                if (!string.IsNullOrWhiteSpace(request.Title))
                {
                    try
                    {
                        return await service.RenameSessionAsync(chatId, userEmail, request.Title, cancellationToken)
                            ? Results.NoContent()
                            : Results.NotFound();
                    }
                    catch (ArgumentException ex)
                    {
                        return Results.BadRequest(ex.Message);
                    }
                }

                return Results.BadRequest("Set isDeleted to true or provide a nonblank title.");
            })
            .RequireAuthorization(Policies.CanViewRiskQueue);

        group.MapPost("/sessions/{chatId:guid}/messages", async (
                Guid chatId,
                AddChatMessageRequest request,
                ClaimsPrincipal user,
                ChatService service,
                CancellationToken cancellationToken) =>
            {
                try
                {
                    var message = await service.AddMessageAsync(chatId, GetUserEmail(user), request, cancellationToken);
                    return message is null
                        ? Results.NotFound()
                        : Results.Created($"/api/chat/sessions/{chatId}/messages/{message.MessageId}", message);
                }
                catch (ArgumentException ex)
                {
                    return Results.BadRequest(ex.Message);
                }
            })
            .RequireAuthorization(Policies.CanViewRiskQueue);

        group.MapPost("/sessions/{chatId:guid}/tool-calls", async (
                Guid chatId,
                AddChatToolCallRequest request,
                ClaimsPrincipal user,
                ChatService service,
                CancellationToken cancellationToken) =>
            {
                try
                {
                    var toolCall = await service.AddToolCallAsync(chatId, GetUserEmail(user), request, cancellationToken);
                    return toolCall is null
                        ? Results.NotFound()
                        : Results.Created($"/api/chat/sessions/{chatId}/tool-calls/{toolCall.ToolCallId}", toolCall);
                }
                catch (ArgumentException ex)
                {
                    return Results.BadRequest(ex.Message);
                }
            })
            .RequireAuthorization(Policies.CanViewRiskQueue);

        group.MapPost("/sessions/{chatId:guid}/context", async (
                Guid chatId,
                AddChatContextItemRequest request,
                ClaimsPrincipal user,
                ChatService service,
                CancellationToken cancellationToken) =>
            {
                try
                {
                    var contextItem = await service.AddContextItemAsync(chatId, GetUserEmail(user), request, cancellationToken);
                    return contextItem is null
                        ? Results.NotFound()
                        : Results.Created($"/api/chat/sessions/{chatId}/context/{contextItem.ContextItemId}", contextItem);
                }
                catch (ArgumentException ex)
                {
                    return Results.BadRequest(ex.Message);
                }
            })
            .RequireAuthorization(Policies.CanViewRiskQueue);

        group.MapDelete("/sessions/{chatId:guid}/context/{contextItemId:int}", async (
                Guid chatId,
                int contextItemId,
                ClaimsPrincipal user,
                ChatService service,
                CancellationToken cancellationToken) =>
            await service.DeleteContextItemAsync(chatId, GetUserEmail(user), contextItemId, cancellationToken)
                ? Results.NoContent()
                : Results.NotFound())
            .RequireAuthorization(Policies.CanViewRiskQueue);

        group.MapPost("/tools/case-counts", async (
                CaseCountQuery query,
                ICaseInsightTool tool,
                CancellationToken cancellationToken) =>
            Results.Ok(await tool.GetCaseCountsAsync(query, cancellationToken)))
            .RequireAuthorization(Policies.CanViewRiskQueue);

        group.MapPost("/tools/risk-queue-search", async (
                RiskQueueQuery query,
                ICaseInsightTool tool,
                CancellationToken cancellationToken) =>
            Results.Ok(await tool.SearchRiskQueueAsync(query, cancellationToken)))
            .RequireAuthorization(Policies.CanViewRiskQueue);

        group.MapGet("/tools/cases/{caseId:int}/summary", async (
                int caseId,
                ICaseInsightTool tool,
                CancellationToken cancellationToken) =>
            {
                var summary = await tool.GetCaseSummaryAsync(caseId, cancellationToken);
                return summary is null ? Results.NotFound() : Results.Ok(summary);
            })
            .RequireAuthorization(Policies.CanViewCaseDetail);

        group.MapPost("/tools/provider-risk", async (
                ReportFilterQuery query,
                ICaseInsightTool tool,
                CancellationToken cancellationToken) =>
            Results.Ok(await tool.GetProviderRiskAsync(query, cancellationToken)))
            .RequireAuthorization(Policies.CanViewDashboard);

        group.MapPost("/tools/case-aging", async (
                ReportFilterQuery query,
                ICaseInsightTool tool,
                CancellationToken cancellationToken) =>
            Results.Ok(await tool.GetCaseAgingAsync(query, cancellationToken)))
            .RequireAuthorization(Policies.CanViewDashboard);

        return app;
    }

    private static string GetUserEmail(ClaimsPrincipal user)
    {
        var email = user.FindFirstValue(ClaimTypes.Email);
        if (!string.IsNullOrWhiteSpace(email))
        {
            return email;
        }

        var name = user.Identity?.Name;
        return string.IsNullOrWhiteSpace(name) ? "demo.unknown@local" : name;
    }
}
