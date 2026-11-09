### 2. The intake refusal's notification names a run log that is never written; the reason is in `watcher.log`

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`reject_preserving_status`) — `notify failed "$branch" "$LOGS_DIR/$branch.log" "$reason"`; and its new caller in `process_inbox_file` — "The intake refusal — see above."

`reject_preserving_status` always passes `$LOGS_DIR/$branch.log` as the notifier's `log_path`, and `autonomous-notify.sh` renders it into the message as `Log: <path>` (`MESSAGE="$MESSAGE Log: $LOG_PATH"`). For the helper's earlier callers that is right: a `parked`, `paused` or `park_loop` record means the branch has a run log. For the intake refusal this branch adds it is wrong: nothing is created for a refused branch — the branch's own `assertRefusedAtIntake` asserts that `autonomous_logs/<branch>.log` does **not** exist — and the one line explaining the refusal goes through `log`, into `watcher.log`. So the notification points the user at `autonomous_logs/main.log` (or `a..b.log`), a file that does not exist, while the record of why sits in `autonomous_logs/watcher.log`.

**Fix:** give the helper an optional log-path argument and pass the watcher log from the intake call.

```bash
reject_preserving_status() {
  local branch="$1" file="$2" fname="$3" reason="$4" log="${5:-$LOGS_DIR/$1.log}"
  mv "$file" "$ARCHIVE_DIR/rejected_$(date '+%Y%m%d%H%M%S')_$fname" 2>/dev/null || rm -f "$file"
  notify failed "$branch" "$log" "$reason"
}
```

In `process_inbox_file`, append `"$WATCHER_LOG"` as the fifth argument of the intake-refusal call (`WATCHER_LOG` is set at start-up to `$LOGS_DIR/watcher.log`). Extend the helper's comment sentence "Also used by process_inbox_file's intake refusal …" with: "which passes watcher.log as the log to name, since the refused branch has no run log." The three existing callers keep four arguments and their behaviour. The test notifier stub records only the event, branch and detail, so no case observes this argument and no test change is owed.
