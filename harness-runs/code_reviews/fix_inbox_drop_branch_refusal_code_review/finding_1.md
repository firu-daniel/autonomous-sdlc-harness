### 1. The intake refusal's notification tells the user to rename the branch even when the cause is an unresolvable protected set

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`process_inbox_file`) — "drop it again under an unprotected, valid branch name"

The intake refusal sends one `failed` notification whose detail is built once for all three refusal reasons:

```bash
reject_preserving_status "$branch" "$file" "$fname" "(refused at intake: $HR_INBOX_REFUSAL — nothing created, committed or launched; drop it again under an unprotected, valid branch name)"
```

`hr_inbox_branch_refusal_var` (`cli/templates/scripts/lib/harness-run-lib.sh`) has three reasons, and the third — "whether '<branch>' is protected cannot be judged: the protected set in '<root>/harness.config.json' cannot be resolved" — refuses **every** branch, `feat_x` included (the branch's own case `while the protected set cannot be resolved any drop is refused at intake` in `cli/test/watcher-remote-dispatch.test.mjs` proves exactly that). For that reason the remedy the notification gives is wrong: a user who follows it renames an already-valid, unprotected branch, drops the file again, and is refused again for the same reason. The way on is to repair `harness.config.json` (restore `defaultBranch`, fix the JSON) and drop the same file again. The notification is the one place the user reads this refusal without opening a log, so its remedy is the instruction they act on.

**Fix:** make the remedy clause correct for all three reasons. Replace the detail string with:

```bash
reject_preserving_status "$branch" "$file" "$fname" "(refused at intake: $HR_INBOX_REFUSAL — nothing created, committed or launched; rename the drop to an unprotected, valid branch name, or, when the protected set cannot be resolved, repair harness.config.json, then drop it again)"
```

The log line above it is unchanged. No test asserts the remedy clause (`assertRefusedAtIntake` matches only `^\(refused at intake: `), so no test needs editing and no test run is owed.
