### Task 9 — Add the planted-files leg: the clone's `.git` files and the dash-leading names

**Goal:** Measure that a wrapper refuses before any git call when an `objects/info/http-alternates`, a `commondir` or a `config.worktree` is planted in a probe clone's `.git`, where CL5 measured new files writable (CS12–CS14). Measure that a `defaultBranch` starting with `-` is refused (L2). Record why L1, a branch starting with `-`, cannot be reached on the clone layout.

**Depends on:**
- **Task 1** — the leg table's `planted-files` line (CS12, CS13, CS14, L1, L2), and `sp_result_line <leg> <row> <verdict> <evidence> <departure>`.
- **Task 3** — `sp_judge_call`, `sp_judge_ref <repo> <ref> <before> <expect moved|unchanged>`.
- **Task 4** — `sp_session`, the prompt builders, `sp_track`, and **`sp_extra_clone <branch> [--no-bootstrap] [--existing]`**, which cuts a clone through `<main>/scripts/create-worktree.sh`, renders its per-run profile, registers the clone and its branch for teardown, and sets `SP_EXTRA_CLONE` and `SP_EXTRA_PROFILE`. This task uses the default (new-branch) mode with `--no-bootstrap`. Also `SP_MAIN`, `SP_BRANCH`, `SP_TMP`. The teardown removes a tracked directory under `SP_TMP` through `sp_rm_tree`.
- **Task 19** — `sp_ctl_clone`, `sp_ctl_prepare <tag>`, `sp_ctl_add <prompt file> commit <tag>`, `sp_ctl_held <stream>`, and `sp_row_result <leg> <row> <verdict> <evidence> <departure>`, which prints `not run` with evidence `control did not succeed: …` when the session's control did not hold.

**Where this task stops.** This task owns `legs-planted-files.sh` and its one leg, `planted-files`. The `.git/config` plants (C1, CW3, C2, K2, CW4, CS15) are **Task 8's** `planted-config` leg in `legs-planted.sh`. This task neither edits that file nor depends on it.

**How a plant is made.** A file the sandbox refuses to write is planted **by the probe itself, before the session**, with a `printf` the probe makes outside any session. That is the terminal-equivalent fixture §0 → **Three deliberate departures** permits. The leg's line names it as a departure.

### Targets

- `scripts/lib/sandbox-probe/legs-planted-files.sh` (new) — `sp_leg_planted_files`. It opens with `#!/usr/bin/env bash` and a `# legs-planted-files.sh — …` header, and sets no shell option (no `set`, no `shopt`): the entry point owns `set -u` (Task 1; `.claude/context/conventions.md` → `## Shell assets`, *"A sourced library sets no shell options at all"*).

**Work:**

- [ ] **The files-plant clone.** Cut one extra clone, `sp_extra_clone "${SP_BRANCH}_files" --no-bootstrap`, so `SP_CLONE`'s `.git` is never planted and the later legs see a clean clone. Plant **one file at a time**: `hr_clone_target_check_var` checks `commondir`, then `config.worktree`, then `objects/info/http-alternates`, and stops at the first it finds, so two files planted together would both be refused on the first file's name. Each file is written before its session, `sp_track`ed, and removed after the session with `rm -f -- <path>`.
- [ ] **CS12, CS13, CS14.** One session per planted file, cwd the files-plant clone, one exact call each: `bash <main>/scripts/commit-on-branch.sh --repo <files clone> <file> -- "<subject>"`.
  - CS12: `<files clone>/.git/objects/info/http-alternates`;
  - CS13: `<files clone>/.git/commondir`;
  - CS14: `<files clone>/.git/config.worktree`.

  Expect each refused before any git call with `commit-on-branch.sh: refusing to commit: '<files clone>' is a clone, but <files clone>/.git/<name> exists, and a clone the harness made has none`, naming that row's file. `refs/heads/${SP_BRANCH}_files` must be unchanged (`sp_judge_ref … unchanged`). A refusal naming a different file or a different reason is `fail`, with the line quoted.

  - **The positive control, every session.** Before each session, `sp_ctl_clone` (once) and `sp_ctl_prepare <row>`. After the measured call, `sp_ctl_add <prompt> commit <row>`. That is the unplanted counterpart: the same `<main>/scripts/commit-on-branch.sh`, aimed at Task 19's control clone, which carries no plant. After the session, `sp_ctl_held`, then the row is printed through `sp_row_result`. The control never targets the files-plant clone, so it cannot move `refs/heads/${SP_BRANCH}_files`.
