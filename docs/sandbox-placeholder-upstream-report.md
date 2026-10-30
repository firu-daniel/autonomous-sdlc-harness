# The upstream report: Linux sandbox placeholders for denied absent paths

**Who reads this:** the maintainer filing this report on anthropics/claude-code, and anyone checking whether a later Claude Code version lifts the harness's Linux interim position. It is a **draft to file, not a filed issue**: until an issue number is recorded here, nothing upstream has been asked. The interim position it would lift is `docs/cli.md` §6's. It owns the report's text and its asks; the measurements it quotes are recorded in `docs/sandbox-verification.md` (§0 *The probe's first Linux run (2026-10-29)*, §0 *The targeted check (2026-10-29)*, §5 F9, §5 AP2, §5 *Session 1* and AP7, and §8 GW1 and GW2), and that document stays their record.

Everything from `## Report` to the end of `### Asks` is written to be pasted as is. `<clone>` is the run copy, a `git clone --shared` of the main checkout, and `<main>` is the main checkout; both stand in for absolute paths under the container user's home directory.

---

## Report

### Title

Linux sandbox: a write-denied absent path is mounted as `/dev/null`, breaks git, and leaves files on disk after a killed session

### Environment

- Claude Code `2.1.312 (Claude Code)`; the 2026-10-30 readings, `2.1.314 (Claude Code)`
- `bubblewrap 0.8.0`
- `Debian GNU/Linux 12 (bookworm)`, in a container on colima's `default` VM (Ubuntu 24.04.4 LTS, kernel 6.8.0-117-generic, aarch64)
- `kernel.apparmor_restrict_unprivileged_userns: 0`
- `git version 2.39.5`
- The container: `docker run --rm -it --name sbx-probe-linux --security-opt seccomp=unconfined --security-opt apparmor=unconfined --security-opt systempaths=unconfined node:22-bookworm bash`, run as a non-root user.

Each session is headless, on this launch line, with `<working copy>` the clone and `--settings` naming a copy of the run's per-run profile rather than the file shown:

```sh
cd <working copy> && claude -p "<probe prompt>" \
  --settings <main>/.claude/settings.autonomous.json \
  --permission-mode dontAsk --model opus \
  --output-format stream-json --verbose \
  --add-dir <working copy> --add-dir <main>/harness-runs
```

The `--settings` file turns the sandbox on (`sandbox.enabled` and `failIfUnavailable` `true`, `allowUnsandboxedCommands` `false`) and lists 35 exact paths under `sandbox.filesystem.denyWrite`, some of which do not exist: in `<main>`, `.mcp.json`, `.claude/settings.local.json` and `scripts/.git`; in `<clone>`, `.mcp.json`, `.claude/settings.local.json`, `.git/hooks`, `.git/commondir`, `.git/objects/info/http-alternates` and `.git/config.worktree`. Denying them is the point: each is a file that, if a sandboxed command created it, would redirect a git or a hook run that happens outside the sandbox.

**Every path is denied twice.** Our profiles name each of those paths by a `denyWrite` entry, for sandboxed commands, and by a `permissions.deny` `Edit(...)` rule for the same path, for the file tools. Every placeholder below was at a path named by an `Edit` rule, and all but the 2026-10-30 first session's `<clone>` trio by a `denyWrite` entry too, except Claude Code's own (`harness-runs/.mcp.json`, and the paths under *Claude Code's built-in protected paths*). The 2026-10-30 control (*An `Edit(...)` deny rule does the same*) shows that an `Edit` rule alone mounts the placeholder. No run of ours named an absent path inside a write root by a `denyWrite` entry alone (the control's sibling paths, named so, sit outside every write root and got none), so that a `denyWrite` entry alone does the same is not measured here; the control that would settle it removes the `Edit` rules and keeps the `denyWrite` entries. The asks below are about a write-denied absent path, whichever of the two denies it.

