### Task 17 — Record the ten-agent grant in `plugin/agents/README.txt`, the verb in `plugin/README.md`, and the launcher in the guard's left-allowed set

**Goal:** Give the retrieval grant one roster, in the directory README that already owns the allowlist rules. A later rename of the server or tool, or a change to who holds it, then has one place listing every file it touches. Also bring `plugin/README.md`'s description of the sibling CLI up to its five verbs, and add the new outer-loop launcher to the two plugin texts that enumerate which outer-loop scripts the script-allowlist guard leaves allowed.

**Depends on:**

- **Task 16**, which, together with Task 15, completes the grant. The ten agents' `tools:` lines, `<docs_retrieval>` rows and bullets name `mcp__harness-docs__search_docs`. The CLI owns the server name and tool name as `DOCS_SERVER_NAME` and `SEARCH_TOOL_NAME` in `cli/src/retrieval/server.ts`, and carries the server name in `cli/templates/repo/mcp.retrieval.json` and `cli/templates/claude/settings.autonomous.retrieval.json` (Tasks 8 and 10).
- **Task 9**, which adds the outer-loop row `Object.freeze({ file: DOCS_SEARCH_SERVER_SCRIPT_NAME, mode: 0o755, agentInvocable: false })` for `docs-search-server.sh` to `OUTER_LOOP_SCRIPTS` in `cli/src/generators/outerLoopScripts.ts`, and deliberately adds **no** `DENY_SCRIPT_BASENAMES` entry. So the launcher carries no profile entry and is still auto-allowed by the guard: it is started by the agent runner from `.mcp.json` and `exec`s `docs serve`, which only reads the docs corpus and writes the gitignored index, so nothing destructive is reachable through it.

**Where this task stops.** It edits comments and prose only. `DENY_SCRIPT_BASENAMES` and every executable line of the guard are unchanged. `docs/watcher.md` §2, which names the same left-allowed set from the CLI side, is Task 24's.

### Targets

- `plugin/agents/README.txt`
- `plugin/README.md` — the sentence *"The outer loop — `init`, `doctor`, `config` and `daemon` — is not here"*.
- `plugin/hooks/autonomous-script-allowlist-guard.sh` — the header comment *"LEFT ALLOWED, DELIBERATELY: `create-worktree.sh`, `setup-worktree.sh`, `autonomous-notify.sh`, `autonomous-format-stream.sh` and `scratch-run.sh`."* (story index `## Scope register` row 55).
- `plugin/hooks/README.md` → `## The deny list`, the sentence *"The other outer-loop scripts written into the same directory — `create-worktree.sh`, `setup-worktree.sh`, `autonomous-notify.sh`, `autonomous-format-stream.sh`, `scratch-run.sh` — stay allowed"* (register row 54).

**Work:**

- [ ] `plugin/agents/README.txt`: after the paragraph on the browser-automation allowlist, add a plain-text section in the file's existing style (a heading line, then wrapped prose, no Markdown fence). It covers:
  - **The ten.** The docs-retrieval search tool `mcp__harness-docs__search_docs` is granted to exactly these ten agents, listed by file name.
  - **The rule.** State the set's rule without its provenance: *"The set is every plan writer, every plan reviewer and every end-of-branch reviewer; the per-unit `layer-reviewer`, the implementers, the committer, `docs-writer` and the interactive-test agents are excluded."* Name no branch, no user answer and no `harness-runs/` path. The run record that settled the set belongs to this repository in its role as an adopter and does not ship with the plugin (`.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`; `.claude/context/plugin.md` → `## What this layer is`).
  - **Always named.** Each allowlist names the tool whatever the configuration, and each contract's `<docs_retrieval>` row and bullet tell the agent to ignore it unless `phases.docs` and `docs.retrieval` are both true.
  - **Unlike the browser tools, no deny.** No `permissions.deny` entry is involved: the unattended profile allows it only when retrieval is on (`cli/templates/claude/settings.autonomous.retrieval.json`).
  - **One wire.** The server name and tool name are owned by `cli/src/retrieval/server.ts` (`DOCS_SERVER_NAME`, `SEARCH_TOOL_NAME`), so renaming either is an edit to the ten agent files, that module and the two CLI templates. Give the re-derive command `grep -rln "mcp__harness-docs__search_docs" plugin/agents`, whose output must be exactly the ten.
- [ ] `plugin/README.md`: change the sentence to *"The outer loop — `init`, `doctor`, `config` and `daemon` — and the opt-in docs-retrieval verb `docs` are not here; they ship as the sibling `cli/` package."*, keeping the rest of the paragraph.
- [ ] The left-allowed set, in both places that enumerate it, kept in agreement:
  - `autonomous-script-allowlist-guard.sh` header: the *LEFT ALLOWED, DELIBERATELY* list becomes `create-worktree.sh`, `setup-worktree.sh`, `autonomous-notify.sh`, `autonomous-format-stream.sh`, `docs-search-server.sh` and `scratch-run.sh`. Keep *"The last one executes an ARGUMENT"* true by leaving `scratch-run.sh` last, and add one clause for the launcher: it is started by the agent runner from `.mcp.json`, not by a dispatched agent, and reaches only the read-only `docs serve`.
  - `plugin/hooks/README.md` → `## The deny list`: add `docs-search-server.sh` to the same parenthetical list, before `scratch-run.sh`, so *"The last of them executes an argument"* still names the scratch runner.

**Verification:**

- `grep -rln "mcp__harness-docs__search_docs" plugin/agents` lists exactly the ten files the new `README.txt` section names. Compare the two lists entry by entry.
- `grep -rn -e "feat_docs_catalog_retrieval" -e "answer_[0-9]" -e "clarifications/" plugin/agents` is empty.
- `ls plugin/agents` still shows `README.txt` and no `README.md` (`.claude/context/conventions.md` → `## Plugin asset authoring`), and `claude plugin validate --strict plugin` passes.
- The new section cites `cli/src/retrieval/server.ts` by repo-relative path, not by a `${CLAUDE_PLUGIN_ROOT}` path (`.claude/context/plugin.md` → `## Citation`).
- `grep -n "docs-search-server.sh" plugin/hooks/autonomous-script-allowlist-guard.sh plugin/hooks/README.md` returns a hit in the guard's *LEFT ALLOWED* comment and one in the deny-list section's allowed list; `git diff plugin/hooks/autonomous-script-allowlist-guard.sh` touches only lines beginning with `#`, and `DENY_SCRIPT_BASENAMES` still holds exactly its four entries.
- `bash scripts/test.sh` and `bash scripts/run-gates.sh` exit zero with the same results as before this task (the guard's behaviour is unchanged).
