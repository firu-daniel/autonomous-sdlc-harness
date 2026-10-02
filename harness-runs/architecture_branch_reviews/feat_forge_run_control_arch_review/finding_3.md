### 3. Derive the forge check's verb list from `COMMAND_VERBS`

**Severity:** Should Fix

**Site:** `cli/src/doctor/checks.ts` → `FORGE_CHECK`, the final `pass(...)` sentence containing ``a \`${COMMAND_HANDLE} <verb>\` comment answers, pauses, resumes, stops or clears it``.

**Problem.** The `github` pass line of the `forge` check imports `COMMAND_HANDLE` from `cli/src/remote/githubActions.ts` but writes the five verbs out by hand as `answers, pauses, resumes, stops or clears`. That module declares `COMMAND_VERBS` as the single set, and its header rule is *"every remote-execution name has one owner, and a copy anywhere else in `cli/src` imports it."* `init.ts` follows that rule for the same set (`nameList([...COMMAND_VERBS])` in `reportGithubSteps`). If a verb is added to or removed from `COMMAND_VERBS`, the `doctor` sentence silently goes wrong and nothing fails to compile. (`.claude/context/conventions.md` → `## Configuration is the source of truth…`: *"a value is imported from its owner rather than retyped"*.)

The `doctor` sentence conjugates the verbs, so it cannot be built mechanically without changing its wording. That is why this is a Should Fix and not a Must Fix.

**Fix.** In `cli/src/doctor/checks.ts`, add `COMMAND_VERBS` to the existing `../remote/githubActions.js` import. Reword that clause of the `FORGE_CHECK` pass sentence to name the verbs from the set, for example ``a \`${COMMAND_HANDLE} <verb>\` comment (${nameList([...COMMAND_VERBS])}) steers it``. `nameList` is already in scope in that file. Run `commands.typecheck`. If `cli/test/doctor.test.mjs` asserts the old wording, update that assertion and run that file only.
