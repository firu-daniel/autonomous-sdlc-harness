`feat_unattended_bash_sandbox` puts every unattended Bash command, and every process it starts, inside Claude Code's OS-level sandbox. It also turns network access from blocked-by-omission into denied. Today the permission profile and the guard hooks see only a **command string**, and the repository says in its own words that anything a file runs gets past them.

This is the first of three branches. This one ships the **profile**: the sandbox settings, the configuration that feeds them, the write protection the sandbox makes necessary, and a `doctor` check that the rendered profile carries all of it. `feat_unattended_sandbox_preflight` follows with the prerequisite checks and the launch refusal. `feat_unattended_sandbox_measurement` follows with the measurement and the documentation rewrite. Both build on this branch's code.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Line numbers given were true at `802fe43d` (v0.6.7) and are hints only.

> **The sandbox facts under "Verified facts" were checked against the official docs on 2026-10-12, in a supervised session.** Sources: `https://code.claude.com/docs/en/sandboxing` (S) and `https://code.claude.com/docs/en/settings-reference` → `### sandbox` (R). Unattended runs have no web access. Rely on these as stated, and treat the points marked **unresolved** as unresolved: plan around both outcomes, never pick one.

---

## What is there today

- **`scratch-run.sh` runs any file under `<state_dir>/scratch/`.** That is by design: language probes and mutation checks (`cli/templates/scripts/scratch-run.sh` → `# WHAT IT IS FOR.`). Its header is candid: "everything the generated profile's `deny` floor and its `ask` list, and the script-allowlist guard's `DENY_SCRIPT_BASENAMES`, withhold from a COMMAND STRING is reachable from inside one … Do not read the file/string distinction as a capability boundary". The layer that still holds is the `pre-push` hook. The same holds for any test, build or gate the run executes, because those also run code the agent wrote.
- **Network.** `WebFetch` and `WebSearch` are in neither `allow` nor `deny` in `cli/templates/claude/settings.autonomous.json`. They are refused only because an unlisted tool stalls an unattended `-p` run. `curl`, `wget`, `nc`, `ssh` and the like are not allow-listed, but nothing denies them, and from inside a scratch probe nothing applies at all.
- **No OS sandbox anywhere.** The whiteboard's "5. The sandbox" row is conceptual (`plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`).
- **The profile's `"defaultMode"` is `"acceptEdits"`** (`cli/templates/claude/settings.autonomous.json`). Under that mode a sandboxed command that reaches a host outside the allowed domains raises a prompt, which an unattended run cannot answer.

## The goal

1. **The unattended profile turns on Claude Code's Bash sandbox.** Filesystem writes are confined to the worktree, the main checkout's state dir (the profile already names both) and the temp directory. Reads of `~/.ssh`, `~/.aws`, `~/.config/gh`, the shell profile and similar are denied. The network is denied except for an explicit domain list.
2. **Strict mode.** `allowUnsandboxedCommands` is `false`, so a command can never retry outside the sandbox. `failIfUnavailable` is `true`, so a session whose sandbox cannot start exits instead of running unsandboxed. An unlisted host is **refused, never prompted for**. `strictAllowlist` is the setting that does this, but whether a `--settings` file may set it is **unresolved** (see Verified facts), so the plan must also cover the case where it does not apply.
3. **The domain list is the smallest that keeps a run working**, and each entry gives its reason. The adopter's own part, whatever their gate commands must reach, is configurable. That is a `harness.config.json` schema change and needs its negative fixture. It defaults to none.
4. **The git network commands the wrappers run work on macOS.** `push-branch.sh` and `refresh-branch.sh` push and fetch over the adopter's remote, and on macOS an SSH remote fails inside the sandbox. Whatever this branch does about it is a named, reasoned entry in the profile, never a broad exclusion.
5. **An explicit, named opt-out** for an adopter on a platform with no supported sandbox (WSL1, for example) who accepts the risk. It must never be the default, and the rendered profile must show it was taken.
6. **Explicit denies, as a second layer.** `WebFetch` and `WebSearch` move into `deny`, so they fail at once instead of stalling. `curl`, `wget` and other network clients go into `deny` too. Mind the profile's own note that a deny is a prefix match on the command string, so this layer is cosmetic without goal 1.
7. **Anything that runs outside the sandbox must not be writable from inside it.** This one rule decides the write protection. It covers:
   - every command the profile runs unsandboxed: the script file itself, plus the run library under `<scriptsDir>/lib/` that the wrappers source;
   - the hooks directory git runs `pre-push` from. Take it from `resolveGithooksDir(config)` (`cli/src/generators/githooks.ts`), the value the hook generator and `doctor` already use, never from a second read of `githooksDir`;
   - the local MCP launch surface the agent runner starts outside the sandbox: `.mcp.json`, and `<scriptsDir>/docs-search-server.sh` when docs retrieval applies;
   - every `permissions.additionalDirectories` entry except the state directory. Those are the plugin roots, and the guard hooks run from them.

   Each path is protected on both sides: `Edit`/`Write` deny rules for Claude's file tools, and `sandbox.filesystem.denyWrite` for sandboxed commands.
