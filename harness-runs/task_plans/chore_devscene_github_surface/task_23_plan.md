### Task 23 — Respell `docs/remote-execution.md`, `docs/cli.md`, `docs/config.md` and `docs/watcher.md`

**Goal:** Make the remote-execution guide and the CLI, configuration and watcher references name the new workflow files, trigger label, handle and state labels. That includes `doctor`'s documented checks and their `gh label create` remedy, and the dated records these documents carry (clarification answer Q1 (b)).

**Depends on:**
- Task 1: the trigger label `devscene`, `@dev-scene`, `<!-- devscene`, `devscene: <state>`, and the `doctor` messages built from them. The missing-label remedy reads `` `gh label create devscene` ``.
- Task 2: `devscene-{trigger,run,control,resume}.yml`.
- Task 5: the repair route *"replaces a devscene-control.yml that 0.6.1 wrote"*.
- Task 6: the `--upgrade-workflows` summary and the `doctor` help line.

**Where this task stops.** It respells names only. No date, version, run id or count changes. `HARNESS_*` names, `LEGACY_TRIGGER_LABEL` (`harness`) and the `stateDir` default stay.

### Targets

- `docs/remote-execution.md`
- `docs/cli.md`
- `docs/config.md`
- `docs/watcher.md`

**Work:**

- [ ] Disclosure. `docs/remote-execution.md` carries dated *Verified in Gate 12 round N* records, so add `## Context`'s disclosure sentence once, byte for byte, as its own paragraph directly after its existing *"Measurements recorded in this document before the product was renamed DevScene …"* sentence. For `docs/cli.md`, `docs/config.md` and `docs/watcher.md`, apply `## Context`'s rule at each respelled line: add the sentence once, directly under the opening statement, exactly when a respelled line carries a `YYYY-MM-DD` date, a `0.x.y` version or a Gate 12 round number.
- [ ] `docs/remote-execution.md`, from `## Turning it on, in short` through `## 6. What is not verified here` and its `### Verified in Gate 12 round …` sections: respell every workflow file, handle (`@dev-scene resume`), state label (`devscene: <state>`) and marker.
- [ ] `docs/remote-execution.md`, from `## 7. Turning it on` to the end:
  - respell the workflow files, the `### Every secret and variable` table's `HARNESS_TRIGGER_LABEL` row (*"`devscene-trigger.yml`'s job filter …"*, default *"`devscene`; `harness` in a workflow written by an earlier release"*), and the `### Upgrading` exception (*"a `devscene-control.yml` that 0.6.1 wrote"*);
  - keep every command in its fenced block.
- [ ] `docs/cli.md`:
  - respell the trigger-label step and its fenced `gh label create devscene --description "Start a harness run from this issue"`;
  - respell the comment-command sentence (`@dev-scene`), the re-run-table rows for `.github/workflows/devscene-*.yml`, and the `remote-execution` / `remote-github` / `forge` check descriptions, *"else `devscene`"* and *"re-renders it to `devscene`"* included.
- [ ] `docs/config.md`: respell the `forge` row's label, handle and workflow names, and leave its `stateDir` row's `sdlc-harness/` default unchanged. `docs/watcher.md`: respell its two `harness-run.yml` mentions, one of them in the run-job table row.

**Verification:**

- `grep -nE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|harness-(trigger|run|control|resume)\.yml|create sdlc-harness" docs/remote-execution.md docs/cli.md docs/config.md docs/watcher.md` prints nothing.
- Every line `grep -nE "sdlc-harness([^/]|$)" docs/remote-execution.md docs/cli.md docs/config.md docs/watcher.md` prints names the `stateDir` default. None names a label.
- `grep -n "have had those names respelled to the current ones" docs/remote-execution.md` shows the sentence once, after the earlier rename sentence.
- `grep -n "gh label create devscene" docs/cli.md` shows the command on its own line inside a fenced block.
