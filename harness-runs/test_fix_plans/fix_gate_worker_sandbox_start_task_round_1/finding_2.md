### 2. The launcher's `nohup` supervisor launch does not start in the macOS session sandbox — test (g)(h)

**Site:** `cli/templates/scripts/launch-sandboxed-gates.sh`, the launch `case` after `setsid_bin="$(command -v setsid 2>/dev/null)" || setsid_bin=""`. Its two arms are:

```
  /*) nohup "$setsid_bin" bash "$script_dir/launch-sandboxed-gates.sh" --supervise "$target" "$label" </dev/null >/dev/null 2>"$errfile" & ;;
  *) nohup bash "$script_dir/launch-sandboxed-gates.sh" --supervise "$target" "$label" </dev/null >/dev/null 2>"$errfile" & ;;
```

They are near line 471, as a navigation hint only. The same file's header block `START, SUPERVISE, WAIT.` ("re-invoked with `--supervise`, through `nohup`, `setsid` where it resolves, …") and the comment above the `case` ("`setsid` without `-f`: …") also need changes. So does this checkout's byte-identical copy `scripts/launch-sandboxed-gates.sh` (`cmp` reports the two files identical today), and `docs/sandbox-verification.md` §5, row F17's **Execution modes** sentence "the launcher's own `nohup` runs unsandboxed, on Linux only, and is unchanged".

**Failing test:** `cli/test/launch-sandboxed-gates.test.mjs` — `(g)(h) a started run is pending, collected by --wait, under the expected vector, and its placeholders swept`

**Failure (from the log):**

```
not ok 507 - (g)(h) a started run is pending, collected by --wait, under the expected vector, and its placeholders swept
  location: 'cli/test/launch-sandboxed-gates.test.mjs:445:1'
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
```

**Diagnosis:** New this round. This branch replaced `nohup` in `run-test-suite.sh`'s worker launch with `( trap '' HUP; export RUN_TEST_SUITE_WORKER="$label"; exec bash … ) … &`. It did so because, on Claude Code 2.1.325 inside the macOS session sandbox, `nohup` exits 127 with `nohup: can't detach from console: Inappropriate ioctl for device` before running anything, while the `trap '' HUP` subshell starts (`docs/sandbox-verification.md` §5 F17, rows WS1–WS3; `cli/templates/scripts/run-test-suite.sh` → `WHY NOT NOHUP`). F17 left the launcher's own `nohup` in place on purpose. Its reason was that in production the launcher reaches its launch line only on a bubblewrap host, where it runs as an excluded, unsandboxed command, and answers `in-session` on macOS before that.

`cli/test/launch-sandboxed-gates.test.mjs` does reach that line on macOS. It overrides `hr_placeholder_host_probe_var` to answer "bubblewrap host" and puts a `bwrap` stub first on `PATH`, and Gate 4 runs inside the same sandboxed session that F17 measured. So the launcher's `nohup` dies with exactly F17's message. The supervisor never runs and never claims `.running`. The launcher's poll sees the dead `$supervisor_pid` and refuses with the first line of `$errfile`, which is `nohup`'s message. That gives the exit 2 and the empty stdout the test reports where it expects `3` / `pending`.

The cause lies in the tree's launch line, not outside it. The remedy keeps the work inside the sandbox and needs no profile entry: it is the spelling this branch already measured starting in the same sandbox (WS2, WS4). It is not a test change or a route around a refusal. The log line also matches none of the sandbox-refusal signatures (`Operation not permitted`, `Read-only file system`, a proxy `403`, `Could not resolve host`).

**Fix:**

- [ ] In `cli/templates/scripts/launch-sandboxed-gates.sh`, replace the two `nohup` arms with the `trap '' HUP` subshell shape this branch used in `run-test-suite.sh`. Keep each arm's argv, the redirections and the trailing `&` exactly as they are:

  ```
  case "$setsid_bin" in
    /*) ( trap '' HUP; exec "$setsid_bin" bash "$script_dir/launch-sandboxed-gates.sh" --supervise "$target" "$label" ) </dev/null >/dev/null 2>"$errfile" & ;;
    *) ( trap '' HUP; exec bash "$script_dir/launch-sandboxed-gates.sh" --supervise "$target" "$label" ) </dev/null >/dev/null 2>"$errfile" & ;;
  esac
  ```

  Keep `supervisor_pid=$!` and `disown` unchanged. `exec` keeps the subshell's PID, so `$!` is still the supervisor's PID (or `setsid`'s, which `exec`s bash in place). The subshell is a background job of a non-interactive shell, so it is not a process-group leader, and `setsid` without `-f` still works in place. Test (g)(h)'s assertion on `setsid.txt` (`bash <launcher> --supervise <dir> gates_round_1`) still holds, because the argv `setsid` receives is unchanged.
- [ ] Update the comment above the `case` so it states that the subshell is the background job that `exec`s `setsid` in place. Update the header block `START, SUPERVISE, WAIT.` so it says "through a `( trap '' HUP; exec … )` subshell" instead of "through `nohup`". In one sentence, cite `docs/sandbox-verification.md` §5 F17 for why `nohup` is not used, saying HUP is still ignored on the supervisor's entry. Where the header states that a refusal quotes the supervisor's first stderr line, check that it still holds as written.
- [ ] Copy the edited template byte for byte to `scripts/launch-sandboxed-gates.sh`, so the two copies stay identical, as Task 5 did for `run-test-suite.sh`.
- [ ] In `docs/sandbox-verification.md` §5 row F17, rewrite the **Execution modes** clause "the launcher's own `nohup` runs unsandboxed, on Linux only, and is unchanged". It should say the launcher's supervisor start now uses the same `trap '' HUP` subshell, and why: the launcher suite drives the launch line on macOS inside the session sandbox, where `nohup` exits 127. Production behaviour on a bubblewrap host is unchanged in effect, because HUP is still ignored and the process still detaches through `setsid` and `disown`. In row F10, add a short note after its parenthetical "(`setsid` where present, `nohup`, `disown`)" saying the `nohup` spelling was later replaced under F17. Do not rewrite F10's measured text.
- [ ] Leave `cli/test/launch-sandboxed-gates.test.mjs` unchanged. Its expectations are the contract and are correct.
