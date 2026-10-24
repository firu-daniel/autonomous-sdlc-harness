### 1. Step 6's "never `<repo_root>`" reads as forbidding the push's own argument, and as contradicting `<MAIN_REPO>` in a single-checkout run

**File:** `plugin/agents/committer.md` → `### Standard procedure (`task` / `review_plan_file` / `review_item`)` step 6 — "with both spelled literally and `<MAIN_REPO>` resolved per `## Resolved values`, never `<repo_root>`;"

The new step 6 sentence is:

> call `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>` once, alone, with both spelled literally and `<MAIN_REPO>` resolved per `## Resolved values`, never `<repo_root>`; …

The intent, per the task prompt's goal 1, is "`<MAIN_REPO>` is the main checkout's root … never `<repo_root>`", meaning do not put the run copy's root **in `<MAIN_REPO>`'s place** (the `88bf8e8f` failure). But the sentence has two readings:

1. The command it quotes passes `<repo_root>` as the helper's argument, so a bare "never `<repo_root>`" at the end of the same clause can be read as forbidding that argument.
2. When there is no run copy (a supervised or semi-autonomous run in the main checkout), `<MAIN_REPO>` resolves through `## Resolved values` (`printenv HARNESS_MAIN_REPO`, else the first `worktree ` line) to the **same path** as `<repo_root>`. Read literally, "never `<repo_root>`" then forbids the value the resolution just produced.

Step 4, the sibling sentence for the commit, avoids this: it says "Resolve `<repo_root>` and `<MAIN_REPO>` per `## Resolved values`" with no negation. Only step 6 has the bare negation.

**Fix:** in step 6, replace `never \`<repo_root>\`;` with `never \`<repo_root>\` in its place;`. The full clause then reads:

```
6. **Push:** only when `push == true` and step 4 committed, landed exit 1 included — call `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>` once, alone, with both spelled literally and `<MAIN_REPO>` resolved per `## Resolved values`, never `<repo_root>` in its place; report `pushed: yes`, or `pushed: failed` when the helper reports a failure, which is not a commit failure. Otherwise `pushed: no`.
```

Change nothing else in the line. The source guard `cli/test/committer-wrapper-calls.test.mjs` (test `(a) committer step 4 commits and step 6 pushes once, alone, under <MAIN_REPO>`) asserts `step6.includes('never \`<repo_root>\`')`, and the new text still contains that substring, so the test needs no edit. Because this fix touches no test file, it runs no test; the full suite runs in the Run gates phase.
