### 6. W7 counts a sandbox-layer string in a gate's own output as a failure, though W7 grades permission denials only

**File:** `scripts/lib/sandbox-probe/legs-local.sh` (`sp_leg_gates`) — the W7 loop's `fail)` arm, `n_fail=$((n_fail + 1))`

W7's row and the `gates` leg's expected sentence both say *"each of the six calls runs with no permission denial"*. The question is whether the guard and the per-run twin grant the call, not what the gates print once they run. The W7 loop judges each call with `sp_judge_call … ran` and counts every non-`ran` layer as a failure. So a `typecheck.sh` or `test.sh` that is granted and runs, but whose output contains `Operation not permitted` (a gate failing sandboxed, which T2 exists to find), is read as layer `sandbox`. W7 then prints `fail` with that label, although no permission was denied.

**Fix.** In the W7 loop's `case "$SP_VERDICT"`, count a failure only for the permission layer, and record any other layer in the label as ran:

```bash
        fail)
          if [ "$SP_LAYER" = permission ]; then
            n_fail=$((n_fail + 1))
            label="$label permission"
            if [ "$arg" = "'<probe>'" ]; then probe_denied=1; else other_denied=1; fi
          else
            label="$label ran ($SP_LAYER in its output)"
          fi
          ;;
```

The `probe_denied` / `other_denied` sentence after the loop stays as it is.
