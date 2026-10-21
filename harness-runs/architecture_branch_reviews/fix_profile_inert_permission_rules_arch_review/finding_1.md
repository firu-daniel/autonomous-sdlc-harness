### 1. Declare and test the watcher's copy of `FORBIDDEN_IN_ENTRY`'s command shapes

**Severity:** Should Fix · **Layer:** cli

**Site:**
- `cli/templates/scripts/autonomous-watcher.sh` → `run_profile_entries`, the new clause `case "$copy" in *'$'* | *'`'* | *'&'* | *';'* | *'|'* | *'<'* | *'>'*) return 3 ;;` and its comment *"the shapes cli/src/generators/profileEntries.ts → FORBIDDEN_IN_ENTRY never lets a command entry carry"*.
- The owner: `cli/src/generators/profileEntries.ts` → `FORBIDDEN_IN_ENTRY` (and the derived `FORBIDDEN_IN_COMMAND`).
- The suite: `cli/test/watcher-run-profile.test.mjs`, the module header's mirror list (*"The watcher holds declared mirrors of TypeScript owners; the last test holds each equal to its owner"*), and the subtest `run_profile_entries refuses a run copy path carrying $ with exit 3`.

**Problem.** This branch lets the watcher's per-run copy append the run copy's wrapper twins (`Bash(bash <copy>/<scripts_dir>/…:*)`) to `permissions.allow` and `permissions.ask`. To keep those entries runnable, `run_profile_entries` now refuses a run-copy path carrying `$`, a backquote, `&`, `;`, `|`, `<` or `>`. Its comment names the set it is copying: `FORBIDDEN_IN_ENTRY`'s command rows. Three things are wrong with how that copy was added:

1. **The owner's header does not declare it.** `profileEntries.ts` has no "Mirrors outside this package" block. This is unlike its siblings `writeProtection.ts` and `permissionProfile.ts`, whose headers both close with *"A mirror this header does not declare is a defect."* `.claude/context/conventions.md` → `### Where a new responsibility goes` says *"A responsibility that already has a home does not get a second one"* and *"Before adding a copy of anything, grep for it"*. For a shipped template that cannot import its owner, a declared and tested mirror is how this tree satisfies that rule. Its `## Configuration is the source of truth…` section states the same pattern for the one other template mirror it names (*"a mirror the header does not declare is a defect"*).
2. **No suite holds it equal to its owner.** The new subtest checks `$` only. The test file's header lists every other watcher mirror and leaves this one out. If a row is later added to `FORBIDDEN_IN_ENTRY`, the watcher keeps accepting a run-copy path the generator would refuse in an entry, and the twin it writes is one the profile check was never meant to admit.
3. **The copy is already partial.** `FORBIDDEN_IN_ENTRY` also refuses `\n`, and the watcher's clause does not. The neighbouring loop covers the quotes, so the newline is the only command row with no counterpart. The comment does not argue why it is left out.

The responsibility itself sits in the right layer and the right file. The watcher has to screen the path before it emits a rule, and it cannot import the TypeScript set. Only the bookkeeping for the copy is missing.

**Fix.**
1. In `cli/src/generators/profileEntries.ts`, add a mirrors paragraph to the module header. Use the shape `writeProtection.ts` uses: *"Mirrors outside this package, each held equal by the suite named: `cli/templates/scripts/autonomous-watcher.sh` → `run_profile_entries` refuses a run-copy path carrying any `FORBIDDEN_IN_ENTRY` needle other than `///` (`cli/test/watcher-run-profile.test.mjs`). Any change to that set is an edit to `run_profile_entries` in the same change. A mirror this header does not declare is a defect."* Alternatively, put the same text on `FORBIDDEN_IN_ENTRY`'s own doc comment, if the header should stay mirror-free.
2. In `cli/templates/scripts/autonomous-watcher.sh` → `run_profile_entries`, do one of two things. Either add the newline to the `case "$copy"` refusal, so the clause covers every command row of `FORBIDDEN_IN_ENTRY`, or state in the comment why the newline is excluded. Then update `run_profile_render`'s exit-3 `RUN_PROFILE_REFUSAL` text to match.
3. In `cli/test/watcher-run-profile.test.mjs`:
   - Add this mirror to the header's list of declared mirrors.
   - Replace the single-`$` subtest with one that imports `FORBIDDEN_IN_ENTRY` from `cli/dist`, the way the file already imports `fileToolDenyRules` and `COPY_GIT_PATHS`.
   - For every needle except `///`, call `run_profile_entries "<dir>-a<needle>b" clone` and assert exit 3 with empty stdout.
   - Verify by running this edited test file only.
