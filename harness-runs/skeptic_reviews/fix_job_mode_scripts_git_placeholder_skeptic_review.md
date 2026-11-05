# Skeptic Review: fix_job_mode_scripts_git_placeholder

## Context

**Branch:** `fix_job_mode_scripts_git_placeholder`
**Date:** 2026-11-05

**What was reviewed.** The whole branch diff against `defaultBranch` `dev`, read as `origin/dev...HEAD` because this checkout holds no local `dev` ref: 45 files. 18 run-artifact files were excluded from the reviewed diff. The review was adversarial and covered four areas:

- **F15, route (a).** `hr_script_root` and its eight library-sourcing callers, the inline mirror in the four wrapper templates and their rendered copies, the launcher header and the `protectedPaths` doc comment.
- **F15 tests.** The runner-git shim and its suites.
- **PD31.** The probe-written `/proc` scripts and `sp_session --token-file`.
- **JS3.** The stalling plant in `default-branch.sh`.

The claimed spec came from the task prompt and the story index. Findings were de-duplicated against the committed code review `harness-runs/code_reviews/fix_job_mode_scripts_git_placeholder_code_review.md` and its three findings, all now `[x]`. No parity review exists (`phases.parity` is `false`), and no architecture branch review for this branch was found.

**What was verified first-hand.**

- **Every root placement is covered.** Every script under `cli/templates/scripts` that placed its root by git's discovery from its own directory now goes through `hr_script_root` or the inline walk. The only placements left on the old route are the wrappers' own fallbacks and the `$PWD`-anchored callers (`flow-walker.sh`, `run-analytics.sh`, `remote-run.sh`, `task-offer-check.sh`).
- **Job mode.** The walk asks git only at directories holding `harness.config.json`, so in job mode it never starts discovery at the `<scriptsDir>/.git` placeholder.
- **Clone layout.** The clone layout's answer is unchanged.
- **Planted files.** A planted `<scriptsDir>/harness.config.json` cannot be confirmed without a `.git` beside it. `protectedPaths` write-protects that `.git` at every `scriptsDirLevels` level, and `hr_wrapper_main_of` is untouched.
- **PD31 wiring.** `--token-file` is wired: the rewrite happens in the launching subshell before `exec`, and status 96 is handled. The graders judge the `bash <file>` call the session actually makes.
- **JS3's reset.** `scratch/` is git-ignored and the watcher runs no `git clean`, so JS3's marker survives the reset.

**Headline.** The F15 fix and the PD31 wiring hold up. There are two net-new findings, both Should Fix. One is a JS3 justification the watcher's code does not support. The other is a self-adopted script comment this branch made false. There is no Must Fix.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Reword `scripts/run-gates.sh`'s anchoring comment so it no longer claims the wrappers' derivation _(layer: general)_
2. [ ] **Finding 1** — Restate JS3's busy-CPU justification in `default-branch.sh`'s header: the guard sums the whole process tree, and on Linux that sum is unmeasured _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. JS3's plant credits the idle `node` call alone with keeping the watchdog's busy-CPU guard closed, but the guard sums the run's whole process tree
→ [finding_1.md](fix_job_mode_scripts_git_placeholder_skeptic_review/finding_1.md)

### 2. `scripts/run-gates.sh` still says it uses "the same derivation" as the wrappers `init` writes, which this branch changed
→ [finding_2.md](fix_job_mode_scripts_git_placeholder_skeptic_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section holds no parity divergence. Nothing in the branch is marked as an intentional divergence that needed check 4's two-leg test.
