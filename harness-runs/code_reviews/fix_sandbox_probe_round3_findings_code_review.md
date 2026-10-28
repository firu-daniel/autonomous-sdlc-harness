# Code Review: fix_sandbox_probe_round3_findings

## Context

**Branch:** `fix_sandbox_probe_round3_findings`
**Date:** 2026-10-28
**Reviewed:** the whole branch diff against the default branch (`dev`; this run copy carries no local `dev`, so the base was `origin/dev`). That covers the probe changes in `scripts/lib/sandbox-probe/` (`core.sh`'s leg table, `legs-wrappers.sh`, `legs-protection.sh`, `legs-planted.sh`, `legs-network.sh`, `legs-settings.sh`, Tasks 1–6), the five probe suites and their eleven fixtures under `cli/test/` (Tasks 7–11), Gate 15's leg table and hand-row paragraph in `docs/development.md`, and the Check / Expected amendments in `docs/sandbox-verification.md` (Task 12). 17 run-artifact files excluded from the reviewed diff.

Headline: the four defects the prompt names are addressed in code. CW6 now has its own exact `--allowedTools` rule, and its grading goes through `sp__wr_reached`, which screens every measured wrappers call for a permission-layer refusal. `sp__wr_called` has no caller left outside `sp__wr_reached`. A permission-layer refusal grades `not run` in `sp__wp_dd_grade`, `sp__git_cs3_call`, `sp__git_cl5_grade`, `sp__pc_refusal` and `sp__cs8a_grade`. N4 is graded against an unsandboxed control from the probe's own shell; it compares no elapsed time and quotes no body. CS8 (b) calls the watcher's own `run_profile_check` in a child `bash -c`, in `sp__render`'s form, on a scratch profile under `SP_TMP`. The watcher, wrappers, guards and generators are untouched. The leg table and the Gate 15 rows still match row for row. The amended record rows change only in Check / Expected wording. Every new grading function has a caller. The Pass 0 sweep (Bash 3.2 forms, recursive removal, machine paths, `git add -A`, `console`) found no real hit. Parity is off (`phases.parity` is `false`). This review runs no suite: whether the suites pass is for the Run gates phase to establish. The tests do leave two decision points that this branch introduces with no case driving them (Findings 1 and 3), and one leg-table claim is wider than the code (Finding 2).

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Narrow the `wrappers` leg's "every result names the layer that answered" to the rows whose lines name one, in `core.sh` and Gate 15 together _(layer: general)_
2. [ ] **Finding 3** — Add a case driving `sp__cs8_line`'s combination of CS8 (a) and (b) into one verdict _(layer: cli)_
3. [ ] **Finding 1** — Add a case driving `sp__git_cs3_state`'s skip of a state check whose call did not run _(layer: cli)_

---

## Must Fix

### 1. `sp__git_cs3_state`, the step that stops a permission-refused CS3 call from turning CS3 `fail`, is driven by no test
→ [finding_1.md](fix_sandbox_probe_round3_findings_code_review/finding_1.md)

---

## Should Fix

### 2. The `wrappers` leg table claims every result names the layer that answered, and CS4's line names none
→ [finding_2.md](fix_sandbox_probe_round3_findings_code_review/finding_2.md)

### 3. `sp__cs8_line`, which turns CS8's two halves into the row's one verdict, is driven by no test
→ [finding_3.md](fix_sandbox_probe_round3_findings_code_review/finding_3.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
