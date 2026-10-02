### Task 24 — Document parks over comments, the draft pull request, lifecycle comments and state labels

**Goal:** Add `## 3.`, `## 4.` and `## 5.` to `docs/github-run-control.md`: how a park is posted and answered in a comment (goal 3), when and how the draft pull request is opened (goal 1), and which lifecycle comments and state labels a run leaves on its issue and pull request (goals 5 and 6). Each states the decision and its reason, as the trigger's document does.

**Depends on:** Task 23, which creates `docs/github-run-control.md` with its opening, `## 1. Commands in a comment` and `## 2. A review that requests changes starts a round`. This task appends after `## 2.` and edits nothing above it. The behaviour it documents, restated so this file stands alone:

- **A park.** Each open `question_<n>.md` is posted whole as one comment, cut at a line boundary past 250,000 bytes with a pointer to the run's `harness-state` artifact. Research S6 measured 262,144 bytes of UTF-8, with a refusal text that misstates the unit.
  - **The answer.** It is `@sdlc-harness answer <n>` on the first line and the answer on the lines below. `<n>` may be left out when exactly one question is open, and a short answer may follow the index on the first line. The answer is written verbatim, as untrusted task data.
  - **One answer, one dispatch.** Each answer is its own `resume: answer` dispatch. A partly answered park stops parked with that answer carried in its bundle, and the reply names the questions still open.
  - **The refusals** are each a reply: a run in a park loop (use `@sdlc-harness clear`); an expired bundle (`@sdlc-harness resume` from the committed ledger); a job in flight (send again once it finishes); an index not open; and a payload over GitHub's 65,535-character `workflow_dispatch` inputs limit (S5), with the way on of shortening it or committing the text to a file on the branch.
