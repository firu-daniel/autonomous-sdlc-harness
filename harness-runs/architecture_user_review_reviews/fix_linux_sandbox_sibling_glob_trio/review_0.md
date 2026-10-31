# Architecture review — iteration 0

Reviewed: `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_fix_plan.md` and `finding_1.md` through `finding_6.md`, against `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md`, `harness-runs/lessons.md` and `plugin/instructions/unit_loop_core.md` → `## The test-run rule`.

The layer placement holds throughout:
- Template edits sit under `cli/templates/`, and each byte-for-byte copy lands on its self-adopted twin under `scripts/`.
- `cli/src/generators/writeProtection.ts` and `cli/src/doctor/checks.ts` stay in `cli`.
- The records under `docs/` and the hand-run `scripts/sandbox-absent-path-check.sh` stay in `general`.
- The trust rule keeps a single owner, `hr_clone_target_check_var`.
- The `_(layer: …)_` tags match each finding's fix-target paths.
- No plan asks for a test run the rule forbids.

The four Must Fix items below are all in the accompanying set. Two findings change the adopter-facing strings of a generator and of a `doctor` check. Each of those strings is already pinned by a fixture case, but neither finding updates that case. Each finding also limits the implementer to other test files, so nothing pins the changed claim, and the existing assertion may break with no file the implementer is allowed to fix.

## Must Fix

1. **Finding 1 changes the generator's `_README` sentence but plans no case in `cli/test/profile.test.mjs`.** Offending file: `finding_1.md`. Rule: `.claude/context/cli.md` → `## What "done" means here`: *"A change to a command or a generator lands with a case that drives the compiled CLI against a throwaway fixture repository"*. Also `.claude/context/conventions.md` → `## The testing bar`: *"Assert against the contract stated literally"*.
   - **The change.** Fix step 6 rewrites `applyWriteProtection`'s `_README` sentence in `cli/src/generators/writeProtection.ts`, the one carrying "their \`Edit\` rules stay". The new sentence must say three things:
     - On Linux the `Edit` deny rules are enforced inside the sandbox.
     - The per-run copy also drops the run copy's own trio `Edit` rules, exact and glob.
     - Each other sibling keeps them by exact path.
   - **The existing case.** `cli/test/profile.test.mjs` already pins that sentence. Its write-protection `_README` assertion matches the substring "leaves the run copy's ${omitted} out of \`denyWrite\`, also leaves the base's sibling-glob entries for those same paths out of it, and adds an exact entry for each of them in every other sibling run copy whose .git is a directory".
   - **The gap.** Fix step 8 says "Edit only these test files" and lists `watcher-run-profile.test.mjs` and `watcher-placeholder-host.test.mjs` only. Nothing pins the generator's new claims, and if the rewrite touches the pinned substring, the implementer is barred from fixing the case that breaks.

   **Fix:** In `finding_1.md` step 8, add `cli/test/profile.test.mjs` to the test files this finding edits.
   - Extend the write-protection `_README` assertion beside the existing sibling-glob check. Make it assert the new claims literally: Linux `Edit` enforcement, the run copy's own trio `Edit` rules dropped (exact and glob), and the exact-path `Edit` rules kept at each other sibling.
   - Keep or adjust the existing substring so it matches the rewritten sentence.
   - Add the file to the "Run each edited file alone" line.

2. **Finding 1 changes `doctor`'s `profile-write-protection` pass message but plans no case in `cli/test/doctor-profile-sandbox.test.mjs`.** Offending file: `finding_1.md`. Rule: `.claude/context/cli.md` → `## What "done" means here` (a change to a command lands with a fixture case driving the compiled CLI). Also `.claude/context/conventions.md` → `## The testing bar`.
   - **The change.** Fix step 6 rewrites the pass message in `cli/src/doctor/checks.ts` to state the Linux `Edit`-rule enforcement and the dropped run-copy trio `Edit` rules.
   - **The existing case.** `cli/test/doctor-profile-sandbox.test.mjs` → `'(a) passes on a freshly generated profile, stating the Linux residual'` pins that message's claims by substring. One of them is "leaves a run copy's ${omitted.join(', ')} out of sandbox.filesystem.denyWrite, also drops the base's sibling-glob entries for those paths and re-roots them by exact path at every other sibling run copy".
   - **The gap.** The finding's test list leaves this file out and forbids editing any other. The new claim goes unpinned, and a rewording that touches the asserted substring breaks a case the implementer may not edit.

   **Fix:** In `finding_1.md` step 8, add `cli/test/doctor-profile-sandbox.test.mjs` to the test files this finding edits.
   - Extend case `(a)` to assert the new claims: `Edit` deny rules enforced inside the sandbox on Linux, the run copy's own trio `Edit` rules left out of the per-run copy, and the exact-path `Edit` rules kept at each other sibling.
   - Keep the existing assertions matching the rewritten message.
   - Add the file to the "Run each edited file alone" line.

3. **Finding 3 rewrites the generator's "refuses a run copy carrying one" clause but plans no case in `cli/test/profile.test.mjs`.** Offending file: `finding_3.md`. Rule: `.claude/context/cli.md` → `## What "done" means here`. Also `.claude/context/conventions.md` → `## The testing bar`.
   - **The change.** Fix step 3 changes the `_README` sentence in `cli/src/generators/writeProtection.ts`. Today it says the watcher "refuses to launch or resume a run copy carrying one". The new wording says the watcher refuses a run copy carrying a `commondir`, or a `config.worktree` or `http-alternates` that is not an empty regular file. That changes the adopter-facing statement of what the trust check accepts.
   - **The gap.** Fix step 4 says "Edit or create only the files you run" and names `wrapper-clone-arm.test.mjs` and `watcher-placeholder-host.test.mjs` only. Nothing pins the generator's new statement of the accepted shape.

   **Fix:** In `finding_3.md` step 4, add `cli/test/profile.test.mjs` to the test files this finding edits.
   - Assert that the write-protection `_README` line states the new rule literally: a run copy carrying a `commondir` is refused, and so is one carrying a `config.worktree` or `http-alternates` that is not an empty regular file.
   - Add the file to the "Run each edited file alone" line.

4. **Finding 3 rewrites `doctor`'s "refuses a run copy carrying one" clause but plans no case in `cli/test/doctor-profile-sandbox.test.mjs`.** Offending file: `finding_3.md`. Rule: `.claude/context/cli.md` → `## What "done" means here`. Also `.claude/context/conventions.md` → `## The testing bar`.
   - **The change.** Fix step 3 changes the final clause of the `profile-write-protection` pass message in `cli/src/doctor/checks.ts`, "and refuses a run copy carrying one", to the new accepted-shape wording.
   - **The gap.** Case `(a)` in `cli/test/doctor-profile-sandbox.test.mjs` is the fixture case that pins this message, and the finding neither extends it nor allows it to be edited.

   **Fix:** In `finding_3.md` step 4, add `cli/test/doctor-profile-sandbox.test.mjs` to the test files this finding edits.
   - Extend case `(a)` to assert the new clause literally: refusing a run copy carrying a `commondir`, or a `config.worktree` or `http-alternates` that is not an empty regular file.
   - Add the file to the "Run each edited file alone" line.

## Should Fix

_None._

## Nice to Have

- **Name the gates' owner in the index.** In the fix-plan index's `## Source observations`, the quoted user constraint reads "`bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass." It is a verbatim copy, not a plan instruction, so it does not breach `## The test-run rule`. Still, one sentence in `## Context` would remove the ambiguity for an implementer who reads the index: the gate run belongs to the Run gates phase, never to a unit.
