# Code Review: chore_devscene_github_surface

## Context

**Branch:** `chore_devscene_github_surface`
**Date:** 2026-11-11
**Reviewed:** the whole branch diff against the default branch `dev`, compared at `origin/dev` because this run copy has no local `dev` ref. Merge base `2a0699fc`, 38 commits, 100 files. Segments:
- the constants in `cli/src/remote/githubActions.ts` (Task 1);
- the four renamed workflow templates (Task 2);
- the `remote-run.sh` template and the other script templates (Tasks 3–4);
- the workflow generator with the 0.6.1 `if:` line, its digest and the fixture (Task 5);
- the rest of `cli/src` and `cli/README.md` (Task 6);
- the cli suites (Tasks 7–14 and 19);
- the plugin assets (Task 15);
- the self-adopted script copies, `.gitignore`, the rendered-workflows gate, the release and probe scripts and the Gate 12 round library (Tasks 16–18);
- the root documents and `docs/` (Tasks 20–24).

30 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**
- **The rename is complete against the spelling table.** The story's D1 sweep was re-run across the whole tree, `cli/src` and `cli/test` included. Its only hits outside `harness-runs/` and the 0.6.1 fixture are the `harness-resume` concurrency group, which the story keeps, and the `harness-run-lib` / `harness-run-<branch>` / `harness-control-<id>` names the table does not list.
- **Every bare `sdlc-harness` left names the `stateDir` default or the earlier product name.** That covers D2 widened to `cli/` and a case-insensitive sweep.
- **The mirror pairs agree byte for byte.** `COMMAND_HANDLE`, `COMMENT_MARKER`, `STATE_LABEL_PREFIX`, `DEFAULT_TRIGGER_LABEL` and the four `WORKFLOW_*_FILE` values agree between `githubActions.ts`, `remote-run.sh`, `HR_REMOTE_WORKFLOW_RUN_FILE`, `PIS_RE_ROUND_MARKER` and the workflow `if:` lines.
- **The self-adopted copies are byte-identical to their templates.** All five pairs share a blob id, and each copy keeps its file mode.
- **The disclosure sentence is placed correctly.** It appears exactly once in each of the ten `docs/` files whose respelled lines carry a date, a version or a round, in the position the story fixes. `docs/config.md`, `docs/watcher.md` and the four `rag-extraction-research` files carry none and owe none.
- **No new exported symbol is added**, so the Pass 0 caller check is clean.
- **The Pass 0 grep half did not run.** Its sweep list in this agent's definition is still the unfilled stub, so that half is disabled. That is a configuration gap, not a clean sweep.
- **Tests.** Every edited suite was respelled in step with its producer. This review runs no suite, and whether they pass is the Run gates phase's to establish. The flow ledger's `G.` entry is still open.
- **Parity.** `phases.parity` is `false`, so no parity review applies.

Two Should Fix findings remain. A third item, the migration story for a repository wired before the rename, needs a maintainer decision and is returned as a question rather than filed here.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — State why the handle is `@dev-scene`, hyphenated, in `docs/github-run-control.md`'s handle paragraph _(layer: general)_
2. [ ] **Finding 2** — Describe `LEGACY_TRIGGER_LABEL` as an earlier release's default, not the previous release's, in `githubActions.ts` and both copies of `remote-run.sh` _(layer: cli, general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The handle paragraph still argues the old handle's choice and never says why `@dev-scene` is hyphenated
→ [finding_1.md](chore_devscene_github_surface_code_review/finding_1.md)

### 2. `LEGACY_TRIGGER_LABEL` is still described as "the previous release's" default, which this branch made false
→ [finding_2.md](chore_devscene_github_surface_code_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section carries no parity call-out.
