# The autonomous flow

**Who reads this:** anyone who needs to know what an unattended run does between being launched and ending at **"branch ready for review"** — an operator picking an entry point and reading a run's output, or the author of a harness asset that has to agree with the flow about a phase, an artifact or a hand-off. It is the canonical document for the flow itself.

The flow takes a branch's **task prompt** and carries it to "branch ready for review" with nobody watching: it plans the work, implements it unit by unit, puts the result through a fixed sequence of review gates, exercises the running application where the interactive-test phase is configured on, and writes its own statistics and improvement observations before it stops. A **hands-on review** of that finished branch is the second entry point — the same machinery runs the fix cycle over it, ending at the same place — and a **documentation checklist** is the third. No entry point merges, pushes to a protected branch, or opens a pull request; that boundary is `## Output guarantee`.

**The inner loop is this document's; the outer loop is the watcher's.** This document owns what a run does **once it has been launched**: the phases it walks, the agents it dispatches, the artifacts it writes, and what it promises when it stops. What turns a dropped file into a run — the inbox, the filename routing, the working-copy strategy, the headless launch and the exit classification — plus the daemon's own lifecycle and the machine-level usage lane, belongs to the harness repository's `docs/watcher.md` and is **cited here, never restated**. Where the two touch, this document states only the run's own half: what a paused run writes before it yields, what a parked run leaves behind for an answer, what it emits that makes it watchable. Two owners of one contract is the failure this split exists to prevent.

**Every mode runs the same instruction cores.** The unattended flow is not a second implementation of the supervised one: both, and the semi-autonomous mode between them, execute the same mode-free cores through thin per-mode forks (`## Instruction-file shape`). A behaviour that differs between modes is a **binding value** in a fork, not a fork of the behaviour.

---

## Resolved values

The tokens below are neither Mode-contract **bindings** (this document declares none; the one it names in passing, `<per_unit_review>`, is supplied by each flow's own fork) nor ordinary **path placeholders** (`<branch>`, `<n>`, `<N>`, `<layer>`, which this document's own text resolves at their point of use): they resolve from the adopting repository's `harness.config.json`, except `<MAIN_REPO>`, which is derived at runtime. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this document is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<default_branch>` | config value | `defaultBranch` — the branch work starts from and merges back into, and therefore the diff base the branch gates compute against. Never a remembered branch name. |
| `<protected_branches>` | config value | `protectedBranches` — the branches an automated run may never commit or push to. The effective set is these together with `<default_branch>`. |
| `<scripts_dir>` | config value | `scriptsDir` — the repo-relative directory `init` writes the outer-loop scripts into. This document names those scripts by that destination rather than by a path inside the plugin, because they do not ship inside it. |
| `<githooks_dir>` | config value | `githooksDir` — the repo-relative directory holding the committed git hooks, including the pre-push backstop. |
| `<docs_root>` | config value | `docs.root` — the documentation corpus the documentation run and the docs phase write into. Read **only** when `phases.docs` is `true`. |
| `<MAIN_REPO>` | derived at runtime | The root of the **main checkout** — the one the watcher launches from — which is never a run's own working copy. A run resolves it from the environment its launch supplies, or from the working-copy list, whose first entry is the main checkout. This document uses it once, for the global kill switch in `## Safety / reversibility`. |

---

## The wiring table

**This document points at the canonical file that owns each piece and deliberately does not restate its body.** Where a row's file and this document disagree about a mechanism, the row's file is right; a paragraph here that has drifted is a defect in this document, not a second contract.

