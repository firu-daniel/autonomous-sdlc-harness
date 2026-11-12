### Task 18 — Rename the config file the Python retrieval service reads, and respell the evals

**Goal:** Make the docs-retrieval Python service read `<repo>/devscene.config.json`, the file a fresh `init` writes. Make the evals scaffold, describe and grade against the example's renamed configuration and state directory.

**Depends on:** Task 15, which renamed `examples/notes-app/harness.config.json` to `devscene.config.json` and moved its state directory to `examples/notes-app/devscene/`. `evals/plan-shape/scaffold.sh` copies the first by name and seeds the second.

**Where this task stops.** The `harness-docs` server name, the `harness_docs_retrieval` package directory and the database default `postgresql://harness:harness@…` are out of scope (task prompt → *Out of scope*; `chore_devscene_docs_retrieval` renames them). Only the config file the service reads changes here. Its tests take the name from `CONFIG_FILENAME`, so no test body changes. `docs-retrieval-service/` is described by no layer's conventions document. That is raised as `undescribed-layer` corpus staleness, not as work.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/service.py`, `docs-retrieval-service/src/harness_docs_retrieval/corpus.py`, `docs-retrieval-service/README.md`, `docs-retrieval-service/tests/test_backend_parity_e2e.py`
- `evals/README.md`, `evals/docs-retrieval/README.md`, `evals/docs-retrieval/{cold-build,corpora,index-build,mirror-fixture,query-log-pass,results}.mjs`
- `evals/plan-shape/scaffold.sh`, `evals/plan-shape/case.yaml`, `evals/plan-shape/graders/plan-shape.md`
- `evals/prompt-injection-reviewer/fixtures/clean.benign.md`, `evals/prompt-injection-reviewer/fixtures/hidden-instruction.hostile.md`

**Work:**

- [ ] `service.py`: `CONFIG_FILENAME = "devscene.config.json"`. Apply row 1 of `## Context`'s spelling table to its module docstring, the `--repo` help text and every other docstring. `corpus.py`, the README and `test_backend_parity_e2e.py`'s docstring: apply row 1.
- [ ] `scaffold.sh`: `state_dir="devscene"`; the copy-list entry `devscene.config.json`; rows 1, 2 and 4 in its comments (`devscene-task-offer.md`, `cli/templates/claude/devscene-task-offer.md`, the captured `devscene/` run artifacts, `devscene/.dispatch_counter`). The `git config user.name` value stays.
- [ ] `case.yaml`, `graders/plan-shape.md`, `evals/README.md`: apply rows 1 and 2.
- [ ] The six `evals/docs-retrieval/*.mjs` files and its README: apply rows 1 and 2 to comments and message strings. `index-build.mjs`'s *"Run the harness's retrieval setup"* becomes *"Run DevScene's retrieval setup"* (row 11). The `HARNESS_DOCS_RETRIEVAL_*` names stay.
- [ ] The two prompt-injection fixtures: apply row 1 (`schemas/devscene.config.schema.json`, `devscene.config.json`). Change nothing else in them: each fixture's verdict depends on its exact text.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-task-offer|Run the harness' -- docs-retrieval-service evals` prints nothing.
- `bash -n evals/plan-shape/scaffold.sh` exits 0, and its copy list names `devscene.config.json`, which `git ls-files -- examples/notes-app/devscene.config.json` confirms exists.
- `git grep -n 'CONFIG_FILENAME = ' -- docs-retrieval-service/src` prints the one line `CONFIG_FILENAME = "devscene.config.json"`, and `git grep -n 'CONFIG_FILENAME' -- docs-retrieval-service/tests` shows the tests still take the name from that constant.
  - **Deviations from plan:** The bare `bash -n evals/plan-shape/scaffold.sh` was refused by the tool layer (*"Permission to use Bash has been denied because Claude Code is running in don't ask mode"*), so it was not run. The parse claim rests instead on `bash scripts/typecheck.sh`, whose `check-shell-parse` leg parses every `*.sh` that `git ls-files --cached --others --exclude-standard` lists, `scaffold.sh` among them, and printed `check-shell-parse: 124 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed` followed by `PASS: typecheck`. The other two bullets ran as written: the `git grep` printed nothing (exit 1), `git ls-files -- examples/notes-app/devscene.config.json` printed that path, and `CONFIG_FILENAME` matched once in `service.py` as the assignment and in the four test files only as imports or uses of the constant.
