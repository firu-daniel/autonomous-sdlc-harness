### Task 1 — Add the route-2 variant and the ad-hoc corpus route to `evals/docs-retrieval/bm25-refresh-rule.mjs`

**Goal:** Give the refresh-level module the two things the measurements need, without changing anything it does today:

- **A route-2 variant.** `REINDEX INDEX chunks_bm25` is issued wherever the candidate rule issued the spill, and in the `unchanged` scenario. That is, after the last refresh of every one of the six scenarios.
- **An ad-hoc corpus A**, composed from an operator's own paths, so the user can take the real-shape figure on the private 1,960-chunk catalog (`gate10-catalog`).

The task prompt asks for both in this module, not in a new one (Leads, **How.**: *"Add the variant there rather than a new module"*).

**Where this task stops.** It changes the instrument only. It takes no recorded measurement, writes no document under `docs/`, and touches nothing under `cli/`. Task 2 runs the variant on both backends and both corpora. Task 3 documents the new flags in `docs/retrieval-eval.md` and writes the hand-run leg in `docs/development.md`. **Run without the new flags, the module must behave byte-for-byte as it does today.** The 1.3.1 and 1.5.1 parts of `docs/retrieval-eval-results.md` cite its current commands as their method.

### Targets

- `evals/docs-retrieval/bm25-refresh-rule.mjs`: the variant, the ad-hoc corpus flags and the header.
- `evals/docs-retrieval/README.md` → `## The modules`: the `bm25-refresh-rule.mjs` row.

**Work:**

- [ ] **`--end-state <candidate|route-2>`**, defaulting to `candidate`.
  - Under `route-2`, every scenario issues `BM25_HISTORY_STATEMENTS.reindex` (imported from `evals/docs-retrieval/bm25-history.mjs`, never retyped) after its last refresh.
  - The candidate decision `endStateRule` returns is still computed and printed beside the statement actually issued, so a route-2 reading names what the candidate rule would have done. `endStateRule` itself and the three reference forms are unchanged.
  - The rendered summary's first lines name the end state that ran, for example an `end state: route-2` line after the `pg_textsearch:` line, so a capture says which variant produced it.
  - An unknown value is refused by name, listing both values.
- [ ] **The ad-hoc corpus A**: `--repo <path>`, `--docs-root <dir>`, `--conventions <file>` (repeatable), `--corpus-id <id>` and `--queries <file>`, given **instead of** `--corpus`.
  - Resolve and validate them through `evals/docs-retrieval/args.mjs` → `parseArgs` and `evals/docs-retrieval/corpora.mjs` → `corpusConfig`, so that every rule those modules state holds unchanged: `--corpus` and `--docs-root` are exclusive, `--corpus-id`'s pattern and reserved ids, a query set defaulting to `evals/docs-retrieval/queries/<corpus-id>.jsonl` in this checkout, and `--queries` required for an unnamed corpus. Restate none of those rules here. One way: split this launcher's own flags (`--backend`, `--other`, `--capture`, `--end-state`) from the corpus flags, and forward the corpus flags to `parseArgs`.
  - `measureRefreshRule` takes the resolved corpus and its queries path. Every refusal against `BUILT_IN_CORPORA` that now guards corpus A applies only to a built-in id.
  - `--other` stays a built-in id, and the existing key-collision refusal between A and B is kept as it is.
  - `--capture` still resolves against **this** checkout, never against `--repo`.
  - The rendered `corpus A:` line names the ad-hoc id with its `{ files, chunks }` stamp, and never its path.
- [ ] **The header.** Amend the module header for the variant and the ad-hoc corpus. Keep its rule sentence ("the rule's statements are issued by hand, because the shipped refresh does not issue them yet …"): it is still true on this commit, and Task 10 amends it after the fix lands. State in the header that `--end-state route-2` is the route the recommendation proposes, measured with its statement issued by hand.
- [ ] **`evals/docs-retrieval/README.md`**: amend the `bm25-refresh-rule.mjs` row to name the route-2 variant and the ad-hoc corpus A, in the row's own style. Nothing else in the file changes.

**Verification:**

- `npm run build` succeeds. Create `harness-runs/scratch/bm25-refresh-rule.mjs` as `docs/retrieval-eval.md` → `### The BM25 index-state probe` gives it (the two-line launcher), if it is absent.
- **The default is unchanged.** Run the existing TypeScript `fixture-catalog` command from that section, with `--capture harness-runs/scratch/fix-bm25/t1-candidate.txt`:

  ```
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-refresh-rule.mjs --backend typescript --corpus fixture-catalog --other self-docs --capture harness-runs/scratch/fix-bm25/t1-candidate.txt
  ```

  Each scenario's decision, statement and `≠ ref` counts are those of `docs/retrieval-eval-results.md` → `#### The candidate end-state rule, at refresh level, on 1.5.1`, the first table. The one exception is `other-corpus`'s `deleted` input, which is corpus B's chunk count and moves with `self-docs`.
- **The ad-hoc route reproduces the built-in one.** Run the same command with corpus A given as `--repo evals/docs-retrieval/corpora/fixture-catalog --docs-root docs --queries ../../queries/fixture-catalog.jsonl` in place of `--corpus fixture-catalog`, capturing to `harness-runs/scratch/fix-bm25/t1-adhoc.txt`. It must report `{ files: 9, chunks: 41 }` and the same decision, statement and `≠ ref` counts in every scenario as the built-in run.
- **The variant runs.** Run the built-in `fixture-catalog` command with `--end-state route-2`, capturing to `harness-runs/scratch/fix-bm25/t1-route-2.txt`. Every scenario's statement is `REINDEX INDEX chunks_bm25`, and each still prints its candidate decision.
- An unknown `--end-state` value, and `--corpus` given together with `--docs-root`, are each refused by name, with nothing run.
- `git diff --stat` lists the two target files only.
- This task needs the TypeScript model cache (`## Context`, **Manual setup required**). If it is absent, stop and say so, and never fetch models.

- **Deviations from plan:**
  - The `end state:` summary line is rendered only when `--end-state` is not the default, so a run without the new flags renders as before (the task's byte-for-byte requirement outranks the example line); a capture with no `end state:` line is a candidate run. Under `route-2` the `statement:` line also carries `(end state route-2; the candidate rule decides <decision>)`.
  - `npm run build` was run through `commands.typecheck` (`bash scripts/typecheck.sh`, which runs `npm run build`): `PASS: typecheck`.
  - The refusal of `--corpus` with `--docs-root` is `evals/docs-retrieval/args.mjs` → `parseArgs`'s own, so its message lists that module's whole flag table, including flags this launcher does not forward (`--arms`, `--k`, …); an unknown flag given to this launcher is refused by the launcher itself, listing its own and the corpus flags.
  - The default-unchanged check rests on the captured TypeScript `fixture-catalog` run matching the 1.5.1 first table scenario by scenario, and on the diff review of the render path; the pre-change module was not re-run beside it for a byte comparison. Corpus B `self-docs` read `{ files: 71, chunks: 829 }`, so `other-corpus`'s `deleted` input is 829.
