# Skeptic Review: feat_unattended_sandbox_measurement

## Context

**Branch:** `feat_unattended_sandbox_measurement`
**Date:** 2026-10-27
**Reviewed:** the whole branch diff against `origin/dev`, adversarially. The configured `defaultBranch` is `dev`, and this checkout has no local `dev` ref, so the diff base is the remote-tracking `origin/dev` (merge base `c136d600`). The diff covers the probe entry point `scripts/sandbox-probe.sh` and its thirteen libraries under `scripts/lib/sandbox-probe/`, the three `cli/test/sandbox-probe-*.test.mjs` suites with their stream fixtures, the new and re-targeted rows in `docs/sandbox-verification.md`, Gate 15 in `docs/development.md`, and the gate-count edits in `scripts/run-gates.sh`. 42 run-artifact files excluded from the reviewed diff.

**De-duplicated against:** the committed code review `harness-runs/code_reviews/feat_unattended_sandbox_measurement_code_review.md` and its findings 1–9, and the plan-stage architecture reviews `harness-runs/architecture_reviews/feat_unattended_sandbox_measurement/review_0.md` to `review_2.md`. No `harness-runs/architecture_branch_reviews/feat_unattended_sandbox_measurement_arch_review.md` exists. No parity review ran, because `phases.parity` is `false`. Nothing those reviews raised is repeated here. That covers headless parity, R4's SSH proxy string, S1, SR2, the roadmap-item citation, W7's layer, CS8's marker, Gate 15's table check and the preflight temp-area trap.

**Headline.** The widest defect is that `session.sh` does not parse under bash 3.2.57, the declared floor and the `bash` a stock macOS host runs the probe with. Under that bash, Gate 15's `run` launches no session at all (Finding 4). Beyond that, the code review checked whether each leg's verdict matched its row, and this pass checked whether each judge's discriminator measures the property its row protects. It does not in three places, and in each the probe prints a verdict the person running Gate 15 would record wrongly:

- **N5**, the leg the story calls the one that matters most, files a false "allowed_domains widened" finding on a tool rejection.
- **CW2** reads the clone's own ref, which the wrapper's own header says a sandboxed commit in a clone is designed to move.
- **T2** passes a gate run that printed `FAIL: test`.

**Checks that held, and how each was verified:**

