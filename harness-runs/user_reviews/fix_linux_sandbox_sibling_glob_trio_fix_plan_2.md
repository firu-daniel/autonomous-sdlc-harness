# User-Review Fix Plan: fix_linux_sandbox_sibling_glob_trio

## Context

**Branch:** `fix_linux_sandbox_sibling_glob_trio`
**Source user review:** `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_review_2.md`
**Summary:** The user re-took AP1–AP8 on round 1's head (`d764fb2b`, Claude Code 2.1.316) and ran the AP7 control after it. AP1–AP6 pass. AP8 shows that a sandboxed `dd` cannot land the run copy's `commondir` on disk, which disproves the premise round 1 rested on and leaves the file tools as an open route to the run copy's trio. The review asks for three things:
- a `PreToolUse` guard for `Edit|Write|NotebookEdit` that refuses the trio, with the round-1 claim corrected wherever it stands;
- four repairs to the check script;
- both sessions recorded.

All three were verified against the current tree, and all are valid. The guard and the claim correction are split into two findings, so there are four.

**Manual follow-up, not in this list.** An unattended run cannot write under `.claude/`, so the conventions sentences that Finding 1 makes untrue must be edited by hand once it lands:
- `.claude/context/conventions.md` → "it emits `allow` or nothing" and "Exactly one guard in the plugin may answer `deny`, `plugin/hooks/autonomous-protected-branch-guard.sh`". There will be two deny-capable guards, and the new one reads a file path rather than a command.
- `.claude/context/plugin.md` → the routing row "a `PreToolUse` decision about a Bash command". It now covers a file-tool decision too.
- `.claude/context/conventions.md` → `## The stack, in the words the rules below use` → "the only external binaries a guard may need are `git` and `jq`". It must name `readlink` as `git-trust-file-guard.sh`'s exception, for its symlinked-leaf branch only. Needed only if the user keeps `readlink` (see the third decision below).

After merge, these are re-taken by hand on the head this round produces: AP9, the guard's row, and AP1–AP6 (Finding 4).

**Decisions the user may want to revisit.**
- **Every session, not only adopted repositories.** The new guard applies in every session that loads the plugin, as the review states. That makes it the one guard outside the plugin's "no config, no opinion" jurisdiction rule.
- **No `jq` means every file-tool call is refused.** "Fails closed on input it cannot parse" is read to cover a missing `jq`, so in that case the guard refuses every file-tool call.
- **One extra binary.** The guard resolves a symlinked *leaf* with `readlink`, the one binary it uses beyond `git` and `jq`. The review asks for `..`, symlinked parents and a trailing `/`, which builtins cover. The symlinked leaf is this plan's own addition, because `Write` to `<repo>/innocent` → `.git/config.worktree` would otherwise pass. Of the architecture review's two options, this plan chose **(b), keep `readlink` as a user decision**, and added the conventions sentence it breaks to the manual follow-up above. Option (a), refusing any file-tool call whose target is an existing symbolic link, needs no extra binary. But it would refuse every edit to any symlinked file in every session that loads the plugin. If you prefer (a), say so at approval.
- **No top-level string filter.** The guard runs `jq` on every `Edit`, `Write` and `NotebookEdit` call, with no cheap string test first. That breaks the *A guard hook* row of `.claude/context/conventions.md` → `## What accompanies a new unit of each kind`. The reasons: a name filter would silence malformed input the review requires refused, and it would miss a symlinked leaf. The guard's header argues this, as `allow-qa-credentials-read.sh` argues its own exception, and `plugin/hooks/README.md` → `## Prerequisites` records it. Bash calls pay nothing for it.

Finding 1 records all four in `plugin/hooks/README.md`.

**Gates are not a unit's to run.** The user's constraint that `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass belongs to the Run gates phase. No finding runs them.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`.** `[ ]` markers anywhere else, including sub-step bullets inside the per-finding files, are informational only. They are never the iteration source, and the committer does not touch them.

