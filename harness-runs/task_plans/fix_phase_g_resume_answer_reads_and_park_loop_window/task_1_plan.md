### Task 1 — Name the answer files in the watcher's resume prompt without telling the session to consume them, and hand a Phase G pair to G.0

**Goal:** Make the watcher's park-resume prompt name every answer file it unblocked, by path, without telling the session to read them. The prompt must also say that a pair whose question names an origin that opens `Phase G` is read before Phase D only by `test-fix-plan-writer`, which gets it through G.0, and after it only by Phase D's clarification digest. Today the prompt says *"consume ALL of these answer files"*, and every observed Phase G resume opened the answer file before G.0 ran (`docs/sandbox-verification.md` §7, AP1 and AP6).

**Where this task stops.** This task changes only the prompt string and its comment in the watcher template, plus that string's behavioural test. It does not touch:

- the park-loop guard, which is Task 2's;
- the plugin prose that states the same rule to the orchestrator, which is Tasks 3 and 4's;
- the self-adopted copy `scripts/autonomous-watcher.sh`, which is re-rendered by a self-adopt chore and not by this branch (story index `## Context` → **The self-adopted copy.**).

The prompt's G.0 pointer names a section that already exists at `HEAD` (`plugin/instructions/plan_orchestration_instructions_core.md` → `### G.0 Resolve the round`), so this task depends on no other task.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine`: the `resume_clause` assignment and the comment block directly above it, which opens `# On a RESUME, name every top-level answer file the watcher just unblocked so`.
- `cli/test/watcher-park-resume.test.mjs`: its header, plus one new case.

**Work:**

- [ ] `resume_clause`: replace the string with exactly **W5**, keeping the `for i in $resume_indexes` loop that builds `resume_files` unchanged. W5, with `${resume_files}` expanded as today and a trailing space at the end, as now:
  ``This is a RESUME: every question file of this park has been answered. Its answer files, each paired by index with its question_<i>.md, are: ${resume_files}. Resume from the park point rather than restarting; each answer file is read only by the step your flow's instructions name for it. Before Phase D, never open or quote an answer file whose question file names an origin that opens Phase G: Phase G's G.0 finds that pair and passes its paths to test-fix-plan-writer, its only reader until Phase D's clarification digest quotes it. ``
  The "Before Phase D" scope and the digest clause are load-bearing. Both autonomous flows end Phase D with the clarification digest (`plugin/instructions/clarification_digest_instructions.md`), which quotes every answer file verbatim, Phase G pairs included, and a resumed session that passes its gates reaches it under this same launch prompt (story index `## Context` → **Decision — Phase D's clarification digest stays the one later reader**).
  Two things must stay byte-identical, because other code keys on them. The first sentence, up to `answered`, is matched by `cli/test/watcher-remote-job.test.mjs` → `PARK_RESUME`. Each path's form, `${state_rel}/clarifications/${branch}/answer_${i}.md`, is matched by `answersNamed` in `cli/test/watcher-park-resume.test.mjs`. Split the string over lines with the same `\` continuation style the surrounding clauses use. The text inside it is one paragraph.
- [ ] The comment above `resume_clause`: replace "so the engine consumes all of them" with what the clause does now. It names every unblocked answer file and assigns no reader: the flow's own resume step decides who reads each pair. Before Phase D, a pair whose question names an origin that opens `Phase G` is read only by `test-fix-plan-writer`, through G.0, and Phase D's clarification digest is the one later reader (cite `plugin/instructions/clarification_digest_instructions.md` and `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.0 Resolve the round` repo-relative, as this file cites other repository files). Keep the comment's consume-then-archive sentence.
- [ ] `cli/test/watcher-park-resume.test.mjs`: add one case, run once with record `engine: 'task'` and once with `engine: 'user_review'`. Both engines' prompts carry `${resume_clause}`, and the user-review fix flow runs Phase G too. Each run does the following:
  - writes `question_1.md` with the body `Raised by: Phase G test-fix-plan-writer\n\n## Q1\n`;
  - seeds the record with that engine and writes `answer_1.md`;
  - sets the stub to `:` and ticks once.

  Then assert on the one captured prompt:
  - `answersNamed(prompt, w.branch)` is `[1]`;
  - the prompt does not match `/consume/i`;
  - the prompt contains `Before Phase D, never open or quote an answer file whose question file names an origin that opens Phase G` and `Phase G's G.0 finds that pair and passes its paths to test-fix-plan-writer, its only reader until Phase D's clarification digest quotes it.`;
  - the prompt contains `This is a RESUME: every question file of this park has been answered`.

  Assert nothing about the record's status after the exit: the stub writes no ledger, and this case is about the prompt.
- [ ] The same file's header: add the second rule this case enforces, in the header's own style. The resume prompt names every answer it unblocked by path and assigns no reader, and before Phase D it hands a Phase G pair to G.0 rather than to the session.

**Verification:**

- `npm test --workspace cli -- test/watcher-park-resume.test.mjs`, run from the repository root as one plain foreground command, passes. The new case passes for both engines, and the existing cases still read every named answer through `answersNamed`.
- `git grep -n 'consume ALL' -- cli/templates` prints nothing.
- The resume prompt's first sentence still reads `This is a RESUME: every question file of this park has been answered`. This is the first `Top risks:` entry in the story index: another suite keys on that sentence.
