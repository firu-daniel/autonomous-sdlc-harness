### Task 21 — Respell `schemas/`, `evals/` and the Python docs-retrieval service

**Goal:** The configuration schema's descriptions, the negative-fixture README, the eval cases and fixtures, and the Python retrieval service's one user-facing message and its two test files name the product `devscene`. Apply the spelling table in the story index's `## Context`.

**Depends on:** Tasks 11 and 2. Task 11 renamed the plugin, so the eval prompt `/devscene:branch-start-plan-semi-autonomous` and the agent `devscene:prompt-injection-reviewer` resolve. Task 2 respelled the CLI's own messages. The Python service's remedy must name the same command: *"run `npx devscene doctor` in this repository"*.

**Where this task stops.** The Python package name `harness_docs_retrieval`, the console script `harness-docs-retrieval` and the `harness-docs` server are out of scope and unchanged. The prompt-injection fixtures are hand-written eval inputs, not recorded captures. Only their `npx …` / `/…:branch-status` spellings change, never the hostile or benign construction around them. `schemas/` changes description text only: no property, `required` entry or pattern changes.

### Targets

- `schemas/harness.config.schema.json`, `schemas/negative/README.md`
- `evals/README.md`, `evals/docs-retrieval/check-floor.mjs`, `evals/plan-shape/case.yaml`, `evals/plan-shape/prompt.md`, `evals/plan-shape/scaffold.sh`, `evals/prompt-injection-reviewer/README.md`
- `evals/prompt-injection-reviewer/fixtures/authority-claim.hostile.md`, `clean.benign.md`, `harness-weakening.hostile.md`, `hidden-instruction.hostile.md`, `unrelated-request.benign.md`, `unrelated-request.hostile.md` (all under that `fixtures/` directory)
- `docs-retrieval-service/src/harness_docs_retrieval/service.py`, `docs-retrieval-service/tests/test_http_app.py`, `docs-retrieval-service/tests/test_service.py`

**Work:**

- [ ] `schemas/harness.config.schema.json`: the three `description` strings naming `'/devscene:harness-analyze'`. `schemas/negative/README.md`: `/devscene:harness-analyze`.
- [ ] `evals/`: `evals/README.md` and `case.yaml` (`/devscene:branch-start-plan-semi-autonomous`, `/devscene:branch-start-plan`, `/devscene:branch-prompt`); `prompt.md`, whose single line becomes `/devscene:branch-start-plan-semi-autonomous`; `scaffold.sh` → `evals@devscene.invalid`; `check-floor.mjs` → `FETCH_MODELS_COMMAND = 'npx devscene docs fetch-models'`; `prompt-injection-reviewer/README.md` → `devscene:prompt-injection-reviewer`.
- [ ] The six fixtures: each `npx autonomous-sdlc-harness …` / `/autonomous-sdlc-harness:branch-status` becomes `npx devscene …` / `/devscene:branch-status`, and nothing else in any fixture changes.
- [ ] `service.py`: the remedy string *"run `npx devscene doctor` in this repository"*. `tests/test_http_app.py` and `tests/test_service.py`: the three expected strings, matching it byte for byte.
- [ ] Parse what was edited: `node -e "JSON.parse(require('fs').readFileSync('schemas/harness.config.schema.json','utf8'))"`, `node --check evals/docs-retrieval/check-floor.mjs` and `bash -n evals/plan-shape/scaffold.sh`, each as one plain command from the checkout root.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- schemas evals docs-retrieval-service` prints nothing.
- `git grep -n -F 'npx devscene doctor' -- docs-retrieval-service` shows the service string and the three test expectations with identical text.
- `git diff -U0 -- schemas/harness.config.schema.json` shows changes only inside `description` values.
  - **Deviations from plan:** The Work item's `bash -n evals/plan-shape/scaffold.sh`, run as one plain command from the checkout root, was refused by the tool layer ("Permission to use Bash has been denied because Claude Code is running in don't ask mode"). The parse claim rests on `bash scripts/typecheck.sh` instead. Its `scripts/check-shell-parse.sh` leg parses every `*.sh` that `git ls-files --cached --others --exclude-standard` lists, `evals/plan-shape/scaffold.sh` included, and it reported `124 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`, then `PASS: typecheck`. The JSON parse and `node --check` ran as written and exited 0.
