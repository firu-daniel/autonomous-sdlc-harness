# Code Review: fix_clone_main_repo_resolution

## Context

**Branch:** `fix_clone_main_repo_resolution`
**Date:** 2026-10-29
**Reviewed:** the whole branch diff against the default branch. `defaultBranch` is `dev`. This run copy has no local `dev` ref, so the base was `origin/dev`, with merge base `74618b02`. The diff covers 40 files across three layers:

- **The fence and offer templates (Task 1):** `cli/templates/claude/CLAUDE.md` item 4 and `cli/templates/claude/harness-task-offer.md` answer 4.
- **The new module (Task 2):** `plugin/instructions/main_repo_resolution.md`.
- **The hook library and QA-lock helpers (Task 3):** the clone arm of `hc_main_root_var` / `hc_main_root` in `plugin/hooks/lib/harness-config-lib.sh`, and its callers `plugin/scripts/reserve-qa-user.sh` and `release-qa-user.sh`.
- **The clause swap (Task 4):** the 22 `<MAIN_REPO>` clause occurrences across 21 plugin files.
- **Doctor and profile text (Task 5):** the `profile-main-anchor` doc comment and message, and the profile `_README` line.
- **Tests (Tasks 6–8):** `cli/test/main-root-fallback.test.mjs`, `cli/test/task-offer-fence.test.mjs`, `cli/test/main-repo-resolution-corpus.test.mjs`, the helper `cli/test/helpers/run-copy-layouts.mjs`, and the rewritten case (f) plus new case (f2) in `cli/test/qa-user-locks.test.mjs`.
- **Docs (Tasks 9 and 10):** `docs/watcher.md`, `docs/cli.md`, `docs/guard-verification.md` and `docs/sandbox-verification.md` (rows AN5–AN6).
- **Tree-guard registration (Task 11):** in `harness.config.json`.

23 run-artifact files excluded from the reviewed diff.

**Headline conclusions:**

- **The shell halves hold up.** `hc_main_root_var` repeats `hr_clone_target_check_var`'s conditions 1, 2 and 4: the same `HEAD` parse, the same registry `jq` shape and the same `hr_sanitize_branch` derivation. It fails closed, runs no `git` in the clone, and its callers keep their exit-code contracts. The fence one-liner agrees with it in every fixture layout, under both bash and zsh.
- **Every required accompanying test is present, and the tree-reading corpus check is registered as a tree guard.** Whether the tests pass is for the Run gates phase to establish. This review ran no suite.
- **`docs/guard-verification.md`'s new dated claims were re-checked and hold.** `git log` over `plugin/hooks` lists only `1d03a74a`, and `grep -n 'hc_main_root' plugin/hooks/*.sh` exits 1.
- **Parity:** `phases.parity` is `false`, so there was no parity review.
- **Pass 0 (a)** ran with this agent's escape-class sweep table still an unfilled stub. That is a configuration gap and disables only that half.
- **Pass 0 (b)** found no new export without a caller outside its defining file, except two constants in a test helper. Those are not a consumed layer.
- **Pass 2:** `per_task_findings_root` (`harness-runs/task_plan_point_reviews/fix_clone_main_repo_resolution_task_plan/`) does not exist, so Pass 2 had nothing to reconcile.

**The one Must Fix is in the prose half.** In a linked worktree the module's F2 `Read` answers `ENOTDIR`, not "does not exist", and the module treats that as a stop. This was observed directly. It regresses the linked-worktree answer that goal 1 protects.

**Already known and accepted, so not a finding:** the root `.claude/CLAUDE.md` and `.claude/harness-task-offer.md` still carry the old fence. The story lists their re-render under **Manual setup required**, and the user accepted that deferral.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Treat an `ENOTDIR` answer as absence in the module's **Reading a file.** paragraph, so a linked worktree keeps today's answer _(layer: plugin)_
2. [x] **Finding 2** — Add `docs/sandbox-verification.md` and `cli/test/main-root-fallback.test.mjs` to the module's `## Who may cite this` roster, 24 → 26 _(layer: plugin)_
3. [x] **Finding 5** — Say "write-open" where the module's platform posture cites CL5 _(layer: plugin)_
4. [x] **Finding 3** — Replace `docs/watcher.md` → **Read.**'s restatement of the fallback with a repo-relative pointer _(layer: general)_
5. [ ] **Finding 4** — Record the worked example's owed re-render (Task 12) under the story's **Manual setup required** _(layer: general)_

---

## Must Fix

### 1. The prose fallback stops in a linked worktree, because F2's `Read` there answers `ENOTDIR` and the module treats every answer other than "does not exist" as a stop
→ [finding_1.md](fix_clone_main_repo_resolution_code_review/finding_1.md)

---

## Should Fix

### 2. Two documents point at `## The fallback` without being on the module's closed roster
→ [finding_2.md](fix_clone_main_repo_resolution_code_review/finding_2.md)

### 3. `docs/watcher.md` → **Read.** restates the fallback rule it is a roster citer of, and cites it in the plugin-root form a repository document cannot resolve
→ [finding_3.md](fix_clone_main_repo_resolution_code_review/finding_3.md)

### 4. The worked example's owed re-render (Task 12) is missing from the story's `## Manual setup required`, so nothing before merge says it is still owed
→ [finding_4.md](fix_clone_main_repo_resolution_code_review/finding_4.md)

---

## Nice to Have

### 5. The module's platform posture says CL5 shows the alternates file "refused", but CL5 measures a sandboxed write-open, not a read
→ [finding_5.md](fix_clone_main_repo_resolution_code_review/finding_5.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section has no reference-implementation divergences.
