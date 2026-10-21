### 2. `run-gates.sh` keeps going when `mktemp` fails, so one temp-file fault shows up as every gate failing

**File:** `scripts/run-gates.sh` (top level, right after the repository-root resolution) — `log="$(mktemp "${TMPDIR:-/tmp}/harness-gates.XXXXXX")"`

The line this branch changed has no failure handling. The script runs `set -uo pipefail` and deliberately has no `-e` (its header: "Deliberately no `-e`: every gate runs on every invocation"). So when `mktemp` fails, `log` is set to the empty string and the script carries on. Every `gate` / `gate_silent` call then redirects to `""` (`"$@" >"$log" 2>&1`), the redirection fails, and each status-graded gate is reported `FAIL`.

That is the symptom F2 records (`run-gates: 24 failed, 4 passed`). One temp-file fault is reported as 24 gate failures, and nothing names the real cause. The new form can still fail in ways the old one could not. Because it now honours `TMPDIR`, a `TMPDIR` that points at a missing or unwritable directory now breaks it, where macOS used to ignore `TMPDIR`. The block just above already shows the right pattern: when the repository root cannot be resolved, the script prints a cause and exits 1.

**Fix:** replace the line with a guarded form that matches the root-resolution block above it:

```bash
log="$(mktemp "${TMPDIR:-/tmp}/harness-gates.XXXXXX")" || {
  echo "run-gates: could not create a log file under '${TMPDIR:-/tmp}'" >&2
  exit 1
}
trap 'rm -f "$log"' EXIT
```

Keep the `trap` line exactly as it is, directly after the guard. The template stays `"${TMPDIR:-/tmp}/harness-gates.XXXXXX"`. This fix edits no test file, so it runs no test; `scripts/run-gates.sh` itself runs in the Run gates phase.
