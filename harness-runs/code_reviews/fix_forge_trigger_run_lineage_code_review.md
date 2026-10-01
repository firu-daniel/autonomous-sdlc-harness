# Code Review: fix_forge_trigger_run_lineage

## Context

**Branch:** `fix_forge_trigger_run_lineage`
**Date:** 2026-10-01
**Reviewed:** the whole branch diff against `dev` (20 files, +987 / −206). That covers the `headSha` lineage bound on `remote-run.sh restore` (`lineage_commits_var`, `previous_bundle_run`), the trigger comment's `headSha` lookup (`trigger_run_url`) and the run-history "taken" reason (`hr_branch_run_history`, `hr_branch_taken_judge`, `hr_derive_branch`). It also covers the shared scratch-path test `hr_scratch_path_var` and its two callers (`scratch-run.sh`, the new `remote-run.sh discard`), the `remote-github` / `forge` doctor changes, the four `branch-*` commands' scratch-directory sequence, the two state-directory README templates, the documents of record under `docs/`, and the suites that ship with them. 18 run-artifact files were excluded from the reviewed diff.

Every changed behaviour has an accompanying suite case: the four lineage cases and the edited planning-restore case in `cli/test/remote-run.test.mjs`, the two trigger-lookup cases and the two run-history cases in `cli/test/remote-trigger.test.mjs`, the four naming cases in `cli/test/branch-naming.test.mjs`, the three doctor cases in `cli/test/doctor.test.mjs`, the five `discard` cases, and the added scratch-runner refusal in `cli/test/outer-loop-scripts.test.mjs`. This review runs no suite; whether those cases pass is for the Run gates phase to establish. The Pass 0 caller check found a caller outside the defining file for each new shell function (`hr_scratch_path_var`: `scratch-run.sh`, `remote-run.sh`; `hr_branch_run_history`: `hr_branch_taken_judge`). `cli/src` exports no new TypeScript symbol. The Pass 0 grep half has no regexes filled in, so it ran nothing. `phases.parity` is `false`, so no parity cross-check ran.

**The `plugin` layer passes clean.** The branch touches four files there: `plugin/commands/branch-answer.md`, `branch-pause.md`, `branch-resume.md` and `branch-user-review.md`. Each was checked against these rules:
- `.claude/context/plugin.md` → `## The sections an asset carries` and `## The placeholder vocabulary`. In each command, the `## Resolved values` preamble lists `<branch_fold>` and `<scratch>` as path placeholders and names the step that resolves them. That is step 8 in `branch-answer.md` (step 2 hands off to step 8's scratch sequence) and step 2 in the other three. The body defines both tokens at that step and spells them the same way everywhere else. The retired `<tmp>` / `<tmpfile>` tokens were removed from every preamble and body, and a grep of `plugin/commands/branch-*.md` for `<tmp>`, `<tmpfile>` and `mktemp` returns nothing. Each `<scripts_dir>` row is still the three-column `config value` row. Its verb list now includes `discard` and matches the verbs and steps the body invokes, and each closing scope fence lists the same verbs.
- `.claude/context/plugin.md` → `## Wires: dispatch in, return out`. The commands call `discard <scratch>` with one repo-relative directory from the checkout root, which matches the `remote-run.sh discard <dir> [--repo <root>]` usage in `cli/templates/scripts/remote-run.sh` and its rule that a relative `<dir>` resolves against the caller's directory. The commands treat any non-zero exit as "report its message", which covers every outcome of `verb_discard`: 0 for removed or absent, 1 for an unresolvable parent or a failed removal, 2 for a refusal. `<scratch>` is `<state_dir>/scratch/<command>-<branch_fold>`, where `<branch_fold>` is limited to `A-Za-z0-9_-`. So it lies strictly inside scratch and inside `hr_scratch_path_var`'s accepted character set. `fetch` still receives the unfolded `<branch>`, and its `<out_dir>` is the freshly made, empty `<scratch>`, which is the precondition `fetch` requires.
- `.claude/context/conventions.md` → `## Shell assets`. None of the four commands types a recursive `rm`, because the removal is `discard`'s. Every new command (`mkdir -p <scratch>`, `bash <scripts_dir>/remote-run.sh fetch|discard|review|dispatch …`) is stated as a literal, with no `$(…)`, pipe or shell variable, and each command says so explicitly. The review file and the answer files are written with the Write tool rather than through a redirection. A `<scratch>` left over from an earlier invocation is reported and never removed, which follows the rule against removing a directory this invocation did not create.
- `.claude/context/plugin.md` → `## What this layer is`. No adopter value appears as a literal. `<state_dir>`, `<scripts_dir>`, `<branch>` and `<engine>` remain placeholders. `scratch/` and the `branch-<command>-` prefixes are harness-owned names, not configuration values. `feat/recent_searches_panel` is an illustrative fold example of the same kind as the files' existing `feat_settings_search` usage examples.

The four findings below are what is left. Pass 2 found no per-unit review files under the supplied root, so it carried nothing over.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 4** — Name `hr_branch_run_history` among the consumers of `HR_REMOTE_WORKFLOW_RUN_FILE` in the run library's bundle-format header _(layer: cli)_
2. [x] **Finding 1** — Make Gate 12 (xiii) leg (d) stop `<slug>_2`'s run and wait for it to finish before deleting the branch _(layer: general)_
3. [x] **Finding 2** — Qualify the "every `remote-github` outcome" claim for the trigger answers, which early returns contradict _(layer: cli, general)_
4. [ ] **Finding 3** — Make `remote-run.sh discard` refuse a target that is not a directory, so it cannot delete `scratch/README.md` _(layer: cli)_

---

## Must Fix

### 1. Gate 12 (xiii) leg (d) deletes `<slug>_2` while leg (a)'s run on it is still in flight, so its pass condition is unreachable
→ [finding_1.md](fix_forge_trigger_run_lineage_code_review/finding_1.md)

---

## Should Fix

### 2. Three texts say both trigger answers appear on every `remote-github` outcome, but the check returns before asking about the trigger when `gh` is not authenticated or cannot run
→ [finding_2.md](fix_forge_trigger_run_lineage_code_review/finding_2.md)

### 3. `remote-run.sh discard` removes any non-symlink path inside scratch, including the committed `scratch/README.md`, although its header says scratch holds only throwaway files a session wrote
→ [finding_3.md](fix_forge_trigger_run_lineage_code_review/finding_3.md)

---

## Nice to Have

### 4. The bundle-format header still says `HR_REMOTE_WORKFLOW_RUN_FILE` is assigned for two GitHub-route producers only
→ [finding_4.md](fix_forge_trigger_run_lineage_code_review/finding_4.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section has no parity call-outs.
