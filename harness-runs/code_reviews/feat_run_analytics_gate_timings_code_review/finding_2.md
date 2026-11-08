### 2. The `run_analytics/` README names `run-analytics.sh` → `GATE ROUNDS` as the round entry's format of record, but that paragraph does not state the entry's keys

> **Self-contained per-finding file** for the `feat_run_analytics_gate_timings` code-review index (`harness-runs/code_reviews/feat_run_analytics_gate_timings_code_review.md`). The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `cli/templates/state-dir/run_analytics/README.md`, first paragraph: "The format of record is `run-analytics.sh`'s header (`GATE ROUNDS`)." The self-adopted copy, `harness-runs/run_analytics/README.md`, holds the same bytes (Task 6).

**Problem.** The sentence sends an adopter to `run-analytics.sh` → `GATE ROUNDS` for the format of the round entries. That paragraph says which lane files are read: the `.verdict`, `gates.tsv` and `<phase>.tests.tsv` names, the symlink refusal, the `--slurpfile` route. It never states the JSON shape of a recorded round: `round_id`, `verdict`, `gates.outcome` / `gates.rows`, `tests.focused` / `tests.full`, `unreadable`. That shape lives in `lib/run-analytics.jq` → `# Mode \`rounds\`` → `Round record:`. `docs/watcher.md` → `### Run analytics` draws the same line: the jq header for the keys, `run-analytics.sh` for what is read and how. An adopter who follows the README to find what a round entry holds gets a list of input files instead of the entry's keys.

**Fix.** In `cli/templates/state-dir/run_analytics/README.md`, replace
```
The format of record is `run-analytics.sh`'s header (`GATE ROUNDS`).
```
with
```
The format of record is `lib/run-analytics.jq`'s header (mode `rounds` → *Round record*) for the entry's keys, and `run-analytics.sh`'s (`GATE ROUNDS`) for which rounds are read.
```
Then copy the template's bytes over `harness-runs/run_analytics/README.md`. Do not edit the copy by hand. Afterwards `cmp cli/templates/state-dir/run_analytics/README.md harness-runs/run_analytics/README.md` prints nothing. No test file covers this prose, so the fix runs no test.

- **Deviations from plan:** The fix asks for the template's bytes to be copied over `harness-runs/run_analytics/README.md`, not a hand edit. The `cp` command was refused ("Permission to use Bash has been denied because Claude Code is running in don't ask mode"). So the same one-sentence replacement was made in the copy with the Edit tool. `cmp cli/templates/state-dir/run_analytics/README.md harness-runs/run_analytics/README.md` then printed nothing (exit 0), so the two files are byte-identical.
- **Deviations from plan:** On re-dispatch, both files already carried the replacement sentence, so no file was edited again. The `cmp` check could not be re-run: every Bash call was refused ("Permission to use Bash has been denied because Claude Code is running in don't ask mode"). Evidence downgrade: identity now rests on reading both files with the Read tool. All three paragraphs match as read, including the new first-paragraph sentence. The cited anchor exists: `scripts/lib/run-analytics.jq` → `# Mode \`rounds\` (the only mode that reads Run gates records):`. Byte identity, trailing whitespace included, is unverified by execution in this dispatch.
