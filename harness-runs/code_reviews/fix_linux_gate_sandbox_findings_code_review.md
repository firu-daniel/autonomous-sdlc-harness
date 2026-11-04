# Code Review: fix_linux_gate_sandbox_findings

## Context

**Branch:** `fix_linux_gate_sandbox_findings`
**Date:** 2026-11-04
**Reviewed:** the whole branch diff against the default branch `dev`. This run copy has no local `dev`, so the base is `origin/dev`. The diff covers 25 files across 23 commits:
- F11: gate 6a moved into `scripts/check-machine-paths.sh`, plus its suite `cli/test/check-machine-paths.test.mjs`.
- F12: case `(c)` of `cli/test/launch-sandboxed-gates.test.mjs` now shadows only `bwrap`, plus the new case `(c2)`.
- F13: case `(d)` of `cli/test/doctor-profile-sandbox.test.mjs` runs under `retrievalEnv`.
- PD28: CL5's lock line added to `judge.sh`, with its grading in `legs-protection.sh`.
- PD29: the `gate-sandbox` leg moved to its own extra clone, with an allow-list check in `legs-gate-sandbox.sh`.
- PD30: T3's `fail` evidence in `legs-local.sh` now names the failed gates.
- F14: the container home respelled in `docs/development.md`, `docs/sandbox-verification.md` and eight earlier run artifacts, plus the tree guard `cli/test/no-container-home-paths.test.mjs` and its `harness.config.json` → `treeGuards` entry.

Every file was read against `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md` and `harness-runs/lessons.md`. 21 run-artifact files excluded from the reviewed diff.

Every finding the task prompt names has a fixture in the suite. The new tree-reading test is registered in `treeGuards` in the same branch. This review runs no suite: whether the tests pass is for the Run gates phase to establish. The remaining checks found no problems:
- `git grep -l -e '/home/prob[e]'` prints nothing.
- No live file still names the removed `machine_path_hits` function.
- Every new shell function has a caller: `sp__gs_target`, `sp__gs_target_check`, `sp__gate_log_failures`, `sp__tmpfile_names`, `sp__tmpfile_line` and `sp__gate_denials`.
- The `gate-sandbox` leg's extra clone `${SP_BRANCH}_gs` and its branch are registered for teardown by `sp_extra_clone` (`legs-gate-sandbox.sh`, the `sp_extra_clone "${SP_BRANCH}_gs" --no-bootstrap` call), which satisfies the lessons-ledger entry on removing a temporary working copy or branch on every exit path.
- The launcher and its trust check are untouched.
- §5 and §8 record GS1–GS4 as **not yet measured**.

`phases.parity` is `false`, so no parity review applies. The per-unit findings root holds no review files, so the two-pass reconciliation carried nothing over. Three findings remain.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Point `check-machine-paths.test.mjs`'s header at the `F11: …` case, not the nonexistent case `(d)` _(layer: cli)_
2. [ ] **Finding 3** — Tighten CL5's `/dev/null` placeholder test to the exact ` 1, 3 ` device pair, with a fixture for a different device _(layer: cli, general)_
3. [ ] **Finding 2** — Keep git's lock line out of the write-protection leg's `dd` and rename refusal set and its Linux pass sentence _(layer: cli, general)_

---

## Must Fix

_None._

---

## Should Fix

### 2. PD28's fourth Linux refusal string also became a `dd` and rename refusal, so CS1/CS2/CS7's Linux pass sentence names git's lock line
→ [finding_2.md](fix_linux_gate_sandbox_findings_code_review/finding_2.md)

### 3. CL5's placeholder test `c*"1, 3"*` also accepts device numbers other than `/dev/null`'s `1, 3`
→ [finding_3.md](fix_linux_gate_sandbox_findings_code_review/finding_3.md)

---

## Nice to Have

### 1. `check-machine-paths.test.mjs`'s header cites a case `(d)` that the suite does not have
→ [finding_1.md](fix_linux_gate_sandbox_findings_code_review/finding_1.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section has no reference-implementation divergences.