Each entry resolves one-to-one to `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_fix_plan_2/finding_<K>.md` through its `**Finding K**` reference. The entries are in dependency order:
1. the guard;
2. the claim correction that cites it;
3. the script that measures it;
4. the record that names all three.

1. [x] **Finding 1** — Add `plugin/hooks/git-trust-file-guard.sh`, registered under `Edit|Write|NotebookEdit`. It refuses the trio and paths under it after normalisation, on every platform, and fails closed on input it cannot parse. Update `plugin/hooks/README.md`'s contract and add the new decision suite. _(layer: cli, plugin)_
2. [x] **Finding 2** — Correct round 1's "the sandboxed shell could already write" claim with AP8's reading in `writeProtection.ts`, both watcher copies, `docs/cli.md` residual 12 and §5 F9's follow-up cell. Name the new matcher in `ARCHITECTURE.md` and `docs/guard-verification.md`. _(layer: cli, general)_
3. [x] **Finding 3** — `scripts/sandbox-absent-path-check.sh`: one-line refusals for `report` and `after-teardown` with no run, the control copy written to `SBX_ABSENT_OUT` and picked up by `run`, `write-probe` naming *written* / *not on disk, the call reported success* / *refused*, and a new `hook-probe` (AP9), with the by-hand procedure updated. _(layer: general)_
4. [ ] **Finding 4** — Record the 2026-10-31 sessions in `docs/sandbox-verification.md` (AP1–AP6 `pass`, AP8 *not on disk; `dd` reported success*, the AP7 control, AP9 owed, the stamps, §0 and §6), in the upstream report, and in `docs/cli.md` residual 12's status sentences. _(layer: general)_

---

## Must Fix

### 1. The file tools can write a `commondir`, `config.worktree` or `http-alternates` with content into a Linux run copy: add a `PreToolUse` guard for `Edit|Write|NotebookEdit` that refuses them on every platform
→ [finding_1.md](fix_linux_sandbox_sibling_glob_trio_fix_plan_2/finding_1.md)

### 2. Round 1's claim that "the sandboxed shell could already write" the run copy's trio is disproved by AP8: correct it everywhere it stands, and document the new guard
→ [finding_2.md](fix_linux_sandbox_sibling_glob_trio_fix_plan_2/finding_2.md)

### 4. Record both 2026-10-31 sessions (AP1–AP8 on round 1's head, and the AP7 control) and bring the documents of record into line
→ [finding_4.md](fix_linux_sandbox_sibling_glob_trio_fix_plan_2/finding_4.md)

---

## Should Fix

### 3. The absent-path check script: `report` tracebacks with no run, the control copy lands in the wrong folder, `write-probe` calls a successful `dd` "refused", and the guard has no row
→ [finding_3.md](fix_linux_sandbox_sibling_glob_trio_fix_plan_2/finding_3.md)

---

## Out of scope / verified-OK

No observation is invalid. There is one nuance, and it is carried inside Finding 3 rather than listed here as invalid. The review says `control-profile` "writes `control-profile.json` into the default output folder whatever `SBX_ABSENT_OUT` says". The code already writes to `$O`, which follows `SBX_ABSENT_OUT` (`scripts/sandbox-absent-path-check.sh`, `O=${SBX_ABSENT_OUT:-${TMPDIR:-/tmp}/sbx-absent-path}`). The copy landed in the default folder because `docs/development.md` → *The control, AP7* runs `control-profile` without `SBX_ABSENT_OUT`. The fix the user asks for, which is to write the copy where the control runs and have `run` pick it up, is planned unchanged.

---

## Source observations

A verbatim copy of `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_review_2.md`. The review's three numbered items under *What this round changes* map to the findings as follows:
- item 1 → Findings 1 and 2;
- item 2 → Finding 3;
- item 3 → Finding 4.

This section stays in the index.

