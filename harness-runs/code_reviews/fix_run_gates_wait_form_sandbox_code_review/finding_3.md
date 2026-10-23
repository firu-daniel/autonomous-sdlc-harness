### 3. The exit map files the unreadable-heartbeat refusal under "(wait form) no run in flight"

**File:** `cli/templates/scripts/run-test-suite.sh` (the header's `# Exit map:` block): "(wait form) no run in flight — no .running, or a heartbeat older than STALE_SECONDS,". The same bytes are in `scripts/run-test-suite.sh`, which must stay byte-identical to the template.

**The problem.** The exit-2 entry now reads as if "an unreadable heartbeat" were one form of "(wait form) no run in flight". It is not, for two reasons:

- **The message differs.** The refusal prints `cannot read the heartbeat of '<path>'` (`run_alive`), not `no run in flight for <label>`.
- **Both forms reach it.** It does not come from the wait form only. `run_alive` is also the run form's one-run-per-label guard.

A maintainer, or an adopter reading the header to map a stderr line to a cause, would expect `no run in flight` for this case and would not expect the run form to refuse. The entry is also the one header line that runs past the header's line width.

**Fix.** Replace the two lines that start with "#      `commands.typecheck` or `commands.test` unset, no current branch, (wait form)" and "#      or an unreadable heartbeat" with:

```bash
#      `commands.typecheck` or `commands.test` unset, no current branch,
#      (wait form) no run in flight — no `.running`, or a heartbeat older than
#      STALE_SECONDS — or (either form) a `.running` whose heartbeat cannot be
#      read: `cannot read the heartbeat of '<path>'`
```

Make the same edit in both files, then `cmp cli/templates/scripts/run-test-suite.sh scripts/run-test-suite.sh`. This is a comment-only change, so no test runs for it. The suite runs in the Run gates phase.
