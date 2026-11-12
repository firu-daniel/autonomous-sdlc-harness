### Task 30 — Respell the remote-execution, run-control, issue-trigger and watcher documents

**Goal:** Make the four documents that describe remote runs and the watcher name the run titles `devscene <action> <branch>`, `devscene control …` and `devscene trigger …`, the step `Run DevScene`, the artifact `devscene-poll-state`, `devscene.config.json`, `devscene/` and the opt-out marker `.claude/devscene-no-offer`.

**Depends on:** Task 6, which titles runs that way and names the step and artifact. Task 8's `task-offer-check.sh` tests `.claude/devscene-no-offer`. Task 1's `init` writes `devscene.config.json`.

**Where this task stops.** Every run-title hit is renamed under row 12 of `## Context`'s spelling table, the Mermaid labels included (`RL["Run list<br/>devscene run / pause / stop …"]`, `poll for devscene pause`). The one prose use in `docs/watcher.md`, *"to GitHub for a harness run — locally `dispatch` …"*, is not a title and stays. No sentence says a name changed. A fenced command stays fenced.

### Targets

- `docs/remote-execution.md`, `docs/github-run-control.md`, `docs/github-issue-trigger.md`, `docs/watcher.md`

**Work:**

- [ ] `docs/remote-execution.md`: apply rows 1, 2, 10, 11 and 12, including *"The workflow's `run-name` is `devscene <action> <branch>`"*, every `devscene stop` / `devscene run` / `devscene pause` marker-run mention and the diagram labels.
- [ ] `docs/github-run-control.md`: apply rows 1 and 12 (`devscene control`, `devscene stop`, `devscene run`) and any other row it carries.
- [ ] `docs/github-issue-trigger.md`: apply rows 1 and 12 (*"The job looks up the `devscene run <branch>` run …"*).
- [ ] `docs/watcher.md`: apply rows 1, 2, 5 and 12 (*"`remote-run.sh save`'s `### devscene run <branch>` row"*, the `task-offer-check.sh` row's `.claude/devscene-no-offer`).

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-no-offer|harness-poll-state|Run the harness|harness <action>|harness [$][{][{]' -- docs/remote-execution.md docs/github-run-control.md docs/github-issue-trigger.md docs/watcher.md` prints nothing.
- `git grep -nE 'harness (run|pause|stop|control|trigger)( [^a-z ]|[^ a-z]| [a-z]+_)' -- docs/remote-execution.md docs/github-run-control.md docs/github-issue-trigger.md docs/watcher.md` prints only `docs/watcher.md`'s *"for a harness run — locally"* prose line.
