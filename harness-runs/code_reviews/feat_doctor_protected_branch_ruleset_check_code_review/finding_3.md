### 3. The `branch-protection` severity bullet says a ruleset cannot be got around, and never says a pass ignores bypass actors

**File:** `docs/cli.md` → `## 7.`, the bullet `- **\`branch-protection\` never fails**` — "the remote's ruleset is the only protection that a person at a terminal, or a credential outside the run, cannot get around"

The bullet says the check **passes** "only where every branch is proven to block all three", and that the remote's ruleset is protection that "a person at a terminal, or a credential outside the run, cannot get around". Neither sentence tells the reader what the check deliberately does not grade. The source states it plainly: `cli/src/doctor/branchProtection.ts`'s header says **"Not graded: ruleset bypass actors and the org-level ruleset view"**, because the per-branch rules endpoint does not report who may bypass a rule. The suite says the same (`cli/test/doctor-branch-protection.test.mjs` header, `**Not covered:**`).

Who gets this wrong: an adopter whose ruleset lists a bypass actor — a role, a team, an app, or themselves — sees `PASS branch-protection`, reads this bullet, and concludes that nobody can push directly to the branch. The opposite holds for every actor on that bypass list, and the claim "cannot get around" is false for exactly those actors.

**Fix:** in that bullet, replace

> and the remote's ruleset is the only protection that a person at a terminal, or a credential outside the run, cannot get around.

with

> and the remote's ruleset is the only protection that applies to a person at a terminal or a credential outside the run. A pass does not grade who may bypass a ruleset: GitHub's per-branch read does not report bypass actors, so an actor on a ruleset's bypass list can still push, and the line notes separately where branch protection does not include administrators.

Change nothing else in the bullet. This edit touches no test.
