# Run mode — a task prompt's directives to the orchestrator (canonical, single source of truth)

## Resolved values

The token below is neither a Mode-contract **binding** (this file declares none — the `**Placeholder resolution.**` note below states where the ones it *uses* come from) nor an ordinary **path placeholder** (`<branch>` and `<prompt_path>`, plus the names this file's own text defines at their use sites — that same note enumerates them): it resolves from the adopting repository's `harness.config.json`. It is declared here once, and after this table the body uses it as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |

**Phase configuration, and why the body never names it.** This house also gates whole phases from the adopting repository's configuration (`phases.qa`, `phases.docs`, `phases.parity`). The consequence, made concrete here because it names this house's configuration: a phase already disabled there is skipped whatever a run mode says, and **a run mode never re-enables it** — which is the body's subtractive-only rule (`## The closed directive set — the only four things a run mode may switch off`) applied to this house, not an addition to it.

---
A task prompt may open with a `### Run mode` section naming the reviewers and phases that branch does not want dispatched. That section has two sides — the author who writes it and the orchestrator that must act on it — and it binds neither unless one file defines it for both: an undefined convention is a convention with authors and no reader, observed only where an orchestrating session happens to open a file it is told merely to *confirm the existence of*. **This file is the canonical contract for that section**: what it is, how it is found, what it may and may not switch off, where it is read, where it is recorded, where it is re-read, and the disclosure it owes. A flow **activates** it by pointing at it from each site listed in `## Activation`; it never restates any part of it, per `${CLAUDE_PLUGIN_ROOT}/instructions/mode_contract.md` rule (5) — a copy creates a second owner of the contract. This file is otherwise inert.

**Placeholder resolution.** Per `${CLAUDE_PLUGIN_ROOT}/instructions/mode_contract.md` → `### Bindings vs. path placeholders`, the two `<…>` **path placeholders** this file resolves from outside itself — `<branch>`, and `<prompt_path>` for the activating flow's own task prompt — both resolve from the **activating flow's own entry core `## Setup`**, never from the immediate citing file and never from here. A core that holds that prompt path under another name (`<task_prompt_path>`) or already resolved (`<state_dir>/task_prompts/<branch>_task_prompt.md`) uses its own spelling; the trigger-command literal designated in `## Read point — Setup, before the first dispatch` governs that substitution. Every other `<…>` name below is defined by this file's own text at its use site (`<ids>`, `<verbatim directive>`, `<reason>`) and resolves from nothing external. If either path placeholder is unresolved, you arrived without your entry core's `## Setup` — go read it.

**Mode-free and family-neutral.** This file declares no phase, holds no dispatch block of its own, and supplies no mode-specific value. Every flow that activates it gets the same text.

## What a run mode is, and who reads it

A `### Run mode` section in a branch's task prompt is a set of directives addressed to **the orchestrator** — the participant that decides which phases run and which agents are dispatched — and to no sub-agent. It is authored by whoever writes the prompt, at the moment they know things about the branch that no later reader can re-derive: that there is no reference implementation to check parity against, that nothing in the deliverable renders, that the branch has no documentation surface.

Its directives are **subtractive**: a run mode removes work from a run that would otherwise be done. It never adds a phase, never changes how a phase behaves, and never reaches inside one.

## Read point — Setup, before the first dispatch

**The trigger is a grep, not a read.** At its `## Setup`, before any dispatch it makes, the orchestrator establishes only *whether this run has a run mode*:

1. **Where the flow's record already exists** — a ledger carrying a `## Run mode` block, on a resume or where a fork wrote it first — read that block; it is a handful of lines in a file the flow opens on entry anyway.
2. **Otherwise** run exactly `grep -nE '^#+ *Run mode' <prompt_path>`: one command, no file read. A flow with no task prompt at all, or whose prompt does not exist, skips even that.
3. **No hit — or a recorded block reading `skipped: none` with no `ignored:` line — is a complete answer.** This run has **no run mode**: record `skipped: none` where a record is kept, emit the disclosure line's `none` form `📌 Run mode: none` at every disclosure site, and **do not open this file**. That is the whole obligation of a run with no run mode, and it is the common case.
4. **A hit — or a recorded block that names any id or carries an `ignored:` line — is when this file is read**, from `## The section contract — name, shape, and how it is found` onward (plus the `**Placeholder resolution.**` note above, which is where `<branch>` and `<prompt_path>` come from), and followed in full. What it resolves to is recorded where `## The durable record` says. A block carrying an `ignored:` line is a hit **even where it also reads `skipped: none`**: it records a directive that was not honoured, and `## Conflicts, and what happens on one` owes that directive a disclosure no bare `none` line carries.

A directive that arrives after the phase it governs has already been dispatched has cost exactly what it existed to save; a contract read by a run that has no directives has cost the same thing in the other direction.

**Three literals a citing site may spell inline.** A pointer to this file restates none of it (`${CLAUDE_PLUGIN_ROOT}/instructions/mode_contract.md` rule (5)) — with exactly three designated exceptions, all of which exist so the no-run-mode path never has to open this file: the trigger command `grep -nE '^#+ *Run mode' <prompt_path>` (whose regex is fixed, and whose path argument is the citing flow's own spelling of the task prompt path — `<prompt_path>`, `<task_prompt_path>`, or the resolved `<state_dir>/task_prompts/<branch>_task_prompt.md` — a substitution, not a paraphrase), the disclosure line's `none` form `📌 Run mode: none`, and the recorded block's no-run-mode form `skipped: none` with no `ignored:` line — together with its complement, that a block naming any id or carrying an `ignored:` line is a hit (the record's shape is otherwise `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md`'s, per `## The durable record`). All three are owned or designated here and may be reproduced verbatim at a read point or a disclosure site. Nothing else may be, and no exception licenses a paraphrase of the surrounding rule.

This discharges the standing rule in `lessons.md` that an instruction must state its READ point and not only its write point: a policy whose rules constrain behaviour *during* a phase has to reach the agent **before** that phase begins.

**Reading the task prompt is an addition, not an exception.** Each orchestrating core's `## What you must NOT do` carries a path-only rule, and that rule names **review artifacts and plan files** — the prompt is neither. Nothing prohibited reading it before this file existed; reading it was merely unstated. So no core's prohibition is amended, weakened or carved out to make this read legal, and none should be read as having been.

## The section contract — name, shape, and how it is found

- **Name.** A heading whose text is exactly `Run mode`, at **any** level — matched by `^#+ *Run mode`.
- **Body.** A bullet list, **one directive per bullet**; a directive spanning two bullets is two directives.
- **End.** At the next heading of the same or higher level. Non-bullet content inside the section (quotes, tables, fences) is **read as context but is not a directive**: it gets no id, and it is **not** written into the run-mode record, whose shape (`## The durable record`) has no field for it.
- **Optional.** No such heading — or no prompt — means **no run mode**: a normal outcome, not an error.

**The bounded extraction**, used at every point in this file where a `### Run mode` section is actually extracted — its step 1 is also the standalone trigger grep of `## Read point — Setup, before the first dispatch`, which on a no-hit run is the whole of the obligation and never reaches step 2:

1. `grep -nE '^#+ *Run mode' <prompt_path>` for the heading line.
2. `Read` that file at `offset` = that line, `limit` = 40, extended only if the section has not ended.

**Never a whole-file read into the orchestrating context.**

## The closed directive set — the only four things a run mode may switch off

| id | What it switches off |
|---|---|
| `parity` | the implemented-branch business-parity phase, **and** the business-parity plan-review gate in the planning loop and in the user-review fix-plan gates |
| `architecture` | the implemented-branch architecture phase, **and** the architecture plan-review gate in the planning loop and in the user-review fix-plan gates |
| `qa` | the UI-test-plan write loop, the task engine's QA phase, and the user-review engine's QA phase including its UI-test augment |
| `docs` | the docs phase run inside the code flows |

An author's phrasing maps onto these ids by ordinary reading; no alias list is kept. A bullet addressed to a sub-agent or to whoever launches the run switches nothing off and gets no id (`## What a run mode does not affect`), and one affirming that a phase runs normally is a no-op by `**Subtractive only.**` below.

**The set is closed.** A directive naming something outside it is **not** an invitation to invent a fifth id: it is reported and ignored, per `## Conflicts, and what happens on one`.

**Subtractive only.** A run mode may switch a phase **off**, never **on**. A phase already off for any other reason — a fork that never declares it, a flow that has no such phase, a repository-level setting that disables it — **stays off**, and a run mode neither restores it nor is in conflict with it. Affirmative *"X runs normally"* bullets are no-ops by this rule.

## The safety floor — what a run mode may never skip

The following are **never skippable**. A directive naming one of them is ignored and reported (`## Conflicts, and what happens on one`), whatever it says and however plausibly it is argued:

- commits and pushes;
- the flow-progress ledger, its creation and its flips;
- the STOP file, the PAUSE protocol and the global kill switch;
- the dispatch counter and `MAX_TOTAL_DISPATCHES`;
- the clarification channel;
- the end-of-branch general review and its meta-review;
- the review-plan fix phase;
- the adversarial skeptic review and its meta-review;
- the structural plan reviewers — `task-plan-reviewer`, `ui-tests-plan-reviewer`, `review-plan-reviewer` — **while the phase that dispatches them runs**;
- the branch-statistics write and the Done summary;
- any leak / secret scan or acceptance gate **the task prompt itself defines**.

**The distinguishing principle, in one line:** a run mode may switch off a **review or QA phase whose absence is visible in the run's own artifacts**, and never a **safety, durability or disclosure step whose absence is silent**. A skipped parity review leaves a ledger entry and a disclosure line that say so; a skipped commit leaves nothing at all, and the run that skipped it reports success.

Note what the last floor item is *not*: an acceptance gate the prompt defines is the prompt's own requirement, so a `### Run mode` bullet in the same prompt cannot retract it here. Change the gate, not the run mode.

Note likewise what the reviewer item is *not*: a bar on an in-set id removing the phase a reviewer serves. `qa` switches off the UI-test-plan write loop — the only site that dispatches `ui-tests-plan-reviewer` — so that reviewer is skipped **with its phase**, and the run has not touched the floor. What the floor bars is dropping a structural reviewer from a loop that still runs.

## Conflicts, and what happens on one

A run mode is author-written prose and can be wrong. Three resolutions, and one rule that binds all three:

- **A directive contradicts a flow's own mandatory-phase rule** — the flow wins. A fork that makes a phase mandatory has stated a binding value; a prompt does not override one.
- **A directive names something outside the closed directive set** — it is ignored.
- **A directive names something on the safety floor** — it is ignored.

**In every case the conflict is reported, never silently resolved:** named on the disclosure line's ignored-directive suffix (`## The disclosure line`) — always — and, **where the flow keeps a run-mode record of its own**, carried into that record too (`## The durable record`). On a flow whose record is the task prompt itself, the disclosure line is the whole of it: the prompt is an input, never written to. Silent resolution is the failure this whole contract exists to remove — an unread run mode and a quietly-discarded one are indistinguishable to every later reader, and both cost the run the same.

## The durable record

The extracted run mode is written into the flow-progress ledger's `## Run mode` block by the fork that creates or re-seeds the ledger, and the phases it switches off are seeded with the ledger's skipped-phase marker at that same moment. **The block's shape, the marker and the resume rule are owned by `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` — read them there; nothing about them is restated here, with the single exception `## Read point — Setup, before the first dispatch` designates: the block's no-run-mode form `skipped: none` with no `ignored:` line, which a record-first read point may spell inline so that path never has to open this file.**

Two properties this buys, which are this file's claims and not that file's:

- **It is committed and durable.** The record outlives the session that made it, so it is not a fact carried in an orchestrating context that auto-compaction may drop.
- **It is inherited without a relay.** That file's resume rule re-reads the ledger on every (re-)entry, so a **resumed run that never dispatches a planner**, and an engine that has no planning half at all, both arrive already holding the run mode — no sub-agent has to relay it, and no orchestrator has to have read the prompt itself.

**Tie-break.** Where the prompt's `### Run mode` and the recorded block diverge — a prompt edited mid-branch — **the recorded block wins**, and the divergence is reported the way `## Conflicts, and what happens on one` requires. To change a run mode mid-branch, edit the ledger's `## Run mode` block and its markers; editing the prompt alone changes nothing that any running flow reads.

**The no-ledger fallback — not every governed flow keeps a ledger.** The flow-progress ledger is added by a fork, and a flow whose fork maintains none still has to honour a run mode. So:

- **Where a ledger exists**, its `## Run mode` block is **the** record and the re-read source.
- **Where the flow keeps no ledger**, the **task prompt itself is the record**, and the re-read is the same bounded extraction of `## The section contract`, repeated at each gate. The prompt is committed and exactly as durable.

What the ledger adds is therefore **not durability but inheritance**: a run that never opens the prompt — a resume that skips planning, an engine with no planning half — still gets the run mode. A ledger-less flow is **not** ungoverned; it simply re-reads its own committed source instead of a derived one.

## Re-read at the point of use

Each governed decision point **re-reads** the run mode — from whichever of the two records applies — immediately **before that phase's first dispatch**. Never rely on a value read at session start.

The reason, in one sentence: a fact read once at `## Setup` and needed twelve phases and hours of auto-compaction later is exactly the read-once/needed-repeatedly failure this form exists to avoid, and its failure mode is silent, because an orchestrator that has lost the fact behaves precisely like one that never had it.

The re-read is cheap: a bounded read of a short committed file the flow already opens on entry, not a second extraction from a long prompt.

## The disclosure line

The disclosure is **mandatory and affirmative** in every governed flow's convergence summary and Done summary, so that *no run mode* and *a run mode nobody honoured* are distinguishable without opening a file.

**The authority named is the record `## The durable record` makes authoritative for this flow**, so the line has two forms — its **Tie-break** gives the ledger block precedence over the prompt, so a ledger-keeping flow naming the prompt would send an auditor to the losing source. Where the flow keeps a flow-progress ledger (whose path is owned by `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` → `### 1.1 File`):

`📌 Run mode: skipped <ids> — authority <state_dir>/flow_progress/<branch>_progress.md ## Run mode`

Where it keeps none and the prompt is itself the record:

`📌 Run mode: skipped <ids> — authority <state_dir>/task_prompts/<branch>_task_prompt.md ### Run mode`

or, where the prompt carries no such section at all:

`📌 Run mode: none`

and, where any directive was **not** honoured, the same line takes the suffix:

` | ignored: "<verbatim directive>" (<reason>)`

That `none` form is one of the three literals `## Read point — Setup, before the first dispatch` designates as spellable inline at a citing site, so a run whose grep found no `### Run mode` heading emits it without ever opening this file.

**One suffix carries every non-honoured directive** — out-of-set, safety-floor, and the launcher-addressed entry-mode class of `## What a run mode does not affect` (d) — each distinguished by its own `(<reason>)`. Do **not** invent a second suffix, a second disclosure line or an extra ledger field for any of them: the record's shape is owned by `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md`, and this file may not add fields to it.

`<ids>` is the set of directive ids **actually honoured this run**, spelled with the ids of `## The closed directive set — the only four things a run mode may switch off` — never a paraphrase of the author's prose, and never an id whose phase in fact ran. `<verbatim directive>` means verbatim: it is the wording, not a summary of it, that lets a later reader judge whether ignoring it was right.

## What a run mode does not affect

Four facts a reader will otherwise assume wrongly.

**(a) It does not change the branch-statistics success rate.** That computation's denominator is the story index's story-point sum and its subtraction is the user-review issue cost. It reads **none** of the phases a run mode can switch off, so a skipped phase neither inflates nor deflates it, and no compensation is owed. (Checked, and reported here rather than left to be rediscovered.)

**(b) A run-mode bullet addressed to a sub-agent is not an orchestrator directive.** How the plan is written, which layer tag its tasks carry, which process steps of a writer's contract do not apply, which trees are read-only source — these reach that agent through the prompt **the agent itself reads**. The orchestrator must **not** paraphrase such a bullet into a dispatch prompt: that is a conclusion rather than knowledge, under `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md`. It needs no id, and switching nothing off, it changes no phase.

**(c) It does not license skipping a per-unit reviewer whose presence is a fork binding value.** That value is the fork's, and a prompt does not bind a fork.

**(d) A directive about how the run is *launched* is not a phase switch — and is never silently dropped.**

A `### Run mode` bullet may constrain the **entry path** rather than the phase sequence: typically that the branch must be run in a **supervised / interactive** session rather than dropped into the **headless inbox**, because its deliverable lives under paths a headless approver cannot write, or because its acceptance gates are commands only an interactive session may run. It is a shape to expect rather than an edge case, and typically the section's first bullet: the phase directives under it assume the run started where it says.

It is addressed to the participant that **launches** the run, not to the orchestrator, and it switches no phase off. So it is **neither** one of the four ids **nor** a safety-floor violation, and it has no id of its own.

What a governed orchestrator that meets one does:

1. **Carry it verbatim onto the disclosure line**, through the ignored-directive suffix, with a reason naming the class: `launcher-addressed entry-mode directive — binds whoever launches this run, not this orchestrator`. Where the flow keeps a run-mode record, it lands there by that same route.
2. **Where the entry path this session is *actually* running on visibly contradicts it**, additionally report the contradiction on the clarification channel — a safety-floor step, always available — and then continue.

**Why that, and not a halt.** By the time any orchestrator reads the bullet, the launch decision has already been taken; and a run mode is subtractive over **phases**, so it confers no power to stop a run. What this disposition buys is that the directive is **legible in the run's own artifacts** rather than read and discarded — which is the whole of what the orchestrator can still contribute at that point, and strictly more than the nothing a closed four-id set would leave behind.

## Activation

**This file owns the run-mode contract** — the section's name and shape, the closed directive set, the safety floor, the conflict rule, the read and re-read points, the durable record's *role* (its format belongs to `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md`), the disclosure line, and this activation list. Every wired document carries a **pointer** to the relevant section and restates none of it.

**The four orchestrating cores**, which activate it at their `## Setup` read and at each gating site they own:

- `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_core.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_core.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_core.md`

plus the **engine entry commands** that perform the Setup read of the prompt.

**The fork sites that act on a directive no core owns.** Two kinds, and both are activators in their own right — omitting either would make the closure claim below false:

- **(i) The `## Override H` docs-phase activation** in the two autonomous orchestration forks — `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md` and `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_autonomous.md`. The docs phase has **no core counterpart at all**: no core declares or mentions it, and the override activates `${CLAUDE_PLUGIN_ROOT}/instructions/docs_phase_instructions.md` directly. The `docs` directive is therefore honoured **only** there.
- **(ii) The ledger creation / re-seed act** in the two ledger-creating forks — `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md` and `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_autonomous.md`. That is where the durable record is written and the skipped-phase markers are seeded, and no core owns that act either.

Listing non-core documents here is house-consistent, not an exception: the sibling module `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md` names a non-core document in its own `## Activation` alongside its cores.

**Closure, and its two carve-outs.** A citer **points and never restates**, and **no document beyond the set named above may activate this file.** A document that does activate it may carry the pointer at more than one site — its Setup read, each gating site, its record write, its disclosure line — because each is a different moment in that flow; what may not multiply is the set of activating documents. Two things are **not** further activators:

- **A fork that supplies a core's hand-off binding.** Where a core's hand-off or convergence summary is a fork-held value, the `📌 Run mode: …` line has to be emitted inside that value — that is where the hand-off actually happens — so the fork carries the pointer at its own disclosure site. A fork and its core are **one** document for this purpose: `${CLAUDE_PLUGIN_ROOT}/instructions/mode_contract.md` rule (2) makes neither complete alone, so a fork pointer **completes an already-activating core** rather than adding a document to the list.
- **A definitional citation.** A document that names this file only to explain what a run-mode-skipped phase *is* — as `${CLAUDE_PLUGIN_ROOT}/instructions/improvement_observations_instructions.md`'s trip-wire note (c) does, so that a phase a run mode switched off is not reported as zero-yield — cites nothing into effect. It is definitional, and is listed as such rather than as a further activator.

**Coverage — stated plainly, including what is not covered.**

- **Governed: the task engine's planning half and its implementation half, and the user-review-fix engine — in *all* their modes.** The gates live in the shared cores, so the supervised fix-plan flow (`${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions.md`) and the semi-autonomous planning flow are governed through the same core steps and carry the same disclosure line in their own hand-offs. Governance is not an autonomous-mode feature.
- **Not governed: the docs engine.** A docs run starts from a documentation checklist and reads no task prompt, so there is nothing for it to extract. The only path that runs the docs phase off a task prompt is the code flows' docs phase, which **is** governed, at the `## Override H` sites above.
- **Not governed on the supervised side, and narrower than "the supervised flows":** the supervised **task-planning** flow reads the whole task prompt itself and dispatches none of the reviewers a run mode can name (its UI-test planning is opt-in on explicit request), and the supervised **item-loop** flows run one item per session with a human composing every dispatch. Neither is blind to a run mode; neither needs a mechanism to reach it.
