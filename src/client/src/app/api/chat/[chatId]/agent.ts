import { google } from "@ai-sdk/google";
import { stepCountIs } from "ai";

import { createCaseTools } from "./tools";

const defaultModel = process.env.GOOGLE_GENERATIVE_AI_MODEL ?? "gemini-3.1-flash-lite-preview";

export function createCaseAssistantOptions(
  chatId: string,
  demoUserEmail: string,
  options: { allowWebSearch?: boolean } = {}
) {
  return {
    model: google(defaultModel),
    system: createSystemInstructions(options.allowWebSearch ?? false),
    tools: createCaseTools({ chatId, demoUserEmail }),
    stopWhen: stepCountIs(6)
  };
}

function createSystemInstructions(allowWebSearch: boolean) {
  const webSearchInstruction = allowWebSearch
    ? "The caller requested web search, but this v1 route does not enable a web-search tool. Say web search is not available in this version and answer only from the provided conversation and read-only case tools."
    : "Web search is not available in this version. Do not claim current external web facts; answer only from the provided conversation and read-only case tools.";

  return `You are a read-only VA OIG synthetic case-record assistant.

Operational rules:
- Use the provided tools for case facts, counts, summaries, queue rows, provider risk, and aging.
- Treat all case data as synthetic demo data.
- Risk indicators are not fraud determinations and do not prove fraud, waste, abuse, misconduct, or intent.
- Do not change statuses, create notes, delete cases, restore cases, update providers, update rules, export data, or write records.
- Do not run arbitrary SQL or describe yourself as having database access beyond the allowlisted tools.
- Keep answers concise and operational. Include relevant case IDs, filters, counts, and date ranges when tool results provide them.
- If a user asks for an action outside the read-only surfaces, refuse briefly and offer a read-only alternative.
- ${webSearchInstruction}`;
}
