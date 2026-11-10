# Story: A prompt-injection screen ahead of every unattended run

## Context

This branch adds `prompt-injection-reviewer`, a read-only agent that is the first agent an autonomous engine dispatches. It reads each untrusted input file a person added to the run and returns a closed verdict. On `SAFE` the flow continues. On `UNSAFE` the run parks with the verdict, before any agent holding `Bash`/`Write` reads the file. Ahead of the agent, a deterministic pre-scan in a shipped script flags the classes an LLM is the wrong tool for. Every document this branch writes calls the screen **a tripwire, not a boundary**: an adaptive attacker can get past an LLM screen. The containment that holds is still the permission profile, the guard hooks, the protected-branch refusals, the never-merges boundary and the sandbox recorded in `docs/sandbox-record.md`, and nothing here relaxes any of them. No code path reads `SAFE` as a permission for anything.

**The pieces, and the task that owns each.** Each contract is stated once here and defined in its owning task file. A consumer task restates the part it calls.

- **The script, `prompt-injection-screen.sh`** (Tasks 1–4), shipped from `cli/templates/scripts/` as a new `OUTER_LOOP_SCRIPTS` row: `agentInvocable: true`, no `runsUnsandboxed`, and no `DENY_SCRIPT_BASENAMES` entry. The orchestrating session always runs **the main checkout's copy**, `bash <MAIN_REPO>/<scripts_dir>/prompt-injection-screen.sh <verb> --repo <repo_root> …`, spelled literally with no `$`, inside the sandbox. It has four verbs:
  - `prescan` (Task 1): the deterministic classes and the SHA-256.
  - `plan` (Task 2): the screened set, the record and the classification.
  - `park` (Task 3): writes the park file for the files `plan` found unsafe.
  - `verdict` (Task 4): the strict parser of the agent's return, which parks on `UNSAFE`.
- **The agent, `plugin/agents/prompt-injection-reviewer.md`** (Task 8; its entry in the untrusted-input corpus test, Task 19, shipped right after it). Its tools are `Read`, `Grep`, `Glob`, with `model: inherit`. It owns the 14 check ids in its `## The checks` table, and the script mirrors them (Task 4's `PI_CHECK_IDS`, held equal by Task 9's test).
- **The screen step, `plugin/instructions/prompt_injection_screen.md`** (Task 10). It is the one statement of when and how an engine runs the screen, and the three autonomous engine commands point at it (Tasks 12–14).
- **The ledger entries `P0.` / `R0.`** "Untrusted input screened (prompt-injection-reviewer SAFE)". Each carries a record of indented `  - screened: <repo-relative path> sha256=<64 lowercase hex>` lines. The ledger shape is in `autonomous_pause_and_ledger.md` (Task 11). The forks write it (Tasks 12, 13). The shell reader is `hr_ledger_phases` (Task 5).

**Check ids (wire strings).** These are the agent's 14, in the task prompt's order: `destructive-intent`, `attack`, `authority-claim`, `unrelated-request`, `foreign-execution`, `web-download`, `secret-access`, `harness-weakening`, `run-mode-abuse`, `backdoor`, `supply-chain`, `outside-checkout`, `hidden-instruction`, `pressure`. The script adds six of its own, which no agent emits: `prescan-invisible`, `prescan-bidi`, `prescan-html-comment`, `prescan-encoded-blob`, `prescan-marker` and `malformed-verdict`.

**The park file (Task 3 owns it; Task 2 reads it back).** It is written in the clarification-channel format (`task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format`), as the next `question_<n>.md` above the highest index at the top level and under `answered/`. It opens with these lines:
- `Raised by: prompt-injection-reviewer (prompt-injection screen)`
- for each unsafe file, the pair ``Screened file: `<path>` `` and ``sha256: `<hex>` ``

Then come one `## Q<k>` per unsafe file and the findings. The findings are quoted between the untrusted-data markers, neutralised and capped the way the mention reader's posted text is. The watcher, `branch-status` and the GitHub route already read this shape.

**Decisions this plan takes, with the reason for each:**
- **Where the pre-scan runs: in a shipped wrapper, invoked as the main checkout's copy, not in the watcher.**
  - A watcher scan would miss the manual entry point of each engine command.
  - It would also put the record (the ledger) and the scan in two processes.
  - The trust worry the prompt raises is a worktree's own sandbox-writable copy. The main checkout's copy of a top-level outer-loop script is write-protected (`cli/src/generators/writeProtection.ts`), and it is invoked by literal path, like `commit-on-branch.sh`.
  - In a GitHub job the checkout *is* the main one, so the same spelling holds there.
