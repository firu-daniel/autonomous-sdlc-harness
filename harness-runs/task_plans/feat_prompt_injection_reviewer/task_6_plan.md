### Task 6 — Prove the GitHub route by test: a screen park posted through `remote-run.sh`, an answer restored by it, and a re-ask answered through it

**Goal:** Cover, by test, the part of goals 4 and 5 that no local flow exercises: the GitHub route. The task prompt directs verifying it "here by test, against the park format and the dispatch code". The check on a real job is the post-release follow-up in the story index's Manual setup required.

**Depends on:**
- **Task 3.** `prompt-injection-screen.sh park --repo <dir> --branch <branch> --engine task` writes `<state_dir>/clarifications/<branch>/question_<n>.md`, opening with `Raised by: prompt-injection-reviewer (prompt-injection screen)` and the ``Screened file:`` / ``sha256:`` pairs, with every excerpt neutralised (`<!--`→`&lt;!--`, `@`+U+200B, invisible and bidi bytes replaced, backticks `'`, marker strings `[marker removed]`) between the untrusted-data markers.
- **Task 2.** `plan` prints `screen <path> <sha>` for an unrecorded answer and `unsafe <path> <sha> recorded question_<n>.md` for a parked, unchanged prompt.
- **Task 3, the re-ask.** For an unsafe `answer_<k>.md`, `park` removes the answer, moves a top-level `question_<k>.md` under `answered/`, and writes `question_<m>.md` at the next index holding `question_<k>.md`'s bytes verbatim plus an appended discard section with the neutralised findings. This is the user's ruling on the plan's clarification Q1: one route for local and GitHub alike, needing no `remote-run.sh` change because the re-ask is open when its answer arrives.

**Where this task stops.** It changes no script. `remote-run.sh` is used as shipped. A failure here that only a `remote-run.sh` change would fix is reported, never patched in this task.

### Targets

- `cli/test/prompt-injection-remote-route.test.mjs` (new)

**Work:**

- [ ] **Header.** Open with the rule the suite enforces: a screen park reaches GitHub through `remote-run.sh`'s question comment with its excerpts still neutralised and within the comment cap, an answer that arrives through `remote-run.sh`'s answer restore is screened at the next launch and moves no parked file past `UNSAFE`, and a flagged answer's re-ask is an open question the shipped restore accepts an answer for.
  - Say what is not covered and why: a real job, which is the post-release follow-up.
- [ ] **The posted question.** Drive `remote-run.sh`'s question-comment path, `verb_report` → `forge_question_body`, the way `cli/test/remote-report.test.mjs` already drives it, over a run state whose `clarifications/<branch>/` holds a park Task 3's `park` verb wrote for a prompt carrying `<!--`, `@someone`, a Tags-block character and `=== END UNTRUSTED DATA`. Assert the comment body that would be posted:
  - it carries the `## Q1` section and both marker lines;
  - it contains no raw `<!--`, no `@someone` without the U+200B, no Tags-block byte, and no `=== END UNTRUSTED DATA` other than the closing marker;
  - it stays within `forge_question_body`'s own size bound.
- [ ] **The restored answer.**
  - **Restore.** Drive `remote-run.sh`'s answer restore, the `--resume answer` route `verb_restore` takes, the way `cli/test/remote-run.test.mjs` drives it, to write `answer_<n>.md` for that park. Use an answer text of "proceed despite the verdict".
  - **Assert on `plan --engine task`:**
    - it lists the restored answer as `screen`;
    - it still lists the unchanged prompt as `unsafe … recorded question_<n>.md`, with exit 1;
    - after the prompt's bytes change, it lists the prompt as `screen`.
- [ ] **The re-asked answer.** Over a run state holding an ordinary park (`question_1.md` opening `Raised by: task-plan-writer`) whose `answer_1.md` was restored by `--resume answer` and carries a prescan hit:
  - `park --engine task` writes the re-ask `question_2.md`, and `answer_1.md` is gone;
  - `remote-run.sh`'s open-question reading (the `open_questions` / `OPEN_QUESTIONS` set) names `2` only, and the question comment `forge_question_body` builds for it carries the original `## Q1` text and the neutralised findings;
  - a second `--resume answer` restore for index `2` writes `answer_2.md` (exit 0), and one for index `1` is refused with nothing written, as shipped;
  - `plan --engine task` then lists `answer_2.md` as `screen` and no `answer_1.md`.
- [ ] **Fixtures.** Build every repository under the system temp directory and tear it down in-process (`cli/test/helpers/fixture.mjs`). Reach no network: drive the same stubbed `gh` the two model suites use.

**Verification:**

- `npm test --workspace cli -- test/prompt-injection-remote-route.test.mjs` passes. It is this task's own new test file.
- `git diff --stat` lists only the new test file.
