### Task 21 — Test CS6's grade, the carried-over legs' job arms and L1's reachability

**Goal:** A new suite holding the job-mode legs' grades to their rows, and settling the question the prompt asks of L1: does it become reachable where the target is the checkout itself? The suite answers it on a fixture before any runner run. Each grade reads disk, refs and streams, never an exit status. Each job arm prints its clone-only rows `not run` and nothing else for them. Each job-mode evidence line says it was read before the placeholder sweep.

**Depends on:**

- **Task 9 (`legs-job.sh`):** `sp__cs6_grade <stream> <status cmd> <add cmd> <wrapper cmd> <index sum unchanged: 1|0> <staged set after> <ref before> <ref after> <change set>`. `<stream>` is session 1's (`git status`, `git add`) and session 2's (the wrapper) streams concatenated. `<index sum unchanged>` and `<staged set after>` bracket **session 1 only**, read before the wrapper runs, because the wrapper's own index sync legitimately rewrites `<job>/.git/index`; `<ref before>`, `<ref after>` and `<change set>` bracket session 2. Its arms:
  - `fail` when the index changed or the file is staged, the ref did not move, the change set is not exactly `sbx_cs6.txt`, or `git status` errored;
  - `not run` for a permission-layer refusal, an absent call, `git add` reporting success with nothing reaching the index, or `git add` erroring with a line whose judged layer is not `sandbox` (`unrecognised` on Linux, an error at `ran` off Linux), the evidence *git add errored with no refusal string the judge knows: <line>*;
  - otherwise `pass`, which requires `git add`'s judged layer to be `sandbox`.
