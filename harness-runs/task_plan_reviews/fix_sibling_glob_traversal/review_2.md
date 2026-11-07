# Task plan review — iteration 2

The round-1 Must Fix is resolved in all three of its parts:
- `task_2_plan.md`'s probe example is now `<file>.mjs` (or `.py`).
- Entry A no longer carries the two dead pathspecs, and a sentence now says entry B covers those files.
- Register rows 26 and 27 now record the two §2.4 bookkeeping passages, owned by Task 7.

I re-ran entry A verbatim. Every line it prints maps to a register row (rows 1–8 and 10–25). I re-walked entry B over `harness-runs/lessons.md` and `harness-runs/improvement_suggestions.md`, and it reached no entry. The index↔file correspondence is 1:1 across seven entries and seven files. The layer tags, the bottom-up order (`cli` → `plugin` → `general`), the points tags and the Work-bullet counts are all within budget. No `**Verification:**` bullet asks for a forbidden test run.

## Must Fix

1. **Scope register: no derivation entry reaches a site that describes an arm Task 2 rewrites**: `fix_sibling_glob_traversal_story_plan.md` → `## Scope register`.
   The site is `docs/guard-verification.md` → §2.1 `#### Residuals recorded, not closed`, third bullet. It reads: *"fed a whole two-line command directly, `hc_matches_any_pattern` **matches** a `cd <repo> *` arm across the newline, so the line-at-a-time read in the callers is what confines the arms"*.
   - The bullet describes a property of a path-anchored arm and of `hc_matches_any_pattern`. Those are the subjects entry B's own decision rule names.
   - It names by its spelling the `cd <repo> *` arm, which `task_2_plan.md` → **The `cd <D>` arms.** turns into `cd <D> *[<>]*` with three operand vetoes. Under that change, a newline in the tail falls outside the operand veto's class.
   - Register row 13 (inventory row `g`, *"It is what confines the `cd` arms to one line"*, `no-change`, *"The veto lines are judged inside the same one-line read"*) rests on this exact measurement, which inventory row `g` cites as *"§2.1's residual"*.

   Entry A does not reach the bullet. None of its alternatives match the text, because the bullet spells the arm as `` a `cd <repo> *` arm ``, not as `` `cd` arm ``. Entry B is scoped to `harness-runs/`. So the site has no row, and whether its claim still holds after Task 2 is recorded nowhere.

   Sites the corrected entry newly reaches:
   - `docs/guard-verification.md` → §2.1 `#### Residuals recorded, not closed`, the `hc_clean_piece` multi-line bullet, *"`hc_matches_any_pattern` **matches** a `cd <repo> *` arm across the newline"*.

   The corrected entry also reaches §2.1 call-order row 6 (`` `is_safe` → `hc_matches_any_pattern` ``). That site is already register row 4.

   **Fix:** In the story index, replace derivation entry A with this strictly wider command. It adds the alternatives `hc_matches_any_pattern` and `` `cd <repo> \*` arm `` and keeps every existing alternative and pathspec:
   ```sh
   git grep -n -o -E '.{0,100}(path-anchored|hc_path_anchored_patterns|hc_matches_any_pattern|cd <work_root>/<project_name>-|`cd` arm|`cd <repo> \*` arm|cd <link>|sibling-worktree arm|two rewrite helpers|exact or space-suffixed).{0,100}' -- 'docs/**/*.md' 'plugin/**/*.md' '*.md' ':!harness-runs/**'
   ```
   Add the site above as a register row, with a disposition and an owner.
   - If you choose `change`, add a bullet to `task_7_plan.md` that restates the residual for the vetoed arm, from Task 5's re-drive of §2.1's residual rows (`sgt_redrive_pieces.tsv`). Then add the row to the Task 7-owned list in `task_7_plan.md` → `**Verification:**`.
   - If you choose `no-change`, the reason must say why the measured claim still holds against `cd <D> *[<>]*` and its operand vetoes.
   - Re-check register row 13's reason against whichever disposition you choose.

## Should Fix

None.

## Nice to Have

1. This repeats round 1's Nice to Have 1. Register row 9's Evidence cell still reads *"A, `` `cd` arm `` / arm prose"*, but entry A does not print that line. Like rows 26 and 27, it should say the row was added by hand from Task 7's edit list.
2. This repeats round 0 and round 1. Tasks 4, 5 and 6 target only gitignored files under `harness-runs/scratch/`. One sentence in each could say that the committer's flip-only commit is the task's record.
