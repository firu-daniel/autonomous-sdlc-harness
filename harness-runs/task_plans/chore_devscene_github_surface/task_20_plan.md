### Task 20 — Respell `README.md` and `ARCHITECTURE.md`

**Goal:** Make the two root documents an adopter reads first name the new trigger label, handle, state labels and workflow files.

**Depends on:**
- Task 1: the trigger label `devscene`, the handle `@dev-scene` and the state labels `devscene: <state>`.
- Task 2: the workflow files `devscene-trigger.yml`, `devscene-run.yml`, `devscene-control.yml` and `devscene-resume.yml`, which `init` now writes.

**Where this task stops.** `llms.txt` carries none of the old names (`## Scope register` row 67) and is not a target. Neither document carries a dated record at the lines respelled, so neither gets `## Context`'s disclosure sentence.

### Targets

- `README.md`
- `ARCHITECTURE.md`

**Work:**

- [ ] `README.md`: change *"labelling an issue `sdlc-harness` starts a run"* to *"labelling an issue `devscene` starts a run"*. Respell any other label, handle or workflow name in that section the same way, and keep every command in its fenced block (`harness-runs/lessons.md` → *Adopter-facing documentation*). Leave every `sdlc-harness/` `stateDir` mention unchanged.
- [ ] `ARCHITECTURE.md`: in the *No forge coupling beyond GitHub* bullet, respell `devscene-trigger.yml`, `devscene-control.yml`, the `` `@dev-scene` comment commands `` and the `` `devscene: <state>` label ``. In the `forge` paragraph, respell `devscene-trigger.yml` and `devscene-control.yml`.

**Verification:**

- `grep -nE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|harness-(trigger|run|control|resume)\.yml" README.md ARCHITECTURE.md` prints nothing.
- `grep -nE "sdlc-harness([^/]|$)" README.md ARCHITECTURE.md` prints nothing.
