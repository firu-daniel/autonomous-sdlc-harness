### 8. Test (t): F15 job-mode launch refused before `pending`

**Site:** `cli/test/launch-sandboxed-gates.test.mjs` → `test('(t) F15: job mode with <main>/scripts/.git protected and absent reaches its verdict past the placeholder'` (near line 674; the failing assertion is near line 685). The code it exercises is the launch `case` in `cli/templates/scripts/launch-sandboxed-gates.sh` (arms beginning `nohup "$setsid_bin" bash` / `nohup bash`).

**Failing test:** `cli/test/launch-sandboxed-gates.test.mjs` — `(t) F15: job mode with <main>/scripts/.git protected and absent reaches its verdict past the placeholder`

**Failure (from the log):**

```
not ok 515 - (t) F15: job mode with <main>/scripts/.git protected and absent reaches its verdict past the placeholder
  location: 'cli/test/launch-sandboxed-gates.test.mjs:674:1'
  error: |-
    status 2
    --stderr--
    launch-sandboxed-gates.sh: the sandboxed gate run of gates_round_1 did not start: nohup: can't detach from console: Inappropriate ioctl for device
    + actual - expected
      [
    +   2,
    -   3,
    -   'pending\n',
        '',
    +   "launch-sandboxed-gates.sh: the sandboxed gate run of gates_round_1 did not start: nohup: can't detach from console: Inappropriate ioctl for device\n"
      ]
  stack: TestContext.<anonymous> (file:///cli/test/launch-sandboxed-gates.test.mjs:685:10)
```

**Diagnosis:** New this round. The case never got as far as F15's placeholder handling. The launcher refused at the start with `did not start: nohup: can't detach from console`, because its `nohup` supervisor launch exited 127 inside the macOS session sandbox (F17). So nothing about `hr_script_root` or the `scripts/.git` placeholder is implicated by this log.

**Suspected shared cause:** likely the same cause as Finding 2 — the launcher's `nohup` supervisor launch exits before running anything in the session sandbox.

**Fix:**

- [ ] No code change of its own. If Finding 2's change to the launcher's launch `case` has not landed, land it first, as Finding 2 specifies.
- [ ] If the failure persists after Finding 2, diagnose it as a new finding in the next round. Do not change the test.

## Already passing

- **(a) Named test and file run:** `(t) F15: job mode with <main>/scripts/.git protected and absent reaches its verdict past the placeholder`, in `cli/test/launch-sandboxed-gates.test.mjs` (the whole file was run; it was not narrowed).
- **(b) Command and result:** `npm test --workspace cli -- test/launch-sandboxed-gates.test.mjs`, run from the repository root in the foreground. The named test reported `ok 16 - (t) F15: job mode with <main>/scripts/.git protected and absent reaches its verdict past the placeholder` (duration_ms 3743.482458). File totals: `# tests 21`, `# pass 21`, `# fail 0`. The `nohup: can't detach from console` refusal from the log did not occur, which fits the Finding 2 launcher change having already landed.
- **(c) No code file was edited:** this record is the only write. No readiness marker was touched.
