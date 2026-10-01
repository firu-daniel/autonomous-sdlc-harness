### Task 11 — Add the `resume` and `clear` comment commands

**Goal:** `@sdlc-harness resume` continues a paused run, and `@sdlc-harness clear` releases a park-loop hold. Each sends exactly the dispatch the local relay sends (goal 4, acceptance 4):

- `/autonomous-sdlc-harness:branch-resume` sends `resume: pause` for a `paused` run;
- for a `park_loop` run it sends the same dispatch plus `park_loop_clear`, once the user confirms (`docs/remote-execution.md` → `## 1.`, the `branch-resume` row; `### The park-loop guard`).

On GitHub, typing `clear` is the confirmation.

**Depends on:**

- Task 10's `control` verb and these names in `remote-run.sh`:
  - `control_state_var <branch>` sets `CS_STATE`, `CS_REASON`, `CS_ENGINE`, `CS_OPEN`, `CS_DETAIL`, `CS_URL` and `CS_RUN_STATUS` from a child `fetch`. It returns 1 with `CS_ERR` set.
  - `control_reply <exit> <text>`.
  - `CONTROL_BRANCH`, `CONTROL_NUMBER`, `CONTROL_ACTOR` and `CONTROL_VERB`.
  - The verb arms dispatch on `CONTROL_VERB`, and a known verb with no arm gets the verb-list reply.
- Task 3's `forge_issue_var`, `forge_pr_var`, `forge_recognised` and `forge_set_state <number> <state>`.
- The existing `remote-run.sh dispatch <branch> --engine <task|user_review|docs> --resume pause [--park-loop-clear] --chain 0 [--repo <root>]`, which answers 0 when sent, 2 when refused, and 3 when `gh` failed.

**Where this task stops.** `answer` is Task 12's. On a `park_loop` run, an `answer` is refused there and pointed at `clear`. That is this task's verb and the only way a GitHub reader releases the hold.

### Targets

- `cli/templates/scripts/remote-run.sh` — the `resume` and `clear` arms of `control`, and the header's `control` paragraph.
- `cli/test/remote-control.test.mjs` — their cases.

**Work:**

- [ ] **`resume`**: `control_state_var`. Then, by `CS_STATE`:
  - `paused`, with any `CS_REASON`, `expired` and `killed` included — the local route resumes those the same way, from the committed ledger (`docs/remote-execution.md` → `## 4.`) — runs `remote-run.sh dispatch <branch> --engine "$CS_ENGINE" --resume pause --chain 0 --repo "$root"`.
  - `park_loop` is refused, pointing at `@sdlc-harness clear`.
  - `parked` is refused, pointing at `@sdlc-harness answer <n>` with the open indexes from `CS_OPEN`.
  - `running` is refused as already running.
  - `completed`, `failed` and `none` are refused, naming the state. A finished run is continued by a review requesting changes on its pull request, or by re-applying the trigger label to its issue.
- [ ] **`clear`**: with `CS_STATE` `park_loop`, run `remote-run.sh dispatch <branch> --engine "$CS_ENGINE" --resume pause --park-loop-clear --chain 0 --repo "$root"`. Any other state is refused, saying there is no park-loop hold to clear and naming the state.
- [ ] **Shared by both arms**:
  - An empty `CS_ENGINE` is refused rather than guessed, because `harness-run.yml`'s `engine` input defaults to `task`, the same reason `hr_github_resume_route` gives. The reply names the **Run workflow** form as the way on (`docs/remote-execution.md` → `### Working a run from GitHub alone`).
  - A `control_state_var` failure is a reply naming `CS_ERR`, and exit 3.
  - On a dispatch exit of 0: reply, for `resume`, `Resume requested by @<login>: \`<branch>\` continues from its committed ledger.`, and for `clear`, `Park-loop hold on \`<branch>\` cleared by @<login>; the run resumes from its committed ledger.` Then call `forge_set_state running` on the run's issue and recognised pull request. A `resumed` comment follows from the job itself (Task 7).
  - A dispatch exit of 2 or 3 is a reply quoting its last stderr line, with exit 2 or 3.
- [ ] **The header**: the `control` paragraph gains both verbs, the state each accepts, and the engine rule.
- [ ] **`remote-control.test.mjs`**, with a stub answering `run list` with a completed `harness run feat_x` run and `run download` with a bundle whose `status.json` the case sets:
  - `paused` / `user` with engine `task` → `workflow run … -f engine=task -f resume=pause -f chain=0`, a reply naming `@alice`, and an `sdlc-harness: running` label add;
  - `paused` / `expired` → dispatched the same way;
  - `park_loop` with `resume` → a reply naming `clear`, and no `workflow run`;
  - `park_loop` with `clear` → the same dispatch plus `-f park_loop_clear=true`;
  - `parked` with `resume` → a reply naming `answer` and the open index;
  - an empty engine → a reply naming the Run workflow form, and no `workflow run`;
  - `clear` on a `paused` run → a reply, and no `workflow run`.

**Verification:**

- `npm test -- test/remote-control.test.mjs` from `cli/` passes.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `git grep -n "park-loop-clear" -- cli/templates/scripts/remote-run.sh` has its `control` hits only in the `clear` arm: no other comment command clears a hold.
