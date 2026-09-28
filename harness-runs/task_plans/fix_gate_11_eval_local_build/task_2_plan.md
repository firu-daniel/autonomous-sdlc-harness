### Task 2 — Replace the eval's runtime refusal with a local-peers refusal, after recording the pre-fix mismatch

**Goal:** Make `evals/docs-retrieval/index-build.mjs` → `assertRealModelsAreAvailable` refuse on what every one of its callers actually loads, the retrieval peers resolved from this checkout's own `cli/dist`, and stop refusing on the machine-wide runtime's presence or version. Before the edit, reproduce the defect with the story index's acceptance probe and record it. That record is the evidence the mismatch was real, which Acceptance 1 asks for.

**Depends on:** Task 1, which exports from `cli/src/retrieval/runtime.ts` (compiled to `cli/dist/retrieval/runtime.js`) `unresolvedRetrievalPeers(): readonly string[]`. That function returns every optional retrieval peer's package name this installation cannot resolve from its own location, in manifest order, resolving only and loading nothing. An empty array means `loadRetrievalModule` will find every package. This task imports it and does not re-derive it.

**Where this task stops.** This task changes the refusal and the words that describe it in the eval's own modules. It does **not** give the refusal an exit status of its own. Until Task 3 lands, a checkout without the peers still makes `check-floor.mjs` exit `1` (an unhandled rejection carrying this task's message). **Task 3** adds `LOCAL_PEERS_ABSENT = 4`, the pre-check in `checkFloor`, and `scripts/run-gates.sh`'s `BLOCKED` line, and it imports `LOCAL_INSTALL_COMMAND` from this file. The two surviving refusals, the stub variable and the incomplete model cache, keep their order, their conditions and their messages byte for byte.

**Why no caller keeps the runtime check.** Each caller was checked on its own (story index `## Context`, first question). `buildIndex` and `measureColdBuild` import `cli/dist/retrieval/*.js` directly. `runQueryLogPass` spawns `node <repo>/cli/dist/cli.js docs serve` (`CLI_ENTRY`), never the runtime's entry, and imports the MCP SDK statically from the workspace. None of them loads anything from `<cache>/retrieval/runtime`.

### Targets

- `evals/docs-retrieval/index-build.mjs` — the third refusal, the new export, the module header and `assertRealModelsAreAvailable`'s doc comment.
- `evals/docs-retrieval/query-log-pass.mjs` — one clarifying sentence in the module header, and nothing else.

**Work:**

- [ ] **Record the defect first, before touching either target.** Run `bash scripts/typecheck.sh`, which rebuilds `cli/dist` with Task 1. Then create `harness-runs/scratch/gate11-probe.mjs` exactly as the story index's `## Context` → **The acceptance probe** specifies, with all three cases. Run `bash scripts/scratch-run.sh harness-runs/scratch/gate11-probe.mjs mismatch` and then the same command with `empty`. Expected at this commit: `mismatch` → `check-floor exit 1`, with stderr carrying `eval: the retrieval runtime is not installed` and `missing: autonomous-sdlc-harness`, and `empty` → `check-floor exit 3`. Append both outputs, redacted as the probe prints them, and the two versions (the local `cli/package.json` version and the planted `0.3.0`) to this file under a closing `**Pre-fix record:**` heading. Leave the probe in place; Task 3 re-runs it.
- [ ] `index-build.mjs`: delete the `retrievalRuntimeState()` refusal and its import. Import `unresolvedRetrievalPeers` from `'../../cli/dist/retrieval/runtime.js'`, beside `retrievalModelCacheDir`. Add `export const LOCAL_INSTALL_COMMAND = 'npm ci';` with a one-line doc comment: the workspace's own lockfile install, which puts every optional peer into `node_modules` because `cli/package.json` repeats them under `devDependencies`. The new third refusal runs after the model-cache one: when `unresolvedRetrievalPeers()` is non-empty, `throw new Error(…)` with exactly `` `eval: the retrieval packages cannot be resolved from this checkout's build under cli/dist, so no real-model number can be taken; missing: ${missing.join(', ')}. Run ${LOCAL_INSTALL_COMMAND} at the repository root to install them` ``.
- [ ] `index-build.mjs` prose: the module header's *"when the retrieval runtime is not installed"* becomes *"when this checkout's build cannot resolve the retrieval packages"*. `assertRealModelsAreAvailable`'s doc comment names all three callers (`buildIndex` here, `cold-build.mjs` → `measureColdBuild`, `query-log-pass.mjs` → `runQueryLogPass`). It states that each loads this checkout's `cli/dist` and resolves the peers from the workspace, and that the machine-wide runtime `init` installs is therefore **not** a precondition of any of them, with the version-bump failure as the reason the check was removed. It replaces *"(… which measures the shipped server instead)"* with *"which measures the shipped server code over MCP, spawned from this checkout's `cli/dist/cli.js`"*.
- [ ] `query-log-pass.mjs` header: after the rule paragraph's *"it takes them through the shipped server rather than through the library"*, add one sentence. It says the server is `docs serve` spawned from this checkout's `cli/dist/cli.js` (`CLI_ENTRY`), not the machine-wide runtime `init` installs, so *"shipped"* names the code path and not an installed copy. Do not restructure its static `@modelcontextprotocol/sdk` import. Where that SDK is missing, the module fails at load naming the package, before the shared refusal runs, and that stays as it is.

**Verification:**

- The `**Pre-fix record:**` shows `check-floor exit 1` with `missing: autonomous-sdlc-harness` for `mismatch`, and the two versions differing. If `mismatch` did not reproduce that at this commit, stop and report it, because every later claim rests on it.
- `bash scripts/typecheck.sh` passes.
- After the edit, `bash scripts/scratch-run.sh harness-runs/scratch/gate11-probe.mjs peers-absent` shows `check-floor exit 1` with stderr carrying `eval: the retrieval packages cannot be resolved from this checkout's build under cli/dist` and naming all five peers and `npm ci`. It is exit `1` rather than `4` because the status is Task 3's. Record that output under the pre-fix record as `**After this task:**`.
- `grep -n "retrievalRuntimeState" evals/docs-retrieval/*.mjs` prints nothing.
- `git diff` on `index-build.mjs` shows the stub and model-cache refusals unchanged.
- **No machine path entered the record:** `grep -nE '/Users/|/home/|/private/|/var/folders/' harness-runs/task_plans/fix_gate_11_eval_local_build/task_2_plan.md` prints no line except this bullet's own, which quotes the pattern. Gate `6a` reads all of `harness-runs/`.