| Piece | Canonical file (do not restate here) |
|---|---|
| Unattended task-prompt entry point | `${CLAUDE_PLUGIN_ROOT}/commands/branch-start-plan-autonomous.md` |
| Planning **core** (mode-free: Setup, safety contract, the walker, the writer/reviewer loop, both plan gates, the interactive-test-plan loop, convergence) | `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_core.md` |
| Routing of the planning loop: next node, counter, cap, escalation payload | `flow-walker.sh` and `flows/task_plan_writing.graph.json` in `<scripts_dir>` — `flow-walker.sh` is an agent-invocable row of the shipped table, run by the orchestrating session; the graph is the data it reads |
| Planning forks (binding values only) | `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md`, `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_semi_autonomous.md` |
| Plan writer and its reviewers | `${CLAUDE_PLUGIN_ROOT}/agents/task-plan-writer.md`, `${CLAUDE_PLUGIN_ROOT}/agents/task-plan-reviewer.md`, `${CLAUDE_PLUGIN_ROOT}/agents/ui-tests-plan-writer.md`, `${CLAUDE_PLUGIN_ROOT}/agents/ui-tests-plan-reviewer.md` |
| Implementation **core** (mode-free phase bodies A → A1.5 → A2 → B → C → C2 → E → D) and the shared unit loop | `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md`, `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` |
| Implementation forks (binding values, plus what each mode purely adds) | `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md`, `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_semi_autonomous.md` |
| The unit's implementer and its per-unit reviewer | `${CLAUDE_PLUGIN_ROOT}/agents/layer-implementer.md`, `${CLAUDE_PLUGIN_ROOT}/agents/layer-reviewer.md` |
| The one agent that commits | `${CLAUDE_PLUGIN_ROOT}/agents/committer.md` |
| Branch gates — parity, architecture, end-of-branch review and its meta-review, adversarial skeptic | `${CLAUDE_PLUGIN_ROOT}/agents/business-parity-reviewer.md`, `${CLAUDE_PLUGIN_ROOT}/agents/architecture-reviewer.md`, `${CLAUDE_PLUGIN_ROOT}/agents/branch-reviewer.md`, `${CLAUDE_PLUGIN_ROOT}/agents/review-plan-reviewer.md`, `${CLAUDE_PLUGIN_ROOT}/agents/skeptic-reviewer.md` |
| Interactive-test agents, one per configured driver | `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md`, `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-maestro.md`, `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-mcp.md` |
| Dev-server and test-account helpers the interactive-test phase invokes | `${CLAUDE_PLUGIN_ROOT}/scripts/` — `find-free-port.sh`, `poll-dev-server.sh`, `kill-dev-server.sh`, `reserve-qa-user.sh`, `release-qa-user.sh` |
| Statistics writer | `${CLAUDE_PLUGIN_ROOT}/agents/statistics-plan-writer.md` |
| Unattended hands-on-review entry point | `${CLAUDE_PLUGIN_ROOT}/commands/branch-start-user-review-fix-autonomous.md` |
| Fix-plan-writing **core** (review-file discovery and round resolution, the writer prompts, both plan gates and their caps, convergence, context discipline) and its forks | `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_core.md`, `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_autonomous.md`, `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions.md` |
| Fix-plan writer | `${CLAUDE_PLUGIN_ROOT}/agents/user-review-fix-plan-writer.md` |
| Fix-implementation **core** (phase bodies A → QA → D; its QA loop is the implementation core's Phase E, cited by reference) and its forks | `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_core.md`, `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_autonomous.md`, `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_semi_autonomous.md` |
| Documentation entry point and its standalone loop | `${CLAUDE_PLUGIN_ROOT}/commands/branch-start-docs-autonomous.md`, `${CLAUDE_PLUGIN_ROOT}/instructions/docs_orchestration_instructions_autonomous.md` |
| Documentation writer and reviewer | `${CLAUDE_PLUGIN_ROOT}/agents/docs-writer.md`, `${CLAUDE_PLUGIN_ROOT}/agents/docs-reviewer.md` |
| Docs phase inside the code flows (canonical; activated by one `Override H` in each of the two **autonomous** forks) | `${CLAUDE_PLUGIN_ROOT}/instructions/docs_phase_instructions.md` |
| Improvement-observations intake (canonical; activated by one `Override I` in each of the two **autonomous** forks) | `${CLAUDE_PLUGIN_ROOT}/instructions/improvement_observations_instructions.md` |
| Clarification digest (canonical; activated by one `Override J` in each of the two **autonomous** forks) | `${CLAUDE_PLUGIN_ROOT}/instructions/clarification_digest_instructions.md` |
| What an orchestrator may add to a dispatch prompt, and the record it owes (canonical; activated by a pointer in each orchestrating document's dispatch site) | `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md` |
| Run-mode contract — how a task prompt's `### Run mode` binds an orchestrator (canonical; activated by a pointer at each governed orchestrator's Setup and gating sites) | `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` |
| Pause/resume protocol and the flow-progress ledger a resumed run reads back | `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` |
| The core/fork binding vocabulary and the rules that keep a pair honest | `${CLAUDE_PLUGIN_ROOT}/instructions/mode_contract.md` |
| Tool-guard hooks — declared by the plugin, appended to the adopter's own, active in every session | `${CLAUDE_PLUGIN_ROOT}/hooks/hooks.json` and the guards beside it |
| Supervised and semi-autonomous entry points over the same cores | the other `branch-*.md` assets in `${CLAUDE_PLUGIN_ROOT}/commands/`, with `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_implementation_instructions.md`, `${CLAUDE_PLUGIN_ROOT}/instructions/code_review_instructions.md`, `${CLAUDE_PLUGIN_ROOT}/instructions/code_review_fixes_instructions.md` and `${CLAUDE_PLUGIN_ROOT}/instructions/qa_test_instructions.md` — plus the supervised drive mode's own two orchestration files, `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions.md` and `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions.md`, which are human-gated item loops rather than forks over a core and declare no binding table |
| The run watcher — inbox, routing, registry, cap, logs, notifications, resumes, usage gate, stall watchdog | `autonomous-watcher.sh` in `<scripts_dir>`; the harness repository's `docs/watcher.md` is its format of record |
| Lifecycle notifier, and the stream formatter that produces a run's readable log | `autonomous-notify.sh` and `autonomous-format-stream.sh` in `<scripts_dir>`; the notifier's own header is normative for the event vocabulary |
| Git wrappers — the outer-loop scripts an agent may invoke | `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh` in `<scripts_dir>` — the git wrappers among the rows the shipped table marks agent-invocable. `refresh-branch.sh` refreshes the branch of a working copy that already exists, so it belongs here and not in the lifecycle row |
| Working-copy lifecycle | `create-worktree.sh`, `setup-worktree.sh`, `cleanup-merged-worktrees.sh` and `restart-watcher.sh` in `<scripts_dir>` |
| Daemon unit template for the platform's service manager | written per repository by the harness CLI's `daemon install`; the harness repository's `docs/cli.md` owns the command and `docs/watcher.md` the identity rule |
| Generated permission profile, selected per run | `.claude/settings.autonomous.json`, written into the adopting repository by `init` and owned by the adopter from there on |
| Protected-branch backstop git itself runs | `pre-push` in `<githooks_dir>`, wired through `core.hooksPath` by the working-copy scripts |

**Every row naming a `<scripts_dir>` or `<githooks_dir>` destination, the daemon unit template and the generated permission profile point at something that does not ship inside the plugin.** Those artifacts are written into the adopting repository by the harness CLI, so they are named by where they land rather than by a path — an installed plugin's runtime root contains only the plugin, and a relative pointer out of it would not resolve for an adopter. The same rule is why a document that lives outside the plugin is cited by name plus where it lives.

---

## Instruction-file shape

Across the **four instruction families** — orchestration, planning, hands-on-review fixes and fix-plan writing — the per-mode files are **thin forks over a mode-free core**, not overrides layered on the supervised file. The core owns every phase body; each fork carries only its own binding values plus what its mode purely adds. Neither file is complete alone, and both read orders converge on the same pair: a core names the binding set it uses and sends the reader to the fork it was dispatched via, and a fork names its core and carries the values inline rather than by pointer.

`${CLAUDE_PLUGIN_ROOT}/instructions/mode_contract.md` holds the binding vocabulary and the five rules that keep a pair honest — no defaults in a core, read-order independence, additions stay in the fork, cores are literal-free, and a core may cite another core but never copy it. Reading it is optional for execution: a fork's binding table plus its core is self-sufficient.

**The documentation engine is deliberately outside this shape.** It is a standalone flow with no supervised counterpart, so it has no core to fork over: `${CLAUDE_PLUGIN_ROOT}/instructions/docs_orchestration_instructions_autonomous.md` is a single file, and it reuses the shared path resolution, kill switch, safety checks, commit and push wrappers, and pause protocol by reference instead.

---

## The inner loop of a task-prompt run

One ordered walk. Every phase body belongs to the wiring-table row that owns it; what follows is the order and the hand-offs, not a second copy of the phases.

**1. Planning.** The planner dispatches a writer to draft the story index and its per-task files, then drives that draft through **one** writer/reviewer loop until it converges. Three **plan gates** run in sequence on each draft before any code exists — a business-parity gate (gated on `phases.parity`), then an architecture gate, then the plan review itself — and that loop's single revision counter is capped at five across all three: every FAIL, from whichever gate, sends the plan back to the writer and re-runs every gate. A separate loop produces the interactive-test plan where that phase is configured on. At convergence the plan is **committed** — the plan is an artifact of the branch, not a scratch note, which is what makes the run resumable and the plan reviewable afterwards.

**2. Implementation, unit by unit (Phase A).** The story index's `## Phase 2 Readiness — Ordered Fix List` is the **sole** iteration source: the loop takes the first `[ ]` entry, routes it by that entry's `_(layer: …)_` tag through the routing table — never by opening the detail file — dispatches the implementer for each layer in scope, optionally reviews (`<per_unit_review>`, which the unattended task fork binds `off` and the fix flow binds `on`), then dispatches the committer **once per unit**. The committer flips that readiness entry to `[x]` and stages the code with the index, so the checkbox and the commit land together and a resumed run never re-does a committed unit. Each commit is pushed as it lands — to the run's **own** branch, which is never `<default_branch>` and never one of `<protected_branches>`; `## Output guarantee` states what enforces that.

**3. The branch gates, in the order they run.** Phase **A1.5** reviews the implemented branch against the reference implementation (gated on `phases.parity`). Phase **A2** reviews it for layer placement and dependency direction. Phase **B** produces the end-of-branch review: the branch reviewer reads the whole diff against `<default_branch>` segment by segment and emits a review plan, which is itself meta-reviewed before being committed. Phase **C** implements those findings through the same unit loop, against the review index instead of the story index. Phase **C2** is the adversarial pass — a skeptic re-examines the now-fixed branch for the flaw classes that ship past a trusting pass, emitting **only net-new findings**, and its fixes loop back through the same three agents.

**4. The interactive-test phase (Phase E, gated on `phases.qa`).** The orchestrator owns the server lifecycle and the test agent owns the browsing: E.0 assigns a free port at or above `qa.portSeed`, starts the configured dev-server command on it and polls until it answers; E.1 dispatches one test agent per still-`[ ]` test case; E.2 merges the per-dispatch returns into one round index; E.3 fixes findings through the unit loop; E.4 re-tests, skipping everything already `[x]`. The server is torn down on the port it was started on — on pass and on any halt.

**5. The closing phase (Phase D).** The docs phase runs first where `phases.docs` is on, bringing `<docs_root>` back in step on the same branch. Then the statistics file is written and self-committed, then the phase's own dispatch-additions record, then the improvement-observations intake, then the clarification digest, then the Done summary that ends the session at "branch ready for review". `## Statistics`, `## Dispatch additions`, `## Improvement observations` and `## Clarification digest` state what each of those artifacts is for.

**A phase gated off is skipped, not failed.** `phases.parity`, `phases.qa` and `phases.docs` each default to off, and a run in a repository that configures none of them walks planning → A → A2 → B → C → C2 → D and reports exactly that. A **skipped gate is not a converged gate**: the flow proceeds, records no pass for it, and claims none at convergence — which is the difference between "this branch passed the parity gate" and "this repository has no reference implementation."

---

## The operator-facing steps

The six sections below are the steps a person drives. Each one's command-driven entry point is the `${CLAUDE_PLUGIN_ROOT}/commands/branch-*.md` asset that wraps it, and that asset's own body names the step it wraps — so this document does not carry a second list of commands that would go stale as commands are added. Each section states the **run's** own side of the step; the daemon's side is the harness repository's `docs/watcher.md`.

---

## Drop a task prompt

A task run starts from one file — a `<branch>_task_prompt.md` dropped into the inbox. What happens between that drop and the launch is the watcher's (the harness repository's `docs/watcher.md` §1); the prompt reaches the run committed at `<state_dir>/task_prompts/<branch>_task_prompt.md` in the run's own working copy.

