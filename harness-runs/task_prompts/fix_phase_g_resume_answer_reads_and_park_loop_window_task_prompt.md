Two defects found by #275 §2 (the answered `fixable: 0` park, taken on a throwaway adopter on 2026-11-06; recorded in `docs/sandbox-verification.md` §7 → *The answered `fixable: 0` park, on a throwaway adopter*, rows AP1, AP6 and the park-loop paragraph). Stamp: Claude Code 2.1.319, macOS 15.7.4 arm64, `dev` at `6dfde986`.

## 1. The watcher's resume prompt tells the orchestrator to read Phase G answer files

**Contract.** `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.0 Resolve the round` and G.2: the orchestrator never opens a question or answer file and never acts on its content. It passes the paths in G.2's `Park answer:` clause, and only `test-fix-plan-writer` reads them. `## What you must NOT do` repeats this.

**Observed.** In every Phase G resume of the four runs (six resumes), the orchestrator opened the answer file itself as soon as the engine skill launched, before G.0 ran. Run A's stream line 773 is `Read …/clarifications/<branch>/answer_1.md`. In runs B and C it also quoted the earlier answers' text into the new question files it wrote. Park 2's header reads `Previous park: question_1.md / answer_1.md (answered: "Q1: Fix it, but don't touch the test or the code.")`, and Park 4's quotes all three earlier answers. Dispatches still carried only the paths, and only `test-fix-plan-writer` was handed the pair.

**Cause.** `cli/templates/scripts/autonomous-watcher.sh`, `resume_clause` (around line 3141): *"This is a RESUME: every question file of this park has been answered — consume ALL of these answer files, each paired by index with its question_<i>.md, and resume from the park point rather than restarting: <answer paths>."* That instruction fits the planning fork's Override 2(a), whose orchestrator does append the pairs to the planning writer's dispatch. It contradicts G.0 for a pair whose question names an origin that opens `Phase G`.

**Also seen.** The Phase G `architecture-reviewer` is dispatched with only `story_path: <index>`, yet it opened the answer file too, by following the index's `Park answer consumed:` / `**Authorised by:**` pointer. Decide whether that is allowed. The contract names `test-fix-plan-writer` as the only reader.

**Expected.** A Phase G resume never has the orchestrator open or quote an answer file. Options include:
- the watcher naming the answer files without telling the session to consume them;
- the resume prompt pointing Phase G pairs at G.0;
- the escalation writing the "previous parks" context from paths only.

Pin it in `cli/test` beside `run-gates-park-answer.test.mjs`.

## 2. The park-loop guard's time window misfires on a fast adopter

**Contract.** `docs/watcher.md` §4: a park-resume is a no-progress cycle when **either** detector fires: no question file above the highest index at resume, **or** a re-park within `PARK_LOOP_WINDOW_SECS` (default 300). After `PARK_LOOP_MAX_CYCLES` (2) the run is held as `park_loop`.

**Observed (run B).** `watcher.log`:
```
resume made no progress (cycle 1/2: re-parked after 98s, inside PARK_LOOP_WINDOW_SECS=300)
resume made no progress (cycle 2/2: re-parked after 215s, inside PARK_LOOP_WINDOW_SECS=300)
park loop — 2 consecutive resumes made no progress; not resuming it again
```
Both resumes made progress. The first raised `question_2.md` above the previous highest index, because the planner asked a follow-up question. The second ran a whole gate round (`task_round_2`), committed the round-1 index's `Park answer consumed:` revision, and parked on a new `question_3.md`. Only the window fired. On a repository whose gates take seconds, an answered Phase G park routinely re-parks inside 300 s, so two honest answers put a progressing run on hold.

**Expected.** A resume that raised a higher-indexed question file, or that moved the branch's committed tip, is not a no-progress cycle, whatever its duration. Or the window counts only together with the index detector. Update `docs/watcher.md` §4 and the watcher header with it, and pin it in the watcher's test.
