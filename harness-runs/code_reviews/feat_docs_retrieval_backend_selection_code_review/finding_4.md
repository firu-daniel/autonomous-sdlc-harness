### 4. `retrieval-python-dependencies` fails an unreadable `self-check` answer without naming the hand step that fixes it

**File:** `cli/src/doctor/checks.ts` (`RETRIEVAL_PYTHON_DEPENDENCIES_CHECK`, the `answer.kind === 'unreadable'` branch): "answered in a shape this CLI cannot grade (${answer.text})"
**And:** `docs/cli.md` (§7, the **`retrieval-python-dependencies` grades whether the backend's console script, interpreter and packages resolve.** bullet): "An answer `doctor` cannot parse fails here, naming what came back."

**Problem.** The task prompt's deliverable 4 says *"When one fails, its message names the hand step that fixes it"*, and Acceptance 3 asks for *"a message naming the fix"*. Every other failure branch of the three `retrieval-python-*` checks names one: the install remedy, `fetch-models`, or the compose / `env` route. The `unreadable` branch does not. `runPythonSelfCheck` reaches it in these cases:

- the console script resolves but crashes before printing its three lines;
- it exits with a status other than `0` or `1`;
- it is stopped by the 600-second bound;
- it prints a line shape `parseSelfCheck` cannot read, which is what a package installed from a different release than this CLI prints.

The operator is told what came back and nothing about what to do next, and both other Python checks point at this one.

**Fix.** Name the reinstall, which is the hand step for every cause listed above.

- [ ] In that branch, replace
  ```ts
  `${PYTHON_RETRIEVAL_COMMAND} ${PYTHON_SELF_CHECK_SUB_COMMAND} answered in a shape this CLI cannot grade (${answer.text})`,
  ```
  with
  ```ts
  `${PYTHON_RETRIEVAL_COMMAND} ${PYTHON_SELF_CHECK_SUB_COMMAND} answered in a shape this CLI cannot grade (${answer.text}) — ${PYTHON_INSTALL_REMEDY}, from a clone at the release tag matching this CLI's version, then run doctor again`,
  ```
- [ ] In `docs/cli.md` §7, replace "An answer `doctor` cannot parse fails here, naming what came back." with "An answer `doctor` cannot parse fails here, naming what came back and the same install remedy, from a clone at the release tag matching the CLI's version."
- [ ] In `cli/test/doctor.test.mjs`, the subtest `'a two-line answer fails dependencies naming the shape it could not read'`, add beside the existing `'answered in a shape this CLI cannot grade'` assertion:
  ```js
  assert.ok(dependencies.detail.includes(PYTHON_INSTALL_REMEDY_TEXT), dependencies.detail);
  ```

Then run that test file alone, `npm test -- test/doctor.test.mjs` from `cli/`. The full suite runs later, in the Run gates phase.

**Deviations from plan:** `cli` dispatch also reworded `PYTHON_INSTALL_REMEDY`'s doc comment in `cli/src/doctor/checks.ts` from "the two `packages`-side failures share" to "every `retrieval-python-dependencies` failure names", because the unreadable branch now names it too and the old comment would be false. The `docs/cli.md` sub-step is under `docs/`, so the `general` dispatch of this unit owns it.
