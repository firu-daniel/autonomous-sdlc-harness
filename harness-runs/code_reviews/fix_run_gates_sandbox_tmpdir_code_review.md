# Code Review: fix_run_gates_sandbox_tmpdir

## Context

**Branch:** `fix_run_gates_sandbox_tmpdir`
**Date:** 2026-10-21
**Reviewed:** the whole branch diff against `defaultBranch` (`dev`; this checkout has no local `dev`, so the base is the remote-tracking `origin/dev`): the 14 bare `mktemp` / `mktemp -d` calls in the shipped template `cli/templates/scripts/remote-run.sh` and the new source guard `cli/test/shipped-scripts-mktemp.test.mjs` (Task 1); `scripts/run-gates.sh`, `scripts/publish-main.sh`, `scripts/release.sh` and this repository's copy `scripts/remote-run.sh` (Task 2); and the TD1–TD4, T2 and T3 rows and F2 follow-up in `docs/sandbox-verification.md` (Task 3). 6 run-artifact files excluded from the reviewed diff.

Every changed call now uses an explicit `"${TMPDIR:-/tmp}/<name>.XXXXXX"` template, which BSD and GNU `mktemp` both accept, and every call keeps its existing `||` fallback and removal. The scope register's D1 derivation, re-run over the final tree, reaches no site. A wider `mktemp` grep over `cli/templates/scripts`, `scripts` and `plugin` finds no call without `XXXXXX`. D2 reaches only the `${TMPDIR:-/tmp}` sites and the two prose mentions the register lists. `cmp` shows the template and `scripts/remote-run.sh` are byte-identical. The TD1 claim that bare macOS `mktemp` ignores `TMPDIR` was re-checked here with `mktemp -u` on macOS 15.7.4, and it holds. The new test file carries its rule in its header and needs no registration (`node --test` discovers it). This review runs no suite: whether the tests pass is for the Run gates phase to establish. `phases.parity` is `false`, so no parity cross-check was made. Pass 0's grep half has an empty sweep list in this agent's definition, which is a configuration gap; the exported-symbol caller check found no new exported symbol. The four findings below are what remains.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 4** — Reflow the over-long `status` WITH NO LOCAL RECORD comment line in both copies of `remote-run.sh` _(layer: cli, general)_
2. [x] **Finding 3** — Name the branch in `docs/sandbox-verification.md`'s TD1 and T2 rows and in the 2026-10-14 unsandboxed-gates paragraph _(layer: general)_
3. [x] **Finding 1** — Stop TD1's verdict claiming a sandboxed result that TD2, which is owed, never measured _(layer: general)_
4. [x] **Finding 2** — Make `run-gates.sh` stop with a message when its log cannot be created _(layer: general)_

---

## Must Fix

### 1. TD1's verdict says "TD2 confirms it", but TD2 has not been run
→ [finding_1.md](fix_run_gates_sandbox_tmpdir_code_review/finding_1.md)

---

## Should Fix

### 2. `run-gates.sh` keeps going when `mktemp` fails, so one temp-file fault shows up as every gate failing
→ [finding_2.md](fix_run_gates_sandbox_tmpdir_code_review/finding_2.md)

### 3. "This branch" in the new TD1 and T2 rows names no branch, and the 2026-10-14 paragraph under T2 now reads as this branch's result
→ [finding_3.md](fix_run_gates_sandbox_tmpdir_code_review/finding_3.md)

---

## Nice to Have

### 4. The edited `status` comment line in `remote-run.sh` is 101 columns wide, while its neighbours wrap at 80
→ [finding_4.md](fix_run_gates_sandbox_tmpdir_code_review/finding_4.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section is empty.
