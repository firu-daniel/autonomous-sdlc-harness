### Task 17 — Read, redact and commit the ten arm A transcripts

**Goal:** Commit the operator's arm A transcripts — up to five per variant — into the tree, each read in full first and stripped of anything the publication clearance does not cover, so the published arm A rows are generated from committed transcripts and the per-query `usage` blocks the task prompt asks for are on the record.

**Depends on:** Task 16, which confirms against the tree that the operator's transcripts exist at `harness-runs/scratch/arm-a/gate10-catalog/<variant>-rep<N>.jsonl` (`<variant>` `index` or `search`, `<N>` 1–5; fewer for a variant stopped at the cost checkpoint) with one record per query id, and records the run in `docs/retrieval-eval-results.md` → `## Arm A — the real-catalog hand run`. Each record is Task 9's shape, `{ id, query, refs, durationMs, usage, variant, toolCalls }`. **Also depends on Task 2**, whose `bash scripts/check-eval-artifacts.sh` scans `evals/docs-retrieval/transcripts/` and gate `6e` grades it.

### Targets

- `evals/docs-retrieval/transcripts/gate10-catalog/<variant>-rep<N>.jsonl` (new) — one file per handed-back transcript, same name.
- `evals/docs-retrieval/README.md` — one row for `transcripts/`.

**What the clearance covers (task prompt `## Publication clearance`).** May be committed: query text, refs, per-query records and scores, transcripts. May **not**: any machine-local filesystem path; any credential, token, environment value or account identifier a transcript can carry. A transcript records what the agent saw, not only what it answered — so every record is read, not sampled.

**Work:**

- [x] **Read every record of every transcript in full.** Check each record's keys are exactly `id`, `query`, `refs`, `durationMs`, `usage`, `variant`, `toolCalls`, and that its `id` and `query` match the approved set.
- [x] **Redact, never repair.** A `refs` entry that is an absolute path, a `../` path, or carries any machine-local directory name is replaced by the literal `[redacted: machine-local path]` — it could not have matched a label, so the score does not move — and the redaction is listed. A `usage` key or value that is an identifier (a session, request, account or organisation id; an e-mail) is removed and listed; numeric token fields and non-identifying fields such as a service tier are kept. Everything else stays byte-for-byte, including refs that are wrong, invented or fenced — those are the measurement. That includes the three records the operator reported with a **prose sentence beside `none`** in `refs` (`index-rep2` `q-g10-vite-health-middleware`, `index-rep5` `q-g10-vite-mock-updated-event`, `search-rep5` `q-g10-neg-android-keystore` — Task 16's `### Operator answer` item 5). Such a sentence is redacted only if it carries a machine-local path or an identifier.
- [x] **Flag, never drop, an out-of-fence tool.** Any `toolCalls` key other than `Read`, `Grep` or `Glob` is listed by variant, repetition and query id — the record is committed as it is, and Task 19 reports it.
- [x] **Commit the files** under `evals/docs-retrieval/transcripts/gate10-catalog/` with the names they had, one JSON object per line, and add the `transcripts/` row to `evals/docs-retrieval/README.md`: *one directory per corpus id, one file per variant and repetition, committed only after being read and redacted per the publication clearance, and scanned by gate 6e*. Record the redaction and out-of-fence lists in the implementer's return **and** as a short `**Redactions and out-of-fence tool use.**` paragraph appended to `## Arm A — the real-catalog hand run` (*none* when there are none).

**Verification:**

- `bash scripts/check-eval-artifacts.sh` prints nothing over the committed transcripts; `git grep -nE '/(Users|home|private|tmp|var)/' -- evals/docs-retrieval/transcripts` returns nothing.
- For each committed file, a launcher calling `scoreTranscript` against the approved set (via `bash scripts/scratch-run.sh`) accepts it, and its arm A records are identical to those scored from the unredacted scratch copy — redaction moved no score.
- The number of committed files equals the number of passes the operator reported as completed in `### Operator answer` of Task 16's file, as recorded in `## Arm A — the real-catalog hand run`.
