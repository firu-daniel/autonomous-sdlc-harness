### Task 2 — Report a park as one GitHub answer instruction with a copy block, and never as a question-less comment

**Goal:** Change `remote-run.sh`'s `report` for a park (items 7, 3 and 10):
- a `parked` event with no open question posts nothing and prints an `::error::` line, rather than a comment with no question in it;
- a question comment leaves out the file channel's own answer line;
- every question comment ends with a ready-to-copy block of the GitHub answer form.

**Where this task stops.** It changes the `parked` arm of `forge_report` and `forge_question_body` only, plus the `report` header paragraph:
- the watcher's classification is **Task 1**'s;
- the canonical rule that a question file names no answer channel is **Task 14**'s, in the plugin layer — this task's line removal is the backstop for question files written before or against that rule;
- `docs/github-run-control.md` §3 is **Task 16**'s.

`remote-run.sh` is edited after this task by Tasks 7, 8, 9, 10 and 11, in that order.

### Targets

- `cli/templates/scripts/remote-run.sh` — `forge_report` (the `parked` arm), `forge_question_body`, and the header's `` `report` TURNS A LIFECYCLE EVENT INTO ONE COMMENT `` paragraph.
- `cli/test/remote-report.test.mjs` — new cases.

**Work:**

- [ ] **No question-less park (item 7).** In `forge_report`, when the event is `parked` and `open_questions_in` leaves `OPEN_QUESTIONS` empty, print `::error::remote-run.sh: report: <branch> was classified parked with no open question; nothing posted` (naming the branch). Post no comment and set no label, and still return 0, because `report` never fails its caller. The `text` for `parked` that names the artifact is removed, since nothing posts it any more.
- [ ] **One answer instruction (item 3).** In `forge_question_body`, build the comment from `question_<n>.md` with every line that contains the literal `answer_<n>.md` for **its own** index left out, *before* the `QUESTION_COMMENT_MAX_BYTES` cut. Lines naming another index stay. The comment's own `@sdlc-harness answer <n>` sentence is then the only answer instruction.
- [ ] **The copy block (item 10, option (d)).** After that sentence, append a fenced block for the reader to copy, whose first line is `COMMAND_HANDLE answer <n>` with the real index and whose second line is `<your answer>`. Keep the existing "may be left out" sentence for a single open question. The comment carries `COMMENT_MARKER`, so `control` never acts on the quoted form.
- [ ] Rewrite the header's `report` paragraph to match: the `parked` arm's no-open-question `::error::` outcome replaces *"With no question open it posts the one notice"*, the comment states that `answer_<n>.md` lines are left out, and the copy block is named.
- [ ] `cli/test/remote-report.test.mjs`, three cases with `forge` `github`:
  - a bundle holding only an answered pair, reported `parked`, makes no `issues/<n>/comments` or `labels` call and prints the `::error::` line;
  - a `question_1.md` carrying *"Please answer in one `answer_1.md` beside this file, addressing each question by its `Q<k>` label."* posts a comment without that line, with exactly one `@sdlc-harness answer 1` sentence plus the copy block;
  - a question line naming `answer_2.md` inside `question_1.md` is kept.

**Verification:**

- `npm test -- test/remote-report.test.mjs` from `cli/` passes.
- In the posted body the stub records for the second case, `answer_1.md` does not occur, and the fenced block's first line is exactly `@sdlc-harness answer 1`.
- The cut case already in the file still names the artifact path, and its comment stays within the byte bound with the copy block added.
- The header's `report` paragraph and the code agree, line for line, on what a `parked` report posts.

**Deviations from plan:**
- The existing case `parked with no open question posts the one notice` asserted the behaviour item 7 removes; it is replaced by the first new case (answered pair only, no comment, no label, `::error::` line) rather than kept beside it.
- The cut case gained one assertion that the copy block `@sdlc-harness answer 3` / `<your answer>` is present, so the byte-bound assertion covers the comment with the block added.
