export type CaseAssistantSuggestion = {
  label: string;
  prompt: string;
};

export const caseAssistantSuggestionPrompts: CaseAssistantSuggestion[] = [
  {
    label: "Executive inventory summary",
    prompt: "Give me an executive summary of the current case inventory grouped by status, risk level, and estimated questioned cost."
  },
  {
    label: "Open case distribution",
    prompt: "Treat open cases as New, UnderReview, Referred, and Escalated. How many open cases are there, and how are they distributed by status?"
  },
  {
    label: "Provider type cost drivers",
    prompt: "Which provider types account for the most estimated questioned cost? Group by provider type and call out the top contributors."
  },
  {
    label: "Critical risk triage",
    prompt: "Summarize the critical-risk cases by status, provider type, and estimated questioned cost. Which ones should get the most attention first?"
  },
  {
    label: "Top provider risk",
    prompt: "Which providers have the highest combination of critical/high-risk cases and estimated questioned cost? Give me the top 10 with a short rationale."
  },
  {
    label: "Aging profile",
    prompt: "Show me the aging profile for active cases. Which statuses have the most cases older than 31 days and 61 days?"
  },
  {
    label: "Compare provider types",
    prompt: "Compare Dental, Imaging, and Durable Medical Equipment cases by volume, risk level, and estimated questioned cost."
  },
  {
    label: "Assignee workload",
    prompt: "Group cases by assignee and summarize workload, risk mix, and estimated questioned cost. Who appears to have the heaviest queue?"
  },
  {
    label: "Highest-risk new cases",
    prompt: "Find the highest-risk New cases and summarize the common risk flags, providers, procedure codes, and estimated questioned cost."
  },
  {
    label: "Supervisor briefing",
    prompt: "Create a supervisor briefing: what are the main patterns in the risk queue, which providers or provider types stand out, and what follow-up questions should an analyst ask next?"
  }
];

export function getRandomCaseAssistantSuggestions(seed: string, count = 4) {
  const requestedCount = Math.max(0, Math.floor(count));
  const pool = [...caseAssistantSuggestionPrompts];
  let state = hashSeed(seed);

  for (let index = pool.length - 1; index > 0; index -= 1) {
    state = nextRandomState(state);
    const swapIndex = state % (index + 1);
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  return pool.slice(0, Math.min(requestedCount, pool.length));
}

function hashSeed(seed: string) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function nextRandomState(state: number) {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}
