import assert from "node:assert/strict";

import { parseChatMarkdown } from "./chat-markdown";

const failures: string[] = [];

async function runTest(name: string, run: () => Promise<void> | void) {
  try {
    await run();
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

await runTest("parses assistant headings and markdown tables into structured blocks", () => {
  const blocks = parseChatMarkdown(`The current synthetic case inventory is summarized below:

### By Status

| Status | Case Count | Estimated Questioned Cost |
| :--- | :--- | :--- |
| **New** | 47 | $108,423.00 |
| **Under Review** | 26 | $65,847.00 |

*Note: Data reflects synthetic records.*`);

  assert.deepEqual(blocks, [
    {
      type: "paragraph",
      text: "The current synthetic case inventory is summarized below:"
    },
    {
      type: "heading",
      level: 3,
      text: "By Status"
    },
    {
      type: "table",
      headers: ["Status", "Case Count", "Estimated Questioned Cost"],
      rows: [
        ["New", "47", "$108,423.00"],
        ["Under Review", "26", "$65,847.00"]
      ]
    },
    {
      type: "paragraph",
      text: "Note: Data reflects synthetic records."
    }
  ]);
});

await runTest("groups contiguous bullet lines into one list block", () => {
  const blocks = parseChatMarkdown(`Key patterns:

- Dental has the largest questioned cost.
- Imaging has the second largest questioned cost.`);

  assert.deepEqual(blocks, [
    {
      type: "paragraph",
      text: "Key patterns:"
    },
    {
      type: "list",
      items: [
        "Dental has the largest questioned cost.",
        "Imaging has the second largest questioned cost."
      ]
    }
  ]);
});

if (failures.length > 0) {
  assert.fail(failures.join("\n\n"));
}
