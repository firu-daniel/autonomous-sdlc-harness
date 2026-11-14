### 7. Test (s): job-mode launch with a status-less control-clone record refused before `pending`

**Site:** `cli/test/launch-sandboxed-gates.test.mjs` → `test('(s) job mode: the wrappers leg\'s control-clone record, which carries no status, does not refuse the main checkout'` (near line 658; the failing assertion is near line 668). The code it exercises is the launch `case` in `cli/templates/scripts/launch-sandboxed-gates.sh` (arms beginning `nohup "$setsid_bin" bash` / `nohup bash`).

**Failing test:** `cli/test/launch-sandboxed-gates.test.mjs` — `(s) job mode: the wrappers leg's control-clone record, which carries no status, does not refuse the main checkout`

**Failure (from the log):**

```
not ok 514 - (s) job mode: the wrappers leg's control-clone record, which carries no status, does not refuse the main checkout
  location: 'cli/test/launch-sandboxed-gates.test.mjs:658:1'
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
  stack: TestContext.<anonymous> (file:///cli/test/launch-sandboxed-gates.test.mjs:668:10)
```

**Diagnosis:** New this round. The status-less control-clone record did not refuse the main checkout, which is what the case is about, since the refusal is not a registry refusal. The launcher then refused with `did not start: nohup: can't detach from console`. Its `nohup` supervisor launch exited 127 inside the macOS session sandbox (F17).

**Suspected shared cause:** likely the same cause as Finding 2 — the launcher's `nohup` supervisor launch exits before running anything in the session sandbox.

**Fix:**

- [ ] No code change of its own. If Finding 2's change to the launcher's launch `case` has not landed, land it first, as Finding 2 specifies.
- [ ] If the failure persists after Finding 2, diagnose it as a new finding in the next round. Do not change the test.
