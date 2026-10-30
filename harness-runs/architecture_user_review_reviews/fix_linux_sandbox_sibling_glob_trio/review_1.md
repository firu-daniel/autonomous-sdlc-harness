# Architecture review — iteration 1

Reviewed: `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_fix_plan.md` and `finding_1.md` through `finding_6.md`, against `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md`, `harness-runs/lessons.md` and `plugin/instructions/unit_loop_core.md` → `## The test-run rule`.

Iteration 0's four Must Fix items are resolved. `finding_1.md` step 8 and `finding_3.md` step 4 now extend `cli/test/profile.test.mjs` and `cli/test/doctor-profile-sandbox.test.mjs` for the adopter-facing strings they rewrite. The index's `## Context` now says the gates belong to Run gates. Placement, `_(layer: …)_` tags, dependency direction and the test-run rule all hold.

One new Must Fix: Finding 3 puts the trust check's new fixtures in the wrong suite.

## Must Fix

1. **Finding 3 puts the trust check's new acceptance and refusal arms in `cli/test/wrapper-clone-arm.test.mjs`, but the suite that owns `hr_clone_target_check_var`'s rule is `cli/test/clone-trust-check.test.mjs`.** Offending file: `finding_3.md` (step 4, "put the fixtures in `cli/test/wrapper-clone-arm.test.mjs`, the clone arm's suite. Read its header first, and extend that header's rule statement to name the new arm"). Rules:
   - `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one."*
   - `.claude/context/conventions.md` → `## The testing bar`: *"A test file opens with the rule it exists to enforce"*.
   - `.claude/context/cli.md` → `## Naming and file layout`: a unit lives where its responsibility is served.

   **Where the trust rule lives today.**
   - `cli/test/clone-trust-check.test.mjs`'s header states this exact rule: *"an unsandboxed wrapper runs git in a clone only when … its `.git` holds no file that redirects git …"*.
   - The same suite already carries case `(h) A planted commondir, config.worktree or http-alternates is refused`. That case is the existing pin for condition 3, the condition Finding 3 rewrites.
   - `cli/test/clone-create-remove.test.mjs`'s header names that suite as the owner: *"own refusals are `cli/test/clone-trust-check.test.mjs`'s"*.

   **Why `wrapper-clone-arm.test.mjs` is the wrong home.** Its header states a different rule: how the three wrappers act on a registered clone (sync-in, the operation, the clone-first branch move, parity with the worktree arm). It points elsewhere for the trust check.

   **What the plan as written causes.**
   - It widens that header to claim a second responsibility.
   - It splits condition 3's arms across two suites.
   - It leaves case `(h)` and the owning header unchanged, even though the rule they state has changed. That header now needs to name the one accepted inert shape.

   **Fix:** In `finding_3.md` step 4:
   - Put the new condition-3 fixtures in `cli/test/clone-trust-check.test.mjs`, beside case `(h)`, using that suite's own `fixture` and `assertRefused` helpers. The fixtures are:
     - empty regular `config.worktree` accepted;
     - empty regular `http-alternates` accepted;
     - content refused for each;
     - a symbolic link to an empty file refused at each path;
     - a FIFO refused at each path;
     - an empty `config.worktree` with `extensions.worktreeConfig` true refused;
     - an empty `commondir` refused.
   - Extend that suite's header rule statement to name the accepted shape: regular, 0 bytes, not a link, and for `config.worktree` with `extensions.worktreeConfig` off. Also add the FIFO-for-character-device note there.
   - Keep case `(h)`'s content-bearing plants and their `<path> exists` regex unchanged. Adjust its title only if the accepted shape makes it inaccurate.
   - Drop `wrapper-clone-arm.test.mjs` from the files this finding edits, unless a fixture goes through a wrapper end to end, which this rule does not need.
   - In the "Run each edited file alone" line, replace `wrapper-clone-arm` with `clone-trust-check`.

## Should Fix

_None._

## Nice to Have

_None._
