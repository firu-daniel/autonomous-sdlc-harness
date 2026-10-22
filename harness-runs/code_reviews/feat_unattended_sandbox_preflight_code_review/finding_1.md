### 1. `sandbox-prerequisites` tells a job, and a `github-actions` repository, that the local watcher will refuse its launches

**File:** `cli/src/doctor/checks.ts` (`SANDBOX_PREREQUISITES_CHECK`) — "Until then the watcher refuses every fresh local launch"

`SANDBOX_PREREQUISITES_CHECK.run` adds the same consequence sentence to every definite missing piece: "Until then the watcher refuses every fresh local launch, and the agent CLI (…) exits at startup under `failIfUnavailable`". That is true only for a `local` repository in a default run. It is false in two cases the check also grades:

- **Under `--remote-job`**, which is the remote job's `Preflight with doctor` step. The job's session is launched by `autonomous-watcher.sh job`, and the preflight's own `FAIL` stops the job before that. No local watcher refuses anything there. `process_inbox_file`'s refusal is guarded by `[ "$remote" != 1 ]`, and job mode never reaches it (the THE SANDBOX PREFLIGHT block in `cli/templates/scripts/autonomous-watcher.sh`).
- **In a default run where `execution.target` is `github-actions`.** The watcher sends every drop to GitHub and never consults the probe (`cli/test/watcher-sandbox-refusal.test.mjs` case (e) pins this). An operator on a Linux machine with no `bubblewrap` therefore reads a warning saying their launches are being refused. None are. The warning sends them to install packages on a host that runs no session.

The grades are right. Only the consequence sentence is wrong.

**Fix:** choose the consequence sentence by mode. `remoteExecutionApplies` is already imported into this module from `../config/model.js`. In `SANDBOX_PREREQUISITES_CHECK.run`, replace the `missing.length > 0` push with:

```ts
    if (missing.length > 0) {
      const agent = `\`${DEFAULT_AGENT_CLI}\`, or \`$${AGENT_CLI_VARIABLE}\``;
      const consequence = ctx.remoteJob
        ? `This job's agent session (${agent}) would exit at startup under \`failIfUnavailable\``
        : ctx.config !== undefined && remoteExecutionApplies(ctx.config)
          ? `\`execution.target\` is \`github-actions\`, so the watcher dispatches every drop to GitHub Actions and refuses none here, but a session started on this host (${agent}) exits at startup under \`failIfUnavailable\``
          : `Until then the watcher refuses every fresh local launch, and the agent CLI (${agent}) exits at startup under \`failIfUnavailable\``;
      sentences.push(`${describeMissingPieces(missing, facts.kernelRelease, facts.platform).join(' ')} ${consequence}`);
    }
```

In the check's doc comment, change the second bullet's reason ("the watcher refuses every fresh local launch, and the agent CLI exits at startup under `failIfUnavailable`") to: "a local repository's watcher refuses every fresh local launch, a job's session would exit at startup under `failIfUnavailable`, and a `github-actions` repository's watcher refuses nothing here". This keeps the comment equal to the code.

Then extend case (b) of `cli/test/doctor-sandbox-prerequisites.test.mjs`, which already runs only on a Linux host:

- assert that the `FAIL` line from the `--remote-job` run does not include `the watcher refuses` and does include `This job's agent session`;
- add one run against a fixture whose `harness.config.json` carries `"execution": { "target": "github-actions" }`, with the same git-only `PATH` and no flag. Assert that its `WARN sandbox-prerequisites` line includes `refuses none here`.

Write the edited config the way `takeOptOut` does. That test file is the one this fix edits, so it is the only one the fix runs: `npm test --workspace cli -- test/doctor-sandbox-prerequisites.test.mjs`.
