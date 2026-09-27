### 4. The `test_fix_point_reviews` README says `item_<N>` carries the finding number; row `G.4` keys it by walk position

**Severity:** Should Fix

**Site anchors**

- `cli/templates/state-dir/test_fix_point_reviews/README.md`, first paragraph: *"`<N>` is that fix's number in the round's readiness list — the same number its `finding_<N>.md` carries under `<state_dir>/test_fix_plans/`."*
- `harness-runs/test_fix_point_reviews/README.md`: the self-adopted mirror, with the identical sentence.

**Problem**

Row `G.4` of `plugin/instructions/unit_loop_core.md` → `## Substitution table` has two cells that use different numbers:

- **Per-item findings folder:** `<test_fix_findings_root>item_<N>/`, where `N` is the walk position that step 1 binds.
- **Detail file:** `<test_fix_findings_dir>finding_<K>.md`, where `K` is the finding identity carried on the entry.

The table's own ⚠️ note says that `N` and `K` *"are independent and legitimately differ"*. And `test-fix-plan-writer` sorts its readiness list *"lowest blast-radius first"*, so they do differ whenever that order is not the finding order.

The README merges the two: it tells a reader that `item_3/` holds the reviews of `finding_3.md`, which is false whenever the orders differ. Its sibling `cli/templates/state-dir/review_plan_point_reviews/README.md` states the rule correctly: *"`<N>` is the item's position in the code-review index's ordered fix list — the first entry is `item_1`, the second `item_2`."*

**Fix**

In both files, replace:

> `<N>` is that fix's number in the round's readiness list — the same number its `finding_<N>.md` carries under `<state_dir>/test_fix_plans/`.

with:

> `<N>` is the fix's position in the round's readiness list — the first entry is `item_1`, the second `item_2` — which is not necessarily the `K` its `finding_<K>.md` carries under `<state_dir>/test_fix_plans/`, because the list is sorted by ship order.

Keep the two files byte-identical.
