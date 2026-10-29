# Skeptic Review: fix_clone_main_repo_resolution

## Context

**Branch:** `fix_clone_main_repo_resolution`
**Date:** 2026-10-29
**Reviewed:** the whole branch diff against the default branch, from an adversarial posture. `defaultBranch` is `dev`, and this run copy has no local `dev` ref, so the base was `origin/dev`. The diff covers 40 files:

- the fence and offer templates;
- `plugin/instructions/main_repo_resolution.md`;
- the clone arm of `hc_main_root_var` / `hc_main_root` and the QA-lock helpers;
- the 22 `<MAIN_REPO>` clause swaps;
- the doctor and profile text;
- the four new or changed test suites;
- the docs;
- the tree-guard registration.

29 run-artifact files excluded from the reviewed diff.

**De-duplicated against:** `harness-runs/code_reviews/fix_clone_main_repo_resolution_code_review.md` and its five findings, and `harness-runs/architecture_reviews/fix_clone_main_repo_resolution/review_0.md` and `review_1.md`. `phases.parity` is `false`, so there is no parity review, and check 2's parity leg is inert.

**What was checked and held:**

- **Check 1 (wiring).** `hc_main_root_var` has both QA-lock helpers as callers. `hc_work_root`, `hc_project_name` and `hc_config_dir` exist and are keyed per root. All 22 clause sites carry the new pointer. The fence test reads its command out of the template at run time.
- **Check 2 (runtime address).** This clone's own `.git/objects/info/alternates` is the single line `/Users/daniel/Work/autonomous-sdlc-harness/.git/objects`. The main checkout's registry records `fix_clone_main_repo_resolution` as `copy_kind` `clone` at exactly this checkout's toplevel. `hr_worktree_dir`'s `<work_root>/<projectName>-<branch with / → ->` composes to the same path. So F3, F6 and F7 compose to a valid answer here.
- **Check 3 (citations).** These were opened and confirmed:
  - CL5 and its `blocked: F9` Linux row;
  - RG1;
  - the `objects/info/alternates` write-protection entry;
  - the profile's `Bash(git rev-parse:*)`, `Bash(git worktree:*)` and the two `Read(…/**)` rules;
  - `docs/guard-verification.md`'s dated `git log` claim, re-run to `HEAD` (still only `1d03a74a`).

**Headline:** one net-new Must Fix. A stale statement of the old fallback, in a section goal 6 names explicitly, was missed by the scope register's derivation greps.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Replace `docs/watcher.md` → **A session no launcher started.**'s "in a clone it is the clone itself" with the branch's outcome, pointing at **Read.** _(layer: general)_

---

## Must Fix

### 1. `docs/watcher.md` → **A session no launcher started.** still says the fallback "in a clone it is the clone itself", contradicting the **Read.** paragraph above it and the rule this branch ships
→ [finding_1.md](fix_clone_main_repo_resolution_skeptic_review/finding_1.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section has no reference-implementation divergences.
