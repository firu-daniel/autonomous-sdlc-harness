### Task 6 — Correct the "watcher stamps the run `completed`" consequence clause in §2.0, §2.5, the five autonomous forks and the plan core's G.1

**Goal:** Seven instruction files say what happens to a headless session that ends its turn with nothing pending. In §2.5 and the five forks it reads *"the watcher stamps the run **`completed`** and notifies **success**"*. §2.0's ⚠️ paragraph says the run *"is stamped `completed`"*. The plan core's `### G.1` clause (c) says it is *"classified `completed` behind a success notification"*. After Task 3 all of these are false. Such an exit, over an unfinished ledger, becomes registry `paused` with `pause_reason` `unfinished` and waits for a human's resume. Replace only that consequence clause in each site.

**Depends on:** Task 3, which makes `classify_run_exit` turn a zero exit over an unfinished ledger into `status paused`, `pause_reason unfinished`. The ledger is the flow-progress ledger for the task and user-review engines, and the checklist for the docs engine. Nothing auto-resumes it locally. A remote job auto-resumes it a bounded number of times (Task 4), then leaves it paused. This task restates that contract in prose only.

**What this task must not change.** Read the task prompt's constraint *"No orchestration-instruction change"* the way the prompt itself explains it: *"The plugin's flows keep dispatching sub-agents as they do now. This branch adds no rule about `run_in_background`."* So:
- every rule around the clause stays byte-identical. That covers the three-attempt retry budget, the ≤60 s backoff, *never schedule a `Monitor`*, *never end the turn intending to continue*, the self-pause steps, and G.1's clauses (a) and (b) and its BG5/BG6 sentence;
- no sentence about `run_in_background`, background dispatch or the wait ceiling is added anywhere;
- no file's word count may rise, because the change adds no behaviour (`.claude/context/plugin.md` → `## Writing agent prose`, *"An agent's growth is paid for by behaviour"*).
The story index's `## Context`, decision 10, records this reading.

### Targets

- `plugin/instructions/autonomous_pause_and_ledger.md`. Two sites: `### 2.5 Self-pause on sustained API overload (no `PAUSE` request involved)`, the paragraph opening *"In the nothing-pending case (BG1)"*; and `### 2.0 The four pause triggers — one protocol, four ways in`, the closing ⚠️ paragraph.
- `plugin/instructions/plan_orchestration_instructions_autonomous.md` — **Self-pause on API overload.**
- `plugin/instructions/task_plan_writing_instructions_autonomous.md` — **Self-pause on API overload during planning.**
- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` — **API-overload self-pause.**
- `plugin/instructions/user_review_fixes_instructions_autonomous.md` — **Self-pause on API overload.**
- `plugin/instructions/docs_orchestration_instructions_autonomous.md` — `## Honoring a PAUSE`, **Self-pause on API overload.**
- `plugin/instructions/plan_orchestration_instructions_core.md` — `### G.1 Run the gates`, the bullet opening *"Forbidden here, by name: a `Monitor`, a `sleep` of any length in your own command, and ending the turn with the run in flight."*, clause (c).

**Work:**

- [ ] Before editing, record each target's `wc -w` count.
- [ ] `autonomous_pause_and_ledger.md`, two sites:
  - §2.5: replace the sentence running from *"`classify_run_exit` stamps the run **`completed`**"* to *"so even a hand-dropped `RESUME` is ignored."*. The new sentence says `classify_run_exit` finds the ledger unfinished and records the run `paused` with `pause_reason` `unfinished`: the flow stops mid-phase, nothing resumes it on its own, and it waits for `/autonomous-sdlc-harness:branch-resume`. Leave the BG1/BG5/BG6 bullets, the *"A pending task or `Monitor` is still no resumption mechanism"* sentence and everything after it unchanged.
  - §2.0's ⚠️ paragraph: replace only the clause *"and is stamped `completed`"* in *"a run that ends its turn before reaching one still exits `rc=0` with no `PAUSE_ACK` and is stamped `completed`"*. Use one of the same or fewer words saying it is paused as `unfinished` instead of honouring the pause (for example *"and is paused `unfinished`"*). Every other part of the paragraph stays byte-identical, *"**The ack is what fixes classification**"* included.
- [ ] The four code-engine forks carry the same clause, *"and the watcher stamps the run **`completed`** and notifies **success** for <their own object>"*. In each, replace only that clause with one of the same or fewer words, saying the watcher pauses the run as `unfinished` and it waits for a human's resume. Keep each fork's own object phrase (*a flow abandoned mid-phase*, *planning that never converged*, *a fix cycle that never started*) only where the word budget allows. Leave the rest of each paragraph untouched.
- [ ] The docs fork: replace *"and the watcher stamps the run **`completed`** and notifies **success** for a checklist that was never finished"* the same way, naming the checklist as the ledger left unfinished.
- [ ] The plan core, `### G.1`, clause (c): replace only *"`rc=0` with no `PAUSE_ACK`, classified `completed` behind a success notification"*. The replacement uses the same or fewer words and says the exit lands over an unfinished ledger and is recorded `paused` (`unfinished`), awaiting a human resume. The core stays literal-free, so it names **no** slash command, `/autonomous-sdlc-harness:branch-resume` included. Leave clauses (a) and (b), both citations in (c) (`docs/sandbox-verification.md` → BG1 and the §2.5 pointer) and the BG5/BG6 sentence byte-identical.

**Verification:**

- ``git grep -n -e 'stamps the run' -e 'stamped `completed`' -e 'classified `completed`' -- plugin/`` prints nothing.
- `git grep -n 'unfinished' -- <each target>` shows the new clause once per site: twice in `autonomous_pause_and_ledger.md` (§2.0 and §2.5), once in each other target.
- `git grep -n 'branch-resume' -- plugin/instructions/plan_orchestration_instructions_core.md` shows no line the diff adds.
- Each target's `wc -w` is at most its recorded pre-edit count.
- `git diff --stat -- plugin/` lists exactly the seven targets. `git diff -- plugin/` shows one changed sentence or clause per site, and no added line naming `run_in_background` or `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`.
