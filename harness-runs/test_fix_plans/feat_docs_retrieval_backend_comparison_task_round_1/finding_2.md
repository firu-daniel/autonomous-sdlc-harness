### 2. Gate 6a scans the gitignored scratch directory, where the branch's own capture protocol writes machine paths

**File:** `scripts/run-gates.sh` (`machine_path_hits`): "--exclude-dir=test_run_logs | grep -v"; and `docs/development.md` → `**Gate 6 — self-containment.**`: "grep -rn \"$HOME\" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=test_run_logs"

**Failing test:** none: gate 6a, no machine paths

**Failure, from the log** (an excerpt; machine paths rewritten, long JSON lines cut with `…`):

```
  FAIL  6a no machine paths (printed output, which is the finding)
        ./harness-runs/scratch/vector-pg-down.out:1:file://evals/docs-retrieval/vector-agreement.mjs:72
        ./harness-runs/scratch/vector-pg-down.out:9:    at file://harness-runs/scratch/vector-probe.mjs:5:22
        ./harness-runs/scratch/vector-url.out:7:    at assertComposeDatabase (file://evals/docs-retrieval/vector-agreement.mjs:83:5)
        ./harness-runs/scratch/backend-comparison/agent-session-typescript.jsonl:1:{"type":"system","subtype":"init",… "plugins":[{"name":"autonomous-sdlc-harness","path":"<home>/Work/autonomous-sdlc-harness/plugin",…
        ./harness-runs/scratch/backend-comparison/footprint.txt:1:225M	<home>/.cache/harness-docs-retrieval/models
        ./harness-runs/scratch/backend-comparison/footprint.txt:2: 56M	<home>/.cache/autonomous-sdlc-harness/retrieval/models/Xenova
        ./harness-runs/scratch/backend-comparison/footprint.txt:3:929M	<home>/.cache/harness-docs-retrieval/venvs/1297741952
        ./harness-runs/scratch/backend-comparison/footprint.txt:49:  "dataDir": "harness-runs/scratch/docs_index",
        ./harness-runs/scratch/backend-comparison/agent-session-python.jsonl:1:{"type":"system","subtype":"init",… (same shape as the TypeScript session line)
        ./harness-runs/scratch/backend-comparison/agent-session-typescript.failed.jsonl:1:{"type":"system","subtype":"init",… (same shape)
```

The full output has 17 hits, and every one is in a file under `harness-runs/scratch/`: the probe outputs `vector-pg-down.out` and `vector-url.out`, plus `backend-comparison/` → `agent-session-typescript.jsonl`, `agent-session-python.jsonl`, `agent-session-typescript.failed.jsonl` and `footprint.txt`. No tracked file appears.

Class: new this round (first gate round on this branch; no earlier log to compare against).

**Diagnosis.**

- Gate 6a exists, in `docs/development.md` §5's words, to stop a machine path reaching a commit. It greps the whole working tree for `$HOME` and excludes only `node_modules`, `dist`, `.git` and `test_run_logs`.
- `harness-runs/scratch/*` is gitignored except for its `README.md` (`.gitignore` → the `harness-runs/scratch/*` / `!harness-runs/scratch/README.md` pair). `harness-runs/scratch/README.md` says the contents are machine-local and never committed. None of the hits can reach a commit.
- This branch's own documented protocol writes machine paths into that directory. `docs/retrieval-eval.md` → `### Measuring the Python backend against the TypeScript one` tells the operator to put every capture under `harness-runs/scratch/backend-comparison/`. Those captures include `du -sh "${XDG_CACHE_HOME:-$HOME/.cache}/…" >> …/footprint.txt` and `claude -p … --output-format stream-json --verbose > …/agent-session-*.jsonl`, whose init line records absolute plugin and cwd paths. The captures therefore name the home directory by construction. Deleting them would only clear the gate until the next time the protocol is run.
- `test_run_logs` is already excluded for the same reason: it is machine-local, gitignored and carries machine paths by construction. `scratch` meets the same conditions.

**Fix.**

1. `scripts/run-gates.sh` → `machine_path_hits`: add `--exclude-dir=scratch` after `--exclude-dir=test_run_logs`. The function becomes:

   ```bash
   machine_path_hits() {
     grep -rn "$HOME" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=test_run_logs --exclude-dir=scratch | grep -v '^\./\.git:[0-9][0-9]*:'
   }
   ```

   Extend the comment block above it, which currently ends with the `test_run_logs` sentence. Add one sentence saying that `scratch` holds throwaway probes and the backend-comparison captures that `docs/retrieval-eval.md` writes there. Those are gitignored and machine-local by construction (a `du` of the model caches, a stream-json session's init line), so 6a would otherwise fail on files that can never be committed.

2. `docs/development.md` → `**Gate 6 — self-containment.**`: make the same change to the first command in the fenced block, so the documented command and the script stay identical. In the paragraph after it, extend the sentence that begins "`--exclude-dir=test_run_logs` skips the Run gates phase's logs" with a matching clause for `--exclude-dir=scratch`. The clause names `harness-runs/scratch/`, says its contents are gitignored by construction, and says the backend-comparison protocol in `docs/retrieval-eval.md` writes `$HOME`-bearing captures there.

- [ ] Change nothing under `harness-runs/scratch/`. This fix belongs in the gate, not in deleting the operator's captures.
- [ ] Do not add a test that greps `scripts/run-gates.sh` for the new flag. Nothing in `cli/test` asserts gate 6a's command text today.
- [ ] Verify by re-reading both edited lines side by side, so the script's command and the documented command match character for character. Do not run the gate script. The Run gates phase re-runs 6a.
