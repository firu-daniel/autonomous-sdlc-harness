### 1. The new shared `## Read first` lead says no other layer's conventions document is needed, which contradicts the writer's `<convention_symbols>` row and the reviewer's backend-name vocabulary rule

**Sites.** The same sentence appears in two files. It is the lead line of each `## Read first` section, and it stands alone on its line:
- `plugin/agents/ui-tests-plan-writer.md` → `## Read first`: "Read these; no other layer's conventions document is needed:"
- `plugin/agents/ui-tests-plan-reviewer.md` → `## Read first`: "Read these; no other layer's conventions document is needed:"

The family check probe lists this sentence as a `SHARED` string, in `harness-runs/scratch/ui_tests_qa_family_check.mjs` → `const SHARED`, entry `[[W, R], 'Read these; no other layer\'s conventions document is needed:']`.

**Problem.** At base `13a2ed4c`, each file opened `## Read first` with a hedge: *"you do not need every layer's conventions document **in depth**"*. Tasks 2 and 5 replaced that hedge with a categorical rule: *no other layer's conventions document is needed*. Each file still carries a rule that depends on reading another conventions document, and nothing in the diff touches those rules:
- **Writer.** `## Resolved values` → `<convention_symbols>` (a frozen row) says to read the mandated logger *"off the conventions documents `<layer_path_map>` names"*, meaning all of them. A project often names its logger in the shared or catch-all conventions document rather than in the surface layer's. `## Process` step 3 writes the expected console state against that logger.
- **Reviewer.** `### Backend-name parity (Must Fix)` says the external-call and stored-query vocabulary is *"read off the owning layer's `layers[].conventions` document via `<layer_path_map>`"*. The layer that owns the wire surface is usually a data or service layer, not the surface layer.

Each definition now gives two instructions that cannot both be followed. An agent that obeys the lead line skips the document its own later rule names. An agent that obeys the later rule breaks the lead line. Neither file says which one wins. The grade is Should Fix, not Must Fix, because the binding checks still work either way: backend names are graded against the story and task files, and console state against "no errors logged". So no consumer decision turns on it. The cost is a wrong rule in two durable definitions that loads on every dispatch.

**Proof.**
- `git show 13a2ed4c:plugin/agents/ui-tests-plan-reviewer.md` → `## Read first` opens *"UI tests are **black-box / behavioural** — same as the writer, you do not need every layer's conventions document in depth."*
- The writer's base text opens *"UI tests are **black-box behavioural** — you do not need every layer's conventions document in depth; …"*
- At `HEAD`, both are replaced by the 9-word sentence quoted above.
- At `HEAD`, `grep -n "owning layer's" plugin/agents/ui-tests-plan-reviewer.md` still returns the `### Backend-name parity` bullet.
- At `HEAD`, `grep -n "convention_symbols" plugin/agents/ui-tests-plan-writer.md` still returns the `## Resolved values` row with "Read it off the conventions documents `<layer_path_map>` names".

**Fix.** Make one identical edit in both files, so the `SHARED` string stays shared.

In `plugin/agents/ui-tests-plan-writer.md` and in `plugin/agents/ui-tests-plan-reviewer.md`, replace this whole line:

```text
Read these; no other layer's conventions document is needed:
```

with:

```text
Read these; other layers' conventions documents only where cited:
```

Both lines are 9 whitespace-separated words, so neither definition's word count rises. The new line keeps the black-box scoping, and it admits exactly the reads each file already cites: the writer's `<convention_symbols>` row and the reviewer's `### Backend-name parity` bullet. Change nothing else in either `## Read first` section.

Then, in the gitignored probe `harness-runs/scratch/ui_tests_qa_family_check.mjs` → `const SHARED`, replace the entry string `'Read these; no other layer\'s conventions document is needed:'` with `'Read these; other layers\' conventions documents only where cited:'`. A later run of the probe then checks the new text. The probe is never committed, so this step does not touch the diff. If the file is absent, skip this step.
