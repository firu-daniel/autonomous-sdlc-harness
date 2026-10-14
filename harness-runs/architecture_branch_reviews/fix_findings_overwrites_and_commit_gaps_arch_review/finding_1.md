### 1. Remove the unsanctioned fork→fork citation from `Override L`

**Severity:** Must Fix
**Layer:** plugin

**Site.** `plugin/instructions/user_review_fixes_instructions_autonomous.md` → `## Override L — commit the QA.0 UI-test plan augment (autonomous fork only)`, the paragraph after the fenced command. The sentence is:

> The subject is the planning fork's fixed one (`${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 3`), byte-for-byte.

**Problem.** This branch adds a citation from one autonomous fork (`user_review_fixes_instructions_autonomous.md`) to another (`task_plan_writing_instructions_autonomous.md`). The citation takes content from the other fork: the commit subject.

`.claude/context/plugin.md` → `## Cores, forks and the single-owner rule` says: *"A fork→fork citation is admissible only under a class `plugin/instructions/mode_contract.md` → `### Sanctioned cross-fork anchors` already names; anything else is a Must Fix."* That section closes its list: *"A fork→fork citation that none of the four classes above covers is a Must Fix — classify it here, or remove it."*

None of the four classes covers this citation:

- **Class (i) and (i-b)** name only these sections of `task_plan_writing_instructions_autonomous.md`: `## Override 2 — resumability`, `## Clarification channel — file format (canonical, single source of truth)` and `## Ask-vs-assume policy`. `## Override 3` is not among them.
- **Class (ii)** covers the clean-tree commit-point list in `plan_orchestration_instructions_autonomous.md`, plus the *reciprocal* "which fork owns which commit point" sentences. This citation is one-directional, because nothing in `task_plan_writing_instructions_autonomous.md` names `Override L`. It also sources a literal rather than stating ownership.
- **Class (iii)** covers readership statements that cite nothing. This sentence does cite something.

The citation also names the heading in a shortened form, `## Override 3`. The real heading is `## Override 3 — commit the UI-test plan after it converges`, and `.claude/context/plugin.md` → `## Citation` treats a cited heading as a wire carried byte-identical.

**Fix.** Remove the pointer rather than adding a fifth sanctioned entry. The subject literal is already spelled in full in `Override L`'s own fenced command, so the citation adds nothing a reader needs. Replace the sentence with a bare concept mention that names neither the file nor the heading. `mode_contract.md` says such a mention *"takes no anchor's content and is not a citation"*. For example:

> The subject is the same fixed one the planning flow's UI-test plan commit uses, byte-for-byte: `chore: Add UI-test plan for <branch>`.

Leave the rest of the paragraph unchanged, including its in-file citations of `## Override D` and `## Override E`.

**Check it landed.** `git grep -n 'task_plan_writing_instructions_autonomous.md' -- plugin/instructions/user_review_fixes_instructions_autonomous.md` should no longer return the `## Override L` paragraph. The remaining hits should be only the sanctioned class (i) / (i-b) citations that were there before this branch.
