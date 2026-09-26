### Task 30 — Describe remote dispatch and `remote-run.sh` in `docs/watcher.md`

**Goal:** Keep the watcher's document of record true now that the watcher can dispatch a run instead of launching it, relays the user's answers, resumes and pauses for such a run, and leaves it alone otherwise.

**Depends on:** Tasks 11–13 and 5, restated: with `execution.target` `github-actions` at the moment of a drop, the watcher prepares the drop as today and then dispatches it with `remote-run.sh dispatch`, writing a record with `execution: github-actions` and no `pid`; a remote review drop is fast-forwarded, committed as `chore: add user review for <branch>` and pushed before the dispatch; for a remote record the kill switch still defers a start but the usage hold, the cap and the machine lane are skipped, and a still-`running` remote record makes a drop a duplicate after a `sync`; the resume passes dispatch `resume: answer` / `resume: pause` for a remote record, a new pass relays a mirror's `PAUSE` as `action: pause`, and the reconcile pass, `running_count`, the stall watchdog and the usage gate skip remote records; `restart-watcher.sh` lists remote records without refusing over them. `remote-run.sh` is a new outer-loop script — not agent-invocable, no profile entry, withheld by basename by the script-allowlist guard (Task 21), run by the watcher, the remote job and a person — and it reads and writes the run registry (`sync`, `stop`). The job itself runs `autonomous-watcher.sh job` (Task 9), whose design is `docs/remote-execution.md`'s (Task 28).

### Targets

- `docs/watcher.md` — §1 (the opening paragraph, steps 3, 5, 6 and 7, the **The three patterns** table's `<branch>_review[_<n>].md` row, and the status paragraph naming the registry's readers; register rows 45, 54 and 72), §2 (the table and **Why only the `yes` rows carry a profile entry…**; register rows 19 and 20), §4 and §6 (register row 54).

**Work:**

- [ ] §1: the opening keeps its local statement and adds that with `execution.target` `github-actions` the next poll pass dispatches the drop to a GitHub Actions job instead, pointing at `docs/remote-execution.md`; step 3 says which guards a remote drop skips and why (the job gates itself); step 5 says a review drop is committed too, for a remote run only, and why; the **The three patterns** table's review row, whose last cell reads "— **not committed**, round suffix intact", says not committed for a local run and committed as `chore: add user review for <branch>` for a remote one; step 6 says a remote drop is dispatched through `remote-run.sh`, not launched; step 7 says a remote run's exit is classified in the job by the same code; the registry paragraph adds `remote-run.sh` to its readers and the `execution` field to what a record may carry — the status vocabulary itself is unchanged.
- [ ] §2: a table row for `remote-run.sh` (what it does; who runs it: the watcher, the remote job, an operator; profile entry `no` — also **withheld**); in **Why only the `yes` rows…**, the count of withheld `no` rows and the list of scripts a dispatched agent cannot reach as a command both gain it.
- [ ] §4: one paragraph saying which of this section's mechanisms act on a remote run and which do not: the usage gate, the stall watchdog and the park-loop guard run **in the job** (the watcher's own code under `job`), while the local passes skip remote records; a remote run's pause and resume reach it as relayed dispatches; the machine lane stays local.
- [ ] §6: a sentence that remote execution adds GitHub-side steps only the adopter can take and that `doctor`'s `remote-execution` check reports whether they are owed, pointing at `docs/remote-execution.md`; and that the local daemon is still needed for a remote run's start and relays, but not while the run executes.

**Verification:**

- Re-run the story index's derivation entries 2, 3 and 6 and confirm `docs/watcher.md`'s hits are the edited sentences.
- Every script name, field and flag matches the source; commands sit in fenced blocks, one per line; no line number is written.
