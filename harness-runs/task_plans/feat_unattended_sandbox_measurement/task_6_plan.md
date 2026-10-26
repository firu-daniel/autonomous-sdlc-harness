### Task 6 — Add the wrappers leg: commit, push, the clone's own copies, the compound and the assignment prefix

**Goal:** Measure the three excluded wrappers through `<main>/scripts/` on the probe clone. CS4's commit, push and refresh run in one session, in order. Also measure that the clone's own copies stay sandboxed, that a compound stays sandboxed, and that an assignment prefix either stays sandboxed or is neutralised. Every push is judged by `ls-remote`, and every commit by the ref before and after. Every refusal row's session carries a positive control.

**Depends on:**
- **Task 3** — `sp_judge_call`, `sp_judge_push`, `sp_judge_ref`, `sp_remote_tip`.
- **Task 4** — `sp_session`, the prompt builders, `sp_track`, and `SP_CLONE`, `SP_MAIN`, `SP_BRANCH`, `SP_RUN_PROFILE`.
- **Task 19** — the positive controls. `sp_ctl_clone` cuts the control clone once. `sp_ctl_prepare <tag>` writes its change and records the before-values. `sp_ctl_add <prompt file> commit <tag>` and `sp_ctl_add <prompt file> push` append the control calls, aimed at the control clone, never at `SP_CLONE`. `sp_ctl_held <stream>` judges them after the session. `sp_row_result <leg> <row> <verdict> <evidence> <departure>` prints the row, or `not run` with evidence `control did not succeed: …` when a control did not hold.

The refresh **fixtures** (R0–R4) are **Task 7's** `wrappers-refresh` leg, a separate function. CS4's own refresh call is this task's, because the record defines CS4 as one session.

### Targets

- `scripts/lib/sandbox-probe/legs-wrappers.sh` (new) — `sp_leg_wrappers`. It opens with `#!/usr/bin/env bash` and a `# legs-wrappers.sh — …` header, and sets no shell option (no `set`, no `shopt`): the entry point owns `set -u` (Task 1; `.claude/context/conventions.md` → `## Shell assets`, *"A sourced library sets no shell options at all"*).

**Work:**

- [ ] **CS4: commit, push and refresh in one session, cwd `SP_CLONE`, in this order.** This is the record's own shape (`docs/sandbox-verification.md` → `### The clone layout (owed)`, row CS4).
  - **Before the session.** Edit a tracked file in the clone through the clone's own `git`, so the commit has a change. Record `refs/heads/<branch>` in the clone and the remote tip.
  - **Call 1:** `bash <main>/scripts/commit-on-branch.sh --repo <clone> <file> -- "<subject>"`. It is judged by `sp_judge_ref <clone> refs/heads/<branch> <before> moved` and by the new commit's only change being `<file>`. The subject carries no `$` (`.claude/context/conventions.md` → `## Shell assets`, the main-checkout wrapper rule).
  - **Call 2:** `bash <main>/scripts/push-branch.sh <clone>`. It is judged by `sp_judge_push`.
  - **Call 3:** `bash <main>/scripts/refresh-branch.sh <clone>`. It is judged by `sp_judge_call "$SP_STREAM" ran "<call 3>"`: the call ran unsandboxed, and its result is exit 0 or the documented exit 4 with `conflicted:` paths. Either is within its contract, and the evidence quotes which.
  - **After the session, from the probe:** `git -C <clone> rev-parse refs/heads/<branch>`, `git -C <main> rev-parse refs/heads/<branch>` and `git -C <main> ls-remote origin <branch>`.
  - **Verdict, one CS4 line.** `pass` only when all four hold: the commit moved the ref with `<file>` as its only change; the push moved the remote tip; the refresh ran within its contract; and the clone's and the main checkout's `refs/heads/<branch>` are equal. Otherwise `fail`, with evidence naming the first that did not hold. The evidence names all four, for example `commit <a>..<b>; push ls-remote <a>..<b>; refresh exit 0; clone = main = <sha>`.
  - CS4 is not a refusal row. It needs no control, and its line goes through `sp_result_line` directly.
  - **CS4 prints exactly one line, in this leg only.** Task 7's `wrappers-refresh` leg prints no CS4 line, so `row="CS4"` appears once in a run's output.