**Re-taken on 2026-10-30**, on Claude Code 2.1.314, the same `bubblewrap 0.8.0` and the same container shape. By then we had stopped listing the clone's `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` exactly in `denyWrite`, because of the git failure below, so that run's per-run profile named them by no exact `denyWrite` entry. Its `denyWrite` named them only by three glob entries that `<clone>` matches: `<home>/autonomous-sdlc-harness-*/.git/commondir`, `<home>/autonomous-sdlc-harness-*/.git/config.worktree` and `<home>/autonomous-sdlc-harness-*/.git/objects/info/http-alternates`, where `<home>` is the container user's home directory. Its `permissions.deny` still named them by `<clone>`'s exact `Edit` rules and by the same three globs as `Edit` rules. What it read is under *Glob entries* and item 1 of *Two placeholders persist on the real filesystem*.

### What a write-denied absent path does inside a call

Inside every sandboxed Bash call, each absent denied path exists and is `/dev/null`. `ls -la` and `/proc/self/mountinfo` from a sandboxed call:

```
crw-rw-rw- 1 nobody nogroup 1, 3 … <clone>/.git/commondir
444 423 0:57 /null <clone>/.git/commondir ro,nosuid,nodev - tmpfs …
```

The same holds for every absent entry in both checkouts: `character special file, 0 B, nobody`, mounted from `/null (tmpfs, ro,nosuid,nodev)`. Outside the sandbox, after a session that ends normally, they are absent again: the session's own cleanup removed them.

### Glob entries

An absent path that a glob matches under the directories present when the sandbox starts gets the same `/dev/null` placeholder. Each reading below had a glob `denyWrite` entry and a glob `Edit` rule on the path, and the second reading also had one of Claude Code's own protected paths. So none of them shows that the glob `denyWrite` entry is what mounts it. That is not measured; the control that would settle it removes the `Edit` rules and keeps the glob `denyWrite` entry.

- **2026-10-30, Claude Code 2.1.314** (the re-take above). `<clone>/.git/commondir` and `<clone>/.git/objects/info/http-alternates`, named by no exact `denyWrite` entry, read inside the sandbox in both sessions as `character special file, 0 B, crw-rw-rw-, nobody`, `mount: /null (tmpfs, ro,nosuid,nodev)`. An excluded command read both `absent`. After the session killed with `SIGKILL` (item 2 below), both were left on disk as `regular empty file, 0 B, -r--r--r--, probe, mtime 2026-10-30 11:03:21.977825991 +0000`. Sandboxed git in `<clone>` failed as described under *The git failure*. The same profile also named both by `<clone>`'s exact `Edit` rules and by glob `Edit` rules, and the control under *An `Edit(...)` deny rule does the same* shows those rules alone mount this placeholder.
- **2026-10-29, Claude Code 2.1.312**, on a scratch profile without the clone's exact `denyWrite` entries and exact `Edit` rules. `<clone>/.mcp.json` was absent when the session started and was covered by the `denyWrite` entry `<home>/autonomous-sdlc-harness-*/.mcp.json` and by the `Edit` rule for the same glob, which the scratch profile kept. A sandboxed `dd` onto it failed with `dd: failed to open '<clone>/.mcp.json': Permission denied`, which is the placeholder. `.mcp.json` in the session's cwd is also one of Claude Code's own protected paths (*Claude Code's built-in protected paths*, measured on 2.1.314).
- **The same 2026-10-29 run, a path under an existing directory.** `<clone>/githooks` existed when the session started and was covered by `<home>/autonomous-sdlc-harness-*/githooks`, as a `denyWrite` entry and as an `Edit` rule. A sandboxed write of a new file under it, `<clone>/githooks/sbx_gw1_new`, succeeded: the open for writing was not refused.

### An `Edit(...)` deny rule does the same

