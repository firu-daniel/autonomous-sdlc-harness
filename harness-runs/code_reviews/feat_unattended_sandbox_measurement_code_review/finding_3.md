### 3. S1 prints `not run` for the permission-layer refusal its row records as `pass`

**File:** `scripts/lib/sandbox-probe/legs-settings.sh` (`sp_leg_credentials`) — `*) sp_row_result credentials S1 "not run" "$s1_cmd: refused at the $SP_LAYER layer, so it never reached the sandbox: $SP_EVIDENCE" "$departure" ;;`

S1 in `docs/sandbox-verification.md` reads: Check *"A read of `~/.ssh` from a sandboxed command"*, Expected *"refused"*, Observed *"`cat ~/.ssh/config`, `ls ~/.ssh`, … are refused at the permission layer"*, Verdict **pass**. The leg table's expected sentence for `credentials` (`scripts/lib/sandbox-probe/core.sh` → `sp_leg_declare credentials`) is *"reads of ~/.ssh are refused"*. Neither the row nor the leg table names a layer.

`sp_leg_credentials` issues exactly the recorded call, `cat ~/.ssh/config`. But it passes S1 only on layer `sandbox` and sends every other refusal layer to `not run`. On this profile the recorded answer is the permission layer: a deny rule on `~/.ssh`, which `--allowedTools "Bash(cat:*)"` cannot lift. So the re-measurement prints `not run` for the very outcome the row grades `pass`. The person running Gate 15 is left with an S1 that can never be taken on the real profile. The task prompt asks for exactly that check (*"reads of `~/.ssh` stay refused from a sandboxed command"*).

**Fix.** In the S1 `case "$SP_LAYER"` of `sp_leg_credentials`, pass on any refusal layer and name the layer in the evidence:

```bash
      case "$SP_LAYER" in
        sandbox | permission | file-tool | network)
          sp_row_result credentials S1 pass "$s1_cmd: refused at the $SP_LAYER layer: $SP_EVIDENCE" "$departure" ;;
        ran) sp_row_result credentials S1 fail "$s1_cmd: not refused (output withheld)" "$departure" ;;
        *) sp_row_result credentials S1 "not run" "$s1_cmd: unrecognised layer '$SP_LAYER': $SP_EVIDENCE" "$departure" ;;
      esac
```

Leave S2 as it is: its row records the file-tool message, and the S2 branch already grades that.
