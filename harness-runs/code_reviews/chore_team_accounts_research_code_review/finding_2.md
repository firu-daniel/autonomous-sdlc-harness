### 2. P5's "Not documented" lists pages as checked that the evidence does not name for that point

**File:** `docs/team-accounts-research.md` (`### P5. What happens to one person's subscription limits when teammates use it?`). The location is the **Not documented** paragraph, the sentence "Pages checked: authentication, cli-reference, env-vars, github-actions, server-managed-settings and costs."

**The problem.** The document's method section promises that a **Not documented** entry "names the pages that were checked". P5's point is whether usage through a `setup-token` token counts differently from interactive usage. The planning evidence records it as the second **SILENT** bullet of `harness-runs/task_plans/chore_team_accounts_research/task_1_plan.md` → `###### 2.6 What the sources are silent on` ("no page says whether usage through a `setup-token` token counts differently from interactive usage"), and that bullet names no pages. The six-page list in P5 belongs to the *first* 2.6 bullet, which is about revoking a token, and P2 already uses it correctly for that point. Copying the list here tells a reader that each of those six pages was checked for P5's question. The evidence does not say so, so a reader judging how open the point is would overrate the search.

This was raised by the Task 1 per-unit review and is still present on the branch.

**Fix.** Replace that sentence with:

> The planning session's evidence records this as silent across the Claude Code pages it fetched for P2, and names no page checked for this point specifically.

Change nothing else in P5. No test applies to a prose-only change.
