### Task 2 — Point `doctor`'s notification advice at the shared destination placeholder

**Goal:** `doctor`'s `notifications` check tells an adopter with no delivery configured how to set it up. Today that advice spells the remedy `` `init --notifications --push-url <url>` ``, which is one more wording of "what may I type here" that disagrees with `init`. Make it print the shared placeholder instead, so the advice names the topic route in the same words as every other surface.

**Depends on:** Task 1, which exports these from `cli/src/generators/notifications.ts`:

```ts
export const PUSH_DESTINATION_PLACEHOLDER = '<url-or-ntfy-topic>';
```

This task imports `PUSH_DESTINATION_PLACEHOLDER` beside the `PUSH_CMD_KEY`, `PUSH_URL_KEY` and `pushEnvCandidates` imports `cli/src/doctor/checks.ts` already takes from that module. It never retypes the placeholder, because the cross-layer rule is that a shared value is imported from its owner.

**Where this task stops.** It changes only the advice sentence. What the check grades, which file it reports as in effect, and `nonEmptyKeys`' by-name parse (which already strips one pair of surrounding quotes, so Task 1's single-quoted values read as set) all stay as they are. `init`'s own wording belongs to Task 3.

### Targets

- `cli/src/doctor/checks.ts` → `deliveryOptInAdvice`.
- `cli/test/doctor.test.mjs` → the `the notifications check reports which settings file is in effect, and never a value` suite.

**Work:**

- [ ] `deliveryOptInAdvice`: replace `` `${CLI} init --notifications --push-url <url>` `` with `` `${CLI} init --notifications --push-url ${PUSH_DESTINATION_PLACEHOLDER}` ``. Nothing else in the sentence changes.
- [ ] `doctor.test.mjs`: in the subtest `neither candidate present warns, leaves the exit status at 0, and creates nothing`, add one assertion beside the existing `/--notifications/` one. It checks that stderr contains the literal `--push-url <url-or-ntfy-topic>`, written out in the test rather than imported, per the testing bar's literal-contract rule.

**Verification:**

- `bash scripts/test.sh` exits 0 with the new assertion passing.
- `grep -rn "push-url <url>" cli/src` returns nothing once Tasks 1 and 2 have landed. The flag row's own `placeholder: '<url>'` in `init.ts` is Task 3's to change.

**Deviations from plan:**

- Verification bullet 1 (`bash scripts/test.sh` exits 0) was not met: it exited 1 with `run-gates: 3 failed, 17 passed`. Gate `4 npm test` passed, and that gate runs `cli/test/doctor.test.mjs` with the new assertion. The three failing gates don't depend on this diff: `1a plugin manifest` (the validator's `--strict` warning about unquoted `${CLAUDE_PLUGIN_ROOT}` in `plugin/` hook commands), `6a no machine paths` (the worktree's `.git` pointer file and the `harness-runs/improvement_observations/` records that quote it), and `11 docs-retrieval relevance floor` (the retrieval runtime is not installed). So bullet 1's claim rests on gate 4 passing, not on the wrapper's exit status.
