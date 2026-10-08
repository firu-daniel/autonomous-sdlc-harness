## question_1 — How should this branch proceed, given that Docker and the Python weight cache are missing?
- **raised by:** the `/autonomous-sdlc-harness:branch-start-plan-autonomous` orchestrator, at session start (environment precondition check, before planning — no ledger created, no agent dispatched, no walker started)
- **asked:** Q1 — the task prompt forbids improvising an install, and the host lacked Docker and the Python weight cache, so none of the deliverable's measurements could be taken. The run found:

  | Precondition | Checked with | Result |
  |---|---|---|
  | Both earlier branches landed | `git log` on this branch | ✅ `feat: docs retrieval python backend (#55)` and `feat: docs retrieval backend selection (#57)` are in history |
  | Docker | `which docker`, and `test -x` on `/usr/local/bin/docker`, `/opt/homebrew/bin/docker`, `~/.docker/bin/docker`, `/Applications/Docker.app` | ❌ not found anywhere |
  | Xenova ONNX cache (TypeScript side) | `test -d ~/.cache/autonomous-sdlc-harness/retrieval/models/Xenova/bge-small-en-v1.5` | ✅ present |
  | PyTorch weight cache (Python side) | `test -e ~/.cache/harness-docs-retrieval/models/harness-docs-retrieval-models.json` (the manifest `fetch-models` writes, per `docs-retrieval-service/README.md` → `## Weights, precision and ids`) | ❌ absent at the default path. The run could not read `XDG_CACHE_HOME` / `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE` (the headless profile does not allow `printenv`), so a cache moved by either variable would not have been seen. |

  Options: **(a)** provision the machine (install and start Docker, run `fetch-models` with the `models` extra), then resume; **(b)** run the branch supervised instead — answer "abandon autonomous run"; **(c)** narrow scope to the runner's backend hook and the how-to, recording deliverables 2–7 as not taken.
- **answered:** abandon autonomous run
- **carries beyond this branch:** the branch's measurements need Docker and both weight caches on the host, so it does not run unattended on a bare machine — the task prompt's own condition, which the ruling upheld rather than worked around.
