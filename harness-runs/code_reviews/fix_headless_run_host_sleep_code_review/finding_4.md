### 4. `watcher-stall-reset-payloads`'s `localStall` takes a real logind lock on a Linux host, against the test tree's stated rule

**File:** `cli/test/watcher-stall-reset-payloads.test.mjs` (`localStall`): "`hr_sandbox_prereq_probe_var() {\n${DEFAULT_SANDBOX_PROBE}\n}`,". The header of `cli/test/helpers/watcher.mjs` names the gap: "A suite running its own pass script (`localStall` above among them) is not covered by this override."

**What goes wrong.** `localStall` launches a real watcher pass and overrides the sandbox probe, but not `hr_keep_awake_probe_var`. On a Linux developer host with `systemd-inhibit` on `PATH`, every `localStall` case runs the launch head's synchronous `systemd-inhibit --what=sleep:handle-lid-switch --mode=block … true` probe. It then starts a real logind block lock held for the stub session's life. On macOS it starts a real `caffeinate -s -i -w`.

`cli/test/helpers/fixture.mjs` sets `KEEP_AWAKE_LOCK_PROBE_ENV` to `off` precisely because *"no test takes one unasked"*. The story plan's accepted test cost covers only the macOS `caffeinate` case and CI, and says nothing about a Linux host. Every other suite that runs its own pass script on this branch already defines the override: `watcher-stall-host-sleep` and `watcher-keep-awake`.

**Fix.**

1. In `cli/test/watcher-stall-reset-payloads.test.mjs`, import the default probe beside the sandbox one:

```js
import { createWatcherFixture, DEFAULT_KEEP_AWAKE_PROBE, DEFAULT_SANDBOX_PROBE } from './helpers/watcher.mjs';
```

   Add the override to `localStall`'s script array, directly after the sandbox override line:

```js
        `hr_keep_awake_probe_var() {\n${DEFAULT_KEEP_AWAKE_PROBE}\n}`,
```

2. In `cli/test/helpers/watcher.mjs`, the header ends with the sentence *"A suite running its own pass script (`localStall` above among them) is not covered by this override."* Replace it with: *"A suite running its own pass script defines the same override from {@link DEFAULT_KEEP_AWAKE_PROBE}, as `localStall` above does."*

Run the edited suite only: `npm test --workspace cli -- test/watcher-stall-reset-payloads.test.mjs`. The helper's edit is a comment, and the Run gates phase covers it.

- **Deviations from plan:** Evidence downgrade: the single-file run `npm test --workspace cli -- test/watcher-stall-reset-payloads.test.mjs` hit the 600 s foreground limit and was moved to the background by the tool layer, so it was not waited on and no result was produced. The claim that the suite passes with the override in place currently rests only on reading the edit. The edit adds one script line that has the same shape as the existing `hr_sandbox_prereq_probe_var` override, and it imports a constant that `cli/test/helpers/watcher.mjs` exports and that `watcher-stall-host-sleep` and `watcher-keep-awake` already use the same way. The suite is part of `bash scripts/test.sh`, which the Run gates phase runs. `bash scripts/typecheck.sh` was run as written and printed `PASS: typecheck`.
