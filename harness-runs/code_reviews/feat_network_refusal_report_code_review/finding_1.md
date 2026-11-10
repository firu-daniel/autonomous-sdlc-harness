### 1. `branch-status` prints `Network refusals: none` when no session was scanned

**File:** `plugin/commands/branch-status.md` (step 4, **Run analytics** bullet, the network lines) — "`Network refusals: none (<sessions_scanned> sessions scanned)` when `refusals` is empty"

The story index says a session recorded before this branch "is reported as *not scanned*, never as *none*" (`harness-runs/story_plans/feat_network_refusal_report_story_plan.md` → `## Context`, **From the session stream — reliable.**). `run-analytics.md` keeps that rule: `cli/templates/scripts/lib/run-analytics-report.jq` → `network_md` prints `No session was scanned for refusals.` when `sessions_scanned` is `0`, and `cli/test/run-analytics-report-network.test.mjs` asserts that branch ("a session recorded before the scan is counted as not scanned, never as clean").

`branch-status` has no such branch. Its first network line chooses only on whether `refusals` is empty. A record whose sessions all predate the scan has `refusals: []` and `sessions_scanned: 0`, so it prints `Network refusals: none (0 sessions scanned); <n> recorded before refusals were scanned`. A record with no sessions at all (gate rounds or gate logs only) prints `Network refusals: none (0 sessions scanned)`. Either way the line opens on `none` for a run nobody scanned, which the Markdown of the same record never says. The two surfaces then disagree, and the maintainer reading the digest gets the "clean" reading the story forbids.

**Fix:** in `plugin/commands/branch-status.md`, step 4's **Run analytics** bullet, replace the first bullet under "Then, from the same record's `.run.network`:" with:

```markdown
     - `Network refusals: no session scanned` when `sessions_scanned` is `0`; otherwise `Network refusals: none (<sessions_scanned> sessions scanned)` when `refusals` is empty, else `Network refusals: <count of refusals> (<sessions_scanned> sessions scanned)`. In every case, when `sessions_not_scanned` is above `0`, append `; <sessions_not_scanned> recorded before refusals were scanned`.
```

Leave the other network bullets, the `.run` lines above them and the "When `.run` has no `network` key" paragraph as they are. This is a plugin prose contract, so it carries no test file and asks for no test run.
