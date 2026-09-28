### Task 3 — Grade missing local peers as `BLOCKED` in `check-floor.mjs` and `run-gates.sh`, and record the acceptance probes

**Goal:** Give the gate a third outcome for a checkout whose build cannot resolve the retrieval peers, `BLOCKED` with its own reason, distinct from the empty model cache. Then take the acceptance evidence on the finished code. With the machine-wide runtime at another version, gate 11's command exits `0`. With an empty cache it still exits `3`. With the peers unresolvable it exits `4`. And the recorded floors either hold or are reported short.

**Depends on:** Task 1 and Task 2.
- **Task 1** exports `unresolvedRetrievalPeers(): readonly string[]` from `cli/dist/retrieval/runtime.js`. It returns every optional retrieval peer's name that this installation cannot resolve from its own location, in manifest order, resolving only.
- **Task 2** exports `LOCAL_INSTALL_COMMAND = 'npm ci'` from `evals/docs-retrieval/index-build.mjs`. It also makes `assertRealModelsAreAvailable()` refuse with *"eval: the retrieval packages cannot be resolved from this checkout's build under cli/dist …"* instead of on the runtime.
- **Task 2** also leaves `harness-runs/scratch/gate11-probe.mjs` built to the story index's `## Context` → **The acceptance probe** spec, and a `**Pre-fix record:**` of the `mismatch` probe failing with `missing: autonomous-sdlc-harness`. Scratch is not committed, so if the probe is absent, re-create it from that spec. It is specified there, not in either task file.

**Where this task stops.** It changes the gate's grading and records evidence. It does not describe the gate in any document; that is **Task 4**, which quotes the reason line and the statuses exactly as this file fixes them below. It changes no other gate's block in `scripts/run-gates.sh` and does not touch `evals/docs-retrieval/floor.json`, whatever the floors measure.

### Targets

- `evals/docs-retrieval/check-floor.mjs` — `LOCAL_PEERS_ABSENT`, the pre-check, the module header.
- `scripts/run-gates.sh` — gate 11's block, its comment, the script header's gate-11 clause, and the two hand-run lines that condition on `floor_blocked`.

**Work:**

- [x] `check-floor.mjs`: add `export const LOCAL_PEERS_ABSENT = 4;` beside `MODEL_CACHE_ABSENT`, with the doc comment *"The status reserved for a checkout whose build cannot resolve the retrieval packages, and reserved for nothing else."*. In `checkFloor`, after the model-cache pre-check and before `loadFloor`, compute `const missing = unresolvedRetrievalPeers();`. When it is non-empty, print `` `check-floor: the retrieval packages cannot be resolved from this checkout's build under cli/dist, so no figure can be taken; missing: ${missing.join(', ')}. Run ${LOCAL_INSTALL_COMMAND} at the repository root` `` to stderr and `return LOCAL_PEERS_ABSENT;`. The model-cache check stays first, so an empty scratch cache still answers `3`.
- [x] `check-floor.mjs` header: *"**Three exit statuses …**"* becomes four. `{@link LOCAL_PEERS_ABSENT}` is the second blocked status, and the header states why it is blocked rather than failed: running `npm ci` is provisioning of the checkout like the model cache, and the gates that need the same install (`2a build`, `4 npm test`) go red on their own where it has not run. It also names the accepted cost: an install missing only a package gate 11 alone loads reports blocked. Nothing in the header mentions the machine-wide runtime.
- [x] `run-gates.sh`: in gate 11's block, add `elif [ "$floor_status" -eq 4 ]; then` after the status-3 branch. It sets `floor_blocked=1`, prints exactly `  BLOCKED 11 docs-retrieval relevance floor — the workspace's retrieval packages are not installed`, then the log tail the same way the status-3 branch does. Status 3's line is unchanged. Extend the block's comment: status 4 is the local-peers status and is `BLOCKED` for the reason above, and the gate grades this checkout's build and the workspace's peers and never the machine-wide runtime. The script header's *"gate 11 among them where the retrieval model cache is provisioned"* and the two `floor_blocked` texts (the `echo "  11 the docs-retrieval relevance floor, reported BLOCKED above: …"` pair and the `hand_run` string) each gain *"and the workspace's retrieval packages are installed"* next to the model cache condition. No other gate's lines change.
- [x] **Take the evidence.** Run `bash scripts/typecheck.sh`, then `bash scripts/scratch-run.sh harness-runs/scratch/gate11-probe.mjs mismatch`, then `… empty`, then `… peers-absent`. Append the three outputs, redacted as the probe prints them, under a closing `**Acceptance record:**` heading in this file. Include the local version and the planted `0.3.0` for `mismatch`, and the outcome `scripts/run-gates.sh`'s gate-11 block maps each status to, read off the block this task just edited. For `mismatch`, also state whether the floors held: exit `0` with the `check-floor: fixture-catalog met every recorded floor …` line means they did. A `below the floor` line means a shortfall. Record the line, state it as a finding in the return, and leave `floor.json` untouched.

**Verification:**

- The acceptance record shows `mismatch` → `check-floor exit 0` (gate `ok`), with the planted runtime at `0.3.0` and `cli/package.json` at a different version. Read against Task 2's pre-fix record of `exit 1` / `missing: autonomous-sdlc-harness` for the same setup, that is Acceptance 1. If it shows `exit 1` with a `below the floor` line instead, the mismatch is fixed and the floor finding is reported, not patched.
- `empty` → `check-floor exit 3` (gate `BLOCKED`), which is Acceptance 2. `peers-absent` → `check-floor exit 4` (gate `BLOCKED`) with the `check-floor: the retrieval packages cannot be resolved …` line naming all five peers and `npm ci`, which is deliverable 2.
- `bash scripts/typecheck.sh` passes, and `bash -n scripts/run-gates.sh` parses.
- `git diff scripts/run-gates.sh` touches only gate 11's block, the header's gate-11 clause and the two `floor_blocked` texts.
- The real model directory still exists at the path `retrievalModelCacheDir()` answers with no `XDG_CACHE_HOME` set, and no `gate11-probe-*` directory is left under the system temp directory.
- **No machine path entered the record:** `grep -nE '/Users/|/home/|/private/|/var/folders/' harness-runs/task_plans/fix_gate_11_eval_local_build/task_3_plan.md` prints no line except this bullet's own, which quotes the pattern.

**Deviations from plan:**

- `bash -n scripts/run-gates.sh` was refused by the permission profile (*"This command requires approval"*), so the parse check was not executed. The script's parse rests on reading the edited block (one `elif … then` with a matching body, no new quoting) and not on a run; the Run gates phase executes the script whole.

**Acceptance record:**

Taken on the working tree over commit `d58940d` (Tasks 1 and 2 landed) with this task's edits to `evals/docs-retrieval/check-floor.mjs` and `scripts/run-gates.sh` applied, after `bash scripts/typecheck.sh` rebuilt `cli/dist` (`PASS: typecheck`). Local `cli/package.json` version `0.4.0`; planted runtime version `0.3.0` for `mismatch` — the two differ. Output as the probe printed it, redacted by the probe. The gate outcome for each status is read off `scripts/run-gates.sh`'s gate-11 block as this task leaves it: `0` → `ok`, `3` → `BLOCKED … the retrieval model cache is empty`, `4` → `BLOCKED … the workspace's retrieval packages are not installed`, anything else → `FAIL`.

