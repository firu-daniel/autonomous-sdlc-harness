### 3. Under `--remote-job`, the `plugin-permissions` failure says `init` does not generate the entries and tells the operator to paste lines into a job's profile

**File:** `cli/src/doctor/checks.ts` (`PLUGIN_PERMISSIONS_CHECK`) — "`\`${CLI} init\` does not generate ${missing.length === 1 ? 'it' : 'them'}`"

This branch makes a missing plugin-root entry a `fail` under `--remote-job` (`return (ctx.remoteJob ? fail : warn)(…)`). It adds a second `fail` for a missing `permissions.additionalDirectories` root (`if (missing.length === 0 && missingDirectories.length > 0)`). Both reuse the local-machine remedy text:

- The `missing.length > 0` arm says "`` `${CLI} init` does not generate them — a root is machine-local and the install root carries the plugin version, so an entry written once goes stale on an upgrade and this check re-derives it instead ``", then "Add each line below to that list …".
- The directories-only arm says "Add each line below to that list as its own string …".

In the job, both statements are wrong. The step just before the preflight runs `init --plugin-root-entries` (`cli/templates/github/workflows/harness-run.yml` → `Generate the job's permission profile`). That step does generate these entries and directories, through the same builder (`generatedPluginRootEntries` → `pluginRootEntries` / `pluginRootDirectories`). There is also nobody to paste anything into a runner's profile. So on a runner, a missing entry means the job is running a profile it did not generate: a committed copy that the create-if-absent `init` kept, which `profile-tracked` fails on in the same report. The other possibility is that the plugin root contains a character the permission guard matches literally, which `generatedPluginRootEntries` screens out with a warning in that step's log. An operator reading this `FAIL` in a job log is told the one thing the job just did is not possible, and is given a remedy that cannot be applied.

**Fix:** under `ctx.remoteJob`, replace the local remedy with the job's remedy. Keep the printed lines, because they still identify what is missing.

- [ ] Import `PLUGIN_ROOT_ENTRIES_FLAG` from `../generators/permissionProfile.js` in the existing import block.
- [ ] Beside `jobClause`, add:
  ```ts
  const jobRemedy = ` In a remote job \`${CLI} init ${PLUGIN_ROOT_ENTRIES_FLAG}\`, which the job's setup step runs, writes these into the profile it generates, so a profile lacking them is one that step did not generate — a committed copy its create-if-absent run kept, which the profile-tracked check names the untrack route for — or one whose plugin root carries a character the permission guard matches literally, which that step warned about in its own log. The lines below are what is missing:`;
  ```
- [ ] In the `missing.length > 0` arm, when `ctx.remoteJob` is true, use `jobRemedy` instead of both the sentence starting `` `${CLI} init` does not generate `` (up to and including "this check re-derives … instead.") and the closing "Add each line below to … as its own string, unquoted exactly as it stands:". Keep `${why}${partial}${jobClause}${stray}` and the `\n${blocks.join('\n\n')}${directoryBlock}` tail unchanged. Without `--remote-job`, the message stays byte-identical.
- [ ] In the directories-only arm (`missing.length === 0 && missingDirectories.length > 0`, which is only reached under `--remote-job`), replace " Add each line below to that list as its own string, unquoted exactly as it stands:" with `jobRemedy`.
- [ ] In `cli/test/doctor.test.mjs`, in the `doctor --remote-job fails an unusable profile where a default run warns` suite, extend the two subtests *"the runner-shaped profile lacking the Read grant fails plugin-permissions, naming the Read line"* and *"the Read grant without the root in additionalDirectories fails, naming the directory"*. Assert that the `plugin-permissions` line does not include `does not generate` and does include `profile-tracked`. That test file is the one this fix edits, so it is the only test the fix runs.

**Deviations from plan:** The two extended subtests in `cli/test/doctor.test.mjs` were not run: neither `.claude/context/cli.md` nor `.claude/context/conventions.md` states a single-file test command, so the run is deferred to the Run gates phase. The claim that the assertions hold rests on reading the edited message builders in `PLUGIN_PERMISSIONS_CHECK`, not on execution; `bash scripts/typecheck.sh` was run and passed.
