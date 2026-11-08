### 1. `docs/watcher.md` cites `lib/run-analytics.jq` → *Record*, a header label this branch renamed

> **Self-contained per-finding file** for the `feat_run_analytics_gate_timings` code-review index (`harness-runs/code_reviews/feat_run_analytics_gate_timings_code_review.md`). The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `docs/watcher.md` → `### Run analytics`, two sentences:
- the **What it records.** paragraph: "`lib/run-analytics.jq` → *Record* for the keys"
- the **Where the token figures come from.** paragraph: "The format of record is `lib/run-analytics.jq` → *Record*."

**Problem.** Task 1 renamed the header label these two sentences point at. In `cli/templates/scripts/lib/run-analytics.jq` (and its byte-identical copy `scripts/lib/run-analytics.jq`), the label that was `# Record (top-level keys exactly these):` is now `# Session record, of modes sessions, overlay and attach (top-level keys exactly these):`. The keys of the new round entries are stated somewhere else: under `# Mode \`rounds\``, in the `Round record:` paragraph.

So the case-sensitive anchor *Record* no longer names the key list. The only `Record` left in the header is the `Records, as this reader's contract.` paragraph of mode `rounds`. That paragraph describes the **input** `.verdict` / `gates.tsv` / `<phase>.tests.tsv` files, not the document's keys. A reader who follows "*Record* for the keys" lands on the wrong paragraph. Task 7 edited the first of these two sentences to say the record now also keeps round entries, but left its pointer as it was.

**Fix.** Edit `docs/watcher.md` only:

1. In the **What it records.** paragraph, replace
   ```
   `lib/run-analytics.jq` → *Record* for the keys
   ```
   with
   ```
   `lib/run-analytics.jq` → *Session record* for a session's keys and its mode `rounds` → *Round record* for a round's
   ```
2. In the **Where the token figures come from.** paragraph, replace
   ```
   The format of record is `lib/run-analytics.jq` → *Record*.
   ```
   with
   ```
   The format of record is `lib/run-analytics.jq` → *Session record*.
   ```

Change nothing else in the section. No test file covers this prose, so the fix runs no test.
