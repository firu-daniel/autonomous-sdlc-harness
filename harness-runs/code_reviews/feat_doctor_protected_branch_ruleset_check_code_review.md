# Code Review: feat_doctor_protected_branch_ruleset_check

## Context

**Branch:** `feat_doctor_protected_branch_ruleset_check`
**Date:** 2026-11-09
**Reviewed:** the whole branch diff against `dev`. This run copy has no local `dev`, so the base resolved as the remote-tracking ref `origin/dev`. The diff covers:

- the new pure grading module `cli/src/doctor/branchProtection.ts` (Task 1);
- the `branch-protection` check in `cli/src/doctor/checks.ts`, registered after `forge` (Task 2), including the two architecture-review fixes `6eccb3ef` and `44487562`;
- the `--check-github` help text in `cli/src/commands/doctor.ts` and `cli/README.md` (Task 3);
- the end-to-end suite `cli/test/doctor-branch-protection.test.mjs` and the unit suite `cli/test/branch-protection.test.mjs` (Tasks 1 and 4), plus the one-id change to `cli/test/doctor.test.mjs`;
- `docs/cli.md` §6 and §7 and `docs/config.md` §5 (Task 5).

They were read against `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md` and `harness-runs/lessons.md`. 11 run-artifact files excluded from the reviewed diff.

**Headline conclusions.** The design holds:

- **Layering.** Grading is pure and lives in its own module, whose header states the rule it enforces. The check gathers through the existing `runGh` / `classifyGh` / `ghCli`, and takes the protected set from `resolveProtectedBranches` / `isGlobPattern`.
- **Grades and reads.** Every arm grades `pass` or `warn`, and `unevaluated` is never used. Every `gh` call is `auth status` or a plain `api` GET, and none is made without `--check-github` or with a `forge` other than `github`.
- **Wiring.** `CHECKS` registers the check, so no new export is dead. The code calls no `console`, spawns `git` nowhere outside `core/git.ts`, and nothing crosses into `plugin/`.

**Tests.** Both new suites are present. Together they drive all four answer families the task prompt names (covered, not covered, partially covered, unreadable) through the compiled CLI with a stubbed `gh`, and each case asserts no write flag, no `FAIL` line and exit 0. Whether the suites pass is for the Run gates phase to establish: this review ran no suite. Neither new suite reads the source tree, so neither needs a `treeGuards` entry.

**Parity** is off (`phases.parity` is `false`), so there is no parity review.

Four Should Fix findings remain. A full page of 100 rules is read as the complete answer. Every unreadable classic read is blamed on admin access. The new docs bullet over-claims what a pass proves. And one `docs/cli.md` §7 sentence the branch falsified, but which the scope register did not list, is still stale. Pass 2 found no per-unit review folder for this branch (`harness-runs/task_plan_point_reviews/feat_doctor_protected_branch_ruleset_check_task_plan/` does not exist), so there was nothing to carry over.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 4** — Name `branch-protection` beside `remote-github` in `docs/cli.md` §7's "Nothing is repaired" network-reach sentence _(layer: general)_
2. [x] **Finding 3** — State in `docs/cli.md`'s `branch-protection` bullet that a pass does not grade ruleset bypass actors _(layer: general)_
3. [x] **Finding 2** — Append the admin-access note only to a refused classic read, not to a timeout or an unreachable GitHub _(layer: cli)_
4. [ ] **Finding 1** — Grade a full page of 100 ruleset rules that does not settle the branch as *cannot tell*, not as *missing* _(layer: cli)_

---

## Must Fix

_None._

---

## Should Fix

### 1. A full page of 100 ruleset rules is read as the whole answer, so a branch can be reported *missing* when it could not be told
→ [finding_1.md](feat_doctor_protected_branch_ruleset_check_code_review/finding_1.md)

### 2. Every unreadable classic read is blamed on admin access, timeouts and network failures included
→ [finding_2.md](feat_doctor_protected_branch_ruleset_check_code_review/finding_2.md)

### 3. The `branch-protection` severity bullet says a ruleset cannot be got around, and never says a pass ignores bypass actors
→ [finding_3.md](feat_doctor_protected_branch_ruleset_check_code_review/finding_3.md)

### 4. `docs/cli.md` §7 still lists `remote-github` as the only check whose `gh` queries `--check-github` turns on
→ [finding_4.md](feat_doctor_protected_branch_ruleset_check_code_review/finding_4.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

This section is empty: `phases.parity` is `false`, so there is no reference implementation to diverge from.
