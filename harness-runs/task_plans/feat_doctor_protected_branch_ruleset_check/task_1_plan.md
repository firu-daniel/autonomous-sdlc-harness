### Task 1 — Add `cli/src/doctor/branchProtection.ts`, the pure grading of GitHub's ruleset and branch-protection answers

**Goal:** Give `doctor` one place that decides, from GitHub's two answers for a branch, which of *direct pushes*, *force pushes* and *deletion* are blocked, how that branch grades, and the one-line sentence the check prints. Every meaning is fixed here, so the check in Task 2 only gathers answers and hands them over.

**Where this module stops.** It reads nothing, spawns nothing and imports nothing from `cli/src/doctor/checks.ts`. Every GitHub answer reaches it as an argument (a `gh api` stdout string, or an already-classified read). It returns its own `{ grade, detail }` record rather than a `CheckOutcome`. Gating on `forge` / `--check-github`, resolving the protected set, running `gh` and mapping the grade onto a `CheckOutcome` all belong to **Task 2**, which consumes the exports below by these exact names and signatures. The module follows `cli/src/doctor/keepAwake.ts`, a pure assessment beside `checks.ts` whose facts arrive as arguments.

### Targets

- `cli/src/doctor/branchProtection.ts` (new): the needs, the endpoint builders, the two parsers, the per-branch assessment and the sentence.
- `cli/test/branch-protection.test.mjs` (new): pure cases against the compiled module, the accompanying test a new unit owes.

**Work:**

- [ ] **Module header**, per `.claude/context/cli.md` → `## Naming and file layout` (every file under `cli/src/` opens with one). It states **"The rule this module exists to enforce: a protected branch is reported covered only when GitHub's answers prove direct pushes, force pushes and deletion all blocked, and an answer that could not be read is graded neither covered nor missing."** It also states three things. The module is pure, like `keepAwake.ts`. Ruleset bypass actors and the org-level ruleset view are not visible through the per-branch rules endpoint, so they are not graded. An absent or malformed classic field credits nothing, a deliberate conservative choice.
- [ ] **The needs and the endpoints.** Export:
  - `type ProtectionNeed = 'push' | 'force-push' | 'deletion'` and `PROTECTION_NEEDS: readonly ProtectionNeed[]` in that order.
  - `PROTECTION_NEED_LABEL: Readonly<Record<ProtectionNeed, string>>` = `direct pushes` / `force pushes` / `deletion`. It is a total record, so adding a need is a compile error until every table is extended (`.claude/context/conventions.md` → *"type it as a total record"*).
  - `RULESET_RULE_NEED: Readonly<Record<string, ProtectionNeed>>`, mapping the ruleset rule `type` values of GitHub's REST *Get rules for a branch* answer: `pull_request` → `push`, `update` → `push`, `non_fast_forward` → `force-push`, `deletion` → `deletion`.
  - `branchRulesEndpoint(branch: string): string` returns `` `repos/{owner}/{repo}/rules/branches/${encodeURIComponent(branch)}?per_page=100` ``.
  - `classicProtectionEndpoint(branch: string): string` returns `` `repos/{owner}/{repo}/branches/${encodeURIComponent(branch)}/protection` ``. `gh` fills `{owner}`/`{repo}` from the checkout, as `checks.ts`'s existing endpoint constants rely on.
  - `CLASSIC_UNPROTECTED_PATTERN = /Branch not protected|Branch not found/i`, the refusal text that means *no classic protection* rather than *unreadable*.
- [ ] **The two parsers**, each returning `undefined` for a shape it does not read, in the manner of `checks.ts` → `retentionDaysOf`:
  - `rulesetBlocksOf(stdout: string): ReadonlySet<ProtectionNeed> | undefined`. The input must be a JSON array whose every element is an object with a string `type`. Each `type` found in `RULESET_RULE_NEED` credits its need, and any other `type` is ignored.
  - `classicProtectionOf(stdout: string): ClassicProtection | undefined`, where `interface ClassicProtection { readonly blocks: ReadonlySet<ProtectionNeed>; readonly adminsExempt: boolean }`. The input must be a JSON object. The fields are those of GitHub's REST *Get branch protection* answer:
    - `push` is credited when `required_pull_request_reviews` is an object, or when `lock_branch.enabled === true`.
    - `force-push` is credited when `allow_force_pushes.enabled === false`.
    - `deletion` is credited when `allow_deletions.enabled === false`.
    - `adminsExempt` is `enforce_admins.enabled !== true`.
