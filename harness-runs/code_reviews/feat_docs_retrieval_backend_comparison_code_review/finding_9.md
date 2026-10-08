### 9. `WRAPPER_PATH` and `cosine` are exported with no caller outside their files

**File:** `evals/docs-retrieval/python-backend.mjs` (`WRAPPER_PATH`) — "export const WRAPPER_PATH = ['scripts', 'python-service.sh'];"; `evals/docs-retrieval/vector-agreement.mjs` (`cosine`) — "export function cosine(a, b) {"

**Problem.** The new-export caller sweep over every layer path found no caller outside the defining file for these two exports. `WRAPPER_PATH` is read only by `wrapperArgs` in the same module, and `wrapperArgs` is the export the other passes import. The `python-backend.mjs` header already says this module owns both. `cosine` is called only by `pair` in the same module. Neither is dead code, but each export advertises a second entry point that nothing uses. For `WRAPPER_PATH` it invites a caller to join the path itself instead of going through `wrapperArgs`.

**Fix.**

- [ ] `evals/docs-retrieval/python-backend.mjs`: change `export const WRAPPER_PATH` to `const WRAPPER_PATH`. The header's `{@link WRAPPER_PATH}` still resolves within the module.
- [ ] `evals/docs-retrieval/vector-agreement.mjs`: change `export function cosine(a, b) {` to `function cosine(a, b) {`.

Confirm with `git grep -n -w -e WRAPPER_PATH -e cosine -- evals` that no other module imports either. No test file covers these modules, so no test runs.
