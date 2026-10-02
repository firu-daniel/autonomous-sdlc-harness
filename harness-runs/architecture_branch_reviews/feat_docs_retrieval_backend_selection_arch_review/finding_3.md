### 3. Throw the `self-check` invariant breach through `internal()`, not `new Error`

**Severity:** Should Fix

**Site:** `cli/src/doctor/checks.ts` → `function selfCheckLine`, the line `if (line === undefined) throw new Error(\`self-check answered without its ${question} line\`);` (around line 4994).

**Problem.** `selfCheckLine` throws only when `parseSelfCheck` has broken its own guarantee: the comment above it says *"`parseSelfCheck` guarantees all three are present"*. That would be a fault in this CLI, not something an adopter can fix. `.claude/context/cli.md` → `## How a module in this layer is written` says: *"A fault in this CLI or in its shipped assets throws through `internal()`, not `new HarnessError(…, EXIT.INTERNAL)`."* `.claude/context/conventions.md` → `## Output, logging and errors` says the same: *"Use `internal(message)` for a fault in this CLI or in the assets it ships."* Before this branch, `doctor/checks.ts` contained no `throw new Error`. This one bypasses the error vocabulary `cli/src/core/errors.ts` owns. `runChecks` still catches it and reports it as that check's failure. But the message loses the standard trailing sentence that marks it as this CLI's bug rather than a misconfigured repository.

This is graded Should Fix, not Must Fix: the path cannot be reached while `parseSelfCheck` keeps its contract, and the error-vocabulary rule belongs to the error contract rather than to layer placement.

**Fix.** In `cli/src/doctor/checks.ts`:

1. Import `internal` from `'../core/errors.js'`, adding it to an existing import from that module if there is one. `internal(message)` returns a `HarnessError` (`cli/src/core/errors.ts` → `export function internal`), so it is thrown at the call site.
2. Replace the throw with:

```ts
if (line === undefined) throw internal(`self-check answered without its ${question} line, which parseSelfCheck guarantees`);
```

Verification: run `commands.typecheck` (`bash scripts/typecheck.sh`). No test file is created or edited.