- **Task 11 (`legs-wrappers.sh`):** in job mode, `sp_job_skip_clone_rows wrappers` prints CS4, P3 and CW2. Over a non-SSH origin, P1b is graded on `ls-remote` alone, its evidence adding *origin is <scheme>, so GIT_SSH_COMMAND is never run and the marker is recorded, not graded*.
- **Task 12 (`legs-protection.sh`):** in job mode, CS1, CS2 and CS7 are skipped, and `sp__wp_w8` grades the write-protection log alone, its evidence saying *W7's half is not a job row*.
- **Task 13 (`legs-planted-files.sh`):**
  - `sp__pf_l1_grade <stream> <command> <remote dash ref before> <remote dash ref after>`: the dash refusal line with the remote ref absent before and after → `pass`; the remote ref appearing → `fail`; any other message → `not run`, *unreachable in job mode: …*;
  - `sp__pf_l1_restore <head ref>` (one argument, as `sp_restore_register`'s slot allows), reading the leg-scoped globals `SP_PF_L1_COMMIT` (the commit the probe gave the local ref) and `SP_PF_L1_REMOTE_ABSENT` (`1` when step 1 found no `-sbxdash` on origin): puts `HEAD` back, deletes the local `refs/heads/-sbxdash` when it points at `SP_PF_L1_COMMIT`, and, when `SP_PF_L1_REMOTE_ABSENT` is `1` and origin's `-sbxdash` tip now equals `SP_PF_L1_COMMIT`, deletes the remote ref with `git -C "$SP_MAIN" push origin :refs/heads/-sbxdash`; it returns 1 naming the hand command when any step fails, and never touches a ref whose tip is not `SP_PF_L1_COMMIT`;
  - in job mode, CS12, CS13, CS14 and L2 are skipped.
- **Task 2:** `sp_job_git_note` prints `; read before the placeholder sweep` in job mode only.
- **Task 1:** `SP_JOB_MODE`, `sp_job_skip_clone_rows`.

**Where this task stops.** One new suite. If the reachability case shows that something other than the dash check answers, the implementer records it as a deviation, and Task 13's `not run` arm is what a job run prints. This task does not change the wrapper.

### Targets

- `cli/test/sandbox-probe-job-legs.test.mjs` (new)
- `cli/test/fixtures/sandbox-probe/job-*.jsonl` (new): one stream fixture per graded shape below

**Work:**

- [ ] **The header** opens with the rule above. Each grading case runs a `bash -c` through `runBash`, sourcing the probe libraries from `WORKSPACE_ROOT/scripts/lib/sandbox-probe/` in the entry point's order.
- [ ] **`test('CS6')`**, one subtest per arm of `sp__cs6_grade`:
  - **`pass`:** a two-session stream fixture (session 1's `git status` and refused `git add`, then session 2's landed wrapper call), `git add` refused with `Operation not permitted`, and with `SP_PLATFORM=linux` also `Read-only file system`; index unchanged across session 1 (`1`) and the staged set empty; ref moved; change set `sbx_cs6.txt`. The case's comment says the index argument is session 1's reading, so a wrapper that synced the index afterwards does not enter it;
  - **`fail`:** the index changed across session 1 (`0`); the file staged after session 1; the ref unmoved across session 2; the change set carrying a second file;
  - **`not run`:** a permission-layer refusal of each call; `git add` succeeding with the index unchanged, whose evidence names the outcome rather than *refused*; and, with `SP_PLATFORM=linux`, `git add` erroring with `Input/output error` (the string no arm of the judge's layer table matches, as Task 19 uses it) while the index is unchanged across session 1 (`1`), the staged set is empty, the ref moved and the change set is exactly `sbx_cs6.txt` — the verdict is `not run`, never `pass`, and its evidence quotes `Input/output error`.
- [ ] **`test('the carried-over legs in job mode')`**:
  - with `SP_JOB_MODE=1`, `sp_job_skip_clone_rows` for `wrappers`, `write-protection` and `planted-files` prints exactly CS4, P3, CW2 / CS1, CS2, CS7 / CS12, CS13, CS14, L2 as `not run`;
  - with `SP_JOB_MODE=0`, it prints nothing;
  - `sp__wp_w8` in job mode on a write-protection log fixture with no unmatched-rule line → `pass` with the W7-half note; with one → `fail`; with an empty log → `not run`;
  - with `SP_JOB_MODE=0` on the same fixtures, both halves are read, as `sandbox-probe-protection-legs.test.mjs` asserts today;
  - `sp_job_git_note` prints its suffix only in job mode.
- [ ] **`test('L1 in job mode')`**:
  - **`sp__pf_l1_grade`'s arms** on stream fixtures, the `pass` fixture quoting `push-branch.sh: branch '-sbxdash' starts with '-', which git would read as an option — refusing to push`.
  - **`sp__pf_l1_restore`** on a `seedRepository` fixture (`cli/test/helpers/fixture.mjs`) with a bare origin, whose `HEAD` the case pointed at `refs/heads/-sbxdash`:
    - **local only:** it puts `HEAD` back and deletes the local ref, and on a second call changes nothing;
    - **the remote ref the probe caused:** the case pushes `refs/heads/-sbxdash` to the bare origin with a refspec push, sets `SP_PF_L1_REMOTE_ABSENT=1` and `SP_PF_L1_COMMIT` to the pushed commit, then calls it — it removes the remote ref as well as the local one, and the bare origin's `for-each-ref` no longer lists it;
    - **a remote ref the probe did not create:** with `SP_PF_L1_REMOTE_ABSENT=0`, or with the origin's tip moved to a different commit, the remote ref is left in place;
    - **the remote deletion failing** (the case removes the `origin` remote first): it returns 1 and its message names `git push origin :refs/heads/-sbxdash`.
  - **The reachability case.** On an adopted fixture from `createWatcherFixture` (`cli/test/helpers/watcher.mjs`) with a bare origin, outside any session:
    1. `git update-ref refs/heads/-sbxdash HEAD`, then `git symbolic-ref HEAD refs/heads/-sbxdash`;
    2. run the fixture's own `bash <fixture>/<scriptsDir>/push-branch.sh <fixture>`;
    3. assert that its output carries the dash refusal line and that the bare origin has no `-sbxdash` ref.

    The header says this is the reading Task 13 rests on, measured on a fixture rather than inferred.

**Verification:**

- This suite passes: `npm test --workspace cli -- test/sandbox-probe-job-legs.test.mjs`, from the repository root, as one plain foreground command.
- Read the counts and the exit status, not a summary line.
- If the reachability case cannot pass because another refusal answers first, that is recorded as a deviation naming the line, never forced.
</content>
</invoke>
