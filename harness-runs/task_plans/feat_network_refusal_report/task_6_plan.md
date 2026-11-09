### Task 6 — Bring the self-adopted run-analytics scripts and state-dir READMEs to the template bytes, and name the mirror in `judge.sh`

**Goal:** Make this repository's own adopted copies match, byte for byte, what Tasks 1–4 changed in the templates. `scripts/` and `harness-runs/` at the root are `init`'s output in this checkout (`.claude/context/conventions.md` → `## Documents of record`). Also make the sandbox probe's judge name the report's copy of its network strings, so a string added to one is added to the other.

**Depends on:** Tasks 1, 2, 3 and 4. Each owns a template this task copies:
- **Task 1:** `cli/templates/scripts/lib/run-analytics.jq`, with `network_refusal_strings`, the session record's `network_refusals` and mode `gate_logs`. Its header declares the mirror this task names from the other side.
- **Task 2:** `cli/templates/scripts/lib/run-analytics-report.jq`, with schema 3, `.run.network` and the two network sections.
- **Task 3:** `cli/templates/scripts/run-analytics.sh`, with `GATE LOGS`, the log hand-over and the schema-3 merge.
- **Task 4:** `cli/templates/state-dir/run_analytics/README.md` and `cli/templates/state-dir/test_run_logs/README.md`.

This task changes none of those templates. Where a copy and its template differ after the copy, the template is right and the difference is reported, never resolved here.

**How this task's implementer reads the conventions.** This is the catch-all task, the `layers[]` row whose `path` is `"."`. Read every configured layer's conventions document: the copied files are `cli` templates, and `judge.sh` is a sourced shell library bound by the cross-layer `## Shell assets` rules (it sets no shell option).

### Targets

- `scripts/run-analytics.sh`
- `scripts/lib/run-analytics.jq`
- `scripts/lib/run-analytics-report.jq`
- `harness-runs/run_analytics/README.md`
- `harness-runs/test_run_logs/README.md`
- `scripts/lib/sandbox-probe/judge.sh`: header comment only.

**Work:**

- [ ] **The three scripts.** Replace the contents of `scripts/run-analytics.sh`, `scripts/lib/run-analytics.jq` and `scripts/lib/run-analytics-report.jq` with their templates' exact bytes. Each copy was byte-identical to its template when this plan was written (`git diff --no-index --stat cli/templates/scripts scripts` listed none of them), so the copy carries over exactly Tasks 1–3's edits. Read each template and write it whole, or apply every hunk of `git diff --no-index <copy> <template>`. Keep `scripts/run-analytics.sh`'s executable bit, which a content write leaves in place.
- [ ] **The two READMEs.** Replace the contents of `harness-runs/run_analytics/README.md` and `harness-runs/test_run_logs/README.md` with their `cli/templates/state-dir/` templates' exact bytes. Both were byte-identical to their templates when this plan was written.
- [ ] **`judge.sh`'s header, comment only.** In the `THE LAYER TABLE (sp_layer_of)` paragraph, after the `network` row, add two sentences:
  - The `network` strings and `SP_N5_CANNOT_WIDEN` are mirrored by `cli/templates/scripts/lib/run-analytics.jq` → `network_refusal_strings`, which the run analytics match a session's refusals against. A string added here is added there in the same change.
  - `cli/test/run-analytics-network-parse.test.mjs` fails when one is missing there.

  Change no code line: no verdict the judge prints may change.

**Verification:**

- **Byte identity:** each of these prints nothing:
  - `cmp cli/templates/scripts/run-analytics.sh scripts/run-analytics.sh`
  - `cmp cli/templates/scripts/lib/run-analytics.jq scripts/lib/run-analytics.jq`
  - `cmp cli/templates/scripts/lib/run-analytics-report.jq scripts/lib/run-analytics-report.jq`
  - `cmp cli/templates/state-dir/run_analytics/README.md harness-runs/run_analytics/README.md`
  - `cmp cli/templates/state-dir/test_run_logs/README.md harness-runs/test_run_logs/README.md`
- `test -x scripts/run-analytics.sh` exits 0.
- `git diff -U0 scripts/lib/sandbox-probe/judge.sh` shows changed lines that are all `#` comment lines.
