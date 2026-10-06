### 2. `forge_report`'s function comment carries one line far past the file's comment wrap

**File:** `cli/templates/scripts/remote-run.sh` (the comment above `forge_report`) — "comment marked stopped; nothing is posted only when neither is known. Every event but `stopped` is"

**Problem.** Task 3 extended `forge_report`'s function comment and left one line of about 100 characters. The rest of that comment block, like the file's other comment blocks, wraps at about 80 columns. This is presentation only, and no behaviour depends on it.

**Fix.** Re-wrap the comment's lines from "its issue read from the task prompt at <sha>, and then each pull request" through "`harness run` run, read from a fresh listing. `not_started` reads". Change no word. Replace:

```
# its issue read from the task prompt at <sha>, and then each pull request
# forge_gone_prs_var lists given the same comment, the label and its progress
# comment marked stopped; nothing is posted only when neither is known. Every event but `stopped` is
# withheld when the branch's newest `harness stop` run is newer than its newest
# `harness run` run, read from a fresh listing. `not_started` reads
```

with:

```
# its issue read from the task prompt at <sha>, and then each pull request
# forge_gone_prs_var lists given the same comment, the label and its progress
# comment marked stopped; nothing is posted only when neither is known. Every
# event but `stopped` is withheld when the branch's newest `harness stop` run is
# newer than its newest `harness run` run, read from a fresh listing.
# `not_started` reads
```

Then join `# `not_started` reads` with the next line, "# REPORT_NOT_STARTED_STATE (`paused`, else `failed`) and", into `# `not_started` reads REPORT_NOT_STARTED_STATE (`paused`, else `failed`) and`. Leave the remaining lines of the comment as they are.

This fix edits no test file, so it runs no test.
