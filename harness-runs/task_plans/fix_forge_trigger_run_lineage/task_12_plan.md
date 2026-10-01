### Task 12 — Add Gate 12 (xiii) leg (d) and record what this branch changed for round 5's findings in `docs/development.md`

**Goal:** Give Gate 12 → (xiii) a leg that exercises the lineage fixes against a real repository:
- re-labelling an issue whose title folds to a name with run history;
- starting an explicitly reused, deleted name.

Each half checks the restore line and the comment URL. Also append to the round 5 record what this branch changed for each of its three findings, leaving the observed text untouched.

**Depends on:** these tasks, whose observable outputs the leg checks.
- **Task 1.** The job's `Restore the previous job's state` step logs `remote-run.sh: skipped <n> finished run(s) of <branch> from before its current lineage` and `remote-run.sh: no previous bundle for <branch>; this is its first job`, and no `placed <n> planning file(s)` line, for a recreated branch.
- **Task 2.** The comment names the run whose `headSha` is the pushed commit.
- **Task 4.** A title folding to a name with run history derives the next free suffix.
- **Task 5.** `remote-github` carries the trigger answers on every outcome, which makes (xiii)'s existing setup condition satisfiable without every remote secret set.
- **Task 8.** `branch-pause` fetches into `<stateDir>/scratch/branch-pause-<branch_fold>/` and `discard`s it. `<branch_fold>` is Task 7's rule: the branch with every character outside `A-Za-z0-9_-` replaced by `_`.

### Targets

- `docs/development.md`:
  - Gate 12 → **Round 5** → the paragraph "All three are carried to a follow-up fix.";
  - Gate 12 → **(xiii)** → the main leg's first pass bullet ("within the lookup bound, …");
  - a new **(d)** leg after **(c) A local maintainer's command acts on the run.** and before **Teardown.**;
  - leg (c)'s pass condition, for the scratch directory.

**Work:**

- [ ] **Round 5 record**: after "All three are carried to a follow-up fix.", add one sentence per finding naming what `fix_forge_trigger_run_lineage` changed:
  - finding 1: the `headSha` lineage bound in `restore`, the `headSha` match in the comment lookup, and run history counted as taken;
  - finding 2: the trigger answers on every `remote-github` outcome;
  - finding 3: the scratch directory removed by `remote-run.sh discard`.

  Each sentence ends with *not yet re-observed; leg (d) records it*. Do not edit the findings' own text. It is the round's record (`.claude/context/conventions.md` → `## Documents of record`).
- [ ] **Main-leg bullet**: "a `harness run <slug>` run URL" becomes "the URL of the `harness run <slug>` run whose `headSha` is `origin/<slug>`'s tip".
- [ ] **Leg (c)**: add to its pass condition that no `<stateDir>/scratch/branch-pause-<slug>/` directory remains after the command, and nothing else new under `<stateDir>/scratch/`. `<slug>` is the trigger's derived name, which already holds only characters the fold keeps, so its fold is `<slug>` itself; say so in one clause, citing the fold rule in `<stateDir>/scratch/README.md`.
- [ ] **Leg (d), "A name with run history."** Run it after leg (a), while `<slug>` and `<slug>_2` both have runs. Delete `<slug>_2`'s remote branch with `git push --no-verify origin --delete <slug>_2`. Each command goes in its own fenced block, one command per line, per the lessons ledger's adopter-facing rule.
  1. Open a third issue with the same title and apply the label. Passes when its comment names `<slug>_3` and a run whose `headSha` matches `origin/<slug>_3`. Read it with `gh run list --repo <owner>/<scratch-repo> --workflow harness-run.yml --branch <slug>_3 --json databaseId,headSha,url` and `git ls-remote origin <slug>_3`.
  2. From the machine, start the deleted name explicitly with `bash <scriptsDir>/remote-run.sh start <slug>_2 --prompt-file <file>`. Passes when that job's `Restore the previous job's state` step logs the `skipped` line and `this is its first job`, logs no `placed … planning file(s)` line, and its session does not say it is resuming a plan draft.

  Record the comment, both `gh run list` outputs and the restore step's log verbatim. Read the restore log with `gh run view <run id> --repo <owner>/<scratch-repo> --log`.
- [ ] Amend (xiii)'s opening sentence to say that the gate also settles the `headSha` row that `docs/github-issue-trigger.md` → `## 7.` and `docs/remote-execution.md` → `## 6.` now carry. Amend **Teardown.** to also delete the leg (d) issue and `<slug>_3`.

**Verification:**

- `git grep -n '\*\*(d) A name with run history' -- docs/development.md` shows the new leg between leg (c) and **Teardown.**
- Every command the leg tells the reader to run sits alone in its own fenced block: read the leg and find no inline command and no block holding two.
- The quoted log lines are byte-identical to the strings `cli/templates/scripts/remote-run.sh` prints. Check with `git grep -nF` for each across both files: each must match in both.
- The round 5 finding sentences 1–3 are unchanged: `git diff` of `docs/development.md` touches none of the lines beginning `1. **A run whose branch name`, `2. \`doctor --check-github\`` and `3. \`/autonomous-sdlc-harness:branch-pause\``.

**Deviations from plan:**
- The Round 5 sentences for findings 2 and 3 end *not yet re-observed; (xiii)'s setup records it* and *…; leg (c) records it*, not *leg (d) records it*: leg (d) as specified exercises only finding 1's fixes, while the `remote-github` answers are read in (xiii)'s setup and the scratch-directory check was added to leg (c)'s pass condition. Pointing all three at leg (d) would name a leg that never observes them.
- Leg (d) step 2 adds a `gh run list … --branch <slug>_2` block so the reader has the `<run id>` for `gh run view`; this is the second of the "both `gh run list` outputs" the record asks for. "Then three legs" became "Then four legs".
- The "byte-identical" check uses the fixed parts of each line (`remote-run.sh: skipped `, `finished run(s) of `, ` from before its current lineage`, `remote-run.sh: no previous bundle for `, `; this is its first job`); `git grep -cF` matched them in both `docs/development.md` and `cli/templates/scripts/remote-run.sh`. The variable parts are `<n>` / `<slug>_2` where the script prints `$LINEAGE_SKIPPED` / `$branch`.
