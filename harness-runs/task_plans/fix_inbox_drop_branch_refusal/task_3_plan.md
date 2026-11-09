### Task 3 — Cover the intake refusal for every engine, both targets and an unresolvable protected set in the watcher intake suite

**Goal:** Prove end to end, through the written watcher's `tick`, that a drop for a protected or invalid branch, or for any branch while the protected set is unresolvable, is archived as `rejected_<ts>_<name>` with one `failed` notification. Prove that nothing is created, committed, launched or dispatched for it, and that a valid drop in the same pass still launches.

**Depends on:** Task 1 and Task 2. The contract these cases assert, restated so no guess is needed:
- **Task 2's watcher behaviour.** A refused drop is moved to `<stateDir>/autonomous_inbox/.processed/rejected_<digits>_<the dropped filename>`, and the watcher log gets a line `rejecting '<fname>': <reason> — nothing created, committed or launched`. One notification with event `failed`, the branch, and a detail starting `(refused at intake: <reason>` is sent. No registry record, no working copy `<dir>-<branch>`, no `autonomous_logs/<branch>.log`, and no `gh` call are made. The check runs before the kill switch and before `execution.target` is read.
- **Task 1's three `<reason>` strings:**
  - `'<branch>' is not a valid branch name (git check-ref-format --branch)`
  - `'<branch>' is a protected branch in '<root>/harness.config.json'`
  - `whether '<branch>' is protected cannot be judged: the protected set in '<root>/harness.config.json' cannot be resolved`

This task changes no shipped file.

### Targets

- `cli/test/watcher-remote-dispatch.test.mjs`: the suite holding the existing intake-routing case (*"with the key absent a drop routes through the library: task engine on its branch, junk rejected"*). Its `createDispatchFixture` drives both `target: null` (local) and `github-actions`.

**Work:**

- [ ] Suite header: extend its **rule** paragraph with the intake rule. A drop whose branch is protected, unresolvable or not a valid branch name is archived as `rejected_` with one `failed` notification, for every pattern and both targets, before anything is created, and it never reaches `gh`.
- [ ] Local case, `target: null`, one `f.tick()`:
  - **Drops.** Read the fixture's `defaultBranch` (`D`) from its `harness.config.json`, then drop `${D}_task_prompt.md`, `${D}_review.md`, `${D}_docs.md`, `a..b_task_prompt.md`, `foo.lock_review_2.md` and `feat_x_task_prompt.md` together. Never a dot-leading name such as `.._task_prompt.md`: the inbox glob `*.md` never sees one.
  - **Five refused drops.** None of the five is still in the inbox, and `.processed/` holds exactly one `rejected_\d+_<name>` per refused name.
  - **The valid drop launches.** `f.prompts().length === 1`, `f.record().engine === 'task'` and the subject is `chore: add task prompt for feat_x`.
  - **No other records or files.** The registry's `runs` keys deep-equal `['feat_x']`. Neither `${f.dir}-${D}`, `${f.dir}-a..b` nor `${f.dir}-foo.lock` exists, and no `autonomous_logs/<branch>.log` exists for those three branches.
  - **Notifications and log.** The `failed` notifications are exactly five, each naming its refused branch with a detail matching `/^\(refused at intake: /`. The watcher log has a `rejecting '<fname>':` line naming the protected reason for each `D` drop and the invalid reason for the other two.
- [ ] Remote case, `target: 'github-actions'`, one `f.tick()`:
  - Drop `${D}_task_prompt.md` and `foo.lock_docs.md`.
  - `f.ghCalls()` deep-equals `[]`: no `run list` sync and no `workflow run`. This is the evidence that the refusal precedes `launch_remote_run`.
  - Both are archived `rejected_`, and there are exactly two `failed` notifications with the intake detail.
  - Neither branch has a registry record (read the registry file only if it exists) or a sibling working copy.
- [ ] Unresolvable case, `target: null`:
  - **Why a custom pass script.** The watcher refuses to *start* on a configuration missing `defaultBranch`, and the helper's `tick` sources `status` first. So run a case-local pass script through `runBash` (`./helpers/fixture.mjs`) with `f.watcherEnv()`, in the shape `cli/test/watcher-stall-reset-payloads.test.mjs` → `localStall` uses. The script sources `"$1" status`, defines the three probe overrides from the exported `DEFAULT_SANDBOX_PROBE`, `DEFAULT_KEEP_AWAKE_PROBE` and `DEFAULT_PLACEHOLDER_HOST_PROBE`, then copies a prepared configuration that lacks `defaultBranch` over `harness.config.json` (both paths passed as arguments), then runs `tick; wait`. `tick`'s own `hr_config_reset` then makes `hr_branch_is_protected` answer 2.
  - **Assertions.** Drop `feat_x_task_prompt.md`. Assert on the bytes on disk and the logs, never on the pass's exit status. The drop is archived as `rejected_\d+_feat_x_task_prompt.md`, the watcher log carries the unresolvable reason, there is one `failed` notification for `feat_x` with the intake detail, `f.prompts()` is empty, `${f.dir}-feat_x` does not exist, and there is no `feat_x` registry record.

**Verification:**

- `npm test --workspace cli -- test/watcher-remote-dispatch.test.mjs` passes, with the three new cases among those counted.
- Each new case would fail against the watcher as it stood before Task 2. The local case's `${f.dir}-${D}` and registry assertions and the remote case's empty `ghCalls()` are the checks a missing or late refusal breaks.

- **Deviations from plan:** The red-once check was run as one mutation of `cli/templates/scripts/autonomous-watcher.sh` → `process_inbox_file` (the intake `if` made `if false && …`), then reverted, with `npm test --workspace cli -- test/watcher-remote-dispatch.test.mjs` (`# pass 19`, `# fail 3`). All three new cases failed, each on `<fname> was not archived as rejected_ exactly once`. In the remote case `f.ghCalls()` was still `[]` under that mutation: the master drop made no `gh` call without the refusal either, so that case is held red by its archive assertion, not by its empty `ghCalls()` as the Verification bullet expected. The empty-`ghCalls()` assertion stays as the plan specifies.
