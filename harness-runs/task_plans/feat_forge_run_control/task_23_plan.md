### Task 23 — Write `docs/github-run-control.md`: comment commands and review rounds

**Goal:** Create the document of record for working a run from GitHub, beside `docs/github-issue-trigger.md` (starting one) and `docs/remote-execution.md` (running one). This task writes its opening, `## 1. Commands in a comment` and `## 2. A review that requests changes starts a round`. Task 24 adds `## 3.`–`## 5.`, and Task 25 adds `## 6.`–`## 8.` and, last, the `## The GitHub entry point` section that summarises and links them all. The README points at that section (Task 30).

**Depends on:** the behaviour Tasks 1, 5, 9, 10–13 and 15 built, restated here so this file stands alone:

- **The handle and the verbs.** A command is `@sdlc-harness` as the first word of a comment's first line, matched case-insensitively, then one of `answer [<n>]`, `pause`, `resume`, `stop` or `clear`. Text after a control verb is ignored. A comment carrying the hidden line that opens `<!-- sdlc-harness` is never a command. An edited comment is never re-read.
- **Replies.** Every accepted command gets a reply naming the actor, the command and what was done. Every refused one gets a reply giving the reason, except the harness's own comments, which are ignored silently. An unknown verb gets a reply listing the five.
- **Who and where.** Only a collaborator whose permission is `admin` or `write` (maintain reads as `write`; triage reads as `read` and is refused), or a bot listed in `HARNESS_TRIGGER_ALLOWED_BOTS`, is obeyed. A command acts on a pull request's head branch, or on the branch the trigger started from an issue.
- **What each verb sends.**
  - `pause` sends `remote-run.sh pause` for a running run.
  - `stop` sends `remote-run.sh stop`: the marker, then cancelling the branch's runs.
  - `resume` sends `resume: pause` for a paused run.
  - `clear` sends `resume: pause` with `park_loop_clear` for a run in a park loop.
  - `answer` is Task 24's section.
- **A review requesting changes** — state `changes_requested`; `approved` and `commented` start nothing — on a pull request from a harness branch becomes the next `<branch>_review[_<n>].md` round, through `remote-run.sh review`.
  - It carries the review's body and every inline comment of that review, plus the reviewer's own inline comments since the previous round's commit, each with its file, its line (or original line when outdated), its commit and its diff hunk. Other people's comments are not collected.
  - A branch is a harness branch when its tip carries `<stateDir>/flow_progress/<branch>_progress.md`, whoever opened the pull request and whether or not it is a draft. A round also needs `<stateDir>/story_plans/<branch>_story_plan.md`.
  - A review arriving while a run is in flight is refused with a reply, to be resubmitted once it finishes.

**Where this task stops.** Parks over comments, the draft pull request, lifecycle comments and labels are Task 24's. Security and forks, working from both sides, the not-verified table and the entry-point section are Task 25's. This task links only to existing documents and to its own two sections, so the document reads complete as far as it goes, with no forward link. `llms.txt` and the README list it in Task 30.

### Targets

- `docs/github-run-control.md` (new).

**Work:**

- [ ] **The opening**, in `docs/github-issue-trigger.md`'s style:
  - an H1, `# Working a run from GitHub`;
  - a `**Who reads this:**` paragraph: a maintainer or team member who works runs from GitHub, and anyone changing `harness-control.yml` or `remote-run.sh`'s `control`, `report` and `deliver`. It owns the design of record for commands, review rounds, parks over comments, the draft pull request, lifecycle comments and state labels;
  - a cites-rather-than-restates paragraph: every GitHub fact is cited from [`github-integration-research.md`](github-integration-research.md) by its ID (S3–S6, T1–T4, C1–C4), and not re-verified here. The run's own lifecycle is [`remote-execution.md`](remote-execution.md)'s, and starting a run is [`github-issue-trigger.md`](github-issue-trigger.md)'s. The code of record is `cli/templates/scripts/remote-run.sh` → the header's `control`, `report` and `deliver` paragraphs, and the header of `cli/templates/github/workflows/harness-control.yml`.
- [ ] **`## 1. Commands in a comment`**: the syntax, then each of the five commands on its own line in its own fenced block, as a reader types it (the lessons ledger's fenced-block rule):

  ```
  @sdlc-harness pause
  ```

  `answer` is shown with its index, and the answer text on the lines below it. Then a table of the five verbs: *what it does*, *accepted when*, and *the same as which local command*. The local commands are `/autonomous-sdlc-harness:branch-answer`, `-pause` and `-resume`, `remote-run.sh stop`, and `/autonomous-sdlc-harness:branch-resume` on a park loop. Then:
  - what is never a command — `pause`, `pause this`, `Let's @sdlc-harness pause`, a quoted `> @sdlc-harness pause`, an edited comment, and any comment carrying the harness's hidden line;
  - the replies, and the verb list an unknown verb gets.
- [ ] **The handle**, as goal 4 requires, in one paragraph:
  - it is typed in full, because GitHub does not autocomplete it;
  - it renders as a link to the harness's placeholder organisation `sdlc-harness` (github.com/sdlc-harness), created only so that nobody else can take the name; it is not a user, an app, or a member of any repository;
  - the command is matched as **text** in the comment, never delivered through the mention.

  Note research C4's fact: a comment containing `@claude` as a word also triggers `anthropics/claude-code-action` where that is installed, and a harness command needs no such word. The `@harness` handle was not taken because it belongs to another organisation (`gh api users/harness`, observed by the maintainer on 2026-10-01).
- [ ] **`## 2. A review that requests changes starts a round`**:
  - which review states start one (C1: the payload is lowercase, the REST API uppercase);
  - what the round carries, and why other people's comments are not collected;
  - why a comment's commit and hunk are recorded (C1: `line` becomes `null` once outdated) and how the fix plan re-locates it;
  - how the round is numbered — the same anchored rule as `/autonomous-sdlc-harness:branch-user-review` step 3, from the branch tip;
  - that it is committed as `chore: add user review for <branch>`, pushed and dispatched, exactly as the local command's GitHub route does;
  - what makes a pull request the harness's, said as *a pull request from the run's branch*, never *the draft pull request*, so that marking it ready is never read as closing it to reviews;
  - the story-index requirement;
  - the in-flight refusal, and that the local command refuses the same way;
  - that inline comments left while a round runs are carried into the next round.

**Verification:**

- `git grep -n -E '^## ' -- docs/github-run-control.md` lists exactly `## 1. Commands in a comment` and `## 2. A review that requests changes starts a round`.
- `git grep -n -E '\]\(#' -- docs/github-run-control.md` finds only links whose anchors are those two headings: no forward link to a section not yet written.
- `git grep -n -i "the draft pull request" -- docs/github-run-control.md` has no hit inside `## 2.`: a review applies to any pull request from the run's branch.
- Each of the five `@sdlc-harness <verb>` forms stands on its own line inside a fenced block in `## 1.`.
