# Architecture review — iteration 4

All three of iteration 3's Should Fix items are now applied:
- **Task 10's citer roster.** `task_13_plan.md` → Override 2 now has the fork cite `${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md` → `## Edit and resume`, and its Verification greps for that pointer. Every member of Task 10's `## Who may cite this` roster now gets a pointer from its owning task:
  - Tasks 11, 12, 13, 14 and 15;
  - Task 18 for the root `README.md`.
- **Task 10's own narration line.** The `[screen · <path>] → prompt-injection-reviewer` print bullet is gone from `## The steps` step 3.
- **Task 8's `## Resolved values`.** It now declares `<scripts_dir>` (config value, `scriptsDir`), the token its `foreign-execution` row uses.

Every target sits inside the `layers[].path` of its tagged layer:
- Tasks 1–7, 9 and 19 are under `cli/`.
- Tasks 8, 10–15 and 20 are under `plugin/`.
- Tasks 16–18 touch `scripts/`, `harness-runs/`, `evals/`, `README.md` and `docs/`. All of these are in the `general` catch-all.

No task makes either shipped half execute the other at run time (`.claude/context/conventions.md` → `## The layers`). The `cli/test` reads of `plugin/` files are contract tests of the kind that already exist, not run-time coupling.

The rest of the plan also passes:
- Contract-before-consumer order holds (`### The order files are created, so a half-built feature is still coherent`).
- The new shared instruction module carries its own roster (`.claude/context/plugin.md` → `## What accompanies a new unit of each kind`).
- No plan file asks for a test run that `unit_loop_core.md` → `## The test-run rule` forbids.
- No plan file fails the laundering check.

## Must Fix

None.

## Should Fix

1. **The story index points at a `## Corpus staleness` section it does not contain.** File: `feat_prompt_injection_reviewer_story_plan.md`, scope register row 44. Sources:
   - `.claude/context/conventions.md` → `## Commit-message policy` → **Fixed-form subjects** and **Changing any fixed subject is a multi-file edit.**;
   - `.claude/context/plugin.md` → `## The commit-message policy`.

   Row 44 notes that this branch adds the fixed-form subject `chore: Commit re-screened input edit for <branch>`, used in Task 10 step 4 and in Task 11's entry 15. It also notes that the conventions document's list of fixed subjects does not include it. It then says this is "Raised as a `stale-rule` entry in `## Corpus staleness`". The index has no such section, so the staleness is never raised anywhere, and the list of the flow's fixed subjects goes stale with nothing recording it.

   **Fix:** Add the `## Corpus staleness` section to the story index with a `stale-rule` entry for `.claude/context/conventions.md` → `## Commit-message policy` → **Fixed-form subjects**, naming the missing subject and the commit point that owns it (`plugin/instructions/prompt_injection_screen.md` → `## The steps` step 4). Alternatively, record this finding under `## Rejected findings` with a reason.

## Nice to Have

None.
