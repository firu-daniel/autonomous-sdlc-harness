# Skeptic Review: fix_linux_sandbox_sibling_glob_trio

## Context

**Branch:** `fix_linux_sandbox_sibling_glob_trio`. **Date:** 2026-10-30.

**What was reviewed.** The whole branch diff against `dev`, taken from `origin/dev` because this run copy has no local `dev` ref. That covers:

- the run library's `hr_deny_glob_expand` and `hr_profile_deny_paths`;
- the watcher's `run_profile_glob_drops`, the sibling lines of `run_profile_entries`, and the drop-aware `run_profile_render`, `run_profile_check` and `spawn_engine` manifest;
- the `_README`, the template and `doctor` wording;
- `scripts/sandbox-absent-path-check.sh`;
- `docs/sandbox-verification.md`, `docs/cli.md` §6, `docs/watcher.md`, Gate 15 and the upstream report.

20 run-artifact files were excluded from the reviewed diff.

**De-duplicated against:** `harness-runs/code_reviews/fix_linux_sandbox_sibling_glob_trio_code_review.md` and its Findings 1–4, all applied. No parity review ran (`phases.parity` is `false`), and no architecture review exists for this branch.

**Checks that passed:**

- **Wiring.** Every new function has a live caller. The sandbox probe renders through the watcher's own `run_profile_render` and `run_profile_check` (`scripts/lib/sandbox-probe/session.sh` → `sp__render`), so the owed re-take exercises the real route.
- **Self-adopted copies.** The `scripts/` copies are byte-identical to their templates.
- **Job mode.** The job-mode reasoning in the code review holds.

**Headline.** The route is wired correctly. But the branch's own decision rule calls the owed re-take a control run, and it is not one: the per-run profile still names the clone's trio in `Edit` deny rules. This repository's CL2–CL4 rows measured that an `Edit` deny rule alone acts on sandboxed commands. If the re-take still fails, the rule as written would misattribute the cause.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Stop calling the re-take a control while the trio's `Edit` deny rules remain, and name them as a candidate source in *The decision rule* _(layer: general)_

---

## Must Fix

### 1. *The decision rule* calls the owed re-take "the control run AP2 lacked", but the per-run profile still names the clone's trio in `Edit` deny rules
→ [finding_1.md](fix_linux_sandbox_sibling_glob_trio_skeptic_review/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Intentional divergences / call-outs

- **Re-rooting instead of dropping.** The prompt suggested dropping the sibling-glob trio. The story index re-roots it instead, because dropping it would leave sibling clones writable from the sandbox through the base's `Edit(/<worktree_glob>/**)` allow. Graded on both legs, this holds:
  - The prompt itself framed its suggestion as one to verify, not a constraint.
  - No other code in this project already handles this case differently.
  - The costs that remain are written out in `docs/cli.md` §6, residual 12.
