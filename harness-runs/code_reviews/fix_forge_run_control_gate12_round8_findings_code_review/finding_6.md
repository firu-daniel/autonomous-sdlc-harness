### 6. The `not_started` comment promises a resume "from its committed ledger" to a first run that has none

**File:** `cli/templates/scripts/remote-run.sh` (`forge_report`, the `not_started)` arm of the text `case`) — "to start it again from its committed ledger."

```bash
      if [ "$state" = paused ] && [ -n "$REPORT_NOT_STARTED_ENGINE" ]; then
        text="$text Comment \`${COMMAND_HANDLE} resume\` to start it again from its committed ledger."
```

This arm is reached for a branch's first run whose job GitHub never started, once the trigger's `started` marker recovers engine `task` (case 5 turned `paused` / `killed`). That branch carries only its task prompt and no flow-progress ledger. The header itself says so (`` THE `killed` AND `expired` MAPPINGS ``: "When that run was the branch's first, the branch has no ledger yet"), and Task 16 corrected `/autonomous-sdlc-harness:branch-resume`'s "from the committed ledger" sentence for exactly this case. The new comment repeats that claim on the issue.

**Fix:** drop the ledger clause, which holds in neither case once a first run can reach this arm:

```bash
        text="$text Comment \`${COMMAND_HANDLE} resume\` to start it again."
```

- [ ] In `cli/test/remote-collect.test.mjs` → "a run whose job never started, with a pull request and a recorded engine: one comment naming resume, paused", change the expected substring `'Comment `@sdlc-harness resume` to start it again from its committed ledger.'` to `'Comment `@sdlc-harness resume` to start it again.'`. Run `npm test --workspace cli -- test/remote-collect.test.mjs` from the repository root. That is the only test this fix runs.
