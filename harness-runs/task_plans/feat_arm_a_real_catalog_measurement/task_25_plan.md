### Task 25 — Correct every statement the run made false, move the roadmap row, and re-derive the scope register

**Goal:** Leave no document in the tree saying that arm A awaits a hand run, that retrieval is "not yet measured", or that the verdict is open, now that the run is recorded and the decision taken — move the `ROADMAP.md` docs-catalog-retrieval row off `Open` or state what still holds it there — and re-run the story index's scope-register derivations to show nothing was missed.

**Depends on:** Task 20, whose `docs/retrieval-eval-results.md` → `## The decision, applied to the real catalog` records the outcome (**on by default**, **stays opt-in**, **withdrawn**, or *cannot be applied* with the missing measurement) and, for the first and third, roadmap item **18** in `docs/development.md` → `## 6. The roadmap this tree defers to`; Task 16, which renamed the arm A section to **`## Arm A — the real-catalog hand run`** and re-pointed its two citations in `docs/retrieval-eval.md`; and Tasks 22–24, which finished the calibration, the package's own statements (`cli/README.md`, `cli/src/retrieval/queryLog.ts`) and the D-versus-E section. Read the outcome from Task 20's section; every sentence below states **that** outcome.

### Targets

- `ROADMAP.md` — the index row and the *Docs-catalog retrieval* row.
- `README.md` — the docs-retrieval statement in the verbs paragraph, and the `docs/retrieval.md` and `docs/retrieval-eval-results.md` bullets of the documents list.
- `docs/retrieval.md` — the opening paragraph and the measured-facts bullet *"measured against `fused` on both corpora"*.
- `docs/retrieval-eval.md` — `## The decision rule`'s paragraph ending *"still awaits the arm A hand run"*, and `## Running arm A by hand`'s closing *"What gate 10 settled, and why this hand run is still owed."* paragraph.
- `docs/cli.md` §11 opening paragraph, `docs/config.md` §5 `docs.retrieval` row, `evals/README.md`'s `docs-retrieval/` bullet (*"labelled queries a human wrote"*), `llms.txt`'s `cli/` and `docs/retrieval.md` entries, and `schemas/harness.config.schema.json` → `docs.retrieval`'s `description` text only.

**Work:**

- [x] **`ROADMAP.md`**: the *Docs-catalog retrieval* row's status moves off `Open` to what the outcome makes it, or stays `Open` with the row saying exactly what holds it there (for *stays opt-in*, the figure a later change must move; for *on by default* / *withdrawn*, roadmap item 18 in `docs/development.md` §6); the row's description sentence that the eval *"decides it against the index-first navigation used today"* gains that it has now decided, citing the decision section. The index row at the top agrees.
- [x] **The retrieval documents**: `docs/retrieval.md`'s opening replaces *"not yet measured … arm A, which is built and deliberately not run"* with the measured comparison and its outcome, citing `## The decision, applied to the real catalog` and restating none of its figures; its measured-facts bullet names the real catalog beside the two committed corpora. `docs/retrieval-eval.md`: the decision-rule paragraph says the verdict has been taken and where, and the closing paragraph of `## Running arm A by hand` is rewritten to record that the real-catalog hand run was taken, when, and where its record is — the rule text itself and Task 3's combination sub-heading are not touched.
- [x] **The adopter-facing statements** — `README.md`, `docs/cli.md` §11, `docs/config.md` §5's `docs.retrieval` row (which also names `feat_docs_retrieval_eval` as *the follow-up*), `llms.txt`, the schema's `docs.retrieval` description, and `evals/README.md` (the real catalog's set is model-authored and operator-approved, not human-written) — each says, in its own register and length, that retrieval's relevance against agent navigation has been measured on a real catalog, with the outcome and a pointer. **Prose only**: no configuration key, default, tool name, verb or check id changes (`harness-runs/lessons.md` → the adopter-vocabulary rule); the schema change is its `description` string alone.
- [x] **Re-derive the scope register.** Re-run derivation entries A–G of `harness-runs/story_plans/feat_arm_a_real_catalog_measurement_story_plan.md` → `## Scope register` verbatim and walk entry H; every site each reaches must be a register row, and every `change` row's site must now read true. Entry A must reach no sentence claiming arm A awaits a run or retrieval is unmeasured, other than the generated *awaiting hand run* cells of the `fixture-catalog` and `self-docs` tables (register row 8, true for those corpora). Report any site outside the register in the return rather than editing past this task's targets.

**Verification:**

- The output of derivation entry A, re-run verbatim, is ⊆ the register's rows, and each hit it returns is either a `no-change` row or now states the recorded outcome.
- `bash scripts/run-gates.sh`, without a pipe: `6c llms.txt links resolve on main` and every other gate show no new failure; `npm run validate:config` passes after the schema description edit.
- Every edited statement's outcome word matches `## The decision, applied to the real catalog`'s outcome line.
