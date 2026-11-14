### 11. Test (m): built-in protected paths vector case refused before `pending`

**Site:** `cli/test/launch-sandboxed-gates.test.mjs` → `test('(m) the vector pins Claude Code\'s built-in protected paths at the target\'s root, .claude read-only after every denyWrite entry'` (near line 791; the failing assertion is near line 794). The code it exercises is the launch `case` in `cli/templates/scripts/launch-sandboxed-gates.sh` (arms beginning `nohup "$setsid_bin" bash` / `nohup bash`).

**Failing test:** `cli/test/launch-sandboxed-gates.test.mjs` — `(m) the vector pins Claude Code's built-in protected paths at the target's root, .claude read-only after every denyWrite entry`

**Failure (from the log):**

```
not ok 520 - (m) the vector pins Claude Code's built-in protected paths at the target's root, .claude read-only after every denyWrite entry
  location: 'cli/test/launch-sandboxed-gates.test.mjs:791:1'
  error: |-
    status 2
    --stderr--
    launch-sandboxed-gates.sh: the sandboxed gate run of gates_round_1 did not start: nohup: can't detach from console: Inappropriate ioctl for device
    + actual - expected
      [
    +   2,
    +   ''
    -   3,
    -   'pending\n'
      ]
  stack: TestContext.<anonymous> (file:///cli/test/launch-sandboxed-gates.test.mjs:794:10)
```

**Diagnosis:** New this round. The case needs a started run so that it can read the recorded vector. The launcher refused at the start with `did not start: nohup: can't detach from console`, because its `nohup` supervisor launch exited 127 inside the macOS session sandbox (F17). The vector itself is not implicated by this log.

**Suspected shared cause:** likely the same cause as Finding 2 — the launcher's `nohup` supervisor launch exits before running anything in the session sandbox.

**Fix:**

- [ ] No code change of its own. If Finding 2's change to the launcher's launch `case` has not landed, land it first, as Finding 2 specifies.
- [ ] If the failure persists after Finding 2, diagnose it as a new finding in the next round. Do not change the test.

## Already passing

- **(a) Named test and file run:** `(m) the vector pins Claude Code's built-in protected paths at the target's root, .claude read-only after every denyWrite entry`, in `cli/test/launch-sandboxed-gates.test.mjs`.
- **(b) Command and result:** `npm test --workspace cli -- test/launch-sandboxed-gates.test.mjs`, from the repository root, in the foreground; the TAP output reports `ok 21 - (m) the vector pins Claude Code's built-in protected paths at the target's root, .claude read-only after every denyWrite entry` (file totals `# tests 21`, `# pass 21`, `# fail 0`). Already passing after an earlier fix — Finding 2's launcher change to the `nohup` supervisor launch, per this finding's `**Suspected shared cause:**`, which is recorded here as context, not as the reason for closing.
- **(c) No code file was edited**; this section is the only write.
