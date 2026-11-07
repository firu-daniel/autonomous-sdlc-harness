### Task 5 — Reframe the wrapper and outer-loop script headers: a linked worktree is a hand-made checkout, never a run copy

**Goal:** the headers and usage text of the shipped outer-loop scripts stop describing a linked worktree as a run copy or a legacy run, and describe the wrappers' worktree arm as what it now is — the main checkout's wrappers aimed at a linked worktree a person made by hand with `git worktree add`.

**Depends on:** Task 1 (the run-copy check refuses a linked worktree), Task 2 (the watcher has no `worktree` copy kind) and Task 4 (the sweep has no worktree arm). This task restates those facts in the scripts' own headers where they mention the layout; it changes no code.

**Where this task stops.** Comment and usage-text lines only, in the five scripts below; no executable line changes. The library's prose is Task 1's, the watcher's Task 2's, the sweep's Task 4's. The wrappers' worktree arm itself (`hr_wrapper_target_check_var`, `hr_wrapper_branch_var`, `hr_worktree_config_check_var`) stays, by the clarification's Option A.

### Targets

- `cli/templates/scripts/commit-on-branch.sh`
- `cli/templates/scripts/push-branch.sh`
- `cli/templates/scripts/refresh-branch.sh`
- `cli/templates/scripts/remote-run.sh`
- `cli/templates/scripts/restart-watcher.sh`

**Work:**

- [ ] `commit-on-branch.sh`: in the opening paragraph, *"A run in a run copy — a clone, or a legacy linked worktree — calls the MAIN checkout's copy"* becomes a run copy that is a clone, with a sentence that a session a person runs in a linked worktree they made by hand calls the main checkout's copy the same way. In **WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX**, *"A legacy worktree run is closed one step earlier"* and *"in a worktree it still fails on the record"* describe that hand-made linked worktree, keeping the G1, G2 and F1 citations. In Usage, `--repo` reads *"the main checkout, a run copy (a clone), or a linked worktree made by hand"*; the REPRO's worktree lines stay.
- [ ] `push-branch.sh` and `refresh-branch.sh`: apply the same reframing to every comment or usage line that names a linked worktree as a run copy or a run's working copy; the target check's worktree description (*"a worktree the main repository lists"*) and the `config.worktree` check's text stay, with "run" removed where it qualifies the worktree.
- [ ] `remote-run.sh` (the mirror paragraph, *"its `worktree` (a clone or a legacy …)"*) and `restart-watcher.sh` (*"legacy worktree"* in the resume paragraph and in the SAFETY-related list, *"run copy (a clone, or a legacy worktree)"*): a run copy is a clone; drop the legacy alternative. In `remote-run.sh`, state that a linked-worktree mirror is not used (Task 1's copy check refuses it).
- [ ] Find every site with `grep -n -i -E 'legacy|worktree run|run copy.{0,40}worktree|worktree.{0,40}run copy' <file>` on each target, and leave alone the sentences about git's legacy `.git/remotes` / `.git/branches` files, which are unrelated.

**Verification:**

- `git diff -- cli/templates/scripts/commit-on-branch.sh cli/templates/scripts/push-branch.sh cli/templates/scripts/refresh-branch.sh cli/templates/scripts/remote-run.sh cli/templates/scripts/restart-watcher.sh` changes only lines that start with `#` (after leading spaces).
- `grep -n -i -E 'legacy (linked )?worktree|worktree run' <each target>` prints nothing.
- Each changed script still parses: `bash -n <file>` exits 0 for each.
