# Task plan review — iteration 1

All three Must Fix items from iteration 0 are resolved: `task_10_plan.md` now marks only the MCP-client case, `task_3_plan.md` now has the wrong-typed parent read as absent, and `task_2_plan.md` now spawns `/bin/bash` by absolute path. The two architecture-review Must Fix items are resolved too: the Task 1 / index ordering departure, and Task 8's gate runs. The items below are new, or were raised before and are still unresolved.

## Must Fix

1. **`task_10_plan.md`: the unmarked exit-3 case's environment is unstated, so its `could not connect` assertion can't be reached in 13c**
   The last Work bullet specifies only `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` (a closed loopback port), `subprocess.run`, a timeout and closed stdin. The environment list (stub, planted cache, `PATH` with the venv `bin`, temp `HOME`) appears only in the bullet that launches the MCP-client case through `StdioServerParameters`.
   - `docs-retrieval-service/src/harness_docs_retrieval/service.py` → `open_session` refuses in this order: *"the weight cache, then the models, then the store"*.
   - Without a planted `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE`, the server fails on the missing cache first (`the docs-retrieval model cache at … is missing …`).
   - Without `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB=hash-v1`, `resolve_models` needs the `models` extra, which the gate environment never installs (`pyproject.toml`: *"The gate environment never installs the `models` extra"*).
   - Without the venv `bin` on `PATH`, `harness-docs-retrieval` does not resolve, and the launcher takes its own exit-3 path with no server line at all.
   - `conftest.py` has no autouse fixture that supplies any of these.

   In each of those cases the launcher still exits 3, but stderr never carries `harness-docs-retrieval: could not connect`, so the case fails. The unit records a skip for this file, so the failure first shows up in Phase G's 13c. Iteration 0 raised this as Should Fix 2. It is unchanged, and it is graded Must Fix here because it breaks a gate rather than a nicety.
   **Fix:** in `task_10_plan.md`, have the exit-3 bullet state its environment explicitly:
   - the same `PATH` (venv `bin`, then the `git`/`jq` directories), a temp `HOME`, `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB=hash-v1`, and a cache planted with `model_cache.plant_model_files` and named in `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE`;
   - the `ts_fixture` it runs in;
   - one sentence saying these are what let the server get past the cache and model steps to the store, so the asserted line is the database's.

2. **`task_11_plan.md`: its Verification requires a heading that only Task 13, which lands later, creates**
   The second Verification bullet requires that *"`docs/retrieval.md` → `## Turning on the Python backend` (Task 13)"* resolves. Task 11 is readiness entry 11 and Task 13 is entry 13, and Task 11's `**Depends on:**` list leaves Task 13 out. So at Task 11's commit the heading does not exist, and the bullet cannot pass. In effect a task is ordered before a task it depends on. The cycle is real: Task 13's own `**Depends on:**` lists Task 11's row (*"This section cites it"*).
   **Fix:** in `task_11_plan.md`, either:
   - change that bullet to check only **How the variable reaches the server, since an export does not.** (which exists now), and say that the forward link to `## Turning on the Python backend` is checked by Task 13's and Task 15's Verification; or
   - move the turn-on link into Task 13's scope.

   Name the forward reference in the file either way.

3. **Story index (`feat_docs_retrieval_backend_selection_story_plan.md`), `## Scope register`: the derivation misses durable-corpus sites this plan itself changes**
   I re-ran entries 1, 3, 4 and 5 verbatim and re-walked entries 2 and 6. Every site they reach is a row. But no entry reaches the following, and each is a `change` in a per-task file:
   - `docs/cli.md` → `## 2. \`init\``, the paragraph opening "**Docs retrieval setup is a post-plan step**" (Task 14, Work bullet 1);
   - `docs/cli.md` → `## 10. How this is tested` (Task 14, Work bullet 3);
   - `docs/retrieval.md` → the **Who reads this:** paragraph (Task 12, Work bullet 1);
   - `docs/retrieval.md` → `## Still open`, the new bullet on the unwalked turn-on path (Task 13, last Work bullet). Row 17 covers a different bullet and is `no-change`.

   A wider command also reaches two service-README sites that this branch makes partly stale, now that the launcher defaults the URL and `doctor` resolves it from `.mcp.json`. Neither is a row:
   - `docs-retrieval-service/README.md` → `## Standing it up`, the paragraph opening "Every sub-command except `fetch-models` reads its connection string from `HARNESS_DOCS_RETRIEVAL_DATABASE_URL`";
   - `docs-retrieval-service/README.md` → `### Environment variables`, the `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` row (*"Read by: the service … It is required"*).

   **Fix:** in the story index's `## Scope register`, add two entries wider than the ones on the page:
   - **(a)** a procedure entry. **Artifact:** the per-task files under `harness-runs/task_plans/feat_docs_retrieval_backend_selection/`. **Traversal:** each file's `### Targets`, then each `**Work:**` bullet, in readiness order. **Decision rule:** every section or paragraph of a durable-corpus file that a bullet edits or adds to is a site.
   - **(b)** a command entry: `git grep -n 'HARNESS_DOCS_RETRIEVAL_DATABASE_URL' -- docs README.md ARCHITECTURE.md docs-retrieval-service/README.md`.

   Then add one row per site listed above. Each row is either `change` with its owning task, or `no-change` with a reason. For the two README sites, the reason could be that the service itself still requires the variable and the launcher supplies it. Keep the closure invariant as stated.

## Should Fix

1. **Story index `## Context` and `task_12_plan.md`: the forward-link window to `## Turning on the Python backend` is not recorded.** Task 5's fail remedy, Task 7's `init` note, Task 8's schema description and Task 12's prose all cite `docs/retrieval.md` → `## Turning on the Python backend`, which exists only from Task 13 on. The Context records the schema window opened by Tasks 1–8. Record this one beside it, in the same form: the tasks that cite the heading early, and the task that closes the window.
2. **`task_4_plan.md`: two iteration-0 Should Fix items are still open.** Should Fix 3: `INT` forwarded to a background child in a non-interactive shell, where `SIGINT` is ignored and `serve_mcp` handles only `SIGTERM`. Should Fix 4: the new stderr line on status 2 for a key-absent adopter, against Acceptance 1. State a reason for each, or adjust the plan.

## Nice to Have

1. **`task_15_plan.md`**: the iteration-0 note still applies. *"shows small line counts, read against the two paragraphs"* is not checkable as written. Assert that the diff has hunks only inside the two named paragraphs.
