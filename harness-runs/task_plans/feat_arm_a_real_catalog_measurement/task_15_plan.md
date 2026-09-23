### Task 15 — Park for the operator's approval of the query set, and record it before anything is scored

**Goal:** Put the finished `gate10-catalog` query set in front of the operator (task prompt `## Operator checklist` row 6: *"Nothing is scored against a set the operator has not approved"*), apply whatever corrections come back, and commit the approval into `## The real-catalog query set` **before any arm scores the set** — the commit order is acceptance 1's evidence that approval preceded scoring.

**Depends on:** Task 14, which completes `evals/docs-retrieval/queries/gate10-catalog.jsonl` (at least 32 positives split `docs/expause-web/` / `docs/vite/`, at least 24 negatives with at least 14 `near`, every record carrying `situation`, `intent`, `origin`, negatives carrying `negativeKind`), passes the label pre-flight (recording its snapshot against gate 10's `{ files: 156, chunks: 1960 }`), and writes `docs/retrieval-eval-results.md` → `## The real-catalog query set` ending with a line that the set awaits approval. **Also depends on Task 10**, whose `docs/retrieval-eval.md` → `## Running arm A by hand` → `**Before spending tokens.**` records the ad-hoc route's comparability check as passed — the task prompt requires both before this park, so the operator is never asked to approve a set or a route that cannot score.

### Targets

- `docs/retrieval-eval-results.md` → `## The real-catalog query set` — its closing line replaced by the approval record.
- `evals/docs-retrieval/queries/gate10-catalog.jsonl` — **only** the corrections the operator returns, if any.

### Operator answer

*(Filled in by the task-plan writer when the run resumes from this task's park, from the operator's `answer_<n>.md`, with no machine path. Empty until then.)*

**Work:**

- [ ] **Find the answer.** Read `### Operator answer` above; if it is empty, look for an `answer_<n>.md` beside a `question_<n>.md` that names **Task 15** at the top level of `harness-runs/clarifications/feat_arm_a_real_catalog_measurement/`, then under its `answered/` archive. No answer found → the next bullet; an answer found → the bullet after it.
- [ ] **No answer: park.** Confirm the two preconditions are committed (the `## The real-catalog query set` section with its pre-flight result, and the comparability check in `**Before spending tokens.**`), then change nothing and return exactly one line: `blocker: operator approval of the gate10-catalog query set owed — task prompt ## Operator checklist row 6 is a mandated mid-run park, not an assumption; review evals/docs-retrieval/queries/gate10-catalog.jsonl (counts and method in docs/retrieval-eval-results.md → ## The real-catalog query set): spot-check that every grade-3 label answers its query and that every negative is uncovered, then answer "approved", or list corrections by query id`. This is an **operator-only, high-stakes** step (it gates token spend and the measurement's integrity), so the orchestrator parks rather than assuming.
- [ ] **Corrections without approval:** apply each correction to the named record — never to any other — re-run the label pre-flight exactly as Task 14 did (no arm, no search), update the counts in `## The real-catalog query set`, and park again with the same blocker, naming the corrections applied. **Approval, with or without corrections:** apply any corrections as above, then replace the section's closing *awaits approval* line with **`**Operator approval.**`** — the date, that the operator spot-checked the grade-3 labels and the negatives, each correction applied by id (or *none*), and the statement that **no arm had scored this set when it was approved**.

**Verification:**

- On the approval path: the commit landing this task's record contains no file under `evals/docs-retrieval/transcripts/` and no `gate10-catalog` block in the generated region — `git log --oneline` puts it before Task 17's and Task 18's commits.
- After any correction, the pre-flight prints `labels resolve` and the same snapshot Task 14 recorded, and the recorded counts still meet at least 30 positives split per half and at least 20 negatives with at least half `near`.
- `bash scripts/check-eval-artifacts.sh` prints nothing; the approval record carries no path outside this tree and none of the answer file's own location.