**Pre-fix record:**

Taken at commit `bc95ff8` (Task 1 landed, `index-build.mjs` untouched), after `bash scripts/typecheck.sh` rebuilt `cli/dist` (`PASS: typecheck`). Local `cli/package.json` version `0.4.0`; planted runtime version `0.3.0` — the two differ. Output as the probe printed it, redacted by the probe.

`bash scripts/scratch-run.sh harness-runs/scratch/gate11-probe.mjs mismatch`:

```
case: mismatch
local version: 0.4.0
planted runtime version: 0.3.0
check-floor exit 1
--- stdout ---

--- stderr ---
file://<repo>/evals/docs-retrieval/index-build.mjs:54
    throw new Error(
          ^

Error: eval: the retrieval runtime is not installed, so the optional peers cannot be loaded; missing: autonomous-sdlc-harness. Run the harness's retrieval setup to install them
    at assertRealModelsAreAvailable (file://<repo>/evals/docs-retrieval/index-build.mjs:54:11)
    at buildIndex (file://<repo>/evals/docs-retrieval/index-build.mjs:73:3)
    at runEval (file://<repo>/evals/docs-retrieval/run.mjs:130:25)
    at checkFloor (file://<repo>/evals/docs-retrieval/check-floor.mjs:137:24)
    at main (file://<repo>/evals/docs-retrieval/check-floor.mjs:165:28)
    at file://<repo>/evals/docs-retrieval/check-floor.mjs:169:9

Node.js v20.19.5
```

`bash scripts/scratch-run.sh harness-runs/scratch/gate11-probe.mjs empty`:

```
case: empty
local version: 0.4.0
check-floor exit 3
--- stdout ---

--- stderr ---
check-floor: the retrieval model cache under <scratch cache>/autonomous-sdlc-harness/retrieval/models is incomplete, so no figure can be taken; missing: Xenova/bge-small-en-v1.5/config.json, Xenova/bge-small-en-v1.5/tokenizer.json, Xenova/bge-small-en-v1.5/tokenizer_config.json, Xenova/bge-small-en-v1.5/onnx/model_quantized.onnx, Xenova/ms-marco-MiniLM-L-6-v2/config.json, Xenova/ms-marco-MiniLM-L-6-v2/tokenizer.json, Xenova/ms-marco-MiniLM-L-6-v2/tokenizer_config.json, Xenova/ms-marco-MiniLM-L-6-v2/onnx/model_quantized.onnx. Run npx autonomous-sdlc-harness docs fetch-models
```

**After this task:**

`bash scripts/typecheck.sh` → `PASS: typecheck`. Exit `1`, not `4`: the status is Task 3's. All five peers and `npm ci` are named.

`bash scripts/scratch-run.sh harness-runs/scratch/gate11-probe.mjs peers-absent`:

```
case: peers-absent
local version: 0.4.0
check-floor exit 1
--- stdout ---

--- stderr ---
file://<repo>/evals/docs-retrieval/index-build.mjs:62
    throw new Error(
          ^

Error: eval: the retrieval packages cannot be resolved from this checkout's build under cli/dist, so no real-model number can be taken; missing: @electric-sql/pglite, @electric-sql/pglite-pg_textsearch, @electric-sql/pglite-pgvector, @huggingface/transformers, @modelcontextprotocol/sdk. Run npm ci at the repository root to install them
    at assertRealModelsAreAvailable (file://<repo>/evals/docs-retrieval/index-build.mjs:62:11)
    at buildIndex (file://<repo>/evals/docs-retrieval/index-build.mjs:82:3)
    at runEval (file://<repo>/evals/docs-retrieval/run.mjs:130:25)
    at checkFloor (file://<repo>/evals/docs-retrieval/check-floor.mjs:137:24)
    at main (file://<repo>/evals/docs-retrieval/check-floor.mjs:165:28)
    at file://<repo>/evals/docs-retrieval/check-floor.mjs:169:9

Node.js v20.19.5
```

`grep -n "retrievalRuntimeState" evals/docs-retrieval/*.mjs` prints nothing (exit `1`). `git diff` on `index-build.mjs` leaves the stub and model-cache refusals' lines untouched.
