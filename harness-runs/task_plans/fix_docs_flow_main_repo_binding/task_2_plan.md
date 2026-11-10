### Task 2 — Bind `<MAIN_REPO>` in the docs fork's table and point the docs phase at the main checkout's wrappers

**Goal:** Make the docs-catalog fork, `plugin/instructions/docs_orchestration_instructions_autonomous.md`, declare `<MAIN_REPO>` in its `## Resolved values` table. Its push fence under `## Commit mechanics (single source of truth)` already demands literal spelling, but the binding does not, so the two disagree today. Also make `plugin/instructions/docs_phase_instructions.md` name the push only as the main checkout's copy, as spelled in that fence.

**Where this task stops.** It changes no word of the resolution clause. The clause moves from `## Setup (once, at session start)` step 1 into the new row, and its count in the file stays what it was. It does not touch the fences under `## Commit mechanics (single source of truth)`, which are already literal. `docs_phase_instructions.md` declares neither `<MAIN_REPO>` nor `<repo_root>`. Its `<scripts_dir>` row says the runnable form "lives in" the docs fork's `## Commit mechanics (single source of truth)` "and is not restated here". So this task names the main checkout's copy **in words** and points at that section. It introduces no token there.

### Targets

- `plugin/instructions/docs_orchestration_instructions_autonomous.md`
- `plugin/instructions/docs_phase_instructions.md`

**Work:**

- [ ] **`docs_orchestration_instructions_autonomous.md`, the row.** Insert the `<MAIN_REPO>` row into `## Resolved values`, immediately after the `<repo_root>` row. Copy it **byte for byte** from `plugin/agents/committer.md` → `## Resolved values` (the line beginning ``| `<MAIN_REPO>` | derived at runtime |``).
- [ ] **`docs_orchestration_instructions_autonomous.md`, the lead paragraph and Setup step 1.** Remove `<MAIN_REPO>` from the "ordinary **path placeholders**" list in the paragraph above the table. In `## Setup (once, at session start)` step 1, **Paths (Override-A equivalent).**, the sentence "`<MAIN_REPO>` (for the global kill switch and the commit and push wrappers) is the path a bare …" resolves the token inline. Replace it with "`<MAIN_REPO>` (for the global kill switch and the commit and push wrappers) resolves per its `## Resolved values` row."
- [ ] **`docs_phase_instructions.md`, `## Loop` step 2, **Commit + push.**** Rewrite the bullet to say that the doc and any accumulator are staged through the main checkout's copy of `commit-on-branch.sh`, then pushed through the main checkout's copy of `push-branch.sh` as a separate, **ungated** statement, both spelled exactly as the docs-catalog engine's `## Commit mechanics (single source of truth)` fences spell them. Keep the subject `docs: <new|update> <doc_title>` and the "never gated on the wrapper's exit code" rule.
- [ ] **`docs_phase_instructions.md`, `## Commit mechanics`.** Change "the `commit-on-branch.sh` wrapper only" and "then `push-branch.sh` issued unconditionally" so that each names the main checkout's copy. Keep the existing pointer to `${CLAUDE_PLUGIN_ROOT}/instructions/docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)` and the no-exit-code-gate clause.

**Verification:**

- Before editing, run `git grep -c -F "printenv HARNESS_MAIN_REPO" -- plugin/instructions/docs_orchestration_instructions_autonomous.md`. Run it again after editing. The count must be unchanged.
- `git grep -h -F '| `<MAIN_REPO>` |' -- plugin/agents/committer.md plugin/instructions/docs_orchestration_instructions_autonomous.md` must print two identical lines.
- `git grep -n -F push-branch.sh -- plugin/instructions/docs_phase_instructions.md` must print only lines that name the main checkout's copy.
- `git grep -n -F "<MAIN_REPO>" -- plugin/instructions/docs_phase_instructions.md` must print no hits, because the docs phase binds no such token.
- `git diff --name-only` lists only this task's two targets.
