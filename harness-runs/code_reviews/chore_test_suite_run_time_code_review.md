# Code Review: chore_test_suite_run_time

## Context

**Branch:** `chore_test_suite_run_time`
**Date:** 2026-09-25
**Reviewed:** the whole branch diff against `dev` (merge base `fe17b4e2293f`), across 9 files. The seeded-template fixture copy in `cli/test/helpers/fixture.mjs` and its equivalence suite `cli/test/fixture-template.test.mjs` (Task 1). The bounded case-concurrency helper `cli/test/helpers/concurrency.mjs`, and the concurrent suites in `stack-presets.test.mjs`, `doctor.test.mjs` and `init.test.mjs` (Tasks 2–4). `scripts/measure-suite.sh` in host mode and in `--cpus` container mode (Tasks 5–6). The gate-4 run-time record in `docs/development.md` and the fifth fixture choice in `docs/cli.md` (Task 7). 12 run-artifact files excluded from the reviewed diff.

**Headline conclusions.** Test coverage is intact. Every test file present at `fe17b4e2293f` has the same `assert.` count at `HEAD`: `doctor.test.mjs` 857, `init.test.mjs` 1027, `stack-presets.test.mjs` 79, the rest unchanged. The only additions are `fixture-template.test.mjs`'s 11 assertions.

The concurrency isolation audit recorded in each file's header holds on re-check:

- None of the three files writes `process.env`, calls `process.chdir`, holds module-level mutable state, or opens a nested `describe`.
- The only un-awaited `t.test` is `stackCase`'s return value, and every caller collects it.
- The one wall-clock case (the dev-server wrapper) was moved after `init`'s suite.

The template copy guards the one stored absolute path. Its equivalence test compares a copy with a freshly seeded repository query by query and never compares object ids across the two.

Pass 0 had two parts. The grep sweep list is still an unfilled stub, so it found nothing. The caller check found callers outside the defining file for `seedRepository`, `CASE_CONCURRENCY` and `concurrentSuite`. `CONCURRENCY_VARIABLE` is used only inside `concurrency.mjs`. It is the declared owner of an environment-variable name that other files may import, and the feature it names is wired, so it is not a dead export and is not filed.

`phases.parity` is `false`, so no parity review ran. Acceptance item 1's restricted-core figures remain unmeasured, per the user's Park 1 answer (b). That is recorded as such and is not a finding.

What is left: a durable record that names commits the squash merge will drop (Finding 1), a before/after that cannot be compared (Finding 2), a contract line in `measure-suite.sh`'s header that disagrees with its code (Finding 3), and two small test-helper items. Pass 2 found no per-unit review files under the supplied root, so reconciliation was a no-op.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 3** — Make `measure-suite.sh`'s contract item 6 say the container runs `<k>` timed runs, not 3 _(layer: general)_
2. [x] **Finding 4** — Move the `PLUGIN_KEY` import rationale in `doctor.test.mjs` back onto the import _(layer: cli)_
3. [x] **Finding 5** — Rewrite the copied fixture's origin URL with a replacer function _(layer: cli)_
4. [ ] **Finding 1** — Re-point the gate-4 run-time record and its commands at a commit that survives the squash merge _(layer: general)_
5. [ ] **Finding 2** — Re-measure before and after in one session with three runs each, and record the load _(layer: general)_

---

## Must Fix

### 1. The gate-4 run-time record names two branch-only commits, so its reproduce command stops resolving once the branch is squash-merged
→ [finding_1.md](chore_test_suite_run_time_code_review/finding_1.md)

---

## Should Fix

### 2. The host before/after compares one before run with three after runs taken in a different load window, so the record cannot show whether the suite got faster
→ [finding_2.md](chore_test_suite_run_time_code_review/finding_2.md)

### 3. `measure-suite.sh`'s contract says the container runs "the timed loop of 3", but the container runs `--runs <k>`, default 1
→ [finding_3.md](chore_test_suite_run_time_code_review/finding_3.md)

---

## Nice to Have

### 4. The reason `doctor.test.mjs` imports `PLUGIN_KEY` from the compiled CLI was left about 4,300 lines below the import it explains
→ [finding_4.md](chore_test_suite_run_time_code_review/finding_4.md)

### 5. `copyTemplate` rewrites the origin URL with a string replacement, so a `$` in the temp path would corrupt it after the exactly-once check has passed
→ [finding_5.md](chore_test_suite_run_time_code_review/finding_5.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section carries no parity call-out.

- **Verified-OK: nothing was lost.** Per-file `assert.` counts under `cli/test/` match between `fe17b4e2293f` and `HEAD` for every file present at both. The dev-server case moved out of `init`'s suite unchanged, byte for byte apart from its placement.
- **Verified-OK: the `--cpus` mode refuses rather than guesses.** It exits 3 with no container runtime, and exits 2 when `<n>` exceeds the runtime's `NCPU`. The restricted-core table cells say "not yet measured" and hold no number.
