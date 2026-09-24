### 3. §5 cites `harness-runs/dispatch_additions/` without saying the published tree does not carry it

**File:** `docs/second-runtime-port-decision.md` (`## 5. What a graph runtime cannot do that the orchestrator does`, the second bullet): "Every such addition is recorded under `harness-runs/dispatch_additions/`."

**Problem.** The story index's `## Context` sets this constraint for the branch: *"a published document cites a `harness-runs/` path as a code span, never as a link, and says that the file is not in the published tree."* §5 cites `harness-runs/dispatch_additions/` here, and its first sub-bullet cites `harness-runs/dispatch_additions/feat_docs_retrieval_eval.md` as the example's source. Neither says that the file is missing from the published tree. The record says that only once, in §4's **The figures cannot be re-checked from a clone.** paragraph, and that sentence is scoped to the run logs. A reader of the published `main` who looks up the §5 example will not find the file, because `scripts/publish-main.sh` → `removed_paths` strips `harness-runs`. That reader may then conclude the example was made up.

**Fix.** Replace the sentence "Every such addition is recorded under `harness-runs/dispatch_additions/`." with:

```markdown
Every such addition is recorded under `harness-runs/dispatch_additions/`. That directory is in this repository's run-artifact tree, which `scripts/publish-main.sh` removes from the published `main`, so the record and the example below are not in the published tree.
```
