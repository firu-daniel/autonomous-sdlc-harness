### Task 11 — Name the GitHub route in every job-side notification that names a local command

**Goal:** Give a remote-only maintainer a way on from every notification a remote run sends. They have no `/autonomous-sdlc-harness:branch-answer` or `branch-resume`. Today a job's `parked` notification says only *"answer with /autonomous-sdlc-harness:branch-answer <branch>"* (`autonomous-watcher.sh` → `classify_run_exit`, the `JOB_MODE` arm), and every `paused` notification names only `/autonomous-sdlc-harness:branch-resume`. The task prompt (*Leads* › *Parking with no local machine*) asks that the text for a remote record name the GitHub route next to the local command:

- for an answer: read the question from the run's `harness-state` artifact, then **Run workflow** on `harness-run.yml` with `action: run`, `resume: answer` and the answers JSON;
- for a resume: the same form with `resume: pause`.

**Depends on:** Task 10, which last edited `remote-run.sh`; Task 9, which last edited `autonomous-watcher.sh` and `harness-run-lib.sh`; and Task 1, which last edited `cli/src/remote/githubActions.ts`'s header (it adds `harness-trigger.yml` to the **Shell and YAML mirrors** list this task extends again) and `cli/test/remote-names.test.mjs`.

**Cross-task interface — the document anchor.** Both sentences end with *(docs/remote-execution.md, section 1)*. That section, `## 1. The lifecycle of a remote run`, exists today, so the pointer never dangles, not even between this commit and Task 21's. Task 21 then adds the route's own subsection under it, `### Working a run from GitHub alone`. A notification is read on a phone, so it cites the section by number, as `IN_FLIGHT_RUNS_NOTE` cites *"docs/remote-execution.md, section 7, Upgrading"*. Renumbering or retitling `## 1.` is therefore an edit to this producer too.

**Cross-task interface — the library becomes a declared mirror.** The two producers spell `harness-run.yml` and `harness-state` into their sentences, and both names are owned by `cli/src/remote/githubActions.ts` (`WORKFLOW_RUN_FILE`, `STATE_ARTIFACT_NAME`). That module's header states *"every remote-execution name has one owner"*, lists the **Shell and YAML mirrors** that must agree byte for byte, and says of the watcher that it *"spells none of these names in code"*. Today the library spells neither name in code (`THE REMOTE STATE BUNDLE` → *"no function spells one"*). So this task makes the library a declared mirror, from both sides, rather than an undeclared copy (`.claude/context/cli.md` → `## What "done" means here`, the header-held-to-the-change rule, and `## How a module in this layer is written` → **One string, one producer**):

- the library assigns the two names once, in `hr_remote_names_var` (`HR_REMOTE_WORKFLOW_RUN_FILE='harness-run.yml'`, `HR_REMOTE_STATE_ARTIFACT='harness-state'`), and declares them in a `MIRRORS OF cli/src/remote/githubActions.ts` table in its own header, in the form `remote-run.sh` uses (`remote-run.sh` header, *"MIRRORS OF `cli/src/remote/githubActions.ts`, which owns these names; a rename there is an edit here, byte for byte"*);
- the owner's header lists the library among its mirrors, and its watcher sentence says the watcher reaches the route text only through the library's producers.

`remote-run.sh` keeps its own `WORKFLOW_RUN_FILE` / `STATE_ARTIFACT_NAME` variables; it sources the library but does not switch to the library's copies, because its own mirror table and the `workflow-templates.test.mjs` case that pins `STATE_ARTIFACT_NAME='harness-state'` in it stand as they are.

**Where this task stops.** It changes the detail text of existing notifications only: it adds no notification, no event kind, and nothing to `autonomous-notify.sh`. A local run's notifications (`JOB_MODE` not `1`) are unchanged. Comment-based answering and lifecycle comments are `feat_forge_run_control`'s.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — the two sentence producers, the two mirrored names in `hr_remote_names_var`, the header's mirror table, and the `THE REMOTE STATE BUNDLE` sentence that says no function spells a name.
- `cli/src/remote/githubActions.ts` — the module header only: the **Shell and YAML mirrors** list and its watcher sentence. No constant changes.
- `cli/templates/scripts/autonomous-watcher.sh` — the job-mode `parked`, `park_loop` and `paused` details.
- `cli/templates/scripts/remote-run.sh` — the `paused` details that append `$RESUME_HINT`.
- `cli/test/watcher-remote-job.test.mjs` — the job-side assertions.
- `cli/test/remote-run.test.mjs` — the `continue` / `poll` assertion.
- `cli/test/remote-names.test.mjs` — one case pinning the library's two mirrored names to the owner's constants.

**Work:**

