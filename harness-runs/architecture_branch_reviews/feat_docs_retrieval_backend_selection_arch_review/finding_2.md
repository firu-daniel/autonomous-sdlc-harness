### 2. Declare `test_launcher_e2e.py`'s exit-3 copy among `pythonBackend.ts`'s mirrors

**Severity:** Should Fix

**Site:** `cli/src/retrieval/pythonBackend.ts`, the module header's `**MIRRORS.**` list (lines 13–24). The undeclared copy is `docs-retrieval-service/tests/test_launcher_e2e.py` → `_BACKEND_UNAVAILABLE_EXIT = 3`, under the comment *"The launcher's exit when the Python backend is selected but cannot serve."*

**Problem.** The header of `pythonBackend.ts` states its rule as: *"every name the Python backend is reached by is spelled here once, and each copy outside the compiler is a declared mirror."* It adds: *"a mirror this header does not declare is a defect."* It lists `PYTHON_BACKEND_UNAVAILABLE_EXIT` as mirrored only in `cli/templates/scripts/docs-search-server.sh`. This branch also adds `docs-retrieval-service/tests/test_launcher_e2e.py`, which retypes the same exit code as `_BACKEND_UNAVAILABLE_EXIT = 3` and asserts the launcher against it. That copy sits outside the compiler and is not declared. A change to the exit code in the owner and the launcher would leave this case asserting the old value, and nothing points a maintainer at it.

The rule source is `.claude/context/cli.md` → `## What "done" means here`: a change holds to its module's own header, either satisfying the rule that header states or amending it. The header-declared-mirror form is set out in `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`, the persisted-key bullet, which the module header itself cites.

This is graded Should Fix, not Must Fix. The copy is in a test, not in a shipped asset. It is also an exit code rather than a name an adopter reaches the backend by, which is where the header's rule binds most directly.

**Fix.** In `cli/src/retrieval/pythonBackend.ts`, add one bullet to the `**MIRRORS.**` list:

```
 * - `docs-retrieval-service/tests/test_launcher_e2e.py` — `_BACKEND_UNAVAILABLE_EXIT`
 *   ({@link PYTHON_BACKEND_UNAVAILABLE_EXIT}).
```

Leave the Python test unchanged: it cannot import the TypeScript constant, so declaring the copy at the owner is the sanctioned form.

Verification: run `commands.typecheck` (`bash scripts/typecheck.sh`). No test file is created or edited.
