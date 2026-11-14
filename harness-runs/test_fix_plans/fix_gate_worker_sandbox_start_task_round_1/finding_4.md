### 4. Test (k): registered clone launch refused before `pending`

**Site:** `cli/test/launch-sandboxed-gates.test.mjs` → `test('(k) a registered clone takes its protected paths from the recorded per-run profile, and refuses without one'` (near line 558), through the helper `async function launchClone(f, clone, label, extra = {})` (near line 546), whose `pending` assertion fails. The code it exercises is the launch `case` in `cli/templates/scripts/launch-sandboxed-gates.sh` (arms beginning `nohup "$setsid_bin" bash` / `nohup bash`).

**Failing test:** `cli/test/launch-sandboxed-gates.test.mjs` — `(k) a registered clone takes its protected paths from the recorded per-run profile, and refuses without one`

**Failure (from the log):**

```
not ok 510 - (k) a registered clone takes its protected paths from the recorded per-run profile, and refuses without one
  location: 'cli/test/launch-sandboxed-gates.test.mjs:558:1'
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
  stack: launchClone (file:///cli/test/launch-sandboxed-gates.test.mjs:550:10)
         async TestContext.<anonymous> (file:///cli/test/launch-sandboxed-gates.test.mjs:563:16)
```

**Diagnosis:** New this round. `launchClone` expects the launcher to answer `pending` (exit 3) for a registered clone. The launcher passed every check before the start, then refused with `did not start: nohup: can't detach from console`. Its `nohup` supervisor launch exited 127 inside the macOS session sandbox (F17), so no supervisor claimed `.running`. Nothing about the clone's per-run profile handling is implicated: the refusal comes after the vector was built.

**Suspected shared cause:** likely the same cause as Finding 2 — the launcher's `nohup` supervisor launch exits before running anything in the session sandbox.

**Fix:**

- [ ] No code change of its own. If Finding 2's change to the launcher's launch `case` has not landed, land it first, as Finding 2 specifies.
- [ ] If the failure persists after Finding 2, diagnose it as a new finding in the next round. Do not change the test.
