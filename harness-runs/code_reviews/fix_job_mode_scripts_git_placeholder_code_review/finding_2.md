### 2. JS3's Bash-timeout formula is derived twice in `default-branch.sh`

**File:** `scripts/lib/gate12-sandbox-round/default-branch.sh` (`g12_js3_files`, "timeout_ms=$(((stall_secs + 60) * 1000))"; `g12_db_stall_fits`, "local timeout_ms=$(((G12_STALL_KILL_SECS + 120) * 1000))")

The one value, the Bash tool timeout that JS3's planted prompt asks for, has two independent producers:

- `g12_js3_files` computes `S = G12_STALL_KILL_SECS + 60` and then `T = (S + 60) * 1000`, and writes `T` into the prompt.
- `g12_db_stall_fits` computes `(G12_STALL_KILL_SECS + 120) * 1000` from scratch and refuses a `--stall-kill-secs` whose result passes 600000.

The two agree today. But a change to the stall margin in one function and not the other would let the refusal pass a threshold whose prompt asks for more than the tool's 600000 ms ceiling. It could also refuse one that fits. No test ties the two together: the suite asserts the prompt's numbers and the 481 refusal separately.

**Fix:** derive both durations once, and have both functions read them.

1. Add, above `g12_js3_files`:

   ```bash
   # g12_js3_durations — JS3's stall S = G12_STALL_KILL_SECS + 60 seconds and its Bash tool timeout
   # T = (S + 60) * 1000 ms, into G12_JS3_STALL_SECS and G12_JS3_TIMEOUT_MS. The one producer of both.
   g12_js3_durations() {
     G12_JS3_STALL_SECS=$((G12_STALL_KILL_SECS + 60))
     G12_JS3_TIMEOUT_MS=$(((G12_JS3_STALL_SECS + 60) * 1000))
   }
   ```

2. In `g12_js3_files`, drop `stall_secs` and `timeout_ms` from the `local` line. Replace their two assignments with `g12_js3_durations`, and use `$G12_JS3_STALL_SECS` / `$G12_JS3_TIMEOUT_MS` wherever the prompt body used `$stall_secs` / `$timeout_ms`.

3. In `g12_db_stall_fits`, replace `local timeout_ms=$(((G12_STALL_KILL_SECS + 120) * 1000))` with `g12_js3_durations`. Replace `"$timeout_ms"` / `${timeout_ms}` with `"$G12_JS3_TIMEOUT_MS"` / `${G12_JS3_TIMEOUT_MS}`. Change its comment line to `# JS3's prompt sets the Bash tool's timeout to g12_js3_durations' G12_JS3_TIMEOUT_MS.`

The prompt text and the refusal message stay byte-identical, so the existing fixtures in `cli/test/gate12-sandbox-round-default-branch.test.mjs` still describe them. That suite runs in the Run gates phase. This fix edits no test file.
