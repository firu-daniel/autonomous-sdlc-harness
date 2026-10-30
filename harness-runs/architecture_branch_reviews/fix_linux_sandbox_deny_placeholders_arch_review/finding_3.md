### 3. Resolve the state directory in `sandbox-absent-path-check.sh` through the run library, not a `harness-runs` literal

**Severity:** Should Fix · **Layer:** general

**Site:** `scripts/sandbox-absent-path-check.sh`, top-level assignment `S="$M/harness-runs"`. It is consumed by `write_entries` and `write_manifest` (`"$S/.mcp.json"`) and by the session's `--add-dir "$S"`.

**Problem.** The script exists to reproduce what the watcher's `spawn_engine` does on a bubblewrap host. That includes adding the main checkout's state directory with `--add-dir`, and recording that directory's `.mcp.json` in the manifest. The watcher resolves the directory as `main_state="$(hr_state_path "$MAIN_REPO")"`, from `harness.config.json` → `stateDir`. The check script already sources `scripts/lib/harness-run-lib.sh`, but it hardcodes this repository's current value, `harness-runs`. If `stateDir` changes, the script measures and sweeps a different `--add-dir` root from the one the watcher uses, so the AP rows recorded from it describe the wrong path, and nothing reports this.

Rules:
- `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`: *"Nothing caches it and nothing mirrors it: each consumer re-reads the file on each run."*
- `## Shared code, and where it lives`: a behaviour the run library already provides is used rather than restated.

The script is hand-written for this repository and not shipped, so this is not graded as a breach of the adopter-facing rule. That is why it is a Should Fix.

**Fix.** Replace `S="$M/harness-runs"` with a resolution through the sourced library, done after the `. "$M/scripts/lib/harness-run-lib.sh"` line: `S=$(hr_state_path "$M")`. If that fails, print one `sandbox-absent-path-check:` line naming the cause to stderr and `exit 1`, matching the script's existing *"the run library is missing"* exit. Keep every later `$S` use unchanged. Update the header sentence that describes `<main>` and its paths only if it mentions the state directory by name.
