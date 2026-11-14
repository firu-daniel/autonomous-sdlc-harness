### 9. Test (n): redirected `XDG_STATE_HOME` / `HOME` clone launch refused before `pending`

**Site:** `cli/test/launch-sandboxed-gates.test.mjs` → `test('(n) a redirected XDG_STATE_HOME or HOME does not choose the clone\'s profile'` (near line 709), through the helper `async function launchClone(f, clone, label, extra = {})` (near line 546). The code it exercises is the launch `case` in `cli/templates/scripts/launch-sandboxed-gates.sh` (arms beginning `nohup "$setsid_bin" bash` / `nohup bash`).

**Failing test:** `cli/test/launch-sandboxed-gates.test.mjs` — `(n) a redirected XDG_STATE_HOME or HOME does not choose the clone's profile`

**Failure (from the log):**

```
not ok 516 - (n) a redirected XDG_STATE_HOME or HOME does not choose the clone's profile
  location: 'cli/test/launch-sandboxed-gates.test.mjs:709:1'
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
         async TestContext.<anonymous> (file:///cli/test/launch-sandboxed-gates.test.mjs:730:18)
```

**Diagnosis:** New this round. `launchClone` expects `pending` (exit 3). The launcher resolved the profile and built its vector, then refused with `did not start: nohup: can't detach from console`. Its `nohup` supervisor launch exited 127 inside the macOS session sandbox (F17). The profile-selection logic this case tests is not implicated by this log.

**Suspected shared cause:** likely the same cause as Finding 2 — the launcher's `nohup` supervisor launch exits before running anything in the session sandbox.

**Fix:**

- [ ] No code change of its own. If Finding 2's change to the launcher's launch `case` has not landed, land it first, as Finding 2 specifies.
- [ ] If the failure persists after Finding 2, diagnose it as a new finding in the next round. Do not change the test.

## Already passing

- **(a)** Named test: `(n) a redirected XDG_STATE_HOME or HOME does not choose the clone's profile`; file run: `cli/test/launch-sandboxed-gates.test.mjs`.
- **(b)** Command: `npm test --workspace cli -- test/launch-sandboxed-gates.test.mjs`, from the repository root, foreground. The named test is a top-level `test(...)` and reports on its own TAP line: `ok 17 - (n) a redirected XDG_STATE_HOME or HOME does not choose the clone's profile` (duration_ms 9142.04475). File summary: `# tests 21`, `# pass 21`, `# fail 0`. Passing after an earlier fix: Finding 2's launcher change to the launch `case` in `cli/templates/scripts/launch-sandboxed-gates.sh`, already landed on this branch.
- **(c)** No code file was edited; this record is the only write.
