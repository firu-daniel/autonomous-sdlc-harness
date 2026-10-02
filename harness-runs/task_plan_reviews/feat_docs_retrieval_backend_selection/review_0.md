# Task plan review — iteration 0

## Must Fix

1. **`task_10_plan.md` — the module-level `pytestmark` marks the "unmarked" exit-3 case `container` too, so it never runs in 13c**
   Work bullet 1 says to add `pytestmark = pytest.mark.container` to `docs-retrieval-service/tests/test_launcher_e2e.py`. Work bullet 5 then puts a second, **unmarked** case in the same file that must run in 13c on every machine. A module-level `pytestmark` applies to every test in the module (`tests/test_backend_parity_e2e.py` and `tests/test_store_postgres.py` both use it that way). Under it, `conftest.py` → `pytest_collection_modifyitems` skips the exit-3 case wherever `HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL` is unset, which is every 13c run. The plan contradicts itself: its own Verification bullet expects the marker on "the MCP-client case only". The result is that Acceptance 3's launcher half on the real package, which Task 15's README edit and Task 14's `docs/cli.md` §10 edit both describe as running in `test`, would never run outside 13d.
   **Fix:** in `task_10_plan.md`, replace the module-level `pytestmark` with `@pytest.mark.container` on the MCP-client case alone. Alternatively, move the exit-3 case to a file of its own. Keep the Verification bullet's "marker on the MCP-client case only" consistent with whichever you choose.

2. **`task_3_plan.md` — the "`docs` holding a string → status 2" test case contradicts the reader the same task prescribes**
   Work bullet 1 adds `s("docs.retrievalBackend"; try .docs.retrievalBackend catch null)` to `hr_config_load`'s `jq` program. On `"docs": "x"` that expression raises "Cannot index string", which the `try … catch null` turns into `null`, and `s` emits nothing for `null`. `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_config_load`'s own comment states this: *"A key whose PARENT has the wrong type (`"commands": "x"`) yields `null` for that key alone via `try … catch`, so one key fails rather than the document."* `hr_cfg_scalar_var "docs.retrievalBackend"` then returns 1. Under bullet 2's contract, that is the absent case: it prints `typescript` and returns 0. Bullet 3's case, "`docs` holding a string → empty stdout, status 2", therefore cannot pass against the reader as specified. One of the two has to change.
   **Fix:** in `task_3_plan.md`, pick one behaviour and state it in both places:
   - change the test expectation to `typescript`, status 0, and state in the function's comment that a wrong-typed `docs` parent reads as absent (as `execution.target` does); or
   - change the reader so a non-object `docs` holding the key is emitted as an out-of-enum value (as `phases.*` emits `invalid`), keeping status 2.

   Task 4's out-of-enum exit `1` follows from whichever you choose, so check its `"java"` case still holds.

3. **`task_2_plan.md` — the prescribed `runBash` call with `PATH=` cannot spawn `bash`**
   The last Work bullet says `launcherSearchPath('', home)` is compared against `hr_path_with_fallbacks` "sourced … with `PATH=` and `HOME=home`, through `runBash` from `cli/test/helpers/fixture.mjs`". `runBash` runs `run('bash', …)`, which is `execFile('bash', …)` with `env: { ...process.env, ...ISOLATED_ENV, ...env }`. With `PATH` empty, the bare `bash` does not resolve, so the call fails at spawn before the library is reached. The tree records this exact trap: `cli/test/outer-loop-scripts.test.mjs` → `sourceAndCallWithEnv`'s doc comment says *"`/bin/bash` by absolute path on purpose — a case below inherits an EMPTY `PATH`, and a bare `bash` would then fail to resolve, making the refusal the spawn's rather than the library's."*
   **Fix:** in `task_2_plan.md`, have the empty-`PATH` comparison invoke `/bin/bash` by absolute path, with `execFile('/bin/bash', ['-c', '. "$1"; hr_path_with_fallbacks', '_', <lib path>], { env })`, as `sourceAndCallWithEnv` does. Read the library from `cli/templates/scripts/lib/harness-run-lib.sh`. Do not use `runBash`. Name that form in the bullet so the implementer does not rediscover the spawn failure.

## Should Fix

1. **Story index (`feat_docs_retrieval_backend_selection_story_plan.md`) and `task_5_plan.md` — the departure from "the existing 'not applicable' message" is not recorded as a departure.** Deliverable 4 says the Python checks "must pass with the existing 'not applicable' message whenever the backend is not selected". The plan uses `RETRIEVAL_OFF` only when retrieval is off, and a new `PYTHON_NOT_SELECTED` sentence when retrieval is on with the TypeScript backend. That is defensible, because `RETRIEVAL_OFF` would be false text there. But the Context bullet presents it as the plan's own design rather than as a reading of the prompt's wording. State in Context why the existing sentence cannot be reused verbatim in that state, so a later reviewer does not read it as a deviation.

2. **`task_10_plan.md` — the unmarked exit-3 case's environment is unstated.** `open_session` checks the weight cache, then loads models, then connects to the store (`service.py` → `open_session`). Unless the case also sets `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB=hash-v1` and a planted `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE`, the server fails before the database step. In 13c, without the `models` extra, real model resolution fails first. The asserted `harness-docs-retrieval: could not connect` line would then never print. Say that the case reuses the container case's stub and planted-cache environment.

3. **`task_4_plan.md` — forwarding `INT` to a background child is a no-op.** In a non-interactive bash, an asynchronous command starts with `SIGINT` and `SIGQUIT` ignored. Python keeps an inherited `SIG_IGN` for `SIGINT`, and `mcp_server.py` → `serve_mcp` handles only `SIGTERM`. Either drop the `INT` forwarding from the plan and header, or state what it is expected to achieve.

4. **`task_4_plan.md` — a new stderr line for a key-absent adopter.** Today the launcher needs neither `jq` nor the configuration. Under the plan, an adopter with retrieval on and an unreadable configuration (for example, no `jq`) gets a new stderr line on every server start. Acceptance 1 is "nothing … differs". Consider taking the TypeScript branch silently on status 2 too, or state why the line is worth the visible change.

## Nice to Have

1. **`task_15_plan.md`** — the Verification bullet "`git diff --stat` shows small line counts" is not checkable as written. Name the two paragraphs and assert that no other hunk exists.
