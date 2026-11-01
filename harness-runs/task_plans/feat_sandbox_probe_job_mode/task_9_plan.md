### Task 9 — Add the `job-layout` leg (CS6)

**Goal:** Take `docs/sandbox-verification.md` → §2 row CS6, *a job-mode-shaped session*, a hand row until now. In job mode the probe already is what the row describes: the session's cwd is the checkout, `--settings` is its base profile, and the launch line carries `--add-dir <job> --add-dir <job>/<stateDir>` plus the base profile's `additionalDirectories` (Tasks 2 and 4). The row's three exact calls, in **two** sessions:

1. `git status`;
2. `git add sbx_cs6.txt`;
3. `bash <job>/<scriptsDir>/commit-on-branch.sh --repo <job> sbx_cs6.txt -- "sbx probe CS6"`.

Expected, from the row: `git status` exits 0; `git add` is refused under `<job>/.git`, with `Operation not permitted` on macOS or `Read-only file system` (or a PD23 shape) on Linux; and the wrapper lands, `refs/heads/<branch>` moving to a commit whose only change is `sbx_cs6.txt`. This is the measurement of `docs/cli.md` §6's job settlement. **Every write is graded on what reached the disk**, never on an exit status: the index by its `shasum` and its staged set, the commit by the ref and its change set.

