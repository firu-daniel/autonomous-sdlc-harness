### 5. `g12_run_dir` and `g12_evidence` join on an unchecked `$(g12_scratch_dir)`, so a failure would make their paths root-relative

**File:** `scripts/lib/gate12-sandbox-round/runs.sh` (`g12_run_dir`): "printf '%s/runs/%s\n' \"$(g12_scratch_dir)\" \"$id\""; and the same file (`g12_evidence`): "dir=\"$(g12_scratch_dir)/evidence\""

`g12_scratch_dir` (`state.sh`) prints nothing and returns 1 when `hr_state_path` cannot resolve the state directory. Both readers use its output without checking the status:
- `g12_run_dir` would print `/runs/<id>`, and its callers then `mkdir -p` that directory and write `view.json`, `log.txt` and the `harness-state` download there;
- `g12_evidence` would `mkdir -p /evidence` and append to `/evidence/<row>.log`.

The header says *"Every path is built on g12_scratch_dir"*. A failure of it should stop the read, not move it to the filesystem root. Today the preflight has already resolved `stateDir` before any grade runs, so this cannot be reached. But it is the one place where a failed derivation turns into a write outside the Gate 12 repository instead of a refusal.

**Fix:** capture the output with its status in both functions.

```bash
g12_run_dir() {
  local id="${1:-}" scratch
  case "$id" in
    "" | *[!0-9]*) g12_refuse "run id '$id' is not a number"; return 1 ;;
  esac
  scratch="$(g12_scratch_dir)" || return 1
  printf '%s/runs/%s\n' "$scratch" "$id"
}
```

In `g12_evidence`, replace `dir="$(g12_scratch_dir)/evidence"` with:

```bash
  dir="$(g12_scratch_dir)" || return 1
  dir="$dir/evidence"
```

Every caller already treats a non-zero `g12_run_dir` as status 3, and a non-zero `g12_evidence` as *"the record could not be written"*, so nothing else changes. The fix runs no test.