On Linux, `permissions.deny` `Edit(...)` rules are enforced inside the bubblewrap sandbox too, and an `Edit` rule naming an absent path inside a write root mounts the same `/dev/null` placeholder a `denyWrite` entry does, globs included: the exact and glob rules together; the glob form alone is not separated: no reading of ours had a glob `Edit` rule alone on an absent path inside a write root (*Glob entries*).

- **2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0**, two sessions in the same container. In the first, the per-run profile named `<clone>/.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` by no `denyWrite` entry, exact or glob, but its `permissions.deny` held 18 `Edit` rules for the three: `<clone>`'s exact paths, the `<home>/autonomous-sdlc-harness-*/.git/…` globs and a sibling clone's exact paths, each as `<p>` and `<p>/**`. Inside the sandbox `commondir` and `http-alternates` read `character special file, 0 B, crw-rw-rw-, nobody; mount: /null (tmpfs, ro,nosuid,nodev)`, sandboxed git in `<clone>` failed as under *The git failure*, and after a session killed with `SIGKILL` both were left on disk as `regular empty file, 0 B, -r--r--r--`.
- **The control**, the second session: a copy of that profile with only those 18 `Edit` rules removed. `commondir` and `http-alternates` read `absent` inside and outside the sandbox in every phase, after the kill included, and sandboxed `git status` in `<clone>` exited 0.
- **Outside every write root, nothing.** The sibling clone, outside the cwd and outside every `allowWrite` root, got no placeholder at any of its denied absent paths, though its three were named by exact `denyWrite` entries and exact `Edit` rules: each read `absent` inside and outside the sandbox.

### The git failure

git treats a present `commondir` as the pointer to a common directory, reads it, and fails. Every git call in `<clone>` inside the sandbox exits 128:

```
fatal: failed to read <clone>/.git/commondir: Permission denied
```

In `<main>`, sandboxed `git status` lists `?? .mcp.json ?? harness-runs/.mcp.json`, two files that do not exist outside the sandbox. From an excluded command and from a plain shell, git works in both checkouts after sessions that end normally.

So denying a path *because* it must not appear makes it appear, to every sandboxed reader, and git cannot be used in that repository from any sandboxed call.

### Two placeholders persist on the real filesystem

**1. `<clone>/.git/config.worktree`, created at session start and never removed.** From a plain shell outside any sandbox, before and after one headless session:

```
before:  <clone>/.git/config.worktree: No such file or directory
after:   -rw-r--r-- 1 probe probe 0 Oct 29 11:34 <clone>/.git/config.worktree
```

In a second measurement it was a real empty file owned by the session's user, created when the first session started (its mtime was the run's own start), mounted read-only over itself inside the sandbox, and left on disk after each later phase: a second session, then two sessions at once. It differs from every other absent entry in three ways: mode `-rw-r--r--` where the other leftovers below are `-r--r--r--`; inside the sandbox it is mounted over itself, the treatment of a path that already existed, rather than from `/null`; and it survives sessions that end normally. `<clone>/.git/commondir`, listed the same way, did not persist. Nothing in our own tooling writes a clone's `.git/config.worktree`, so the file appears to be made before the sandbox's mounts are built, by something other than the `/dev/null` placeholder path.

The 2026-10-30 re-take found it again, on a profile whose `denyWrite` named it only by the glob entry `<home>/autonomous-sdlc-harness-*/.git/config.worktree`, and whose `Edit` rules named it too. It read `absent` at `outside before`, the reading taken just before session A launches. From `after-A` through `after-sweep` it read `regular empty file, 0 B, -rw-r--r--, probe, mtime 2026-10-30 11:02:14.302377664 +0000`, an mtime earlier than session A's first assistant message (`2026-10-30T11:02:18.439Z`). Inside the sandbox it was again mounted over itself: `mount: <clone>/.git/config.worktree (overlay, ro,nosuid,nodev,relatime)`.

