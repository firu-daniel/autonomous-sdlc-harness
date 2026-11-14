### Task 22 — Hand the planning rounds' incidental findings to `branch-reviewer` and `skeptic-reviewer` as leads

**Goal:** Make the end-of-branch reviewers — the backstop against a plan that passed a converging round with a real defect — read every `## Incidental findings (not gating)` section the planning rounds wrote, and treat each entry as a lead to verify against the diff, never as a finding in itself.

**Depends on:** Task 10 (`plugin/instructions/plan_review_rounds.md` → `## Incidental findings — where they go and who reads them`, which states the lead rule and that the sections sit in the round files `review_<n>.md` of the plan-gate folders). The folders, as the cores define them: task plan — `<state_dir>/task_plan_reviews/<branch>/`, `<state_dir>/business_parity_reviews/<branch>/`, `<state_dir>/architecture_reviews/<branch>/` (Task 11); user-review fix plan — `<state_dir>/business_parity_user_review_reviews/<branch>/` and `<state_dir>/architecture_user_review_reviews/<branch>/`, each holding `user_review_<N>/` subfolders (Task 12).

**Where this task stops.** Neither agent's dispatch block changes: each derives the folders from the `Branch` it is given. A lead never enters either reviewer's findings unless the reviewer verified it against the diff on its own evidence, and the skeptic's net-new rule and confidence bar are unchanged.

### Targets

- `plugin/agents/branch-reviewer.md`
- `plugin/agents/skeptic-reviewer.md`

**Work:**

- [ ] `branch-reviewer.md` → `## Read first`: one bullet — the planning rounds' incidental findings: run one plain `grep -rn -A 40 '^## Incidental findings (not gating)'` over the five folders (single quotes, no `$` in the command) above for this branch (a folder that does not exist is no lead, never a blocker), and treat each entry per `${CLAUDE_PLUGIN_ROOT}/instructions/plan_review_rounds.md` → `## Incidental findings — where they go and who reads them`: a lead to check against the diff in Pass 1, never a finding by itself.
- [ ] `skeptic-reviewer.md` → `## Read first`: the same bullet, worded to its scope — a lead it verified and that the committed reviews did not already flag is a candidate net-new finding under its existing confidence bar; an unverified lead is dropped silently.
- [ ] Both: the `## Read first` *"A cited path you cannot read is a finding, not a fallback."* paragraph is unchanged — the incidental-findings grep reads files that may legitimately not exist, which the bullet says, so an absent folder is not a refusal.

**Verification:**

- `grep -n "Incidental findings (not gating)" plugin/agents/branch-reviewer.md plugin/agents/skeptic-reviewer.md` finds one bullet in each `## Read first`, each citing `plan_review_rounds.md` by that section heading.
- Neither file's `## Invocation contract` block changed: `git diff -- plugin/agents/branch-reviewer.md plugin/agents/skeptic-reviewer.md` shows edits only inside `## Read first`.
