### Task 21 — Bring `docs/remote-execution.md` level with the trigger, adopt and the GitHub-only route

**Goal:** Update the remote run's design of record where this branch changed what it states (scope register rows 14–16, 25, 26, 46–48). The changes:

- the local commands adopt a run started on GitHub before they sync;
- a remote-only maintainer works any remote run from GitHub's **Run workflow** form, and the notifications now say so;
- the `## 5.` seam has its trigger half plugged in, and `forge` now has a reader;
- two new repository variables exist;
- the trigger workflow sits outside the upgrade route;
- a GitHub-triggered run on one's own hardware is a self-hosted runner.

**Depends on:**

- Task 20, whose `docs/github-issue-trigger.md` this document now points at for the trigger's own design.
- Task 11, whose notification sentences cite *"docs/remote-execution.md, section 1"*. This task adds the route's subsection inside that section, spelled exactly `### Working a run from GitHub alone`, and renames and renumbers nothing, so that pointer stays true.
- Task 10: `adopt`'s behaviour.
- Task 16: the four commands that adopt.
- Task 17: `branch-status`'s `adopt --list`.

**Where this task stops.** It edits this one document. The trigger's lifecycle, naming rule, authorisation and security are Task 20's document, and this one cites it. `## 6. What is not verified here` gains no row, because the trigger's unverified behaviours are listed in Task 20's `## 7.`. Every adopter command added here sits alone on its line in a fenced block (`harness-runs/lessons.md` → *Adopter-facing documentation*).

### Targets

- `docs/remote-execution.md` — the opening *It cites rather than restates* paragraph, `## 1.`, `## 3.` → `### Notifications`, `## 5.`, `## 7.` → `### Every secret and variable` and `### Upgrading`, `## 8.`, `## 11.`.

**Work:**

- [ ] **`## 1.`: the local commands, and the new subsection.**
  - *"What each local command does for a remote run."* (register row 25) gains a sentence before its table. `/autonomous-sdlc-harness:branch-answer`, `-resume`, `-pause` and `-user-review` first run `remote-run.sh adopt`. It gives every `harness run <branch>` run whose branch is live, unprotected and unknown locally a mirror and a record with `execution: github-actions`, then syncs it, so a run started from an issue is then an ordinary remote record. The watcher's tick never adopts, and the sentence gives the reason.
  - The `branch-status` table row (register row 26) adds that it runs `remote-run.sh adopt --list`, which writes nothing, to list runs started on GitHub and not yet adopted.
  - The opening *It cites rather than restates* paragraph adds `docs/github-issue-trigger.md` for starting a run from an issue.
  - Add `### Working a run from GitHub alone` at the end of `## 1.`, before the `---`. It is for a maintainer with no local setup, and it lists each fenced command on its own line:
    - **Answering a park.** Take the question from the run's `harness-state` artifact, from the run page's *Artifacts* or with `gh run download <run id> -n harness-state`, under `clarifications/<branch>/question_<n>.md`. Then **Run workflow** on `harness-run.yml` with `action` `run`, `branch` `<branch>`, `engine` as the run's, `resume` `answer` and `answers` a JSON object `{"<n>": "<answer text>"}`, one entry per open question. Add `park_loop_clear` `true` for a park loop. An expired bundle can no longer be answered (`## 4.`), and `resume` `pause` continues from the committed ledger instead.
    - **Resuming a pause.** The same form with `resume` `pause`.
    - **Pausing.** `action` `pause`.
    - **Stopping.** `action` `stop`, which dispatches the stop marker only. Cancel the running job from the run page too, which `remote-run.sh stop` does for a local maintainer (§3, *The kill switch and stopping*).
    - The equivalent `gh workflow run harness-run.yml --ref <branch> -f action=run -f branch=<branch> -f engine=task -f resume=pause -f chain=0`. The input contract is `## 5.`'s table.
- [ ] **`## 3.` → `### Notifications`.** The paragraph says each message names the user's next action as a local command. Add that for a remote run it also names the GitHub route, `### Working a run from GitHub alone`, since a remote-only maintainer has no local command. Give one quoted example: the `parked` detail's two halves, as Task 11 wrote them.
- [ ] **`## 5.`** (register rows 14–16):
  - *"The `workflow_dispatch` inputs are the seam the trigger half plugs into."* now says the trigger half has plugged in. `remote-run.sh start`, which the issue trigger calls, sends the same inputs through `dispatch`, still the one producer.
  - *"`forge` gains no reader here"* becomes: `forge` is read by the issue trigger (`docs/github-issue-trigger.md`), not by this path; `execution.target` still names where the job runs; and a run still ends at a pushed branch with no pull request.
  - *"**What stays open**"* now names what stays open after this branch: starting a run from a pull request or a comment, and controlling a run from GitHub's side beyond the **Run workflow** form, which is `feat_forge_run_control`; and draft-pull-request output.
- [ ] **`## 7.`**:
  - `### Every secret and variable` gains two rows in the table's shape:
    - `HARNESS_TRIGGER_LABEL` | variable | `harness-trigger.yml`'s job filter and `remote-run.sh trigger` | `harness` | no;
    - `HARNESS_TRIGGER_ALLOWED_BOTS` | variable | `remote-run.sh trigger` | empty: no bot may start a run | no.

    The *list of record* sentence names the `trigger` job's `env:` in `harness-trigger.yml` as the third list.
  - `### Upgrading` gains one bullet under *What it carries, and what it does not*: `init --upgrade-workflows` does not re-render `harness-trigger.yml`. The file carries no version pin, calls the scripts on the default branch, and shares their route, `init --force`, like the outer-loop scripts in the bullet after it.
  - Step 2, *Write the two workflows*, gains one sentence: with `forge` set to `github`, `init` writes a third, `harness-trigger.yml`, described in `docs/github-issue-trigger.md`.
- [ ] **`## 8.` and `## 11.`**:
  - `## 8. Choosing a runner` gains a short paragraph, *A run started from GitHub, on your own hardware*: such a run always executes through `harness-run.yml`, because GitHub cannot reach your machine. A self-hosted runner registered on that machine and named in `HARNESS_RUNNER` runs it there, which is the way to run a GitHub-triggered run locally.
  - `## 11. Security` gains a paragraph:
    - the trigger job reads untrusted issue text only through its event file and the environment, and references no secret;
    - a labelled issue's text becomes the task with the run job's credentials, which is why only write-or-admin people or listed bots may start one, as `docs/github-issue-trigger.md` → `## 3.` and `## 4.` state;
    - a run whose task edits `.github/workflows/*` cannot push it without a workflow-capable `HARNESS_GIT_TOKEN`, citing `docs/github-integration-research.md` → S1 and its refusal line.

**Verification:**

- `git grep -n -i -E "gains no reader|What stays open\*\* is the trigger half" -- docs/remote-execution.md` prints nothing.
- `grep -n "^### Working a run from GitHub alone$" docs/remote-execution.md` prints exactly one line, and it falls between `## 1.` and `## 2.`: `grep -n "^## " docs/remote-execution.md` shows the order.
- `grep -n "^## " docs/remote-execution.md` lists the same numbered sections as before this task.
