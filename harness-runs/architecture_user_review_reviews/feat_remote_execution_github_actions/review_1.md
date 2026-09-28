# Architecture review — iteration 1

Both iteration-0 Must Fix items are resolved in `finding_4.md`. The Done-summary arm now lives in an override in each autonomous fork, and the cores carry only mode-free pointers (route (b)). The `## Run mode` block's shape is amended in `### 1.3 Templates` before `### 1.4 Creation`, and every `grep -rn "## Run mode" plugin` hit is accounted for. The re-run grep returns the same ten files the plan lists. All three iteration-0 Should Fix items are also addressed:

- Name owners are decided in `finding_2.md` and `finding_3.md`.
- The `harness-run-lib.sh` schema comment is added to `finding_3.md`.
- The user-review engine gets its own Override K.

One placement gap remains.

## Must Fix

1. **Override K leaves each autonomous fork's own statement of what it does not redefine false.** Offending file: `finding_4.md`, in the Fix step "The Done-summary arm — an override in each autonomous fork." Rule: `.claude/context/plugin.md` → `## What accompanies a new unit of each kind`, "A mode fork" row ("its own statement of what it does **not** redefine (`## What this fork does NOT redefine` …; `## What this file does NOT redefine` …)"). Also `.claude/context/conventions.md` → `## Shared code, and where it lives` ("a **thin fork** overrides only what the mode changes … a mode difference is visible as a fork").

   The plan adds `## Override K` to both autonomous forks. Each Override K replaces the core's `### D.2` QA bullet. The plan amends only each fork's opening statement. Each fork also carries a second scope statement that still says D runs unchanged:

   - `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `## What this file does NOT redefine` says "Phases A, A1.5, A2, B, C, C2, E, D bodies — run verbatim by reference".
   - `plugin/instructions/user_review_fixes_instructions_autonomous.md` → `## What this file does NOT redefine` says "Phases A, QA (…), and D bodies — run verbatim by reference".

   Neither bullet carries an "except Override K" clause. Other bullets in the same list do carry such clauses, for example "unchanged, **except** Override G folds a `<state_dir>/PAUSE` check in …" and "**except** Override I's narrow, Phase-D-only read exception …". After the change, each fork would state in its own required scope section that D.2 runs verbatim, while its Override K replaces a D.2 bullet. The fork would then misstate which file owns that bullet's wording.

   The `## Per-run statistics / Done summary` sections of both forks make the same claim:

   - `user_review_fixes_instructions_autonomous.md`: "the Done summary remain **purely per-worktree**, unchanged from the core's Phase D".
   - `plan_orchestration_instructions_autonomous.md` → `## Per-run statistics / Done summary across parallel runs`: "exactly as the core's Phase D does, with no change".

   **Fix:** In `finding_4.md`, extend the Override K sub-step for each fork so it also amends that fork's `## What this file does NOT redefine` bullet for the D body. Add an explicit exception in the list's existing style: "— run verbatim by reference, **except** Override K replaces `### D.2`'s QA bullet when the recorded `## Run mode` block carries the remote-job skip (autonomous fork only)". Add the same file anchors to the finding's `**Files:**` list. Also add a sub-step that re-reads each fork's `## Per-run statistics / Done summary` section. For each sentence there that says the Done summary is unchanged from the core, either amend it to name the Override K exception or record in the finding why it needs no change. Each such sentence is a scope claim the override would falsify.

## Should Fix

_None._

## Nice to Have

_None._
