# Task plan review — iteration 1

All four Must Fix items from `review_0.md` are resolved:
- Register rows 68–74 were added, and row 73 belongs to Task 11.
- Derivation entry E was added. I re-ran it verbatim, and every hit is one of rows 6, 7, 35, 37, 38, 39, 45, 62, 63, 66, 72, 75, 76 and 77.
- Task 5 now compares with `cmp`.
- Task 10 sets the sandbox row to `In progress` and keeps index entry 37.

I also re-walked entries A–D. Every site they reach is a row. Every verdict I checked against `docs/sandbox-verification.md` matches what the plans state. That covers CS2, CS6, CS6 (runner), RG1–RG3 and their Linux rows, HP1 and HP1 (Linux), N1, N2 and their Linux rows, SR1, SR2 and their Linux rows, IS1–IS4, FR1–FR7, JS1, JS3, JS3N, JS4, SB2, SB3, SB4, RJ2 and RJ3.

## Must Fix

1. **Index structure: two Should Fix findings from the last round were neither applied nor recorded under `## Rejected findings`.** This applies to the story index (`chore_sandbox_honesty_paragraphs_story_plan.md`), `task_2_plan.md` and `task_6_plan.md`.
   `harness-runs/lessons.md` → `## Unattended control loops` says: *"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay."*
   `review_0.md` raised two Should Fix findings. The revised plan leaves both unchanged, and the story index has no `## Rejected findings` section:
   - **Should Fix 1, the guard's file name in the shipped template.** `task_2_plan.md` → **Work**, the residual-line bullet, still writes *"held by the watcher's launch check, the wrappers' clone check and the plugin's `git-trust-file-guard.sh` rather than by an entry here"* into `cli/templates/claude/settings.autonomous.json`'s `_README`. `task_3_plan.md` deliberately keeps that file name out of the generated line that ends up in the same rendered `_README`. The two adjacent lines therefore treat the same guard differently, and neither file says why.
   - **Should Fix 2, a too-narrow lead grep.** `task_6_plan.md` → **Verification**, fourth bullet, still reads the cited leads off `git grep -n -o -E "cli\.md\)? §6 → \*\*[^*]+\*\*" -- docs/sandbox-record.md`. That pattern misses leads the record cites in other forms:
     - `docs/sandbox-record.md` §7 cites *"(**Four scripts run outside the sandbox, each in one spelling.**)"*, *"(**Everything that runs outside the sandbox is write-protected on both sides**)"* and *"(**A remote job passes the base profile, checked…**)"*.
     - Residual 9 cites *"§6 → **The check has a clone arm**, in the paragraph **The excluded rule's `:*` accepts any argument…**"*, and the second lead in it does not follow `§6 → `.
   **Fix:** For each of the two findings, either apply it or record it with its reason. Record it in a trailing `## Rejected findings` section, placed last in the story index.
   - To apply Should Fix 1, change the residual-line wording in `task_2_plan.md` → **Work** to *"a harness plugin guard hook (residual 12)"*, matching Task 3. Alternatively, keep the file name and give the reason the template may name it while the generated line may not. Note that the `cli/src` naming rule in `.claude/context/conventions.md` → `## The layers` does not bind `cli/templates/`, so recording that reason is a valid alternative.
   - To apply Should Fix 2, replace the grep in `task_6_plan.md` → **Verification**, fourth bullet. Either list the `docs/cli.md` §6 leads the record cites by name, all of which Task 6 keeps byte-identical, or read every `\*\*[^*]+\*\*` on a `docs/sandbox-record.md` line that names `cli.md`.

## Should Fix

1. **Task 7's sibling-trio replacement cites AP9 for a bullet AP9 does not measure.** This is in `task_7_plan.md` → **Work**, the sibling-trio bullet.
   - The `docs/watcher.md` bullet being rewritten is about re-rooting the trio at **other** sibling run copies.
   - Residual 12's sibling measurement is AP6 (*"A sibling's absent trio paths, by contrast, stay absent during a sandboxed call"*).
   - AP9 measures the guard refusing a `Write` to the run copy's **own** absent `commondir`.

   The replacement as planned (*"AP1–AP6 **pass** … AP8 … and AP9 **pass**"*) lists AP9 as evidence for the siblings' trio, where it measures something else. It also drops the control, AP7, which the old sentence named.
   **Fix:** Name AP6 as the sibling row. Cite AP9 only for what it measures, or drop it from this bullet. Keep AP7 as **recorded** (not graded), in residual 12's own words.

## Nice to Have

1. **The story index's "measurements still owed" list mixes the §7 bullet with residual 3.** This is in the story index → `## Context` → the bullet **What the record says the sandbox contains**. It says the owed measurements are *"§7's roadmap item 21 bullets (no WSL2 row, MC1 never run, the interactive-test phase unmeasured, residual 3)"*. `docs/sandbox-record.md` §7's item-21 bullet names hooks and the other outside-the-sandbox processes, MC1, N5's WSL2 row and the launcher's assignment-prefix spelling. The interactive-test phase is residual 3, not that bullet. Attribute each item to its own source.
2. Derivation entry C's `owed` still matches every "allowed", as `review_0.md`'s Nice to Have noted. `\bowed\b` would cut the hit list down to the sentences the decision rule reads.
