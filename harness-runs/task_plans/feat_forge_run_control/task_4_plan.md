### Task 4 — Post a park's question files as comments from `report parked`

**Goal:** When a run parks, post each open question file **whole**, `question_<n>.md` with every `## Q<k>` section in it, as its own comment on the run's pull request or issue (goal 3, acceptance 3). Each comment tells the reader how to answer it from GitHub. The comment is a transport, not a second format: the file's bytes are posted as they are, and the channel format stays owned by `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)`.

**Depends on:** Task 3. It defines `forge_report <event> <branch> [<note>]` in `remote-run.sh`, whose `parked` arm this task replaces, along with the targets it resolves (`FORGE_PR` when recognised, else `FORGE_ISSUE`). It also defines `forge_comment <number> <event> <branch> <body_file> [<question>]`, whose fifth argument puts ` question=<n>` into the marker, and `forge_set_state <number> parked`. `COMMAND_HANDLE` is Task 1's.

**Where this task stops.** It posts questions. Reading an answer back from a comment is Task 12's, which relies on the marker's `question=<n>` only for the reader's sake: the open set always comes from the run's bundle, never from comments. Calling `report parked` from the watcher is Task 7's.

### Targets

- `cli/templates/scripts/remote-run.sh` — `forge_report`'s `parked` arm, one constant, and the header's `report` paragraph.
- `cli/test/remote-report.test.mjs` — the parked cases.

**Work:**

- [ ] **The open set.** `report parked` runs in the job, where the questions are on disk. The open questions are every top-level `<state_dir>/clarifications/<branch>/question_<n>.md` under `$root` whose `answer_<n>.md` is absent, which is the rule `fetch` states for `open_questions:` (the header's `fetch` paragraph). Reuse the existing `open_questions_in <dir>`, which reads `<dir>/clarifications/<branch>/` for the global `branch` and sets `OPEN_QUESTIONS`, ascending and space-separated. Call it as `open_questions_in "$root/<state_rel>"`, with `<state_rel>` from `hr_state_dir "$root"`, rather than restating the loop. When no question is open — for example a report from a context with no question files — post the Task 3 notice instead.
- [ ] **One comment per open question, in ascending `<n>`:**
  - a first line: `The run on \`<branch>\` is waiting for an answer to question <n>.`;
  - a blank line, then the file's bytes;
  - a blank line, then the way to answer: `Answer with a comment whose first line is \`@sdlc-harness answer <n>\` and whose following lines are your answer.` When exactly one question is open, add that `<n>` may be left out. The handle is spelled from `COMMAND_HANDLE`.
  - `Run: <url>` when `GITHUB_RUN_ID` is set.

  Post with `forge_comment <target> parked <branch> <file> <n>`. Then `forge_set_state parked` on each target, once, not per question.
- [ ] **The size bound.** Add `QUESTION_COMMENT_MAX_BYTES=250000` with a comment citing `docs/github-integration-research.md` → S6: an issue comment holds 262,144 bytes of UTF-8, and the refusal text's character count is not to be trusted. The bound leaves room for the framing lines and the marker. A file over it is cut at the last whole line within the bound, measured in bytes (`wc -c`, never `${#…}`), and the comment says the question was cut and that the whole file is `clarifications/<branch>/question_<n>.md` in the run's `harness-state` artifact.
- [ ] **The header's `report` paragraph** states the parked behaviour: one comment per open question, posted whole up to the bound, and the answer form. It also states that a comment and its answer are public on a public repository, the visibility the artifact already has (`docs/remote-execution.md` → `## 11. Security`, *What a reader of the repository's Actions runs can see*).
- [ ] **`remote-report.test.mjs`** gains, with question files written into the fixture checkout's clarification directory:
  - two open questions → two comments in ascending order, each holding its file's bytes and `@sdlc-harness answer <n>`, each marker carrying `question=<n>`, and one `sdlc-harness: parked` label add per target;
  - a question with its answer beside it → not posted;
  - one open question → the comment says the index may be left out;
  - a question file over the bound → cut at a line boundary, at most the bound in bytes, naming the artifact path;
  - a question body carrying `` `@sdlc-harness stop` `` on its first line → posted verbatim inside the comment, whose marker keeps it from ever being read as a command (Task 10's self-filter).

**Verification:**

- `npm test -- test/remote-report.test.mjs` from `cli/` passes.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `git grep -n "question_\*\.md\|question_\$" -- cli/templates/scripts/remote-run.sh` shows no new loop over question files outside `open_questions_in`: the open-question rule has one implementation.