- **The screened set, per engine** (Task 2):
  - task engine: the task prompt and every `answer_<n>.md` (top level and `answered/`);
  - user-review engine: the task prompt where it exists, every `<branch>_review[_<n>].md`, and every answer;
  - docs engine: the docs checklist only.
  - Nothing else is screened (goal 2's exclusions).
- **When it runs.** At every engine launch, before anything reads the set:
  - in the task engine, before the run-mode grep and before `task-plan-writer`;
  - in the user-review engine, after it confirms a review file exists and before its tree-state precondition (step 5), and so before its run-mode preflight and before `user-review-fix-plan-writer`. Step 5 halts on any modified tracked file, and an edited task prompt or review round is one, so a screen after it would never see the edit (Task 13);
  - in the docs engine, before its loop.

  Resumes are launches, so a new answer, a new round or an edited file is screened before the orchestrator reads it.
- **Edit and resume, per engine and execution mode** (goal 4's first route; Task 10 → `## Edit and resume` states it for the engines, Task 3's park text states it for the person). The task prompt, the review rounds and the docs checklist are committed on the run branch; answers are not.
  - **Which copy the person edits.**
    - **Local watcher run, any engine:** the file in the run's own working copy, the `worktree` that `/autonomous-sdlc-harness:branch-status` prints. Never the main checkout, which the run does not read.
    - **Manual entry point:** the checkout the person ran the engine in.
    - **GitHub job, any engine:** the file on the branch `<branch>` itself, committed there through GitHub's file editor or a push. Every job checks out the branch tip (`harness-run.yml` → **Check out the run's branch**, `ref: ${{ inputs.branch }}`). The job's state restore (`hr_remote_bundle_restore`) places only the clarification directory, the pause file, the walker state, planning drafts that never overwrite, and the status file, so nothing overwrites the committed edit.
    - **An `answer_<n>.md` is never edited.** A flagged answer takes the re-ask route below instead, in every engine and both execution modes.
  - **How the edit is committed.** Locally, the person leaves the edit uncommitted, and the screen commits it: once a launch's screen passes a screened file that `git status --short` shows as a modified tracked file, it commits exactly those paths through the main checkout's `commit-on-branch.sh` (subject `chore: Commit re-screened input edit for <branch>`), then `push-branch.sh`, before anything else runs. A refusal or failure halts the engine. This is a new clean-tree commit point (entry 15, Task 11), so the run never continues with a dirty tracked file, and the branch is delivered with the edited file, not the parked one. An untracked file is never staged: answers stay untracked as the channel requires. On GitHub the person's own commit is the commit, and the screen finds nothing to stage.
  - **What triggers the resume.** An answer to the screen park, through whichever channel the person uses: the watcher's `resume_parked_run` once every top-level question has its answer, a local `branch-answer`, or on GitHub the answer comment's `--resume answer` dispatch. The resumed launch's first act is the screen, which re-screens the edited file because its hash changed.
- **A flagged answer is discarded and re-asked** (the user's ruling on the plan's clarification Q1; Task 3 implements it, Task 10 → `## Edit and resume` states it, Task 6 proves the GitHub half). One route for local and GitHub runs alike, no override, and no change to `remote-run.sh restore --resume answer`.
  - **Discarded, never consumed.** When the screen finds an `answer_<k>.md` `UNSAFE` (pre-scan or agent), the park writer removes that answer file with a single-file `rm -f`, and moves its `question_<k>.md` under `answered/` when it sits at the top level. No reader ever sees the answer: neither Override 2(a), G.0, the user-review **On resume**, nor the Phase D digest, which would otherwise quote it into a committed file. The watcher's own archive of that index after the session tolerates the missing files (`autonomous-watcher.sh` → `archive_answered_pair`: *"A missing file on either side is tolerated silently"*).
  - **Re-asked verbatim, beside the findings.** The same park writes a new `question_<m>.md`, at the next index, holding `question_<k>.md`'s bytes unchanged — title, `Raised by:` origin and every `## Q<k>` section — followed by one appended section saying that the answer to `question_<k>.md` was flagged and discarded unread, with the findings between the untrusted-data markers. Because the copy keeps the original origin, its answer is routed exactly as the original's would have been, with no change to any consumer. A question file names no answer channel, so a verbatim copy carries no stale answer-file reference. One re-ask file is written per original question file whose answer was flagged, because each keeps its own origin; a file other than an answer that is unsafe in the same launch still gets the one screen park.
  - **Answered the normal way.** The re-ask is an open, top-level question: locally through `/autonomous-sdlc-harness:branch-answer` or the watcher's resume, on GitHub through an authorised `answer` comment and its `--resume answer` dispatch, which accepts it because the question is open when the answer arrives. The new answer is screened again like any other. The attended run stays available as the fallback the re-ask names.
  - **Except an answer to a screen park: discarded with no re-ask** (Tasks 3, 4 and 10). Such an answer decides nothing and reaches no writer, and only an edit clears a screen park. A "proceed" answer to a screen park is never screened at the launch it resumes, because that launch parks again before any dispatch; it is archived, then screened at the first launch after the person edits the file. Re-asking it then would re-park a run the person has just unblocked, at every launch. So the writer removes it unread, prints `discarded: <answer path>` instead of `parked:`, and the launch goes on; an unchanged screened file still parks from its recorded hash. The Phase D digest records such a question, and a re-asked one, by its own exact arm rather than as *resolved out of band* (Task 20).
  - **Why no new `cli` code beyond the screen.** The restore writes only answers to open top-level questions, and the re-ask is one; the comment forge posts every open question; the watcher counts the re-ask as a new question above the highest index, so it is progress, not `park_loop`.
