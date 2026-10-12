### Task 7 — Add `doctor`'s `profile-write-protection` check

**Goal:** `doctor` reports a permission profile that leaves any path which runs outside the sandbox writable from inside it, on either side. A path counts when its `sandbox.filesystem.denyWrite` entry is missing, or either of its `Edit` / `Write` deny rules is missing. The expected set is the generator's own, computed with the profile's own `permissions.additionalDirectories`, so the check and the generator cannot disagree.

**Depends on:**

- Task 3 — `cli/src/generators/writeProtection.ts`:

  ```ts
  protectedPaths({ repoRoot, workRoot, config, additionalDirectories }): readonly ProtectedPath[]
  // ProtectedPath = { path: string; kind: 'file' | 'directory'; reason: string }
  fileToolDenyRules(entry: ProtectedPath): readonly string[]
  // file -> Edit(/<path>), Write(/<path>); directory -> Edit(/<path>/**), Write(/<path>/**)
  ```

- Task 6 — it registers `PROFILE_SANDBOX_CHECK` in `CHECKS` and adds `profile-sandbox` to `cli/test/doctor.test.mjs`'s expected id list. This task registers directly after it and extends the same list. It also extends Task 6's suite `cli/test/doctor-profile-sandbox.test.mjs` rather than creating a second fixture builder.

**Where this task stops.** The sandbox block itself (strict mode, the excluded commands, the domains) is Task 6's check. The `docs/cli.md` table row, severity bullet and `--remote-job` count are **Task 13's**; this task corrects the same count in `doctor`'s own help text and comments, in the same words. The `cli/src/doctor/checks.ts` sentences on what a profile gap costs are **Task 27's**.

### Targets

- `cli/src/doctor/checks.ts` — `PROFILE_WRITE_PROTECTION_CHECK`, registered after `PROFILE_SANDBOX_CHECK`.
- `cli/test/doctor.test.mjs` — add `profile-write-protection` to the expected id list.
- `cli/test/doctor-profile-sandbox.test.mjs` — the grading cases.
- `cli/src/commands/doctor.ts` — the `--remote-job` count in the help text, the module header and the `REMOTE_JOB_FLAG` doc comment (scope register rows 189–190).

**Work:**

- [ ] Check `profile-write-protection`, titled *"everything that runs outside the sandbox is write-protected on both sides"*. Return `unevaluated` without a profile or a config. Compute `protectedPaths` from:
  - the root the profile was generated for (the main checkout, resolved as `buildCheckContext` resolves the profile's location);
  - `workRoot` from `core/paths.ts`;
  - the config;
  - the profile's own `permissions.additionalDirectories` strings.

  For each item, grade two things: its `denyWrite` entry, and its `fileToolDenyRules`.
- [ ] Opted-out profiles (`sandboxOptedOut(config)`, Task 1): grade the file-tool rules only, and say in the line that `denyWrite` is not graded because the sandbox is off.
- [ ] Message and grade:
  - A missing item is named by path with its `reason`, and the side it is missing on. Example: *"`<path>` (the run library the unsandboxed wrappers source) has no sandbox.filesystem.denyWrite entry"*.
  - `warn`, and `fail` under `ctx.remoteJob`. Remedy: `init --force`, which writes a `.bak` first.
  - Argue the grade in the doc comment on `profile-deny-floor`'s terms.
  - The pass line states residual 2: Linux skips a `denyWrite` entry containing `*`, so the worktree-glob items hold there on the file-tool side only. Say this unconditionally, so the line reads the same on every platform and the tests need no platform branch.
- [ ] `doctor-profile-sandbox.test.mjs`: add cases on `init` fixtures:
  - (a) a fresh profile passes;
  - (b) deleting the `denyWrite` entry for the main checkout's `push-branch.sh` warns, naming that path and the side;
  - (c) deleting its `Edit(...)` rule warns, naming the file-tool side;
  - (d) with `docs.retrieval` and `phases.docs` on, deleting the docs-search-server entry warns;
  - (e) case (b) under `--remote-job` fails;
  - (f) with `sandbox.optOut`, deleting a `denyWrite` entry still passes, while deleting an `Edit` rule warns.

  In `doctor.test.mjs`, append `profile-write-protection` after `profile-sandbox` in the expected id list.
- [ ] `cli/src/commands/doctor.ts`: once this check lands, `--remote-job` moves five checks, not three. Rewrite three sentences to the five-check set — the warnings of `profile-paths`, `profile-tracked`, `plugin-permissions`, `profile-sandbox` and `profile-write-protection` become failures, except that a taken sandbox opt-out stays a warning — in the same words Task 13 gives `docs/cli.md` §7:
  - the module header, *"it changes three profile checks' grades"* → five;
  - the `REMOTE_JOB_FLAG` doc comment, *"`profile-paths`, `profile-tracked` and `plugin-permissions` fail instead of warning"* → the five, with the exception;
  - the user-facing help paragraph, *"`${REMOTE_JOB_FLAG}` turns three warnings into failures: profile-paths, … and plugin-permissions"* → the five, one clause each for the two new ones (*"profile-sandbox, when the profile lacks the sandbox block the configuration implies, unless the opt-out was taken; and profile-write-protection, when a path that runs outside the sandbox is writable from inside it"*).

  In the same help paragraph, reword *"so its preflight stops before a session that would park"* to the story's canonical restatement: the preflight stops before a session whose missing entries would be refused at once under the default `dontAsk` mode. Keep *"It reaches no network."* Keep each help line inside the file's existing line width. No case under `cli/test` asserts the old help text (`grep -rn "turns three warnings" cli/test` prints nothing, checked while planning).

**Verification:**

- `npm test --workspace cli -- test/doctor-profile-sandbox.test.mjs` and `npm test --workspace cli -- test/doctor.test.mjs` pass. Both are edited by this task. Then run `commands.typecheck` as written.
- Grep the check body for a path segment such as `push-branch`, `githooks`, `.mcp.json` or `.git/config`, and find none. Every path comes from `protectedPaths`.
- Case (a) is the end-to-end proof that Task 3's generator and this check agree on a fresh profile.
- `grep -n -E 'three (profile checks|warnings)|would park' cli/src/commands/doctor.ts` prints nothing, and `grep -n 'profile-write-protection' cli/src/commands/doctor.ts` hits the help paragraph and the `REMOTE_JOB_FLAG` doc comment.

- **Deviations from plan:** `cli/test/doctor.test.mjs` needed one edit beyond the expected id list. In the `doctor --remote-job fails an unusable profile where a default run warns` suite, the `grantDirectories` helper hand-adds a plugin root to `permissions.additionalDirectories`. `protectedPaths` counts that root as a protected path. With no `denyWrite` entry and no `Edit` / `Write` rules beside it, the new check failed under `--remote-job`, which broke two subtests that expect exit 0: *"the Read grant and the directory both present pass…"* and *"a profile committed at HEAD fails profile-tracked…"*. The helper now also writes the root's `denyWrite` entry and its `Edit(/<root>/**)` / `Write(/<root>/**)` deny rules, the way `init --plugin-root-entries` generates them. After the change the file reports `tests 284`, `pass 284`, `fail 0`. An operator who follows `plugin-permissions`' paste remedy for `additionalDirectories` by hand will still get a `profile-write-protection` finding until they add the protection too. Nothing in this task's scope changes that; it is flagged to the orchestrator.
