### Task 1 — Generate `sandbox.excludedCommands` as `bash <main>/<scriptsDir>/<wrapper>.sh:*` and expose the stale `Bash(…)` form

**Goal:** Make the generated profile's two `sandbox.excludedCommands` entries the form measured to match: `bash <abs path of the main checkout's wrapper>:*`, with no `Bash(…)` wrapper. Also give `doctor` the old spelling of the same two entries as data, so it can report a profile carrying them as stale.

**Measured basis, so nobody re-argues it.** `docs/sandbox-verification.md`, measured on Claude Code 2.1.299, macOS, headless:

- **P1a.** An `excludedCommands` entry `Bash(bash <s>:*)` leaves the call sandboxed, with or without an argument. `bash <s>` excludes the call only when it has no argument. `bash <s>:*` excludes it with an argument.
- **P2.** With `bash <main>/scripts/push-branch.sh:*` in the list, the real push landed.

The wrappers are always called with an argument (the target checkout), so `bash <path>:*` is the only usable form.

**Where this layer stops.** This task changes the generated entries and the expected values only.

- `doctor`'s grading of a profile on disk is **Task 2's**. That task consumes the two fields below by these exact names.
- The profile template's `_README` text is **Task 3's**.
- No document changes here.

**The interface this task produces.** Tasks 2 and 5 restate it.

- `cli/src/generators/profileEntries.ts` → **`sandboxExcludedCommand(absolutePath: string): string`** returns `` `${INVOCATION_PREFIX}${absolutePath}:*` ``, which is `bash <absolutePath>:*`. `bashScriptRule(absolutePath)` is re-expressed as `` `Bash(${sandboxExcludedCommand(absolutePath)})` `` so the two forms have one source and cannot drift. Its output is byte-identical to today's, and its doc comment says so.
- `cli/src/generators/sandboxProfile.ts` → **`ExpectedSandbox.excludedCommands`** now holds `sandboxExcludedCommand(outerLoopScriptPath(repoRoot, config, outerLoopRelativePath(script)))` for each `runsUnsandboxed` row, in table order. For the default `scriptsDir` that is `bash <repoRoot>/scripts/push-branch.sh:*` and `bash <repoRoot>/scripts/refresh-branch.sh:*`.
- `ExpectedSandbox` gains **`staleExcludedCommands: readonly string[]`**. These are the same paths, in the same order, in the form earlier releases generated: `bashScriptRule(path)`, which is `Bash(bash <repoRoot>/scripts/push-branch.sh:*)` and its refresh twin. Index `i` of `staleExcludedCommands` is the stale spelling of index `i` of `excludedCommands`, and the doc comment states this pairing, because Task 2 relies on it.

### Targets

- `cli/src/generators/profileEntries.ts`: the new producer and the re-expressed `bashScriptRule`.
- `cli/src/generators/sandboxProfile.ts`: `expectedSandbox`, `ExpectedSandbox`, and the module header and doc comments that name the form.
- `cli/test/profile.test.mjs`: the sandbox-block test (*"the sandbox block is strict, excludes only the main checkout's two git wrappers, and grants the state directory"*).

**Work:**

- [ ] `profileEntries.ts`: add `sandboxExcludedCommand`, exported beside `bashScriptRule`. Its doc comment says three things:
  - it is the one producer of an `excludedCommands` entry;
  - which rows measured it (`docs/sandbox-verification.md` P1a and P2, Claude Code 2.1.299, macOS, headless);
  - why the `Bash(…)` rule form must never be used there: it matches nothing, and the wrapper then runs sandboxed.

  Re-express `bashScriptRule` through it.
- [ ] `sandboxProfile.ts` → `expectedSandbox`:
  - compute the wrapper paths once;
  - build `excludedCommands` with `sandboxExcludedCommand` and `staleExcludedCommands` with `bashScriptRule`;
  - add `staleExcludedCommands` to `ExpectedSandbox` with a one-line doc comment stating the index pairing.

  `applySandbox` keeps appending `expected.excludedCommands` and never writes the stale list.
- [ ] `sandboxProfile.ts` doc text: replace `expectedSandbox`'s *"in the `bashScriptRule` form `permissions.allow`'s repo-root-absolute spelling also takes"* with the new form and its reason. Keep the module header's rule (only the main checkout's own copy, by absolute path) intact, and amend it only where it names the form. This follows `.claude/context/cli.md`: a reviewer holds a change to its module's own header.
- [ ] `profile.test.mjs`, the sandbox-block test. Assert the contract literally, not through the producer (`.claude/context/conventions.md` → `## The testing bar`):
  - `profile.sandbox.excludedCommands` deep-equals `` [`bash ${join(dir, SCRIPTS_DIR, <push rel>)}:*`, `bash ${join(dir, SCRIPTS_DIR, <refresh rel>)}:*`] ``, built from `UNSANDBOXED_ROWS`;
  - no entry starts with `Bash(`;
  - the repo-relative and worktree-glob spellings are excluded in neither form;
  - for each excluded entry, `` `Bash(${entry})` `` is in `permissions.allow`. This replaces the *"excluded spelling and the allow-listed form (ii) are one string"* assertion, which no longer holds;
  - re-derive the prefix check's `push` as `mainForms[0].slice(0, -':*'.length)`.

**Verification:**

- `npm test --workspace cli -- test/profile.test.mjs` from the repository root, as one plain foreground command, exits 0. This is the one test file this task edits.
- `bash scripts/typecheck.sh` (`commands.typecheck`) exits 0. `noUnusedLocals` would catch a left-over import.
- Grep `cli/src/generators/sandboxProfile.ts` for `bashScriptRule`. Each hit is either the `staleExcludedCommands` construction or prose naming the stale form, and none builds `excludedCommands`.
