### 5. Test (r): `sp__render`-recorded clone launch refused before `pending`

**Site:** `cli/test/launch-sandboxed-gates.test.mjs` → `test('(r) a clone whose record only the sandbox probe\'s sp__render wrote is launched, and refused before it'` (near line 577), through the helper `async function launchClone(f, clone, label, extra = {})` (near line 546). The code it exercises is the launch `case` in `cli/templates/scripts/launch-sandboxed-gates.sh` (arms beginning `nohup "$setsid_bin" bash` / `nohup bash`).

**Failing test:** `cli/test/launch-sandboxed-gates.test.mjs` — `(r) a clone whose record only the sandbox probe's sp__render wrote is launched, and refused before it`

**Failure (from the log):**

```
not ok 511 - (r) a clone whose record only the sandbox probe's sp__render wrote is launched, and refused before it
  location: 'cli/test/launch-sandboxed-gates.test.mjs:577:1'
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
         async TestContext.<anonymous> (file:///cli/test/launch-sandboxed-gates.test.mjs:609:16)
```

**Diagnosis:** New this round. The "launched" half of the case expects `pending` (exit 3) from `launchClone`. The launcher accepted the `sp__render`-written record and built its vector, then refused with `did not start: nohup: can't detach from console`. Its `nohup` supervisor launch exited 127 inside the macOS session sandbox (F17).

**Suspected shared cause:** likely the same cause as Finding 2 — the launcher's `nohup` supervisor launch exits before running anything in the session sandbox.

**Fix:**

- [ ] No code change of its own. If Finding 2's change to the launcher's launch `case` has not landed, land it first, as Finding 2 specifies.
- [ ] If the failure persists after Finding 2, diagnose it as a new finding in the next round. Do not change the test.

## Already passing

- **(a) Test and file run:** `(r) a clone whose record only the sandbox probe's sp__render wrote is launched, and refused before it` in `cli/test/launch-sandboxed-gates.test.mjs`, run as a whole file. The fix site was also read: in `cli/templates/scripts/launch-sandboxed-gates.sh`, the launch `case` arms now begin `( trap '' HUP; exec "$setsid_bin" bash` / `( trap '' HUP; exec bash` (no `nohup`), landed by Finding 2 in `2c67a1b6`.
- **(b) Command and result:** `npm test --workspace cli -- test/launch-sandboxed-gates.test.mjs`, run from the repository root, printed `ok 12 - (r) a clone whose record only the sandbox probe's sp__render wrote is launched, and refused before it`. The file totals were `# tests 21`, `# pass 21`, `# fail 0`. The named test is its own top-level `test(...)`, so the TAP line separates it from the other cases.
- **(c) No code file edited:** this record is the only write. The test is unchanged, and so is the launcher.