8. **Git's per-working-copy configuration is not trusted by the unsandboxed wrappers.** In a linked worktree, `.git/worktrees/<name>/config.worktree` is writable from inside the sandbox, and its path differs per worktree, so no profile entry can name it. `setup-worktree.sh` writes exactly one key there, `core.hooksPath`, so a sandboxed `git config --worktree` could otherwise repoint the hooks the next unsandboxed push runs. So:
   - before their first git call, both wrappers refuse when that file holds any key other than `core.hooksPath` at the value `setup-worktree.sh` writes. This is an allowlist of one key, not a list of dangerous keys;
   - every later git call is pinned with `-c core.hooksPath=…`;
   - the refusal follows each wrapper's exit contract: `push-branch.sh` stays non-fatal;
   - one residual stays open, stated rather than hidden: a `.git` pointer file or `commondir` rewritten to name a counterfeit repository is not detected.
9. **`doctor` reports a profile that lacks any of the above.** It compares the generated profile against what the configuration says it should carry: sandbox on, strict mode, the write protection, and the opt-out when it is taken.
10. **The implementer and the test-fix planner recognise a sandbox refusal** (`Operation not permitted`, `Read-only file system`, a proxy `403`, `Could not resolve host`). They read it as the boundary working, not as a defect to code around or a test to delete.

## Constraints

- The guards, the deny floor and the `pre-push` hook all stay. This adds a layer and removes none.
- The supervised profile and supervised sessions are out of scope. A maintainer's own session is theirs to configure.
- No surface of the plugin or CLI quotes a fact under "Verified facts" as more certain than it is stated there.
- `scripts/run-gates.sh` passes. Whether it also passes **sandboxed** is a hand-run check on macOS after the profile is regenerated. Record it as a manual step; `feat_unattended_sandbox_measurement` makes it a gate.

## Not in this branch

- **The prerequisite checks and the launch refusal** go to `feat_unattended_sandbox_preflight`. That is `doctor`'s `bubblewrap`/`socat`/AppArmor check, the run library's mirror of it, the watcher and remote-job refusal with a message naming what is missing, and the install step in `harness-run.yml`. Until it lands, `failIfUnavailable` is what stops an unsandboxable launch.
- **Measuring what breaks and rewriting the honesty paragraphs** go to `feat_unattended_sandbox_measurement`. Those paragraphs are `scratch-run.sh` → `# WHAT THIS DOES NOT CONTAIN.`, the profile's `_README`, the whiteboard's sandbox row, `plugin/hooks/README.md` and `README.md` → `## Scope and limits`. Until it lands they understate what is contained, which is the safe direction. Change one here only where this branch would otherwise make it false.

## Verified facts (2026-10-12)

- `sandbox.enabled`: default `false`. When the sandbox cannot start, Claude Code runs commands **unsandboxed** unless `failIfUnavailable` is set. (R)
- `sandbox.failIfUnavailable`: default `false`. When `true`, Claude Code exits at startup if the sandbox cannot start; on an unsupported platform it does not start at all. (R)
- `sandbox.allowUnsandboxedCommands`: default `true`. When `false`, the `dangerouslyDisableSandbox` parameter is ignored. A `false` from `--settings` makes the sandbox **admin-required** (v2.1.285 or later), and Claude Code then ignores these keys in a repository's `.claude/settings.json` / `.claude/settings.local.json`: `excludedCommands`, `network.allowedDomains`, `filesystem.allowWrite`, `Edit(...)` allows and `permissions.additionalDirectories` (for sandbox writes), and `WebFetch(domain:...)` allows (for the sandbox allowlist). Everything the profile needs must therefore live in the `--settings` file itself. (R; S → "Repository settings under an admin-required sandbox")
- `sandbox.autoAllowBashIfSandboxed`: default `true`. Deny rules and content-scoped ask rules such as `Bash(git push *)` still apply to sandboxed commands. (R)
- `sandbox.excludedCommands` uses `Bash(...)`-rule syntax and matches on the call's text:
  - every command in the call must match;
  - a call with `cd`, `$(…)`, a subshell, `if`/`for`, a file redirect, a command name taken from a variable, or a leading `sudo`/`eval`/`xargs` stays sandboxed;
  - an excluded command runs with **full** access, reaches any host, and goes through the regular permission flow. (R)
