# Task plan review — iteration 0

## Must Fix

1. **Scope register: D3 reaches cross-family sites that have no row** — story index (`chore_thin_prose_family_unit_loop_story_plan.md`) → `## Scope register`.
   I re-walked D3 as written: each of the three definitions at `fa8867c9`, split at line ends, at `. ` followed by a capital, `*`, a backtick or `(`, and at ` | `; every piece over 50 characters plus every opening bold lead; matched verbatim against every other `plugin/agents/*.md` at `fa8867c9`. Under the entry's own decision rule, a piece found outside the family is a `no-change` site. Two sites it reaches have no row:
   - `plugin/agents/layer-reviewer.md` → `## Invocation contract` → the bold lead `**You create `<findings_folder>` yourself, and only when you have findings to write.**`. Six agents outside the family carry it: `architecture-reviewer`, `business-parity-reviewer`, `review-plan-reviewer`, `skeptic-reviewer`, `task-plan-reviewer` and `ui-tests-plan-reviewer`. Check with `git grep -l -F -e 'yourself, and only when you have findings to write.**' fa8867c9 -- plugin/agents`.
   - `plugin/agents/layer-reviewer.md` → `## Process` step 4 → the bold lead `**Cross-check business logic against `<reference_impl>`**`. `branch-reviewer` also carries it.
   **Fix:** In the story index's `## Scope register`, add one row per site above. Each is `D3` / `no-change`, with the reason "cross-family copy", naming the carrying agents. Add both bold leads to the Context's list of things every task keeps byte-for-byte, and to Task 13's cross-family sweep list.

2. **Task 6 deletes a cross-family block and does not pin a second one** — `task_6_plan.md` (and the follow-on sentence in `task_7_plan.md`).
   The story index's `## Context` → **Three things every task keeps byte-for-byte**, item (2), keeps every sentence shared with an agent outside the family. Task 6's `## Invocation contract` Work bullet breaks that rule: "Delete the paragraph opening `**You create `<findings_folder>` yourself`". That bold lead is carried word for word by six other reviewers (see finding 1), so deleting it in `layer-reviewer` alone forks a block the base session made identical. Separately, Task 6's `## Process` steps 1–4 bullet rewrites step 4 without saying to keep its bold lead `**Cross-check business logic against `<reference_impl>`**`, which `branch-reviewer` carries.
   **Fix:** In `task_6_plan.md`, replace the delete instruction:
   - Keep the bold lead `**You create `<findings_folder>` yourself, and only when you have findings to write.**` byte-for-byte.
   - You may thin only the paragraph's own remainder, and the rule that branch 1 touches no disk must survive.
   - Add both bold leads to the file's **Cross-family sentences that stay byte-for-byte** list and to its verification's file-set check.
   
   In `task_7_plan.md`, change the `**Depends on:**` sentence ("which deleted the `## Invocation contract` copy of the `mkdir -p` rule so that `## Output contract` is its one home") to match the new Task 6.

3. **Scope register: D2 misses an inbound citer** — story index (`chore_thin_prose_family_unit_loop_story_plan.md`) → `## Scope register` entry D2, plus `task_3_plan.md`.
   D2's pathspec (`plugin cli/src cli/templates scripts docs .claude/context`) leaves out the repository root. Searching the whole tree finds a durable root document that D2 misses. `ARCHITECTURE.md` (item 9, "Load an adopter's root context document") quotes `plugin/agents/layer-implementer.md` word for word: *"the adopter's auto-loaded root instruction file and conventions documents"*. That phrase is in `## Minimal prose — every line carries a rule`, which Task 3 rewrites. Task 3 keeps the durable-file list only "in effect", so the quote can stop resolving. Corrected D2 entry, strictly wider than the current one (it reaches the current 31 files plus `ARCHITECTURE.md`):
   `git grep -l -F -e 'layer-implementer.md' -e 'layer-reviewer.md' -e 'committer.md' fa8867c9 -- ':!plugin/agents/layer-implementer.md' ':!plugin/agents/layer-reviewer.md' ':!plugin/agents/committer.md' ':!docs/work-report-research' ':!harness-runs' ':!examples'`
   **Fix:**
   - Replace D2's entry text in the story index with the command above.
   - Add a row for `ARCHITECTURE.md`: `D2` / `no-change`, reason "quotes `layer-implementer` → `## Minimal prose`; Task 3 keeps the quoted phrase byte-for-byte".
   - In `task_3_plan.md`, add `the adopter's auto-loaded root instruction file and conventions documents` to the things kept byte-for-byte. Add a verification step: `git grep -n -F -e '<phrase>' -- plugin/agents/layer-implementer.md ARCHITECTURE.md` prints a line in each file.

## Should Fix

1. **Story index, `## Scope register` rows 90 and 92: wrong reason.** They call the `<layer_names>` row and the `**Stop condition — a missing value, never a missing key spelling.**` paragraph a "family-only copy". D3 finds the Stop-condition bold lead in `conventions-writer` and `conventions-reviewer`. It also finds `**No substitution of the names themselves**` in another agent. Task 1 keeps both leads, so nothing breaks, but the reasons should say the lead is a cross-family copy kept byte-for-byte. Add the Stop-condition lead to Task 1's cross-family file-set verification.
