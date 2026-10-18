### 1. `bashScriptRule`'s doc comment gives the wrong reason for building it from `sandboxExcludedCommand`

**File:** `cli/src/generators/profileEntries.ts` (`bashScriptRule` doc comment): "Built from {@link sandboxExcludedCommand} so the two forms cannot drift"

**Severity:** Nice to Have.

The branch rewrites `bashScriptRule` as `Bash(${sandboxExcludedCommand(absolutePath)})`. Its doc comment explains this as "so the two forms cannot drift". That reason is misleading. The two strings follow separate grammars that answer to different evidence:

- `bashScriptRule` uses the `permissions.allow` rule grammar.
- `sandboxExcludedCommand` uses the `sandbox.excludedCommands` pattern grammar, which was picked by measurement (`docs/sandbox-verification.md` → P1a, P2). A later Claude Code release could move that pattern on its own.

So the forms are not meant to be kept from drifting apart. They share `bash <path>:*` today, and each one is free to change for its own reasons.

The drift itself cannot pass silently. `cli/test/profile.test.mjs` pins each form separately:

- the test `'the fixed text each builder writes, which doctor prints for an operator to paste'` asserts `bashScriptRule(probe)` equals `` `Bash(bash ${probe}:*)` `` (`'the wrapper form changed shape'`);
- the sandbox-block test builds `mainForms` as the literal `` `bash ${join(dir, SCRIPTS_DIR, outerLoopRelativePath(row))}:*` `` and `deepEqual`s `sandbox.excludedCommands` against it.

A change to `sandboxExcludedCommand` therefore fails a test. That failure makes the editor decide the allow-rule and `staleExcludedCommands` question explicitly. What remains is only the comment's rationale, which would tell that editor the coupling is intended.

**Fix:** in `cli/src/generators/profileEntries.ts`, in the doc comment above `bashScriptRule`, replace this sentence:

> Built from {@link sandboxExcludedCommand} so the two forms cannot drift; its output is byte-identical to the `Bash(bash <path>:*)` literal it replaced.

with:

> Built from {@link sandboxExcludedCommand} only because the two share `bash <path>:*` today; its output is byte-identical to the `Bash(bash <path>:*)` literal it replaced. The two follow separate grammars — this one the `permissions.allow` rule grammar, that one a measured excluded-command pattern — and `profile.test.mjs` pins each on its own, so a change to either fails a test rather than moving the other.

Leave the function body, `sandboxExcludedCommand` and its doc comment unchanged. No test file is edited by this fix.