- **The screen fails closed on anything it does not recognise** (Task 10, step 0). A `plan`, `park` or `verdict` call that the profile refuses, a missing script (`bash` exit 127), any undocumented exit status, or output that does not end in the verb's documented `plan:` / `parked:` / `discarded:` / `verdict:` line halts the engine. The halt is the same park in every engine, written by the session itself and never deferred to an engine command's own missing-input route — the docs engine's route only logs a blocker. Headless, it is a blocker park under the screen's own `Raised by:` line, whose `## Q1` names the failed call and the fix (regenerate the profile, or restore the script). It never proceeds.
- **Re-screen without retry-shopping.**
  - A file whose current hash is recorded `screened:` is skipped.
  - A file whose current hash a screen park already recorded is `UNSAFE` again, with no dispatch. A retry cannot turn a parked file `SAFE`; only an edit can.
  - Every other file is pre-scanned and then, if clean, sent to the agent.
- **Only one record per engine.** Task and user-review runs record `SAFE` hashes in the ledger. The fork's ledger write records them, not the screen step: the creation or re-seed write lays `P0`/`R0` down `[x]` with the record, and a later launch appends to it as a flip. A user-review re-seed carries every earlier `screened:` line forward.
- **The docs engine keeps no record and re-screens its checklist at every launch.** It has no ledger, and its own `[ ]`→`[x]` flips change the checklist's bytes, so a hash record would mismatch on every resume anyway.
  - Its `UNSAFE` stop is the same park file, written to `<state_dir>/clarifications/<branch>/`. That directory exists in every adopter's state tree whatever the phases, and the watcher classifies any question file as `parked` for every engine.
  - So `branch-status`, notifications and the GitHub question comment surface it with no new code, and a resume relaunches the docs engine, whose first act re-screens.
  - A log line alone would end the run as failed or completed, with nothing a person could act on.
- **No unattended override.** No answer, marker or dispatch moves a run past `UNSAFE`.
  - An answer to a screen park is itself screened, and a flagged one is discarded with no re-ask, never consumed.
  - Its `Raised by:` origin keeps it out of every writer dispatch (Tasks 12, 13), and the channel's canonical **Consume-then-archive** statement names that exclusion for both flows (Task 12), so the channel keeps one owner. The same section's **Question file** and **Why one file per park** bullets name the screen as a writing site whose park may span a screen park and its re-asks (Task 12).
  - The parked file stays `UNSAFE` until its bytes change. An answer with no edit parks again at the next index with no agent dispatched. The watcher counts a resume that raised a new question as progress, so these re-parks never become `park_loop`.
- **The supervised and semi-autonomous flows do not run the screen, even as a warning.**
  - They are the escape route an `UNSAFE` park sends the person to: an attended session where the person approves each step under their own permission settings.
  - Gating or nagging that route with the same classifier whose false positive sent them there would add a rubber stamp and teach people to ignore it.
  - Each warning would also cost one dispatch per run.
- **No `SECURITY.md` on this branch.**
  - The conventions route a decision of record to `docs/`, and `docs/sandbox-record.md` is already the document of record for containment.
  - A root `SECURITY.md` is GitHub's vulnerability-reporting surface, a different audience this branch has nothing to say to.
  - A threat model owes every containment layer its measured evidence, which is a branch of its own, not a side effect of adding a tripwire.
- **`examples/notes-app/sdlc-harness/flow_progress/*` is not edited, although the task prompt names it.** `.claude/context/conventions.md` → `## Documents of record` makes that tree a frozen capture: editing it falsifies the record. Its ledger already predates `G.` for the same reason.
  - That fixture's live `.claude/settings.autonomous.json` would gain the new script's entries on a re-render.
  - It sits under a `.claude/` path, whose writes the tool layer refuses ahead of any permission entry, so the re-render is a manual step (below), as `#307` was.
- **The flow-walker graph is not edited.**
  - The screen runs before the walker is first invoked: the walker refuses to start without the ledger's run-mode record.
  - So `P0` is never a walker `ledger:` line.
  - `scripts/check-flow-graph.sh`'s `ledger-id-known` reads ids from the §1.3 template and accepts the new id unedited.
- **`hr_ledger_phases` counts `P0`/`R0` only when the ledger carries the line.** A ledger written before this branch has none and keeps its meaning. A present `[ ]` is pending. This keeps every existing ledger fixture valid (lessons: *a check reading a new field … every path that stands in for that producer*).

