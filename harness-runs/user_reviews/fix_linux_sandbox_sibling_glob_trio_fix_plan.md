# User-Review Fix Plan: fix_linux_sandbox_sibling_glob_trio

## Context

**Branch:** `fix_linux_sandbox_sibling_glob_trio`
**Source user review:** `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_review.md`
**Summary:** The user took the owed AP1–AP6 re-take on this branch's head in Gate 15's container, plus a control run. The branch's `denyWrite` change is in effect but not enough. On Linux, Claude Code also enforces `Edit` deny rules in the sandbox, so the run copy's own trio `Edit` rules still mount placeholders. In addition, a `config.worktree` that Claude Code creates at every session start makes the trust check refuse the clone. The review asks for six changes: drop the run copy's trio `Edit` rules on bubblewrap, keep them at each sibling by exact path, accept an empty regular `config.worktree` / `http-alternates` in the trust check, settle the built-in leftovers, extend the check script, and record both sessions. All six were verified against the current tree, and all six are valid.

**Manual follow-up, not in this list.** An unattended run cannot write under a `.claude/` directory. So the notes-app rendering `examples/notes-app/.claude/settings.autonomous.json` must be re-rendered by hand after Finding 1 changes the `_README` strings, as this branch's story plan already records under **Manual setup required**. AP1–AP7 plus the `dd` row are re-taken by hand on the head this round produces, before merge (Finding 6).

