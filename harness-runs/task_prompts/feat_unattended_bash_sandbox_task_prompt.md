`feat_unattended_bash_sandbox` runs every unattended Bash command, and every process it starts, inside Claude Code's OS-level sandbox. It also turns network access from blocked-by-omission into denied. Today the permission profile and the guard hooks see only a **command string**, and the repository says in its own words that anything a file runs gets past them.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Line numbers given were true at `802fe43d` (v0.6.7) and are hints only.

> **Everything under "Leads" about Claude Code's sandbox is research, not a decision.** It comes from search results on 2026-10-12, partly third-party. Unattended runs have no web access, so the planner must verify every setting name, default and platform requirement against the official docs (`code.claude.com/docs/en/sandboxing` and the settings reference) in a supervised step before the plan relies on it.

---

## What is there today

- **`scratch-run.sh` runs any file under `<state_dir>/scratch/`.** That is by design: language probes and mutation checks (`cli/templates/scripts/scratch-run.sh` → `# WHAT IT IS FOR.`). Its header is candid: "everything the generated profile's `deny` floor and its `ask` list, and the script-allowlist guard's `DENY_SCRIPT_BASENAMES`, withhold from a COMMAND STRING is reachable from inside one … Do not read the file/string distinction as a capability boundary". The layer that still holds is the `pre-push` hook. The same holds for any test, build or gate the run executes, because those also run code the agent wrote.
- **Network.** `WebFetch` and `WebSearch` are in neither `allow` nor `deny` in `cli/templates/claude/settings.autonomous.json`. They are refused only because an unlisted tool stalls an unattended `-p` run. `curl`, `wget`, `nc`, `ssh` and the like are not allow-listed, but nothing denies them, and from inside a scratch probe nothing applies at all.
- **No OS sandbox anywhere.** The whiteboard's "5. The sandbox" row is conceptual (`plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`).

## The goal

1. **The unattended profile turns on Claude Code's Bash sandbox** wherever the run's platform supports it: macOS locally, the Linux runner on GitHub. Filesystem writes are confined to the worktree, the main checkout's state dir (the profile already names both) and the temp directory. Reads of `~/.ssh`, `~/.aws`, `~/.config/gh`, the shell profile and similar are denied. The network is denied except for an explicit domain list.
2. **The domain list is the smallest that keeps a run working**, and each entry gives its reason: the git remote for `push-branch.sh` (unless `fix_run_job_credential_exposure` moved pushing out of the session), and whatever the adopter's own gate commands must reach. The adopter's part must be configurable. That is a `harness.config.json` schema change and needs its negative fixture. Default to none.
3. **Strict mode for unattended runs.** The setting that lets a command retry outside the sandbox is off. If the sandbox cannot start, the run refuses to start, with a message naming what is missing (for example `bubblewrap`/`socat` on Linux). It never silently runs unsandboxed. `doctor` and `doctor --remote-job` check for the prerequisites.
4. **Explicit denies, as a second layer.** `WebFetch` and `WebSearch` move into `deny`, so they fail at once instead of stalling. `curl`, `wget` and other network clients go into `deny` too. Mind the profile's own note that a deny is a prefix match on the command string, so this layer is cosmetic without goal 1.
5. **Measure what breaks.** Run the self-adopted repository's gates, a scratch probe, a mutation check, the docs-retrieval server (`.mcp.json`, started by the agent runner, not by Bash) and a full task run on GitHub. Record each result. Any command that must run unsandboxed is listed with its reason, and the list stays as short as possible.
6. **Rewrite the honesty paragraphs.** `scratch-run.sh` → `# WHAT THIS DOES NOT CONTAIN.`, the profile's `_README`, the whiteboard's sandbox row, `plugin/hooks/README.md` and `README.md` → `## Scope and limits` must state what the sandbox now contains and what it still does not. That includes whatever the allowed domains still permit, and that the sandbox covers Bash and its children, not the `Read`/`Write` tools, which the profile's file rules cover.

## Constraints

- The guards, the deny floor and the `pre-push` hook all stay. This adds a layer and removes none.
- The supervised profile and supervised sessions are out of scope. A maintainer's own session is theirs to configure.
- Local runs on a platform with no supported sandbox (WSL1, for example) fall under goal 3: they refuse to start. Plan an explicit, named opt-out for an adopter who accepts the risk. It must never be the default.
- `scripts/run-gates.sh` must pass, with the gates running sandboxed.

## Leads (re-verify every one)

- `"sandbox": { "enabled": true }` in settings. Seatbelt on macOS; bubblewrap plus `socat` on Linux and WSL2; WSL1 unsupported.
- `sandbox.network.allowedDomains`; a `network.allowLocalBinding` option for localhost.
- `excludedCommands`, the escape hatch for tools that break inside the sandbox.
- `allowUnsandboxedCommands: false` makes the `dangerouslyDisableSandbox` parameter ignored. Sources disagree on its default.
- `failIfUnavailable`, for what happens when the sandbox cannot start.
- `filesystem.denyRead` / `allowRead` / `allowWrite` / `denyWrite`.
- Whether a `-p` (headless) session honours all of the above exactly as an interactive one does. Measure it; do not assume it.
- Whether the Linux sandbox gives sandboxed commands their own PID namespace, so `/proc/$PPID/environ` and other processes are not visible, and sets no-new-privileges, so `sudo`, which a GitHub-hosted runner grants passwordless, fails. `1 fix_run_job_credential_exposure` depends on the answer for its in-job routes. Measure both on a GitHub-hosted runner, and record the results where that task can cite them.
