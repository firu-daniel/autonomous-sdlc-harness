# Architecture review — iteration 0

## Must Fix

1. **The core reads a fork-supplied "Phase G answer lookup" that no mode-contract binding carries** — `task_2_plan.md` (G.0 definition and "Where this file stops"), `task_3_plan.md` and `task_4_plan.md` (the lookup paragraph each puts in its fork's `<escalate>` subsection), and `fix_run_gates_answered_park_resume_story_plan.md` → `## Scope register` rows 9 and 20. Rules violated: `plugin/instructions/mode_contract.md` → `## (1) No defaults`, `## (3) Additions stay in the fork` and `## (4) Cores are literal-free`, plus `## (5) A core may cite another core` (a citing core declares every binding its cited sections consume). `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule` makes all of these binding on every instruction file.
   Task 2 has the mode-free core consult "the executing fork's Phase G answer lookup", which "the executing fork's `<escalate>` value states". Where a fork states none, "the new arm never fires". That builds a new fork-to-core value without the mechanism the contract provides for one:
   - `mode_contract.md` → `## Binding vocabulary` defines `<escalate>` as the path for **halting** on a blocker ("The flow does not continue"). The plan makes the same value also supply a **resume-time** artifact lookup that G.0 runs on re-entry. That changes what the binding means without amending the vocabulary row that owns it. Row 20 records it as "No binding is minted".
   - Rule (4) says a core that needs a mode-specific literal (here the `<state_dir>/clarifications/<branch>/…` shape, which only the autonomous forks have) "needs a **binding** (rule 3), not an exception". Rule (3) names that exact case as the one that justifies minting a binding.
   - "A fork that states none leaves the arm inert" is a default the core supplies for an absent value. Rule (1) forbids that for a binding: an unbound binding is a stop condition, and each fork binds every binding its core declares.
   - `user_review_fixes_instructions_core.md` runs Phase G by reference. Under rule (5) it would have to declare whatever value the cited G.0 consumes. Row 9 marks it `no-change`, and that cannot hold once the value is properly declared.

   **Fix:** Mint a binding, for example `<park_answer_lookup>`, and wire it through the mechanism:
   - (a) Add its row to `plugin/instructions/mode_contract.md` → `## Binding vocabulary`, stating that it is the command that finds a Phase G park's question/answer pairs for a given `<test_fix_plan_path>`, or the explicit value `none` for a fork whose `<escalate>` writes no answer file.
   - (b) Declare it in `plan_orchestration_instructions_core.md` → `## Mode contract — bindings this file uses` (used at `### G.0 Resolve the round`), and in `user_review_fixes_instructions_core.md`'s binding table (used by the cited Phase G).
   - (c) Bind it inline in all four forks. The two autonomous forks get the `grep -lF '<test_fix_plan_path>' …` command, byte-identical. `plan_orchestration_instructions_semi_autonomous.md` and `user_review_fixes_instructions_semi_autonomous.md` get `none`. G.0's new arm then reads "when `<park_answer_lookup>` is not `none`" instead of relying on an absent value.
   - (d) Update the Scope register: rows 9 and 20 become `change` rows, add rows for the two semi-autonomous forks and `mode_contract.md` → `## Which files use this` if its roster changes, and give each row one owning task.

   Re-word Tasks 2–4 to name the binding instead of "the lookup the executing fork's `<escalate>` value states". The lookup paragraphs Tasks 3 and 4 add can stay in their `<escalate>` subsections as prose about the park's file, as long as the binding value itself sits in each fork's binding table.

2. **Task 3 adds an unsanctioned fork→fork citation from the planning fork's `Override 2(a)` into the implementation fork's new lookup paragraph** — `task_3_plan.md` → Work bullet "`task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability` case (a)", **The exclusion.** sub-bullet. Rule violated: `plugin/instructions/mode_contract.md` → `### Sanctioned cross-fork anchors` ("that enumeration is closed … **A fork→fork citation that none of the four classes above covers is a Must Fix**"). `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule` restates it ("A fork→fork citation is admissible only under a class … already names; anything else is a Must Fix").
   The planned exclusion cites `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md` → ``### `<escalate>` — the clarification reroute`` → **The Phase G answer lookup.** from a fork (`task_plan_writing_instructions_autonomous.md`), and takes content from it. No class covers that anchor:
   - class (i) lists only the two `## Override 2 — resumability` sections;
   - class (i-b) lists only the clarification channel's file format and the ask-vs-assume policy;
   - class (ii) lists only the clean-tree-invariant section and the reciprocal commit-point/ledger ownership sentences;
   - class (iii) covers readership statements that cite nothing.

   Task 3's own verification sweep ("finds no new fork→fork citation outside class (i-b)") would catch this citation, so as planned the task cannot pass its own check.
   **Fix:** In `task_3_plan.md`, rewrite the exclusion so it names the consumer through the **core**: "the implementation half's `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `### G.0 Resolve the round` consumes it". A fork→core citation is not restricted. Drop the pointer to the fork's **The Phase G answer lookup.** paragraph. Make the same check on the Consume-then-archive bullet edit, which must not cite that paragraph either. Do not add a new class to `mode_contract.md` for it: the anchor is not autonomous-only coordination that no core can state, because G.0 (in the core) is the consumer being named.

## Should Fix

None.

## Nice to Have

None.
