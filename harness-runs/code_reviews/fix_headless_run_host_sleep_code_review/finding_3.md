### 3. An unreadable `harness.config.json` is reported as "`execution.keepAwake` is not a boolean"

**File:** `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_keep_awake_mode_var`): "HR_KEEP_AWAKE_REASON='execution.keepAwake is not a boolean'". Its byte-identical mirror is `scripts/lib/harness-run-lib.sh`.

**What goes wrong.** `hr_keep_awake` returns `2` in two cases: when the value is not a boolean, and when `hr_config_load` fails (an absent, unparsable or multi-document file, or one with no `defaultBranch`). Its own comment says so, and `cli/test/keep-awake-lib.test.mjs` pins the `no file` → `2` case. `hr_keep_awake_mode_var` maps every `2` to the reason `execution.keepAwake is not a boolean`. As a result, a main checkout whose `harness.config.json` cannot be read produces these lines:
- `keep-awake: not holding for '<branch>' — execution.keepAwake is not a boolean` at launch;
- `keep-awake: released '<branch>' — execution.keepAwake is not a boolean` in `keep_awake_pass`;
- `keep-awake: off — execution.keepAwake is not a boolean` under `status`.

An operator who reads any of them will look for a non-boolean value that is not in the file.

**Fix.** In both copies of the library, test the load before reading the key in `hr_keep_awake_mode_var`. Insert this directly above the existing `hr_keep_awake "$root" || rc=$?` line, and leave the job-mode and `GITHUB_ACTIONS` arms ahead of it unchanged:

```sh
  if ! hr_config_load "$root"; then
    HR_KEEP_AWAKE_REASON='harness.config.json could not be read'
    return 0
  fi
```

The `2)` arm that follows then applies only to a value that really is not a boolean. The mode stays `off` and `HR_KEEP_AWAKE_QUIET` stays empty, so the launch still logs one line. Run `cmp` on the two library copies afterwards.

**Test.** In `cli/test/keep-awake-lib.test.mjs`, test `hr_keep_awake_mode_var takes each arm in order with its exact reason and quiet flag`, add one arm directly after the `key "yes"` arm:

```js
    ['config unreadable (no defaultBranch)', { config: { execution: { keepAwake: true } } }, ['off', 'harness.config.json could not be read', '']],
```

Run that file's own suite only: `npm test --workspace cli -- test/keep-awake-lib.test.mjs`.

- **Deviations from plan:** Dispatched on the `cli` layer (path `cli`), so only `cli/templates/scripts/lib/harness-run-lib.sh` and `cli/test/keep-awake-lib.test.mjs` were edited. The mirror `scripts/lib/harness-run-lib.sh` lies in the `general` layer and was not touched: `cmp cli/templates/scripts/lib/harness-run-lib.sh scripts/lib/harness-run-lib.sh` now reports `differ: char 106614, line 2220` (exit 1). The same four-line insertion must be applied to `scripts/lib/harness-run-lib.sh` by a `general`-layer dispatch, after which `cmp` must exit 0. The `cmp` step of this finding is therefore not met by this dispatch.
- **Deviations from plan:** `general`-layer dispatch applied the same four-line insertion to `scripts/lib/harness-run-lib.sh` directly above `hr_keep_awake "$root" || rc=$?` in `hr_keep_awake_mode_var`; `cmp cli/templates/scripts/lib/harness-run-lib.sh scripts/lib/harness-run-lib.sh` now exits 0. `bash scripts/typecheck.sh` printed `PASS: typecheck`. This dispatch edited no test file, so `npm test --workspace cli -- test/keep-awake-lib.test.mjs` (which sources the `cli/templates` copy, edited by the `cli` dispatch) was not run here; it is deferred to the Run gates phase, whose `commands.test` runs the suite.
