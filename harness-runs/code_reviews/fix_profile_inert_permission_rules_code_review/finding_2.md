### 2. `run_profile_check`'s `delta` refusal still says only `denyWrite` and `deny` may be appended to

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`run_profile_check`) — `delta) RUN_PROFILE_REFUSAL="$file differs from the base profile $SETTINGS_PROFILE by more than entries appended to sandbox.filesystem.denyWrite and permissions.deny" ;;`

This branch widened `run_profile_check`'s comparison. The jq program now takes `delta` over four arrays (`$dw`, `$pd`, `$pa`, `$pk`) and restores all four before comparing with the base. The function's own header was updated to say the same (*"removing exactly the entries <file> appends to `.sandbox.filesystem.denyWrite`, `.permissions.deny`, `.permissions.allow` and `.permissions.ask`"*), and so were `docs/watcher.md` (*"removing exactly the entries appended to those four arrays"*) and `docs/cli.md`. The refusal sentence the `delta` verdict produces was not updated. It still names two arrays.

That sentence goes to `watcher.log` as `not launching '<branch>': <reason>` and to the `failed` notification. An operator whose launch is refused because a per-run copy's `allow` or `ask` diverged from the base, for example a reordered or dropped base entry, reads that only `denyWrite` and `deny` may differ. They then look in the wrong two arrays. This was raised at plan review (`task_plan_reviews/…/review_0.md` and `review_1.md`, item 3) and recorded as not changed in `task_7_plan.md`, so it is a known gap rather than an oversight. No test pins the old sentence: the tamper test's `Bash(*)` case now expects the `twin` sentence instead.

**Fix:** in `cli/templates/scripts/autonomous-watcher.sh` → `run_profile_check`, replace the `delta)` arm with:

```bash
    delta) RUN_PROFILE_REFUSAL="$file differs from the base profile $SETTINGS_PROFILE by more than entries appended to sandbox.filesystem.denyWrite, permissions.deny, permissions.allow and permissions.ask" ;;
```

Then, in `cli/test/watcher-run-profile.test.mjs` → the test *"run_profile_check refuses a per-run copy tampered after render, and accepts the untampered one"*, after the `handTwinned` assertion, add a case that drops the first base `allow` entry from the rendered copy and expects the new sentence. That gives the `delta` verdict a pinned case again:

```js
  const dropped = structuredClone(profile);
  dropped.permissions.allow = dropped.permissions.allow.slice(1);
  const droppedPath = join(f.dir, 'watcher-test', 'dropped.json');
  await writeFile(droppedPath, `${JSON.stringify(dropped, null, 2)}\n`, 'utf8');
  assert.match(
    (await check(droppedPath)).stdout,
    /^1\|.* by more than entries appended to sandbox\.filesystem\.denyWrite, permissions\.deny, permissions\.allow and permissions\.ask$/,
  );
```

Do not edit this checkout's self-adopted `scripts/autonomous-watcher.sh`. The story index's `**Manual setup required:**` re-renders it after merge.

Verify with the one test file this fix edits: `npm test --workspace cli -- test/watcher-run-profile.test.mjs`, from the repository root, as one plain foreground command.
