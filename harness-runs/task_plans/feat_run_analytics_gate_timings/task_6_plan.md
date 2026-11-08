### Task 6 — Bring the self-adopted run-analytics scripts and state-dir READMEs to the template bytes, and name the new reader in the record producers' headers

**Goal:** Make this repository's own adopted copies match what Tasks 1–4 changed in the templates, byte for byte. `scripts/` and `harness-runs/` at the root are `init`'s output in this checkout (`.claude/context/conventions.md` → `## Documents of record`). Also make the two hand-written producers of the round records say that `run-analytics.sh` now reads them too. Their record contracts gain a reader without a format change.

**Depends on:** Tasks 1, 2, 3 and 4. Each owns one template this task copies:
- **Task 1:** `cli/templates/scripts/lib/run-analytics.jq`, with mode `rounds`.
- **Task 2:** `cli/templates/scripts/lib/run-analytics-report.jq`, with schema 2 and `## Gate rounds`.
- **Task 3:** `cli/templates/scripts/run-analytics.sh`, with `GATE ROUNDS`, the lane discovery and the schema-2 merge; and `cli/templates/scripts/lib/harness-run-lib.sh`, whose comments (`THE RUN GATES LANE`, `hr_test_run_lane_dir`'s `Callers:` line and the file header's lane clause) now name `run-analytics.sh` as a third caller.
- **Task 4:** `cli/templates/state-dir/run_analytics/README.md` and `cli/templates/state-dir/test_run_logs/README.md`.

This task changes none of those templates. Where a copy and its template differ after the copy, the template is right and the difference is reported, never resolved here.

**How this task's implementer reads the conventions.** This is the catch-all task, the `layers[]` row whose `path` is `"."`. Read every configured layer's conventions document: the copied files are `cli` templates, and the record producers are shell and Node assets bound by the cross-layer `## Shell assets` rules.

### Targets

- `scripts/run-analytics.sh`
- `scripts/lib/run-analytics.jq`
- `scripts/lib/run-analytics-report.jq`
- `scripts/lib/harness-run-lib.sh`
- `harness-runs/run_analytics/README.md`
- `harness-runs/test_run_logs/README.md`
- `scripts/lib/gate-round-lib.sh`: header comment only.
- `scripts/lib/test-timing-reporter.mjs`: header comment only.

**Work:**

- [ ] **The four scripts.** Replace the contents of `scripts/run-analytics.sh`, `scripts/lib/run-analytics.jq`, `scripts/lib/run-analytics-report.jq` and `scripts/lib/harness-run-lib.sh` with their templates' exact bytes. The library's copy and template were byte-identical when this plan was written, so the copy carries over exactly Task 3's comment edits. Read each template and write it whole, rather than re-applying the edits by hand. Keep `scripts/run-analytics.sh`'s executable bit, which a content write leaves in place.
- [ ] **The two READMEs.** Replace the contents of `harness-runs/run_analytics/README.md` and `harness-runs/test_run_logs/README.md` with their `cli/templates/state-dir/` templates' exact bytes.
- [ ] **The producers' headers, comments only.**
  - In `scripts/lib/gate-round-lib.sh` → the `THE RECORDS` paragraph, add one sentence. A finished round's records are also read, never written, by `scripts/run-analytics.sh` (its `GATE ROUNDS` paragraph), which copies their rows into the committed run analytics. So the shape stated here is a contract with that reader too.
  - In `scripts/lib/test-timing-reporter.mjs`, add `scripts/run-analytics.sh` to the `WHAT IT OWNS` list of the files that share `THE RECORD`, and change "the contract those three share" to "those four".
  - Change no code line in either file. The constraint is that no round's run, records or verdict changes.

**Verification:**

- `cmp cli/templates/scripts/run-analytics.sh scripts/run-analytics.sh` prints nothing. So do the same `cmp` for `cli/templates/scripts/lib/run-analytics.jq` against `scripts/lib/run-analytics.jq`, for `cli/templates/scripts/lib/run-analytics-report.jq` against `scripts/lib/run-analytics-report.jq`, for `cli/templates/scripts/lib/harness-run-lib.sh` against `scripts/lib/harness-run-lib.sh` (`cmp cli/templates/scripts/lib/harness-run-lib.sh scripts/lib/harness-run-lib.sh`), for `cli/templates/state-dir/run_analytics/README.md` against `harness-runs/run_analytics/README.md`, and for `cli/templates/state-dir/test_run_logs/README.md` against `harness-runs/test_run_logs/README.md`.
- `git diff -U0 scripts/lib/gate-round-lib.sh scripts/lib/test-timing-reporter.mjs` shows changed lines that are all comment lines (`#` in the shell file, `//` in the module).
- `test -x scripts/run-analytics.sh` exits 0.