- **The draft pull request.** `deliver`, a step of `harness-run.yml` after the push, opens it for a run executing on GitHub with `forge` `github`, from the branch to the default branch, and reuses an open one.
  - The body names the issue as a plain mention, `Started from #<n>`, never a closing keyword, so merging it never closes the issue. The maintainer may add one.
  - It is opened with `HARNESS_GIT_TOKEN` when set, which lets the repository's CI run on it without an approval click (S3). Otherwise it uses the job's token, which needs *Allow GitHub Actions to create and approve pull requests*, off by default (S4, C3).
  - **The cost of `HARNESS_GIT_TOKEN` opening it** (Task 6's decision): the pull request's author is the token's owner, and GitHub does not let a pull request's author request changes on their own pull request. So when the token is a person's own, that person cannot start a round from GitHub with *Request changes* on it. The ways on are a token of a machine account, another write-access reviewer, or a local `/autonomous-sdlc-harness:branch-user-review`. Without the token, anyone with write access can request changes, and CI waits for the approval click. This rests on GitHub's documented rule, not retrieved in the research document.
  - To open it, `HARNESS_GIT_TOKEN` needs *Pull requests* write beside *Contents* write and, for workflow files, *Workflows* write as a fine-grained token, or `repo` plus `workflow` as a classic token (research S2, **Consequence**). A token without that access opens no pull request, and the `completed` comment names `gh`'s error.
  - A failed draft is retried once as a ready pull request (C3: drafts depend on the plan; unmeasured).
  - A locally executed run gets none.
  - The flow never opens it and never merges it; `push-branch.sh` still opens none.
- **Lifecycle comments and labels.** `parked`, `park_loop`, `paused`, `resumed`, `failed`, `stopped`, a started round, and `completed` (naming the pull request) are posted on the run's recognised open pull request, else on its issue. `launched` is the trigger's own comment. Each names the next action as a GitHub action. A usage `paused` names the reset time. A chained `budget` continuation stays silent. `autonomous-notify.sh` and its push notifications are unchanged.
  - The six labels are `sdlc-harness: running`, `parked`, `paused`, `done`, `failed` and `stopped`. One is kept on the issue and on the pull request, each transition removing the others; the trigger sets the first when it removes the trigger label.
  - The labels are created on first use, and a hand-applied one is overwritten. They are a view: the run list on GitHub is the authority.

**Where this task stops.** `## 6.`–`## 8.` and the entry-point section are Task 25's. The upgrade path for the trigger label is Task 26's, in `docs/github-issue-trigger.md`; this task names only the state labels.

### Targets

- `docs/github-run-control.md` — `## 3.`, `## 4.` and `## 5.`.

**Work:**

- [ ] **`## 3. Answering a park in a comment`**:
  - The question comment, its size bound and its pointer.
  - The answer form, with a fenced example of a comment answering question 2.
  - Why each answer is its own dispatch, and why that is safe — the job's partial-answer stop and the bundle carrying the answer.
  - The refusals.
  - That the channel format stays `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)`'s: the comment is a transport, not a second format.
- [ ] **`## 4. The draft pull request`**:
  - When it opens, from which step, and why the flow itself still opens none.
  - The token choice and the setting, with the settings path written out; the access `HARNESS_GIT_TOKEN` needs to open the pull request (fine-grained: *Pull requests* write beside *Contents* write and, for workflow files, *Workflows* write; classic: `repo` plus `workflow`), citing [`github-integration-research.md`](github-integration-research.md) → S2; and that a token without it produces the `completed` comment naming `gh`'s error. In the same token bullet, state the cost above: a pull request opened with a person's own token cannot be reviewed with *Request changes* by that person, so a solo maintainer sets the token of a machine account, or starts the round locally with `/autonomous-sdlc-harness:branch-user-review` (fenced), and that without the token anyone with write access can request changes but CI needs the approval click (S3). Mark the author rule as GitHub's documented behaviour, not retrieved in [`github-integration-research.md`](github-integration-research.md). Do not link to `## 8.`, which Task 25 writes; Task 25's `## 8.` row carries the not-verified record.
  - The plain mention, and why.
  - The one retry.
  - Why a locally executed run gets none: nothing new is required of a local-only adopter (goal 7), and a person may open one by hand, which is then recognised like any other.
- [ ] **`## 5. Lifecycle comments and state labels`**:
  - A table: *event* → *where it is posted* → *what it says* → *the next GitHub action* → *the label it sets*.
  - The target rule.
  - The budget silence.
  - That push notifications continue unchanged beside the comments.
  - The label set, with a sentence that a maintainer must not apply them by hand, since the harness overwrites a hand-applied one, and that they are created on first use.
  - That the labels let a team filter runs by state from the issue and pull-request lists without opening a comment.
- [ ] Keep links inside the document to `## 1.`–`## 5.` only, and to existing documents.

**Verification:**

- `git grep -n -E '^## ' -- docs/github-run-control.md` lists `## 1.` through `## 5.` in order, and nothing else.
- `git grep -n -i "closes #\|fixes #" -- docs/github-run-control.md` has its only hits in the sentence explaining why the body does not use a closing keyword.
- The `## 5.` table has one row for each event Task 24's **Depends on** lists, and no other.

**Deviations from plan:**

- The plan places `completed` by the general target rule (pull request, else issue). `cli/templates/scripts/remote-run.sh` → `verb_deliver` posts it on the issue, naming the new pull request, when this run opened the pull request and an issue is known; on the pull request only when there is no issue or the pull request existed before the run; on the issue alone when none could be opened. Documented as the code does it, as the one exception to the target rule.
- The plan says a token without the access "names `gh`'s error" in the `completed` comment. The code adds a separate case: a refusal matching `PR_CREATE_FORBIDDEN` (the Actions setting off) is not retried and its comment names the setting and `HARNESS_GIT_TOKEN` instead. Both are documented.
- The `## 3.` refusals table adds two refusals the code carries and the plan omits: several questions open with no `<n>`, and an empty answer (`remote-run.sh` header → `control`'s `answer` arm).
