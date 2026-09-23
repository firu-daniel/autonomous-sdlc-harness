### Task 24 — Add the real catalog's D-versus-E pair to `## The shipped default against fusion alone`

**Goal:** Record what the third corpus did to the fusion-versus-default trade — the `gate10-catalog` D-versus-E row pair from the same B–E run, the decomposition of arm E's deficit on it, and a rewritten *"What this does not settle"* — as a measurement, taking no decision about the default mode (task prompt `## Out of scope`).

**Depends on:** Task 18, whose `gate10-catalog` generated block carries arm D (`fused`) and arm E (`fused-rerank`) rows and, in its fenced `json`, each arm's `perQuery` entries (`hits`, `abstained`, `rank`, `bestRerankScore`), at the snapshot its provenance states; and Task 21, which regenerated the `fixture-catalog` and `self-docs` blocks — the `self-docs` rows now carry a new snapshot stamp, so the section's existing `self-docs` pair must be re-read from the region rather than kept.

### Targets

- `docs/retrieval-eval-results.md` → `## The shipped default against fusion alone`, below the end marker.

**Work:**

- [ ] **The table**: re-read all four existing rows from the generated region as it now stands, each with its own snapshot stamp (the `self-docs` stamp moved with Task 21; say so beside it rather than presenting old and new as a series), and add the `gate10-catalog` pair — recall@1/3/5, MRR, p50 — with its stamp. Every figure read off the region, none retyped from elsewhere.
- [ ] **The decomposition on the real catalog**, in the section's existing terms: of arm E's missed positives, how many are **abstentions** (`hits: []`), how many are **non-abstaining misses**, and of those how many are **demotions** the cross-encoder caused (inside D's top five, pushed out by the rerank), by id — and how many positives D misses; then arm E's negative abstention against D's, split `far` / `near` (D abstains on none by construction). Compute from the per-query records with a launcher via `bash scripts/scratch-run.sh`, not by eye.
- [ ] **`What this does not settle`**, rewritten: what the third corpus — a real 1,960-chunk catalog, agent-shaped queries — did to the trade (confirmed, narrowed or reversed it, stated from the figures); what still limits it (one host, one repetition per query for B–E, one real catalog); and that this branch records the measurement and does not change the default mode or extend abstention to `fused` — that decision stays open, and this section says where it would be taken.

**Verification:**

- Every figure in the table and the decomposition matches the generated region; the `gate10-catalog` pair's stamp matches that block's provenance.
- `git diff` touches only this section; no default, no `DEFAULT_MODE` and no code changes on this task.
