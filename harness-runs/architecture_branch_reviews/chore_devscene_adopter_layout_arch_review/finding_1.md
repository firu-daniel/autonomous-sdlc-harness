### 1. Restore the space in the generated `harness_fail "devscene: ` placeholder prefix

**Severity:** Should Fix. This is outside the architecture lens. It is not a layer-placement or dependency-direction violation, but it is a defect in a user-facing literal that the branch's own contract fixes.

**Site anchors**
- `cli/src/generators/scripts.ts`: the placeholder producer, the line `` return `harness_fail "devscene:${unresolvedFix(key, file)}"`; `` (near line 457, navigation hint only).
- `cli/test/init.test.mjs`: the `assert.match(text(dir, 'deploy.sh'), /harness_fail "devscene:put the deploy command line in deploy\.sh"/)` assertion.
- `cli/test/init.test.mjs`: the fixture value `command: 'harness_fail "devscene:put the deploy command line in deploy.sh"'`.

**Problem**
Before this branch the placeholder line was `harness_fail "harness: <fix>"`, with a space after the colon. The story plan's spelling table, row 13, maps `harness_fail "harness: ` to `harness_fail "devscene: `, so the space stays. Task 4's sub-step says the same in its own words: *"change the placeholder template to `` `harness_fail "devscene: ${unresolvedFix(key, file)}"` ``"*. The implementation dropped the space. Every unresolved-command placeholder `init` writes now prints `devscene:set commands.typecheck in devscene.config.json`, with the prefix run into the message.

The two `init.test.mjs` pins were respelled to match the broken output instead of the contract. So the suite now locks the defect in. `.claude/context/conventions.md` → `## The testing bar` says to *"Assert against the contract stated literally, not against what generated the output."* `cli/test/wrapper-carry-forward.test.mjs` already spells its fixture `harness_fail "devscene: set commands.typecheck …"`, with the space, so the producer and its own suites now disagree.

`cli/src/generators/scripts.ts` is the only producer of this line (`.claude/context/cli.md` → *"One string, one producer."*). The fix therefore goes in that one place.

**Fix**
1. In `cli/src/generators/scripts.ts`, change the return to `` `harness_fail "devscene: ${unresolvedFix(key, file)}"` ``, adding a single space after the colon.
2. In `cli/test/init.test.mjs`, change both pins to the spaced form:
   - the regular expression becomes `/harness_fail "devscene: put the deploy command line in deploy\.sh"/`
   - the fixture `command:` value becomes `'harness_fail "devscene: put the deploy command line in deploy.sh"'`
3. Leave the function name `harness_fail` and `UNRESOLVED_HEAD` unchanged. They are kept names per the story plan's `## Context`.

**Verification:** run the one test file this fix edits, `cli/test/init.test.mjs`, plus whatever tree guards the unit loop selects for the changed paths. After that, `git grep -n 'harness_fail "devscene:[^ ]' -- cli` should print nothing.