The owed re-take of AP1–AP8 was taken on round 1's head, `d764fb2b`, with the control (AP7) after it in the same container. On Linux, round 1 works: AP1–AP6 pass, and git, the trust check and the sweep all work in the run copy. But AP8 disproves the premise round 1 rested on, and dropping the clone's own trio `Edit` rules left a gap for the file tools. This round closes that gap without bringing back the placeholders, fixes three rough edges in the check script, and records both sessions.

> ⚠️ Find every anchor by its quoted text, heading or function name, never by line number.

## The two sessions (2026-10-31)

Both sessions were taken in Gate 15's container (`docs/development.md` → *A Linux run, in a local container*), set up as before:
- Docker `node:22-bookworm` on colima, an Ubuntu 24.04 VM, aarch64, kernel 6.8.0-117, `kernel.apparmor_restrict_unprivileged_userns` set to `0`.
- **Claude Code 2.1.316.** The 2026-10-30 sessions ran 2.1.314.
- bubblewrap 0.8.0, git 2.39.5.
- The checkout was cloned from this branch, with a local `dev` pointed at it (`git checkout -B dev`), as `docs/development.md` → *The absent-path check, by hand* now states.
- The sibling was made with `git clone --shared . ../autonomous-sdlc-harness-sbx_sibling` before the probe started.

The stamp both reports carry, verbatim:

```
main head: d764fb2b411ba50e0ec4aef0828cc6e7c4567483
git: git version 2.39.5
claude: 2.1.316 (Claude Code)
bwrap: bubblewrap 0.8.0
uname: Linux f87e7743034f 6.8.0-117-generic #117-Ubuntu SMP PREEMPT_DYNAMIC Thu May  7 17:26:37 UTC 2026 aarch64 GNU/Linux
apparmor_restrict_unprivileged_userns: 0
```

### Session 1, the re-take

`date: 2026-10-31T08:07:43+00:00`, probe clone `chore_sbx_probe_20261031080639`. The steps were `run`, `write-probe`, `sweep`, `report`, `after-teardown`, `report`.

- **The rendered per-run profile.** No `permissions.deny` rule names the clone's `.git/commondir`, `.git/config.worktree` or `.git/objects/info/http-alternates`. The six trio rules left are the sibling's exact ones, each in both forms: `Edit(//<sibling>/.git/commondir)` and `Edit(//<sibling>/.git/commondir/**)`, and the same for `config.worktree` and `objects/info/http-alternates`. `permissions.allow` holds `Edit(//<main>/**)` and `Edit(//<main>-*/**)`.
- **AP1 — pass.**
  - Sandboxed `git status` in the clone exits 0 in A and B: `A-sandboxed: <clone> exit 0: ## chore_sbx_probe_20261031080639 ?? .bash_profile ?? .bashrc ?? .claude/agents … ?? .zshrc`.
  - The excluded call exits 0 in the clone: `A-excluded: <clone> exit 0: ## chore_sbx_probe_20261031080639`.
  - In `<main>`: `A-sandboxed: <main> exit 0: ## dev ?? .mcp.json ?? harness-runs/.mcp.json`.
  - Every outside reading, from `before` to `after-sweep`, exits 0.
- **AP2 — pass.**
  - `<clone>/.git/commondir` and `<clone>/.git/objects/info/http-alternates` read `absent` in every phase, inside and outside: A and B sandboxed and excluded, and after A, B, C, `D-kill`, `D-10s`, `sweep` and `teardown`.
  - `<clone>/.git/config.worktree` reads `outside before: absent`. From `outside after-A` on it reads `regular empty file, 0 B, -rw-r--r--, probe, mtime 2026-10-31 08:07:44.690167084 +0000`, the same through `after-sweep`. Inside the sandbox: `A-sandboxed: … ; mount: <clone>/.git/config.worktree (overlay, ro,nosuid,nodev,relatime)`.
