### Task 22 — Respell `docs/github-run-control.md` and `docs/github-issue-trigger.md`

**Goal:** Make the two adopter guides for GitHub-started and GitHub-steered runs teach the new trigger label, handle, state labels, marker and workflow files. That includes the `gh label create` command an adopter copies, and their *Verified in Gate 12 round N* records, as clarification answer Q1 (b) requires.

**Depends on:**
- Task 1: the trigger label `devscene` (`HARNESS_TRIGGER_LABEL`'s default), `@dev-scene`, `<!-- devscene` and `devscene: <state>`. `init`'s report prints `gh label create devscene --description "Start a harness run from this issue"`.
- Task 2: `devscene-trigger.yml` and `devscene-control.yml` (with `devscene-run.yml` and `devscene-resume.yml`), and their `name:` values.
- Task 3: `remote-run.sh`'s comment texts.

**Where this task stops.** It respells names only. No date, version, run id or count changes. `LEGACY_TRIGGER_LABEL` (`harness`) and every `HARNESS_*` name stay (`## Context` → *What keeps its current spelling*).

### Targets

- `docs/github-run-control.md`
- `docs/github-issue-trigger.md`

**Work:**

- [ ] Disclosure. Both documents carry dated *Verified in Gate 12 round N* records (`docs/github-run-control.md` → `### Verified in Gate 12 round 6` and `### Verified in Gate 12 round 7`; `docs/github-issue-trigger.md` → `### Verified in Gate 12 round 5`). So add `## Context`'s disclosure sentence once to each, byte for byte, directly under the document's opening statement of what it is. Neither has the earlier rename's sentence.
- [ ] `docs/github-run-control.md`, from `## The GitHub entry point` through `## 4. The draft pull request`: respell every command example (`@dev-scene pause`, `@dev-scene answer <n>`, …), every mention-boundary example, the marker line and every workflow file name.
- [ ] `docs/github-run-control.md`, from `## 5. Lifecycle comments and state labels` to the end: respell every state label (`devscene: running`, …), the marker, every workflow file and `name:` value, and the Gate 12 round records.
- [ ] `docs/github-issue-trigger.md`:
  - respell the label-creation command to `gh label create devscene`, kept in its fenced block (`harness-runs/lessons.md` → *Adopter-facing documentation*);
  - respell every *"`sdlc-harness` when unset"* default, the label filter in `## 1. What happens when an issue is labelled`, and the *A repository already using `harness`* paragraph's current-label half; that paragraph's `harness` legacy label stays;
  - respell every workflow file name and the `### Verified in Gate 12 round 5` record.
- [ ] In both, leave every `sdlc-harness/` `stateDir` and every `HARNESS_*` name unchanged.

**Verification:**

- `grep -nE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|harness-(trigger|run|control|resume)\.yml" docs/github-run-control.md docs/github-issue-trigger.md` prints nothing.
- Every line `grep -nE "sdlc-harness([^/]|$)" docs/github-run-control.md docs/github-issue-trigger.md` prints names the `stateDir` default. None names a label.
- `grep -n "have had those names respelled to the current ones" docs/github-run-control.md docs/github-issue-trigger.md` shows the sentence once in each file.
- `grep -n "gh label create devscene" docs/github-issue-trigger.md` shows the command on its own line inside a fenced block.