**Ordering.** Contract before consumer: the script before the instruction that drives it, and the agent and the instruction before the engines that cite them.
- **Task 19 (`cli`) ships immediately after Task 8 (`plugin`), with no task between them.** This placement is the user's decision on what to build (clarification park 2): Task 8 adds the agent's untrusted-input pointer and its roster entry; the test that pins the set of pointer carriers sits in the `cli` layer, so a `plugin`-tagged task cannot edit it, and the user chose a separate `cli` task adding the one map entry over a cross-layer or catch-all-layer task. The new task is numbered 19 so that no existing task number changes; it sits at walk position 9, and the committer resolves an entry by its `**Task K**` token, never by position. No task file is told to treat any guard failure differently from `unit_loop_core.md` → `## The test-run rule`; see **A harness conflict this plan does not resolve** below.
- **Task 20 (`plugin`) follows Task 14**, after Task 3 fixed the re-ask heading and the screen-park discard it keys on and Task 12 restated the channel section it points at.
- **Task 9 (`cli`) comes after Tasks 4 and 8** only because its mirror case reads both the script's `PI_CHECK_IDS` and the agent's check table.
- **Task 10's instruction deliberately cites nothing in `untrusted_input.md`**, so Task 8's pointer is the only change to that statement's carrier set.
- **Task 13 follows Task 12**, whose canonical **Consume-then-archive** amendment names the user-review flow's screen-park exclusion that Task 13 adds to its own Override 2.

> Assumption: the GitHub route is verified here by test only (Task 6), as the task prompt directs. The check against a real job is a post-release follow-up, listed under Manual setup required.

**A harness conflict this plan does not resolve (raised for the maintainer).** Two harness contracts meet at Task 8 and the plan cannot satisfy both:
- **Single-layer tasks.** Every readiness entry carries exactly one layer, and the layer split puts the new agent (`plugin`) and the corpus test that pins every untrusted-input pointer carrier (`cli`) in different tasks.
- **The tree-guard run** (`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` point 7). That `cli` test is registered in `harness.config.json` → `treeGuards` with `covers: "plugin/**/*.md"`, so Task 8's new `plugin/agents/` file selects it. Until Task 19 adds the agent's entry, the guard fails naming that changed path, which point 7 grades as Task 8's own failure, and Task 8 cannot fix it without leaving its layer — a transient blocker under point 2.

Under the rules as they stand, the implementation loop should therefore be expected to stop at Task 8 with a blocker. Every task file follows those rules as written: none tells an implementer to grade a guard failure differently, and none names that guard. The fix is a harness change, not a task of this branch. For example, the test-run rule could let a plan name a later task in another layer that owns a selected guard's repair, or a cross-layer pair could ship as one unit. Either needs a maintainer's decision on the harness itself (listed under **Manual setup required**).

**Top risks:**
1. **A screen that parks honest work gets switched off.** Task 8's "must not flag" column guards it, and Task 17's benign fixtures (one per must-not-flag case, for example retiring the Ideas Comments module) are how a maintainer measures it.
2. **A retry that turns an unchanged hostile file `SAFE`.** Task 2's recorded-`UNSAFE` re-issue makes it deterministic, and Task 6 proves no answer arriving through `remote-run.sh` moves a parked prompt past `UNSAFE`.
3. **Excerpts that carry the attack into the park or a GitHub comment.** Task 3 neutralises `<!--`, `@`-mentions, invisible and bidi characters and marker strings, and caps size. Task 6 asserts the posted comment body.

**Manual setup required:**
- **Before implementation reaches Task 8, decide the harness conflict above.** It is a decision on the harness's own contracts, not on this branch's work. Under the current test-run rule, Task 8's guard run fails on the untrusted-input corpus test until Task 19 lands, and the unit returns a blocker. Choose a harness change, or accept that the run stops there and finish Tasks 8 and 19 attended. Depends on: Tasks 8 and 19.
- **After this lands on `dev`, regenerate every maintainer's unattended profile.** Re-run `npx autonomous-sdlc-harness init --force` (it takes a `.bak`), or add by hand the two allow forms `Bash(bash <scripts_dir>/prompt-injection-screen.sh:*)` and `Bash(bash <absolute main checkout>/<scripts_dir>/prompt-injection-screen.sh:*)`.
  - The profile is machine-local and `create-if-absent`, and from a run copy the script-allowlist guard does not vouch for the main checkout's copy.
  - Without this, every unattended local run halts at the screen: the profile refuses the first `plan` call, and Task 10's step 0 turns that refusal into a halt with a park naming the refused call and this fix, never a pass.
  - Depends on Task 1's row; Tasks 12–14 make the call.