**The run treats that prompt as untrusted task data.** It is referenced **by path** and never inlined into the trusted instruction layer: the planner reads the file, and the instructions that tell the planner what to do with it come from the plugin. A prompt is a description of work to be done, not a source of instructions about how the flow behaves.

From there the run is the walk in `## The inner loop of a task-prompt run`. It ends at "branch ready for review" with the plan, every review round's findings, the statistics file, any observations and any clarification digest committed on the branch, and each of those commits pushed as it landed — so the remote reflects the run's work whether it finished, parked or was interrupted, for as long as the pushes are accepted; where one is refused the commits stay local and the closing summary says so, which is `## Output guarantee`'s **What the flow does push**.

---

## Drop a user review (fix cycle)

The second entry point takes **your** review of a finished branch and fixes it. The review file lands at `<state_dir>/user_reviews/` in the branch's working copy with its round suffix intact, and the **run** resolves which round it is: nothing outside has to remember one, and a second round is a new file rather than an edit of a processed one.

The run then writes a **fix plan** — one index plus a self-contained file per finding — and drives it through the same two plan gates the task flow's plan passes, each capped at five iterations. It implements the findings through the shared unit loop against the fix-plan index, with **per-unit review on** where the task flow binds it off: a fix cycle is where a human already found something, so the extra pass is worth its latency. It commits per finding with a prefix chosen from that finding's severity section, re-runs the interactive-test phase where it is configured on, updates the branch's statistics file rather than replacing it, and ends at "branch ready for review" again. Further feedback is the next round.