**Gates are not a unit's to run.** The user's constraint quoted under `## Source observations`, that `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass, belongs to the Run gates phase. No finding runs them; each unit runs only the test files its own finding names.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker to `[x]`.** `[ ]` markers anywhere else, such as sub-step bullets inside the per-finding files, are informational only. They are never the iteration source, and the committer does not touch them.

Each entry resolves 1:1 to `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_fix_plan/finding_<K>.md` through its `**Finding K**` reference. The entries are in dependency order: the profile change first, its sibling guarantee next, then the trust check, the documented acceptance, the measuring script, and last the record that names all of them.

1. [x] **Finding 1** — On a bubblewrap host, leave the run copy's own trio `Edit` rules out of the per-run copy, the exact ones and the base's glob ones, and teach `run_profile_check` that drop. _(layer: cli, general)_
2. [x] **Finding 2** — Keep each other sibling's trio `Edit` rules by exact path, both forms, pin them with a test, and state the treatment and its residual in `docs/cli.md` §6 and `docs/watcher.md`. _(layer: cli, general)_
3. [x] **Finding 3** — Make the clone trust check accept an empty, regular, non-link `config.worktree` (with `extensions.worktreeConfig` off) and `http-alternates`, keep refusing any `commondir`, and add fixtures for each arm. _(layer: cli, general)_
4. [ ] **Finding 4** — Accept Claude Code's built-in placeholder leftovers and document them in `docs/cli.md` §6. The list is not readable at launch, so the sweep does not cover them. _(layer: general)_
5. [ ] **Finding 5** — `scripts/sandbox-absent-path-check.sh`: read the built-in paths, stop truncating, add the `dd` write probe and a documented control-profile option. _(layer: general)_
6. [ ] **Finding 6** — Record session 1 (AP1–AP6) and the control (AP7) in `docs/sandbox-verification.md`, and update the decision rule, F9, §0, §6, the upstream report and `docs/development.md`. _(layer: general)_

---

## Must Fix

### 1. On a bubblewrap host the per-run copy still carries the run copy's own trio `Edit` rules, and on Linux they mount the placeholders that break git
→ [finding_1.md](fix_linux_sandbox_sibling_glob_trio_fix_plan/finding_1.md)

### 2. Other sibling run copies must keep their trio `Edit` protection, by exact path, once the base's glob `Edit` rules are dropped
→ [finding_2.md](fix_linux_sandbox_sibling_glob_trio_fix_plan/finding_2.md)

### 3. The clone trust check refuses the empty `config.worktree` Claude Code creates at every session start, so a Linux run copy is refused from its first session
→ [finding_3.md](fix_linux_sandbox_sibling_glob_trio_fix_plan/finding_3.md)

### 6. Record both 2026-10-30 sessions, the re-take and the control, and bring every record that depends on them into line
→ [finding_6.md](fix_linux_sandbox_sibling_glob_trio_fix_plan/finding_6.md)

---

## Should Fix

### 4. Claude Code's built-in protected-path placeholders can be left in a run copy after a killed session, and nothing records or states them
→ [finding_4.md](fix_linux_sandbox_sibling_glob_trio_fix_plan/finding_4.md)

### 5. The absent-path check cannot take what the owed re-take needs: it truncates its `git status` readings, reads none of Claude Code's built-in paths, has no `dd` row and no control mode
→ [finding_5.md](fix_linux_sandbox_sibling_glob_trio_fix_plan/finding_5.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK

None. All six observations were verified against the current working tree and are valid. Two points of verification the user may want to check:

- **Item 2's sibling `Edit` rules already exist in the code.** `run_profile_entries` emits each sibling trio path as `entry deny`, and `run_profile_render` gives each such line both `Edit` forms, which matches session 1's "the sibling's exact paths" among the 18 rules. Finding 2 therefore guarantees, tests and documents them rather than adding them.
- **Item 4's decision falls to *accept*.** The plan writer's attempt to read the installed Claude Code bundle, outside this checkout, was refused by the session's permission layer. The repository holds no copy of the list, and an unattended run has no web access. So the list is neither readable at launch nor derivable without guessing (finding_4.md).

---

## Source observations

Verbatim copy of `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_review.md`, so this fix plan is self-contained: the implement flow does not re-read the user-review file. Items 1–6 under *What this round changes* are Findings 1–6.

The owed re-take of AP1–AP6 was taken on this branch's head, and a control run followed in the same container. The branch's `denyWrite` change is in effect but is not enough: AP1–AP3 still fail. The control identifies the cause. This round makes the Linux run copy usable and records both sessions.

> ⚠️ Find every anchor by its quoted text, heading or function name, never by line number.

## The two sessions (2026-10-30)

Both were taken in Gate 15's container (`docs/development.md` → *A Linux run, in a local container*).

- **Container.** Docker container `node:22-bookworm` on colima, Ubuntu 24.04 VM, aarch64, kernel 6.8.0-117, `kernel.apparmor_restrict_unprivileged_userns` set to `0`.
- **Versions.** Claude Code **2.1.314**, bubblewrap 0.8.0, git 2.39.5.
- **The checkout.** The container's main checkout was cloned from this branch, and a local `dev` was then pointed at it (`git checkout -B dev`), so preflight refusal 3 passed. Its `main head` stamp therefore reads `b15f8de0ce66dd7833e07eee4857cfbc5110f143`, this branch's head. The probe clone itself was cut from `origin/dev`, as `create-worktree.sh` always does.
- **The sibling.** `git clone --shared . ../autonomous-sdlc-harness-sbx_sibling`, made before the probe started.

**Session 1, the re-take.** Started 16:13:56 UTC, probe clone `chore_sbx_probe_20261030161257`. The procedure was `docs/development.md` → *The absent-path check, by hand*, in full: `run`, `sweep`, `report`, `after-teardown`, `report`.

- **The rendered per-run profile.** Its `sandbox.filesystem.denyWrite` names the clone's `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` by **no** entry, neither exact nor glob. It names the sibling's three by exact path. Its `permissions.deny` still holds 18 `Edit` rules for the three files:
  - the clone's exact paths;
  - the `/home/probe/autonomous-sdlc-harness-*/.git/…` globs;
  - the sibling's exact paths;
  - each of these in both the `<p>` and `<p>/**` forms.
- **AP1 — fail.**
  - Sandboxed `git status` in the clone exits 128 in A and B: `fatal: failed to read <clone>/.git/commondir: Permission denied`.
  - Sandboxed `git status` in the main checkout exits 0 and lists `?? .mcp.json ?? harness-runs/.mcp.json`.
  - The excluded call's `git status` exits 0 in the clone.
- **AP2 — fail.**
  - Inside A and B, the clone's `commondir` and `http-alternates` read `character special file, 0 B, crw-rw-rw-, nobody; mount: /null (tmpfs, ro,nosuid,nodev)`.
  - Outside, both are absent after A, B and C. After the killed session D, both are `regular empty file, 0 B, -r--r--r--, probe` (mtime 16:15:03.203).
  - The clone's `config.worktree` is a **real** `regular empty file, 0 B, -rw-r--r--, probe`, mtime 16:13:57.196, at session A's start. It is present from after-A to the end. Inside the sandbox it is mounted read-only over itself (`overlay, ro,nosuid,nodev,relatime`).
- **AP3 — fail.**
  - **What the sweep did.** `sweep` exits 0 and removed the seven paths its manifest recorded: `<main>/.mcp.json`, `<main>/.claude/settings.local.json`, `<main>/scripts/.git`, `<clone>/.mcp.json`, `<clone>/.claude/settings.local.json`, `<clone>/.git/hooks` and `<main>/harness-runs/.mcp.json`.
  - **The checks after it.** `hr_wrapper_main_of` exits 0. `hr_run_copy_check_var` exits 1: `'<clone>' is a clone, but <clone>/.git/commondir exists, and a clone the harness made has none`.
  - **What was left.** `git status (clone)` exits 128, while `git status (sibling)` exits 0. The clone's `commondir` and `http-alternates` leftovers were in no manifest and survived the sweep.
- **AP4 — pass.** `<main>/harness-runs/.mcp.json` was left after D and removed by the sweep.
- **AP5 — pass.** All seven other absent entries read as the `/null` placeholder in A-sandboxed and B-sandboxed.
- **AP6 — differs from its expectation.** No placeholder appeared at any of the sibling's paths:
  - its absent `commondir`, `config.worktree` and `http-alternates`, despite their exact `denyWrite` entries;
  - its `.mcp.json` and `.claude/settings.local.json`.

  Each read `absent` inside A and B and outside after every phase, the sweep and the teardown included. `git status (sibling)` exits 0 throughout.

  The sibling sits outside every write root of the session. The roots are the cwd (the clone) and `allowWrite`, which holds `<main>/harness-runs` only. Derived from this: on Linux a deny entry outside every write root gets no placeholder, because the path is read-only in the sandbox anyway. The expectation needs rewriting accordingly.

**Session 2, the control.** Started 16:29:59 UTC, probe clone `chore_sbx_probe_20261030162536`.

- **The profile.** A copy of that session's per-run profile with every `permissions.deny` entry matching `\.git/(commondir|config\.worktree|objects/info/http-alternates)` removed, 18 entries. Nothing else changed; the sibling's three exact `denyWrite` entries stayed.
- **How it was run.** `SBX_ABSENT_OUT=/tmp/sbx-absent-path-control P=/tmp/control-profile.json bash scripts/sandbox-absent-path-check.sh run`, then `report`. No `sweep`.
- **The clone's `commondir` and `http-alternates`.** Absent in A-sandboxed, B-sandboxed and both excluded readings, and outside after every phase, after D's kill included.
- **`git status` in the clone.** Sandboxed, it exits 0 in A and B, and outside it exits 0 after every phase.
- **The clone's `config.worktree`.** It appeared again as a real `regular empty file, 0 B, -rw-r--r--, probe` at session A's start (mtime 16:30:00.698) and stayed. Inside the sandbox it was mounted read-only over itself.
- **The other entries.** They read as before: the placeholders for the main checkout's and the clone's other absent entries, nothing at the sibling.
- **Claude Code's built-in protected paths, new.** With git now working in the clone, sandboxed `git status` there (A and B) lists 21 untracked paths that exist outside no profile entry:

  ```
  .bash_profile .bashrc .claude/agents .claude/commands .claude/hooks .claude/launch.json .claude/loop.md .claude/output-styles .claude/routines .claude/scheduled_tasks.json .claude/skills .claude/workflows .gitconfig .gitmodules .idea .mcp.json .profile .ripgreprc .vscode .zprofile .zshrc
  ```

  The excluded call and the plain shell after A, B and C list none. After the killed session D, the plain shell's `git status` in the clone lists untracked paths. Its first ten are `.bash_profile .bashrc .claude/agents .claude/commands .claude/hooks .claude/launch.json .claude/loop.md .claude/output-styles .claude/routines .claude/scheduled_tasks.json`. The check script truncates that reading, so the rest of the list and the files' types and modes are unmeasured.

**Conclusions, measured.**
- On Linux, Claude Code also enforces `Edit(...)` deny rules in the bubblewrap sandbox. An `Edit` rule naming an absent path inside a write root mounts the same `/null` placeholder a `denyWrite` entry does, globs included. The control removed only those rules, and the clone's `commondir` and `http-alternates` placeholders, the leftovers after a kill, and the sandboxed git failure all disappeared.
- `config.worktree` is created at session start whether or not any rule names it, so no profile change of ours removes it.

## What this round changes

1. **The run copy's own trio `Edit` rules on a bubblewrap host.**
   - **What changes.** On a bubblewrap host, the per-run copy leaves out every `Edit` deny rule that names or matches the run copy's own `.git/commondir`, `.git/config.worktree` or `.git/objects/info/http-alternates`. That covers the exact ones, and the base's `/<work_root>/<project>-*/.git/…` globs, which match the run copy too.
   - **Where.** The same places this branch changed for `denyWrite`: `run_profile_entries`, `run_profile_glob_drops` and the render in `cli/templates/scripts/autonomous-watcher.sh`, and `COPY_GIT_PATHS` / `bubblewrapDenyWrite` in `cli/src/generators/writeProtection.ts`, whatever is right.
   - **Why this costs nothing.** On Linux, after #212 and this branch, no `denyWrite` entry names those three paths in the run copy, so the sandboxed shell can already write them. The `Edit` rule only stops the file tools from doing the same. The protection that matters is the wrappers' trust check and the watcher's launch check, and both fail closed.
   - **Prove it rather than assume it.** Add the measurement to the owed re-take as a new row: one sandboxed `dd if=/dev/null of=<clone>/.git/commondir conv=notrunc` through `--allowedTools "Bash(dd:*)"` on a profile without the rules. The verdict is either *written* or *refused*. Remove the file from a plain shell before the session ends.
   - **What stays.** macOS keeps every rule. `.git/config`, `.git/hooks` and `.git/objects/info/alternates` keep their `Edit` rules on every platform.

2. **Sibling run copies keep their `Edit` protection, by exact path.**
   - **The risk.** `permissions.allow` carries `Edit(//<work_root>/<project>-*/**)`. Without a deny, the file tools could plant a `commondir` with content in **another** run's clone, a parked run's for example. The watcher would refuse that clone at its next resume. But a person running git in that folder, from a terminal or an IDE, would follow it, which is code execution through that repository's config.
   - **The fix.** The trio's `Edit` rules are re-rooted at each other sibling by exact path, both forms, in the same pass and against the same sibling set as this branch's exact `denyWrite` entries. Every other sibling directory whose `.git` is a real directory, the run copy excluded.
   - **Placeholders.** AP6 shows these give no placeholder: the siblings sit outside every write root.
   - **The cost.** A sibling created after launch is not covered. On a bubblewrap host the one-run-per-repository cap means no run copy is cut mid-session. State the residual in `docs/cli.md` §6 residual 12.

3. **The trust check accepts an empty `config.worktree` and an empty `http-alternates`.**
   - **What it accepts.** `hr_run_copy_check_var` (`cli/templates/scripts/lib/harness-run-lib.sh` and its self-adopted copy) accepts the clone's `.git/config.worktree` and `.git/objects/info/http-alternates` when each is a **regular, 0-byte file and not a symbolic link**.
   - **The extra condition for `config.worktree`.** `git config --file <clone>/.git/config --get extensions.worktreeConfig` must not be true. Git reads `config.worktree` only when that repository-format setting is on, and `.git/config` stays write-protected.
   - **What it still refuses.**
     - Either file with content, a non-regular file such as the `/dev/null` character device, or a symbolic link.
     - **Any** `commondir`, empty or not. An empty `commondir` breaks git itself: AP3's `git status` exited 128 outside the sandbox.
   - **The other checks.** Every wrapper and check that tests these three paths applies the same rule: the launch check in `spawn_engine`, the wrappers' target checks, and `hr_run_copy_check_var`'s callers. Each says why in a comment.
   - **Why it's safe.**
     - `config.worktree` is inert while the extension is off.
     - `http-alternates` is read only by a client fetching **from** this repository over the dumb HTTP protocol. Local git never reads it.
     - An empty file of either kind carries nothing.
   - **Why it's needed.** `config.worktree` is created at every session start by something no profile entry controls, as both sessions show. Without this, a Linux run copy is refused from its first session. Its cause stays open in `docs/sandbox-placeholder-upstream-report.md`.
   - **Tests.** A fixture for each arm: the empty file accepted, content refused, symlink refused, the character device refused, and `config.worktree` refused when `extensions.worktreeConfig` is true. An empty `commondir` stays refused.

4. **The built-in leftovers.**
   - **The facts.** Claude Code mounts placeholders at its own protected paths in the session's cwd, the 21 above. A killed session leaves some of them on disk in the run copy, and no manifest records them.
   - **The decision.** If the sweep can cover them reliably, it does:
     - the list is fixed and readable at launch, or derivable without guessing;
     - each leftover is 0-byte and read-only, the same test `hr_placeholder_sweep_var` already applies;
     - a real file the run made at one of those paths, such as a `.gitmodules` or `.claude/skills`, is never removed.

     In that case, record each absent built-in path in the manifest at launch. Otherwise accept them: state in `docs/cli.md` §6 that they can be left in a run copy after a killed session, that they are untracked clutter rather than a breach, and why. `commit-on-branch.sh` commits the paths it is given, never `git add -A`; confirm that against the code.
   - **What to look for.** The plan reads Claude Code's own list wherever it is available locally. The installed bundle is one place; an unattended run has no web access. It says which source it used.
   - **Not a source.** The list above is a reading of one session, not Claude Code's definition.

5. **The check script reads what this round needs.** `scripts/sandbox-absent-path-check.sh`:
   - reads each of Claude Code's built-in paths at the clone's root in every phase, as it reads the trio;
   - stops truncating the `git status` readings it stores and reports;
   - takes the new `dd` row from item 1;
   - takes the control as a documented option, a profile copy passed as `P=` with `SBX_ABSENT_OUT=` set, rather than a hand-built `jq` line.

   The AP rows' expectations change where the route does:
   - **AP6.** No placeholder outside the write roots; absent outside throughout; `git status (sibling)` 0.
   - **AP2.** `config.worktree` may be present only as an empty regular file, accepted by the trust check.
   - **AP3.** `hr_run_copy_check_var` exits 0 after `sweep`, and `git status (clone)` exits 0.

6. **Record both sessions** in `docs/sandbox-verification.md`, in the record's own style, with `<main>`, `<clone>` and `<sibling>` placeholders and no machine paths.
   - **§5, *The route's re-take (owed)*.** Fill AP1–AP6 with session 1's readings and verdicts, above. Keep the 2026-10-30 AP1–AP5 record of the route before this branch as it stands. The stamp lines are verbatim from the report:
     ```
     date: 2026-10-30T16:13:56+00:00
     main head: b15f8de0ce66dd7833e07eee4857cfbc5110f143
     git: git version 2.39.5
     claude: 2.1.314 (Claude Code)
     bwrap: bubblewrap 0.8.0
     uname: Linux … 6.8.0-117-generic #117-Ubuntu SMP PREEMPT_DYNAMIC … aarch64 GNU/Linux
     apparmor_restrict_unprivileged_userns: 0
     ```
   - **New: the control (AP7 or the record's own naming).** Its profile change, readings and conclusion. Its stamp is the same, with `date: 2026-10-30T16:29:59+00:00` and `profile: <the copy>`. Record that the local `dev` pointed at this branch's head, and why.
   - **Updates elsewhere in the file.**
     - *The decision rule*: the `Edit` rules are now **measured** as a source of placeholders on Linux, no longer a candidate.
     - §5 F9's follow-up cell: this round's change.
     - §0 *Why `config.worktree` differed: unknown*: one sentence that it appears with no rule naming it (the control).
     - §6: the built-in leftovers.
   - **Elsewhere in the tree.**
     - `docs/sandbox-placeholder-upstream-report.md` gains the `Edit`-rule enforcement and the built-in-path leftovers as observations, with versions.
     - The generated `_README` and `doctor`'s `profile-write-protection` Linux note say the `Edit` deny rules are enforced in the sandbox on Linux too.
     - `docs/development.md` → *The absent-path check, by hand* carries the procedure used: the checkout cloned from the branch with a local `dev` pointed at it, `docker cp` of the output directory to the host **before** leaving the container, and the control.
   - **What is owed after this round.** AP1–AP7 plus the `dd` row, re-taken on the head this round produces, before merge.

## Constraints

- **No measured result is invented.** A Linux claim not measured above is labelled *derived* or *owed*.
- **macOS is unchanged**, and the fixtures show it.
- **The trust checks are weakened only as item 3 states.** The empty-and-regular test for `config.worktree` and `http-alternates`, with `extensions.worktreeConfig` off for `config.worktree`. Nothing else is accepted.
- Bash 3.2 floor. `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.
