### 2. Existing `restore` / `sync` suites now fail whenever `HARNESS_GITHUB_DEFAULT_COMMIT` is in the test process's environment

**File:** `cli/test/helpers/fixture.mjs` (`ISOLATED_ENV`) — "const ISOLATED_ENV = Object.freeze({"

This branch makes `hr_remote_state_dir_var` read `stateDir` from the trusted configuration whenever `HARNESS_GITHUB_DEFAULT_COMMIT` is non-empty. `hr_remote_bundle_restore`, `hr_remote_move_aside`, `hr_remote_bundle_write` and `remote-run.sh`'s `restore` / `save` setup gate all go through it. The variable is the only switch: the code does not check that it is actually running in a job. Every fixture subprocess gets `{ ...process.env, ...ISOLATED_ENV, ...env }` (`run` / `runBounded`). So a value in the test runner's own environment reaches every `remote-run.sh restore`, `sync`, `save` and watcher job-mode case. Those cases point that commit id at a fixture repository that does not contain it. The trusted read then fails, `hr_remote_state_dir_var` returns 2, and the verb refuses.

Measured on this branch:

```
HARNESS_GITHUB_DEFAULT_COMMIT=0123456789abcdef0123456789abcdef01234567 npm test --workspace cli -- test/remote-run.test.mjs
```

At least 20 cases print `not ok`. They include every `restore …` case from `restore places the previous bundle in job mode on --resume none` through `restore --resume answer with the newest bundle expired …`, and the `sync applies a parked bundle …` family. The variable is in the environment in exactly one situation: inside a `harness-run` job, because `Record the default branch's commit` writes it to `$GITHUB_ENV` and every later step inherits it, the session's gate runs included. A remote run of any repository whose gates include this suite would therefore fail its gates for a reason unrelated to its change. The new `cli/test/remote-save-links.test.mjs` already guards against this case by case (its header: *"every case but (T) passes `HARNESS_GITHUB_DEFAULT_COMMIT` empty so that an ambient value cannot select trusted mode"*). The older suites the branch newly exposes do not.

**Fix:** blank the variable in the shared isolated environment, so a case that wants trusted mode has to set it explicitly. Explicit `env` arguments are spread after `ISOLATED_ENV`, so they still win. In `cli/test/helpers/fixture.mjs`, change

```js
const ISOLATED_ENV = Object.freeze({
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_SYSTEM: '/dev/null',
  GIT_TERMINAL_PROMPT: '0',
});
```

to

```js
const ISOLATED_ENV = Object.freeze({
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_SYSTEM: '/dev/null',
  GIT_TERMINAL_PROMPT: '0',
  HARNESS_GITHUB_DEFAULT_COMMIT: '',
});
```

Then append this paragraph to the doc comment directly above it, after the paragraph that ends "…had stopped reading the repository entirely.":

```
 * `HARNESS_GITHUB_DEFAULT_COMMIT` is blanked because the remote bundle library switches to the
 * trusted configuration whenever it is non-empty, and a `harness-run` job exports it to every later
 * step, a session's gate runs included; a case that exercises trusted mode passes it explicitly.
```

`fixture.mjs` is a helper rather than a suite, so this fix edits no test file and runs no test file. The unit runs `bash scripts/typecheck.sh` (the configured `commands.typecheck`) only; Phase G's full suite confirms that `cli/test/remote-run.test.mjs` and `cli/test/remote-save-links.test.mjs` still pass.
