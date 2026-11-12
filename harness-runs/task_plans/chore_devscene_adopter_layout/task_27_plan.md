### Task 27 — Respell `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `ROADMAP.md` and `llms.txt`

**Goal:** Make the root documents and the model-facing index tell an adopter the new names. The config file is `devscene.config.json`, scripts land in `devscene-scripts/`, the state directory defaults to `devscene/`, the setup command is `/devscene:analyze`, and the mention command is `/devscene:read-mention`.

**Depends on:** Tasks 1–15, which make every name these documents describe true of the code and the tree. That includes the moved `schemas/devscene.config.schema.json`, `examples/devscene.config.json` and `examples/notes-app/devscene/`, which these documents link to.

**Where this task stops.** No sentence says a name changed or names an old value (`## Context`, first paragraph). Every command an adopter runs that this task respells stays in its fenced block, one command per line (`harness-runs/lessons.md` → *Adopter-facing documentation*). `scripts/check-llms-txt.sh` holds `llms.txt`'s links to the tree at Phase G, so a link this task respells must name a file that exists.

### Targets

- `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `ROADMAP.md`, `llms.txt`

**Work:**

- [ ] `README.md`: apply rows 1–6 of `## Context`'s spelling table everywhere, the `examples/notes-app/devscene/` mention and the link to the example's `devscene.config.json` included.
- [ ] `ARCHITECTURE.md`, `CONTRIBUTING.md`: apply every row they carry. `CONTRIBUTING.md`'s list of this repository's own adoption reads `devscene.config.json`, which is true once the maintainer's cutover lands before merge.
- [ ] `ROADMAP.md`: the 0.6.6 row reads *"New adoptions write their scripts to `devscene-scripts/`"*. The checklist row names `/devscene:analyze`. The two *"Interactive session vs harness run"* lines are prose under row 12 and stay.
- [ ] `llms.txt`: apply rows 1, 3, 6 and 7 (*"The scripts land in `devscene-scripts/`"*, every `/devscene:analyze`, `/devscene:read-mention`, *"the JSON Schema for `devscene.config.json`"*). Keep every link target a path that exists in this tree.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|harness-task-offer|harness-no-offer|harness-analyze|harness-read-mention' -- README.md ARCHITECTURE.md CONTRIBUTING.md ROADMAP.md llms.txt` prints nothing.
- `git grep -nE 'harness (run|pause|stop|control|trigger)( [^a-z ]|[^ a-z]| [a-z]+_)' -- README.md ARCHITECTURE.md CONTRIBUTING.md ROADMAP.md llms.txt` prints only the two `ROADMAP.md` prose lines.
- Every repository path that `llms.txt` links resolves under `git ls-files`.
