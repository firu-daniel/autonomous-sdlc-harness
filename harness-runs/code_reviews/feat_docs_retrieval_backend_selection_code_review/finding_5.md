### 5. `self-check`'s "not attempted" line is mirrored in `doctor/checks.ts`, outside the module that owns the Python backend's contract, and no header declares the mirror

**File:** `cli/src/doctor/checks.ts` (`INDEX_NOT_ATTEMPTED`): "const INDEX_NOT_ATTEMPTED = /^not attempted, because (packages|weights) failed$/;"
**Owner it bypasses:** `cli/src/retrieval/pythonBackend.ts` (the module header, the **MIRRORS.** list)

**Problem.** `pythonBackend.ts`'s header states its rule: *"every name the Python backend is reached by is spelled here once, and each copy outside the compiler is a declared mirror"*, and *"a mirror this header does not declare is a defect"*. The `self-check` output contract it owns is the line shape (`SELF_CHECK_LINE`) and the questions (`SELF_CHECK_QUESTIONS`). The **MIRRORS.** list declares `self_check.py`'s `SELF_CHECK_QUESTIONS` and `CheckLine.render` against them.

`RETRIEVAL_PYTHON_INDEX_CHECK` also depends on a third piece of that contract: the exact detail text `docs-retrieval-service/src/harness_docs_retrieval/self_check.py` → `_check_index` writes when an earlier question failed (`f"not attempted, because {failed[0]} failed"`). That text is spelled only in `checks.ts`, and neither module declares it as a mirror. If the Python wording drifts, nothing fails. The `index` check would fall through to its database remedy and tell an operator whose packages are missing to start Postgres.

`.claude/context/cli.md` → `## What "done" means here` holds a change to its module's own header: the header's rule is broken by a literal spelled in a neighbouring module.

**Fix.** Move the pattern to its owner and declare the mirror.

- [ ] In `cli/src/retrieval/pythonBackend.ts`, after `SELF_CHECK_LINE`, add:
  ```ts
  /**
   * The `index` line's detail when an earlier question failed, naming that question — `_check_index`'s
   * `not attempted, because … failed`.
   */
  export const SELF_CHECK_INDEX_NOT_ATTEMPTED = /^not attempted, because (packages|weights) failed$/;
  ```
- [ ] In the same file's **MIRRORS.** list, change the `self_check.py` bullet to:
  ```
   * - `docs-retrieval-service/src/harness_docs_retrieval/self_check.py` — `SELF_CHECK_QUESTIONS`
   *   ({@link SELF_CHECK_QUESTIONS}), `CheckLine.render` (the line shape {@link parseSelfCheck} reads)
   *   and `_check_index`'s not-attempted detail ({@link SELF_CHECK_INDEX_NOT_ATTEMPTED}).
  ```
- [ ] In `cli/src/doctor/checks.ts`, delete the `INDEX_NOT_ATTEMPTED` declaration and its doc comment. Add `SELF_CHECK_INDEX_NOT_ATTEMPTED` to the existing `import { … } from '../retrieval/pythonBackend.js'` list. Replace `INDEX_NOT_ATTEMPTED.exec(line.detail)` with `SELF_CHECK_INDEX_NOT_ATTEMPTED.exec(line.detail)`.
- [ ] In `cli/test/retrieval-python-backend.test.mjs`, extend `'parseSelfCheck reads the index line that was not attempted'`, or add a case beside it, asserting that `SELF_CHECK_INDEX_NOT_ATTEMPTED.exec('not attempted, because packages failed')?.[1]` is `'packages'` and the same for `weights`. Import the constant from `../dist/retrieval/pythonBackend.js` as the file's other imports are.

Then run that test file alone, `npm test -- test/retrieval-python-backend.test.mjs` from `cli/`. The full suite runs later, in the Run gates phase.
