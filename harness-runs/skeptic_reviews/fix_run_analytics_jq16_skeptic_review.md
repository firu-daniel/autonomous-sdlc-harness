# Skeptic Review: fix_run_analytics_jq16

## Context

**Branch:** `fix_run_analytics_jq16`
**Date:** 2026-10-31
**Reviewed:** the whole branch diff, adversarially. The `dev` ref does not exist in this run copy, so the diff base is `origin/dev`. The diff covers:
- the `latency_row` parameter rename and the widened `# Floor:` headers, in both run-analytics `jq` templates and in their self-adopted copies under `scripts/lib/`;
- the new `cli/test/jq-floor.test.mjs` source guard and its `treeGuards` registration;
- Gate 4's by-hand jq 1.6 paragraph in `docs/development.md`;
- the hand-run leg added to `scripts/run-gates.sh`.

11 run-artifact files excluded from the reviewed diff.

**De-duplicated against:** `harness-runs/code_reviews/fix_run_analytics_jq16_code_review.md` and its Findings 1 and 2, both applied. No parity review exists (`phases.parity` is `false`), and no architecture review exists for this branch.

**What was verified, first-hand:**

- **Wiring.** `cli/package.json` → `scripts.test` is a bare `node --test`, whose default pattern picks up `cli/test/jq-floor.test.mjs`. The `treeGuards` entry's `test` value, `test/jq-floor.test.mjs`, resolves under the `cli` layer path, which `doctor`'s tree-guards check accepts. The `covers` glob matches exactly the tree the scanner reads.
- **The fix itself.** `latency_row` has two callers, `latency_row("all")` and `latency_row($x)`, and both pass the label positionally, so the rename changes neither.
- **The programs under the floor.** Neither shipped program contains a keyword binding, an `if` with no `else`, a `.`-before-`[` chain, `?//`, `$__loc__`, `$ENV`, or any of the post-1.5 builtins that appear outside comments.
- **Every citation the diff adds resolves.** The test header's pointer to Gate 4 → **The suite under jq 1.6, by hand.** does. Inside that paragraph, so do *A Linux run, in a local container*, *The absent-path check, by hand* with its three clone lines, and the `apt-get install … jq` step. The route's fixture commits do not depend on the container's git identity, because `cli/test/helpers/fixture.mjs` sets one per fixture.

**Headline:** one net-new finding, Should Fix. The new guard checks two of the three syntax classes jq 1.7 relaxed. It misses the third, `.` before `[` (`.a.["b"]`, `.a.[]`), and its own rule sentence and Gate 4's paragraph both describe its list as complete. No shipped program uses that form today. Still owed, and outside this review: the story's `Manual setup required` item 1, the suite under jq 1.6 before merge, and item 2, the notes-app fixture paste.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Add the `.`-before-`[` class (`.a.["b"]`, `.a.[]`) to the jq-floor scanner with self-checks, and name it in the suite's rule sentence and Gate 4's paragraph _(layer: cli, general)_

---

## Must Fix

None.

---

## Should Fix

### 1. The jq-floor guard misses jq 1.7's third relaxed syntax class, a `.` before `[`, while its rule sentence and Gate 4's paragraph present its list as complete
→ [finding_1.md](fix_run_analytics_jq16_skeptic_review/finding_1.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from. The branch marks no divergence as intentional, so check 4 had nothing to re-grade. Task 5's fixture edit did not land because the tool layer's `.claude/**` guard refused it. Its recorded operator remedy is the route the task prompt itself sanctions (*"records the edit as a one-paste operator remedy … rather than skipping it"*), and the code review already confirmed its anchors.
