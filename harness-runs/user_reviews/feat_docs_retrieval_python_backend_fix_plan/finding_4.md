### 4. The refresh-failure remedy diverges from `server.ts` with no deferred-work marker for the selection branch

**Severity:** Should Fix. **Layer:** general (`docs-retrieval-service/` sits under the catch-all `path: "."`).

**Files (site anchors, grep-verified in the current tree):**
- `docs-retrieval-service/src/harness_docs_retrieval/service.py` (`answer`) — "\"run harness-docs-retrieval self-check in this repository\"" — the refresh-failure return.
- `docs-retrieval-service/README.md` → **Deliberate wire differences** — "The refresh-failure remedy names `harness-docs-retrieval self-check` in place of the CLI's `doctor`, which knows nothing of this backend."

## Problem

`cli/src/retrieval/server.ts` (`answer`) ends the refresh-failure text with ``; run `npx autonomous-sdlc-harness doctor` in this repository``. The Python text names a different remedy in a different form (no backticks), so a client can tell the backends apart on this path, against the task prompt's deliverable 2 (*"A client must not be able to tell which backend answered it."*).

The divergence has a real basis today — `doctor` knows nothing of the Python backend, and the task prompt's `## Out of scope` assigns *"doctor checks"* to `feat_docs_retrieval_backend_selection` — and it is recorded in the module header and the README, so this is Should Fix rather than Must Fix. But the basis is temporary: deliverable 1 builds `self-check` so that *"the second branch only has to call them"* from `doctor`. Once that branch lands, `npx autonomous-sdlc-harness doctor` is the right remedy for both backends, and this divergence becomes a stale client-visible difference that nothing in the code flags.

## Fix

- [ ] Directly above the refresh-failure `return _failure(...)` in `service.py` → `answer`, add the entry-point deferred-work marker in Python comment syntax, wrapped to the module's line length:
  ```python
  # TODO: @claude add a follow up task for this: once feat_docs_retrieval_backend_selection makes
  # doctor check this backend, restore server.ts's remedy text byte for byte:
  # run `npx autonomous-sdlc-harness doctor` in this repository
  ```
  Do not change the returned text itself in this unit.
- [ ] In `docs-retrieval-service/README.md` → **Deliberate wire differences**, extend the first bullet with one sentence stating the difference is temporary: it is reverted to `server.ts`'s `npx autonomous-sdlc-harness doctor` remedy once `feat_docs_retrieval_backend_selection` makes `doctor` check this backend.