- **AP3 — pass.**
  - `sweep | exit 0`. It removed `<main>/.mcp.json`, `<main>/.claude/settings.local.json`, `<main>/scripts/.git`, `<clone>/.mcp.json`, `<clone>/.claude/settings.local.json`, `<clone>/.git/hooks` and `<main>/harness-runs/.mcp.json`.
  - `hr_wrapper_main_of | exit 0 | <main>`.
  - `hr_run_copy_check_var | exit 0`.
  - `git status (clone) | exit 0 | ## chore_sbx_probe_20261031080639 ?? .bash_profile ?? .bashrc ?? .claude/agents ?? .claude/commands ?? .claude/hooks ?? .claude/launch.json ?? .claude/loop.md ?? .claude/output-styles ?? .claude/routines ?? .claude/scheduled_tasks.json ?? .claude/skills ?? .claude/workflows ?? .gitconfig ?? .gitmodules ?? .idea ?? .profile ?? .ripgreprc ?? .vscode ?? .zprofile ?? .zshrc`.
  - `git status (sibling) | exit 0 | ## dev...origin/dev`.
- **AP4 — pass.** `<main>/harness-runs/.mcp.json` read `outside after-D-kill: regular empty file, 0 B, -r--r--r--, probe, mtime 2026-10-31 08:08:48.576957727 +0000`. The sweep printed `removed`, and `after-sweep` read `absent`.
- **AP5 — pass.**
  - Each of `<main>/.mcp.json`, `<main>/.claude/settings.local.json`, `<main>/scripts/.git`, `<clone>/.mcp.json`, `<clone>/.claude/settings.local.json`, `<clone>/.git/hooks` and `<main>/harness-runs/.mcp.json` reads `character special file, 0 B, crw-rw-rw-, nobody; mount: /null (tmpfs, ro,nosuid,nodev)` in `A-sandboxed` and `B-sandboxed`, and `absent` in the excluded calls.
  - After D, each is `regular empty file, 0 B, -r--r--r--, probe`, and the sweep removed each.
- **AP6 — pass, against round 1's rewritten expectation.**
  - The sibling's `.git/commondir`, `.git/config.worktree`, `.git/objects/info/http-alternates`, `.mcp.json` and `.claude/settings.local.json` read `absent` in every phase, inside and outside.
  - Its existing entries carry no mount line inside the sandbox, for example `<sibling>/.git/config | A-sandboxed: regular file, 256 B, -rw-r--r--, probe`.
  - `git status (sibling)` reads `exit 0: ## dev...origin/dev` throughout.
- **AP8, the `dd` row — the file never reached the disk, although `dd` reported success.**
  - `before | absent | <clone>/.git/commondir`.
  - `session W dd call: dd if=/dev/null of=<clone>/.git/commondir conv=notrunc`.
  - `session W dd result: 0+0 records in / 0+0 records out / 0 bytes copied, 1.6875e-05 s, 0.0 kB/s`.
  - `dd call | in the stream after 6 s` · `plain shell | absent through 21 s of polling` · `session | exit 0` · `verdict | refused`.
  - So a sandboxed shell **cannot** land the file on disk, yet `dd` saw no error. Where the write went is unmeasured. Record it as observed, and don't guess at the mechanism.
- **The built-in leftovers.**
  - Each of the 21 paths reads `A-sandboxed: character special file, 0 B, crw-rw-rw-, nobody; mount: /null (tmpfs, ro,nosuid,nodev)` at the clone's root. The paths are `.bash_profile .bashrc .claude/agents .claude/commands .claude/hooks .claude/launch.json .claude/loop.md .claude/output-styles .claude/routines .claude/scheduled_tasks.json .claude/skills .claude/workflows .gitconfig .gitmodules .idea .mcp.json .profile .ripgreprc .vscode .zprofile .zshrc`.
  - After the kill, each is a `regular empty file, 0 B, -r--r--r--, probe`, for example `<clone>/.bash_profile | outside after-D-kill: regular empty file, 0 B, -r--r--r--, probe, mtime 2026-10-31 08:08:48.581957721 +0000`.
  - `sweep` leaves all of them except `.mcp.json`, which the manifest records. That matches round 1's decision to accept them. They read `absent` at `after-teardown` only because the clone itself is removed.
