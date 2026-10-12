# Task plan review — iteration 1

All three Must Fix findings from iteration 0 are resolved in the artifact: rows 109–111 exist, D2 is widened, Task 6 keeps the findings-folder lead, Task 7's `**Depends on:**` is updated, and Task 3 pins the `ARCHITECTURE.md` phrase. I re-ran D1, D2 and D4 verbatim against `fa8867c9`. Every heading, file and path they print has a row. I re-walked D3 step by step: the three definitions at `fa8867c9`, split per its traversal, every piece over 50 characters plus every paragraph-opening bold lead, matched verbatim against the other 20 `plugin/agents/*.md`. That walk reaches one cross-family site with no row.

## Must Fix

1. **Scope register and Task 6: the `layer-reviewer` no-fixes bold lead is a cross-family copy, but it has no D3 row and Task 6 does not pin it** — story index (`chore_thin_prose_family_unit_loop_story_plan.md`) → `## Scope register` and `## Context`, plus `task_6_plan.md` and `task_13_plan.md`.
   D3's decision rule makes any piece found verbatim in an agent outside the family a `no-change` site. The bold lead `**You report findings. You do not implement fixes.**` opens `plugin/agents/layer-reviewer.md`'s intro paragraph. Two other agents open their own intro paragraph with the same words: `branch-reviewer` and `skeptic-reviewer`. To check, run `git grep -l -F -e '**You report findings. You do not implement fixes.**' fa8867c9 -- plugin/agents`, which prints all three files.
   No row covers this lead. The only row is row 18, a D1 row that marks the whole paragraph `change` for Task 6. Task 6 owns "the paragraph opening `**You report findings. You do not implement fixes.**`", and its `**Work:**` bullet says only "Keep the rule and its scope". The lead is missing from its **Cross-family sentences that stay byte-for-byte** list and from its verification's file-set check. Task 6 may therefore reword the lead in `layer-reviewer` alone, which forks a block the base session made identical. That is the second top risk the Context names.
   **Fix:**
   - In the story index's `## Scope register`, add one row: `plugin/agents/layer-reviewer.md` → intro → bold lead `**You report findings. You do not implement fixes.**` | — | D3 | `no-change` | cross-family copy (`branch-reviewer`, `skeptic-reviewer`). Task 6 may thin only the paragraph's own remainder.
   - Add the lead to the Context's **Three things every task keeps byte-for-byte**, item (2).
   - In `task_6_plan.md`, add the lead to **Cross-family sentences that stay byte-for-byte**. State in the **No-fixes paragraph and preamble** bullet that the lead stays byte-for-byte. Add `**You report findings. You do not implement fixes.**` to the verification's file-set comparison against `fa8867c9`.
   - In `task_13_plan.md`, add the same string to the cross-family sweep list.

## Should Fix

1. **Story index, `## Scope register` rows 90 and 92: wrong reason (re-raised from iteration 0, not addressed and not recorded as rejected).** Both rows call their site a "family-only copy". D3 finds both bold leads in agents outside the family:
   - `**Stop condition — a missing value, never a missing key spelling.**` is also in `conventions-reviewer` and `conventions-writer`.
   - `**No substitution of the names themselves**` is also in `docs-reviewer` (`git grep -l -F '**No substitution of the names themselves**' fa8867c9 -- plugin/agents`).

   Task 1's replacement text keeps both leads, so nothing breaks. Still, the reasons should say each lead is a cross-family copy kept byte-for-byte. Also add both leads to Task 1's cross-family file-set verification, which today checks only `**A cited path you cannot read is a finding, not a fallback.**`.

2. **Per-task verification commands compare `git grep -l … fa8867c9 -- …` output with working-tree output** (Tasks 1, 2, 6, 7, 8 and 13). Against a commit, `git grep -l` prefixes every path with `fa8867c9:`, so the two lists never match as printed text. Say once, in each such bullet, to compare the paths with the `fa8867c9:` prefix removed. This stops an implementer from reporting a false mismatch.
