### 2. The publication clearance that licenses the committed query set and transcripts is recorded only in a run artifact the published tree does not carry

**File:** `docs/development.md` → `## 5. Verifying a change`, the paragraph opening "This gate is the mechanical half and the one that stays" ("under the operator's publication clearance recorded in the task prompt of the branch `feat_arm_a_real_catalog_measurement`").
**Also:** `evals/docs-retrieval/README.md`, the `transcripts/` row of the module table ("committed only after being read and redacted per the publication clearance"). And `docs/retrieval-eval-results.md` → `## The real-catalog query set`, which records the set but not the clearance's terms.

**Problem.** This branch commits Expause product names, the real catalog's query text, labels, per-query records and ten agent transcripts into a public repository. `docs/development.md` tells a reader why these are not item-11 sanitization findings: the operator's publication clearance. Its only pointer to that clearance is the task prompt, `harness-runs/task_prompts/feat_arm_a_real_catalog_measurement_task_prompt.md`. That is a run artifact. It lands on `dev`, but `main`, the published tree, carries no `harness-runs/` at all (`git ls-tree main harness-runs/` is empty). So a public reader, or a later sanitization sweep run against `main`, finds a deliberate exemption with no reachable statement of what it covers. The `evals/docs-retrieval/README.md` row cites "the publication clearance" with no pointer at all.

`.claude/context/conventions.md` → `## Documents of record` and `### Where a new responsibility goes` put a decision of record in `docs/` and nowhere else, and state that a rule read off `harness-runs/` describes a run, not this project. The clearance's limits are also exactly what gate 6e enforces: no machine-local path, credential, token, environment value or account identifier, and no document text quoted wholesale. A contributor who later adds a transcript needs those limits, and cannot reach them from the published tree.

**Fix.** Record the clearance's terms once in the results document and point both citers at it.

- [ ] `docs/retrieval-eval-results.md` → `## The real-catalog query set`: directly after the `**The catalog.**` paragraph, insert this paragraph:

  ```markdown
  **Publication clearance.** The operator cleared this catalog's query-level material for this public
  repository before the run started. **May be committed:** the query set — query text, `ref` labels and
  grades — the per-query records and scores, the arm A transcripts, and every aggregate. **May not:** any
  machine-local filesystem path, so the catalog is named by commit and size and never by location, and
  any credential, token, environment value or account identifier a transcript can carry. Document text
  beyond what a `ref` and a label need is not quoted wholesale: a per-query record names sections and
  does not republish them. Gate 6e (`docs/development.md` → `## 5. Verifying a change`) is the mechanical
  check over what this clearance lets in.
  ```

- [ ] `docs/development.md`, the paragraph opening "This gate is the mechanical half": replace `under the operator's publication clearance recorded in the task prompt of the branch `feat_arm_a_real_catalog_measurement`, so they are not item-11 findings.` with `under the operator's publication clearance, whose terms are recorded in `docs/retrieval-eval-results.md` → `## The real-catalog query set`, so they are not item-11 findings.`
- [ ] `evals/docs-retrieval/README.md`, the `transcripts/` row: replace `per the publication clearance` with `per the publication clearance recorded in `docs/retrieval-eval-results.md` → `## The real-catalog query set``.
