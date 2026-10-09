### Task 11 — Fix the `typos` hits in the outer-loop script templates and the inbox README template

**Goal:** `typos 1.51.1`, with its default configuration, reports nothing in the outer-loop script templates and the run-artifact templates. These are the files `init` writes into an adopter's `harness-scripts/` and `<state_dir>/`, so an adopter whose CI runs `typos` stays green.

**Where this task stops.** It edits comments and one `jq`-local binding, never behaviour.
- **Not `harness-control.yml`:** its spelling hit is Task 9's.
- **Not `cli/src` or the plugin:** those hits are Tasks 12 and 13's.
- **Not this repository's own `scripts/` copies:** `scripts/autonomous-watcher.sh`, `scripts/cleanup-merged-worktrees.sh` and `scripts/lib/harness-run-lib.sh` are its self-adoption, out of scope (story index → `## Scope register`, rows 31, 33 and 35).

### Targets

- `cli/templates/scripts/autonomous-watcher.sh`
- `cli/templates/scripts/cleanup-merged-worktrees.sh`
- `cli/templates/scripts/lib/harness-run-lib.sh`
- `cli/templates/scripts/remote-run.sh`
- `cli/templates/state-dir/autonomous_inbox/README.md`

**Work:**

- [ ] **"unparseable" becomes "unparsable"** in every comment and prose sentence the 2026-10-09 audit reached:
  - `autonomous-watcher.sh`: three comments — "absent, unparseable, multi-document", "absent, unreadable, unparseable, non-object" and "An absent, unparseable or keyless profile";
  - `cleanup-merged-worktrees.sh`: "unparseable or out-of-range string";
  - `lib/harness-run-lib.sh`: "unparseable `usage-state.json`";
  - `remote-run.sh`: "An unparseable createdAt".

  Before each change, grep `cli/test` and `cli/templates` for the exact sentence and confirm that no test or script matches on it.
- [ ] **"mis-route" / "mis-routed" become "misroute" / "misrouted":**
  - `autonomous-watcher.sh` → "whose comment states why they cannot mis-route";
  - `lib/harness-run-lib.sh` → "cannot be mis-routed";
  - `autonomous_inbox/README.md` → "is not mis-routed".

  The watcher's comment quotes the library's, so change both together.
- [ ] **Rename the `jq` binding `$thr` to `$threshold`** in `autonomous-watcher.sh`'s `jq -rs --argjson thr "$USAGE_SEVEN_DAY_PAUSE_PCT" '…'` program: the `--argjson` name and its one use in `< $thr`.
  - **Why the prompt's identifier rule allows it.** The binding's scope is that one `jq` program, so nothing outside the expression can name it. The story index records this reading.
  - **The grep that proves it.** Before the edit, `git grep -n 'thr\b' -- cli/templates cli/test` must find nothing outside those lines.

**Verification:**

- **The spelling probe.** A probe under `harness-runs/scratch/`, run through `bash scripts/scratch-run.sh <probe>`, runs `uvx --from typos@1.51.1 typos --format brief cli/templates/scripts cli/templates/state-dir` and reports nothing.
- **Syntax.** The same probe runs `bash -n` over each edited `.sh` file and gets exit `0`.
- **Comments only.** `git diff` of the four shell files changes only `#` comment lines, plus the two `jq` program lines carrying `thr`.
- **The behaviour check.** No test file is created or edited here, so the outer-loop suites — `cli/test/outer-loop-scripts.test.mjs` among them, which copies these templates byte for byte — run at Run gates.