- **Mount namespaces.** The plain shell and the excluded calls are in `mnt:[4026532439]`; the sandboxed calls are in `mnt:[4026532509]`.

### Session 2, the control (AP7)

`date: 2026-10-31T08:21:52+00:00`, probe clone `chore_sbx_probe_20261031082100`, `profile: /tmp/sbx-absent-path/control-profile.json`. Steps: `control-profile`, then `run` and `report` with `SBX_ABSENT_OUT=/tmp/sbx-absent-path-control`, and no `sweep`.

- **The profile change.** `control-profile` removed the six remaining trio `Edit` rules, the sibling's (98 → 92 `permissions.deny` entries), and left `0`. The copy is session 2's own profile, which names `chore_sbx_probe_20261031082100`.
- **The readings, identical to session 1's.**
  - The clone's `commondir` and `http-alternates` read `absent` in every phase.
  - `config.worktree` reads `outside after-A: regular empty file, 0 B, -rw-r--r--, probe, mtime 2026-10-31 08:21:53.049350808 +0000`, mounted `(overlay, ro,nosuid,nodev,relatime)` over itself inside the sandbox.
  - Sandboxed and outside `git status` exit 0 in the clone in every phase, with the same 21 untracked built-ins from A on. `<main>` lists `## dev ?? .mcp.json ?? harness-runs/.mcp.json`, and `<sibling>` lists `## dev...origin/dev`.
  - Both reports hold the same 56 `mount: /null` readings.
  - The sibling's paths read `absent` throughout.
- **Conclusion.** On Linux, the sibling's exact `Edit` rules mount nothing and change nothing, because the sibling sits outside every write root. `config.worktree` appears with no rule naming it, on 2.1.316 as on 2.1.314.
- **The first attempt.** It wrote nothing: its `run` stopped before creating `/tmp/sbx-absent-path-control`, and `report` then failed with `FileNotFoundError: [Errno 2] No such file or directory: '/tmp/sbx-absent-path-control/report.md'`. The cause was the command as typed, not the script. Record only the successful attempt; item 2 covers the script's error handling.

## What this round changes

1. **A guard hook for the file tools on the run copy's trio. The `Edit` rules stay as round 1 left them.**
   - **The gap.** Round 1 dropped the clone's own trio `Edit` rules on a bubblewrap host, reasoning that the sandboxed shell could already write those paths. AP8 disproves that: the shell cannot land the file. The file tools (`Edit`, `Write`, `NotebookEdit`) are governed by permission rules, not by the bubblewrap sandbox. With `Edit(//<work_root>/<project>-*/**)` allowed and no deny rule, a session can now `Write` a `commondir` **with content** into its own run copy. The wrappers and the launch check refuse such a clone, but a person who later runs git in that folder would follow it.
   - **Why not restore the rules.** On Linux an `Edit` deny rule for an absent path mounts the `/null` placeholder, and that breaks git in the run copy. That is measured: the 2026-10-30 sessions 1 and 2, §5 AP1, AP2 and AP7.
   - **The change.** Add a `PreToolUse` hook to `plugin/hooks/hooks.json` with matcher `Edit|Write|NotebookEdit`, and a new `plugin/hooks/<kebab-case>.sh`. It refuses a call whose target path, after normalisation (`..`, symlinked parents, a trailing `/`), ends in `.git/commondir`, `.git/config.worktree` or `.git/objects/info/http-alternates`, or lies under one of them.
     - It applies on every platform and in every session that loads the plugin. On macOS it duplicates the kept `Edit` rules, which is harmless.
     - It fails closed on input it cannot parse.
     - Its refusal message names the path and the reason.
     - It creates no sandbox mount, so AP1–AP3 keep passing.
   - **What stays.**
     - On a bubblewrap host, the clone's own trio `Edit` rules stay dropped.
     - The sibling trio `Edit` rules stay by exact path.
     - macOS keeps every rule.
     - `.git/config`, `.git/hooks` and `.git/objects/info/alternates` keep their `Edit` rules on every platform.
   - **Docs.** Correct round 1's claim wherever it stands: `docs/cli.md` §6 residual 12, `docs/sandbox-verification.md` §5 F9's follow-up cell, and any comment in `autonomous-watcher.sh` → `run_profile_edit_drops` or `writeProtection.ts` that says the shell can already write those paths. Say what AP8 measured and that the hook closes the file tools' route.
   - **Tests.** Fixtures cover `Edit`, `Write` and `NotebookEdit` on each of the three paths, plus a path under each and a `..`/symlink form, all refused. A neighbouring path such as `.git/config.worktree.bak` or `commondir` outside `.git` is allowed. Malformed hook input is refused. Follow the existing hook tests' style.

