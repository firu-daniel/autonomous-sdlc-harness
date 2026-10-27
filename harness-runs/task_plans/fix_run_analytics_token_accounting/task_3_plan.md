### Task 3 — Locate sub-agent transcripts in `run-analytics.sh` and feed them through the `transcripts` and `attach` modes

**Goal:** Give `cli/templates/scripts/run-analytics.sh` the file-locating half of the token fix. After the `sessions` pass, it finds each new dispatch's on-disk sub-agent transcript by `session_id` and `agentId`, feeds the transcripts that exist to `lib/run-analytics.jq`, and attaches the final figures to the new records. When none is found it changes nothing, which leaves the `null` tokens Task 1 records.

**Depends on:** Task 1, which defines the two modes and the record fields this task drives. This task calls them exactly as follows:

- **Record fields read:** each new record's `session_id` (a resume's is `<session_id>#<N>`, so strip from the first `#`) and each `subagents[]` entry's `agent_id` (a string or `null`).
- **`transcripts` mode:** `jq -n -R -c -S -f "$sessions_jq" --arg mode transcripts --argjson idle_threshold_s "$idle" --argjson known '[]' --argjson redact '[]' --argjson suspend '[]' --arg suspend_source none`.
  - **stdin:** a concatenation where each transcript is preceded by one marker line `{"run_analytics_transcript":"<agent_id>"}`.
  - **stdout:** one object keyed by agent id.
- **`attach` mode:** `jq -c -S -f "$sessions_jq" --arg mode attach` with the same neutral variables.
  - **stdin:** `{"records": <new records array>, "transcripts": <that object>}`.
  - **stdout:** the records array.

This task does no token arithmetic. That belongs to Task 1's modes and Task 2's report. The cases that prove this path are Task 4's, and the `scripts/run-analytics.sh` mirror is Task 5's.

### Targets

- `cli/templates/scripts/run-analytics.sh`. The transcript step, its header, and a `REPRO` line.
- `cli/src/machine/paths.ts`. A doc-comment line declaring this shell mirror of `claudeHome()`; no code change.

**Work:**

- [ ] **Resolve the agent runner's home as `claudeHome()` does.** Use `${CLAUDE_CONFIG_DIR}` when it is non-empty, else `$HOME/.claude`, with one trailing slash stripped. Use the existing `strip_slashes` helper or the same single strip `claudeHome()` applies, and keep its documented semantics. With neither available, skip the transcript step.
  - In `cli/src/machine/paths.ts`, add one sentence to `claudeHome`'s doc comment. It says that `cli/templates/scripts/run-analytics.sh` mirrors this resolution in shell to read sub-agent transcripts, so a change to either resolution is an edit to both. This follows the header's existing pattern for `hr_lane_dir` / `hr_cache_dir`.
  - Do not add a second TypeScript reader of the variable. The module's rule, *"read here and nowhere else in the CLI"*, stays true.
- [ ] **Locate, only when `n > 0`, after the `sessions` pass and before the suspend-window step.**
  - List `<session_id-without-#N> <agent_id>` pairs from `$work/new.json` with one `jq -r` call, skipping `null` agent ids.
  - Reject any token containing a character outside `A-Za-z0-9_-` with a `case` pattern, because each becomes a path segment. A rejected pair is skipped, not fatal.
  - For each pair, glob `"$claude_home"/projects/*/"$sid"/subagents/agent-"$aid".jsonl` and take the first match that is a readable regular file. The `*` stands for the project slug, which is never derived.
  - Append the marker line with `printf`, then the file's bytes, then a newline, to `$work/transcripts.jsonl`. Every temporary file goes inside the existing `$work` directory, and no new `mktemp` call is added.
  - Read transcripts only. Write nothing outside `$work` and the two output files.
- [ ] **Feed and attach, only when `$work/transcripts.jsonl` is non-empty.**
  1. Run the `transcripts` mode into `$work/transcripts.json`.
  2. Build the attach input with `jq -n -c --slurpfile r "$work/new.json" --slurpfile t "$work/transcripts.json" '{records: $r[0], transcripts: $t[0]}'`.
  3. Run `attach` into `$work/attached.json`, then `mv` it over `$work/new.json`.

  A failing jq call is a `die` naming the mode, in the overlay step's exact form (`lib/run-analytics.jq transcripts failed: …` / `… attach failed: …`). An unreadable, absent or empty transcript is not an error: absent means "not available".
- [ ] **Header and `REPRO`.**
  - Update *THREE FILES, ONE DRIVER* for the two new modes.
  - Add a *SUB-AGENT TRANSCRIPTS* paragraph covering:
    - the path shape and the `claudeHome()` mirror;
    - that the read is read-only and located by `session_id` + `agentId`, never by slug;
    - that a run without them (a later job on a fresh runner, or removed transcripts) records `null` tokens rather than stream figures;
    - that the engine launch in `spawn_engine` carries no `--no-session-persistence`, which only `remote-run.sh`'s mention session sets.
  - *WHERE IT STOPS* gains "reads the agent runner's sub-agent transcripts, never writes there".
  - Add one `REPRO` line: the same fixture with `CLAUDE_CONFIG_DIR=$d/home` and a transcript placed at `$d/home/projects/x/s1/subagents/agent-a1.jsonl`, with the expected effect.
  - The usage line and the exit map are unchanged.

**Verification:**

- `bash -n cli/templates/scripts/run-analytics.sh` exits 0.
- `git grep -l 'CLAUDE_CONFIG_DIR' -- cli/src` lists no file beyond those that listed it before this task: `cli/src/machine/paths.ts`, plus the doc comment in `cli/src/generators/permissionProfile.ts`. No new TypeScript reader appears.
- `git grep -nE 'mktemp' -- cli/templates/scripts/run-analytics.sh` shows no call beyond those already present: the `$work` directory and the two output temporaries.
- Running the script with `CLAUDE_CONFIG_DIR` pointed at an empty directory leaves its output unchanged from a run on Task 1's record alone. Task 4's no-transcript case asserts this.
