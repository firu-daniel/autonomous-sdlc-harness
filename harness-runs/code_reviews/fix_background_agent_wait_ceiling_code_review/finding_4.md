### 4. The corrected consequence clauses say an `unfinished` pause waits "until a human resumes it", but in a GitHub job it is auto-resumed

**File:** `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.1 Run the gates`, clause (c): "awaiting human resume". Also the five autonomous forks' self-pause paragraphs, each of which ends "until a human resumes it."

Task 6 replaced the old "stamps the run `completed`" consequence clause with the new outcome. It also added a claim about who resumes the run, and that claim is false for the job mode that runs these same forks. In a GitHub job, `run_job`'s new `unfinished)` arm resumes the run through `job_auto_resume`, up to `REMOTE_AUTO_RESUME_MAX` times (`docs/remote-execution.md` → `### API errors`: *"three failure shapes earn a bounded automatic resume in the job"*). No orchestrator decision depends on the clause: each one warns against ending the turn, and the warning holds without it. The added words are also wrong, and they cost words in files that `.claude/context/plugin.md` → `## Writing agent prose` asks to keep from growing.

**Fix:** delete the resume claim at each site and keep the rest of each clause as Task 6 left it.

- `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.1 Run the gates`, clause (c): `ledger unfinished: \`paused\` (\`unfinished\`), awaiting human resume` → `ledger unfinished: \`paused\` (\`unfinished\`)`.
- `plugin/instructions/plan_orchestration_instructions_autonomous.md` → **Self-pause on API overload.**: `pauses the flow abandoned mid-phase as \`unfinished\` until a human resumes it.` → `pauses the flow abandoned mid-phase as \`unfinished\`.`
- `plugin/instructions/user_review_fixes_instructions_autonomous.md` → **Self-pause on API overload.**: `pauses the flow abandoned mid-phase as \`unfinished\` until a human resumes it.` → `pauses the flow abandoned mid-phase as \`unfinished\`.`
- `plugin/instructions/task_plan_writing_instructions_autonomous.md` → **Self-pause on API overload during planning.**: `pauses planning that never converged as \`unfinished\` until a human resumes it.` → `pauses planning that never converged as \`unfinished\`.`
- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → **API-overload self-pause.**: `pauses a fix cycle that never started as \`unfinished\` until a human resumes it.` → `pauses a fix cycle that never started as \`unfinished\`.`
- `plugin/instructions/docs_orchestration_instructions_autonomous.md` → **Self-pause on API overload.**: `pauses the run \`unfinished\` until a human resumes it.` → `pauses the run \`unfinished\`.`

Before editing, run `grep -rn 'until a human resumes it\|awaiting human resume' plugin/` and confirm that it lists exactly these six sites. No test covers this prose, so this fix runs none.
