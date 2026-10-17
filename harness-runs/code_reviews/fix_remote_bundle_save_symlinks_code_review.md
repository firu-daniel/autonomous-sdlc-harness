# Code Review: fix_remote_bundle_save_symlinks

## Context

**Branch:** `fix_remote_bundle_save_symlinks`
**Date:** 2026-10-17
**Reviewed:** the whole branch diff against `dev`, which is 6 files and 643 insertions. That covers the following:
- `cli/templates/scripts/lib/harness-run-lib.sh`: the new `hr_remote_state_dir_var`, `hr_remote_link_free_var`, `hr_remote_copy_tree` and `hr_remote_bundle_source_ok`, the rewritten `hr_remote_bundle_write`, and the trusted-`stateDir` resolution in `hr_remote_bundle_restore` and `hr_remote_move_aside` (Task 1).
- `cli/templates/scripts/remote-run.sh`: the `save` / `restore` setup gate, `verb_restore`, `verb_save`, `save_link_free` and `remote_state_difference` (Task 2).
- The new suite `cli/test/remote-save-links.test.mjs` (Task 3).
- The residual-1 corrections in `docs/cli.md`, `docs/remote-execution.md` and `docs/watcher.md` (Task 4).

8 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**
- **The prompt's security goals hold.** Every bundle source is tested component by component before it is tested or copied. Directory sources are recreated by a `find`-driven walk that never copies or follows a link. `save` and `restore` read `stateDir` from `harness.config.json` at `HARNESS_GITHUB_DEFAULT_COMMIT` inside a job.
- **The honest bundle is unchanged.** It has the same sources, layout and `status.json`, and schema `1`.
- **No existing refusal is weakened.** That covers the previous-job `run_id` move-aside, the no-bundle rule and the lineage bound.
- **Bash 3.2 and BSD/GNU portability hold.** The new code uses `read -d ''`, process substitution and `find -print0`.
- **The post-release checks file Task 4 owed exists**, outside the repository.
- **The `general` layer's documents pass `.claude/context/conventions.md` → `## Documents of record`.** Two rules bind the `docs/` changes, and both hold:
  - *"A measured fact states what was measured, the command and the exact message"*: the `cp -R` measurement added to `docs/cli.md` §6 residual 1 item 5 states what was measured (how `cp -R` treats a link inside a tree and a linked argument), the date, the platforms (macOS 15.7.4 `/bin/cp`, GNU coreutils 9.7 in `python:3.12-slim`), the exact commands and the output (`l` for each `ls`).
  - *"A deferral cites a numbered roadmap item"*: the branch adds no deferral of content. `docs/watcher.md` only renames one item of the residual-1 pointer sentence ("the bundle save's reads" to "the bundle save's test-to-copy window"). The `docs/remote-execution.md` change rewrites the "The post-session steps on a job that passed." bullet and ends it with "the check on a real job follows the first release that carries them". That is a post-release verification, not deferred content: `docs/development.md` → `## 6. The roadmap this tree defers to` is the legend for documents that "defer their content to a numbered roadmap item", and its rows are deliverables. The sentence follows the precedent of the existing bullet in the same list, "The check on a real GitHub job is a post-release follow-up, not yet run.", which also cites no roadmap item. Its checks file exists outside the repository (the bullet above). The two *not measured* items in residual 1 item 5 describe open residuals and defer nothing.
- **The new suite passes.** `npm test --workspace cli -- test/remote-save-links.test.mjs` gave 14 tests, 14 passed, 0 failed.
- **What remains:**
  - The library header's write list misses one new writer (Finding 1).
  - Older suites break when `HARNESS_GITHUB_DEFAULT_COMMIT` is in the environment. I measured this by running `test/remote-run.test.mjs` with the variable set: 20+ `not ok` (Finding 2).
  - The restore half of goal 3 has no test (Finding 3).
  - One output global is never read (Finding 4).
  - A duplicate skip line (Finding 5).
- **Pass 0.**
  - The grep-sweep half did not run, because its regex table is still the unedited stub, which is a configuration gap.
  - The new-exported-symbol caller check covered every layer path. Each new function has a caller: `hr_remote_state_dir_var` and `hr_remote_link_free_var` from `remote-run.sh`, and `hr_remote_copy_tree` and `hr_remote_bundle_source_ok` from `hr_remote_bundle_write`, whose callers are in `remote-run.sh`.
- **Pass 2** had no per-unit review folders to reconcile.

**Parity:** `phases.parity` is `false`, so no parity check runs.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Add `hr_remote_copy_tree` to the library header's write-exception entry 3 and to its "calls no … still only reads" list _(layer: cli)_
2. [x] **Finding 4** — Remove the never-read `HR_REMOTE_STATE_WHY` global from `hr_remote_state_dir_var` and the header's NAMING list _(layer: cli)_
3. [ ] **Finding 2** — Blank `HARNESS_GITHUB_DEFAULT_COMMIT` in the test helper's `ISOLATED_ENV` _(layer: cli)_
4. [ ] **Finding 5** — Print `save`'s own status-source skip line only when no bundle is written, and assert one line in `(F)` _(layer: cli, general)_
5. [ ] **Finding 3** — Add a `(TR)` case proving `hr_remote_bundle_restore` writes under the trusted `stateDir`, with its red-once mutation _(layer: cli)_

---

## Must Fix

### 1. The library header's write-exception list leaves out `hr_remote_copy_tree`, a new writer
→ [finding_1.md](fix_remote_bundle_save_symlinks_code_review/finding_1.md)

---

## Should Fix

### 2. Existing `restore` / `sync` suites now fail whenever `HARNESS_GITHUB_DEFAULT_COMMIT` is in the test process's environment
→ [finding_2.md](fix_remote_bundle_save_symlinks_code_review/finding_2.md)

### 3. No test covers `restore` placing the bundle by the trusted `stateDir`
→ [finding_3.md](fix_remote_bundle_save_symlinks_code_review/finding_3.md)

### 4. `HR_REMOTE_STATE_WHY` is assigned on every resolution and read by nothing
→ [finding_4.md](fix_remote_bundle_save_symlinks_code_review/finding_4.md)

---

## Nice to Have

### 5. A linked status source prints two skip lines when the bundle is still written
→ [finding_5.md](fix_remote_bundle_save_symlinks_code_review/finding_5.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this repository has no reference implementation to diverge from and this section has no call-outs.
