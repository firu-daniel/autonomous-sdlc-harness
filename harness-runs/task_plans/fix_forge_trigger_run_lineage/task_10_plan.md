### Task 10 — State the lineage bound, the scratch directories and the `remote-github` outcome in `docs/remote-execution.md` and `docs/cli.md`, and add `discard` to `docs/watcher.md`'s `remote-run.sh` row

**Goal:** Make the three developer documents state what this branch built:
- `restore` takes state only from the branch's current lineage, and the document says how and what it logs;
- the commands' GitHub route fetches into a named scratch directory removed by `discard`, and `docs/watcher.md`'s script table lists that verb and its `branch-*` callers;
- `remote-github` reports the trigger answers on every outcome;
- the `headSha` reliance is recorded as not yet verified on a real repository.

**Depends on:** these tasks, whose facts this one restates.
- **Task 1.** The bound: a finished `harness run <branch>` run is a restore candidate only when its `headSha` is listed by `git rev-list refs/remotes/origin/<defaultBranch>..HEAD` in the job checkout. When that list cannot be formed, selection is unbounded and the job logs `the lineage of <branch> is not bounded (<why>); every finished run of it is a candidate`. Excluded runs are logged as `skipped <n> finished run(s) of <branch> from before its current lineage`. The `--resume answer` refusal names the current lineage.
- **Task 5.** The trigger confirmation is carried on `pass`, `warn` and `fail`. Under `--check-github`, the `forge` line points at `remote-github`.
- **Task 7.** `remote-run.sh discard <dir>` removes only a directory strictly inside `<state_dir>/scratch/`, exiting 2 on anything else.
- **Tasks 8–9.** The four commands fetch into `<state_dir>/scratch/<command>-<branch_fold>/` and `discard` it on every path; a leftover stops the command. `<branch_fold>` is Task 7's rule: the branch with every character outside `A-Za-z0-9_-` replaced by `_`, so the name is one path segment `discard` always accepts, and two branches folding alike are safe because the leftover check stops the second.

### Targets

- `docs/remote-execution.md`:
  - `## 1. The lifecycle of a remote run` step 4;
  - **What each local command does for a remote run.**;
  - `## 4.` → **Planning drafts cross the job boundary in the bundle.**;
  - `## 4.` → **Central state.**;
  - `## 6. What is not verified here`'s table.
- `docs/cli.md`: the `remote-execution` and `remote-github` bullet's closing sentence ("a clean pass adds both answers").
- `docs/watcher.md`: the `remote-run.sh` row of the script table (its local verb list and its callers column).

**Work:**

- [ ] **`docs/remote-execution.md` → Central state.** Add the lineage bound after the job-restore sentence, in the document's decision–reason style. Cover:
  - why the bound is needed (Gate 12 round 5, finding 1, cited as [`development.md`](development.md) → Gate 12 → Round 5);
  - the rule and the two log lines, quoted;
  - why `headSha` and not a timestamp or the fork point (from the story index's `## Context`);
  - that the bound holds across a pause, a chain, a user-review round and `--resume answer`;
  - the unbounded fallback;
  - that `sync`, `fetch`, `status`, `list` and `review` read the newest run and are not bounded.

  In **Planning drafts cross the job boundary in the bundle.**, add one clause: drafts are placed only from a bundle of the current lineage. In `## 1.` step 4, qualify "the previous job's state bundle" with "of the branch's current lineage", with a pointer to §4.
- [ ] **`docs/remote-execution.md` → What each local command does for a remote run.** Replace "downloads the newest bundle into a temporary directory" with the scratch directory `<stateDir>/scratch/<command>-<branch_fold>/`. State the fold in one clause: the branch with every character outside `A-Za-z0-9_-` replaced by `_`, so a `feat/x` branch never makes two directory levels. Say that the command creates the directory, removes it with `remote-run.sh discard` on every path, and stops on a leftover. Cite the round 5 finding as the reason.
- [ ] **`docs/remote-execution.md` → `## 6.` table.** Add one row in the table's four columns:
  - **Behaviour:** a `workflow_dispatch` run's `headSha` in `gh run list` is the commit the dispatched ref pointed at when it was dispatched.
  - **What rests on it:** `restore`'s lineage bound, and the trigger comment's run lookup.
  - **Source:** not retrieved in this branch, because unattended runs have no web access; Gate 12 (xiii) leg (d) records it.
  - **If it is wrong:** an own-lineage run is excluded, so `restore` logs a first job, or `--resume answer` refuses naming the lineage, and the trigger comments the filtered run list. Neither outcome restores another lineage's state.
- [ ] **`docs/cli.md`**: replace "and a clean pass adds both answers" with a statement that both trigger answers appear on every `remote-github` outcome, and that under `--check-github` the `forge` line points at `remote-github` rather than at the flag.
- [ ] **`docs/watcher.md` → the `remote-run.sh` row.** In the description cell, add `discard`, "which removes one of the commands' directories under `<state_dir>/scratch/` and nothing outside it", to the local verbs. In the callers cell, add `discard` to "a `branch-*` command, for `fetch`, `list`, `pause`, `dispatch` and `review`". Keep the row's other cells, including "no — also **withheld** by the script-allowlist guard", unchanged.

**Verification:**

- `git grep -nE 'temporary directory' -- docs/remote-execution.md` shows no sentence describing the local commands' `fetch` directory as temporary. Any hit that remains is the no-record `status`'s own `mktemp -d` directory, which `remote-run.sh` still uses internally.
- `git grep -n 'clean pass adds both answers' -- docs/cli.md` prints nothing.
- The two quoted log lines in **Central state.** are byte-identical to the strings `cli/templates/scripts/remote-run.sh` prints. Check with `git grep -nF` for each quoted string across `docs/remote-execution.md` and that script: both files must match.
- The new §6 row has four cells, like its neighbours.
- `git grep -nE '^\| .remote-run\.sh. \|' -- docs/watcher.md` prints a row naming `discard` in both its description and its callers cell, and with the same number of cells as before.

**Deviations from plan:**
- The unbounded log line is quoted with `<reason>`, the placeholder `remote-run.sh`'s header uses for `$LINEAGE_WHY`, not the Depends-on bullet's `<why>`.
- Neither log line is byte-identical end to end in the script: its code interpolates `$LINEAGE_SKIPPED` / `$branch` / `$LINEAGE_WHY`, and its header wraps the skipped line. The `git grep -cF` check was run on the fixed fragments (`finished run(s) of`, `from before its current lineage`, `not bounded (<reason>); every finished run of it is a candidate`), each matching both files.
- The new §6 row cites Gate 12 (xiii) leg (d), which `docs/development.md` does not carry yet; Task 12 adds it.
