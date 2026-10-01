### 4. The bundle-format header still says `HR_REMOTE_WORKFLOW_RUN_FILE` is assigned for two GitHub-route producers only

**File:** `cli/templates/scripts/lib/harness-run-lib.sh`, the `THE REMOTE STATE BUNDLE.` section header. Anchor quote: "also assigns `HR_REMOTE_WORKFLOW_RUN_FILE`, the run workflow's file name, for the GitHub-route producers `hr_github_answer_route` and `hr_github_resume_route`."

**The problem.** This branch adds a third reader of `HR_REMOTE_WORKFLOW_RUN_FILE`: `hr_branch_run_history`, which calls `hr_remote_names_var` and passes `--workflow "$HR_REMOTE_WORKFLOW_RUN_FILE"` to `gh run list`. The section header still lists only the two GitHub-route producers as the reason the variable is assigned, so a reader looking for every consumer of that name gets an incomplete list from the one place that enumerates them.

**Fix.** In that header sentence, replace "for the GitHub-route producers `hr_github_answer_route` and `hr_github_resume_route`." with:

```bash
# also assigns `HR_REMOTE_WORKFLOW_RUN_FILE`, the run workflow's file name, for
# the GitHub-route producers `hr_github_answer_route` and
# `hr_github_resume_route` and for the run-history probe `hr_branch_run_history`.
```

Leave the next sentence ("Those two are mirrors of the header's table; …") as it is. It refers to the two mirrored names, not to the consumers. This is a comment-only edit in a template outside the compiler, so no test runs for it.
