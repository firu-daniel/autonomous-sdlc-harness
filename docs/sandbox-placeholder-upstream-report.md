# The upstream report: Linux sandbox placeholders for denied absent paths

**Who reads this:** the maintainer filing this report on anthropics/claude-code, and anyone checking whether a later Claude Code version lifts the harness's Linux interim position. It is a **draft to file, not a filed issue**: until an issue number is recorded here, nothing upstream has been asked. The interim position it would lift is `docs/cli.md` §6's. It owns the report's text and the three asks; the measurements it quotes are recorded in `docs/sandbox-verification.md` (§0 *The probe's first Linux run (2026-10-29)*, §0 *The targeted check (2026-10-29)*, §5 F9, §5 AP2 and §8 GW1 and GW2), and that document stays their record.

Everything from `## Report` to the end of `### Asks` is written to be pasted as is. `<clone>` is the run copy, a `git clone --shared` of the main checkout, and `<main>` is the main checkout; both stand in for absolute paths under the container user's home directory.

---

## Report

### Title

Linux sandbox: a `denyWrite` entry for an absent path mounts `/dev/null` there, breaks git, and leaves files on disk after a killed session

### Environment

- Claude Code `2.1.312 (Claude Code)`
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

**Re-taken on 2026-10-30**, on Claude Code 2.1.314, the same `bubblewrap 0.8.0` and the same container shape. By then we had stopped listing the clone's `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` exactly, because of the git failure below, so that run's per-run profile named them by no exact `denyWrite` entry. It named them only by three glob entries that `<clone>` matches: `<home>/autonomous-sdlc-harness-*/.git/commondir`, `<home>/autonomous-sdlc-harness-*/.git/config.worktree` and `<home>/autonomous-sdlc-harness-*/.git/objects/info/http-alternates`, where `<home>` is the container user's home directory. What it read is under *A glob entry does the same* and item 1 of *Two placeholders persist on the real filesystem*.

### What a `denyWrite` entry for an absent path does inside a call

Inside every sandboxed Bash call, each absent denied path exists and is `/dev/null`. `ls -la` and `/proc/self/mountinfo` from a sandboxed call:

```
crw-rw-rw- 1 nobody nogroup 1, 3 … <clone>/.git/commondir
444 423 0:57 /null <clone>/.git/commondir ro,nosuid,nodev - tmpfs …
```

The same holds for every absent entry in both checkouts: `character special file, 0 B, nobody`, mounted from `/null (tmpfs, ro,nosuid,nodev)`. Outside the sandbox, after a session that ends normally, they are absent again: the session's own cleanup removed them.

### A glob entry does the same

A `denyWrite` entry containing `*` is expanded against the directories that exist when the sandbox starts, and each absent path it yields gets the same `/dev/null` placeholder.

- **2026-10-30, Claude Code 2.1.314** (the re-take above). `<clone>/.git/commondir` and `<clone>/.git/objects/info/http-alternates`, named only by the glob entries, read inside the sandbox in both sessions as `character special file, 0 B, crw-rw-rw-, nobody`, `mount: /null (tmpfs, ro,nosuid,nodev)`. An excluded command read both `absent`. After the session killed with `SIGKILL` (item 2 below), both were left on disk as `regular empty file, 0 B, -r--r--r--, probe, mtime 2026-10-30 11:03:21.977825991 +0000`. Sandboxed git in `<clone>` failed as described under *The git failure*.
- **2026-10-29, Claude Code 2.1.312**, on a scratch profile without the clone's exact entries. `<clone>/.mcp.json` was absent when the session started and was covered only by `<home>/autonomous-sdlc-harness-*/.mcp.json`. A sandboxed `dd` onto it failed with `dd: failed to open '<clone>/.mcp.json': Permission denied`, which is the placeholder.
- **The same 2026-10-29 run, a path under an existing directory.** `<clone>/githooks` existed when the session started and was covered only by `<home>/autonomous-sdlc-harness-*/githooks`. A sandboxed write of a new file under it, `<clone>/githooks/sbx_gw1_new`, succeeded: the open for writing was not refused.

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

The 2026-10-30 re-take found it again, on a profile that named it only by the glob entry `<home>/autonomous-sdlc-harness-*/.git/config.worktree`. It read `absent` at `outside before`, the reading taken just before session A launches. From `after-A` through `after-sweep` it read `regular empty file, 0 B, -rw-r--r--, probe, mtime 2026-10-30 11:02:14.302377664 +0000`, an mtime earlier than session A's first assistant message (`2026-10-30T11:02:18.439Z`). Inside the sandbox it was again mounted over itself: `mount: <clone>/.git/config.worktree (overlay, ro,nosuid,nodev,relatime)`.

**2. Every absent placeholder, after a session killed with `SIGKILL` mid-call.** One session was killed with `SIGKILL` in the middle of a Bash call, and the paths were read from a plain shell 1 s and 10 s later. Every other absent entry was left on disk as a `-r--r--r-- probe 0 B` real file. The three in `<main>` were still there after the run copy was torn down. git then fails in `<clone>` even outside the sandbox, because the leftover is empty:

```
fatal: failed to read <clone>/.git/commondir: No such file or directory
```

Among the leftovers is `harness-runs/.mcp.json`, which **no profile entry names**. It is Claude Code's own `.mcp.json` denial in an `--add-dir` root: a `/dev/null` inside the sandbox, and a real file on disk after the kill. A settings change cannot prevent that one.

A real unattended run is killed this way: a stall watchdog kills and resumes, a session crashes, a host reboots. Each leftover is then a file a later trust check finds where none should be; ours refuses the repository until the leftovers are removed by hand.

### Concurrency

Two sessions at once, on the same profile, six short calls each: all twelve calls succeeded. The cross-process cleanup race #94008 describes was not reproduced in this one attempt, which does not rule it out.

### How to reproduce

The measurement script is in the `firu-daniel/autonomous-sdlc-harness` repository as `scripts/sandbox-absent-path-check.sh` (Linux only). It records, for every path a per-run profile's `denyWrite` yields — each exact entry, and every absent path each glob entry expands to against the directories present — plus the `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` of the clone and of a sibling clone (`SIB`, by default `<main>-sbx_sibling`, which the maintainer creates with `git clone --shared` before the probe starts) and the `.mcp.json` of each `--add-dir` root, what a plain shell sees before any session and after each phase, and in phases A and B what a sandboxed call and an excluded call see:

- `run` — phases before, A (one session), B (a second session), C (two sessions at once, six short calls each) and D (one session killed with `SIGKILL` mid-call, read 1 s and 10 s later);
- `after-teardown` — one more plain-shell reading after the run copy is torn down;
- `report` — writes the per-entry readings, mount namespaces, git results and session transcripts to one `report.md`;
- `sweep` — the harness's own leftover sweep over what D left; not needed to reproduce.

It runs while `bash scripts/sandbox-probe.sh run --leg headless-parity` holds a probe clone and its per-run profile: start that, then `bash scripts/sandbox-absent-path-check.sh run`, then `bash scripts/sandbox-absent-path-check.sh report`. The 2026-10-29 readings above were taken with a version of this script that ran before the `sweep` phase was added, and the 2026-10-30 readings with one that did not yet read a sibling or expand glob entries; both read the same phases.

### Asks

Each is stated as the behaviour we need, not as an implementation.

1. **A sandboxed process should see a denied absent path as absent, and be refused when it creates one.** A reader such as git must not find a file there. Today the entry that is meant to stop a `commondir` from appearing is what makes one appear, and git in the repository then fails on every sandboxed call.
2. **Nothing should be created on the real filesystem for a denied absent path.** Failing that, every placeholder should be removed by a cleanup that survives a killed process and is shared across processes. [#94008](https://github.com/anthropics/claude-code/issues/94008) reads the mechanism out of the 2.1.270 bundle — bubblewrap `creat()`s each placeholder on the real filesystem, and *"when [the in-flight counter] reaches zero the process unlinks every placeholder it knows about. There is no lock, no registry, and no refcount shared with any other `claude` process."* — and reports the cross-process race that follows from it. [#81602](https://github.com/anthropics/claude-code/issues/81602) (*"Sandbox filesystem protection leaves stray placeholder files / bind mounts in project working tree"*) and [#78072](https://github.com/anthropics/claude-code/issues/78072) (0-byte placeholders persisting in the cwd and `$HOME`) report placeholders left behind; the `SIGKILL` case above is one way to get there, and it includes Claude Code's own `.mcp.json` denial.
3. **Say what creates a `-rw-r--r--` empty file at a `.git/config.worktree` a `denyWrite` entry names, exact or glob, at session start, and stop creating it.** It is not the `/dev/null` placeholder, it is not removed by the session's cleanup, and it survives every session. A control run whose profile names that path by no entry is owed on our side; until it is taken, we cannot say whether the entry plays any part.

As of 2026-10-29, none of #94008, #81602 or #78072 names a fixed version. #26722 and its re-report #79785 were filed for WSL2 and are closed; #79785 notes that inside the sandbox the placeholders are live mounts, so `rm` there fails with `Device or resource busy`.

---

## The harness's interim position

`docs/cli.md` §6 states the whole position; this is its one-line summary. On Linux, the run copy's three `.git` trust files — `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` — are named by no `denyWrite` entry, exact or glob, and are refused at launch and by the wrappers rather than by the sandbox, while the base profile's glob entries for them are re-rooted at every other sibling clone by exact path; leftovers are swept before the first reader that a leftover breaks, the watcher's own start included; and one run per repository runs at a time.

What lets the harness drop each part:

- **The trio's omission from `denyWrite`** can be dropped when ask 1 lands, on the Claude Code version that ships it: a denied absent trust file then neither appears to sandboxed git nor can be created by a sandboxed command.
- **The leftover sweep and the one-run cap** can be dropped when ask 2 lands: nothing is left on disk for a sweep to find, and no run's cleanup can unlink a placeholder another run's call is mounting.