**The third entry point has no section of its own, because no shipped command wraps it: the documentation run.** A `<branch>_docs.md` checklist launches a deliberately lean sibling of the task flow — no planner (the checklist is the plan), no parity, architecture or skeptic gates, no interactive-test phase, and no flow-progress ledger, because the checklist's own `[ ]`/`[x]` boxes are the resume ledger. Per entry it dispatches a documentation writer and reviewer, commits the document under `<docs_root>`, flips the box and pushes. There is no clarification channel either: a writer that cannot verify a claim marks it unverified and continues rather than parking to ask.

---

## Answer a clarification (park-and-ask)

A run that reaches a decision it must **not** take alone writes every question of that park into one self-contained `question_<n>.md` under `<state_dir>/clarifications/<branch>/` in its own working copy, and **ends its session**. That is the whole of the run's side. It is not a stall and it costs nothing while it waits: the session is over.

What makes it rare enough to be useful is the **ask-vs-assume policy** — assume-and-document for a low-stakes, reversible decision, and park only where a wrong answer is expensive or hard to undo. One halt sits outside that policy: the Phase-D completion check over an unresolved flow-progress ledger is unconditional and has no assume-and-proceed arm. That policy and the question/answer file format are canonical in `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md` — its `## Ask-vs-assume policy` and `## Clarification channel — file format` sections respectively — and they apply identically to a fix-cycle run: same channel, same format, same park.

