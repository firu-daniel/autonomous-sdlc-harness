### 3. T2 prints `pass` when the sandboxed gate run printed `FAIL: test`, unless the output happens to carry `mkstemp failed` or `Operation not permitted`

**File:** `scripts/lib/sandbox-probe/legs-local.sh` (`sp_leg_gates`) — "# --- T2: the gates as one exact call, cwd = the clone."; the branch `elif [ "$verdict" = pass ]; then evidence="$(sp__first_line "$text")"`.

**The problem.** T2 runs `bash <scriptsDir>/test.sh` as one exact call and judges it with `sp_judge_call "$SP_STREAM" ran "$cmd"`. Layer `ran` means only that the result text carries none of the judge's refusal strings (`scripts/lib/sandbox-probe/judge.sh` → the layer table, *"ran  none of the above"*). It says nothing about whether the gates passed. The leg then overrides the verdict to `fail` only when a line carries `mkstemp failed` or `Operation not permitted`. In every other case it keeps `pass` and quotes the output's first line. The result's `is_error`, which `sp__match` sets to `error` on a non-zero exit, is never read. Nor is `scripts/test.sh`'s own verdict line, which is exactly `PASS: test` or `FAIL: test (exit <n>)` (`scripts/test.sh` → *"Exactly one verdict line"*).

So a sandboxed gate run that fails for any other reason prints `T2 pass`. The recorded sandbox-only failures are of exactly that kind: row `OR6` lists *"`pgrep` exiting 3 with `Cannot get process list`"*, a `doctor` test that matched a temp path, and the scratch runner's `dart` probe, and none of the three carries either string. T2's own Expected says *"Every gate that fails sandboxed and passes unsandboxed on the same tree gets its own new row here and its own F row"*. A `pass` line tells the person running Gate 15 there is nothing to file. The probe clone is cut from the default branch, which preflight requires `<main>` to be on, so a `FAIL: test` there is the signal T2 exists to surface.

**Fix.** In `scripts/lib/sandbox-probe/legs-local.sh` → `sp_leg_gates`, replace the T2 branch

```bash
    elif [ "$verdict" = pass ]; then
      evidence="$(sp__first_line "$text")"
    fi
```

with

```bash
    elif [ "$verdict" = pass ]; then
      # test.sh prints exactly one verdict line; a sandboxed FAIL is what T2's second sentence files.
      if line="$(sp__line_with "$text" "FAIL: test")"; then
        verdict=fail
        evidence="$line; compare with the same call unsandboxed on the same tree before filing its row"
      elif line="$(sp__line_with "$text" "PASS: test")"; then
        evidence="$line"
      else
        verdict="not run"
        evidence="no PASS: test or FAIL: test verdict line in the result (the output may be truncated): $(sp__first_line "$text")"
      fi
    fi
```

`line` is already a `local` of `sp_leg_gates`. No test drives `sp_leg_gates`, because it launches `claude`. This fix edits no test file and runs none.
