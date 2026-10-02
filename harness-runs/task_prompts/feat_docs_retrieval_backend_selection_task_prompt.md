`feat_docs_retrieval_backend_selection` makes the Python docs-retrieval backend **selectable by an adopter**: one
config key, the launcher routing on it, three doctor checks that answer for it, and `docs/retrieval.md` rewritten to
describe two backends. The TypeScript backend stays the default, and with the key absent nothing an adopter sees
changes.

This is the second of three branches that together deliver the second backend:

1. `feat_docs_retrieval_python_backend`: the Python package, the parity core, the container and the gates;
2. **this branch**: the config key, launcher routing, doctor checks and the documentation;
3. `feat_docs_retrieval_backend_comparison`: the side-by-side measurement against the TypeScript backend and the
   comparison write-up.

**Do not start it before `feat_docs_retrieval_python_backend` has landed.** This branch calls that package's console
entry point (serve, build the index, self-check) and re-implements none of it. If a sub-command this branch needs is
missing or answers in a shape a doctor check cannot grade, stop and say so instead of building a second copy in
TypeScript.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Refer to other roadmap
> items by title only.

---

## Why on its own

The first branch builds a backend nothing can reach, and that is deliberate: it can be proven against the TypeScript
one without touching a file an adopter receives. Everything here is the opposite. It is all adopter-facing contract
(a config key in four places, a launcher's exit contract, `doctor` output, a published document), and all of it has to
be exactly invisible to the adopter who never opts in. Kept apart, this branch's review is about that contract and
nothing else.

---

## What to deliver

1. **Backend selection, off by default.** One config key under `docs` selects the backend; absent or unset means the
   TypeScript implementation, exactly as today. The key goes into `cli/src/config/model.ts`, its cross-field rules
   into `cli/src/config/check.ts`, `schemas/harness.config.schema.json` with a negative fixture under
   `schemas/negative/`, and `docs/config.md` §5's key reference. `cli/src/config/model.ts`'s own header calls those
   four "one contract in four places", so all four move together. **The gate that turns retrieval on at all is
   unchanged**: `retrievalApplies` still requires `phases.docs` and `docs.retrieval` both true, and this key is read
   only inside that.

2. **Where the connection string comes from, decided and recorded.** The Python backend reaches Postgres by
   connection string, and the first branch left the source to its caller. Decide whether it is a second key under
   `docs`, a default that matches the compose file, or both, and record the choice in `docs/config.md`. Two
   constraints: `harness.config.json` is committed, so it never carries a credential, and the agent runner passes the
   MCP server only a fixed inherited environment (`docs/retrieval.md` explains how a variable does and does not reach
   the server), so a design that depends on an exported shell variable does not work.

3. **The launcher routes on it.** `cli/templates/scripts/docs-search-server.sh` reads the key and starts either the
   TypeScript runtime it starts today or the Python package's stdio server. Its exit contract gains the new failure
   mode: the Python backend selected, but its service not reachable (interpreter or package missing, or the database
   not answering). Report that on stderr; stdout belongs to the MCP transport. **`.mcp.json` and the settings
   templates do not change.** The server name, the tool name and the permission string are the same whichever backend
   answers, which is why the routing belongs in the launcher. A diff that touches `cli/templates/repo/mcp.retrieval.json`,
   either `cli/templates/claude/settings.autonomous*.json` or anything under `plugin/` is a sign the routing went in
   the wrong place.

4. **Doctor checks for the new backend, matching the posture of the existing three.**
   `retrieval-dependencies`, `retrieval-model-cache` and `retrieval-index` each answer for the TypeScript runtime
   (`cli/src/doctor/checks.ts`). The Python backend needs the same three answers (interpreter and packages resolve,
   weights are present, an index builds), graded from the package's self-check rather than re-derived. They must
   **pass with the existing "not applicable" message whenever the backend is not selected**, so an adopter who never
   opts in sees no new noise and doctor stays fast. When one fails, its message names the hand step that fixes it.
   Decide whether the three TypeScript checks become "not applicable" when the Python backend is selected, and
   record why.

5. **`init` with the key set.** Downloads stay where an operator is present, and the Python weights are provisioned by
   hand (`feat_docs_retrieval_python_backend` → its README). So `init` installs and downloads nothing for the Python
   backend. Decide whether it still installs the TypeScript runtime and models when the Python backend is selected,
   and record why. Keeping them is the default, because it makes switching back cost nothing.

6. **Documentation.** `docs/retrieval.md` gains the second backend:
   - `## How it fits together` describes both;
   - `## What this buys you` is reworded so that its "embedded and in-process, no database server to install or keep
     running" claim is scoped to the TypeScript backend rather than to retrieval as such;
   - `## What it costs` gains the Python backend's line items (the second weight cache, the Postgres container), with
     the measured figures left to `feat_docs_retrieval_backend_comparison` and marked as pending rather than guessed;
   - `## Where it goes next` retires the entry this sequence executes.
   Also document how an adopter turns the backend on, end to end: the key, the container, the weights, the doctor
   output that says it is ready.

7. **Tests.** The config key's accepted and rejected shapes, each new doctor check's three states (not applicable,
   pass, fail), and the launcher's routing and its new exit. The case that starts the Python stdio server through the
   launcher and calls `search_docs` as an MCP client needs a Postgres container. It runs under the stub models, is
   opt-in, and skips loudly when Docker is absent, as the first branch's container gates do.

---

## Settled before this branch was queued

- **The TypeScript implementation stays the default, and nothing here deprecates it.** An adopter who wants retrieval
  to cost them one `init` and no infrastructure keeps getting exactly that.
- **Leave this repository's `harness.config.json` alone.** It has `phases.docs: false`, and turning it on would make
  every later branch here run the post-implementation docs phase. Tests build their own config.
- **The wire is not this branch's to change.** Server name, tool name, permission string, tool description, input
  schema and output shape were fixed by the first branch, byte for byte. If routing seems to need any of them to
  differ, the routing is wrong.

---

## Acceptance

1. With the new key absent, nothing about an adopter's install, `doctor` output, `init` output or `.mcp.json`
   differs from before this branch. Assert this on a fixture repository, not by inspection.
2. With the key set to the Python backend and its prerequisites present, the launcher starts the Python stdio server,
   and an MCP client calling `search_docs` through it gets a response with the same shape as the TypeScript one
   (opt-in container case, stub models).
3. With the key set and a prerequisite missing, `doctor` fails the matching check with a message naming the fix, and
   the launcher exits with the new failure mode on stderr.
4. The key moves in all four places of its contract, with a negative fixture.
5. `scripts/run-gates.sh` passes on a machine with no Docker and no Python weights.
6. No file under `plugin/` is modified, and `.mcp.json` and the settings templates are unchanged.

---

## Out of scope

- **The real-model comparison and the real agent session through `.mcp.json`.** Both need the weights, and both
  belong to `feat_docs_retrieval_backend_comparison`.
- **Any change to the Python package's search behaviour.** If this branch finds a defect in it, fix the defect at the
  smallest scope and record it; do not tune.
- **`init` installing Python, its packages or its weights**, and any container orchestration beyond the compose file
  the first branch shipped.
- **The LangGraph port**, publishing the Python package, and a provider or engine abstraction in the harness core.