The 2026-10-30 control (Claude Code 2.1.314, bubblewrap 0.8.0), whose profile named it by no `denyWrite` entry and no `Edit` rule, found it again: it appeared at the first session's start as a real `regular empty file, 0 B, -rw-r--r--`, stayed, and was mounted read-only over itself inside the sandbox.

**2. Every absent placeholder, after a session killed with `SIGKILL` mid-call.** One session was killed with `SIGKILL` in the middle of a Bash call, and the paths were read from a plain shell 1 s and 10 s later. Every other absent entry was left on disk as a `-r--r--r-- probe 0 B` real file. The three in `<main>` were still there after the run copy was torn down. git then fails in `<clone>` even outside the sandbox, because the leftover is empty:

```
fatal: failed to read <clone>/.git/commondir: No such file or directory
```

Among the leftovers is `harness-runs/.mcp.json`, which **no profile entry names**. It is Claude Code's own `.mcp.json` denial in an `--add-dir` root: a `/dev/null` inside the sandbox, and a real file on disk after the kill. A settings change cannot prevent that one.

A real unattended run is killed this way: a stall watchdog kills and resumes, a session crashes, a host reboots. Each leftover is then a file a later trust check finds where none should be; ours refuses the repository until the leftovers are removed by hand.

### Claude Code's built-in protected paths

Claude Code mounts placeholders at its own protected paths in the session's cwd, and a killed session leaves some of them on disk. On 2026-10-30 (Claude Code 2.1.314, bubblewrap 0.8.0, the control above), with git working in `<clone>`, sandboxed `git status` there listed 21 untracked paths; our settings name none of them but `.mcp.json`:

```
.bash_profile .bashrc .claude/agents .claude/commands .claude/hooks .claude/launch.json .claude/loop.md .claude/output-styles .claude/routines .claude/scheduled_tasks.json .claude/skills .claude/workflows .gitconfig .gitmodules .idea .mcp.json .profile .ripgreprc .vscode .zprofile .zshrc
```

An excluded command and a plain shell after sessions that end normally listed none. After a session killed with `SIGKILL`, the plain shell's `git status` in `<clone>` listed untracked paths whose first ten are `.bash_profile .bashrc .claude/agents .claude/commands .claude/hooks .claude/launch.json .claude/loop.md .claude/output-styles .claude/routines .claude/scheduled_tasks.json`; our script cut the reading there, so the rest of that list, and the files' types and modes, are not measured yet.

### Concurrency

Two sessions at once, on the same profile, six short calls each: all twelve calls succeeded. The cross-process cleanup race #94008 describes was not reproduced in this one attempt, which does not rule it out.

### How to reproduce

The measurement script is in the `firu-daniel/autonomous-sdlc-harness` repository as `scripts/sandbox-absent-path-check.sh` (Linux only). It records, for every path a per-run profile's `denyWrite` yields — each exact entry, and every absent path each glob entry expands to against the directories present — plus the `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` of the clone and of a sibling clone (`SIB`, by default `<main>-sbx_sibling`, which the maintainer creates with `git clone --shared` before the probe starts) and the `.mcp.json` of each `--add-dir` root, what a plain shell sees before any session and after each phase, and in phases A and B what a sandboxed call and an excluded call see:

- `run` — phases before, A (one session), B (a second session), C (two sessions at once, six short calls each) and D (one session killed with `SIGKILL` mid-call, read 1 s and 10 s later);
- `after-teardown` — one more plain-shell reading after the run copy is torn down;
- `report` — writes the per-entry readings, mount namespaces, git results and session transcripts to one `report.md`;
- `sweep` — the harness's own leftover sweep over what D left; not needed to reproduce;
- `control-profile` — writes a copy of the per-run profile without its `.git` trio `Edit` rules; `run` and `report` with `P=` naming that copy and `SBX_ABSENT_OUT=` a fresh directory take the control under *An `Edit(...)` deny rule does the same*.