- **Wiring.** Every `sp_leg_*` function is reached from the `run` loop through `sp_leg_names`, and `sp_ctl_clone` is called by every leg that adds a wrapper control. This was verified by reading the source, under no particular bash: no bash was executed. It does **not** hold under `/bin/bash` 3.2.57 until Finding 4 lands, because there `session.sh` fails to parse and `sp_session` is undefined. This review could not run `bash -n` itself: the permission mode refused every Bash execution of `/bin/bash`.
- **Launch line.** `sp_session` reproduces `spawn_engine`'s flags, read against `scripts/autonomous-watcher.sh` → `spawn_engine`. Same scope: it was read from source, and under 3.2 it is reachable only after Finding 4.
- **Claimed justifications.** Each one cited in code or plan was opened and says what is claimed: the task prompt's goal items, the `CS5` / `CS6` / `L1` interpretations, the `sp_rm_tree` exception, and the `hr_clone_remove_var` precedent.
- **The `cli` layer's testing bar** (`.claude/context/cli.md` → `## What "done" means here`, and `.claude/context/conventions.md` → `## The testing bar`, which it defers to). This covers `cli/test/sandbox-probe-judge.test.mjs`, `cli/test/sandbox-probe-shell.test.mjs`, `cli/test/sandbox-probe-git-and-legs.test.mjs` and the fifteen `cli/test/fixtures/sandbox-probe/*.jsonl` streams. It was verified by reading each suite's header and imports and grepping all three for `mkdtemp`, `writeFile`, `mkdir(`, `WORKSPACE_ROOT`, URLs and `mock`. No test was run.
  - *The file opens with its rule.* Each suite opens with a bold **"The rule these tests exist to enforce"** statement before its first case. Each also names what it leaves out deliberately and why: the sandboxed sessions only a hand-run `sandbox-probe.sh run` reaches, and the area each sibling suite covers instead.
  - *No fixture inside this checkout.* Every directory a suite creates comes from `mkdtemp(join(tmpdir(), …))`, and each one is removed in `t.after`. In the judge suite that is `harness-sp-judge-`. In the shell suite it is `caseTmp`'s `sandbox-probe-case-`, plus the adopted fixture from `createWatcherFixture`, into which the probe is **copied** (`probeFixture`), and the `shasum`-guard cases restore files under that fixture's `f.dir`, not this tree. In the git suite it is `sandbox-probe-git-`, holding `seedRepository`'s repo and its bare origin.
  - *No test aimed at this repository.* Three things read this checkout, and none writes to it or treats its state as the subject. The judge suite runs `scripts/sandbox-probe.sh judge` in place, over the committed `.jsonl` streams. That path (`sandbox-probe.sh` → `judge)` → `sp_judge_cli`) creates no temp area, and the suite's own "writes nothing" case asserts an empty `readdir` of its working directory. The git suite runs `--list`, which prints the leg table and touches nothing. It also reads `docs/development.md` read-only for the Gate 15 row-for-row check.
  - *No network, no background service, no browser.* No case launches `claude`. The shell suite replaces the agent CLI with a `printf` stub through `SANDBOX_PROBE_AGENT_CLI`, and `uname` / `doctor` with `SANDBOX_PROBE_UNAME` / `SANDBOX_PROBE_DOCTOR`. The only URLs are `*.example.invalid` command strings that the judge matches byte for byte and never executes.
  - *No mocking framework.* The imports are `node:assert/strict`, `node:fs`, `node:fs/promises`, `node:os`, `node:path`, `node:test`, `../dist/core/mainRepoAnchor.js` and the existing `cli/test/helpers/fixture.mjs` / `watcher.mjs`. The substitutes are the sanctioned ones: temp-dir fixtures, subprocess runs and environment seams.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 4** — Make `session.sh` parse under bash 3.2.57 by taking the apostrophe out of `sp__render`'s `${out:-…}` default _(layer: general)_
2. [ ] **Finding 3** — Grade T2 on `scripts/test.sh`'s own `PASS: test` / `FAIL: test` verdict line, not on the absence of two refusal strings _(layer: general)_
3. [ ] **Finding 2** — Judge CW2 by the main checkout's `refs/heads/<branch>` and record the clone's, since the clone's own copy commits on the clone's ref by design _(layer: general)_
4. [ ] **Finding 1** — Make N5's `fail` need a non-error result, so a rejected or errored `allowed_domains` call is `not run`, not a widening finding _(layer: cli, general)_

---

## Must Fix

### 4. `session.sh` does not parse under bash 3.2.57, its own declared floor and the `bash` a stock macOS host runs the probe with, so Gate 15's `run` defines no `sp_setup`, `sp_session` or `sp_teardown` and measures nothing
→ [finding_4.md](feat_unattended_sandbox_measurement_skeptic_review/finding_4.md)

### 1. N5 prints `fail` and files the "allowed_domains widened a sandboxed call" finding for any error result that carries no refusal string, though the host never answered
→ [finding_1.md](feat_unattended_sandbox_measurement_skeptic_review/finding_1.md)

### 2. CW2 is judged on the clone's own ref, which a sandboxed commit in a clone is designed to move, so the clone's copy prints `fail` on its expected outcome
→ [finding_2.md](feat_unattended_sandbox_measurement_skeptic_review/finding_2.md)

### 3. T2 prints `pass` when the sandboxed gate run printed `FAIL: test`, unless the output happens to carry `mkstemp failed` or `Operation not permitted`
→ [finding_3.md](feat_unattended_sandbox_measurement_skeptic_review/finding_3.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

These are not fixes and do not appear in the readiness list.

- **No parity divergence to confirm.** `phases.parity` is `false`, so there is no reference implementation, and check 2's parity leg is inert.
- **Verified-OK: CW5 and CW6 keep judging the clone's ref.** Unlike CW2, both call the main checkout's copy. Its clone arm syncs into `<main>/.git` before it commits (`scripts/commit-on-branch.sh` header, **A CLONE IS A TARGET TOO**), and a sandboxed run cannot write `<main>/.git`. So for those two rows an unmoved clone ref does mean "stayed sandboxed", and a moved one means "ran excluded".