- Filesystem path prefixes:
  - `/` is absolute and `~/` is the home directory;
  - `./` or no prefix is the project root in project settings, and `~/.claude` in user settings;
  - how a relative path in a `--settings` file resolves is **unresolved**, so use absolute paths;
  - on Linux, `allowWrite`/`denyWrite` entries containing `*`, `?` or `[` are skipped. (R → "Sandbox path prefixes")
- Default sandbox writes: the working directory, a per-user temp directory (`$TMPDIR` is set to it), additional directories, and, in a linked worktree, the main repository's `.git` **except** its `hooks/` and `config`. Default reads: the whole machine, credential files included. (S → "Filesystem isolation")
- Protected paths stay write-denied whatever `allowWrite` says: `.claude` settings, `.claude/{skills,agents,commands,hooks,workflows}`, `.mcp.json`, shell startup files, `.gitconfig`, `.git/hooks`, `.git/config`, and most of `~/.claude`. `.mcp.json` therefore already holds for sandboxed commands, though not for Claude's file tools. (S → "Protected paths")
- `sandbox.credentials` (`files` / `envVars`, `mode: "deny"` or `"mask"`): a denied file is read-denied, and a denied variable is unset before each sandboxed command. Sandboxed commands otherwise inherit Claude Code's whole environment. (S → "Protect credentials")
- Network:
  - sandboxed commands have no direct route out; they reach a local proxy through `HTTP(S)_PROXY`/`ALL_PROXY`;
  - tools that ignore those variables (plain `ssh`, most DB drivers, UDP) cannot connect even to an allowed host;
  - an `allowedDomains` entry with no port allows every port;
  - a hostname resolving only to loopback or link-local addresses, `169.254.169.254` included, is refused unless the IP itself is listed. (S → "Network isolation")
- An unlisted host, with `strictAllowlist` off, is decided by permission mode: `dontAsk` refuses, `bypassPermissions` allows, and `acceptEdits` and the other modes **prompt**. (S → "Hosts outside your allowed domains")
- `sandbox.network.strictAllowlist`: default `false`, v2.1.219 or later. **Unresolved:** R gives its scope as "User or managed", while S says "user, managed, or CLI `--settings`".
- `sandbox.network.allowLocalBinding` is macOS only. On Linux each sandboxed command has a private loopback and cannot reach servers on the host. (R)
- On macOS, `git fetch`/`pull`/`push` against an **SSH** remote fail inside the sandbox even when the host is allowed. On Linux/WSL2 they work once the host is allowed on port 22. The documented workarounds are an HTTPS remote, or `excludedCommands` for those git verbs. (S → "`git` over SSH fails with the sandbox on")
- Platforms: macOS uses Seatbelt and needs nothing installed. Linux and WSL2 need `bubblewrap` and `socat`. WSL1 is unsupported ("Sandboxing requires WSL2"). Native Windows runs unsandboxed. (S)
- Outside the sandbox: the Read/Edit/Write/WebFetch/WebSearch tools, hooks, local MCP servers, LSP servers, the status line and `apiKeyHelper`. Subagents share the parent session's sandbox. (S → "What runs outside the sandbox", "Scope")
- The proxy decides on the client-supplied hostname and does not inspect TLS, so a broad domain such as `github.com` is an exfiltration path, domain fronting included. (S → "Security limitations")
- **Unresolved:** whether a headless `-p` session honours all of this exactly as an interactive one does. Neither page says.

## Manual steps for the human, after merge

- Regenerate this checkout's machine-local profile and `init` output from the main checkout with the branch's CLI (a `HARNESS_SELF_ADOPT=1` forced `init`). Until then this repository's own unattended runs stay unsandboxed.
- On macOS, in a sandboxed `claude -p` session:
  - run `scripts/run-gates.sh`;
  - push through `push-branch.sh` over the SSH remote. A failed push still exits 0, so only this catches a broken goal 4;
  - check whether `strictAllowlist` set via `--settings` refuses an unlisted host rather than stalling;
  - try `git config --worktree core.hooksPath` from a sandboxed command and confirm the next push refuses.
