### 3. Test (i): the refusal quotes `nohup`'s line, not the bwrap stub's

**Site:** `cli/test/launch-sandboxed-gates.test.mjs` → `test('(i) a bwrap that exits at once: did not start, quoting its line'` (near line 476), which calls `assertRefusal(r, \`the sandboxed gate run of ${LABEL} did not start: bwrap: boom\`)`. The code it exercises is `cli/templates/scripts/launch-sandboxed-gates.sh`: the launch `case` whose arms begin `nohup "$setsid_bin" bash` / `nohup bash`, and the refusal `refuse "the sandboxed gate run of $label did not start: ${first:-no message}"`.

**Failing test:** `cli/test/launch-sandboxed-gates.test.mjs` — `(i) a bwrap that exits at once: did not start, quoting its line`

**Failure (from the log):**

```
not ok 508 - (i) a bwrap that exits at once: did not start, quoting its line
  location: 'cli/test/launch-sandboxed-gates.test.mjs:476:1'
  error: |-
    stderr lacks "the sandboxed gate run of gates_round_1 did not start: bwrap: boom"
    status 2
    --stderr--
    launch-sandboxed-gates.sh: the sandboxed gate run of gates_round_1 did not start: nohup: can't detach from console: Inappropriate ioctl for device
  stack: assertRefusal (file:///cli/test/launch-sandboxed-gates.test.mjs:354:10)
```

**Diagnosis:** New this round. The case sets `STUB_BWRAP_BOOM: 'bwrap: boom'` so that the supervisor's `bwrap` exits at once with that line on stderr. The launcher then quotes the first line of `$errfile`. The supervisor never ran, because the launcher's `nohup` exited 127 inside the macOS session sandbox (F17). So `$errfile`'s first line was `nohup`'s message, not the stub's. The exit status and the one-line shape are right; only the quoted cause is wrong. Once the supervisor actually starts, the bwrap stub's line becomes `$errfile`'s first line and the expected text follows.

**Suspected shared cause:** likely the same cause as Finding 2 — the launcher's `nohup` supervisor launch exits before running anything in the session sandbox.

**Fix:**

- [ ] No code change of its own. If Finding 2's change to the launcher's launch `case` has not landed, land it first, as Finding 2 specifies.
- [ ] Then confirm by reading the code that, after Finding 2, the supervisor's stderr still goes straight to `$errfile` (`2>"$errfile"` stays on the subshell). With that, `bwrap: boom` is the line the `IFS= read -r first <"$errfile"` read picks up. If it is not, add only what is needed in the launcher so that it is, and record it in this finding's deviation note.
- [ ] Do not change the test.

## Already passing

- **(a) Test and file run:** `(i) a bwrap that exits at once: did not start, quoting its line` in `cli/test/launch-sandboxed-gates.test.mjs`, run as a whole file. The fix site was also read: in `cli/templates/scripts/launch-sandboxed-gates.sh`, both arms of the launch `case` (the ones that begin `( trap '' HUP; exec "$setsid_bin" bash` / `( trap '' HUP; exec bash`, landed by Finding 2 in `2c67a1b6`) keep `2>"$errfile"` on the subshell, and `IFS= read -r first <"$errfile"` feeds the refusal.
- **(b) Command and result:** `npm test --workspace cli -- test/launch-sandboxed-gates.test.mjs`, run from the repository root, printed `ok 9 - (i) a bwrap that exits at once: did not start, quoting its line`. The file totals were `# tests 21`, `# pass 21`, `# fail 0`. The named test is its own top-level `test(...)`, so the TAP line separates it from the other cases.
- **(c) No code file edited:** this record is the only write. The test is unchanged, and so is the launcher.
