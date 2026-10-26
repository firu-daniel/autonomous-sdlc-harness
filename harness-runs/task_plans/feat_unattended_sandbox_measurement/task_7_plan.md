### Task 7 — Add the wrappers-refresh leg: fast-forward, two-parent merge and conflict fixtures on the clone arm

**Goal:** Measure `refresh-branch.sh` through `<main>/scripts/` on the clone arm, in the three fixtures `docs/sandbox-verification.md` rows R1–R3 name, plus R0 (whether the main checkout's refresh runs outside the sandbox) and R4 (the clone's own copy). Each refresh is judged by the ref and the working copy, never by an exit status alone, except the conflict's documented exit 4. R4, the one refusal row here, carries a positive control in its own session.

**Depends on:**
- **Task 3** — `sp_judge_call`, `sp_judge_ref`.
- **Task 4** — `sp_session`, the prompt builders, `sp_track`, `sp_track_branch`, `SP_MAIN`, `SP_DEFAULT_BRANCH` and `SP_TMP`. Also **`sp_extra_clone <branch> [--no-bootstrap] [--existing]`**. With `--existing` it calls `bash <main>/scripts/create-worktree.sh --existing <branch>`, which checks out a branch that already exists as a local `refs/heads/<branch>` in `<main>` and never pushes. It then renders that clone's per-run profile, registers the clone and its branch for teardown the same way as the default mode, and sets `SP_EXTRA_CLONE` and `SP_EXTRA_PROFILE`. This task uses one `--existing` clone per fixture.
- **Task 19** — `sp_ctl_clone`, `sp_ctl_prepare <tag>`, `sp_ctl_add <prompt file> refresh`, `sp_ctl_held <stream>`, and `sp_row_result <leg> <row> <verdict> <evidence> <departure>`, which prints `not run` with evidence `control did not succeed: …` when the session's control did not hold.

Each fixture needs its own clone, because a refresh changes the branch. This task owns the whole `wrappers-refresh` leg (rows R0, R1, R2, R3, R4) and the single R4 line. Task 6's `wrappers` leg produces no R4 line, and it owns CS4 whole, its refresh call included (its file says so). This leg prints no CS4 line.

### Targets

- `scripts/lib/sandbox-probe/legs-refresh.sh` (new) — `sp_leg_wrappers_refresh`. It opens with `#!/usr/bin/env bash` and a `# legs-refresh.sh — …` header, and sets no shell option (no `set`, no `shopt`): the entry point owns `set -u` (Task 1; `.claude/context/conventions.md` → `## Shell assets`, *"A sourced library sets no shell options at all"*).

**Work:**

- [ ] **Fixture builder.** `create-worktree.sh`'s default mode cuts a **new** branch at the default's tip and refuses a local `refs/heads/<branch>` that already exists. So a fixture behind the default must exist in `<main>` **before** its clone is cut, and is checked out with `--existing`. For each fixture `<fx>` (`${SP_BRANCH}_r1`, `_r2`, `_r3`), the probe does the following outside any session, in this order:
  1. **Build the fixture's commits in a scratch clone, never in `<main>`'s working tree.**
     - Read the default's tip as origin reports it: `<tip>` = `sp_remote_tip <main> <default>`. `sp_setup`'s `create-worktree.sh` run already fetched that object into `<main>`.
     - Run `git clone --no-checkout --shared <main> <SP_TMP>/fxsrc` once and `sp_track` it. `--shared` makes every object in `<main>` readable there, `<tip>`'s history included. A plain clone carries only `<main>`'s branches, not its `refs/remotes/origin/*`.
     - In fxsrc, run `git checkout -b <fx> <tip>~1`. For (b) and (c), add the fixture's own commit there.
  2. **Create `refs/heads/<fx>` in `<main>`** with `git -C <main> fetch <SP_TMP>/fxsrc <fx>:refs/heads/<fx>`. This writes a ref, not `<main>/.git/config`, so Task 2's `shasum` guard is unaffected. Then `sp_track_branch <fx>`.
  3. **Cut its clone:** `sp_extra_clone <fx> --existing`. The fixture is never pushed, so teardown's origin delete finds nothing, and the empty `sp_remote_tip` reads as removed.

  The three fixtures mirror R1–R3:
  - **(a) R1, fast-forward:** `<fx>` at `<tip>~1`, with no commit of its own.
  - **(b) R2, two-parent merge:** the same base, plus one commit adding a new file the default does not touch.
  - **(c) R3, conflict:** the same base, plus one commit editing a line inside a hunk of `git diff <tip>~1 <tip>`. The leg picks the first changed file outside the protected set `hr_run_protected_rel_paths <main>` lists. If that diff changes no such file, R3 prints `not run`, with evidence `the default's last commit changes no file a fixture may edit`.
