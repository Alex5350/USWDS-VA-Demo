import assert from "node:assert/strict";

import { navItems } from "./navigation";

const caseAssistantItem = navItems.find((item) => item.href === "/chat/new");

assert.ok(caseAssistantItem, "Case assistant navigation item should exist.");
assert.deepEqual(caseAssistantItem.children?.map((child) => child.href), ["/chat/new", "/chat/history"]);
assert.deepEqual(caseAssistantItem.children?.map((child) => child.label), ["New chat", "Chat history"]);
