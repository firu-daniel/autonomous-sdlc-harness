### Task 24 — Add the launcher to `docs/watcher.md` §2's outer-loop table and left-allowed set

**Goal:** `docs/watcher.md` §2 carries the table introduced as *"**Outer-loop scripts** — this table"*, one row per shipped outer-loop file, and the paragraph that names which `no` rows the script-allowlist guard still auto-allows. Task 9 adds a file to that family, so give it a row and count it in that paragraph, in agreement with the guard's own header and `plugin/hooks/README.md`.

**Depends on:**

- **Task 9:** the `OUTER_LOOP_SCRIPTS` row `Object.freeze({ file: DOCS_SEARCH_SERVER_SCRIPT_NAME, mode: 0o755, agentInvocable: false })` for `docs-search-server.sh` in `cli/src/generators/outerLoopScripts.ts`, placed after `setup-worktree.sh`, always written, with no `DENY_SCRIPT_BASENAMES` entry. The script, `cli/templates/scripts/docs-search-server.sh`, is started by the agent runner from `.mcp.json` (Task 10's `harness-docs` server, `{"type": "stdio", "command": "bash", "args": ["<scriptsDir>/docs-search-server.sh"]}`), resolves `$(hr_cache_dir)/retrieval/runtime/node_modules/autonomous-sdlc-harness/dist/cli.js`, and either `exec`s `node <entry> docs serve --cwd <root>` or exits `1` with a stderr line naming `npx autonomous-sdlc-harness init`.
- **Task 17:** the guard's *LEFT ALLOWED, DELIBERATELY* comment and `plugin/hooks/README.md` → `## The deny list` now name six left-allowed scripts, in the order `create-worktree.sh`, `setup-worktree.sh`, `autonomous-notify.sh`, `autonomous-format-stream.sh`, `docs-search-server.sh`, `scratch-run.sh`.
- **Task 21:** `docs/retrieval.md` exists and owns the launcher's design (why `.mcp.json` names a repository script rather than a machine path).

### Targets

- `docs/watcher.md` §2 — the outer-loop table (story index `## Scope register` row 50) and the paragraph *"**Why only four carry a profile entry, and why that is not the reachability answer.**"* (row 51).

**Work:**

- [ ] The table: add a row after `setup-worktree.sh`, matching Task 9's table order: `` | `docs-search-server.sh` | Starts the docs-retrieval MCP server for the checkout it sits in, by `exec`ing the machine-shared runtime's `docs serve`; exits 1 naming `init` when no runtime is installed | the agent runner, from `.mcp.json`, when `docs.retrieval` is on | no | ``. Link `docs/retrieval.md` from the cell or the sentence after the table, not both.
- [ ] The paragraph: *"That guard auto-allows the other four `no` rows — `create-worktree.sh`, `setup-worktree.sh`, `autonomous-format-stream.sh` and `autonomous-notify.sh` — deliberately"* becomes the other **five**, adding `docs-search-server.sh`, and *"Those five are the left-allowed set"* becomes *"Those six"*. The heading clause *"Why only four carry a profile entry"* is unchanged, because the launcher's row is `no`.
- [ ] The paragraph's "who starts the rest" sentence: *"The rest are run by the watcher process or by a person, and three of them (plus the deploy wrapper) are **withheld by basename from the script-allowlist guard's allow**."* becomes *"The rest are run by the watcher process, the agent runner or a person — the agent runner starts `docs-search-server.sh` from `.mcp.json` when `docs.retrieval` is on — and three of them (plus the deploy wrapper) are **withheld by basename from the script-allowlist guard's allow**."* The clause from *"and three of them (plus the deploy wrapper)"* onward is kept word for word; the register matches Task 20's `docs/cli.md` §5 edit (the agent runner named as a third starter). Beyond the two counts, the *"Those six"* change and this sentence, change no other sentence in the paragraph or the section.

**Verification:**

- `grep -n "docs-search-server.sh" docs/watcher.md` returns the new table row and the paragraph's line.
- `grep -n "run by the watcher process or by a person" docs/watcher.md` is empty, and `grep -n "the agent runner or a person" docs/watcher.md` returns the §2 paragraph's line, which still contains *"three of them (plus the deploy wrapper)"*.
- Every row of `OUTER_LOOP_SCRIPTS` has a §2 table row: walk `grep -n "Object.freeze({ file:" cli/src/generators/outerLoopScripts.ts` (the launcher's row names `DOCS_SEARCH_SERVER_SCRIPT_NAME`, `harness-run-lib.sh` appears in the table as `lib/harness-run-lib.sh`) and match each entry by name against the table, rather than comparing counts.
- The left-allowed list in `docs/watcher.md` names the same scripts as `plugin/hooks/README.md` → `## The deny list` and the guard's *LEFT ALLOWED* comment: `grep -n "LEFT ALLOWED" -A2 plugin/hooks/autonomous-script-allowlist-guard.sh` and the paragraph agree name for name.
- `bash scripts/run-gates.sh` passes gate 6a (no machine paths): the row names `.mcp.json` and `docs serve`, never a cache path.

**Deviations from plan:**

- The table row links `docs/retrieval.md` → `## How it fits together` from its "What it does" cell (the plan allowed the cell or the sentence after the table).
- Gate 6a verification rests on the gate's hit list rather than a pass: `bash scripts/test.sh` exited 1 with 6a as its only failure, and every hit is outside this task's diff — the worktree's untracked `.git` pointer file, `harness-runs/scratch/task6-test.log` and `harness-runs/improvement_observations/feat_readme_summary_compact_llms_txt.md`. No hit names `docs/watcher.md`.
