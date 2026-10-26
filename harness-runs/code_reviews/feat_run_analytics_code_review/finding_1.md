### 1. The `branch-status` digest reads a remote run's analytics from the mirror, which `remote-run.sh sync` never refreshes

**File:** `plugin/commands/branch-status.md` (`## Steps`, step 4, the **Run analytics** bullet): "for a remote record that is the run's local mirror, so the digest shows what was last synced"

**The problem.** The digest tells the command to read `<worktree>/<state_dir>/run_analytics/<branch>/run-analytics.json`. For a **Remote record**, it says the mirror holds "what was last synced". The mirror never holds that file from the job:

- In a GitHub Actions job, `record_run_analytics` (`cli/templates/scripts/autonomous-watcher.sh`) commits the record on the branch in the job's checkout. The workflow's `Push the branch` step then pushes it to `origin/<branch>`. That is the record's only route off the runner.
- `remote-run.sh` → `verb_sync`, case 3, restores the downloaded bundle through `hr_remote_bundle_restore "$download" "$worktree" "$branch" mirror`.
- In `mirror` mode, `hr_remote_bundle_restore` (`cli/templates/scripts/lib/harness-run-lib.sh`) copies only the clarification directory and the pause file, then returns (`[ "$mode" = job ] || return 0`).
- No `sync` step fetches, merges or resets the mirror's branch.

So for every remote run, the digest prints one of two things:
- nothing, when the mirror never had a local session;
- the figures of whatever local sessions ran before the run moved to GitHub.

The command presents either one as the last-synced state. A user reading the digest gets wrong or missing time and cost figures for exactly the runs whose sessions they cannot watch locally.

**Fix.** Edit only that bullet in `plugin/commands/branch-status.md`. Replace this clause:

> `<worktree>` from step 3; for a remote record that is the run's local mirror, so the digest shows what was last synced; the **No local record** arm has none and prints nothing

with:

> `<worktree>` from step 3. For a **Remote record**, read the record from the branch on GitHub instead, because the job commits it there and `remote-run.sh sync` restores only the clarification and pause files into the mirror: run `git -C <MAIN_REPO> show origin/<branch>:<state_dir>/run_analytics/<branch>/run-analytics.json` **once**, which reads the remote-tracking ref as of the main checkout's last fetch. A non-zero exit means there is no such ref or file, and prints nothing. The **No local record** arm has no record to read and prints nothing.

Change nothing else in the bullet:
- the opening condition: "When `$ARGUMENTS` focuses one branch and … exists";
- the three line formats;
- the parse and schema rule: "A file that does not parse, or whose `schema` is not `1` …";
- the closing "Name no tunable, write nothing, and run no script."

The `git show` call is a read. It falls under "run no script" no more than the existing `remote-run.sh status` call does.

This file has no test to run. The change is verified by re-reading `remote-run.sh` → `verb_sync` and `hr_remote_bundle_restore` against the new wording.
