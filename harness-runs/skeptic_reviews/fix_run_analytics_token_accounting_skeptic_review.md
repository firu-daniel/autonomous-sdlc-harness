# Skeptic Review: fix_run_analytics_token_accounting

## Context

**Branch:** `fix_run_analytics_token_accounting`
**Date:** 2026-10-27
**Reviewed:** the whole branch diff against the default branch. There is no local `dev`, so the base is `origin/dev`. The diff covers:

- the three run-analytics templates, `cli/templates/scripts/lib/run-analytics.jq`, `cli/templates/scripts/lib/run-analytics-report.jq` and `cli/templates/scripts/run-analytics.sh`;
- their `scripts/` mirrors, checked byte-identical with `git diff --no-index`;
- the fixtures and cases under `cli/test/`;
- `docs/watcher.md`, `ARCHITECTURE.md` and the `cli/src/machine/paths.ts` header.

12 run-artifact files were excluded from the reviewed diff.

**De-duplicated against:** `harness-runs/code_reviews/fix_run_analytics_token_accounting_code_review.md` and its findings 1–3. No parity review exists (`phases.parity` is `false`), and no architecture review exists for this branch.

**What was verified adversarially:**

- **Wiring.** The new `transcripts` and `attach` modes are invoked from `run-analytics.sh`. Both `agent_id` carriers (`tool_use_result.agentId` in `on_user`, and the `task_*` branch of `step`) reach `subagents[].agent_id`, and `message_id` is consumed by `attach`. `token_sessions` and `cache_write_tokens` are consumed by the Markdown.
- **Cited claims.** The header claim that only `remote-run.sh`'s mention session passes `--no-session-persistence` holds: `control_mention_session` passes it, and `spawn_engine` in `autonomous-watcher.sh` does not. The `claudeHome()` mirror matches `cli/src/machine/paths.ts` → `claudeHome`.
- **Renamed Markdown labels.** No reader outside the test parses the renamed labels.
- **Rendering.** The legacy-record rendering was exercised by hand with `jq`.

**Headline:** no runtime defect was found beyond the earlier review. One test gap is left. Code-review Finding 2's step 4 required a discriminating `| Cache hit ratio | — |` assertion once Finding 1's legacy-record case existed. That case now exists, but the assertion was never added, so the per-session ratio fix has no test that turns red when it is reverted.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Assert the legacy record's `| Cache hit ratio | — |` in case E and record its red-turning mutation _(layer: cli)_

---

## Must Fix

None.

---

## Should Fix

### 1. The per-session `Cache hit ratio` fix has no test that fails when it is reverted
→ [finding_1.md](fix_run_analytics_token_accounting_skeptic_review/finding_1.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
