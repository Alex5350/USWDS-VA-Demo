export const syntheticDataDisclaimer =
  "This demo uses synthetic data only. It does not contain real veteran, patient, claim, provider, VA, PHI, PII, or government data. Risk indicators are for demonstration purposes only and do not represent confirmed fraud, waste, or abuse.";

export function listToSentence(items: string[]) {
  if (items.length === 0) {
    return "None";
  }

  if (items.length === 1) {
    return items[0];
  }

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}
