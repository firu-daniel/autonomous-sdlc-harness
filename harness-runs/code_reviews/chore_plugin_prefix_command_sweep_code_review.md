# Code Review: chore_plugin_prefix_command_sweep

## Context

**Branch:** `chore_plugin_prefix_command_sweep`
**Date:** 2026-09-17
**Reviewed:** the whole branch diff against `dev`: 74 files. That covers:
- the `ENGINE_COMMAND_*` measurement comment and its `scripts/` mirror (Tasks 1 and 9)
- the analyze-command respelling across `init`, detection, `doctor`, the stub footers and their suites (Tasks 2–5), plus the architecture-review follow-up that moved `PLUGIN_NAME` and `ANALYZE_COMMAND` into `cli/src/core/pluginIdentity.ts`
- the plugin commands, instructions, agents, READMEs and samples (Tasks 6–8)
- the reference docs, schemas and example README (Task 10)
- `docs/development.md` with the gate-6d contract and the closed debt paragraph (Task 11)
- `README.md`, `llms.txt`, `ARCHITECTURE.md` and `ROADMAP.md` (Task 12)
- `scripts/check-command-spelling.sh` wired as gate 6d (Task 13)

23 run-artifact files excluded from the reviewed diff.

**Verification:** `bash scripts/test.sh` ran from this checkout. 13 of 14 automatable gates passed, including gate 2's build, gate 4's full `node --test` suite and the new gate 6d. The one failure is `6a no machine paths`, and none of its hits comes from this branch's diff:
- the worktree's own untracked `.git` pointer file
- an untracked `harness-runs/scratch/t3npm.log`
- `harness-runs/improvement_observations/feat_readme_summary_compact_llms_txt.md`, which was already on `dev`

Run on its own, `bash scripts/check-command-spelling.sh` exits 0 with no output. `cli/templates/scripts/autonomous-watcher.sh` and `scripts/autonomous-watcher.sh` are byte-identical.

**What else was checked:**
- **Code literals.** Every slash spelling in `cli/src` code is built from `ANALYZE_COMMAND`. Every other qualified occurrence there is a comment.
- **Callers.** Both new exports in `core/pluginIdentity.ts` have callers outside their file.
- **Command names.** Each command the sweep qualified exists under `plugin/commands/`.
- **Parsers.** No hook or watcher library parses a command name out of a STOP message or a binding value.
- **Parity.** `phases.parity` is `false`, so no parity check ran.
- **Lessons.** The ledger's one lesson, *"Every command an adopter is meant to run sits in a fenced block, one command per line"*, was run over every line this branch added to `README.md`, `llms.txt`, `docs/analyze.md`, `docs/cli.md`, `docs/config.md`, `docs/watcher.md`, `examples/notes-app/README.md`, `cli/templates/claude/README.md` and `plugin/README.md`. It was also run over `docs/development.md`. One mention fails: the `branch-prompt` route in `README.md` → **E.** (Finding 5). The Task 12 respelling of `harness-analyze <target>` under **C.** is in a fenced block, as are the step-3 blocks in `README.md` and `llms.txt`, so those pass. The other inline mentions pass for these reasons:
  - **Referents, not commands to run.** Most mentions name a command without telling the reader to run it. In `README.md` these are the Mermaid labels, the plugin paragraph, "on a yes it invokes", the measurement bullet and the `docs/analyze.md` link line. The rest are `docs/analyze.md` (reader, cost and dispatch paragraphs), `docs/config.md` (`detection.review`), `docs/watcher.md` (the drop, the status vocabulary and the table's resolution cells), `examples/notes-app/README.md`, `cli/templates/claude/README.md` and `plugin/README.md`.
  - **`docs/cli.md`.** The `--analyze` row and the fallback-row warning are referents. The "second step" paragraph sets out the grammar of the step `init` prints. The command an adopter runs is fenced under `README.md` → **C.**
  - **`llms.txt`.** The intro sentence "Its setup command is ..." names the command for a model choosing a document. The runnable form is the fenced step-3 block right below it.
  - **`docs/development.md`.** Gate 8's Run 1 and Run 2 bullets are contributor procedure, not adopter-facing documentation. The commands that gate runs are fenced in its own block.

Per-unit review is off for this run: `harness-runs/task_plan_point_reviews/chore_plugin_prefix_command_sweep_task_plan/` does not exist, so Pass 2 reconciled nothing.

The five findings below are what is left. Three are prose or comments that no longer match the code or contract beside them. One is a leftover re-export. One is an adopter command left inline, against the lessons ledger.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom, and the committer flips each one to `[x]` as that fix's commit lands. **Only the committing role flips a marker.** `[ ]` markers anywhere else, such as sub-step bullets inside per-finding files, are informational only. They are never the iteration source, and the committer does not touch them.

Each entry resolves to `harness-runs/code_reviews/chore_plugin_prefix_command_sweep_code_review/finding_<K>.md` through its `**Finding K**` reference. The leading `N.` is the fix order. `K` is the finding's stable identity.

1. [x] **Finding 2** — Repoint `init`'s two "not established" citations from `ANALYZE_COMMAND` to `ANALYZE_INVOCATION` _(layer: cli)_
2. [x] **Finding 4** — Load `PLUGIN_NAME` from `core/pluginIdentity.js` in `doctor.test.mjs` and drop the test-only re-export from `projectSettings.ts` _(layer: cli)_
3. [x] **Finding 5** — Move the README's `branch-prompt` route out of prose into a fenced block, with its task-description argument _(layer: general)_
4. [x] **Finding 1** — Name the watcher header mapping comment and the `docs/watcher.md` engine-command cells in gate 6d's documented carve-outs _(layer: general)_
5. [ ] **Finding 3** — Qualify the README's "every command in this tree is documented with the plugin prefix" by pointing at gate 6's carve-outs _(layer: general)_

---

## Must Fix

### 5. The README's `branch-prompt` route is still an inline command in a sentence this branch rewrote
→ [finding_5.md](chore_plugin_prefix_command_sweep_code_review/finding_5.md)

---

## Should Fix

### 1. Gate 6d's documented carve-outs omit two exemption classes the script actually holds
→ [finding_1.md](chore_plugin_prefix_command_sweep_code_review/finding_1.md)

### 2. `init`'s "not established" claims cite `ANALYZE_COMMAND`, whose doc comment no longer holds that evidence
→ [finding_2.md](chore_plugin_prefix_command_sweep_code_review/finding_2.md)

### 3. The README says every command in the tree carries the prefix, while the gate-6d carve-outs still document bare spellings
→ [finding_3.md](chore_plugin_prefix_command_sweep_code_review/finding_3.md)

---

## Nice to Have

### 4. `projectSettings.ts` re-exports `PLUGIN_NAME` only so a test can keep loading it from a module that no longer owns it
→ [finding_4.md](chore_plugin_prefix_command_sweep_code_review/finding_4.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

These are NOT fixes and do NOT appear in the Phase 2 Readiness list. `phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
