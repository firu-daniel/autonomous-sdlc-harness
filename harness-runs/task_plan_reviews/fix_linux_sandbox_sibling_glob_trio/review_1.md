# Task plan review — iteration 1

Iteration 0's Must Fix is resolved. The readiness order is now library (Task 1), watcher (Task 2), text (Task 3). Task 3's `**Depends on:**` restates `run_profile_glob_drops` and the re-rooting in `run_profile_entries`, and `task_2_plan.md` no longer depends on the text task.

## Must Fix
1. **The "unverified" glob claim survives in `docs/cli.md` §6 and in the template's second `_README` line, because the plan's targets leave both unchanged.** Files: `task_7_plan.md`, `task_3_plan.md` and the story index (`fix_linux_sandbox_sibling_glob_trio_story_plan.md`: `## Scope register` rows 1, 2 and 6, and `**Manual setup required:**`).
   The task prompt's *Also in scope* names *"`docs/cli.md` §6's Linux statements on the same point"*: on Linux a glob `denyWrite` entry is expanded, absent paths included. Two sites still state the opposite, and no task changes either one.
   - **`docs/cli.md` §6.** The paragraph **"Three wrappers run outside the sandbox, each in one spelling."** (in `## 6. The failure modes the permission profile encodes`) says: *"the only spelling the base profile has for every sibling copy is the sibling glob, and how the Linux sandbox treats a `denyWrite` entry containing `*` is unverified."*
     - `task_7_plan.md` → `### Targets` lists only three parts of §6 for `docs/cli.md`: the per-run paragraph, residual 2 and residual 12.
     - Its Verification grep is `may skip (one|them|a .denyWrite.)|is unverified — it may skip`. That pattern does not match this sentence, so the stale claim passes verification.
     - The scope register's command entry reaches `docs/cli.md` (it matches `Linux sandbox treats`), but row 6 lists only those same three parts.
   - **`cli/templates/claude/settings.autonomous.json`.** The `_README` line *"THREE COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING"* says: *"the only spelling a profile has for a sibling run copy is a glob, and how the Linux sandbox treats a `denyWrite` entry carrying one is unverified."*
     - `task_3_plan.md` rewrites the *"TWO RESIDUALS"* line in the same file to the measured AP2/GW1 facts.
     - Its Verification also requires `git diff -U0 -- cli/templates/claude/settings.autonomous.json` to show **exactly one changed line**. So the shipped profile would state the glob treatment as measured in one `_README` line and as unverified in another.
     - The notes-app rendering (`examples/notes-app/.claude/settings.autonomous.json`, the same line) carries the same sentence. The manual re-render covers only two lines.
   **Fix:**
   - **`task_7_plan.md`:**
     - Add `docs/cli.md` → §6 **"Three wrappers run outside the sandbox, each in one spelling."** to `### Targets`.
     - In the `docs/cli.md` §6 Work bullet, replace *"and how the Linux sandbox treats a `denyWrite` entry containing `*` is unverified"* with the measured statement. Use AP2 (2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0) and GW1 (a new file under an existing matched directory was written), and keep the paragraph's conclusion: the run copy's wrapper is sandbox-writable, so only the main checkout's copy is excluded.
     - Widen the Verification grep so it matches `containing .\*. is unverified` across `docs/cli.md`.
     - Stay within the 5-bullet budget, for example by folding this into the existing per-run-paragraph bullet.
   - **`task_3_plan.md`:**
     - Add the *"THREE COMMANDS RUN OUTSIDE THE SANDBOX"* line to `### Targets` and to the `settings.autonomous.json` Work bullet, with the same replacement.
     - Change the Verification to *"exactly two changed lines"*.
     - Extend the `git grep` pattern to `carrying one is unverified`.
   - **Story index:**
     - Widen `## Scope register` row 1's Site to name both `_README` lines, and row 6's Site to name the **Three wrappers** paragraph.
     - Add the *"THREE COMMANDS RUN OUTSIDE THE SANDBOX"* line to row 2 and to the `**Manual setup required:**` notes-app re-render list.

## Should Fix
1. **Re-raised from iteration 0. It is neither resolved nor recorded under `## Rejected findings`.** Two shell comments keep the claim this branch retires, and no task owns either one:
   - `cli/templates/scripts/push-branch.sh`: *"protected only by a globbed `denyWrite`, which is unverified on …"*
   - `scripts/lib/sandbox-probe/legs-glob.sh`: *"it may skip one, or expand it …"*, *"Linux may skip a `*` denyWrite"*

   **Fix:** Take them into a task. The `push-branch.sh` comment is `cli` work, and a re-copy under Task 4 would follow it. The probe library comment is `general` work. Alternatively, record in the story index why they stay.
2. **Re-raised from iteration 0. `task_6_plan.md` → §6's glob point still says *"Replace the point's last two sentences"*.** That also removes *"An exact entry for an absent path is now measured (§0 *The absent-path check (2026-10-29)*, §5 F9)."*, which is still true. **Fix:** Replace only *"That check left the globs out, so it measures nothing about the glob treatment; what the first Linux run recorded for a glob entry is GW1 and GW2 (§8)."*, or state that the exact-entry sentence is kept.
3. **Re-raised from iteration 0. `task_6_plan.md` → Verification, the `grep -n 'AP6'` bullet,** still expects matches in the new row, the lead paragraph and F9's cell, *"and nothing else"*. The same task also edits *The decision rule*, the closing paragraph and §0, and any of these may name AP6. **Fix:** Widen the expected set to every section the task edits, or require those edits not to name AP6.

## Nice to Have
1. **`task_7_plan.md` → `docs/watcher.md` What it adds** (re-raised). After AP2, the first bullet's reason for re-rooting the run copy's own surface by exact path is no longer *"may skip"*. The measured reason is different: GW1 shows that a new file under an existing matched directory is not refused. State that reason, rather than only swapping in the AP2 fact.
2. **Story index → `## Scope register` command entry.** The inline-code span that holds the command also contains a backtick (`` containing `?\* ``), so the rendered command is broken across spans. The raw text still re-runs verbatim. Put the command in a fenced block.