The paired `answer_<n>.md` is written beside the question — pairing is by index — and answers the whole park. The detection, the re-launch of the same engine in the same working copy once every open question file is answered, and the archiving of exactly the pairs that resume consumed are the watcher's (the harness repository's `docs/watcher.md` §4). The resumed session consumes the pairs; nothing removes a question ahead of the run that has to read it. A run whose resumes make no progress is held under the `park_loop` status and not resumed again until an operator clears it (the same §4).

**The exchange is transport, not the record.** Those files are machine-local and go with the working copy, so each run digests the resolved pairs it carries into the committed `<state_dir>/clarification_digests/<branch>.md` at Phase D — the ruling and the diagnosis outlive the copy that produced them. `## Clarification digest` states the rest.

---

## Pause / resume a run

**A pause suspends a healthy run at a clean boundary so it can continue later; the per-run brake ends it.** That is the contrast worth holding on to — `## Safety / reversibility` states the brake itself, and this section does not describe it twice.

The run's side of a pause is a checkpoint it takes before every dispatch. On seeing a `PAUSE` request, **and only with no uncommitted tracked changes**, it appends a note to `PAUSE_PROGRESS.md`, writes `PAUSE_ACK` and ends its session. The clean-boundary condition is what lets a pending commit finish first, so an in-flight unit is never left half-done — which also means a pause is not instantaneous: the checkpoint sits between dispatches, so a long test or a review generation completes before the run yields. All four sentinels are **flat** under `<state_dir>` rather than in a subdirectory of their own, which would collide with the `PAUSE` file itself on a case-insensitive filesystem.

**Why it resumes cleanly.** Every unattended run maintains a committed, phase-level **flow-progress ledger** whose entries flip `[x]` only once that phase reached a recorded outcome — its artifact committed where the phase produces one, or the clean pass where it correctly produces none. A resumed run reads the ledger and continues at the first `[ ]` phase — so "where do I resume" is computed rather than guessed, and no reviewer is re-dispatched and no review regenerated for a phase already done. Because a requested pause is only ever taken on a clean tree and every completed phase is already committed and pushed, a resumed run needs no dirty-tree reconciliation.

**A run can also pause itself.** When a dispatch dies on an infrastructure error the run retries twice, and on the third consecutive failure raises its own pause through the same sentinels, with two deliberate differences: there is no `PAUSE` request to see, and it does not wait for a clean tracked tree — the pause note records the undelivered dispatch, which is how you tell it apart later. Nothing auto-resumes that one: an outage has no predictable reset. This is the **only** correct response to one; a run that instead ends its turn quietly exits as though it had succeeded, and a flow abandoned mid-phase is then reported as a completed branch.

