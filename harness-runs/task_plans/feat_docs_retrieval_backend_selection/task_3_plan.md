### Task 3 — Add the run library's `docs.retrievalBackend` reader and retrieval gate, `hr_docs_retrieval_backend` / `hr_docs_retrieval_applies`

**Goal:** Give the shell side one typed reader of `docs.retrievalBackend` and one shell mirror of `retrievalApplies`, in `cli/templates/scripts/lib/harness-run-lib.sh`, the one place a generated script reads `harness.config.json` (its header, `JURISDICTION`). The launcher (Task 4) asks the gate first and reads the key only when the gate is open — the task prompt's deliverable 1 (*"this key is read only inside that"*) — and no script parses either key itself.

**Depends on:** Task 1, which declares `RETRIEVAL_BACKENDS = ['typescript', 'python']` and `DEFAULT_RETRIEVAL_BACKEND = 'typescript'` in `cli/src/config/model.ts`, and whose doc comment names `hr_docs_retrieval_backend` as their shell mirror. `retrievalApplies` in the same file (unchanged by this branch: `phases.docs` and `docs.retrieval` both `true`) is what `hr_docs_retrieval_applies` mirrors.

**Where this task stops.** It adds two readers and touches no script that sources the library. Task 4 calls both, in the order gate → key. The library is copied verbatim into an adopter's `scriptsDir`, so `cli/test/outer-loop-scripts.test.mjs`'s byte-for-byte assertion keeps covering the new body with no edit.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`
- `cli/test/outer-loop-scripts.test.mjs`

**Work:**

- [ ] `hr_config_load`'s single `jq` program: add two emitted scalars beside `execution.target`, and nothing else:
  - `s("docs.retrievalBackend"; try .docs.retrievalBackend catch null),`
  - `s("docs.retrieval"; try (.docs.retrieval | if type == "boolean" or . == null then . else "invalid" end) catch null),` — the same boolean guard the three `phases.*` lines carry, so a string `"true"` reaches the gate as `invalid`. Extend the program's existing comment (*"A `phases.*` value that is not a boolean is emitted as `invalid`…"*) to name `docs.retrieval` alongside them.
- [ ] Add `hr_docs_retrieval_backend <root>` after `hr_forge`, with a header comment in that function family's form. It is *"THE ONE READER OF THE KEY IN THIS FAMILY"* and the shell mirror of `RETRIEVAL_BACKENDS` / `DEFAULT_RETRIEVAL_BACKEND` in `cli/src/config/model.ts` ("change the enum there and here together"). Its contract:
  - prints `typescript` and returns 0 when the key is absent, the schema default;
  - prints the value and returns 0 for `typescript` or `python`;
  - returns 2, printing nothing, when `hr_config_load` cannot resolve the configuration or the value is outside the enum. That is a refusal rather than a guess, as `hr_execution_target` does.
  - a `docs` parent of the wrong type (`"docs": "x"`) reads as **absent**: it prints `typescript` and returns 0. This is not a choice the function makes; it follows from `hr_config_load`'s `try .docs.retrievalBackend catch null`, which turns "Cannot index string" into `null` for that key alone, so `s` emits nothing and `hr_cfg_scalar_var "docs.retrievalBackend"` returns 1 (`hr_config_load`'s own comment: *"A key whose PARENT has the wrong type (`"commands": "x"`) yields `null` for that key alone via `try … catch`"*). `hr_execution_target` behaves the same on `"execution": "x"`. State this in the function's comment. The wrong-typed parent is the schema's to refuse (`npm run validate:config`), not this reader's.
  - It does **not** consult `phases.docs` / `docs.retrieval` itself. Its comment says so and says the key is read **only inside the gate**: a caller asks `hr_docs_retrieval_applies` first and calls this only on status 0 — so with retrieval off the key selects nothing, as Task 1's `checkRetrievalBackend` warning tells the adopter.
- [ ] Add `hr_docs_retrieval_applies <root>` directly before `hr_docs_retrieval_backend`, the shell mirror of `retrievalApplies` in `cli/src/config/model.ts` ("change the predicate there and here together"). Like `hr_phase_enabled`, it **prints nothing; the answer is the status**:
  - 0 when `hr_phase_enabled "$root" docs` returns 0 **and** the `docs.retrieval` scalar is `true`;
  - 1 when either is `false` or unset (`hr_phase_enabled` returning 1, or `hr_cfg_scalar_var "docs.retrieval"` returning 1);
  - 2 when the configuration is unresolvable, or either value is not a boolean (`hr_phase_enabled` returning 2, or `docs.retrieval` emitted as `invalid`) — refused, not guessed, as `hr_phase_enabled` does.
- [ ] `outer-loop-scripts.test.mjs`: add one case per reader, using the suite's existing `sourceAndCallWithEnv` helper on an `init`'d fixture whose `harness.config.json` the case rewrites.
  - `hr_docs_retrieval_backend`: key absent → `typescript`, status 0; `"python"` → `python`, status 0; `"java"` → empty stdout, status 2; `docs` holding a string → `typescript`, status 0 (the wrong-typed parent reads as absent, per the comment above); a config `jq` cannot parse → status 2.
  - `hr_docs_retrieval_applies`, every row asserting empty stdout: `phases.docs: true` + `docs.retrieval: true` → 0; `phases.docs: true` + `docs.retrieval: false` → 1; `phases.docs: true` + `docs.retrieval` absent → 1; `phases.docs: false` + `docs.retrieval: true` → 1; `docs.retrieval: "true"` (a string) with `phases.docs: true` → 2; a config `jq` cannot parse → 2.

**Verification:**

- `npm test -- test/outer-loop-scripts.test.mjs` from `cli/` passes, including the unchanged verbatim-copy case for the library.
- The function body uses no `set -e` / `set -u` and sets no shell option: the library leaves the sourcing shell as it found it (`.claude/context/conventions.md` → `## Shell assets`).
- `bash -n cli/templates/scripts/lib/harness-run-lib.sh` exits 0.
