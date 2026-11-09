### 1. A full page of 100 ruleset rules is read as the whole answer, so a branch can be reported *missing* when it could not be told

**File:** `cli/src/doctor/branchProtection.ts` (`branchRulesEndpoint`, `rulesetBlocksOf`) — "?per_page=100"; and `cli/src/doctor/checks.ts` (`BRANCH_PROTECTION_CHECK`) — "const rulesets: RulesetRead ="

`branchRulesEndpoint` asks GitHub for one page of at most 100 rules (`?per_page=100`), and `gh api` is called without `--paginate`, so a branch with more than 100 active rules returns only the first page. `rulesetBlocksOf` then treats that page as the complete answer: a `deletion` or `non_fast_forward` rule sitting on page two is never seen, the need is left unblocked, and — once the classic read answers `Branch not protected` — `assessBranch` puts it in `missing`. The line then says `no ruleset or branch protection blocks …` for a need that may well be blocked.

That breaks the rule the module header states ("an answer that could not be read is graded neither covered nor missing") and decision 2 of the story plan (*cannot tell* is never reported as *missing*). This repository already treats a full page as *cannot tell*: `remote-github` warns that it cannot tell whether GitHub could parse a workflow when the listing holds more than 100 workflows (`docs/cli.md` → `## 7.`, the `remote-execution` and `remote-github` bullet, "because the repository has more than 100 workflows").

A full page that already blocks all three needs is still a proof, because further rules can only add blocks. Only a full page that does **not** settle the branch is unreadable.

**Fix:**

1. In `cli/src/doctor/branchProtection.ts`, name the page size once and use it in the endpoint:

   ```ts
   /** The page size of the rules read; a page this full may not be the whole answer. */
   export const RULES_PAGE_SIZE = 100;

   /** The rules in force on one branch; `gh` fills `{owner}`/`{repo}` from the checkout. */
   export function branchRulesEndpoint(branch: string): string {
     return `repos/{owner}/{repo}/rules/branches/${encodeURIComponent(branch)}?per_page=${RULES_PAGE_SIZE}`;
   }

   /** Whether a rules answer filled its page, so rules past it may exist unread. */
   export function rulesPageIsFull(stdout: string): boolean {
     const parsed = parseJson(stdout);
     return Array.isArray(parsed) && parsed.length >= RULES_PAGE_SIZE;
   }
   ```

2. In `cli/src/doctor/checks.ts` → `BRANCH_PROTECTION_CHECK`, import `rulesPageIsFull` and `RULES_PAGE_SIZE` from `./branchProtection.js` and add one arm to the `rulesets` ternary, after the `blocks === undefined` arm and before the `read` arm. It reuses `rulesetsSettle` rather than re-deriving "blocks all three":

   ```ts
   const rulesets: RulesetRead =
     rulesAnswer.kind !== 'answered'
       ? { kind: 'unreadable', why: `\`gh api ${rulesPath}\` gave no answer, because ${rulesAnswer.why}` }
       : blocks === undefined
         ? { kind: 'unreadable', why: `\`gh api ${rulesPath}\` answered in a shape this check does not read` }
         : rulesPageIsFull(rulesAnswer.stdout) && !rulesetsSettle({ kind: 'read', blocks })
           ? { kind: 'unreadable', why: `\`gh api ${rulesPath}\` returned a full page of ${RULES_PAGE_SIZE} rules, so rules past it were not read` }
           : { kind: 'read', blocks };
   ```

3. In `cli/test/branch-protection.test.mjs`, import `rulesPageIsFull` and `RULES_PAGE_SIZE` and add a case: `rulesPageIsFull(JSON.stringify(Array.from({ length: RULES_PAGE_SIZE }, () => ({ type: 'required_signatures' }))))` is `true`, and `rulesPageIsFull('[]')` and `rulesPageIsFull('not json')` are `false`. Keep the existing endpoint assertion's `?per_page=100` literal: it pins the wire string.

That test file is the one this fix edits, so it is the only test the fix runs: `npm test --workspace cli -- test/branch-protection.test.mjs`.
