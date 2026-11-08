# Task plan review — iteration 3

`review_2.md`'s Must Fix 1 is resolved: `task_2_plan.md` now sorts with `sort_by([0 - .seconds, .file])`, and a `**Verification:**` bullet forbids unary minus.

I re-ran the Scope register's command entries 1 and 2 verbatim. They reach only sites already in rows 1–18. Re-walking entry 3 reaches only rows 19–22. Structure, the 1:1 index-to-file mapping, layer order, the points budget and the `**Work:**` bullet counts all pass. No `**Verification:**` bullet asks for a forbidden test run, and both new parse/report suites read one fixed file each, so neither is a tree guard.

## Must Fix

1. **`review_2.md`'s Should Fix 1 was neither applied nor recorded, and `redact_path` still collapses relative file paths into one key.** Files: `task_1_plan.md` (the `redact_path` bullet under **The round record**), plus the story index (`feat_run_analytics_gate_timings_story_plan.md`: `## Context` → **Execution modes**, and Scope register row 19) and `task_3_plan.md` (the `PATHS IN THE RECORD` bullet).
   - **What the plan still says:** `task_1_plan.md` defines `redact_path` as *"`redact`'s replace-pairs step and its two `strip_home` steps with no cut"*. The story index's **Execution modes** says *"the same pairs and home step as `redact`"*. `task_3_plan.md` says *"applies the pairs and the home step"*.
   - **What the code does:** `cli/templates/scripts/lib/run-analytics.jq` → `def strip_home($pre)` runs `split($pre)` anywhere in the string, then replaces the following `seg_len` run of `[A-Za-z0-9._-]` with `~`.
     - A valid relative `file` `src/home/a.test.ts` becomes `src~`, and so does `src/home/b.test.ts`.
     - Validation already refuses a `file` that starts with `/`, so the home step protects nothing for `file`. All it does is destroy the record.
   - **Ledger entries this repeats** (`harness-runs/lessons.md`):
     - *Evidence and measurement*: **"A measurement script stores and reports every reading in full; truncation belongs to a display, never to the record a verdict is read from."** Two test files merge into one `file`, and both paths are lost from the JSON. Row 19 claims the opposite: *"every round id, gate id and file path in full"*.
     - *Unattended control loops*: **"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay."** The index has no `## Rejected findings` section, and no plan file changed in response to this finding.
   - **Fix:**
     - In `task_1_plan.md`, define `redact_path` as the replace-pairs step only, or as the pairs plus `strip_home` applied only when the value starts with `/`. Keep `redact` as `redact_path | strip_home(...) | .[0:160]`, or an equivalent, so the existing callers' output stays byte-unchanged. Say that in the bullet.
     - Add a parse-suite case to `task_1_plan.md`: `src/home/a.test.ts` and `src/home/b.test.ts` stay two rows, with their `file` values unchanged.
     - Align the story index's **Execution modes** sentence, the story index's row 19 reason, and `task_3_plan.md`'s `PATHS IN THE RECORD` bullet with the new definition.
     - If you reject the finding instead, record it under a trailing `## Rejected findings` section of the story index with a reason that engages the `src/home/…` example.

## Should Fix

None.

## Nice to Have

1. **The verdict check is still looser than the producer's own reader** (`task_1_plan.md` → **Validation** → `verdict`). This is `review_2.md`'s Nice to Have 1, re-raised.
   - The plan accepts `fail` *"optionally followed by a space and anything"*, which includes a bare `fail`.
   - `scripts/run-test-suite.sh` → `emit_verdict` accepts only `pass` or `"fail "?*`, and refuses a bare `fail` (`holds no verdict line`).
   - Match that shape.
2. **The Scope register's revision paragraphs are numbered "round 1", "round 2", "round 5"** (story index). This review is iteration 3. Renumber them so the history reads in sequence.
