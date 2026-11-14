### 10. Test (l): `.git` read-only vector case refused before `pending`

**Site:** `cli/test/launch-sandboxed-gates.test.mjs` → `test('(l) the vector binds the target\'s .git read-only after every denyWrite entry, closing the omit trio'` (near line 772; the failing assertion is near line 775). The code it exercises is the launch `case` in `cli/templates/scripts/launch-sandboxed-gates.sh` (arms beginning `nohup "$setsid_bin" bash` / `nohup bash`).

**Failing test:** `cli/test/launch-sandboxed-gates.test.mjs` — `(l) the vector binds the target's .git read-only after every denyWrite entry, closing the omit trio`

**Failure (from the log):**

```
not ok 519 - (l) the vector binds the target's .git read-only after every denyWrite entry, closing the omit trio
  location: 'cli/test/launch-sandboxed-gates.test.mjs:772:1'
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
  stack: TestContext.<anonymous> (file:///cli/test/launch-sandboxed-gates.test.mjs:775:10)
```

**Diagnosis:** New this round. The case needs a started run so that it can read the recorded vector. The launcher refused at the start with `did not start: nohup: can't detach from console`, because its `nohup` supervisor launch exited 127 inside the macOS session sandbox (F17). The vector itself is not implicated by this log.

**Suspected shared cause:** likely the same cause as Finding 2 — the launcher's `nohup` supervisor launch exits before running anything in the session sandbox.

**Fix:**

- [ ] No code change of its own. If Finding 2's change to the launcher's launch `case` has not landed, land it first, as Finding 2 specifies.
- [ ] If the failure persists after Finding 2, diagnose it as a new finding in the next round. Do not change the test.
