import assert from "node:assert/strict";

import { formatDate } from "./formatters";

assert.equal(formatDate("2026-04-15"), "Apr 15, 2026");
assert.equal(formatDate("2026-05-30T00:00:00"), "May 30, 2026");
assert.equal(formatDate("2026-05-30T21:50:48.6089347"), "May 30, 2026");
assert.equal(formatDate(null), "Not recorded");
assert.equal(formatDate("not-a-date"), "Not recorded");
