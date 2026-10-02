### 3. Gate 12 (xiv)'s two-account review step cannot be run, and leg (e) still plans a review leg from the pull request's author

**File:** `docs/development.md` → Gate 12 (xiv), leg **(f) The refusals.** — "Once that round completes too, from a second account with write access, submit a review requesting changes at the same moment as the first account submits one:"

Also touched by this finding:

- Leg **(e) A review that requests changes.**: "From an account with write access that is not that author, submit a review requesting changes", and the closing sentence "Where `HARNESS_GIT_TOKEN` was set with the reviewing account's own token, that account is the author: record the refusal GitHub gives it when it requests changes, instead of this leg's pass."
- Leg (f): "From the reviewing account, on the pull request:".
- **What it settles.**: "*A pull request's author cannot request changes on their own pull request*, by leg (e) where `HARNESS_GIT_TOKEN` was the reviewing account's own token;".

**Problem.** Leg (f)'s last review step needs a second account with write access that submits a review requesting changes at the same moment as the first. The two-user scenario will not be tested. GitHub never lets a pull request's author approve it or request changes on it. The harness's draft pull request is authored by the owner of `HARNESS_GIT_TOKEN`, or by `github-actions[bot]` when that secret is not set. So the account that owns that token cannot run any review leg. Leg (e) still describes running the leg as that account and recording the refusal. **What it settles.** credits that path with settling a §8 row.

**Fix.**

1. **Leg (e)'s setup.** After the `gh pr view <number> --repo <owner>/<scratch-repo> --json author` block, add one sentence before the review is submitted. It says that the reviewing account, which submits every review in legs (e) and (f), must have write access and must not be the pull request's author. GitHub never lets a pull request's author approve or request changes on it. The draft pull request is authored by the owner of `HARNESS_GIT_TOKEN` when that secret is set, and otherwise by `github-actions[bot]` (`app/github-actions`). So the account that owns that token cannot run any review leg. The following sentence then reads "From the reviewing account, submit a review requesting changes with two inline comments on different lines, from the pull request's *Files changed* tab." Delete the closing sentence that begins "Where `HARNESS_GIT_TOKEN` was set with the reviewing account's own token".
2. **Leg (f)'s first review line.** Change "From the reviewing account, on the pull request:" to "From leg (e)'s reviewing account, never the pull request's author, on the pull request:".
3. **Replace the two-account step.** Replace the text from "Once that round completes too, from a second account with write access" through "Where only one account with write access exists, record this step as not run." The code block between them goes too. Stop before "Then, on the issue:", which stays. Use a one-account pending-reviews step, with each command in its own fenced block:

   > Once that round completes too, from the same reviewing account, submit a review requesting changes:
   >
   > ```
   > gh pr review <number> --repo <owner>/<scratch-repo> --request-changes --body "<text 1>"
   > ```
   >
   > While the round it starts is running, submit a second review requesting changes, and then, back to back, a third and a fourth, each with its own text:
   >
   > ```
   > gh pr review <number> --repo <owner>/<scratch-repo> --request-changes --body "<text 2>"
   > ```
   >
   > ```
   > gh pr review <number> --repo <owner>/<scratch-repo> --request-changes --body "<text 3>"
   > ```
   >
   > ```
   > gh pr review <number> --repo <owner>/<scratch-repo> --request-changes --body "<text 4>"
   > ```
   >
   > Then read the review jobs:
   >
   > ```
   > gh run list --repo <owner>/<scratch-repo> --workflow harness-control.yml
   > ```
   >
   > Passes when all of the following hold:
   >
   > - no review is refused;
   > - each review job that ran replied "collected" (a pending review job that GitHub replaced may post no reply, which is recorded, not failed);
   > - no second `chore: add user review for <slug>` commit appears while the first round runs;
   > - once that round completes, the `harness-run.yml` run's `collect` job places one round file that carries the bodies of all three later reviews, each under its own `## Review by @<login>` section, and a `harness run <slug>` run follows.
   >
   > Record each reply, the `harness-control.yml` run list (which review jobs ran and which were cancelled), the `collect` job's log and the round file verbatim.
4. **What it settles.** Delete the clause "*A pull request's author cannot request changes on their own pull request*, by leg (e) where `HARNESS_GIT_TOKEN` was the reviewing account's own token;", because no leg now runs as the pull request's author. Finding 2 edits this same paragraph first. Apply this deletion to the paragraph as Finding 2 leaves it, and keep the remaining clause list grammatical. Leave the §8 row itself in `docs/github-run-control.md` unchanged.
