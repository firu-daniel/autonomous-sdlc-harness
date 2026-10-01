### 6. The draft pull request's body hand-lists four of the five commands, under a condition only one of them has

**Severity:** Should Fix

**Site:** `cli/templates/scripts/remote-run.sh` → `deliver_pr_body`, the line `printf 'While a round is running, comment \`%s pause\`, \`%s resume\`, \`%s stop\` or \`%s answer <n>\` to act on it.\n'`.

**Problem.** The body every harness-opened pull request carries lists `pause`, `resume`, `stop` and `answer <n>`. It omits `clear`, which is the only way to release a park-loop hold from GitHub. It also puts all four under "While a round is running", but per `control`'s own arms:
- `resume` is refused on a running run and accepted only on a paused one.
- `answer` is accepted only on a parked one.
- `pause` is the only one of the four whose condition is "running".

The script already declares the set as `COMMAND_VERBS`, the byte-for-byte mirror of `cli/src/remote/githubActions.ts` → `COMMAND_VERBS`. The architecture review's Finding 3 made `doctor` derive its verb list from that set for this reason: a hand-written list goes wrong without any failure when the set changes.

**Fix.**
- [ ] In `deliver_pr_body`, build the list from `COMMAND_VERBS` in the way `verb_control` builds its unknown-verb reply, and drop the inaccurate condition:
  ```bash
  local v verbs=""
  for v in $COMMAND_VERBS; do
    [ "$v" != answer ] || v="answer <n>"
    verbs="$verbs${verbs:+, }\`$COMMAND_HANDLE $v\`"
  done
  printf 'Comment %s to act on the run; each says when it applies (docs/github-run-control.md in the harness documentation).\n' "$verbs"
  ```
  This replaces the existing `printf 'While a round is running, …'` call and its argument line. Keep `local` declarations at the top of the function.
- [ ] In `cli/test/remote-deliver.test.mjs`, in the case that asserts `assert.match(made[0].body, /\nStarted from #7\.\n/);`, add assertions that the body names each of the five commands and no longer carries the old condition. Use `assert.ok(made[0].body.includes(...), made[0].body)` rather than a regex, so `<n>` needs no escaping:
  ```js
  for (const cmd of ['@sdlc-harness answer <n>', '@sdlc-harness pause', '@sdlc-harness resume', '@sdlc-harness stop', '@sdlc-harness clear']) {
    assert.ok(made[0].body.includes(`\`${cmd}\``), made[0].body);
  }
  assert.doesNotMatch(made[0].body, /While a round is running/);
  ```
  The existing `assert.match(made[0].body, /@sdlc-harness pause/);` may stay, since the loop covers it. No assertion on the old sentence exists today: `While a round is running` appears nowhere under `cli/test/`.
- [ ] Run that one file from `cli/` with `npm test -- test/remote-deliver.test.mjs`.
