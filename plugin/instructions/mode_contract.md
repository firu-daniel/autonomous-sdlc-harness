# Mode contract — the named-binding vocabulary

This file defines the **mechanism** by which a mode-free `…_instructions_core.md` and a thin per-mode fork (`…_semi_autonomous.md`, `…_autonomous.md`, or a supervised fork) compose: the binding names a core may leave open, what each name stands for, and the five rules that keep the composition honest. **Reading this file is optional for execution** — a fork's binding table plus the core it names is self-sufficient, and no agent needs this vocabulary to run a flow. It exists so all four instruction families use one vocabulary instead of inventing four. It defines **no values** itself.

---

## Resolved values

**These are a third vocabulary.** The tokens below are neither the **bindings** this file defines (`## Binding vocabulary`, which a fork supplies) nor the **path placeholders** `### Bindings vs. path placeholders` governs (which resolve from a flow's entry core `## Setup`): they resolve from the runtime or from the adopting repository's `harness.config.json`, identically for every flow, and are declared here once so the body below can use each one as an ordinary placeholder. Adding them does not blur this file's own two-vocabulary distinction — it names a third that resolves from neither place.

**`<app_root>` and `<app_dir>` are deliberately two names.** `<app_root>` is the **binding** — the flow's app root, the value a fork supplies — and `<app_dir>` is the **config token** it is built from (`<app_root>` = `<repo_root>/<app_dir>`). `<repo_root>` is the one name that appears in both tables: `## Binding vocabulary` declares it as a binding a fork must supply, and the row below states how a fork obtains its value.

| Token | Class | How to resolve it |
|---|---|---|
| `<repo_root>` | derived at runtime | The absolute root of the checkout the flow is executing in. Obtain it with a **bare** `git rev-parse --show-toplevel` and build every literal path from the result. Never embed the `$(…)` substitution inside another shell command, and never stash it in a shell variable across separate Bash calls — separate calls do not share shell state. |
| `<app_dir>` | config value | `harness.config.json` → `appDir` — the app's directory inside the checkout, repo-relative. The binding `<app_root>` is built from it. |
| `<scripts_dir>` | config value | `scriptsDir` — the directory the wrapper scripts named in this file live in. The commit / push / watcher scripts named by path here are outer-loop scripts rather than generated wrappers — they are named by their destination path, and the item that delivers them settles it. |
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<reference_impl>` | config value | `parity.referenceImplPath` — the reference implementation this project is kept in parity with. Read **only** when `phases.parity` is `true`. |
| `<qa_creds_path>` | config value | `qa.credentialsPath` — the repo-relative path of the gitignored test-account file. Read only when `phases.qa` is `true`. |

---

## Binding vocabulary

| Binding | What it stands for | Bound by |
|---|---|---|
| `<escalate>` | The flow's escalation path for an **agent/flow blocker** — what to do when a step must halt and report that blocker. The flow does not continue. **Scope:** a `<state_dir>/STOP` / global `AUTONOMOUS_STOP` halt is a **user-initiated stop, not a blocker, and is NEVER routed through `<escalate>`** — it halts as written, emits its own message and names `<reentry_command>` (`${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_autonomous.md` → ``### `<escalate>` / `<ask>` — the park-and-yield clarification reroute`` states the rule; `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md` → ``### `<escalate>` — the clarification reroute`` scopes the reroute to a genuine blocker, which a user-initiated stop is not). A `MAX_TOTAL_DISPATCHES` cap halt is a **per-family disposition, not a convention** — families 3 and 4 route it through their escalation path today (`${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_autonomous.md` → ``### `<escalate>` / `<ask>` — the park-and-yield clarification reroute``, whose closed list names the cap explicitly; `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Safety scaffolding (delta — the core states none)`), families 1 and 2 do not (`${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md` → ``### `<escalate>` — the clarification reroute``, whose reroute names no cap halt) — so each core states its cap halt the way its own family states it today, and no core generalises. | Every fork. Exists because the supervised orchestration flow carries 21 halt-and-report escalation sites — the list `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `## Stop conditions (halt and do NOT continue)` holds today — which the autonomous fork reroutes (`${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md` → ``### `<escalate>` — the clarification reroute``); the STOP entry and the cap entry that column 2 scopes out are counted among the 21 sites but are **not** rerouted. |
| `<ask>` | The flow's clarification path — what to do when the flow **needs an answer before it can continue**. Distinct from `<escalate>` because a supervised binding waits in-session and then **resumes**, while `<escalate>` ends the flow. | Every fork. Exists because a supervised writer flow stops on a writer's `## Questions` section and waits for an in-session answer (`${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_core.md` → `## Loop` holds that present-and-stop handling today, at its writer-dispatch step), while `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md` → ``### `<escalate>` — the clarification reroute`` writes a question file, parks, and ends the session. |
| `<repo_root>` | Absolute root of the checkout the flow runs in — anchors `<reference_impl>` reads (only when `phases.parity` is `true`) and the QA credentials file at `<qa_creds_path>`. | Every fork. Exists because the checkout root differs per run mode and must be resolved rather than assumed: a supervised fork binds it to the session's own checkout (`${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_semi_autonomous.md` → `## Mode contract — bindings`, its `<repo_root>` row), while the autonomous fork binds it to the run's own per-branch worktree and states that a main-repo path is wrong there (`${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md` → `## Mode contract — bindings`, its `<repo_root>` row). |
| `<app_root>` | The flow's app root, `<repo_root>/<app_dir>` — where the app's own source tree sits. It is **not** a working directory and anchors no wrapper invocation: the configured `commands.*` strings and the `<scripts_dir>` wrapper paths they name are repo-relative and run from `<repo_root>`. | Every fork. Exists because the core names that tree in two steps — `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `## Setup (once per session)` step 3 and `## Phase E — QA testing` E.0 — and each mode resolves it against a different checkout, the autonomous fork rebasing it onto the run's own worktree. |
| `<per_unit_review>` | `on` \| `off` — whether the per-unit `layer-reviewer` step runs between implementer and committer. When it is `on`, the review-step body **and** its `iteration >= 5` convergence cap apply; that cap exists **only** when per-unit review is on. | Every fork (the value only — the gated body is stated once, in the file that owns the loop). Exists because `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md` → `## Override F — per-unit review off` spends a whole override **deleting** a step the shared canon baked in. |
| `<committer_push>` | The extra arg line appended to every `committer` dispatch block — omitted, or `push: true`. | Every fork. Exists because `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md` → ``### `<committer_push>` — `push: true` on every committer dispatch`` exists solely to add that one arg to every committer dispatch the canon already specifies. |
| `<reentry_command>` | The command named in halt / STOP messages ("… re-run X to continue"). | Every fork. Exists because a supervised fork names a mode-specific command that is the wrong command for a fused autonomous entry point (`${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_autonomous.md` → `## Mode contract — bindings` re-points it). |
| `<planning_command>` | The command that produces the plan a flow expects to already exist. | Every fork. Exists because a Setup missing-file check names one by literal — `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `## Setup (once per session)` is where that check lives today. |
| `<next_step_note>` | The terminal "optional next step" paragraph of a Done summary. | Every fork. Exists because a supervised flow closes with a mode-specific hand-off naming a command that does not apply headless; each fork now carries that text as the value of its own `<next_step_note>` binding row. |
| `<terminal_handoff>` | What happens when a writer/reviewer loop converges — present-and-stop, or emit-a-summary-and-fall-through. | Every fork. Exists because a supervised writer fork ends the flow with a present-and-stop section (`${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_semi_autonomous.md` → ``### `<terminal_handoff>` — Present to user``), where an autonomous fork falls through into implementation. |
| `<existing_artifact_decision>` | How a flow decides what to do when its output artifact already exists on (re-)entry. | Every fork. Exists because `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_semi_autonomous.md` → `## Mode contract — bindings` (its `<existing_artifact_decision>` row) poses an interactive extend / rewrite / stop question that `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md` → `## Mode contract — bindings` (its own `<existing_artifact_decision>` row) replaces with a non-interactive decision. |

---

## (1) No defaults

A core never supplies a value for a binding. A fork must bind **every** binding its core declares, and an **unbound binding is a stop condition** — the flow halts and reports rather than guessing. This is not stylistic: a baked-in default is exactly what produced today's inversion, where the shared canon carried supervised values that the autonomous fork then had to undo at ~40 decision points.

This rule is scoped to **bindings** — the names in the table above — and to nothing else. A `<…>` name that is a *path placeholder* never halts a flow; see `### Bindings vs. path placeholders`. Rule (5) narrows the rule once more: a binding a **cited** core declares for sections the citing flow never executes is not a stop condition.

## (2) Read-order independence

The core declares the binding set it uses and states: *you were dispatched via a fork; read that fork's binding table.* Each fork names its core and carries the binding **values inline** — not by pointer, not in a third file. Both read orders (core→fork and fork→core) therefore converge on the same pair of documents, and **neither file is complete alone**. This vocabulary file is never a link in that chain.

## (3) Additions stay in the fork

Mint a binding only where the core cannot state the behaviour mode-free, **or** where the value is a mode-specific literal — a command name, a machine path — that a core is forbidden by rule (4) to contain. Behaviour that one mode purely *adds*, and that no other mode has, stays a fork Override: there is nothing in the core for it to fill. That is what keeps placeholders from sprawling — the binding set stays small and closed by construction.

## (4) Cores are literal-free

A core contains no reader-naming escalation phrase, no slash-command name, no absolute machine path, and no step that any mode deletes. This is grep-enforced per family by that family's referrer sweep, reported with before/after counts for each leak class. If a core seems to need one of those literals, it needs a **binding** (rule 3), not an exception.

## (5) A core may cite another core

A core may run a section of another core **by reference**. It may not copy it — a copy creates a second owner of the contract, which is the failure this restructure exists to remove.

**Cross-fork citation is scoped, not banned.** A fork may not cite another fork for **flow-body content that the citing fork or its core would otherwise own** — a phase body, the unit loop or its per-unit review step, a Setup, a safety contract, a stop-condition list. That is the move that produced today's inversion, and it is prohibited outright. Cross-fork citations **outside** that scope exist today, are deliberately preserved by this restructure, and are enumerated in `### Sanctioned cross-fork anchors` below.

**Which bindings are in effect across a core→core citation:** those of the **citing flow's own fork**. Only the bindings the cited sections actually *use* must be bound — **a binding the cited core declares for sections the citing flow never executes is not a stop condition**, so rule (1) does not fire on it. The citing core must declare, in its own binding table, every binding its cited sections consume, so its forks can bind a complete set from one table. Concretely: family 3's core cites the shared `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` and family 1's `## Phase E — QA testing`, so a family-3 flow's fork supplies the bindings for both, while family 1's `<planning_command>` — declared for a Setup step family 3 never runs — stays unbound and un-stopping.

### Bindings vs. path placeholders

Both vocabularies are spelled `<…>`, and conflating them is silent. A **mode-contract binding** is one of the names in the table above and resolves from the **citing flow's fork**. Every other `<…>` name a core or a cited file uses (`<branch>`, `<story_path>`, `<task_file>`, `<qa_review_findings_dir>`, …) is a **path placeholder**, and it resolves from the `## Setup` of the **flow's own entry core** — the core named by the fork the flow was dispatched via, regardless of how many core→core citations deep the text sits.

Being the immediate citer, being the containing file, being a fork, or being *the family a cited section originated in* confers no ownership of a path placeholder; only being the entry core does. When one of those files also happens to be the entry core, it owns the paths for that flow on that ground alone.

**Worked example (two hops).** A family-3 flow that reaches family 1's `## Phase E`, and through it `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` row `E.3`, still resolves its path placeholders from **family 3's** `## Setup` — even though every file it passes through belongs to family 1.

**Transitional clause.** A flow whose family has **no core yet** resolves its path placeholders from its **entry document's** own `## Setup` — the fork itself — and that is the **only** case in which a fork owns them; it exists solely for the transitional state and ends when that family's core lands. The clause says *when* that case applies; it does not reopen the exclusions above, and it never applies to a flow whose family does have a core. No family in the shipped instruction set is coreless, so the clause has no live instance; a family added without a core resolves its path placeholders this way until its core lands. **A coreless family reaching a shared file whose path placeholders no `## Setup` owns is a Must Fix.**

**The reader's tell.** An unbound *binding* is a stop condition (rule 1). An unresolved *path placeholder* means the flow reached that text without its entry core's `## Setup` — the fix is to go read that Setup, not to halt.

A shared file reached by two cores may therefore see the **same placeholder name defined differently** depending on the entry core: `<qa_review_findings_dir>` / `<qa_fix_findings_root>` are family 1's unsuffixed `<state_dir>/qa_reviews/<branch>_qa_review/` but family 3's next-free `<round>`-suffixed folder, and resolving from the wrong one collides with exactly the artefact family 3's round resolution exists to avoid. A shared file must therefore record, **per section or per row, whose `## Setup` owns its paths** — that is what `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md`'s `### Placeholder resolution` rule and its `Placeholder owner` column discharge, in this same "entry core" wording.

### Sanctioned cross-fork anchors

The named, finite list of fork→fork citations this restructure **keeps**. Rule (5)'s prohibition is scoped to flow-body content; do not "fix" anything on this list.

**Class (i) — fork-owned sections their citers resolve by an `Override <n>` label, which a family-neutral core cannot carry — directly, or via the sibling section they mirror and can only move with.**

- `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability` (cited as `Override 2(a)`).
- `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability` (cited as `Override 2(a)`).

*Reason:* every site that resolves either section is **inside** the ported instruction set — a case-insensitive `grep -in "override 2"` over the shipped tree returns hits only under `plugin/instructions/` and `plugin/commands/`, and **none** in `<scripts_dir>/autonomous-watcher.sh`, which never uses the label at all. So no move here is watcher-gated. What blocks the move is the **label**. The planner's section is named as `Override 2(a)`, with neither filename nor heading, by `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` → `### 1.7 Resume-from-ledger (every fork, on every (re-)entry)` and by `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md` → its **Resume-from-ledger** paragraph; the fix-plan fork's is named the same way by `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_autonomous.md` → ``### `<escalate>` / `<ask>` — the park-and-yield clarification reroute``. A family-neutral core states no Overrides and cannot carry that label, so each of those sites must be **rewritten**, not repointed. The **second** bullet is in the class derivatively as well: that section *is* the planner's mirrored (it opens by citing the planner's), so the two can only move together.

**Class (i-b) — fork-owned sections every autonomous flow cites that *can* reach a family-neutral core without stranding anything out of scope: the one out-of-scope file that mentions them, `autonomous-watcher.sh`, mentions them only in forms a move leaves true.**

- `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)`.
- `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md` → `## Ask-vs-assume policy`, cited by the other three autonomous forks.

*Reason:* each is a genuinely shared autonomous-only contract with one owner, and the citations are preserved for the same single-owner reason as class (ii). **No out-of-scope file resolves either anchor by a name a relocation would strand.** `autonomous-watcher.sh` is the only out-of-scope file that mentions them at all, and it names **neither the file nor any heading**: the policy appears twice and identically, in lowercase prose inside its headless prompt string (*"whenever the ask-vs-assume policy says ask, …"*); the channel appears as lowercase prose in that same prompt (*"use the file-based clarification channel …"*) and as the literal artefact path `<state_dir>/clarifications/<branch>/question_<n>.md` / `answer_<n>.md` it reads, under a comment that disclaims ownership outright — *"The clarification channel's file format is the corpus's, not this script's."* Every one of those hits survives a relocation untouched. What **is** watcher-gated is not either anchor's location but the **artefact path shape**: change the `question_<n>.md` ↔ `answer_<n>.md` names or their index pairing and the watcher's park/resume detection breaks with it.

Relocating either therefore needs **no** `autonomous-watcher.sh` edit — **every** site a move would falsify is in scope. That set is **wider than this class's fork→fork citations, and no list of it here is closed**: re-derive it from a repo-wide grep at move time. It provably reaches at least the `/autonomous-sdlc-harness:branch-answer` and `/autonomous-sdlc-harness:branch-start-plan-autonomous` slash commands and the `AUTONOMOUS_FLOW.md` flow-overview document, each of which names the owning file **and** the heading; `/autonomous-sdlc-harness:branch-start-plan-autonomous` and `AUTONOMOUS_FLOW.md` additionally assert that the planning **fork** *owns* these contracts — a claim a move to a family-neutral core falsifies. What makes this the cheapest of the anchor follow-ups is that the whole repoint set is in scope, **not** that it is short. **Carry the heading text across byte-identical when it moves:** several in-scope citers name the heading, and the watcher's prose names the policy by name, so a relocation is a repoint job but a *rename* strands them.

**Class (ii) — autonomous-only coordination facts with no core surface.**

- `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md` → `## Autonomous-fork commit points — the clean-tree invariant (single source of truth)`, cited by the other three autonomous forks (and by `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` → `## 3. Interaction with the clean-tree invariant + hard boundary`, plus the out-of-scope `autonomous-watcher.sh`).
- The reciprocal "which fork owns which commit point / ledger range" sentences those four forks exchange.

*Reason:* no mode-free core can state these — they describe one mode's forks to each other, which mechanism rule (3) keeps in the fork.

**Class (iii) — readership statements that name a sibling fork but cite nothing from it.**

- `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_semi_autonomous.md` → `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md`, named only to say that fork **binds the core directly and does not read this file**.
- `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md` and `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_autonomous.md`. Each names it in a **Resolution form is a per-site fact** paragraph, to record that it is a **citer of the naming file's anchors** and which form each of its citing sites uses — a fact about the citer set, not a rule taken from it.

*Reason:* neither kind is a citation — each sources no rule and takes no anchor's content from the file it names; the first asserts a **negative** (who does *not* read this fork), the second a **positive** (who *does* cite it, and in what form). Both are the "who reads me" fact that makes a fork's ownership claim checkable from its own side, and no other file can state it. A filename grep cannot tell either apart from a real citation, which is why they are enumerated here rather than being silently exempt.

**Two moves a reader must not make** on any entry above:

- **Do not inline a copy.** That creates a second owner of the contract — the exact failure this restructure exists to prevent.
- **Do not delete the pointer.** The park/resume contract and the clean-tree invariant both depend on it resolving — for a reader of the instruction set, which is where both are stated; the watcher itself resolves no anchor here (see class (i-b)).

Relocating class (i) to a family-neutral core is the **follow-up**: it cannot be a pure repoint, because the `Override 2(a)` label has to be replaced at every citing site with something a mode-free core can carry. Class (i-b)'s anchors need no such rewrite and can move on their own, ahead of them — once each repoint set has been re-derived by grep rather than read off any list — with their heading text carried across byte-identical. Neither move is this restructure's work. The classes above enumerate the **fork→fork** citations this instruction set preserves — that enumeration is closed, and it is what the Must Fix below grades against. **No list of the non-fork citers exists or can be closed** — shared instruction modules and files outside the instruction set resolve these anchors too — so re-derive that set with a case-insensitive sweep before renaming, relocating or dissolving an anchor: `git grep -in "clarification channel"`, `git grep -in "override 2"`, `git grep -Ein "overrides? [34dei]"`, `git grep -in "ask-vs-assume"`, `git grep -in "clean-tree invariant"`. **A fork→fork citation that none of the four classes above covers is a Must Fix** — classify it here, or remove it.

A sweep hit that is a **negation**, or a bare **concept mention** naming neither the file nor the heading, takes no anchor's content and is not a citation — resolve each hit to a pointer before grading it.

---

## Which files use this

The files that declare bindings against this vocabulary:

- `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_core.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_core.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_core.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` — the family-neutral shared implement → [review] → commit loop that families 1 and 3 both cite by reference under rule (5); it declares `<escalate>`, `<per_unit_review>` and `<committer_push>` of its own.

`plan_orchestration_instructions.md` and `user_review_fixes_instructions.md` are **not** cores. They are supervised **item-loop** flows — a different loop entirely (human-gated, one item per session, with a trivial-inline option, no phases, no safety contract, no reviewers), not a mode fork over any of the files above.