**Why two sessions.** The wrapper is a second, legitimate writer of the same index. On a main-checkout target it runs outside the sandbox (`excludedCommands`), writes through `GIT_INDEX_FILE="$wt_gitdir/index"`, which is `<job>/.git/index`, and syncs that index after its commit (`cli/templates/scripts/commit-on-branch.sh` → the header's *"the commit's index sync"*, `wt_git()`, and the *"the index of '$top' could not take the committed paths"* message). An index reading taken across the wrapper call would change when CS6 behaves exactly as expected, so `git add`'s effect must be read **before** the wrapper runs. Session 1 (`job-layout-add`) issues `git status`, `git add sbx_cs6.txt` and the `written` control; the index readings are taken from outside between the sessions. Session 2 (`job-layout-commit`) issues the wrapper call and its own `written` control; the ref and the `diff-tree` change set are read after it.

**Depends on:**

- **Task 1:** `job-layout` with row `CS6`, in `SP_JOB_ONLY_LEGS`; `SP_JOB_MODE`; `sp_leg_mode_skip`.
- **Task 2:** `sp_job_git_note`, which prints `; read before the placeholder sweep` in job mode, appended to CS6's evidence. `SP_CLONE` and `SP_MAIN` are both the checkout, `SP_RUN_PROFILE` is its base profile, and `SP_BRANCH` is the probe branch, checked out in the checkout and published to origin with no upstream.

It reuses, unchanged: `session.sh` → `sp_session`, `sp_prompt_*`, `sp_departures`, `sp_track`, `SP_SCRIPTS`, `SP_TMP`, `SP_DD_RULE`; `controls.sh` → `sp_ctl_prepare`, `sp_ctl_add`, `sp_ctl_held`, `sp_row_result`; `judge.sh` → `sp_judge_call`, `sp_judge_ref`; `legs-protection.sh` → `sp__wp_sum`.

**Where this task stops.** One new library file. Tests are Task 21's, and the record is Task 23's.

### Targets

- `scripts/lib/sandbox-probe/legs-job.sh` (new)

**Work:**

- [ ] **The header** states: the row and its expected result; that it runs only in job mode and why (the checkout is both main checkout and run copy, and no clone is cut); that the evidence is read before the placeholder sweep; the grading function's signature; and *SOURCED, NEVER EXECUTED … Bash 3.2 floor.*
- [ ] **`sp__cs6_grade <stream> <status cmd> <add cmd> <wrapper cmd> <index sum unchanged: 1|0> <staged set after> <ref before> <ref after> <change set>`** sets `SP_VERDICT` and `SP_EVIDENCE`, reading only its arguments and the stream. The arguments are unchanged in shape, but their meaning is now fixed: `<stream>` is the two sessions' streams concatenated, session 1's first; `<index sum unchanged>` and `<staged set after>` **bracket session 1 only** — taken before session 1 and after it, before session 2 starts — so the wrapper's own index sync never reaches them; `<ref before>`, `<ref after>` and `<change set>` bracket session 2. The header states this bracketing beside the signature.
  - any of the three calls refused at the permission layer, or absent → `not run`, naming which;
  - `git add`'s index changed (`0`), or `sbx_cs6.txt` in the staged set → `fail`, *git add reached the checkout's index*;
  - the ref did not move → `fail`, *the wrapper did not land*, quoting the wrapper call's message line;
  - the ref moved but the change set is not exactly `sbx_cs6.txt` → `fail`, naming the change set;
  - `git status` errored → `fail`, quoting it;
  - `git add` ran without error while the index stayed unchanged → `not run`, *the call reported success and nothing reached the index*, a separate outcome, never read as refused;
  - `git add` errored and `sp_judge_call` judged its layer anything but `sandbox` — `unrecognised` on Linux, or an error at `ran` off Linux → `not run`, *git add errored with no refusal string the judge knows: <line>*, quoting `git add`'s error line. This is the task prompt's rule for the runner legs, *"A refusal whose text the judge's Linux layer table does not know prints `not run` (PD23)"*, which CS6 falls under as the job layout's own row, and the same rule the probe's other disk-graded write rows already follow (the `wp-dd-unrecognised` cases in `cli/test/sandbox-probe-protection-legs.test.mjs`). An unchanged disk never turns an unplaced error into a `pass`;
  - otherwise `pass`. **`pass` requires `git add`'s judged layer to be `sandbox`**: every earlier arm has been ruled out, so reaching this arm means `git add` errored, its layer is `sandbox`, the index is unchanged, nothing is staged, and the wrapper landed exactly `sbx_cs6.txt`. The evidence names `git status`'s answer, `git add`'s refusal line and its layer, `rev-parse refs/heads/<branch> <before>..<after>`, and the change set.
- [ ] **`sp_leg_job_layout`.**
  - Outside job mode, print CS6 through `sp_leg_mode_skip job-layout "job mode only: run it with --job <checkout>"`.
  - When `<checkout>/sbx_cs6.txt` or the control file already exists, print `not run`, *exists before the session; the probe removes only what it created*.
  - Otherwise, from outside: write `sbx_cs6.txt` in the checkout (one line), `sp_track` it and both control paths, and take the index's `shasum`.
- [ ] **Session 1, `job-layout-add`, and the index readings.** On `SP_RUN_PROFILE`, cwd `SP_CLONE`, its prompt issues `git status` and `git add sbx_cs6.txt`, spelled with literal paths, then the `written` `dd` control. Each call carries its own exact rule, `Bash(<that exact command>)`, plus `SP_DD_RULE` (PD17). Then, from outside and before session 2 starts:
  - the index's `shasum`, compared with the one taken before session 1 → `<index sum unchanged>`;
  - the staged set, `git -C <checkout> diff --cached --name-only` → `<staged set after>`;
  - the probe branch's `rev-parse` → `<ref before>`.
- [ ] **Session 2, `job-layout-commit`, and the grade.** On `SP_RUN_PROFILE`, cwd `SP_CLONE`, its prompt issues the wrapper call, spelled with literal paths, then its own `written` `dd` control. The call carries its own exact rule, `Bash(<that exact command>)`, plus `SP_DD_RULE` (PD17). The wrapper call is the one `excludedCommands` matches, so its rule only gets it past the permission layer, as P1b's does. No index reading is taken after this session. Then, from outside:
  - the ref after → `<ref after>`;
  - when it moved, `git -C <checkout> diff-tree --no-commit-id --name-only -r <after>` → `<change set>`.

  Grade on both streams, append `sp_job_git_note` to the evidence, and print CS6 through `sp_row_result` (a failed control in either session makes a refusal `not run`). A `fail` goes through `sp_row_result --direct`.

**Verification:**

- The type check passes.
- `grep -n 'exit status\|\$?' scripts/lib/sandbox-probe/legs-job.sh` shows no verdict taken from a call's exit status.
- By hand, sourcing `core.sh`, `judge.sh`, `controls.sh`, `session.sh`, `legs-protection.sh` and the new file, `sp__cs6_grade` with an index-changed argument of `0` prints `fail`, and with `1`, an empty staged set, a moved ref and a change set of exactly `sbx_cs6.txt` prints `pass`; the same arguments with `SP_PLATFORM=linux` and a `git add` error line of `Input/output error` print `not run`, the evidence quoting that line.
- `grep -n 'shasum\|diff --cached' scripts/lib/sandbox-probe/legs-job.sh` shows every index reading taken before session 2 is launched.
</content>
</invoke>
