### Task 3 — Bring the self-adopted `scripts/lib/` jq programs level with the templates and register the jq-floor guard

**Goal:** Make this repository's own run analytics work on jq 1.6. The watcher runs this repository's self-adopted `scripts/run-analytics.sh`, which reads `scripts/lib/*.jq`. Also register the source guard Task 2 added, so the unit loop runs it whenever a shipped `.jq` program changes.

**Depends on:**
- **Task 1**, which fixed `cli/templates/scripts/lib/run-analytics-report.jq` (`latency_row($row_label)`, renamed from `$label`), extended both templates' `# Floor:` header lines, and may have changed `cli/templates/scripts/lib/run-analytics.jq` where its audit found a construct. The `scripts/lib/` copies were byte-identical to those templates before this branch.
- **Task 2**, which added `cli/test/jq-floor.test.mjs`. It reads every `*.jq` file under `cli/templates/scripts/`, so its tree-guard entry is the one below. Task 2 names this task as its registering task.

**How this task's implementer reads the conventions.** This is the catch-all layer, so read every configured layer's conventions document. `.claude/context/conventions.md` → `## Documents of record` decides the copy: `scripts/` at this root is `init`'s output in this checkout, and an outer-loop script is copied byte for byte. That is why the copy is made identical rather than edited to match. The re-run route, a forced self-adopt `init`, would also rewrite files that `docs/development.md` → Gate 2 says to restore, so copy the two files directly instead.

### Targets

- `scripts/lib/run-analytics-report.jq`
- `scripts/lib/run-analytics.jq` (Task 1 always changes at least its template's `# Floor:` header line)
- `harness.config.json` → `treeGuards`

**Work:**

- [ ] Make `scripts/lib/run-analytics-report.jq` byte-identical to `cli/templates/scripts/lib/run-analytics-report.jq`.
- [ ] Make `scripts/lib/run-analytics.jq` byte-identical to `cli/templates/scripts/lib/run-analytics.jq`. Its header line changed in Task 1, so it differs at least there.
- [ ] `harness.config.json` → `treeGuards`: append `{ "test": "test/jq-floor.test.mjs", "covers": "cli/templates/scripts/**/*.jq" }` after the last existing entry. Keep the file's two-space indentation and leave every other key unchanged.

**Verification:**

- `cmp cli/templates/scripts/lib/run-analytics-report.jq scripts/lib/run-analytics-report.jq` and `cmp cli/templates/scripts/lib/run-analytics.jq scripts/lib/run-analytics.jq` each exit 0 and print nothing.
- `cmp cli/templates/scripts/run-analytics.sh scripts/run-analytics.sh` still exits 0. The driver was not touched.
- `jq -e '.treeGuards | map(select(.test == "test/jq-floor.test.mjs" and .covers == "cli/templates/scripts/**/*.jq")) | length == 1' harness.config.json` prints `true`, and `cli/test/jq-floor.test.mjs` exists, so the entry's `test` resolves.
- `git diff -- harness.config.json` shows only the added entry and the comma before it.