| Case | check-floor exit | Gate 11 outcome |
|---|---|---|
| `mismatch` | `0` | `ok` |
| `empty` | `3` | `BLOCKED` (model cache) |
| `peers-absent` | `4` | `BLOCKED` (retrieval packages) |

**The floors held:** `mismatch` exits `0` with `check-floor: fixture-catalog met every recorded floor — 8 over 4 arms, snapshot { files: 9, chunks: 41 }`; no `below the floor` line. Against Task 2's pre-fix record of `exit 1` / `missing: autonomous-sdlc-harness` for the same setup, that is Acceptance 1. `empty` → `3` is Acceptance 2. `peers-absent` → `4`, naming all five peers and `npm ci`, is deliverable 2.

After the three runs: the probe run with no `XDG_CACHE_HOME` set reports the directory `retrievalModelCacheDir()` answers as existing, and no `gate11-probe-*` entry left under the system temp directory (`bash scripts/scratch-run.sh harness-runs/scratch/gate11-aftercheck.mjs` → `model dir exists: true`, `gate11-probe-* left in tmpdir: 0`).

`bash scripts/scratch-run.sh harness-runs/scratch/gate11-probe.mjs mismatch`:

```
case: mismatch
local version: 0.4.0
planted runtime version: 0.3.0
check-floor exit 0
--- stdout ---
### Corpus `fixture-catalog`

| Arm | Mode | recall@1 | recall@3 | recall@5 | MRR | strict recall@5 | strict MRR | p50 ms | p95 ms | cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | — | — | — | — | — | — | — | — | — | awaiting hand run |
| B | `lexical` | 0.444 | 0.889 | 1.000 | 0.657 | 1.000 | 0.606 | 0.5 | 6.9 | local — no billed tokens (0 embed calls, 0 rerank calls) |
| C | `vector` | 0.778 | 1.000 | 1.000 | 0.889 | 1.000 | 0.806 | 6.1 | 9.7 | local — no billed tokens (12 embed calls, 0 rerank calls) |
| D | `fused` | 0.556 | 1.000 | 1.000 | 0.759 | 1.000 | 0.685 | 10.1 | 14.2 | local — no billed tokens (12 embed calls, 0 rerank calls) |
| E | `fused-rerank` | 0.444 | 0.667 | 0.667 | 0.556 | 0.667 | 0.556 | 966.0 | 1232.0 | local — no billed tokens (12 embed calls, 12 rerank calls) |

Arm A is index-first navigation by an agent. It is built and deliberately not run by this eval; its rows are
filled by re-running the eval with one `--transcript` per variant against a hand-run transcript, per the
procedure in `docs/retrieval-eval.md` → `## Running arm A by hand`. The arm A rows, when present, are each
scored from the **first repetition's** transcript of that variant; the spread across repetitions is
hand-written below the end marker.

The `cost` column is not a score, and **the arms' scores are not comparable across rows**: the non-reranking
modes report rank-derived reciprocal-rank-fusion values in the `0.004`–`0.033` range, while the reranking mode
reports calibrated `[0, 1]` cross-encoder scores. Compare recall, MRR and latency across rows; compare scores only
within a row.

corpus fixture-catalog snapshot: { files: 9, chunks: 41 }
check-floor: fixture-catalog met every recorded floor — 8 over 4 arms, snapshot { files: 9, chunks: 41 }

--- stderr ---

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

`bash scripts/scratch-run.sh harness-runs/scratch/gate11-probe.mjs peers-absent`:

```
case: peers-absent
local version: 0.4.0
check-floor exit 4
--- stdout ---

--- stderr ---
check-floor: the retrieval packages cannot be resolved from this checkout's build under cli/dist, so no figure can be taken; missing: @electric-sql/pglite, @electric-sql/pglite-pg_textsearch, @electric-sql/pglite-pgvector, @huggingface/transformers, @modelcontextprotocol/sdk. Run npm ci at the repository root
```