It runs while `bash scripts/sandbox-probe.sh run --leg headless-parity` holds a probe clone and its per-run profile: start that, then `bash scripts/sandbox-absent-path-check.sh run`, then `bash scripts/sandbox-absent-path-check.sh report`. The 2026-10-29 readings above were taken with a version of this script that ran before the `sweep` phase was added, the first 2026-10-30 readings with one that did not yet read a sibling or expand glob entries, and the two later 2026-10-30 sessions with one that did both but cut each `git status` reading short and had no `control-profile`, the control's copy being made by hand; all read the same phases.

### Asks

Each is stated as the behaviour we need, not as an implementation.

1. **A sandboxed process should see a denied absent path as absent, and be refused when it creates one.** A reader such as git must not find a file there. Today the denial that is meant to stop a `commondir` from appearing is what makes one appear, and git in the repository then fails on every sandboxed call.
2. **Nothing should be created on the real filesystem for a denied absent path.** Failing that, every placeholder should be removed by a cleanup that survives a killed process and is shared across processes. [#94008](https://github.com/anthropics/claude-code/issues/94008) reads the mechanism out of the 2.1.270 bundle — bubblewrap `creat()`s each placeholder on the real filesystem, and *"when [the in-flight counter] reaches zero the process unlinks every placeholder it knows about. There is no lock, no registry, and no refcount shared with any other `claude` process."* — and reports the cross-process race that follows from it. [#81602](https://github.com/anthropics/claude-code/issues/81602) (*"Sandbox filesystem protection leaves stray placeholder files / bind mounts in project working tree"*) and [#78072](https://github.com/anthropics/claude-code/issues/78072) (0-byte placeholders persisting in the cwd and `$HOME`) report placeholders left behind; the `SIGKILL` case above is one way to get there, and it includes Claude Code's own `.mcp.json` denial.
3. **Say what creates a `-rw-r--r--` empty file at a clone's `.git/config.worktree` at session start, and stop creating it.** It is not the `/dev/null` placeholder, it is not removed by the session's cleanup, and it survives every session. It appears whether or not any rule names the path: the 2026-10-30 control's profile named it by no `denyWrite` entry and no `Edit` rule (item 1 of *Two placeholders persist on the real filesystem*).
4. **Say whether `Edit(...)` deny rules are meant to apply to sandboxed commands, and if they are, treat an absent path as ask 1 does.** Today an `Edit` rule for an absent path mounts the same `/dev/null` placeholder a `denyWrite` entry does (*An `Edit(...)` deny rule does the same*), with the same git failure and the same leftovers after a kill.
5. **Treat the built-in protected paths in the cwd as ask 2 asks for the rest:** nothing left on the real filesystem after a killed session, or a cleanup that survives the kill (*Claude Code's built-in protected paths*).

As of 2026-10-29, none of #94008, #81602 or #78072 names a fixed version. #26722 and its re-report #79785 were filed for WSL2 and are closed; #79785 notes that inside the sandbox the placeholders are live mounts, so `rm` there fails with `Device or resource busy`.

---

## The harness's interim position

`docs/cli.md` §6 states the whole position; this is its one-line summary. On Linux, the run copy's three `.git` trust files — `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` — are named by no `denyWrite` entry and no `Edit` deny rule, exact or glob, and are refused at launch and by the wrappers rather than by the sandbox, an empty regular `config.worktree` and `http-alternates` accepted, while the base profile's glob entries and `Edit` rules for them are re-rooted at every other sibling clone by exact path; leftovers are swept before the first reader that a leftover breaks, the watcher's own start included; and one run per repository runs at a time.

What lets the harness drop each part:

- **The trio's omission from `denyWrite` and from the `Edit` rules** can be dropped when asks 1 and 4 land, on the Claude Code version that ships it: a denied absent trust file then neither appears to sandboxed git nor can be created by a sandboxed command.
- **The leftover sweep and the one-run cap** can be dropped when ask 2 lands: nothing is left on disk for a sweep to find, and no run's cleanup can unlink a placeholder another run's call is mounting.
