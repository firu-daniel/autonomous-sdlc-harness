### 2. `wrapper-carry-forward.test.mjs`'s header says the option has no caller, but `init` sets it now

**File:** `cli/test/wrapper-carry-forward.test.mjs`, the opening header comment — "because the option has no caller yet; the end-to-end case that drives `init` belongs to the task that sets it"

This header was written for Task 1, before Task 3 wired the option. On the finished branch it is false. `cli/src/commands/init.ts` → `run` passes `carryOnDiskCommandLines: selfAdopt && ctx.flags.force`, and the end-to-end case lives in `cli/test/self-adopt-force.test.mjs`. A reader of this suite who trusts the header would think the forced self-adopt path has no end-to-end coverage, and might add a duplicate. The header also points at "the task that sets it", which is planning vocabulary: a durable test file outlives the plan, so a reader cannot resolve that phrase. A test header states the rule its file enforces (`.claude/context/conventions.md` → `## The testing bar`), so it has to be true of the tree.

**Fix:** replace the sentence

> The generator is driven through the compiled module rather than the CLI because the option has no caller yet; the end-to-end case that drives `init` belongs to the task that sets it.

with

> The generator is driven through the compiled module rather than the CLI so that each precedence arm is reached on its own, with no `init` around it; the end-to-end case, which drives `init` on a forced self-adopt run, is `cli/test/self-adopt-force.test.mjs`.

Change nothing else in the file. This fix edits that one test file, so that file is the only test the fix runs: `npm test --workspace cli -- test/wrapper-carry-forward.test.mjs`, from the repository root, as one plain foreground command.
