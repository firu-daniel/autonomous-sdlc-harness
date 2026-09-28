### 2. `doctor --help` and three doc comments say `--remote-job` moves two checks; it moves three

**File:** `cli/src/commands/doctor.ts` (`DOCTOR_USAGE`) — "turns two warnings into failures: profile-paths, when no rule in the profile covers"

Under `--remote-job`, three checks move from `warn` to `fail`: `profile-paths` (`PROFILE_PATHS_CHECK`, `if (!covered && ctx.remoteJob)`), `plugin-permissions` (`PLUGIN_PERMISSIONS_CHECK`, `(ctx.remoteJob ? fail : warn)`) and the new `profile-tracked` (`PROFILE_TRACKED_CHECK`, `return ctx.remoteJob ? fail(finding) : warn(finding)`). `docs/cli.md` → `## 7. \`doctor\`` gets this right ("it turns three profile warnings into failures"). The command's own text does not, at four sites:

- `cli/src/commands/doctor.ts` → `DOCTOR_USAGE`: "turns two warnings into failures: profile-paths, … and plugin-permissions, …". This is what an operator reads in `doctor --help`. An operator who runs `doctor --remote-job` locally on a repository whose profile an earlier release committed is told only two checks can fail, and then gets exit 1 from a third.
- `cli/src/commands/doctor.ts`, module header: "{@link REMOTE_JOB_FLAG} reaches no network either: it changes two checks' grades and nothing else."
- `cli/src/commands/doctor.ts` → the `REMOTE_JOB_FLAG` doc comment: "`profile-paths` and `plugin-permissions` fail instead of warning".
- `cli/src/doctor/checks.ts` → `CheckContext.remoteJob` doc comment: "{@link PROFILE_PATHS_CHECK} and {@link PLUGIN_PERMISSIONS_CHECK} fail where they otherwise warn".

**Fix:** name all three at each site.

- [ ] `DOCTOR_USAGE`: replace the four lines starting `` `${REMOTE_JOB_FLAG} turns two warnings into failures: `` with:
  ```ts
  `${REMOTE_JOB_FLAG} turns three warnings into failures: profile-paths, when no rule in the profile`,
  'covers this checkout; profile-tracked, when the profile is committed at HEAD; and plugin-permissions,',
  'when an entry a plugin root needs is missing or no plugin root resolves. It also requires every plugin',
  'root in permissions.additionalDirectories. The remote workflow passes it, so its preflight stops before',
  'a session that would park. It reaches no network.',
  ```
- [ ] Module header: "it changes two checks' grades and nothing else" → "it changes three profile checks' grades, and what `plugin-permissions` grades, and nothing else".
- [ ] `REMOTE_JOB_FLAG` doc comment: "`profile-paths` and `plugin-permissions` fail instead of warning" → "`profile-paths`, `profile-tracked` and `plugin-permissions` fail instead of warning".
- [ ] `CheckContext.remoteJob` doc comment: "{@link PROFILE_PATHS_CHECK} and {@link PLUGIN_PERMISSIONS_CHECK} fail where they otherwise warn, and the latter also grades" → "{@link PROFILE_PATHS_CHECK}, {@link PROFILE_TRACKED_CHECK} and {@link PLUGIN_PERMISSIONS_CHECK} fail where they otherwise warn, and the last also grades".

This changes text only. No test pins the old wording.