- [ ] **The assessment and the sentence.**
  - Export `type RulesetRead = { kind: 'read'; blocks: ReadonlySet<ProtectionNeed> } | { kind: 'unreadable'; why: string }` and `type ClassicRead = { kind: 'read'; protection: ClassicProtection } | { kind: 'none' } | { kind: 'unreadable'; why: string } | { kind: 'not-asked' }`.
  - Export `interface BranchCoverage { readonly branch: string; readonly state: 'covered' | 'partial' | 'uncovered' | 'unknown'; readonly missing: readonly ProtectionNeed[]; readonly undetermined: readonly ProtectionNeed[]; readonly notes: readonly string[] }`.
  - `assessBranch(branch: string, rulesets: RulesetRead, classic: ClassicRead): BranchCoverage`. A need is blocked when any `read` source blocks it. An unblocked need is `undetermined` when either source is `unreadable`, and `missing` otherwise; `not-asked` counts as read only when the rulesets already block all three. The states are:
    - `covered` when neither list is non-empty.
    - `unknown` when `undetermined` is non-empty.
    - `uncovered` when all three are missing.
    - `partial` otherwise.
  - A note is added when classic protection credits `push` while `adminsExempt` holds (an administrator's push is not blocked by it).
  - `describeCoverage(coverages: readonly BranchCoverage[], globs: readonly string[]): { readonly grade: 'pass' | 'warn'; readonly detail: string }`. It grades `pass` only when every coverage is `covered` and `globs` is empty, and `warn` otherwise. The `detail` is one line with no newline:
    - It names each non-covered branch with its missing needs (*no ruleset or branch protection blocks …*) or its undetermined needs and their `why` (*cannot tell whether … are blocked: …*).
    - It names each glob as not checked (*names a namespace rather than one branch; confirm a ruleset targets it*).
    - It names the reason once: the commit, push and refresh wrappers run outside the sandbox from the main checkout, which the harness protects on this machine only, and the remote's protection is yours.
    - It names the remedy once: a ruleset under *Settings → Rules → Rulesets* targeting the branch, with *Restrict deletions*, *Block force pushes* and *Require a pull request before merging*.
    - It appends the notes.
  - The `pass` detail names every branch it proved covered.
- [ ] `cli/test/branch-protection.test.mjs`: a header stating the module's rule, then `import { … } from '../dist/doctor/branchProtection.js'` (as `cli/test/keep-awake.test.mjs` imports its module). Pure cases:
  - each parser on a well-formed answer, on an unknown rule type (ignored), and on a malformed one (`undefined`);
  - `assessBranch` reaching each of the four states, including a ruleset that blocks only `deletion` plus a classic `none` (`partial`, missing `push` and `force-push`), and a ruleset `read` plus a classic `unreadable` (`unknown`, never `missing`);
  - the `adminsExempt` note;
  - `describeCoverage` passing only when every branch is covered and there are no globs, and warning on a glob alone;
  - every `detail` free of `\n`;
  - `encodeURIComponent` applied to a branch carrying `/`.

**Verification:**

- `npm test --workspace cli -- test/branch-protection.test.mjs` passes. It is this task's own new test file, run from the repository root as one plain foreground command (`.claude/context/conventions.md` → `## The testing bar`).
- `bash scripts/typecheck.sh` exits zero.
- Grep `cli/src/doctor/branchProtection.ts` for `node:child_process`, `node:fs`, `runGh` and `./checks.js`, and find none.

**Deviations from plan:**

- `BranchCoverage` gains a `readonly why: string` field: the unreadable sources' reasons joined with `; ` (and `its branch protection was not asked` for a `not-asked` classic read that does not count as read), empty when `undetermined` is empty. The plan's `describeCoverage(coverages, globs)` must name each undetermined need's `why`, but the plan's `BranchCoverage` carried no `why` and `describeCoverage` receives no read, so without this field the sentence could not name it. `assessBranch`'s signature is unchanged; Task 2 reads the field through the record it already receives.
- The `warn` detail also lists the branches proved covered (`covered: …`) when any are, so a warn names every protected branch it checked.
- `describeCoverage` collapses every whitespace run in a `why` and a note to one space, so a multi-line `gh` refusal cannot break the one-line detail.
