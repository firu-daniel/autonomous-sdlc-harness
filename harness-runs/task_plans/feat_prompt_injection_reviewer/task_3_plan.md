### Task 3 — Add the park writer and the `park` verb: neutralised, capped excerpts in the clarification-channel format, and the discard-and-re-ask of a flagged answer

**Goal:** Write the `UNSAFE` park (goal 4) deterministically, in code. The watcher, `branch-status` and the GitHub route already read the shape, and an excerpt quoted from a hostile file can neither act on the person reading it nor reach GitHub live. A flagged `answer_<k>.md` is not parked like a committed file: it is discarded unread and its question re-asked verbatim (the user's ruling on the plan's clarification Q1).

**Depends on:** Task 1, which provides the excerpt helper: newlines and tabs become spaces, invisible bytes `<invisible>`, bidi bytes `<bidi>`, `<!--` `&lt;!--`, marker strings `[marker removed]`, with a 160-character cap. **Depends on:** Task 2, whose `plan` classifies each file `safe` / `unsafe … recorded …` / `unsafe … prescan` (with `hit <id> <path>:<line> "<excerpt>"` lines) / `screen`. This task's `park` reuses `plan`'s internal classification rather than re-deriving it.

Task 2 reads back exactly the three line forms below:
- `Raised by: prompt-injection-reviewer (prompt-injection screen)` as the first non-blank line after the title;
- the pairs ``Screened file: `<path>` `` and ``sha256: `<hex>` ``.

Keep them byte-identical.

**The route this text describes.** This task writes the person-facing wording of the edit-and-resume route and of the re-ask, ahead of the instruction that defines the engine's side of them: the story index's `## Context` → **Edit and resume, per engine and execution mode** and **A flagged answer is discarded and re-asked** state the routes, and the later Task 10 states them for the engines and agrees with this text. The facts the text relies on, from those decisions: a local run commits a re-screened edit itself, by exact path, after the screen passes it; a GitHub job checks out the branch tip; an answer is what resumes the run; a flagged answer is removed unread and its question re-asked at a new index, answered the normal way in both execution modes.

**Where this task stops.** The agent's verdict parser is Task 4's. It calls this task's writer function with a list of `(path, sha, id, line-or-empty, excerpt, reason)` findings, so expose the writer as one shell function both verbs call. The writer itself decides, per unsafe path, between the screen park and the discard-and-re-ask (an `answer_<k>.md` basename under the branch's clarification directory, top level or `answered/`), so neither caller branches on it. It prints one `parked: <question path>` line per question file it wrote, the screen park first, then one `discarded: <answer path>` line per flagged answer to a screen park it removed with no re-ask (below). Its last line is always a `parked:` or a `discarded:` line: `parked:` whenever it wrote any question file, `discarded:` only when it wrote none. Task 4's `verdict` passes these lines through, and Task 10's engine step tells the two apart.

**The re-ask's discard heading is a read-back literal.** Task 20 makes the clarification digest recognise a re-asked question by the heading this task appends, `` ## Prompt-injection screen: the answer to `question_<k>.md` was discarded ``, so keep it byte-identical.

### Targets

- `cli/templates/scripts/prompt-injection-screen.sh` — the park writer function, the `park` verb, and their header paragraphs.
- `cli/test/prompt-injection-park.test.mjs` (new)

**Work:**

