### 4. `writeProtection.ts` and `permissionProfile.ts` retype the `sandbox` key instead of importing `SANDBOX_KEY`

**Severity:** Should Fix. **Layer:** cli.

**Sites:**
- `cli/src/generators/writeProtection.ts` → `applyWriteProtection`, at `listAt(profile, ['sandbox', 'filesystem', 'denyWrite'])`
- `cli/src/generators/permissionProfile.ts` → `assertRunnable`, at `` const where = `sandbox.${dotted}`; `` and `` const where = `sandbox.credentials.${list}`; ``

**Problem.** `cli/src/generators/sandboxProfile.ts` declares and exports `SANDBOX_KEY = 'sandbox'` as *"The profile's top-level key for the sandbox block"*, and `doctor` imports it. Two generators on this branch retype the literal instead. `.claude/context/conventions.md` → `## Configuration is the source of truth…` sets the rule: *"The shared constants have owners, and a value is imported from its owner rather than retyped."* `SANDBOX_KEY` is new and is not on that paragraph's enumerated list, so this is graded Should Fix rather than Must Fix. The drift it invites is the same one, though: rename the key in its owner and the write protection silently addresses a list that no longer exists. It would then throw an `internal()` fault at `init` time.

**Fix.**
1. In `cli/src/generators/writeProtection.ts`, import `SANDBOX_KEY` from `./sandboxProfile.js` and write the path as `[SANDBOX_KEY, 'filesystem', 'denyWrite']`.
2. In `cli/src/generators/permissionProfile.ts`, add `SANDBOX_KEY` to the existing `import { applySandbox } from './sandboxProfile.js';` and build both `where` strings from it. The binding is read at call time inside `assertRunnable`, so it stays within the call-time-only cycle rule both module headers state.
