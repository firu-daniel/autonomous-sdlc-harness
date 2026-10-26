`feat_unattended_sandbox_measurement` builds the tool that measures the unattended sandbox on macOS: a probe a person runs by hand, and a new hand-run gate that lists every leg and its expected result. It does not take the measurements, and it does not write the sandbox's document of record. The person who runs the gate records the results in `docs/sandbox-verification.md`.

This is the first of four branches that replace the original `feat_unattended_sandbox_measurement` prompt:

- **sandbox3a (this branch):** the probe and the gate, macOS legs.
- **sandbox3b `feat_sandbox_probe_linux_legs`:** the same probe on Linux, in a local container and on a GitHub-hosted runner, plus the Linux-only legs.
- **sandbox3c `chore_unattended_sandbox_record`:** the document of record, written from the measured results.
- **sandbox3d `chore_sandbox_honesty_paragraphs`:** the honesty paragraphs and the other docs brought in line with it.

It starts from a `dev` that carries the whole sandbox series so far. Read what each branch actually shipped before planning, not what its prompt said: `feat_unattended_bash_sandbox` (#100), `chore_sandbox_manual_verification` (#110), `fix_watcher_worktree_git_calls` (#111), `fix_remote_bundle_save_symlinks` (#113), `fix_sandbox_excluded_commands_form` (#114), `fix_sandbox_worktree_record_writes` (#115), `feat_clone_per_run` (#117), `feat_clone_per_run_anchor` (#120), `feat_clone_per_run_switch` (#122), `fix_run_gates_sandbox_tmpdir` (#126), `fix_run_copy_commit_identity` (#128), `fix_profile_inert_permission_rules` (#131), `fix_self_adopt_regeneration_friction` (#134), `feat_unattended_sandbox_preflight` (#137), `fix_run_gates_wait_form_sandbox` (#140), `fix_run_gates_background_run_handling` (#161), `fix_run_gates_answered_park_resume` (#162) and `chore_record_observed_run_rows` (#165).

What that `dev` is, in short:

- **Every new run copy is a clone**, a `git clone --shared` at `<work_root>/<project>-<sanitized branch>`, registered in `<main>/<stateDir>/autonomous_logs/registry.json` with `copy_kind` `clone`. A legacy worktree run keeps the worktree arm until none is left (`docs/watcher.md` → `### Migration: both layouts until no worktree run is left`).
- **The watcher passes a per-run profile**, the base plus the run copy's exact paths, as the one `--settings`, and refuses to launch on a profile that fails `run_profile_check` (`docs/cli.md` §6).
- **Three wrappers run outside the sandbox**, each spelled only as the main checkout's copy, `bash <main>/scripts/<wrapper>.sh:*`: `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh`. Each checks its target first: the main checkout, a worktree it lists, or a clone the registry records.
- **The write protection** covers the main checkout's whole `.git`, six paths in each clone's `.git`, the run registry, the per-run profile, the plugin roots, the wrappers and their library, the hooks, the MCP wiring and the settings files (`cli/src/generators/writeProtection.ts` → `protectedPaths`, and the watcher's `run_profile_entries`).
- **`doctor`** has `profile-sandbox`, `profile-write-protection`, `profile-main-anchor` and `sandbox-prerequisites`.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

## What `docs/sandbox-verification.md` already holds

Read it whole before planning. It is the evidence record, one row per check, and the probe re-measures its rows rather than starting over. A re-measurement that disagrees with a recorded row is a finding, never a silent overwrite.

- **Measured, and holding:** `doctor`'s profile checks (D1–D3); `strictAllowlist` honoured from `--settings` (N1, N2); the credential reads refused (S1, S2); the write protection on the worktree layout (W0–W5, WR1–WR7); the run registry's (RG1–RG3); the clone's own `.git` behaviour (CL1–CL6); the main-checkout anchor (AN1–AN4); the QA lock (Q2); a `.claude/` write under `dontAsk` (Q1); the Run gates liveness and background probes (WF1, BG1–BG7).
- **Observed on real runs, not probed** (§7, OR1–OR9): pushes through `<main>/scripts/push-branch.sh` land; the clone's own copy and every compound call stay sandboxed; commits through `commit-on-branch.sh` land under the main checkout's identity, unsigned; the gates pass sandboxed; three full runs completed on clones.
- **Owed, and what this probe exists to take:** every refresh row (R0–R4); the planted-configuration refusals (C1, C2, K2, CW3, CW4); L1 and L2; the assignment prefix (P1b, CW6); the clone layout's write protection and git (CS1–CS8); the file-tool rows under the `Edit`-only rules (W6–W8); the sandboxed `mktemp` forms (TD2); T2 as the one exact call it names.
- **Not for this probe:** WF2, WF3 and BG10 need a person to kill a process from outside a session, and BG8 needs a watcher with lowered tunables. They stay hand rows in their checks file. Every Linux row is sandbox3b's.

## Verified facts (2026-10-24)

Checked against the official docs in a supervised session on 2026-10-24: `https://code.claude.com/docs/en/sandboxing` (S) and `https://code.claude.com/docs/en/settings-reference` (R). Unattended runs have no web access.

- **Scope.** "The sandbox covers shell commands only." The Read, Edit, Write, WebFetch and WebSearch tools follow permission rules instead. Hooks, local MCP servers, plugin monitors, LSP servers, the status line and `apiKeyHelper` "run with your full access". Subagents run in the parent's process with the same sandbox. (S → "What runs outside the sandbox", "Scope")
- **`excludedCommands`.** Entries use `Bash(...)` rule syntax, and S recommends ending one with ` *`; this profile's `:*` form is measured to work (P1a). "Every command in the call has to match." A redirect to a file, a `cd`, or a command substitution keeps the whole call sandboxed. Matching is on the call's text, so a script that calls the command inside does not match. (S)
- **Network.**
  - Sandboxed commands reach a local proxy through `HTTP_PROXY`, `HTTPS_PROXY` and `ALL_PROXY`.
  - The proxy decides on the client-supplied hostname and does not terminate or inspect TLS, so domain fronting can reach hosts outside the allowlist.
  - Tools that ignore the proxy variables (plain `ssh`, most database drivers) cannot connect, and nothing that isn't TCP leaves the sandbox.
  - A hostname that resolves only to loopback, link-local (`169.254.169.254`) or the machine's own addresses is refused; `localhost` is allowed to resolve to loopback.
- **`strictAllowlist`.** S: settable in "user, managed, or CLI `--settings`"; setting it in a repository's `.claude/settings.json` or `.claude/settings.local.json` "has no effect". R's scope column still says "User or managed". N1/N2 measured it honoured from `--settings` on 2.1.299.
- **Protected paths.** In the working directory and above it: the `.claude` settings files, `.claude/{skills,agents,commands,hooks}`, `.mcp.json`, `.claude/workflows`, `.claude/scheduled_tasks.json`. In the working directory only: shell startup files, `.gitconfig`, `.vscode`, `.idea`, and `.git/hooks` and `.git/config`. The files that would make the working directory a bare repository. Most of `~/.claude`. In a linked worktree, the main repository's shared `.git` is writable except `hooks/` and `config`. (S → "Protected paths")
- **The Bash tool's `allowed_domains` parameter.** On Claude Code 2.1.308 and 2.1.309, sessions passed it, and an excluded call carrying it was refused with *"allowed_domains applies only to a command that runs in the sandbox, and this one would not …"* (`docs/sandbox-verification.md` §7 OR4). No doc page found on 2026-10-24 describes it. Whether it widens the allowlist for a sandboxed call under `strictAllowlist` is **unresolved**.
- **Headless parity.** No doc page says whether a `-p` session honours the sandbox settings as an interactive one does. **Unresolved**; it is a leg below.
- **Version.** `claude --version` printed `2.1.310 (Claude Code)` on 2026-10-24. Every result line carries the version the probe ran on.

## The goal

1. **A probe a person runs by hand.**
   - It drives sandboxed headless sessions on the watcher's own launch line (`docs/sandbox-verification.md` → `## 0. Method`, and `### The clone layout (owed)`'s per-run line), against a throwaway probe clone it cuts through the main checkout's `create-worktree.sh` and the per-run profile the watcher renders for it.
   - It prints one result line per leg: the leg's name and row id, `pass`, `fail` or `not run`, and the evidence line it judged by, quoted.
   - It follows §0's method: one exact call per probe, no `; echo $?`, a positive control in the same session for every refusal, and a reading of which layer refused (sandbox, permission layer or file tool). Every push is judged by `ls-remote`, every commit by the ref before and after, never by an exit status.
   - Where a leg needs a call the profile does not allow, it reaches the sandbox the way §0 and CL6 do: `--allowedTools` for that one rule, or a helper script allowed as one exact `bash <helper>` call. It names each departure in the leg's line.
   - It changes nothing outside its own temp area, the probe clone and the probe branch, and cleans up after itself: the clone, its registry record, its per-run profile, the branch local and on origin, every control and marker file. It compares a `shasum` of `<main>/harness.config.json`, `<main>/.git/config` and `<main>/.claude/settings.autonomous.json` before and after, and fails loudly if any changed.
   - It refuses to start when the main checkout is not on the default branch, the watcher has a run in flight, or the profile `doctor` grades is not the live one. It never edits `<main>/.claude/settings.autonomous.json`; a leg that needs a variant profile writes a scratch copy and passes that.
   - Auto mode refuses a `claude -p` launch carrying `--allowedTools`, so the probe is a script a person starts from a terminal (`! bash <probe>` from a session works). Say so in its usage.
2. **The legs.** Each leg names the row or rows in `docs/sandbox-verification.md` it measures, so its result goes into that row. A leg with no row yet gets a new row id there, defined by this branch with its check and its expected result and marked *not yet measured*.
   - **gates:** `bash scripts/test.sh` as one exact call from a sandboxed session in the probe clone (T2 as written).
   - **mktemp:** the four `mktemp` forms sandboxed (TD2).
   - **scratch:** `scripts/scratch-run.sh` runs a probe file sandboxed, and a mutation check shows that a write outside the allowed roots from inside that file is refused.
   - **retrieval:** the docs-retrieval MCP server (`.mcp.json`, started by the agent runner, not by Bash) answers a `search_docs` call from a sandboxed session. It runs outside the sandbox by design; record that it started and answered.
   - **wrappers:** on the probe clone, through `<main>/scripts/`: a commit, a push, and a refresh in three fixtures (a fast-forward, a true two-parent merge, and a conflict that exits 4 and writes nothing). Those are CS4, R1–R3 on the shipped profile and the clone arm. The clone's own copies stay sandboxed (P3, R4, CW2, on the clone). A compound stays sandboxed (P1c, CW5). An assignment prefix, `GIT_SSH_COMMAND=<probe> bash <main>/scripts/push-branch.sh <clone>` and `GIT_DIR=<x> bash <main>/scripts/commit-on-branch.sh …`, either stays sandboxed or is neutralised (P1b, CW6), and the probe says which.
   - **planted configuration:** each wrapper refuses before any git call: a scratch repository whose `.git/config` sets `core.sshCommand` or `core.fsmonitor` (C1, CW3); a key outside `hr_clone_config_spec`'s allow-list planted in the probe clone's `.git/config` from a terminal; an `objects/info/http-alternates`, a `commondir` and a `config.worktree` planted in the clone's `.git`, where CL5 measured new files writable; a branch starting with `-` and a `defaultBranch` starting with `-` (L1, L2). No marker file a planted command would create may appear. Re-target the worktree rows C2, K2 and CW4 at the clone, and say so in their rows.
   - **write protection:** each protected path the per-run profile names for the probe clone, and each base path, is refused to a sandboxed `dd`, to a sandboxed rename staged from a writable spot (CL6's indirect form), and to `Edit` and `Write` (CS1, CS2, CS7, W6). That includes the plugin root, the per-run profile file itself, the run registry and `<main>/.git` as a whole. The positive control is a new file in `<clone>/.git`.
   - **git in the clone:** sandboxed ordinary git works in the probe clone under the real per-run profile (CS3), and a sandboxed `git config` in it is refused (CL5).
   - **network:** an unlisted host is refused at once, under `dontAsk` and under `acceptEdits` (N1, N2 re-measured); a hostname resolving only to loopback or link-local is refused; and a sandboxed call to an unlisted host carrying the Bash tool's `allowed_domains` parameter is either refused or reaches the host. **That last one is the leg that matters most.** If it reaches the host, the profile's empty `allowedDomains` does not hold against a session, and that is a finding with its own follow-up prompt, not a doc edit.
   - **retry:** a call carrying `dangerouslyDisableSandbox: true` does not run unsandboxed, with `allowUnsandboxedCommands` `false`.
   - **repo settings:** the probe clone's own `.claude/settings.local.json`, planted from a terminal with a loosening (the sandbox off, `allowUnsandboxedCommands` `true`, an extra `allowedDomains` entry, `strictAllowlist` `false`), changes none of the legs above.
   - **credentials:** reads of `~/.ssh` stay refused from a sandboxed command and from the `Read` tool (S1, S2); the token variables the profile unsets are absent; and `ssh-add -l` from a sandboxed session shows whether the SSH agent socket is reachable (the question `fix_run_copy_commit_identity` left).
   - **headless parity:** the network, retry and write-protection legs once more in an interactive session on the same profile, by a person following a short script the gate prints. Record any difference.
   - **invalid profile:** CS8 (a), a launch on a profile whose `sandbox.failIfUnavailable` is the string `"true"`.
3. **A new hand-run gate**, numbered after `scripts/run-gates.sh`'s existing gates and documented with the others in `docs/development.md` → `## 5. Verifying a change`. It lists every leg above with its expected result and its row, the command that runs the probe, and where each result is recorded. It names sandbox3b's Linux and GitHub legs as *owned by sandbox3b* so the list is complete. Add it to `run-gates.sh`'s hand-run list.
4. **Gate counts.** Any sentence that counts the gates, or names the hand-run gates, is brought in line, including the supply-chain audit's statement of how many gates it leaves unchanged. Find them with a search you record, so the scope can be re-derived.

## Constraints

- **No measured result is invented.** This branch writes no result. Every new row it adds says *not yet measured*.
- **No profile, generator, wrapper, guard or watcher behaviour changes.** A defect the plan finds becomes a follow-up task prompt.
- **The probe is a maintainer tool of this repository**, beside `scripts/probe-plugin-cli.sh`, not something `init` renders for adopters. It sits under `scripts/` and is not a `cli/templates/` file.
- The probe's own tests drive its parsing and its refusals against recorded stream fixtures. No test launches `claude`.
- `scripts/run-gates.sh` passes.
