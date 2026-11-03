### Task 9 — PD29's fixtures: the writer, the allow-list check and the leg's target

**Goal:** Pin three things. First, the git behaviour that wrote the two keys PD29 met. Second, that the `gate-sandbox` leg refuses to launch on a target carrying a key outside the clone allow-list, naming the key, and accepts a clean clone. Third, that in the clone layout the leg's target is its own extra clone, while in job mode it is the checkout.

**Depends on:** Task 5, which ships this interface in `scripts/lib/sandbox-probe/legs-gate-sandbox.sh`:

- `sp__gs_target` sets `SP__GS_TARGET` and `SP__GS_PROFILE`. With `SP_JOB_MODE=1` they are `SP_CLONE` and `SP_RUN_PROFILE`, and nothing is created. Otherwise it calls `sp_extra_clone "${SP_BRANCH}_gs" --no-bootstrap` and copies `SP_EXTRA_CLONE` / `SP_EXTRA_PROFILE`. On a refusal it returns 1 with `SP__GS_WHY` set.
- `sp__gs_target_check <main> <target>` returns 0 in job mode without a check. In the clone layout it returns `hr_clone_config_check_var "$main" "$target"`'s answer, and on refusal sets `SP__GS_WHY` to `the gate-sandbox target's .git/config is outside the clone allow-list before the launch: <HR_CLONE_CONFIG_REFUSAL>`.

The writer it guards against is `scripts/lib/sandbox-probe/legs-refresh.sh` → `sp__rf_r4`'s `git -C "$SP_CLONE" -c core.hooksPath=/dev/null branch "$SP_DEFAULT_BRANCH" "refs/remotes/origin/$SP_DEFAULT_BRANCH"`. Task 5 owns the script, and this task only tests it.

### Targets

- `cli/test/sandbox-probe-gate-sandbox-legs.test.mjs`

**Work:**

- [ ] Add a test titled `PD29: R4's git branch writes branch.<default>.remote and .merge`. It builds a throwaway origin with a `main` commit and clones it under `os.tmpdir()`. It moves the clone onto another branch and deletes its local `main`, then runs `git -C <clone> -c core.hooksPath=/dev/null branch main refs/remotes/origin/main` (`sp__rf_r4`'s argument shape) under the suite's isolated git environment. It asserts `git config --file <clone>/.git/config --get branch.main.remote` prints `origin` and `--get branch.main.merge` prints `refs/heads/main`. This is the writer, by git's default `branch.autoSetupMerge`.
- [ ] Add a test titled `PD29: the gate-sandbox leg's target carries no key outside the clone allow-list`. Build a main checkout and a clone the way the existing `sp__render` case's fixture builds them (reuse its helpers, or `helpers/fixture.mjs`'s, so the clone's `.git/config` passes `hr_clone_config_check_var`). Subtests: **(a)** the clean clone passes `sp__gs_target_check`, status 0. **(b)** After the `git branch` above, it returns 1, and `SP__GS_WHY` names `branch.main.remote` and `branch.main.merge` and starts with `the gate-sandbox target's .git/config is outside the clone allow-list before the launch: `. **(c)** With `SP_JOB_MODE=1` it returns 0 on that same dirty target, because job mode's target is the checkout and the launcher reads no clone allow-list there.
- [ ] Add a test titled `PD29: in the clone layout the leg's target is its own extra clone; in job mode it is the checkout`. With `sp_extra_clone` redefined in the case's `bash -c`, after sourcing, to record its arguments and set `SP_EXTRA_CLONE` / `SP_EXTRA_PROFILE` to case paths: in the clone layout, `sp__gs_target` called it with `${SP_BRANCH}_gs --no-bootstrap`, and `SP__GS_TARGET` / `SP__GS_PROFILE` are the stub's paths, not `SP_CLONE` / `SP_RUN_PROFILE`. With `SP_JOB_MODE=1` the stub is never called, and the target and profile are `SP_CLONE` and `SP_RUN_PROFILE`. With the stub returning 1, `sp__gs_target` returns 1 with `SP__GS_WHY` non-empty.
- [ ] Extend the file's header. Its rule sentence gains that the leg launches only on a target inside the clone allow-list, its own extra clone in the clone layout (§5 PD29). Its function list gains `sp__gs_target` and `sp__gs_target_check`. Its *Left out deliberately* sentence still holds, because no case launches a session, the launcher or `bwrap`.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-gate-sandbox-legs.test.mjs` passes. The three titles above are present byte for byte, because Task 13 cites them in `docs/sandbox-verification.md` §5 PD29.
- Every git repository a case creates lives under `os.tmpdir()` and is removed when the case ends. None is inside this checkout.
