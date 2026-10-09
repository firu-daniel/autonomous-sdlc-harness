### Task 4 — Move the `doctor`, `config`, profile, daemon and stack-preset suites to the fresh-init scripts directory

**Goal:** Five suites that run `init` against a fixture and then address the written scripts as `scripts/…` read the directory a fresh `init` writes from the shared constant. They also account for the absent-key warning wherever they assert warning-free output. Once done, each suite passes against the Task 1 / Task 2 CLI.

**Depends on:**
- **Task 2**, which re-exports this from `cli/test/helpers/fixture.mjs`:

  ```js
  export { INIT_SCRIPTS_DIR } from '../../dist/config/model.js';
  ```

  The value is `'harness-scripts'`: the `scriptsDir` a configless `init` writes since Task 1.
- **Task 2's warning.** `checkConfigShape` (`cli/src/config/check.ts`) adds a **warning** at path `scriptsDir` when the key is absent. `doctor`'s `config` check reports it, and `init`'s kept path and `config` print it. It never makes `doctor` exit non-zero.

**The rule every suite here is moved by.** It is the same rule Tasks 3, 5 and 6 apply:
- A reference to the adopter's scripts directory written as `'scripts'`, `join(…, 'scripts', …)` or `scripts/…` moves to `INIT_SCRIPTS_DIR` when the scripts it names were written by an `init` that **generated** the config — the fixture held no `harness.config.json` at the first `init`.
- It stays when the suite **seeded** its own config, because that config's value or its absence (meaning `scripts`) still decides.
- A seeded config without `scriptsDir`, in a case that asserts on warnings or on `doctor`'s warn count, either accounts for the new warning or gains `"scriptsDir": "scripts"` where the case is not about that key.
- Paths into the package's own `templates/scripts/` (`PACKAGE_ROOT`) never move.

### Targets

- `cli/test/doctor.test.mjs`
- `cli/test/config-command.test.mjs`
- `cli/test/profile.test.mjs`
- `cli/test/daemon.test.mjs`
- `cli/test/stack-presets.test.mjs`

**Work:**

- [ ] **`doctor.test.mjs`** (the largest set of references, about 13 path sites). Apply the rule. The `daemon-path` / watcher-presence cases and the notifier (`--test-notification`) cases resolve under the configured `scriptsDir`, so their fixture paths follow it. Where a case lists `doctor`'s warnings exhaustively over a hand-written config, add the `scriptsDir` warning or the explicit key.
- [ ] **`config-command.test.mjs`.** `TEST_COMMAND`, `TYPECHECK_WRAPPER` and `TYPECHECK_WRAPPER_FILE` are built from `INIT_SCRIPTS_DIR` where their fixture is a configless `init`. Its byte-identical refusal cases stay byte-identical.
- [ ] **`profile.test.mjs` and `stack-presets.test.mjs`.** Each carries a module-level `SCRIPTS_DIR = 'scripts'`. Re-derive it from `INIT_SCRIPTS_DIR` where the suite's `init` generated the config, or keep it and name the seeded config that justifies it in a comment.
- [ ] **`daemon.test.mjs`.**
  - **The two path constants.** `WATCHER_IN_REPO` and `LIB_IN_REPO`, and every rendered `ExecStart=` / unit-path expectation built on them, follow the rule.
  - **The literal unit-text expectations,** such as the `ExecStart=/bin/bash "/home/ada/100%% mine/my \"repo\"/scripts/autonomous-watcher.sh"` assertion. Each is built from the constant where its config was generated, and left literal where the case seeds `scriptsDir`.
- [ ] **List what stays.** At each suite's header, or beside the case that seeds a config, record in one comment line any reference left at `scripts` on purpose, with the seeded config that justifies it, so a later reader does not "fix" it.

**Verification:**

- Run each edited file on its own, from the repository root, as one foreground command each:

  ```
  npm test --workspace cli -- test/doctor.test.mjs
  npm test --workspace cli -- test/config-command.test.mjs
  npm test --workspace cli -- test/profile.test.mjs
  npm test --workspace cli -- test/daemon.test.mjs
  npm test --workspace cli -- test/stack-presets.test.mjs
  ```

  Each passes, with its counts read back.
- Grep the five files for `'scripts'` and `scripts/` afterwards. Every hit is one of three things: a `templates/scripts` package path, a seeded config's own value, or a site carrying the comment the last Work bullet requires.