The protocol is canonical in `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` — the ledger schema, the flip contract, the resume algorithm and the sentinel rules. Removing the sentinels, re-launching the engine, and pausing runs on the account's own usage window are the watcher's (the harness repository's `docs/watcher.md` §4 and §5).

---

## Watch a run

**A run is watchable because of what it writes as it goes, not because anything polls it.** Before **every** dispatch it prints one heartbeat line naming the phase, the unit, the layer and the iteration, then the agent and the running dispatch count — `[A · Task 3 · <layer> · iter 0] → layer-implementer  (#N)`. After every committed unit it prints one progress line carrying that unit's label with the commit's short hash and subject. It closes with a Done summary.

Underneath the log, the branch itself is the progress record: each phase's artifact is committed and pushed as it lands, where the phase produces one, and the flow-progress ledger says which phases are done. So a run that is interrupted leaves the same evidence a finished one does, and a reader can tell where it got to from the repository alone.

Where those lines are collected, which file to tail, and how a run's state is recorded and summarized are the watcher's (the harness repository's `docs/watcher.md` §1 and §3). One thing is worth knowing from this side: a session transcript is not a run log — what the run prints is what the watcher formats into the log named for its branch, and that is the artifact these lines were written for.

---

## Concurrency

**A run's isolation is its own working copy.** Every run executes in a separate checkout of its own branch, so two runs in flight share no index, no working tree and no branch — which is what makes running several at once a scheduling question rather than a correctness one.

Two properties of the run keep that true where parallel runs would otherwise collide on something outside git. **The interactive-test phase binds its own port**, probing for the first free one at or above `qa.portSeed` at server-start time and failing loudly rather than silently sliding to the next port — a silent fallthrough is what once let one run's tests drive another run's build — and teardown always names that same port, so a finishing run never kills a sibling's server. And **the run's artifacts are keyed by branch**: per-branch findings folders, one statistics file per branch, one observations intake file per branch. A single shared file appended by every run at its end is among the most reliable merge-conflict generators there is, which is why the shared half of the observations channel is a human's, on the default branch, and not a run's.

How many runs may be in flight, what the registry records about each, and the machine-level lane through which repositories share an assessment of the account's rate-limit window — and which serializes them only when an operator enables its advisory lock — are the watcher's (the harness repository's `docs/watcher.md` §1 and §5).

---

## Output guarantee

**Every run ends at "branch ready for review."** The flow never merges, never pushes to a protected branch, and never opens or pushes a pull request. The operator does the final hands-on review and opens the pull request out of band — that is the boundary every entry point in this document stops at.

**The protected-branch half of that promise is two layers, in priority order, and it depends on the first.**

1. **The pre-push git hook — the layer the model relies on for a push git performs.** `pre-push` in `<githooks_dir>`, wired through `core.hooksPath` by the working-copy scripts, is run by **git itself** on every push **git performs** and refuses one whose **target** ref is protected, however git was invoked — including a push spawned as a child process of an interpreter that is on the permission profile's allow list. It matches the target ref on the lines git feeds it rather than re-parsing a command line, so every spelling of the same push arrives as the same field, and that is the reason it ranks above layer 2 rather than seniority: it reads the target git itself resolved, where layer 2 reads a command string. **One shape moves the ranking, and the ranking is only honest with it stated:** a tool that implements push against the git backend itself, as `jj git push` does, performs no git push and therefore runs no git hook at all, while layer 2 sees the submitted command and refuses one that **names** a protected target — both measured on one repository, one hook, seconds apart, on `jj git push -b <protected>`. So where such a push names its target, layer 2 is the only layer that fires; where it names none, **neither layer fires** and the forge-side ruleset named at the end of this entry is the only thing left (layer 2's bound is set out under it). It is also honestly bypassable on the box that runs it — skipping hooks on the push, re-pointing `core.hooksPath`, deleting the file — which is what makes it a **backstop** rather than a floor. For a push git performs it is nonetheless the guard the boundary rests on today; the un-bypassable floor is the forge-side branch ruleset the closing paragraph of this section names, and the harness applies none.
2. **The best-effort convenience layer.** The `PreToolUse` protected-branch guard, together with the generated permission profile's `Bash(git push:*)` **`ask`** entry — evaluated before any `allow`, and unanswerable in an unattended run — gives fast and legible refusal at the moment an agent asks for one. Both inspect the **literal command string** submitted, so a push spawned indirectly — by an interpreter subprocess, by a script that runs git for you — never re-enters them. **For a push git performs, the boundary does not depend on this layer**, and reversing the two there is the one way to read this section wrong. For a push git does not perform — `jj git push` on a colocated repository — layer 1 does not run, and this layer is the only one left standing **only while the push names a protected target**: the guard's other arm refuses a push issued while `HEAD` is on a protected branch, and jj leaves `HEAD` detached, so an argument-less `jj git push` carries no target token for the first arm and cannot trip the second. That form is refused by neither layer, and the forge-side branch ruleset is not a floor under it but the whole of its cover. `doctor`'s `jj-repository` check reports both halves to an adopter on such a repository.

**Both layers resolve the protected set from configuration** — `<protected_branches>` together with `<default_branch>` — and neither carries a branch name of its own. That is worth stating explicitly, because it is the failure a document like this one hides best: spelling out branch names instead of the keys reads as correct in the repository those names came from, and quietly misleads every adopter whose default branch is called something else.

**What the flow does push.** After **each** commit the run pushes its **own** branch — never `<default_branch>`, never one matched by `<protected_branches>` — to its upstream through `push-branch.sh` in `<scripts_dir>`. Where those pushes land, the remote reflects the run's committed work whether the run finished, parked, paused or was interrupted. That helper is **non-fatal by contract**: a refused or failed push is reported and the run carries on committing rather than halting, so a run whose pushes never reach a remote still finishes — with its commits local. What keeps that case from being silent is the run's closing summary, which states the branch's commit count over `origin/<default_branch>` — or, in a run with no such remote-tracking ref, over the local `<default_branch>`, said so — and whether those commits reached the remote, read off the tree at Phase D rather than remembered. The pre-push hook allows exactly these pushes and refuses only protected targets, so the guarantee and the boundary are one mechanism read from two sides.

**A forge-side branch ruleset would be a true un-bypassable floor** — enforced by whatever host the repository is pushed to, for every pusher, whatever ran git. The harness is forge-agnostic in this release and applies none: the `forge` configuration key is declared and nothing reads it yet.

---

## Statistics

**One file per branch:** `<state_dir>/branch_statistics/<branch>/statistics.md`, written by the statistics writer in the run's closing phase, **inside the run's own working copy** and self-committed there so the copy ends clean at "branch ready for review."

**The metric is a story-point-weighted success rate**, and naming it precisely is the point. The denominator is the sum of the plan's **own** story points — the complexity-weighted scope that run committed to, taken off its story index — and the subtraction is the severity-weighted cost of the observations a **hands-on review** raised against the finished branch. So a branch is measured against what it set out to do rather than against a task count, and a review finding costs what its severity says rather than a whole unit of work. `${CLAUDE_PLUGIN_ROOT}/samples/sample_statistics.md` is the format of record — its headings, its raw counts, its formula and its edge-case rules — and `${CLAUDE_PLUGIN_ROOT}/agents/statistics-plan-writer.md` owns how each number is derived; neither is restated here.

The file is written once before any hands-on review, with nothing yet to subtract, and **overwritten** rather than appended when a fix cycle re-counts from scratch. There is one `statistics.md` per branch, never a round-suffixed series.

**There is deliberately no cross-branch roll-up.** Each run measures itself. Aggregating across parallel working copies is a different problem — it needs a writer that can see every branch at once, and a home for the result that is not any one run's branch, which is the same conflict the observations channel avoids by being per-branch. This release does not solve it, and its absence is a scope decision rather than a gap.

---

## Improvement observations

**Per-branch intake, human triage.** A run records what it **actually observed** — the harness and workflow problems it hit (a command that was gated, a phase that skipped silently, work regenerated after a resume, a fired trip-wire), and the corpus staleness its planning half reported — in `<state_dir>/improvement_observations/<branch>.md`, written once in the closing phase inside the run's own working copy and committed there. One file per **branch**, not per run: a later fix round on the same branch appends beneath a new round label rather than overwriting, so a branch that went through a fix cycle carries several blocks in one file. Per-branch is also what keeps the channel parallel-safe, for the reason `## Concurrency` gives.

**The behaviour rules reach the orchestrator at session start; the write happens at the end.** Both halves are easy to get backwards, and each costs something different. The orchestrator is the only participant that sees a whole run end to end, and what it saw is on disk nowhere — an observation not noted **when it happened** cannot be reconstructed at the write. So a policy that arrived at the moment its output was due would deliver its guardrails after the run they govern, and the loss would be **silent**, because a file with nothing in it is indistinguishable from a run with nothing to report. Each unattended entry point therefore has its orchestrator read the retention duty and the may-log rules before its first phase runs — read-only, no file, no commit — while the single **write** stays in the closing phase, after the statistics commit and before the Done summary.

**Best-effort, never a gate.** A failure here is logged and the run proceeds to its Done summary unchanged, and a run with nothing to report skips the step entirely — so **an absent file means "nothing observed"**, not "the step failed." `${CLAUDE_PLUGIN_ROOT}/instructions/improvement_observations_instructions.md` is the policy: what may be logged, the trip-wires that turn this from a creativity task into a detection task, the entry format, and the commit contract.

**The shared half is a human's.** The triage ledger `<state_dir>/improvement_suggestions.md` sits at the root of the run-artifact tree beside the intake directory; a human on `<default_branch>` folds the intake files into it and closes entries there, and **no agent reads it** — it is harness maintenance with nothing in it for a run doing feature work, so it is on no agent's context list and nothing in the flow dedupes against it. Several runs independently reporting the same gap is priority signal, not noise.

---

## Clarification digest

**The channel is transport; this is the record.** A park's question and answer files are machine-local and go with the working copy, so the diagnosis that produced the question and the ruling that resolved it would be destroyed with it. The run writes them down instead: `<state_dir>/clarification_digests/<branch>.md`, **one file per branch** for the reason `## Concurrency` gives, one block per park that branch made, written in the closing phase inside the run's own working copy and committed there. Each block is headed by the `question_<n>` index it was derived from, and a later round or a resumed session appends only the blocks whose key the file does not already carry.

**Best-effort, never a gate.** A failure here is logged and the run proceeds to its Done summary unchanged, and a run that parked on nothing writes no file at all — so **among runs that reached their closing phase, an absent file means "no question was asked"**, not "the step failed." A run that parked and was never answered never reaches that phase, so its question is not digested either; that is the one loss this record does not close. `${CLAUDE_PLUGIN_ROOT}/instructions/clarification_digest_instructions.md` is the policy: how the blocks are derived from the question and answer files on disk, the entry format, and the commit contract.

---

## Dispatch additions

**Per-branch record of what an orchestrator added to a prompt.** An orchestrator composes every sub-agent prompt itself, and whatever it adds beyond the block its instruction defines exists only in the session transcript — gone when the session ends, while the finding, the verdict and the round count that text shaped are committed and read later as the agent's own. So the addition is written down: `<state_dir>/dispatch_additions/<branch>.md`, **one file per branch** for the reason `## Concurrency` gives, appended **once per phase that owes at least one block** rather than once per dispatch, inside the run's own working copy and committed there. `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md` is the policy — which additions are permitted at all, the single form permitted knowledge travels in, the entry format, the write point and the commit contract — and none of it is restated here.

**Best-effort, never a gate — and disclosed either way.** A failure at this step is logged and the run proceeds unchanged, and a session that added nothing writes no file and makes no commit, so **an absent file means "nothing was added"**, not "the step failed." That reading is only safe if the two are distinguishable without opening a file, which is why the disclosure is **mandatory and affirmative** in the Done summary or hand-off: `📌 Dispatch additions: <N> recorded → <state_dir>/dispatch_additions/<branch>.md`, or `📌 Dispatch additions: none`. The second line is the ordinary outcome and the one the policy exists to make ordinary.

---

## Safety / reversibility

**Two brakes, and the flow removes neither.**

- **The per-run brake — `<state_dir>/STOP`, inside one working copy.** The run itself checks it at launch and again before **every** dispatch. On finding it, the run halts with a plain report naming the command to re-enter with, and stops. It is a **user-initiated stop, not a flow blocker**: it is never escalated, never parked, never retried. Canonical: `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `## Safety contract — applies before EVERY Agent dispatch`, with the same check at launch in that file's `## Setup (once per session)`.
- **The global kill switch — `<MAIN_REPO>/<state_dir>/AUTONOMOUS_STOP`, in the main checkout.** The engine checks it at session start and halts before dispatching anything; it also blocks new launches and resumes, so it stops the runs in flight *and* the ones that would have started. Canonical: `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md` → `## Override B — global kill switch`.

**Neither file is ever removed by the flow or by the daemon** — whoever created it removes it. A component that cleared its own brake would restart exactly the runs it was told to stop.

**The per-run brake is read by the run, not by the watcher**, which is the half a reader most often assigns to the wrong owner. Nothing polls that file on the run's behalf: a stopped run simply ends, and it is reconciled from its **vanished process** rather than from the file that stopped it. That daemon-side half is the harness repository's `docs/watcher.md` §4, cited here rather than restated. `## Pause / resume a run` is the soft, resumable alternative to this brake, and states the contrast from the other side.

**Containment.** A run executes in its **own working copy**, and that is the safety boundary: two runs share no index, no working tree and no branch, and nothing a run does reaches the checkout a person is working in. It runs under a **generated, version-controlled permission profile selected per run**, so the operator's own interactive configuration is never touched — which is what makes the harness reversible with no residue: remove the daemon and nothing about working by hand has changed. That profile's `deny` floor is **allow-beating** — a deny is evaluated before any allow and cannot be overridden — and that is precisely why the browser-tool closure is **not** made there: a namespace-wide deny would revoke the interactive-test agent's own grant along with everyone else's, so the closure is made per agent, by each agent definition's `tools:` allowlist. Protected-branch refusal is likewise not part of that floor; it is the two-layer model in `## Output guarantee`.

**What these guards do is measured rather than asserted.** The harness repository's `docs/guard-verification.md` records the guard set's standing decision matrices and its per-call cost; its `docs/outer-loop-verification.md` records what the outer-loop scripts do when driven. Both state every result **under the conditions it was measured in** — the shell version, the fixture, and the perturbation that moves the row — which is what makes a later change regressable rather than merely arguable. Check a behaviour there before relying on it; a sentence in this document that disagrees with a row there is a defect here.

**One caveat worth carrying rather than hiding.** A permission entry is matched against the **raw command string**, a helper invoked through the **unresolved** plugin-root token matches no entry however that entry is worded, and the resolved root carries the plugin version, so an entry generated once would go silently stale on an upgrade. The adopter adds those entries by hand and `doctor` prints the exact lines to paste; `${CLAUDE_PLUGIN_ROOT}/scripts/README.md` states the step and the entry form. What a missing entry costs is a **silent stall** rather than a refusal, which is why it belongs in this section instead of a troubleshooting appendix.

---

## Out of scope in this release

Three boundaries, stated plainly rather than defensively — they are the honest scope of a first release, not gaps awaiting an apology.

- **No forge coupling.** An issue-label trigger, draft-pull-request output and comment-based clarification all belong to the `forge` configuration key, which is declared and has no reader yet. Nothing here opens a pull request or consults a code-hosting platform, and file drops are the entry points for exactly that reason. The watcher is a thin adapter over the engine commands, so a later adapter for a different trigger feeds the **same** engines rather than reworking them.
- **The flow ends at "branch pushed."** Landing the work is the operator's, deliberately: `## Output guarantee` is the boundary, and no configuration extends a run past it.
- **Single machine, git only.** One daemon, working copies on one filesystem, a usage lane scoped to that machine, and git as the only version-control system any part of this understands.
