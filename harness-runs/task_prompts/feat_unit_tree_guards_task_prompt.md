## Problem

A unit runs only the test files it created or edited (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, points 1 and 3). Some tests do not test one module. They read a whole directory tree as text and enforce a rule over every file in it. A unit can break one of these without touching it, and the unit loop can't see that. The break shows up only in the Run gates round, which costs a test-fix-plan, a G.4 unit and another full-suite round.

**Seen on `feat_run_gates_flake_resilience`:** Task 1 added `cli/test/test-time-scale.test.mjs` with `const env = { ...process.env };`. Task 1's verification ran only that file, as the plan required (`task_1_plan.md:59`: "That is the only test file this task runs"), and the file passed. Run gates round 1 then failed on `cli/test/main-anchor-isolation.test.mjs` → `every process.env spread in a test source blanks the anchor in the same object`. The fix was one line (`5b873c20`).

## Proposal

Let an adopter declare a fixed list of **tree guards**: test files that enforce a rule over every file under a path. The unit loop runs the matching guards mechanically. No agent searches for them or reasons about which ones apply.

1. **Config.** Add an optional key to `harness.config.json` and the schema, for example:

   ```json
   "treeGuards": [
     { "test": "test/main-anchor-isolation.test.mjs", "covers": "cli/test/**/*.mjs" },
     { "test": "test/shipped-scripts-mktemp.test.mjs", "covers": "cli/templates/scripts/**/*.sh" },
     { "test": "test/retrieval-loading.test.mjs", "covers": "cli/src/**/*.ts" }
   ]
   ```

   `test` is the argument `<test_file_cmd>` takes. `covers` is a repo-relative glob over the files the guard reads.
2. **Unit loop.** In `## The test-run rule`, add an exception beside the row-`G.4` one. After a unit's own test run, if any file in the unit's diff matches a guard's `covers`, run that guard through `<test_file_cmd>`. A failing guard is handled like a failing own test. Matching is a glob check over `git diff --name-only`, so it costs no reasoning.
3. **Planners stay out of it.** task-plan-writer does **not** list guards in a task's Verification, and must not write "that is the only test file this task runs" so that it overrides the guard run. task-plan-reviewer flags a plan that adds guards by hand.
4. **Keeping the list current.** Add a rule to the conventions template: a new test that reads a tree of source files as text adds itself to `treeGuards` in the same change. The layer-reviewer and branch-reviewer check for that. `doctor` warns when a `test` path does not exist.
5. **This repo's own config.** Seed it with the three guards above. These are the only tests under `cli/test/` that walk a repository tree: the others that call `readdir` walk temporary fixtures, or read one fixed file.

## Out of scope

- Source guards that read one fixed file (for example `cli/test/prompt.test.mjs` reads `cli/src/core/prompt.ts`). The unit that edits that file already sees the guard named in the plan, and a new file can't break it.
- Gates in `scripts/run-gates.sh` that are not test files (the self-containment sweep and similar). Moving them into the unit loop is a separate question.

## Acceptance

- A unit whose diff adds a `cli/test/*.mjs` file with a bare `{ ...process.env }` fails its own unit run on `main-anchor-isolation.test.mjs`, before Run gates.
- A unit whose diff touches no `covers` glob runs exactly the tests it runs today.
- An unattended run allow-lists the guard run under the same `<test_file_cmd>` string, so the permission profile doesn't change.
