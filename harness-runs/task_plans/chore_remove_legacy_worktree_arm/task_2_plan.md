### Task 2 — Watcher: drop the `worktree` copy kind, skip a parked or paused record with no `copy_kind`, and seed test records as clones

**Goal:** `autonomous-watcher.sh` treats only a clone as a local run copy: no `copy_kind` default, no `worktree`-kind per-run profile, and a parked or paused record with no `copy_kind` is skipped with a one-line note instead of resumed.

**Depends on:** Task 1, which makes `hr_run_copy_check_var` refuse a linked worktree (`HR_RUN_REFUSAL` names it). This task relies on that for the paths it does not skip — the review-drop reuse and the stall watchdog's recovery call the check and already route its refusal (`fail_before_launch`, a given-up run); this task adds no code there.

**Where this task stops.** The watcher and its tests only. The sweep is Task 4's; the review-drop and stall payload suites' legacy cases are Task 3's; header prose of other scripts is Task 5's.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh`
- `cli/test/helpers/watcher.mjs` — `seedRecord`'s default record.
- `cli/test/watcher-run-profile.test.mjs` — the legacy case, rewritten.
- `cli/test/run-copy-migration.test.mjs` — deleted.

**Work:**

- [ ] **The copy kind.** In `spawn_engine`, outside job mode, drop `[ -n "$copy_kind" ] || copy_kind="worktree"`; when the record's `copy_kind` is not `clone`, `spawn_refuse` with a sentence stating the record carries no `clone` `copy_kind` and is not launched — a backstop, since every entry that could reach it with such a record skips first or is refused by the copy check. The placeholder-host launch check then runs on every local launch (drop its `if [ "$copy_kind" = "clone" ]`). In `run_profile_entries`, accept `clone` only (return 4 otherwise) and drop the `else` arm that emits `<copy>/.git	file	deny`; `run_profile_render`'s rc-4 refusal reads that the kind is not `clone`. **Keep** the loop that emits the `.git` pointer of every other linked worktree `git worktree list` names, and reword its comment bullet: those are checkouts a person made by hand. Update both functions' header comments (the `(`clone` or `worktree`)` and *"on a legacy worktree"* lines).
- [ ] **The skip.** Add one helper, e.g. `record_has_no_copy_kind <branch>`, true outside job mode when the record's `copy_kind` is empty. Call it in `resume_parked_run` and `resume_paused_run`, right after the `record_is_remote` return: return 1 (nothing to do), leaving status, files and channel untouched, and log once per watcher process per branch — keep a newline-delimited list of noted branches in a global — the line `skipping '<branch>': its run-registry record carries no copy_kind — a run made as a linked worktree before the clone layout, which this watcher no longer resumes; finish or remove it by hand`. Nothing writes the registry for such a record and nothing prunes it.
- [ ] **Header prose.** Reword the comments that describe a legacy linked worktree as a supported run copy — the ANCHORS paragraph (*"or, for a run started before clones, a legacy linked worktree, supported until none is left"*), the Anchors block (*"or a legacy linked worktree for a run started before clones"*), and the comment near `log_stopped_background_tasks` (*"holds for a clone and a legacy worktree alike"*) — and add one sentence to THE PER-RUN PROFILE or the resume headers stating the skip. Find every site with `grep -n -i -E 'legacy|worktree run|before clones' cli/templates/scripts/autonomous-watcher.sh` and leave the unrelated `legacy single-index` sentence alone.
- [ ] **The fixture.** `cli/test/helpers/watcher.mjs` → `seedRecord`: the default record gains `copy_kind: 'clone'` (a case's own `fields` still override it). Its fixture copy is the main checkout itself, which the copy check accepts as `main`; without this, every suite resuming a seeded record would hit the new skip. State the reason in the helper's doc comment.
- [ ] **The tests.** In `watcher-run-profile.test.mjs`, replace *"a parked legacy worktree run, resumed, carries its own .git pointer and no clone .git path"* with two cases: a **parked** record with no `copy_kind` (seed it with `copy_kind: undefined` or delete the key), its `worktree` a linked worktree made with `git worktree add` and an answered pair in its channel, and a **paused** one with a `RESUME` in its state directory — after one `tick`, no session was launched (`settingsArg()` empty), the status is unchanged, and the watcher log holds exactly one `carries no copy_kind` line for the branch; then a second pass in the **same** process (one `runBash` running `tick; wait; tick; wait`, as the suite's helper form allows) adds no second line. Keep *"another live linked worktree's .git pointer is in the clone run's per-run copy"* as it is. Delete `cli/test/run-copy-migration.test.mjs`.

**Verification:**

- `watcher-run-profile.test.mjs` passes — the test file this task edits — including the two skip cases and the other-worktree pointer case.
- `grep -n -E 'copy_kind="worktree"|clone \| worktree' cli/templates/scripts/autonomous-watcher.sh` prints nothing.
- `cli/test/run-copy-migration.test.mjs` no longer exists.
- **Deviations from plan:** The "second pass in the same process adds no second line" check cannot read the log between two passes of one `runBash`, so each skip case asserts one line after the first `tick` (its own process), then runs a second process doing `tick; wait; tick; wait` and asserts the count is exactly 2 — one line for that process's two passes. `docs/watcher.md` still cites the deleted `cli/test/run-copy-migration.test.mjs` in its legacy-worktree-run paragraph; that file is outside this task's targets and the `cli` layer (Task 5's legacy docs).