2. **The check script, `scripts/sandbox-absent-path-check.sh`.**
   - **`report` with no run under its folder** exits with a one-line message naming the folder and telling the user to run `run` first, not a Python traceback. Check the other verbs that read `$O` for the same thing.
   - **`control-profile` honours `SBX_ABSENT_OUT`.** Today it writes `control-profile.json` into the default output folder whatever `SBX_ABSENT_OUT` says. When `SBX_ABSENT_OUT` is set it writes there instead, so `run` can find the copy without a hand-copied path. Better still, `run` picks it up when `P` is unset and the file is there. The procedure in `docs/development.md` and §5 then needs no `<the path control-profile printed>` placeholder.
   - **`write-probe` names what it measured.** "Refused" is wrong when `dd` exited 0 and the file simply never reached the disk. Name the outcome as one of: *written* (on disk), *not on disk, the call reported success*, or *refused* (the call errored), with the call's exit status and stderr. Grade AP8 on the disk outcome.
   - **A new row for the hook.** Owed for the re-take: a session's `Write` to `<clone>/.git/commondir` is refused by the hook, and the plain shell finds the file absent. Give it the next AP number, and add it to the script if a headless session can drive it, or else to the by-hand procedure.

3. **Record both sessions** in `docs/sandbox-verification.md`, in the record's own style, with `<main>`, `<clone>` and `<sibling>` and no machine paths but the stamp's.
   - **§5 *Owed on the round's head*.** Fill AP1–AP8 with session 1's readings and verdicts as quoted above: AP1–AP6 pass, and AP8 reads *not on disk; `dd` reported success*. Add AP7 with session 2's readings and the conclusion above. Keep the 2026-10-30 records as they stand.
   - **The stamps.** Use the lines above, with each session's `date:`, clone and, for AP7, `profile:` line. Record the Claude Code version change from 2.1.314 to 2.1.316, and the local `dev` pointed at the branch's head.
   - **The built-in leftovers (§6).** Measured again on 2.1.316: the same 21 paths, 0-byte and read-only after a kill, left by the sweep, git unaffected.
   - **§0 *Why `config.worktree` differed: unknown*.** Add one sentence: on 2.1.316 too, with no rule naming it (AP7, 2026-10-31).
   - **`docs/sandbox-placeholder-upstream-report.md`.** Add the 2.1.316 observations and AP8's `dd` result.
   - **What is owed after this round.** The hook's row from item 2, re-taken by hand on the head this round produces, before merge. AP1–AP6 again on that head, to show the hook changes no placeholder.

## Constraints

- **No measured result is invented.** A Linux claim not measured above is labelled *derived* or *owed*. Nothing explains AP8's mechanism.
- **macOS's behaviour is unchanged** apart from the new hook, which only refuses what macOS's kept deny rules already refuse.
- **The trust checks are not changed.**
- Bash 3.2 floor. `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.
