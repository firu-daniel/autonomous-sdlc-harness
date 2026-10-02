### Task 26 — Bring `docs/github-issue-trigger.md` level with the new label and run control

**Goal:** The trigger's document of record states the new default label `sdlc-harness`, and the upgrade path for a repository already using `harness` (acceptance 9). It also states the trigger's three new behaviours — the hidden line in its comments, the first state label it sets, and the actor check `control` now shares — and replaces `## 8. What this does not do yet` with where run control now lives.

**Depends on:**

- Task 2's upgrade rule, restated:
  - the default is `sdlc-harness`, and `HARNESS_TRIGGER_LABEL` still overrides it;
  - a workflow written by the previous release falls back to `harness` and passes no label to the script, which then also accepts `harness`, so such a repository keeps `harness` until it re-renders;
  - `init --force` replaces `harness-trigger.yml` and the scripts together, each after a `.bak`, and from then on the default is `sdlc-harness`;
  - setting `HARNESS_TRIGGER_LABEL` to `harness` keeps the old name under either.
- Task 18's report: `doctor --check-github` asks about the label the committed workflow falls back to when the variable is unset, and adds a note naming the re-render when that fallback is `harness`.
- Task 5's changes:
  - every trigger comment carries `<!-- sdlc-harness event=started|refused branch=<branch> -->`;
  - a start sets `sdlc-harness: running` on the issue after removing the trigger label;
  - the labeller check is `authorise_actor`, shared with `control`.
- Task 16, under which `init` also writes `harness-control.yml`.
- Task 25's `docs/github-run-control.md` and its `## The GitHub entry point`.

**Where this task stops.** `docs/remote-execution.md`'s rows are Tasks 27 and 28's. The run-control design is `docs/github-run-control.md`'s, which this document links to and never restates.

### Targets

- `docs/github-issue-trigger.md` — the `**Who reads this:**` paragraph's scope, `## Turning it on, in short`, `## 1.` steps 2 and 6, `## 3.`, `## 5.`, `## 7.` and `## 8.`

**Work:**

- [ ] **`## Turning it on, in short`**:
  - Step 2 says `init` also writes `.github/workflows/harness-control.yml`, which turns comments and reviews into harness actions ([`github-run-control.md`](github-run-control.md)). The earlier-release paragraph adds that scripts written before this release have no `control`, `report` or `deliver` verb either.
  - Step 3's `git add` names both forge workflows.
  - Step 4's fenced command becomes `gh label create sdlc-harness`.
  - Step 5 says *`sdlc-harness` when unset*, and that the six `sdlc-harness: <state>` labels are the harness's own and are not the trigger label.
  - Step 6 names what `doctor --check-github` now adds: the control workflow, the pull-request setting, and the label the committed workflow falls back to.
- [ ] **A new paragraph under `## Turning it on, in short`, `**A repository already using \`harness\`.**`**, stating Task 2's rule in full and Task 18's report. It ends with the two ways on, each command in its own fenced block — re-render with `init --force`, or keep the name with `gh variable set HARNESS_TRIGGER_LABEL --body harness` — and what `--force` also replaces (a pointer to [`remote-execution.md`](remote-execution.md) → `### Upgrading`).
- [ ] **`## 1.`**:
  - Step 2 says the job's filter is `HARNESS_TRIGGER_LABEL`, else `sdlc-harness`, and that the workflow passes the label it matched to the script.
  - Step 6, *The comment and the label*: every comment ends with a hidden line naming the branch, which is how a later `@sdlc-harness` comment on the issue finds its run. A start sets `sdlc-harness: running` in the same step that removes the trigger label, and a refusal sets none. Replace *"The comment and the removal are the only writes the trigger makes to the issue"* with the comment, the removal and that one label.
- [ ] **`## 3.`, `## 5.`, `## 7.`**:
  - `## 3.` gains one sentence: the same check now governs every comment command and review ([`github-run-control.md`](github-run-control.md) → `## 6.`).
  - `## 5.`'s *"**Without one**, a run is worked from GitHub alone"* becomes: by comments and reviews ([`github-run-control.md`](github-run-control.md) → `## The GitHub entry point`), with the **Run workflow** form still available ([`remote-execution.md`](remote-execution.md) → `### Working a run from GitHub alone`).
  - `## 7.` gains a row: the legacy label is accepted only when the workflow passes no label — driven by a `gh` stub, not observed on GitHub; if wrong, an old workflow's `harness` is ignored and `init --force` is the remedy.
- [ ] **`## 8.`** is retitled `## 8. What this does not do`. Its list of five follow-ups becomes one sentence: pull-request reviews, parks over comments, comment commands, lifecycle comments, state labels and the draft pull request are delivered, in [`github-run-control.md`](github-run-control.md). Its last line, *"No adapter exists beyond GitHub's two events"*, stays. The `**Who reads this:**` paragraph's scope names the label and its upgrade path among what it owns.

**Verification:**

- `git grep -n "feat_forge_run_control" -- docs/github-issue-trigger.md` finds nothing.
- `git grep -n "label create harness" -- docs/github-issue-trigger.md` finds nothing.
- `git grep -n -E '^## ' -- docs/github-issue-trigger.md` lists the same numbered sections as before, with only `## 8.`'s title changed. No other document cites that heading: `git grep -n "What this does not do yet" -- docs README.md plugin cli` finds no citer once this task lands.
- Every command in the new paragraph sits in its own fenced block.
