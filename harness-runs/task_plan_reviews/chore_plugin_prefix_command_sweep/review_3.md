# Task plan review — iteration 3

Both Must Fix findings from iteration 2 are fixed:
- `task_11_plan.md` item **(e)** and the story index `## Context` → **The drift check.** now carry the widened pattern `(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|harness-analyze)([^A-Za-z0-9_./-]|\.([^A-Za-z0-9_/-]|$)|$)`.
- `task_13_plan.md` restates that pattern and adds the `Then run /branch-status.` plant, with a matching Verification bullet.

I re-ran the scope-register derivations. Entries 1 and 2 were re-run exactly as written, and entry 3 was walked again over `harness-runs/lessons.md`. Every file and ledger rule they reach is a row. I also ran the gate's own scan, `git grep --untracked -nE <widened pattern>` over the planned pathspec exclusions. Every file it reaches is a register row with a `change` owner. The widened pattern finds no sentence-final bare spelling anywhere in the tree today.

## Must Fix

1. **The worked example that the gate-6d contract paragraph is told to quote is itself a bare spelling that no exemption class covers** — `task_11_plan.md` (item **(e)** and its Verification) and `task_13_plan.md` (the exemption-table step).
   Task 11 item **(e)** says: *"The paragraph says in one sentence that a sentence-final spelling such as `Then run /branch-status.` is caught and a `.md` path such as `commands/branch-start-plan.md` is not."* That sentence goes into `docs/development.md`, and gate 6d scans that file. I ran the planned pattern on that sentence text, `` a sentence-final spelling such as `Then run /branch-status.` is caught ``, with `grep -cE`. It printed `1`, so the line matches. (The regex quoted in the same paragraph does not match itself: `grep -cE` prints `0` on it.)
   Three things then break:
   - Task 11's own Verification fails. It says the pattern *"prints only the two gate-8 block lines and the lines of the closed §6 paragraph that quote a bare spelling as a measured subject. Any other line is a missed site"*, and the contract-paragraph line is neither.
   - Task 13's exemption step allows only classes (a) gate-8, (b) measured subject and (c) watcher strings when the route is bare. It says *"Anything that fits none of them goes into the blocker"*. So Task 13 cannot exempt that line. It must return `blocker:`, and the branch stops at its last task.
   - Task 11's carve-out list **(d)** does not name this line either, so the contract would contradict the table.

   **Fix:** Pick one and apply it the same way in both files:
   - (preferred) In `task_11_plan.md` item **(e)**, have the sentence describe the example in words without writing a bare spelling. For example: *"a spelling followed directly by a sentence-ending period is caught, and a `.md` path such as `commands/branch-start-plan.md` is not"*. Or use a qualified illustration that shows the period rule without matching. Add one Verification bullet to `task_11_plan.md`: the pattern grep over `docs/development.md` prints no line from the gate-6d contract paragraph. Keep the `Then run /branch-status.` plant in `task_13_plan.md`, which is correct because it is reverted.
   - or add the contract paragraph's example line as a named exemption class. That means a new class in `task_13_plan.md`'s table step (a `contains` entry unique to that line), an entry in Task 11's carve-out list **(d)**, and that line added to Task 11's Verification list of expected pattern hits.

## Should Fix

1. **Scope register row 89 still limits the lessons-ledger rule to `README.md` without saying why.** This is in the story index `## Scope register` row 89, and it carries over from iterations 0–2. It is neither addressed nor recorded under a `## Rejected findings` section. Several tasks rewrite adopter-facing lines that keep a command inline:
   - Task 6: the `**Usage:**` lines
   - Task 10: `docs/cli.md`'s step-2 paragraph with `/harness-analyze <target>`
   - Task 12: *"`/branch-prompt` itself"*

   Either the reason cell says why those lines describe syntax or name a route rather than tell a reader what to run, or the owning tasks fence the lines the rule covers.
2. **Task 12's `ARCHITECTURE.md` bullet still does not mention that file's sentence-marker rule** (`task_12_plan.md`). This carries over from iterations 1–2. Every replacement sentence in those two paragraphs needs a `**[shipped]**` or `**[designed]**` marker.
3. **Task 1's first Verification bullet still claims `cli/test/outer-loop-scripts.test.mjs` compares the written watcher against the template byte for byte** (`task_1_plan.md`). This carries over from iterations 1–2. That suite's byte assertion is on `LIB_TEMPLATE` only. Drop the rationale, or keep `bash scripts/test.sh` as the gate without that claim.
4. **Task 1's decision table has no control on the bare leg** (`task_1_plan.md`). This carries over from iteration 2. If the bare leg also shows no `Skill` load, the probe has not reproduced the working route. The comment should then say the result is inconclusive and that `bare` is kept on the completed-runs evidence only.
5. **The per-task site-check greps in Tasks 5, 6, 7, 8, 9, 10 and 12 still use the narrower pattern** (`…([^A-Za-z0-9_./-]|$)`). Tasks 11 and 13 use the widened, period-aware one. No sentence-final site exists today, so nothing is missed now. But a task's own check is weaker than the gate that grades the branch at Task 13, where a miss turns into a blocker. Use the widened pattern in those Verification bullets.

## Nice to Have

- Task 2's headless-probe bullet could repeat Task 1's *"Write no machine path: gate 6a greps for `$HOME`"* caution. A `stream-json` `system`/`init` event carries the absolute `cwd`. This carries over from iteration 2.