- **Re-render `examples/notes-app/.claude/settings.autonomous.json`** through the three-clause substitution its README describes, as a separate chore (precedent `#307`). The new row adds `allow`, `denyWrite` and `Edit` deny entries, and Task 7 changes one `_README` line. Depends on Tasks 1 and 7.
- **Post-release follow-up on a real GitHub job.**
  - Release a version from a `dev` that carries this branch (`bash scripts/release.sh <version>`, `docs/development.md` → `## 7. Releasing`).
  - In a test repository, run `npx autonomous-sdlc-harness@<version> init --upgrade-workflows`, then commit and push every path it prints.
  - Then check three things:
    - a hostile issue prompt parks `UNSAFE` inside the job, and its question comment is neutralised;
    - an answer comment's `--resume answer` dispatch re-screens and parks again;
    - an edited prompt is screened again and the run proceeds: commit the edit to the task prompt on the run branch on GitHub, then answer the park's question comment; the resumed job checks out the branch tip, re-screens the changed file, records it on `P0` and goes on (the mechanism in **Edit and resume** above; Task 6 covers the re-screen of a changed prompt by test);
    - a hostile answer comment to an ordinary park is discarded and its question re-asked as a new question comment, and answering that comment resumes the run (the mechanism in **A flagged answer is discarded and re-asked** above; Task 6 covers it by test).
  - Depends on Tasks 6, 10 and 12.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom.
- **Only the committing role flips a marker to `[x]`:** the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none.
- No implementer changes a marker, or edits any other line of this section, in an index a run is iterating.
- `[ ]` markers anywhere else, such as sub-step bullets inside the per-task files, are informational progress markers only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/feat_prompt_injection_reviewer/task_<K>_plan.md`. The order is contract before consumer, as `## Context` → **Ordering** states. Task 19 sits at walk position 9, directly after Task 8, as **Ordering** records, and Task 20 at walk position 16, after Task 14; their numbers are out of sequence only so that no other task's number changes.

1. [x] **Task 1** — Ship `prompt-injection-screen.sh` with its `prescan` verb and its `OUTER_LOOP_SCRIPTS` row _(layer: cli)_ _(points: 20)_
2. [x] **Task 2** — Add the `plan` verb: the screened set, the ledger record and the recorded-`UNSAFE` re-issue _(layer: cli)_ _(points: 20)_
3. [x] **Task 3** — Add the park writer and the `park` verb: neutralised, capped excerpts in the clarification-channel format, and the discard-and-re-ask of a flagged answer _(layer: cli)_ _(points: 20)_
4. [x] **Task 4** — Add the `verdict` verb: the strict parser of the agent's return, failing closed _(layer: cli)_ _(points: 15)_
5. [x] **Task 5** — Count `P0` / `R0` in `hr_ledger_phases` when the ledger carries them _(layer: cli)_ _(points: 10)_
6. [ ] **Task 6** — Prove the GitHub route by test: a screen park posted through `remote-run.sh`, an answer restored by it, and a re-ask answered through it _(layer: cli)_ _(points: 18)_
7. [ ] **Task 7** — Describe the new script and the screen park in the adopter-facing READMEs and the profile template's `_README` _(layer: cli)_ _(points: 10)_
8. [ ] **Task 8** — Add `plugin/agents/prompt-injection-reviewer.md` and join it to the untrusted-input statement _(layer: plugin)_ _(points: 20)_
9. [ ] **Task 19** — Add the agent's entry to the untrusted-input corpus test's rule-pointer set _(layer: cli)_ _(points: 5)_
10. [ ] **Task 9** — Hold the script's check ids equal to the agent's _(layer: cli)_ _(points: 8)_
11. [ ] **Task 10** — Add `plugin/instructions/prompt_injection_screen.md`, the one statement of the screen step _(layer: plugin)_ _(points: 20)_
12. [ ] **Task 11** — Add `P0` / `R0` to the ledger contract, and the screen to the run-mode safety floor _(layer: plugin)_ _(points: 18)_
13. [ ] **Task 12** — Run the screen in the task engine and record it on `P0` _(layer: plugin)_ _(points: 20)_
14. [ ] **Task 13** — Run the screen in the user-review engine and record it on `R0` _(layer: plugin)_ _(points: 15)_
15. [ ] **Task 14** — Run the screen in the docs engine, parking on `UNSAFE` with no record _(layer: plugin)_ _(points: 8)_
16. [ ] **Task 20** — Keep the clarification digest and `branch-answer` true for a screen-discarded answer and a multi-file screen park _(layer: plugin)_ _(points: 12)_
17. [ ] **Task 15** — Describe the screen as a tripwire in `AUTONOMOUS_FLOW.md` and the whiteboard's containment paragraph _(layer: plugin)_ _(points: 20)_
18. [ ] **Task 16** — Bring this repository's self-adopted script and state-dir copies to the template bytes _(layer: general)_ _(points: 10)_
19. [ ] **Task 17** — Add the hand-run fixture set under `evals/prompt-injection-reviewer/` _(layer: general)_ _(points: 15)_
20. [ ] **Task 18** — Add the screen to `README.md` → `## Scope and limits`, `docs/cli.md` and `docs/watcher.md` _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt:
- Goal 3: *"Make every edit site that adding a ledger id requires: the §1.3 templates and `[-]` eligibility list, the owning fork's flip-point bullet, `hr_ledger_phases` in `cli/templates/scripts/lib/harness-run-lib.sh`, the flow-walker graph, the ledger tests, and `examples/notes-app/sdlc-harness/flow_progress/*`."*
- Goal 9: *"`plugin/docs/AUTONOMOUS_FLOW.md` and the whiteboard's containment paragraph, `plugin/hooks/README.md` if it lists the layers, and `README.md` → `## Scope and limits`: one sentence that this is a screen and not a boundary."*

