# Code Review: feat_clone_per_run

## Context

**Branch:** `feat_clone_per_run`
**Date:** 2026-10-19
**Reviewed:** the whole branch diff against `dev`, 23 files. That covers the run library's clone primitives in `cli/templates/scripts/lib/harness-run-lib.sh`: the trust check and its `.git/config` allow-list, the sync pair, creation and removal, and the watcher family's clone arm. It also covers the clone arm of `commit-on-branch.sh`, `push-branch.sh`, `refresh-branch.sh` and `setup-worktree.sh --target`; the registry's write protection in `cli/src/generators/writeProtection.ts` and its constants in `cli/src/generators/stateDir.ts`; the six new suites and the two edited ones under `cli/test/`; and the documents of record (`docs/cli.md`, `docs/watcher.md`, `docs/sandbox-verification.md`) with the re-rendered worked-example profile. 28 run-artifact files excluded from the reviewed diff.

Every unit kind the branch adds lands with what the conventions documents require. Each new suite opens with the rule it enforces and its RED-once evidence. The registry entry is graded by `doctor` (`cli/test/doctor-profile-sandbox.test.mjs` case (h)), and the re-rendered profile's `/workspace` figures in `examples/notes-app/README.md` match the file (226 occurrences across 183 lines). This review ran no suite; whether the suites pass is the Run gates phase's to establish. The worktree and main-checkout arms keep their behaviour: `hr_run_main_git` and `hr_run_copy_git` now delegate to one-body helpers carrying the same pins, and every clone branch sits behind the `HR_TARGET_KIND` / `hr_copy_kind` shape test. Every git flag the new code relies on is available at the 2.23 floor, and the shell constructs hold to bash 3.2. `phases.parity` is `false`, so no parity cross-check ran.

The three library functions that create, remove and drop (`hr_clone_create_var`, `hr_clone_remove_var`, `hr_registry_drop`) have no caller outside the tests. That is the task prompt's own exclusion (goal 6: *"`create-worktree.sh` does **not** call this yet"*), so it is not a finding. No finding is a Must Fix. The seven Should Fix findings are a rollback that leaves a key behind, an owed measurement the registry protection depends on, a read the trust check makes twice despite its header, and four durable comments or documents that misstate what the code does.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 5** — Re-attribute the reasons in `protectedPaths`' doc comment so the run registry is not covered by "the last two kinds" _(layer: cli)_
2. [x] **Finding 6** — Name the six new `HR_`-prefixed globals in the run library's NAMING list _(layer: cli)_
3. [x] **Finding 7** — Add `push-branch.sh`'s new mirror-failure stdout line to `docs/cli.md`'s list of exit-contract and stdout exceptions _(layer: general)_
4. [x] **Finding 4** — State sync-in's `git-upload-pack` re-read of the clone in the library's read-once rule and in `docs/cli.md` residual 1's item 3 _(layer: cli, general)_
5. [x] **Finding 2** — Add an owed row RG3 for a sandboxed rename of the registry's parent directory, and cite it from `docs/cli.md` _(layer: general)_
6. [x] **Finding 3** — Read the registry record once in `hr_clone_target_check_var`, as its header says _(layer: cli)_
7. [ ] **Finding 1** — Restore the whole prior registry record on `hr_clone_create_var`'s rollback, instead of writing `copy_kind` / `worktree` back as strings _(layer: cli)_

---

## Must Fix

None.

---

## Should Fix

### 1. `hr_clone_create_var`'s rollback writes `copy_kind: ""` into a prior record that had none, then reports a full rollback
→ [finding_1.md](feat_clone_per_run_code_review/finding_1.md)

### 2. The registry is protected by its exact path, but a sandboxed rename of its directory, `autonomous_logs`, is neither protected nor owed as a measurement
→ [finding_2.md](feat_clone_per_run_code_review/finding_2.md)

### 3. `hr_clone_target_check_var` reads the registry twice, though its header and the library header say once
→ [finding_3.md](feat_clone_per_run_code_review/finding_3.md)

### 4. The read-once rule and `docs/cli.md` residual 1's item 3 omit sync-in's `git-upload-pack` re-read of the clone's `.git/config`, refs and alternates
→ [finding_4.md](feat_clone_per_run_code_review/finding_4.md)

### 5. `protectedPaths`' doc comment now gives the run registry the `hr_wrapper_main_of` reason that belongs to the configuration file
→ [finding_5.md](feat_clone_per_run_code_review/finding_5.md)

### 6. The run library's NAMING list omits six globals this branch introduces
→ [finding_6.md](feat_clone_per_run_code_review/finding_6.md)

### 7. `docs/cli.md` says the wrappers' stdout lines are unchanged, but `push-branch.sh` gains a stdout line on the clone arm
→ [finding_7.md](feat_clone_per_run_code_review/finding_7.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section carries no divergence call-out.
