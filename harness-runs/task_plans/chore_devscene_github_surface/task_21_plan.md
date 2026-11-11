### Task 21 — Respell `docs/development.md`, the Gate 12 rounds and Gate 14 included

**Goal:** Apply the spelling table to the whole of `docs/development.md`, as clarification answer Q1 (b) requires: its present-tense gate descriptions, the not-yet-run sandbox round's procedure, and the dated Gate 12 round records alike. Disclose the respelling once.

**Depends on:**
- Tasks 1 and 2: the names this document now describes. They are the trigger label `devscene`, the state labels `devscene: <state>`, the handle `@dev-scene`, the marker `<!-- devscene`, the files `devscene-{trigger,run,control,resume}.yml` and the `name:` values `devscene-{trigger,run,control,resume}`.
- Task 5: the fixture `cli/test/fixtures/harness-control-0.6.1.yml` is now 0.6.1's control workflow with only its job-level `if:` line respelled.
- Task 17: gate 14b's label is `14b 0.6.1's devscene-control.yml is refused`, and `check-rendered-workflows.mjs` expects the four `devscene-*.yml` files.
- Task 18: the sandbox-round scripts look for `devscene-run.yml`.

**Where this task stops.** It respells names only. No date, version, run id, count or other wording in a record changes. The other `docs/` files are Tasks 22–24's.

### Targets

- `docs/development.md`

**Work:**

- [ ] Add `## Context`'s disclosure sentence once, byte for byte, as its own paragraph directly after this document's existing *"Measurements recorded in this document before the product was renamed DevScene …"* sentence. The Gate 12 rounds carry dates and CLI versions, so the sentence is owed.
- [ ] Respell **Gate 12's introduction and Rounds 1–8**, from `**Gate 12 — remote execution against a real GitHub repository.**` up to the paragraph before `**Round 9 — 2026-10-06, CLI 0.6.3.**`. That covers every label, state label (`the label moved to devscene: running`), handle, marker, workflow file and `name:` value. Leave sandbox repository slugs such as `firu-daniel/harness-g…` unchanged, along with every `HARNESS_*` name and every `sdlc-harness/` `stateDir`.
- [ ] Respell **Rounds 9–12**, from `**Round 9 — 2026-10-06, CLI 0.6.3.**` up to the paragraph before `**The sandbox series round (#170 step 4) — not yet run.**`, the same way.
- [ ] Respell **the sandbox series round through the end of Gate 12**, from `**The sandbox series round (#170 step 4) — not yet run.**` up to `**Gate 13 — the Python docs-retrieval service.**`, including its procedure's `gh` commands, which stay in their fenced blocks. Also the workflow-listing check that passes *"when `devscene-run`, `devscene-resume`, `devscene-trigger` and `devscene-control` are each listed by that name"*.
- [ ] Respell **everything outside Gate 12**: Gate 14 and every later section. In Gate 14, *"14b must refuse `cli/test/fixtures/harness-control-0.6.1.yml`, the file 0.6.1 rendered"* becomes *"…, the file 0.6.1 rendered with its job-level `if:` line respelled to the current names"*. Its fixture path stays. Respell *"exactly the four harness workflows"* only where it names files.

**Verification:**

- `grep -nE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|harness-(trigger|run|control|resume)\.yml" docs/development.md` prints nothing. `grep -n "listed by that name" docs/development.md` shows the four `devscene-*` workflow names.
- Every line `grep -nE "sdlc-harness([^/]|$)" docs/development.md` prints names the `stateDir` default or the earlier product name. None names an issue label, such as the round that created the label, which now reads *"`devscene` was created"*.
- `grep -n "have had those names respelled to the current ones" docs/development.md` shows the sentence once, in the paragraph directly after the earlier rename sentence.
- `git diff --word-diff=porcelain -- docs/development.md` adds no date, version, run id or number. Every changed word is one of the spelling table's new names or part of the disclosure sentence or the Gate 14 fixture clause.
