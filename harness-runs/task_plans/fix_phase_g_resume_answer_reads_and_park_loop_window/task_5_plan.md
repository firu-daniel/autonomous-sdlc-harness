### Task 5 — Pin the Phase G no-read rules in `cli/test/run-gates-park-answer.test.mjs`

**Goal:** Pin, beside the existing pins of the answered-park route, the strings that keep every orchestrator and the Phase G architecture reviewer out of a Phase G answer file. If one of these strings drifts or disappears, the result is silent until a resumed run reads an answer it should not, which is the drift this suite already exists to catch (its header: *"A drift between producer and consumer here is silent until a parked run resumes"*). The task prompt asks for the pin *"in `cli/test` beside `run-gates-park-answer.test.mjs`"*. This task extends that suite, because its rule (one route, spelled identically by every file that writes or reads it) is the rule these strings follow.

**Depends on:** Tasks 3 and 4, which wrote the strings this task pins. Each must be matched byte-for-byte:

- **W1** — in `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.2 Write and review the test fix plan`:
  `A later park's question file names an earlier park by its question and answer paths alone, never by quoting or summarising either file.`
- **W2** — in the same file → `## What you must NOT do`, a line that starts with:
  ``- Do NOT open a park's question or answer file before Phase D, and never compose a dispatch or a question file from its content.``
- **W3** — in each of these three sections:
  - `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability` (Task 3);
  - `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability` (Task 4);
  - `plugin/instructions/user_review_fixes_instructions_autonomous.md` → ``### `<escalate>` / `<ask>` — the park-and-yield clarification reroute`` (Task 4).

  The passage is:
  ``Before Phase D, never open, quote or summarise a Phase G pair's `answer_<n>.md`: tell the pair's origin from its `question_<n>.md` alone. Phase D's clarification digest is the one later step that reads it, and it quotes it verbatim into its committed record.``

  Pin the whole passage, both sentences. The "Before Phase D" scope and the digest sentence are what keep the rule from binding Phase D's clarification digest (`plugin/instructions/clarification_digest_instructions.md`), which quotes every answer verbatim, Phase G pairs included (story index `## Context` → **Decision — Phase D's clarification digest stays the one later reader**). A drift that drops either one is the conflict this pin exists to catch. The same holds for W2's `before Phase D`.
- **W4** — in `plugin/agents/architecture-reviewer.md` → `## Process` (Task 3):
  ``Never open an answer file that the index's `Park answer consumed:` line or a finding's `**Authorised by:**` line names: grade the quoted sentence, because `test-fix-plan-writer` is the answer's only reader.``

This task changes no plugin file and no watcher code. The watcher's resume prompt is pinned behaviourally by Task 1's case in `cli/test/watcher-park-resume.test.mjs`, and this task does not pin it a second time.

### Targets

- `cli/test/run-gates-park-answer.test.mjs`.

**Work:**

- [ ] Add read handles for the two files the suite does not load yet, in the style of the existing `const … = read(…)` lines: `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` and `plugin/agents/architecture-reviewer.md`. The suite already loads `plugin/instructions/user_review_fixes_instructions_autonomous.md` as `REVIEW_FORK`.
- [ ] Add case `(f) the core forbids reading a Phase G answer and quoting one into a question file`. Slice `### G.2 Write and review the test fix plan` with `section()` and assert it includes W1. Slice `## What you must NOT do` and assert `lineStarting(sec, '- Do NOT open a park')` equals the full W2 bullet, including its second sentence ``Its paths travel only in G.2's `Park answer:` clause.``.
- [ ] Add case `(g) every fork an orchestrator resumes through forbids opening a Phase G answer`. Assert that each of W3's three sections, sliced with `section()` under the exact heading above, includes W3.
- [ ] Add case `(h) the Phase G architecture reviewer grades the quoted sentence and never opens the answer`. Assert that `## Process` of `plugin/agents/architecture-reviewer.md` includes W4.
- [ ] In the header, extend the rule sentence so it also covers *before Phase D, no orchestrator and no reviewer but `test-fix-plan-writer` reads a Phase G answer, and Phase D's clarification digest is the one later reader*. Name the deliberately uncovered behaviour beside the existing one: whether a live session actually refrains from the read needs a live session, which no test in this package starts.

**Verification:**

- `npm test --workspace cli -- test/run-gates-park-answer.test.mjs`, run from the repository root as one plain foreground command, passes, and the existing cases (a)–(e) are unchanged.
- Deleting W3 from any one of its three sections makes case (g) fail with a message naming that file and heading, because `section()` builds its `where` label from both. This is the third `Top risks:` entry in the story index. Check it by reading the assertion messages, not by editing a plugin file.
