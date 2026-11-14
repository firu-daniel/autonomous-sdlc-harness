### 6. Test (q): job-mode main-checkout launch refused before `pending`

**Site:** `cli/test/launch-sandboxed-gates.test.mjs` → `test('(q) job mode: the registry run_job leaves accepts the main checkout, a finished record elsewhere notwithstanding'` (near line 641; the failing assertion is near line 651). The code it exercises is the launch `case` in `cli/templates/scripts/launch-sandboxed-gates.sh` (arms beginning `nohup "$setsid_bin" bash` / `nohup bash`).

**Failing test:** `cli/test/launch-sandboxed-gates.test.mjs` — `(q) job mode: the registry run_job leaves accepts the main checkout, a finished record elsewhere notwithstanding`

**Failure (from the log):**

```
not ok 513 - (q) job mode: the registry run_job leaves accepts the main checkout, a finished record elsewhere notwithstanding
  location: 'cli/test/launch-sandboxed-gates.test.mjs:641:1'
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
  stack: TestContext.<anonymous> (file:///cli/test/launch-sandboxed-gates.test.mjs:651:10)
```

**Diagnosis:** New this round. The job-mode main-checkout target passed the target check, since the refusal is not a target refusal. The launcher then refused with `did not start: nohup: can't detach from console`. Its `nohup` supervisor launch exited 127 inside the macOS session sandbox (F17), so no supervisor claimed `.running`.

**Suspected shared cause:** likely the same cause as Finding 2 — the launcher's `nohup` supervisor launch exits before running anything in the session sandbox.

**Fix:**

- [ ] No code change of its own. If Finding 2's change to the launcher's launch `case` has not landed, land it first, as Finding 2 specifies.
- [ ] If the failure persists after Finding 2, diagnose it as a new finding in the next round. Do not change the test.

## Already passing

- **(a) Test and file run:** `(q) job mode: the registry run_job leaves accepts the main checkout, a finished record elsewhere notwithstanding` in `cli/test/launch-sandboxed-gates.test.mjs`, run as a whole file. The fix site was also read: in `cli/templates/scripts/launch-sandboxed-gates.sh`, the launch `case` arms now begin `( trap '' HUP; exec "$setsid_bin" bash` / `( trap '' HUP; exec bash` (no `nohup`), landed by Finding 2 in `2c67a1b6`.
- **(b) Command and result:** `npm test --workspace cli -- test/launch-sandboxed-gates.test.mjs`, run from the repository root, printed `ok 14 - (q) job mode: the registry run_job leaves accepts the main checkout, a finished record elsewhere notwithstanding`. The file totals were `# tests 21`, `# pass 21`, `# fail 0`. The named test is its own top-level `test(...)`, so the TAP line separates it from the other cases.
- **(c) No code file edited:** this record is the only write. The test is unchanged, and so is the launcher.
