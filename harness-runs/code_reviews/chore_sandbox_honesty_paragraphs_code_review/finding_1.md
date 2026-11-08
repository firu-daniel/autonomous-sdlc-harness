### 1. The whiteboard's sandbox row says hooks and MCP servers are held by the permission profile, which the record says they are not

**File:** `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` (the `| **5. The sandbox** |` table row) — "with the file tools, hooks and MCP servers outside it and held by the permission profile instead"

Task 4 rewrote the row. As written, "held by the permission profile instead" applies to all three subjects: the file tools, hooks and MCP servers. Only the file tools are held that way. `docs/sandbox-record.md` → `## 1. What the sandbox contains, and what it does not` says the file tools "follow the profile's permission rules and not the sandbox", and that hooks and local MCP servers run "outside, with the user's full access". Residual 17 in `## 6. The residuals` repeats it for hooks and MCP servers: *"run outside the sandbox, with the user's full access"*. No permission rule bounds what a hook or an MCP server does.

That makes this a claim stronger than the document of record, which the task prompt's `## Constraints` forbids (*"No claim stronger than the document of record"*) and which the story index names as its first top risk. A reader of the whiteboard comes away thinking hooks and MCP servers are bounded by the profile. They are not. The other rewritten sites on this branch get it right: `README.md` → `## Scope and limits` says *"the file tools held by the profile's deny rules"*, and `docs/cli.md` §6 says *"the file tools held by the profile's `Edit` and `Read` deny rules"*.

**Fix:** in that row, replace

```
with the file tools, hooks and MCP servers outside it and held by the permission profile instead;
```

with

```
with the file tools, hooks and MCP servers outside it, the file tools held by the permission profile's deny rules and the hooks and MCP servers running with the user's full access;
```

Change nothing else in the row. The bold label `**5. The sandbox**` and the trailing `docs/sandbox-record.md` §1 pointer stay byte-identical. This is a prose-only edit to a `plugin/docs/` file, so it owes no test run.
