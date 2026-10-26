### Task 8 — Show the run-analytics digest in `/autonomous-sdlc-harness:branch-status` and name the new script in the plugin's script lists

**Goal:** In `/autonomous-sdlc-harness:branch-status`'s focused single-branch view, print a three-line digest from the run's `run-analytics.json` when it exists — wall, active, host-suspended and idle time, cost, and the slowest sub-agent — staying read-only; and add `run-analytics.sh` to the plugin's two lists of outer-loop scripts and its component map (scope register rows 13–15).

**Depends on:** Task 2, which fixes the `.run` keys this digest reads, restated so this file needs no other: `.run.sessions` (count), `.run.wall_ms`, `.run.active_ms`, `.run.host_suspended_ms`, `.run.idle_ms`, `.run.total_cost_usd` (number, or `null` when no session had a `result`), `.run.cache_hit_ratio`, and `.run.slowest_subagent` = `{type, description, duration_ms, session}` or `null`; the document is `<worktree>/<state_dir>/run_analytics/<branch>/run-analytics.json` with `schema` `1`. Also Task 4, which ships `run-analytics.sh` as a `no`-profile-entry outer-loop row with no `DENY_SCRIPT_BASENAMES` entry — the fact the two allowed-script lists below record.

**Where this task stops.** It reads the record; writing and committing it are the cli tasks'. The harness repository's own prose about it (`docs/watcher.md` and the rest) is **Task 10's**.

### Targets

- `plugin/commands/branch-status.md` — `## Steps`.
- `plugin/hooks/README.md` — `## The deny list`, **Being on this list is not a refusal by this guard.**
- `plugin/hooks/autonomous-script-allowlist-guard.sh` — the `LEFT ALLOWED, DELIBERATELY:` comment only.
- `plugin/docs/AUTONOMOUS_FLOW.md` — the component table.

**Work:**

- [ ] `branch-status.md`: append to step 4 one sub-bullet, **Run analytics (focused single-branch view only; read-only)**: when `$ARGUMENTS` focuses one branch and `<worktree>/<state_dir>/run_analytics/<branch>/run-analytics.json` exists (the `worktree` from step 3; for a remote record that is the run's local mirror, so it shows what was last synced; the no-local-record arm has none and prints nothing), read it once and print exactly three lines — `Time: wall <h>h<mm>m · active … · host-suspended … · idle … (<sessions> sessions)`; `Cost: $<total_cost_usd> · cache hit <ratio as %>` (`cost unknown` when `null`); `Slowest sub-agent: <type> — <description> — <duration> (session <session>)` or `Slowest sub-agent: none`. A file that does not parse or whose `schema` is not `1` is one line saying so, never a guess; an absent file prints nothing. Name no tunable, write nothing, run no script — the closing read-only paragraph stays true as written.
- [ ] `plugin/hooks/README.md` → **Being on this list is not a refusal by this guard.**: add `run-analytics.sh` to the parenthesised stay-allowed list, **before** `scratch-run.sh`, so *"The last of them executes an argument"* still names `scratch-run.sh`.
- [ ] `autonomous-script-allowlist-guard.sh` → the `LEFT ALLOWED, DELIBERATELY:` comment: the same insertion before `scratch-run.sh`, plus one clause that it writes only its own branch's analytics files. A comment-only edit: `DENY_SCRIPT_BASENAMES`, `is_denied_script` and every decision are untouched, so `docs/guard-verification.md` gains no row.
- [ ] `plugin/docs/AUTONOMOUS_FLOW.md`: a component row after "Lifecycle notifier, and the stream formatter that produces a run's readable log" — *Run analytics — each headless session's time, cost and reliability, recorded after every session* → `run-analytics.sh` in `<scripts_dir>`, writing `<state_dir>/run_analytics/<branch>/`; its own header is the format of record.

**Verification:**

- `git diff -U0 -- plugin/hooks/autonomous-script-allowlist-guard.sh` shows only lines beginning with `#`.
- The stay-allowed list in `plugin/hooks/README.md` and the guard comment name the same seven scripts in the same order, `scratch-run.sh` last.
- `claude plugin validate --strict plugin` passes (`.claude/context/plugin.md` → `## Verifying a change in this layer`); the `branch-status.md` frontmatter is unchanged.
