### Task 4 — Rename `mcp__harness-docs__search_docs` in every agent allowlist and in `plugin/agents/README.txt`

**Goal:** Every agent definition that may call the docs-retrieval tool must name it by its new permission string, and the directory README's grant sentence and sweep command must follow. Otherwise the allowlist grants a tool that no longer exists.

**Depends on:** Task 1, which makes `cli/src/retrieval/server.ts` → `SEARCH_TOOL_PERMISSION` evaluate to `mcp__devscene-docs__search_docs`. This is the exact string every allowlist here carries.

**Where this task stops.** It changes the tool's name and nothing else: no frontmatter key, no allowlist member besides this one, no sentence, no `<docs_retrieval>` row wording. Under `.claude/context/plugin.md` → `## Writing agent prose`, a change that adds no behaviour never raises an agent's word count, and a rename adds no word. No other `plugin/` file names the tool or the server (`grep -rn` over `plugin/` before starting confirms this).

### Targets

- `plugin/agents/architecture-reviewer.md`
- `plugin/agents/branch-reviewer.md`
- `plugin/agents/business-parity-reviewer.md`
- `plugin/agents/review-plan-reviewer.md`
- `plugin/agents/skeptic-reviewer.md`
- `plugin/agents/task-plan-reviewer.md`
- `plugin/agents/task-plan-writer.md`
- `plugin/agents/test-fix-plan-writer.md`
- `plugin/agents/ui-tests-plan-reviewer.md`
- `plugin/agents/ui-tests-plan-writer.md`
- `plugin/agents/user-review-fix-plan-writer.md`
- `plugin/agents/README.txt`

**Work:**

- [ ] Run `grep -rn 'harness-docs' plugin` and take the whole result set. The `plugin/agents/` files above are the expected set; a hit outside it is reported, never skipped.
- [ ] In each of the eleven agent definitions, replace `mcp__harness-docs__search_docs` with `mcp__devscene-docs__search_docs` in three places: the frontmatter `tools:` line, the `## Resolved values` `<docs_retrieval>` row ("ignore `mcp__…__search_docs`"), and the `## Read first` bullet that introduces the tool. Change every occurrence and nothing else.
- [ ] In `plugin/agents/README.txt`, rename the tool in the grant sentence ("The docs-retrieval search tool `mcp__harness-docs__search_docs` is granted to") and in the sweep command (`grep -rln --include='*.md' "mcp__harness-docs__search_docs" plugin/agents`).

**Verification:**

- `grep -rn 'harness-docs' plugin` returns no hits.
- `grep -rln --include='*.md' "mcp__devscene-docs__search_docs" plugin/agents` (the README's own sweep, renamed) lists exactly the set of agent files whose `tools:` line carries the tool. Check this with `grep -ln '^tools:.*mcp__devscene-docs__search_docs' plugin/agents/*.md`: the two lists must be equal.
- `git diff --stat -- plugin` shows only the twelve targets, each with equal insertions and deletions.
