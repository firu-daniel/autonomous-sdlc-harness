### 3. The new `doctor` profile checks re-probe the profile root `buildCheckContext` resolves once

**Severity:** Must Fix. **Layer:** cli.

**Sites:**
- `cli/src/doctor/checks.ts` → `PROFILE_SANDBOX_CHECK.run`, at `const profileRoot = mainWorktreeRoot(ctx.repoRoot) ?? ctx.repoRoot;`
- `cli/src/doctor/checks.ts` → `PROFILE_WRITE_PROTECTION_CHECK.run`, the same line
- For reference, the existing resolution: `cli/src/doctor/checks.ts` → `buildCheckContext`, at `const profileRoot = mainWorktreeRoot(repoRoot) ?? repoRoot;`

**Problem.** `buildCheckContext`'s header states the rule its module is built on: *"Resolve everything the checks read, once."* It goes on to say the profile is read from the main checkout (`mainWorktreeRoot`, falling back to `repoRoot`). It computes that `profileRoot` and then discards it: `CheckContext` carries `profile` but not the root it was read from. The two new checks therefore each call `mainWorktreeRoot` again, a fresh `git` probe, to recover a value the context builder already had.

That puts the "which checkout's profile is this" answer in three places. `.claude/context/cli.md` → **`doctor` asks, grades and repairs nothing** requires that *"nothing it reports is re-derived from a second copy"*. Under `.claude/context/cli.md` → `## What "done" means here` → *"A reviewer holds a change to its module's own header"*, a change that breaks the header's resolve-once rule must either satisfy it or amend it. If the probe answers differently between the builder and a check, `doctor` grades the profile it read against expected values computed for a different root.

**Fix.**
1. Add a field to the `CheckContext` interface in `cli/src/doctor/checks.ts`, for example `readonly profileRoot?: string;`. Document it as the checkout whose `PROFILE_PATH` was read (the main worktree, or `repoRoot` when the probe did not answer).
2. In `buildCheckContext`, return the `profileRoot` it already computes in the context object. Leave it `undefined` on the early return where `repoRoot` did not resolve.
3. In `PROFILE_SANDBOX_CHECK.run` and `PROFILE_WRITE_PROTECTION_CHECK.run`, delete the `mainWorktreeRoot(ctx.repoRoot) ?? ctx.repoRoot` line and read `ctx.profileRoot`. Return `unevaluated(...)` when it is `undefined`, beside the existing `ctx.repoRoot === undefined` guard.
4. Where a test builds a `CheckContext` literal by hand, if any does, add the new field there. A field that is only ever optional changes no existing call shape.