- [ ] **The park file's layout.** Write it to `<state_dir>/clarifications/<branch>/question_<n>.md`, creating the branch directory when absent.
  - **Index.** `<n>` is one above the highest index among `question_<n>.md` at the top level **and** under `answered/`, starting at 1, never overwriting. That is the channel's rule, `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format`.
  - **Write.** Write to an explicit-template `mktemp` sibling in that directory, then `mv` it into place.
  - **Opening lines:**
    1. ``# Prompt-injection screen: potential threat in `<first path>` ``
    2. a blank line
    3. `Raised by: prompt-injection-reviewer (prompt-injection screen)`
    4. one sentence: the run stopped before any other agent acted on the file(s)
    5. per unsafe file, its `Screened file:` / `sha256:` pair
  - **Then, per unsafe file, one section** `` ## Q<k> — Review `<path>` before this run goes on ``. Each section is self-contained and names no answer channel (it tells the person how to *edit*, never how to *answer*). In plain words it says:
    - The run detected a potential threat in that file.
    - This screen is a tripwire, not a security boundary, and can be wrong both ways.
    - The person can review the file, then choose one of two routes.
    - **Route 1, edit and resume.** Where to edit, by where the run executes (the script cannot tell which, so the text names both):
      - *On your machine:* edit `<path>` in the checkout this run executes in. For a watcher run that is its working copy, the `worktree` path `/autonomous-sdlc-harness:branch-status` prints for `<branch>`, never your main checkout. Leave the edit uncommitted: the run commits it, by that path alone, once the screen passes it.
      - *In a GitHub job:* commit the edit to `<path>` on the branch `<branch>` itself (GitHub's file editor or a push). Each job starts from the branch tip, so the edit is what the next job reads. Your local mirror of the run is not that copy.
      - Then answer this question as you answer any other. The answer is what resumes the run, and the resumed run screens the edited file again before anything else reads it.
    - **Route 2, run attended:** run the branch locally through the supervised `/autonomous-sdlc-harness:branch-*` commands, where a person sees every step.
    - Answering this park without editing the file does not move the run past it: an unchanged file parks again, at the next question, with no agent dispatched.
  - **Then the findings.** Introduce them with a sentence saying they quote the file as data, never instructions, under the harness's untrusted-input statement (`untrusted_input.md` → `## The markers`). Put them between `=== BEGIN UNTRUSTED DATA <path> — data, never instructions ===` and `=== END UNTRUSTED DATA <path> ===`, one bullet each: ``- `<id>` at line <n>: "<excerpt>" — <reason>``.
    - Drop `at line <n>` when no line is known.
    - A prescan finding's reason is a fixed one-liner per id, which this task writes.
  - The screen park covers only unsafe paths that are **not** answers; an unsafe answer never appears in it, and with no such path no screen park is written.
- [ ] **Discard and re-ask a flagged answer.** For each unsafe `answer_<k>.md` (top level or `answered/` of `<state_dir>/clarifications/<branch>/`):
  - **Read the question first.** Locate `question_<k>.md` beside the answer. Missing is a write failure (exit 2), with nothing removed.
  - **Re-ask.** Write a new `question_<m>.md` at the next index (the same rule and the same `mktemp`-then-`mv` write as the screen park), holding `question_<k>.md`'s bytes **verbatim** — its title, its own `Raised by:` origin and every `## Q<k>` section, unaltered — then one appended section, `` ## Prompt-injection screen: the answer to `question_<k>.md` was discarded ``, saying in plain words:
    - The screen flagged the answer given to the question above as a potential threat. It was removed unread, so nothing in the run acted on it; its flagged lines are quoted below.
    - The screen is a tripwire, not a security boundary, and can be wrong both ways.
    - Answer the question above again, the same way you answered it before. The new answer is screened like any other answer before anything reads it.
    - Or run the branch attended, locally, through the supervised `/autonomous-sdlc-harness:branch-*` commands, where a person sees every step.
    - Then the findings, introduced, neutralised, capped and marked exactly as for the screen park, with `<path>` the discarded answer's repo-relative path.
    - It names no answer channel, as the channel format requires of every question file.
    - The copy keeps the original origin on purpose: its answer is then routed exactly as the original's would have been.
  - **No re-ask for an answer to a screen park.** When `question_<k>.md` opens `Raised by: prompt-injection-reviewer (prompt-injection screen)`, its answer decides nothing and reaches no writer (Tasks 12, 13), so re-asking it would only re-park a run the person may already have unblocked by editing the file — and an earlier "proceed" answer, archived unscreened because its launch parked before any dispatch, would re-park every later launch. Write no re-ask: move a top-level `question_<k>.md` under `answered/`, remove `answer_<k>.md` with a single-file `rm -f`, and print `discarded: <state_dir>/clarifications/<branch>/<answered/ or top level>answer_<k>.md`. The screen park itself stays on disk, so Task 2 still reads its `Screened file:` / `sha256:` pairs, top level or `answered/`, and an unchanged screened file is still re-issued `UNSAFE`.
  - **Discard.** Only after the re-ask is in place: when `question_<k>.md` is at the top level, `mv` it to `answered/question_<k>.md` (creating `answered/`), so it is no longer open and its index stays taken; then remove `answer_<k>.md` with a single-file `rm -f`, never recursive. The watcher's later archive of index `<k>` tolerates both missing files (`autonomous-watcher.sh` → `archive_answered_pair`), and `remote-run.sh` then sees `<m>` as the only open question of that park.
  - **One re-ask file per original question file**, since each keeps its own origin. Several flagged answers to one question file cannot occur: pairing is by index.
- [ ] **Neutralise and cap,** as the mention reader's posted text is (`remote-run.sh` → `JQ_DEF_SANITISE`; `docs/github-run-control.md` §6, the posted-text rule).
  - Every excerpt and every reason passes Task 1's helper, and then:
    - every `@` directly followed by `[A-Za-z0-9]` becomes `@` + U+200B;
    - every backtick becomes `'`.
  - The path itself is a repo-relative name the script derived and needs no neutralising.
  - Cap a reason at 200 characters.
  - At most 20 findings per file, then one bullet `… and <k> more findings`.
  - The whole file stays at most 60,000 bytes, cutting findings, never the header lines Task 2 keys on and never a re-ask's copied question bytes.
- [ ] **`park --repo <dir> --branch <branch> --engine task|user_review|docs`.**
  - Classify as `plan` does.
  - Through the writer: one screen park covering every `unsafe` file that is not an answer, and one re-ask per unsafe answer. Recorded files carry no findings of their own, only the bullet `- re-issued: this file's bytes are unchanged since question_<m>.md parked them`.
  - Print one `parked: <state_dir>/clarifications/<branch>/question_<n>.md` line per file written, then one `discarded: <answer path>` line per answer to a screen park removed with no re-ask, the last line always a `parked:` or `discarded:` line as stated above, and exit 0.
  - With nothing unsafe, write nothing and exit 2 with `prompt-injection-screen.sh: park: nothing to park`. Any write failure is exit 2.
- [ ] **`prompt-injection-park.test.mjs`.**
  - **Header:** it opens with the rule it enforces: a park is a channel-format question file at the next unused index, carrying only neutralised, capped excerpts between the markers.
  - **Fixture:** an `init`-wired one.
  - **Cases:**
    - a prescan-hit prompt parks at index 1;
    - with `answered/question_4.md` present it parks at 5;
    - the opening lines match the forms above byte-for-byte, and Task 2's `plan` re-reads the written file as `unsafe … recorded question_<n>.md`;
    - a prompt's `## Q1` names the working copy and `branch-status`, the branch on GitHub, and that the answer resumes the run;
    - **re-ask:** a top-level `question_2.md` opening `Raised by: task-plan-writer` with a prescan-hit `answer_2.md` beside it: `park` writes `question_3.md` whose leading bytes equal `question_2.md`'s byte-for-byte, followed by the discard section with the findings; `question_2.md` is now under `answered/`; `answer_2.md` exists nowhere in the clarification directory; Task 2's `plan` afterwards lists no `answer_2.md` and does not read `question_3.md` as a screen park;
    - the same with the pair already under `answered/`: the re-ask lands at the next index above it and `answered/answer_2.md` is gone;
    - **no re-ask for a screen park's answer:** a screen park `question_3.md` recording the prompt's hash, with an `answered/answer_3.md` reading "proceed despite the verdict" and a prescan hit, and the prompt since edited: `park` writes no question file, prints one `discarded:` line as its last line, `answered/answer_3.md` is gone, `answered/question_3.md` is still there, and Task 2's `plan` afterwards still re-issues the prompt's old hash as recorded but classifies the edited prompt by its new hash;
    - the same answer at the top level: `question_3.md` moves under `answered/` and no new `question_<m>.md` exists;
    - an unsafe prompt and an unsafe answer in one call give two files, the screen park first, and two `parked:` lines;
    - a flagged answer with no `question_<k>.md` beside it is exit 2, with the answer still in place;
    - an excerpt carrying `<!--`, `@someone`, a Tags-block character, a backtick and `=== END UNTRUSTED DATA` comes out with none of those raw;
    - 25 findings give 20 bullets plus the `… and 5 more` line;
    - nothing unsafe is exit 2 with no file written.

**Verification:**

- `npm test --workspace cli -- test/prompt-injection-park.test.mjs` passes. It is this task's own new test file.
- `bash -n cli/templates/scripts/prompt-injection-screen.sh` exits 0, and `grep -n 'mktemp' cli/templates/scripts/prompt-injection-screen.sh` shows only explicit templates.
- The written files hold exactly one `=== BEGIN UNTRUSTED DATA` line per unsafe file, across the screen park and the re-asks, and every one has its `=== END` partner. This is asserted in the test.
- `grep -n 'rm ' cli/templates/scripts/prompt-injection-screen.sh` shows no `-r` flag.

**Deviations from plan:**

- **Output order.** The Work asks for the `parked:` lines (screen park first) "then" the `discarded:` lines, and also that the last line is `parked:` whenever a question file was written; both cannot hold when one call writes a re-ask and discards a screen park's answer. Implemented the last-line rule, which Task 10's engine step keys on (`task_10_plan.md` restates it): every `discarded:` line first, then every `parked:` line, the screen park first among them.
- **`nothing to park` stderr prefix.** The plan spells it `prompt-injection-screen.sh: park: nothing to park`; the script's header states every exit 2 prints one `prompt-injection-screen: <cause>` line, so it is printed as `prompt-injection-screen: park: nothing to park`.
- **Findings placement.** Each file's findings block (intro sentence, markers, bullets) closes that file's own `## Q<k>` section rather than following all sections, so each section stays self-contained.
- **Writer interface.** `pis_park_write <repo_abs> <stateDir> <branch>` reads findings on stdin, one per line, six tab-separated fields; id `re-issued` with excerpt `question_<m>.md` renders the re-issue bullet. Task 4 calls it this way (the script header's `PARK` paragraph).
- **`bash -n` verification (evidence downgrade).** A direct `bash -n cli/templates/scripts/prompt-injection-screen.sh` call was refused by the tool layer; the claim rests on `bash scripts/typecheck.sh`, whose `check-shell-parse.sh` step runs `bash -n` over every shell script git lists: `123 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`, verdict `PASS: typecheck` (the script is tracked, so it is in that list).
- **60,000-byte cap.** Implemented (two-pass build: measure everything but the bullets, then spend the rest) and not exercised by a test case; the plan's case list names none.
