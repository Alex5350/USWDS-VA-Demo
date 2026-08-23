import assert from "node:assert/strict";

import { createChatTitle, getMessageText } from "./chat-formatters";

assert.equal(createChatTitle("How many open cases are pending by status?"), "How many open cases are pending by status?");
assert.equal(createChatTitle("   "), "New chat");
assert.equal(createChatTitle("x".repeat(90)), `${"x".repeat(77)}...`);
assert.equal(getMessageText([{ type: "text", text: "Open cases" }]), "Open cases");
assert.equal(getMessageText([{ type: "tool-getCaseCounts", state: "output-available" }]), "");
