### 2. `probeKeepAwakeHost` reads the `GITHUB_ACTIONS` environment variable as a retyped literal

**File:** `cli/src/doctor/checks.ts` (`probeKeepAwakeHost`): "githubActions: process.env['GITHUB_ACTIONS'] === 'true'"

**What goes wrong.** `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time` states that *"An environment-variable name is a constant with an owner too … read through its constant and never retyped as a literal"*. Everywhere else in `cli/src` the rule holds. Even names this CLI does not own are given constants: `NO_REPLACE_OBJECTS_ENV` and `GRAFT_FILE_ENV` in `cli/src/core/git.ts`, and `CLAUDE_HOME_VARIABLE` in `cli/src/machine/paths.ts`. `PATH` is the one long-standing exception. This branch adds the first read of `GITHUB_ACTIONS` anywhere in `cli/src`, spelled inline. The same function declares `KEEP_AWAKE_LOCK_PROBE_ENV` and cites the rule in its doc comment.

**Fix.** In `cli/src/doctor/checks.ts`, declare the constant directly above `KEEP_AWAKE_LOCK_PROBE_ENV`:

```ts
/** The variable GitHub Actions sets to `true` on every runner; `keep-awake` reads it to report a runner as not applicable. Read through this constant alone. */
const GITHUB_ACTIONS_VARIABLE = 'GITHUB_ACTIONS';
```

Then, in `probeKeepAwakeHost`, read it through the constant:

```ts
    githubActions: process.env[GITHUB_ACTIONS_VARIABLE] === 'true' || ctx.remoteJob,
```

No test reads the constant, and the existing suites cover the behaviour. The suite that covers this check is `npm test --workspace cli -- test/doctor-keep-awake.test.mjs`, but this fix edits no test file, so it runs none of its own. The Run gates phase runs the full suite.
