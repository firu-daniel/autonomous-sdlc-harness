### 1. T2 counts network denials only in the gate lane's log, but the 2026-10-27 denials showed up in the session stream

**File:** `scripts/lib/sandbox-probe/legs-local.sh` (`sp__t2_grade`), at "# The session's own outbound denials (api.anthropic.com, datadoghq.com): recorded, never graded."

Defect 2 of the task prompt asks that T2's evidence "surface such lines" — the sandbox denials of `api.anthropic.com:443` and `http-intake.logs.us5.datadoghq.com:443` seen during gate 4 — without grading on them. `sp__t2_grade` greps for `<sandbox_violations>` and `host is not on the allow list` only in the lane's `<label>.log`, the file `run-test-suite.sh`'s detached worker writes. `<sandbox_violations>` is an annotation Claude Code adds to a sandboxed call's **tool_result**. No process writes it into a log file. The T2 row's own Observed cell in `docs/sandbox-verification.md` ("What the session showed, read from the T2 session stream (`gates-t2.stream.jsonl` …)") confirms the first run's denials were read from the session stream. So on a re-run the evidence will usually report `network denials in the log, recorded and not graded: 0`. That reads as "no denials", when the stream may hold the very lines defect 2 asked the evidence to surface. The stream is kept only when T2 does not pass, so on a passing T2 the denials are lost entirely.

The test suite hides the gap: `cli/test/sandbox-probe-gates-legs.test.mjs` (`'a pass verdict passes, and the log’s network denial is counted, not graded'`) writes a `<sandbox_violations>` line into the lane log by hand, a shape the worker never produces.

**Fix:**

1. In `sp__t2_grade`, keep the lane-log count as it is. After its closing `fi` and before the function's closing `}`, add a count over the session stream:

```bash
  # Claude Code annotates a sandboxed call's denials on that call's tool_result, so the session stream is
  # where they appear (docs/sandbox-verification.md row T2, the 2026-10-27 run); the lane log rarely holds one.
  n="$(grep -c -F -e '<sandbox_violations>' -e 'host is not on the allow list' -- "$stream" 2>/dev/null)" || true
  case "$n" in '' | *[!0-9]*) n=0 ;; esac
  SP_EVIDENCE="$SP_EVIDENCE; network denials in the session stream, recorded and not graded: $n event(s)"
```

   `n` and `stream` are already locals of `sp__t2_grade`. Add no new local, and leave the verdict logic unchanged.

2. In `cli/test/sandbox-probe-gates-legs.test.mjs`, add `const STREAM_DENIALS = 'network denials in the session stream, recorded and not graded';` beside `DENIALS`. Then append `; ${STREAM_DENIALS}: 0 event(s)` to the expected string of each of the four existing `sp__t2_grade` cases. Neither `t2-run-form.jsonl` nor `t2-run-permission.jsonl` contains either string, so the count is 0 for both.

3. In the same `test('sp__t2_grade: …')` block, add one case, `'a denial annotated on a session tool_result is counted from the stream, not graded'`:
   - Take `readFileSync(fixture('t2-run-form'), 'utf8')`.
   - Replace its first `"text":"pending"` with `"text":"pending\\n<sandbox_violations>api.anthropic.com:443 refused: host is not on the allow list</sandbox_violations>"`. `String.prototype.replace` with a string pattern replaces only the first occurrence.
   - Write the result to `join(dir, 't2-violation.jsonl')`. Write a `pass\n` verdict file, and a log holding only `== run-test-suite.sh: gate test exited 0 ==\n`.
   - Assert `pass|run-test-suite.sh verdict pass; ${DENIALS}: 0; ${STREAM_DENIALS}: 1 event(s)`.

4. In `docs/sandbox-verification.md`, row T2's expected column, change `Network denials in the log, such as `api.anthropic.com:443`, are recorded, not graded` to `Network denials in the log or in the session's tool results, such as `api.anthropic.com:443`, are recorded, not graded`. Leave the Observed and Verdict cells byte-identical.

This fix edits one test file, and that is the only test it runs: `npm test --workspace cli -- test/sandbox-probe-gates-legs.test.mjs`, from the repository root, as one plain foreground command. The full suite runs later, in the Run gates phase.
