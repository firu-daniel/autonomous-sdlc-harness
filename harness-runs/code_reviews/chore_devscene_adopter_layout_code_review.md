# Code Review: chore_devscene_adopter_layout

## Context

**Branch:** `chore_devscene_adopter_layout`
**Date:** 2026-11-12

**Diff base.** The configured `defaultBranch` is `dev`, but this checkout has no local `dev` branch. The diff was therefore taken against its remote-tracking ref (`git diff origin/dev...HEAD`). It covers 462 files (+2359 / −2338). 48 run-artifact files were excluded from the reviewed diff.

**What was reviewed.** The whole rename of the adopter-facing names from "harness" to DevScene, segment by segment:
- the configuration contract: `schemas/devscene.config.schema.json` and its negative fixtures, `cli/src/config/model.ts` and `check.ts`, and `docs/config.md`;
- the rest of `cli/src`, `cli/scripts` and `cli/templates` (the claude templates, script templates and workflow templates);
- the `cli/test` suites;
- `plugin/` (commands, agents, instructions, hooks, samples, docs);
- this repository's own `scripts/` (Gate 12, sandbox probe, command-spelling gate);
- `docs/`, `evals/`, `docs-retrieval-service/`, `examples/`, the root documents, `.gitignore` and `githooks/pre-push`.

The rules applied are `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md` and `harness-runs/lessons.md`.

**Headline conclusions.** Almost the whole rename is correct and consistent. What was checked and found in step:

- **Each owning constant changed once, in its owner:** `CONFIG_FILENAME`, `ANALYZE_COMMAND`, `TASK_OFFER_PATH`, `UNFILLED_STUB_MARKER`, `SETUP_PENDING_OPEN` / `SETUP_PENDING_CLOSE`, `MENTION_COMMAND_NAME` and `POLL_STATE_ARTIFACT_NAME`. Their template and plugin mirrors match.
- **Workflow run titles and their readers agree.** The templates' `run-name:` values match `remote-run.sh`'s title matching and the watcher's.
- **The `scriptsDir` default is now one value everywhere it is read:** `DEFAULTS`, the schema `default`, the run library, the script-allowlist guard and the four workflows. The absent-key warning and its prose are gone.
- **Kept names stay intact:** `harness-state`, `harness-task`, the concurrency groups, `harness-run-lib.sh`, `harness-config-lib.sh` and `autonomous-sdlc-harness`.
- **The frozen capture moved byte-identical.** All 28 renames into `examples/notes-app/devscene/` are R100.
- **The command-spelling gate passes.** `bash scripts/check-command-spelling.sh` exits 0.
- **Nothing new needs wiring.** Every added export is a renamed constant whose callers already existed. No test file was added, so no tree-guard registration is owed.
- **No sentence announces a rename.**

**Tests and the remaining *Done when* items.** The branch adds no test file. Whether the suites pass is for the Run gates phase to establish; this review runs none. The fresh-adoption *Done when* check (`init` in a scratch repository, then `doctor`) was **not run** in Task 35: `git init` was refused. Nothing here establishes it either.

**Not graded here.** The three conventions documents under `.claude/context/` and the `.claude/**` renders are assigned to the maintainer's hand edit and paste record. The self-adopted `scripts/` copies and the root `harness.config.json` are assigned to the cutover record.

**What is left.** One regression of the same lost-space kind as the architecture review's Finding 1, this time in the Gate 12 graders, which makes them unable to find any run. One planned self-adoption edit that never landed. One gap in the closing check's leftover list.

`phases.parity` is `false`, so there is no reference implementation and no parity check.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Restore the space in the Gate 12 graders' `devscene run <branch>` title match and their comments _(layer: general)_
2. [ ] **Finding 2** — Respell the three `harness.config.json` comment lines in this repository's `githooks/pre-push` _(layer: general)_
3. [ ] **Finding 3** — Add the three kept lines to Task 35's closing-check deliberate-leftover list _(layer: general)_

---

## Must Fix

### 1. The Gate 12 full-run and SB2 graders match `devscene run<branch>` with no space, so they never find a run
→ [finding_1.md](chore_devscene_adopter_layout_code_review/finding_1.md)

---

## Should Fix

### 2. This repository's `githooks/pre-push` still tells a reader to edit `harness.config.json`, and the cutover record never respells it
→ [finding_2.md](chore_devscene_adopter_layout_code_review/finding_2.md)

### 3. The closing check's deliberate-leftover list misses three kept lines, so its post-cutover invariant cannot hold
→ [finding_3.md](chore_devscene_adopter_layout_code_review/finding_3.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

This section is empty: `phases.parity` is `false`, so there is no reference implementation to diverge from.
