### Task 7 — Write the upstream report for anthropics/claude-code

**Goal:** Write the report the maintainer files on anthropics/claude-code. The route leaves one goal bullet unmet on Linux: a sandboxed write to `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` is no longer refused by the sandbox. Keeping that refusal without the path appearing needs a Claude Code change. The leftovers that Claude Code's own `.mcp.json` denial creates also need one.

**Depends on:** Task 6, which creates `scripts/sandbox-absent-path-check.sh`, with the subcommands `run`, `sweep`, `after-teardown` and `report`. The report names that script as the reproduction, and this task changes nothing in it.

**How this task's implementer reads the conventions.** This is a catch-all task, so read every configured layer's conventions document. The document is a decision of record and lives under `docs/` (`.claude/context/conventions.md` → `### Where a new responsibility goes`). It opens with its own statement of who reads it and what it owns (`## What accompanies a new unit of each kind`). It quotes every measured fact with the command, the exact message and the versions (`## Documents of record`).

### Targets

- `docs/sandbox-placeholder-upstream-report.md` (new)

**Work:**

- [ ] Open with `**Who reads this:**`: the maintainer filing the report, and anyone checking whether a later Claude Code version lifts the harness's Linux interim position. State that it is a draft to file, not a filed issue, and that the interim position it lifts is `docs/cli.md` §6's.
- [ ] The report body, written to be pasted as is.
  - **Title.**
  - **Environment.** Claude Code 2.1.312, bubblewrap 0.8.0, Debian 12 (bookworm) in a container on colima's Ubuntu 24.04.4 VM, aarch64, `kernel.apparmor_restrict_unprivileged_userns` set to `0`, git 2.39.5.
  - **What a `denyWrite` entry for an absent path does inside a call.** Quote both lines: the `crw-rw-rw- 1 nobody nogroup 1, 3 … <clone>/.git/commondir` line and the `/null <clone>/.git/commondir ro,nosuid,nodev - tmpfs` mountinfo line.
  - **The git failure.** `fatal: failed to read <clone>/.git/commondir: Permission denied`.
  - **The two persistence observations:**
    - the 0644 `config.worktree`, created at session start and never removed;
    - the 0444 leftovers of a session killed with `SIGKILL`, `harness-runs/.mcp.json` among them, which is Claude Code's own `.mcp.json` denial in an `--add-dir` root.
  - **The concurrency reading.** Phase C did not reproduce the race.
  - **How to reproduce.** Name the in-tree script, `scripts/sandbox-absent-path-check.sh` (`run`, then `report`), and its subcommands.
- [ ] The asks, each stated as a behaviour rather than an implementation:
  1. A sandboxed process should see a denied absent path as absent and be refused when it creates one, so a reader such as git does not find a file there.
  2. Nothing should be created on the real filesystem for a denied absent path. Failing that, every placeholder should be removed by a cleanup that survives a killed process and is shared across processes. Cite [#94008](https://github.com/anthropics/claude-code/issues/94008) for the mechanism, read from the 2.1.270 bundle, and the cross-process race. Cite [#81602](https://github.com/anthropics/claude-code/issues/81602) and [#78072](https://github.com/anthropics/claude-code/issues/78072) for placeholders left behind.
  3. Say what creates a 0644 empty file at a denied `.git/config.worktree` at session start, and remove it.

  State that none of these issues names a fixed version (as of 2026-10-29). Cite #26722 and #79785 as the closed WSL2 reports.
- [ ] A closing `## The harness's interim position` section, short. Cite `docs/cli.md` §6 for the whole position rather than restating it, and name the one-line summary: on Linux the run copy's three `.git` trust files are refused at launch and by the wrappers rather than by the sandbox; leftovers are swept before the first reader that a leftover breaks, the watcher's own start included; and one run per repository runs at a time. Name the facts that would let the harness drop each part. The trio's omission can be dropped when ask 1 lands. The sweep and the cap can be dropped when ask 2 lands.

**Verification:**

- Every version, path shape and quoted message in the report appears verbatim in the task prompt's *What was measured*, *Measured: the absent-path check* or *Verified facts* sections, or in `docs/sandbox-verification.md` §0 *The probe's first Linux run (2026-10-29)*, which carries the git version and the VM line. Check each by `grep -F` against `harness-runs/task_prompts/fix_linux_sandbox_deny_placeholders_task_prompt.md` or that document.
- `grep -nE '/Users/|/home/|/private/' docs/sandbox-placeholder-upstream-report.md` finds nothing. `<clone>` and `<main>` stand in for paths, as in the prompt.