Every derivation entry below runs from the checkout root.

**D1 — ledger-id sites (command).** Re-run verbatim: ``git grep -lE 'P1\. +Task plan converged|R1\. +Fix plan written|P1 P2 P3|^- `(P1|R1)` — ' -- ':!harness-runs/**'``

**D2 — sites the goal-3 predicate names by path (procedure).**
- **Artifact:** the goal-3 sentence quoted above.
- **Traversal:** each named site in its order.
- **Decision rule:** every named site is a row.

**D3 — goal-9 documents (command).** Re-run verbatim: `git grep -lE 'containment|guard hooks|permission profile' -- README.md 'plugin/docs/*.md' plugin/hooks/README.md`

**D4 — prose enumerating the outer-loop script set (command).** Re-run both verbatim:
- `git grep -l --all-match -e 'scratch-run' -e 'task-offer-check' -- '*.md' '*.txt' ':!harness-runs/**' ':!examples/**'`
- `git grep -l --all-match -e 'flow walker' -e 'gate launcher' -- '*.md' ':!harness-runs/**' ':!examples/**'`

**D5 — engine entry commands (command).** Re-run verbatim: `git ls-files 'plugin/commands/branch-start-*autonomous.md'`

**D6 — sites that read the clarification channel's answers, by pair or by the answer file's name (command).** Re-run verbatim: ``git grep -lE 'top-level answered|answered pairs|answer_<n>\.md' -- plugin``

**D7 — citation rosters (command).** Re-run verbatim: `git grep -lF '## Who may cite this' -- plugin`

**D8 — state-dir READMEs that describe the scratch and clarifications directories, template and self-adopted copy (command).** Re-run verbatim: `git grep -lE 'the fetch directories below|A question file is written by' -- 'cli/templates/state-dir/*/README.md' 'harness-runs/*/README.md'`

**D9 — the lessons ledger's rows (procedure).**
- **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`
- **Artifact:** that standing ledger.
- **Traversal:** its topic headings in file order, then the rules under each.
- **Decision rule:** a rule is reached when it sits under `## Trust checks`, because this branch adds a trust check to the unattended path.

