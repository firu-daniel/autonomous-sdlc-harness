# Task plan review — iteration 0

## Must Fix
1. **The new no-read sentences conflict with the Phase D clarification digest, and no derivation entry reaches it.** Files: the story index (`fix_phase_g_resume_answer_reads_and_park_loop_window_story_plan.md` → `## Scope register` and `## Context`), plus `task_1_plan.md` (W5), `task_3_plan.md` (W3) and `task_4_plan.md` (W3), with the knock-on to `task_5_plan.md` (pins).
   This is disposition (ii) of the derivation test. No derivation entry reaches the site below.

   **The site.** `plugin/instructions/clarification_digest_instructions.md` is the last Phase D write of both autonomous flows. It is activated by `plugin/instructions/plan_orchestration_instructions_autonomous.md` → Override J and by `plugin/instructions/user_review_fixes_instructions_autonomous.md` → Override J. In `## What is digested` it reads every `question_<n>.md`, top level and `answered/`. In `## The entry format` its **answered:** field is *"the operator's ruling, the answer file quoted verbatim"*. Phase G answers are not excluded.

   **Where the conflict happens.** A Phase G resume that gets through its gates goes on to Phase D in the same session. Run B's resume, for example, ran a full gate round. That session's trusted launch prompt would then carry W5 (Task 1): *"Never open or quote an answer file whose question file names an origin that opens Phase G"*. The two autonomous forks would carry W3 (Tasks 3 and 4): *"Never open, quote or summarise a Phase G pair's `answer_<n>.md`"*. Both are unscoped. At Phase D the orchestrator then has two bad options:
   - break the launch prompt and the fork rule to quote the answer verbatim; or
   - leave the Phase G answer out, or record it as *"no answer file on disk — resolved out of band"*. That record would be false, which is the silence the digest exists to remove.

   The plan never mentions the digest. The register gives it no row, and the Context records no decision about whether the digest stays the one legitimate quoter.

   **Sites the corrected entry newly reaches:** `plugin/instructions/clarification_digest_instructions.md` (`## What is digested`; `## The entry format` → **answered:**).

   **Corrected derivation entry (strictly wider than entry 3):** `git grep -l -e 'Park answer consumed' -e 'Authorised by' -e 'never open a question or answer file' -e "open a park's question or answer file" -e 'answer file quoted verbatim' -- plugin cli/templates docs`
   **Fix:**
   - In the story index, replace derivation entry 3 with the wider command above.
   - Add a register row for `plugin/instructions/clarification_digest_instructions.md` with an explicit disposition.
   - Add a `## Context` decision that settles the conflict. Either:
     - scope W5 and W3 to the resume path, so they plainly do not bind Phase D's digest. One way is to name the digest as the one later reader that quotes the answer into its durable record. Then restate the rescoped W5 byte-for-byte in `task_1_plan.md`, and W3 in `task_3_plan.md`, `task_4_plan.md` and `task_5_plan.md`. Or:
     - change the digest's handling of Phase G pairs in a plugin task. Give it its own `### Targets` line and Task 5 pin, and give the row a `change` disposition.

   Whichever you choose, the W1–W5 strings in the index's **The wire strings** block and in every per-task file that restates them must stay byte-identical.
