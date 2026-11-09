### 4. The script-allowlist guard's reason for leaving `run-analytics.sh` allowed omits the log lines it now commits

**File:** `plugin/hooks/autonomous-script-allowlist-guard.sh` (the `LEFT ALLOWED, DELIBERATELY:` comment block) — "`run-analytics.sh` only appends sessions, and the finished Run gates rounds it"

Two places state why an agent may reach `run-analytics.sh` through the guard: this comment, and the comment above the `run-analytics.sh` row of `OUTER_LOOP_SCRIPTS` in `cli/src/generators/outerLoopScripts.ts`. This branch updated the second to say the script also appends "the matching lines of their logs". The guard's copy still says the script "only appends sessions, and the finished Run gates rounds". That is now incomplete: the script reads every finished `<label>.log` in the lane and writes its matching lines, redacted, into the committed `run_analytics/<branch>/` record. A maintainer weighing whether `run-analytics.sh` belongs on the deny list reads, in the guard itself, that it never takes anything from a log. The two statements of one rationale now disagree.

**Fix:** in `plugin/hooks/autonomous-script-allowlist-guard.sh`, replace these comment lines:

```
# `run-analytics.sh` only appends sessions, and the finished Run gates rounds it
# reads from the branch's `<state_dir>/test_run_logs/` lane, to
# `<state_dir>/run_analytics/<branch>/` for the branch and checkout it is given,
# and never rewrites a recorded one.
```

with:

```
# `run-analytics.sh` only appends sessions, and the finished Run gates rounds it
# reads and the matching lines of their logs from the branch's
# `<state_dir>/test_run_logs/` lane, to `<state_dir>/run_analytics/<branch>/`
# for the branch and checkout it is given, and never rewrites a recorded one.
```

The edit is to comment text only. It changes no decision, no filter and no output of the guard, and it asks for no test run.