**D10 — prose that counts or lists the plugin's agent definitions and instruction files (command).** This branch adds one of each, so any such count goes stale. Re-run verbatim: ``git grep -lEi '(twenty|thirty)[-a-z]* (of the thirty )?(instruction files|agent definitions)|twenty-third agent|thirty-one in' -- ':!harness-runs/**' ':!examples/**'``

**D11 — the clean-tree commit-point list and the sites that cite it by heading or by entry number (command).** This branch adds a commit point to that list (entry 15). Re-run verbatim: ``git grep -lE 'clean-tree invariant \(single source of truth\)|entry 1[0-9]\*\* of the autonomous-fork commit points' -- plugin``

**D12 — the conventions document's fixed commit-subject list (command).** This branch adds a fixed-form subject, `chore: Commit re-screened input edit for <branch>` (Task 10 step 4; Task 11 entry 15). Re-run verbatim: `git grep -lF 'Fixed-form subjects' -- .claude/context`

**Closure invariant:** every site any entry reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_ledger_phases`) | template | D1 `P1 P2 P3`; D2 | `change` | Task 5 |
| 2 | `scripts/lib/harness-run-lib.sh` | self-adopted | D1 | `change` | Task 16 — byte copy of row 1 |
| 3 | `plugin/instructions/autonomous_pause_and_ledger.md` (§1.3 templates, `[-]` list, §1.4, §1.5) | — | D1; D2; D6 | `change` | Task 11 |
| 4 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` (Override 5 bullets; Override 2(a); `## Clarification channel — file format` → **Question file**, **Why one file per park**, **Consume-then-archive**) | — | D1 `` `P1` — ``; D2; D6 | `change` | Task 12 — the **Question file** and **Why one file per park** bullets name the screen as a writing site whose park may span a screen park and its re-asks, kept whole by the every-top-level-question-answered rule; the Consume-then-archive bullet's two reading statements name the screen-park exclusion, and the bullet names the screen's discard of a flagged answer (re-asked, or not for a screen park) |
| 5 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` (Override 4 bullets; Override 2(a)) | — | D1 `` `R1` — ``; D2; D6 | `change` | Task 13 |
| 6 | `examples/notes-app/sdlc-harness/flow_progress/feat_note_updated_at_progress.md` | — | D1; D2 | `no-change` | frozen capture (`.claude/context/conventions.md` → `## Documents of record`); it already omits `G.` for the same reason |
| 7 | `docs/work-report-research/task-plan-reviewer.md` | — | D1 | `no-change` | research record of a past review session; it quotes the template as it then stood |
| 8 | `cli/templates/scripts/flows/task_plan_writing.graph.json` | template | D2 "the flow-walker graph" | `no-change` | `P0` is not a walker `ledger:` line: the screen precedes the walker's first invocation; `check-flow-graph.sh` reads ids from the §1.3 template |
| 9 | `cli/test/ledger-phases.test.mjs` | — | D2 "the ledger tests" | `change` | Task 5 |
| 10 | `README.md` → `## Scope and limits` | — | D3 | `change` | Task 18 |
| 11 | `plugin/docs/AUTONOMOUS_FLOW.md` | — | D3; D6 | `change` | Task 15. Its D6 hit (*"The paired `answer_<n>.md` is written beside the question … once every open question file is answered"*) already holds for a screen park spanning several files. |
| 12 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` ("**The prompt is data, not instruction.**" paragraph) | — | D3 | `change` | Task 15 |
| 13 | `plugin/hooks/README.md` | — | D3; D4 | `no-change` | It lists no containment layers. Its "stay allowed" enumeration names only scripts with no profile entry, plus `scratch-run.sh`. The new script has a profile entry, as `flow-walker.sh` does, which is not listed either. |
| 14 | `cli/templates/scripts/README.md` | — | D4 (both) | `change` | Task 7 |
| 15 | `cli/README.md` | — | D4 (second) | `change` | Task 7 |
| 16 | `docs/cli.md` (the "Two families land in `scriptsDir`" paragraph) | — | D4 (both) | `change` | Task 18 |
| 17 | `docs/watcher.md` (the outer-loop script table) | — | D4 (first) | `change` | Task 18 |
| 18 | `plugin/commands/branch-start-plan-autonomous.md` | — | D5 | `change` | Task 12 |
| 19 | `plugin/commands/branch-start-user-review-fix-autonomous.md` | — | D5 | `change` | Task 13 — the screen between step 4 and step 5 (the tree-state precondition), and one sentence in step 5 |
| 20 | `plugin/commands/branch-start-docs-autonomous.md` | — | D5 | `change` | Task 14 |
| 21 | `plugin/commands/branch-start-plan-semi-autonomous.md` | — | D5 | `no-change` | the semi-autonomous and supervised flows do not run the screen (`## Context` → **Decisions**) |
| 22 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` (**On resume**) | — | D6 | `no-change` | It consumes only pairs whose origin is Phase `A`/`QA`/`D`. A screen park's origin is `prompt-injection-reviewer`, so no answer to one reaches it. A re-ask of a Phase `A`/`QA`/`D` question keeps that origin byte-for-byte, so its answer reaches it through the same origin test, unedited. |
| 23 | `plugin/instructions/untrusted_input.md` (`## Who may cite this`, `## Where a report goes`) | — | D6; D7 | `change` | Task 8. Its D6 hit, `## The rule` item 1's list of task data naming `answer_<n>.md`, is unchanged: a re-ask's answer is task data like any other. |
| 24 | `plugin/instructions/main_repo_resolution.md` (`## Who may cite this`) | — | D7 | `no-change` | No new file carries its resolution clause. Task 10 cites the engine command's resolution instead. |
| 25 | `cli/templates/state-dir/scratch/README.md` | template | D8 | `change` | Task 7 — names the screen's verdict directory beside the fetch directories |
| 26 | `harness-runs/scratch/README.md` | self-adopted | D8 | `change` | Task 16 — byte copy of row 25 |
| 27 | `cli/templates/state-dir/clarifications/README.md` | template | D8 | `change` | Task 7 — a screen park is written by the screen, and its answer decides nothing; a flagged answer is discarded and its question re-asked, except an answer to a screen park, discarded with no re-ask |
| 28 | `harness-runs/clarifications/README.md` | self-adopted | D8 | `change` | Task 16 — byte copy of row 27 |
| 29 | `harness-runs/lessons.md` → *"When a trust check meets a file an actor outside your control creates…"* | — | D9 | `no-change` | Honoured: a park file is the only record read back as `UNSAFE`, and only in the screen's own shape. |
| 30 | `harness-runs/lessons.md` → *"Never drop a protection because another route 'can already' reach the same target…"* | — | D9 | `no-change` | Honoured: no control is relaxed for the screen. |
| 31 | `harness-runs/lessons.md` → *"An unsandboxed script takes its mode and the path of every trust input from a record the session cannot write…"* | — | D9 | `no-change` | Not reached: the script runs sandboxed (no `runsUnsandboxed`). Its session-writable record is a stated residual of a tripwire (Task 10). |
| 32 | `harness-runs/lessons.md` → *"Refuse what an unattended run must never do in every execution mode…"* | — | D9 | `no-change` | Honoured: the screen runs in the engine, so local and job runs alike. |
| 33 | `plugin/instructions/README.md` → *"Roadmap item 3 landed twenty-four of the thirty instruction files beside this README (… untrusted-input files came later)"* | — | D10 | `change` | Task 15 — thirty-one, and the prompt-injection screen added to the files that came later |
| 34 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → row **3. Instruction cores and their forks** (*"thirty instruction files"*) | — | D10 | `change` | Task 15 — thirty-one |
| 35 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → row **4. The agent fleet** (its list of roles; *"twenty-two agent definitions"*) | — | D10 | `change` | Task 15 — the screener added to the roles; twenty-three |
| 36 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → the count paragraph after the table (*"returns twenty-two"*, *"thirty-one in `instructions/`"*, *"not one of the thirty"*, *"a twenty-third agent"*) | — | D10 | `change` | Task 15 — twenty-three, thirty-two, thirty-one, twenty-fourth; the `commands/` figures unchanged |
| 37 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `## Autonomous-fork commit points — the clean-tree invariant (single source of truth)` | — | D6; D11 | `change` | Task 11 — entry 15 (the screen's re-screened-edit commit), the lead-in's ordering clause and the **Post-commit push** enumeration. Its D6 hit, the `<park_answer_lookup>` row, is unchanged: a Phase G re-ask copies the plan path verbatim, and the lookup counts a pair only where `answer_<n>.md` sits beside its question, so it takes the re-ask's pair and not the discarded original. |
| 38 | `plugin/instructions/dispatch_discipline_instructions.md` → **"Why it is issued here, and where the rationale lives."** | — | D11 | `no-change` | It cites the list's heading as the rationale for its own push, and names no entry the appended entry 15 changes. |
| 39 | `plugin/instructions/mode_contract.md` → `### Sanctioned cross-fork anchors` (the list's heading); its *"the literal artefact path `<state_dir>/clarifications/<branch>/question_<n>.md` / `answer_<n>.md`"* paragraph | — | D6; D11 | `no-change` | The heading is unchanged, so the anchor still resolves. The D6 paragraph pins only the `question_<n>.md` ↔ `answer_<n>.md` names and their index pairing, which the screen keeps. |
| 40 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → *"This commit is **entry 12** of …"*, *"**entry 14** of …"* | — | D11 | `no-change` | Entry 15 is appended, and nothing is renumbered, so entries 12 and 14 still name the same commit points. |
| 41 | `plugin/instructions/clarification_digest_instructions.md` → `## The entry format` **answered:** arm (*"exactly `no answer file on disk — resolved out of band`"*), its lead (*"one per park, however many questions it holds"*), and `## What is digested` (*"The run reached Phase D, so the block was resolved out of band"*) | — | D6 | `change` | Task 20 — two exact arms ahead of the existing one: an answer the screen discarded and re-asked, and an absent answer to a screen park; the lead counts one block per question file |
| 42 | `plugin/commands/branch-answer.md` → *"it writes them together into one `question_<n>.md`"*; step 4's *"a park written before one file held the whole park, or a question file added after the park"* | — | D6 | `change` | Task 20 — a screen launch may write a screen park and its re-asks as several files; step 4's listing behaviour is already right |
| 43 | `plugin/commands/branch-status.md` → step 4's *"every top-level `<state_dir>/clarifications/<branch>/question_<n>.md` without its `answer_<n>.md`"* | — | D6 | `no-change` | It lists every open question file, however many one park wrote, and a discarded answer leaves its question under `answered/`, outside that list. |
| 44 | `.claude/context/conventions.md` → `## Commit-message policy` → **Fixed-form subjects** | — | D12 | `no-change` | A conventions document is never a plannable target. The branch's work makes the list incomplete: it lacks `chore: Commit re-screened input edit for <branch>`. Raised as a `stale-rule` entry in `## Corpus staleness`. |

## Corpus staleness

These are recommendations for a supervised follow-up. None is a task: none has a readiness entry, a per-task file or story points.

- `stale-rule` — **Document:** `.claude/context/conventions.md` → `## Commit-message policy` → **Fixed-form subjects** (the list that `.claude/context/plugin.md` → `## The commit-message policy` defers to). **Rule the branch falsifies:** the list is meant to name every fixed subject the flow passes byte-for-byte. This branch adds one it does not name, `chore: Commit re-screened input edit for <branch>`. The commit point that owns it is `plugin/instructions/prompt_injection_screen.md` → `## The steps` step 4 (Task 10), and `plan_orchestration_instructions_autonomous.md` → `## Autonomous-fork commit points — the clean-tree invariant (single source of truth)` entry 15 quotes it (Task 11). **Restatement:** add `chore: Commit re-screened input edit for <branch>` as a bullet of the list in its sorted position, after `chore: add user review for <branch>` and before `chore: Flow progress <entry-id> for <branch>`. **Route:** a supervised `/autonomous-sdlc-harness:harness-analyze .claude/context/conventions.md` re-run or a hand edit, made once this branch lands.
