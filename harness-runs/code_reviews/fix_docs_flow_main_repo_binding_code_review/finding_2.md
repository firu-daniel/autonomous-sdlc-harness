### 2. The docs phase says its commit and push are "spelled exactly as" the docs-catalog fences, but those fences carry a different subject and a checklist path the docs phase does not stage

**File:** `plugin/instructions/docs_phase_instructions.md` → `## Loop` step 2, the **Commit + push.** bullet — "both spelled exactly as the docs-catalog engine's `## Commit mechanics (single source of truth)` fences spell them"

The bullet sets this phase's own subject in the same sentence, `docs: <new|update> <doc_title>`, and lists its own staged paths: the doc and any accumulator. It then says both calls are "spelled exactly as" the fences in `plugin/instructions/docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)`. That fence's commit is

```
bash <MAIN_REPO>/<scripts_dir>/commit-on-branch.sh --repo <repo_root> "<output_path>" "<state_dir>/docs_catalog/<branch>_docs.md" [<other changed paths…>] -- "docs: <doc_title>"
```

It uses a different subject and stages the catalog checklist `<state_dir>/docs_catalog/<branch>_docs.md`, which a code-flow docs phase does not have. So "exactly" contradicts the sentence it sits in. An orchestrator that takes the fence literally commits under the catalog subject and names a checklist path that does not exist. The words this branch replaced ("identical mechanics to the docs-catalog engine's per-entry commit") were looser. "Spelled exactly" is new with this branch, and it makes the clash sharper.

What the docs phase needs from that fence is its command **shape**: the main checkout's copy, `--repo` with the run copy's root, a `$`-free literal, and the push as its own call. It does not need the fence's paths or subject. This file does not bind `<MAIN_REPO>` or `<repo_root>` (its `## Resolved values` declares neither), so the fix names that shape in words and points at the fence rather than spelling it with tokens it does not bind.

**Fix:** in the **Commit + push.** bullet, replace

> both spelled exactly as the docs-catalog engine's `## Commit mechanics (single source of truth)` fences spell them.

with

> both in the command shape the docs-catalog engine's `## Commit mechanics (single source of truth)` fences give — the main checkout's copy of each wrapper, the run copy's root passed literally, no `$` anywhere, the push its own call — carrying this phase's own paths and subject rather than the fence's.

Leave the rest of the bullet and `## Commit mechanics` unchanged. This fix touches no test file and asks for no test run.
