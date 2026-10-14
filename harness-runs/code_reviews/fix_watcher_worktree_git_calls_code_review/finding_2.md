### 2. `remote-run.sh save` is classified as reading state files "as data", but it follows a session-planted symbolic link and uploads the target

**File:** `docs/remote-execution.md` → `## 11. Security` → `**The branch's own files are checked before the job trusts them.**`, the bullet `**The post-session steps on a job that passed.**`, at "`save`, `deliver` and `continue` read state-directory files as data". Also `docs/cli.md` → `## 6.` → `**Residuals, stated rather than hidden:**`, residual 1, after item 4 ("`lib/harness-run-lib.sh` → `hr_remote_bundle_restore` writes into a run's checkout through paths it does not test for a symbolic link.").

**The problem.** Task prompt goal 4 asks for the job's post-session steps to be classified (`push-branch.sh`, `remote-run.sh save`, `deliver` and `continue`). They run unsandboxed in the tree the session wrote. The new bullet classifies `save` as reading state-directory files "as data". That is incomplete.

`save` builds the bundle through `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_bundle_write`. It reads each source with a plain `cp`, which follows a symbolic link:
- `cp "$base/$HR_REMOTE_PAUSE_FILE" …`
- `cp "$base/$HR_REMOTE_WALKER_SOURCE" …`
- `cp "$base/$HR_REMOTE_LOGS_DIR/$branch.log" …`
- `cp "$base/$HR_REMOTE_STATUS_SOURCE" …`
- each planning file `cp "$base/$rel" "$dst"`

Its `[ -f … ]` guards follow a link too.

The state directory is sandbox-writable (`allowWrite` names it). A session can therefore replace `PAUSE_PROGRESS.md` or `autonomous_logs/<branch>.log` with a link to a file its own credential `Read` denies keep it from reading. The unsandboxed `save` then copies that file's bytes into the `harness-state` artifact. Anyone who can read the repository's artifacts can download that artifact. The next job's `remote-run.sh restore` puts the bytes back into the checkout, where that job's session can read them.

This is a read past the sandbox's denies rather than code execution. The branch already states the write side of the same pattern as residual 1 item 4. The read side needs stating too. Without it, a reader of §11 concludes that the post-session steps leak nothing.

**Fix.** Documentation only. Whether `save` should harden instead is a question for the maintainer, raised with this review.

1. In `docs/remote-execution.md`, in that bullet, replace "`save`, `deliver` and `continue` read state-directory files as data and read refs against the runner-owned `.git/config`." with:

   > `deliver` and `continue` read state-directory files as data and read refs against the runner-owned `.git/config`; `save` does too, but it reads each bundle file with a `cp` that follows a symbolic link, so a link the session planted in the state directory has `save` upload the file it names ([`cli.md`](cli.md) → `## 6. The failure modes the permission profile encodes` → `**Residuals, stated rather than hidden:**`, residual 1).

2. In `docs/cli.md`, residual 1, add this item after item 4 (`hr_remote_bundle_restore` …), renumbering the object-store item to 6:

   > 5. **`lib/harness-run-lib.sh` → `hr_remote_bundle_write` reads a run's state directory through paths it does not test for a symbolic link.** `remote-run.sh save` runs it unsandboxed in the job's checkout after the session. Each `cp` of `PAUSE_PROGRESS.md`, `.flow_walker_state`, `autonomous_logs/<branch>.log`, `autonomous_logs/remote_status.json` and each planning file follows a link the session planted there. So does each `[ -f ]` test before it. The bundle can therefore carry a file the session's own `Read` denies withheld from it. The bundle is uploaded as the `harness-state` artifact and restored into the next job's checkout.