- [ ] **The refresh calls.** For each fixture, one session, cwd that fixture's clone, one exact call `bash <main>/scripts/refresh-branch.sh <that clone>`:
  - R1: expect exit 0 and a fast-forward; judged by `sp_judge_ref <clone> HEAD <before> moved` and `git status --porcelain` empty.
  - R2: expect a two-parent merge with `git merge`'s default message; judged by the ref moving and the merge commit having two parents.
  - R3: expect exit 4, `conflicted:` paths, nothing written; judged by every ref, the record index and the tracked files' `shasum` being identical before and after. The conflict row is the one place an exit status is read, and it is read **together with** the no-write check, not instead of it.
- [ ] **R0, reported from R1's single call.** The record's R0 is `bash <main>/scripts/refresh-branch.sh <worktree>` on fixture (a), with the Expected *"runs outside the sandbox"*. On the clone layout that is the same command on the same clone as R1's call, so the leg issues it **once**: fixture (a)'s session carries one call, and two lines are read off it.
  - **R1** judges the fast-forward, as above.
  - **R0** judges where the call ran: `sp_judge_call "$SP_STREAM" ran "bash <main>/scripts/refresh-branch.sh <fixture (a) clone>"`. That is `pass` when the result carries no refusal layer, so the wrapper ran outside the sandbox. It is `fail` when the layer is `sandbox`, `network`, `file-tool` or `permission`, with the refusal line quoted; the recorded worktree-layout R0 failed on `Operation not permitted`. It is `not run` when the call is absent from the stream.
  - R0's evidence opens with `from R1's call:`. A reader tells the two lines apart by their row ids, `row="R0"` and `row="R1"`. Each id is printed exactly once.
  - R0 is not a refusal row (its expected result is "runs"). Its line goes through `sp_result_line` directly.
- [ ] **R4, the clone's own copy, with its control.** One session, cwd `SP_CLONE`.
  - **Before the session:** `sp_ctl_clone`, then `sp_ctl_prepare refresh_own`. Record `refs/heads/<branch>` in `SP_CLONE`.
  - **The measured call:** `bash <SP_CLONE>/scripts/refresh-branch.sh <SP_CLONE>`. Expect the fetch refused sandboxed over SSH. Judge it by `sp_judge_call` layer `network` or `sandbox`, and by `sp_judge_ref <SP_CLONE> refs/heads/<branch> <before> unchanged`.
  - **Control, issued last in the same session:** `sp_ctl_add <prompt> refresh`, which appends `bash <main>/scripts/refresh-branch.sh <ctl clone>`. That is the main checkout's refresh on the control clone, which Task 19 judges as ran with a clean `git status`. It is aimed at the control clone, not `SP_CLONE`, so it cannot move the ref R4 is judged by. After the session, run `sp_ctl_held`, then print R4 through `sp_row_result`.
- [ ] **Teardown.** Every extra clone and branch was registered through `sp_extra_clone`/`sp_track_branch`, so Task 4's `sp_teardown` removes them. This leg removes nothing itself.

**Verification:**

- Grep `legs-refresh.sh`: R1 and R2 are judged by the ref and `git status`, R3 by exit 4 **and** the no-write `shasum` comparison, never by exit status alone.
- Every refresh call names only a clone the leg created through `sp_extra_clone <fx> --existing`, and every fixture branch is passed to `sp_track_branch` before its clone is cut.
- Grep `legs-refresh.sh`: the only write to `<main>` is the `git -C <main> fetch <scratch> <fx>:refs/heads/<fx>` ref creation. No `checkout`, `commit` or `config` runs against `<main>`.
- Grep `legs-refresh.sh`: fixture (a)'s session prompt carries exactly one `refresh-branch.sh` call, and both the R0 and the R1 lines are read from it. R0's verdict is `sp_judge_call … ran`.
- Grep `legs-refresh.sh` for `CS4`: no match outside comments.
- R4 is printed through `sp_row_result` after an `sp_ctl_held` over its own session's stream, and that session carries `sp_ctl_add … refresh` after the measured call.
- `bash scripts/sandbox-probe.sh --list` lists `wrappers-refresh` with rows R0, R1, R2, R3, R4.