- [ ] **P3 and CW2, the clone's own copies, one session.**
  - **Before the session:** `sp_ctl_clone`, then `sp_ctl_prepare wr_own`.
  - **The measured calls:** `bash <clone>/scripts/commit-on-branch.sh --repo <clone> <file> -- "<subject>"` (CW2) and `bash <clone>/scripts/push-branch.sh <clone>` (P3). Expect each stays sandboxed and fails: the push on the proxy refusal (`sp_judge_call` layer `network` or `sandbox`), the commit on the record or sync write. Judge the push by `sp_judge_push` showing the tip unchanged, and the commit by `sp_judge_ref … unchanged`.
  - **Control, issued last in the same session:** `sp_ctl_add <prompt> commit wr_own`, then `sp_ctl_add <prompt> push`. That is the main checkout's wrappers landing a commit and a push on the control clone. After the session, run `sp_ctl_held`, then print P3 and CW2 through `sp_row_result`.
- [ ] **P1c and CW5, a compound, one session.**
  - **Before the session:** `sp_ctl_prepare wr_compound`.
  - P1c: `bash <main>/scripts/push-branch.sh <clone>; git status`. Expect it stays sandboxed: the wrapper fails, or the call is refused at the permission layer. The remote tip is unchanged. Record which layer in the evidence.
  - CW5: `bash <main>/scripts/commit-on-branch.sh --repo <clone> <file> -- "<subject>"; git status`. Expect it stays sandboxed, with `refs/heads/<branch>` unchanged.
  - **Control, issued last:** `sp_ctl_add <prompt> commit wr_compound`, then `sp_ctl_add <prompt> push`. These are the same wrappers without the compound, on the control clone. Print P1c and CW5 through `sp_row_result`.
- [ ] **P1b and CW6, an assignment prefix, one session.**
  - **Before the session:** `sp_ctl_prepare wr_prefix`.
  - P1b: `GIT_SSH_COMMAND=<probe> bash <main>/scripts/push-branch.sh <clone>`, where `<probe>` is a tracked helper that touches a marker. Expect it either stays sandboxed (the push fails, tip unchanged) or runs excluded. Record which, and whether the marker appears. `sp_track` the marker.
  - CW6: `GIT_DIR=<x> bash <main>/scripts/commit-on-branch.sh --repo <clone> <file> -- "<subject>"`. `<x>` is the `.git` of a scratch repository built from the clone's own git before the session, and tracked. Expect one of two outcomes, and record which, judged by `sp_judge_ref` on both repositories:
    - it stays sandboxed and fails, as CW2;
    - it runs excluded, with `hr_git_env_drop` neutralising the prefix: the commit lands on `refs/heads/<branch>` and `<x>`'s refs are unchanged.
  - **Control, issued last:** `sp_ctl_add <prompt> commit wr_prefix`, then `sp_ctl_add <prompt> push`. Print P1b and CW6 through `sp_row_result`. Each row's line says which of the two outcomes it took, as the prompt requires.

**Verification:**

- Grep `legs-wrappers.sh`: no push or commit is judged by an exit status. Each uses `sp_judge_push` or `sp_judge_ref`. CS4's refresh call is the one `sp_judge_call … ran`, read together with the four-part verdict.
- Grep `legs-wrappers.sh` for `sp_result_line`: its only call is CS4's. P3, CW2, P1c, CW5, P1b and CW6 are printed through `sp_row_result`, each after an `sp_ctl_held` over its own session's stream.
- Every session that prints a refusal row carries an `sp_ctl_add … commit` and an `sp_ctl_add … push`, after its measured calls. No control is aimed at `SP_CLONE`.
- Every call to a `<main>/scripts/` wrapper carries no `$` outside the `GIT_SSH_COMMAND=` / `GIT_DIR=` prefixes that rows P1b and CW6 exist to measure. No subject string carries one.
- `bash scripts/sandbox-probe.sh --list` lists `wrappers` with rows CS4, P3, CW2, P1c, CW5, P1b, CW6. R4 (the clone's own refresh) is the `wrappers-refresh` leg's (Task 7), and this leg prints no R4 line.