- [ ] **L1, unreachable on the clone layout.** Print `not run` for L1, with no session, with the evidence `unreachable on the clone layout: push-branch.sh's clone arm (hr_clone_target_check_var) looks up the run registry by the branch HEAD names and refuses a clone with no clone record for it, before the dash check; and hr_clone_create_var, the only route to such a record, refuses a branch starting with '-'`. The leg's line adds that L1's 2026-10-14 worktree result stands. The reason is grounded in two facts in `scripts/lib/harness-run-lib.sh`:
  - `hr_clone_target_check_var` refuses with `the run registry records no clone of <main> at that path` unless `.runs[<branch HEAD names>]` is a `clone` record at that path. `push-branch.sh` runs it (through `hr_wrapper_target_check_var`) before its `branch '<b>' starts with '-'` check.
  - `hr_clone_create_var` refuses with `the branch name is empty or starts with '-'`.

  So a clone checked out on `-sbxdash` would be refused for the missing record, not for the dash. A pass on that refusal would be the wrong evidence. The probe writes no registry record by hand, because the registry is the watcher's state.
- [ ] **L2, a `defaultBranch` starting with `-`.** `refresh-branch.sh` reads `defaultBranch` from the main checkout its own script directory places (`cfg_root="$main_top"`). So `<main>/scripts/refresh-branch.sh` always reads `<main>`'s configuration, and the recorded L2 ran a scratch main checkout's own copy (`<tmp>/dashrepo/harness.config.json`). Do the same:
  - Under `SP_TMP`, build `<tmp>/dashrepo`. Run `git init` and make one commit. Copy `<main>/scripts/refresh-branch.sh` and `<main>/scripts/lib/` into it byte for byte; that is a fixture, and no wrapper logic is re-written. Write its `harness.config.json` as `jq '.defaultBranch = "-x"' <main>/harness.config.json`. Leave `core.hooksPath` unset in its `.git/config`, so `hr_pinned_hooks_path` resolves `.git/hooks`; that check runs before the `defaultBranch` read. `sp_track` the directory.
  - Make one call, from the probe itself and not a session, because L2 measures the wrapper's own refusal, not the sandbox: `bash <tmp>/dashrepo/scripts/refresh-branch.sh`. The departure names both the copy and the terminal call.
  - **Verdict:** `pass` only when stderr carries `refresh-branch.sh: defaultBranch '-x' in '<tmp>/dashrepo/harness.config.json' starts with '-', which git would read as an option — refusing to merge` and the exit status is 1. Any other refusal is `fail`, with its line quoted.
- [ ] **The lines.** Assert that every planted file was removed after its session. Then print one result line per row: CS12, CS13, CS14, L1, L2.

**Verification:**

- Grep `legs-planted-files.sh`: every planted file is written by the probe before its session, is passed to `sp_track`, and goes into `SP_EXTRA_CLONE`, never into `SP_CLONE`. Each CS12–CS14 call is judged by the refusal naming that row's file, plus `sp_judge_ref … unchanged`. Each of their sessions carries an `sp_ctl_add … commit` after the measured call, and each row is printed through `sp_row_result`. L1 and L2 launch no session and are printed through `sp_result_line`.
- Read L1's branch: it launches no session and prints `not run` with the stated reason, never `pass`.
- Read L2's verdict: `pass` requires the `defaultBranch '-x'` line, never just a non-zero exit.
- Every `<main>/scripts/` wrapper call carries no `$`, and no subject carries one.
- `bash scripts/sandbox-probe.sh --list` lists `planted-files` with rows CS12, CS13, CS14, L1, L2.