- [ ] **The mirror and the producers**, in the library:
  - In `hr_remote_names_var`, add `HR_REMOTE_WORKFLOW_RUN_FILE='harness-run.yml'` and `HR_REMOTE_STATE_ARTIFACT='harness-state'`. The header's `HR_`-prefixed-names paragraph already covers every name that function assigns, so it needs no new entry.
  - In the library's header, after the write-exceptions list, add a `MIRRORS OF cli/src/remote/githubActions.ts` paragraph in `remote-run.sh`'s form: which module owns these names, that a rename there is an edit here byte for byte, and the table `HR_REMOTE_WORKFLOW_RUN_FILE mirrors WORKFLOW_RUN_FILE` / `HR_REMOTE_STATE_ARTIFACT mirrors STATE_ARTIFACT_NAME`.
  - In `THE REMOTE STATE BUNDLE`, amend *"uploaded as the Actions artifact `harness-state`. Every name below is a variable `hr_remote_names_var` assigns; no function spells one."* so it says that the artifact name is `HR_REMOTE_STATE_ARTIFACT`, and that `hr_remote_names_var` also assigns the run workflow's file name for the GitHub-route producers. Both are mirrors of the header's table, and no function spells either one.
  - Add the producers. Each calls `hr_remote_names_var` first, reads both names only from those variables, and prints one sentence with no trailing period, so a caller joins it inside its own sentence:
    - `hr_github_answer_route <branch> [park_loop_clear]` prints: *or from GitHub: take the question from the run's `<HR_REMOTE_STATE_ARTIFACT>` artifact, then Run workflow on <HR_REMOTE_WORKFLOW_RUN_FILE> with action run, branch `<branch>`, resume answer and answers `{"<n>": "<your answer>"}`*. With the second argument it adds *, park_loop_clear true*. It ends with *(docs/remote-execution.md, section 1)*.
    - `hr_github_resume_route <branch>` prints: *or from GitHub: Run workflow on <HR_REMOTE_WORKFLOW_RUN_FILE> with action run, branch `<branch>` and resume pause (docs/remote-execution.md, section 1)*.

  The route is written once, here, and both scripts source the library.
- [ ] **The owner's header**, `cli/src/remote/githubActions.ts`, comment only. In the **Shell and YAML mirrors** paragraph, add `cli/templates/scripts/lib/harness-run-lib.sh` to the list of files that declare the mirror in their own header, naming the two constants it mirrors (`WORKFLOW_RUN_FILE`, `STATE_ARTIFACT_NAME`). Amend the watcher sentence: `autonomous-watcher.sh` is still not a mirror, because it reaches GitHub only through `remote-run.sh`, spells none of these names itself, and reaches the GitHub-route text only through the library's `hr_github_answer_route` and `hr_github_resume_route`. Keep Task 1's `harness-trigger.yml` entry as it is.
- [ ] **The watcher's job-mode details.** Find each with `grep -n 'notify \(parked\|park_loop\|paused\) ' cli/templates/scripts/autonomous-watcher.sh`, and change only the arms that run under `JOB_MODE` `1` or inside `run_job`:
  - `parked` gains `hr_github_answer_route "$branch"` after the local command;
  - `park_loop` gains `hr_github_answer_route "$branch" clear`;
  - each `paused` that names `/autonomous-sdlc-harness:branch-resume` gains `hr_github_resume_route "$branch"`: the user pause, the in-job usage wait's bound and the overload pause.

  Join each with `; ` so the local command stays first and unchanged.
- [ ] **`remote-run.sh`**: every `notify paused` whose text appends `$RESUME_HINT $branch` (the `continue` and `poll` arms; find them with `grep -n 'RESUME_HINT' cli/templates/scripts/remote-run.sh`) gains `hr_github_resume_route` for that branch after the local command, before the sentence's final period. `RESUME_HINT`'s other uses, in `restore_refuse` and `sync`'s `remote_detail`, are messages a local reader sees and stay as they are.
- [ ] **The tests.**
  - `watcher-remote-job.test.mjs`: in the existing case whose job parks, assert the recorded `parked` notification detail contains both `/autonomous-sdlc-harness:branch-answer <branch>` and `Run workflow on harness-run.yml` with `resume answer`. Where a case already asserts a `paused` detail with `branch-resume`, assert it also carries `resume pause`. A local-mode case's `parked` detail must carry neither.
  - `remote-run.test.mjs`: in the existing `continue` case that notifies `paused` (for example *"remote stop"*), assert the recorded message still names `/autonomous-sdlc-harness:branch-resume` and now also `resume pause`.
  - `remote-names.test.mjs`: add one case, after the `workflow-templates.test.mjs` precedent that pins `STATE_ARTIFACT_NAME` in `remote-run.sh`. Read `templates/scripts/lib/harness-run-lib.sh` and assert it carries the lines `HR_REMOTE_WORKFLOW_RUN_FILE='${WORKFLOW_RUN_FILE}'` and `HR_REMOTE_STATE_ARTIFACT='${STATE_ARTIFACT_NAME}'`, both built from the imported constants. A rename in the owner then fails here first.

**Verification:**

- `npm test -- test/watcher-remote-job.test.mjs` and `npm test -- test/remote-run.test.mjs` from `cli/` pass.
- `npm test -- test/remote-names.test.mjs` from `cli/` passes.
- `grep -n "Run workflow on" cli/templates/scripts/lib/harness-run-lib.sh` shows the route twice, once per producer, each reading `HR_REMOTE_WORKFLOW_RUN_FILE`. The same grep over `cli/templates/scripts/autonomous-watcher.sh` and `cli/templates/scripts/remote-run.sh` prints nothing: neither script re-spells it.
- `grep -n "harness-run.yml\|harness-state" cli/templates/scripts/lib/harness-run-lib.sh` prints only comment lines, the header's mirror table and the `THE REMOTE STATE BUNDLE` text, and the two assignments inside `hr_remote_names_var`. No other function spells either name.
- The mirror is declared on both sides. `grep -n "MIRRORS OF" cli/templates/scripts/lib/harness-run-lib.sh` finds the header table, and `grep -n "mirrors  *WORKFLOW_RUN_FILE\|mirrors  *STATE_ARTIFACT_NAME" cli/templates/scripts/lib/harness-run-lib.sh` finds both rows. `grep -n "harness-run-lib.sh" cli/src/remote/githubActions.ts` finds the library in the header's **Shell and YAML mirrors** paragraph.
- `grep -n "autonomous-watcher.sh" cli/src/remote/githubActions.ts` shows the amended watcher sentence naming `hr_github_answer_route` and `hr_github_resume_route`. `grep -n "harness-run.yml\|harness-state" cli/templates/scripts/autonomous-watcher.sh` prints no code line.
