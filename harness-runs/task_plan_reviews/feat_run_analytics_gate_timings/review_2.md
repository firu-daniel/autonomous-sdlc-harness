# Task plan review — iteration 2

All four findings from `review_1.md` are resolved in the artifact:
- MF1: `task_3_plan.md` → **Text checks** is now narrowed to non-comment lines.
- MF2: `task_2_plan.md` now sorts the rows itself, and `task_1_plan.md` promises record order only.
- SF1: `redact_path` was added with no 160-character cut.
- SF2: discovery's placement is now stated after `$work/old.json` and the `sessions` call.

I re-ran the Scope register's command entries 1 and 2 verbatim. They reach only rows 1–18. Re-walking entry 3 reaches only rows 19–22.

## Must Fix

1. **Task 2 prescribes unary minus, which the target file's own `Floor:` forbids, and labels it "within the jq 1.5 floor"** — `task_2_plan.md`.
   - **Where:** `**Work:**` → "One sub-section per round" → the `#### Slowest test files` bullet. It tells the implementer to sort with `sort_by([-.seconds, .file])` and calls that "within the jq 1.5 floor".
   - **What the target file says:** the header of `cli/templates/scripts/lib/run-analytics-report.jq` → `Floor:` reads *"jq 1.5 — no regex, no ceil/round/abs, no unary minus, no $__loc__, …"*.
   - **How the file already sorts descending:** it uses subtraction from zero, as in `sort_by(0 - .duration_ms)` in `run_of`'s `slowest_subagent`, and `(0 - .) | fmt_dur` in `fmt_dur`. `run-analytics.jq` does the same: `sort_by(0 - .duration_ms)`.
   - **Why it matters:**
     - An implementer who follows the bullet literally breaks the header rule that `.claude/context/cli.md` → `## What "done" means here` says a change must satisfy ("Where the header states a rule, the change either satisfies it or amends the header in the same edit").
     - The program would then fail on every jq 1.5 host, adopters included. A failing `markdown` render makes `run-analytics.sh` `die`, so no analytics are written at all.
     - The plan's own `**Verification:**` bullet ("every `if` has an `else`") does not catch it.

   **Fix:** In `task_2_plan.md`:
   - Replace `sort_by([-.seconds, .file])` with `sort_by([0 - .seconds, .file])`.
   - Add a `**Verification:**` bullet: the new text uses no unary minus, so every negation is written `0 - <expr>`, as the header's `Floor:` line requires.

## Should Fix

1. **`redact_path`'s home step rewrites a relative `file` that contains a `/home/` or `/Users/` segment, and can merge two files into one key** — `task_1_plan.md` (the `redact_path` bullet under **The round record**). The story index's `## Context` → **Execution modes** paragraph says the same.
   - **What the plan defines:** `redact_path` is the replace-pairs step plus *"its two `strip_home` steps with no cut"*.
   - **What `strip_home` does:** `cli/templates/scripts/lib/run-analytics.jq` → `def strip_home($pre)` splits on the prefix *anywhere* in the string, then replaces the following `[A-Za-z0-9._-]` run with `~`.
   - **Example:** a valid relative `file` such as `src/home/a.test.ts` becomes `src~`, and `src/home/b.test.ts` becomes `src~` too. Two rows end up sharing one `file`, and both paths are lost from the record. That is the same key-merging and record-shortening that round 1's SF1 removed the 160-character cut to prevent (ledger row 19).
   - **Why the step adds nothing here:** the validation already refuses a `file` that starts with `/`, so the home step protects nothing for `file`.
   - **Fix:** For `file`, apply only the replace pairs, or skip the `strip_home` steps for a value that does not start with `/`. Add a parse-suite case: `src/home/a.test.ts` and `src/home/b.test.ts` stay two rows with their paths unchanged. Then align the story index's **Execution modes** sentence and row 19's reason.

## Nice to Have

1. **The verdict check is looser than the producer's own reader** — `task_1_plan.md` → **Validation** → `verdict`.
   - **The plan accepts** `fail` *"optionally followed by a space and anything"*, which includes a bare `fail`.
   - **The producer's reader** is `scripts/run-test-suite.sh` → `emit_verdict`. It accepts only `pass` or `"fail "?*`, that is `fail` plus a space plus at least one character, and refuses a bare `fail`.
   - **Suggestion:** match that shape, so a verdict file that `run-test-suite.sh` itself refuses is not recorded as a round.
