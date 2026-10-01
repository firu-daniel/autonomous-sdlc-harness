### Task 21 — Restate the forge coupling and the pull-request boundary in the plugin's flow documents

**Goal:** The plugin's two flow documents state the forge coupling as **partial** and the pull request as entirely the operator's. After this branch both are wrong in the same direction. They must say:

- the coupling is delivered for GitHub;
- **the flow itself** still never opens, pushes or merges a pull request — the session's boundary is unchanged, and the autonomous forks' *"open or push a pull request"* prohibitions stay true;
- with `forge` `github` on a run that executes on GitHub, the run **workflow** opens a draft pull request after the run has pushed, out of band of the flow;
- a run can be steered from GitHub by comments and reviews, beside the local commands and never instead of them.

**Depends on:** the decisions of Tasks 6, 10 and 13, restated so this file stands alone:

- `remote-run.sh deliver`, a step of `harness-run.yml` after the push, opens a draft pull request from the run's branch to the default branch, naming the issue that started it as a plain mention.
- `remote-run.sh control`, in the new workflow `harness-control.yml`, obeys `@sdlc-harness answer [<n>]`, `pause`, `resume`, `stop` and `clear` comments from a collaborator with write access. It turns a review requesting changes on a pull request from a harness branch into the next user-review round, through the same `remote-run.sh review` the local command uses.
- `remote-run.sh report` posts lifecycle comments and keeps one `sdlc-harness: <state>` label on the issue and the pull request.

**Where this task stops.** The adopter-facing document of record is the harness repository's `docs/github-run-control.md` (Tasks 23–25), which these documents cite by repo-relative path and never restate. No heading is renamed: `plugin/docs/README.md`'s `AUTONOMOUS_FLOW` citer sweep keys on them. No command file changes: every local command keeps its exact behaviour (goal 7).

### Targets

- `plugin/docs/AUTONOMOUS_FLOW.md` — the opening paragraph, `## The wiring table`'s *Remote execution* row, `## Drop a user review (fix cycle)`, `## Answer a clarification (park-and-ask)`, `## Pause / resume a run`, `## Output guarantee` and `## Out of scope in this release`.
- `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` — the *"What would you do differently, or what is next?"* answer.

**Work:**

- [ ] **The opening paragraph**: keep *"No entry point merges, pushes to a protected branch, or opens a pull request"*, which stays true of the flow. Add one sentence: where the forge coupling is on, the run's GitHub workflow opens a draft pull request after the run, which is not the flow and not an entry point.
- [ ] **The wiring table's *Remote execution* row**:
  - name the fourth workflow, `harness-control.yml`, written beside `harness-trigger.yml` when `forge` is `github`;
  - name `remote-run.sh`'s `control`, `report` and `deliver` verbs with one clause each;
  - keep the harness repository's `docs/remote-execution.md` as the format of record, and add `docs/github-run-control.md` beside it.
- [ ] **The three operator-facing sections** each gain one closing sentence naming the GitHub-side equivalent, beside the unchanged local command:
  - a review that requests changes on the run's pull request, for a user review;
  - an `@sdlc-harness answer <n>` comment, for an answer;
  - an `@sdlc-harness pause`, `resume`, `stop` or `clear` comment, for pausing, resuming or stopping a run.

  Each sentence cites `docs/github-run-control.md` and says both routes work for the same run.
- [ ] **`## Output guarantee`**: the first paragraph keeps *"The flow never merges, never pushes to a protected branch, and never opens or pushes a pull request."* Its second sentence becomes: the operator does the final hands-on review and merges; where the forge coupling is on, the run's GitHub workflow has already opened a draft pull request out of band, and otherwise the operator opens one.
- [ ] **`## Out of scope in this release`** and the whiteboard:
  - The *"Forge coupling is partial."* bullet becomes a GitHub-only bullet. The coupling — the issue trigger, comment commands, review rounds, lifecycle comments, state labels and the draft pull request — ships for GitHub, gated on `forge` `github` and `execution.target` `github-actions`. `gitlab` writes nothing. The **Run workflow** form stays as a fallback.
  - Keep its sentence that the trigger and control feed the **same** engines through the same placement.
  - The whiteboard's *"a partial forge coupling — … while file drops or the **Run workflow** form still steer it"* is restated to match: an opted-in run may be started from an issue, steered by comments and reviews, and delivered as a draft pull request.

**Verification:**

- `git grep -n -i "partial forge coupling\|forge coupling is partial" -- plugin` finds nothing.
- `git grep -n "never opens or pushes a pull request\|open or push a pull request" -- plugin` still finds `AUTONOMOUS_FLOW.md`'s `## Output guarantee` sentence and the three autonomous forks' prohibition lines: the flow's boundary is unchanged.
- `git grep -n "^## " -- plugin/docs/AUTONOMOUS_FLOW.md` lists the same headings as before this task: no citer is stranded.
