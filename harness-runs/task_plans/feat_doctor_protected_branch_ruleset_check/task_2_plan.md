### Task 2 — Add the `branch-protection` check to `cli/src/doctor/checks.ts` and register it after `forge`

**Goal:** Add `BRANCH_PROTECTION_CHECK` (id `branch-protection`). It gates on `forge` and `--check-github`, resolves the effective protected set, asks GitHub read-only through `gh` for each concrete branch, and grades through Task 1's module. It never grades `fail`.

**Depends on:** Task 1, which exports these from `cli/src/doctor/branchProtection.ts`:
- `branchRulesEndpoint(branch)` and `classicProtectionEndpoint(branch)`;
- `rulesetBlocksOf(stdout): ReadonlySet<ProtectionNeed> | undefined` and `classicProtectionOf(stdout): ClassicProtection | undefined`;
- `CLASSIC_UNPROTECTED_PATTERN`;
- `assessBranch(branch, rulesets: RulesetRead, classic: ClassicRead): BranchCoverage`;
- `describeCoverage(coverages, globs): { grade: 'pass' | 'warn'; detail }`.

The read types are `RulesetRead = { kind: 'read'; blocks } | { kind: 'unreadable'; why }` and `ClassicRead = { kind: 'read'; protection } | { kind: 'none' } | { kind: 'unreadable'; why } | { kind: 'not-asked' }`. This task builds those reads and maps `grade` onto `pass` / `warn`. It never re-derives what a rule or field counts for. End-to-end coverage through the compiled CLI is **Task 4's**, and the help text and `cli/README.md` are **Task 3's**.

### Targets

- `cli/src/doctor/checks.ts`: the check, its doc comment, its `CHECKS` row, and the header and `CheckContext.probeGithub` comments that name which checks reach GitHub.
- `cli/test/doctor.test.mjs`: `PRE_BRANCH_CHECK_IDS` gains the new id. Any existing case that the new check's `gh` calls disturb is adjusted (see below).

**Work:**

- [ ] **`BRANCH_PROTECTION_CHECK`.** Its doc comment states the six decisions in the story index `## Context`. Its title is `every protected branch is covered on GitHub by a ruleset or branch protection that blocks direct pushes, force pushes and deletion`. `run(ctx)` answers in this order, and every early answer is `warn`, never `unevaluated()`:
  1. **No `ctx.repoRoot`, or no `ctx.config`:** `not checked, because …` naming the git or config check.
  2. **Protected set.** `resolveProtectedBranches(ctx.config, () => {})` inside a `try`. A throw is `not checked, because the protected set does not resolve: <message> (see the pre-push-guard check)`. Split the result with `isGlobPattern` into concrete branches and globs. Both are already imported from `../generators/githooks.js`.
  3. **`ctx.config.forge !== 'github'`:** `not checked, because forge is <not set | JSON value>: only GitHub's rulesets and branch protection are read, so whether the remote protects <nameList(set)> is unknown here`, plus *confirm on your forge that each blocks direct pushes, force pushes and deletion*.
  4. **`!ctx.probeGithub`:** `` not checked — run `${CLI} doctor --check-github` to ask GitHub whether <nameList(set)> … `` and spawn nothing.
  5. **`gh auth status`**, through `runGh` / `classifyGh`, as `REMOTE_GITHUB_CHECK` asks it:
     - `undefined` (no spawn) is `warn` with the install remedy;
     - `unknown` is `warn` *cannot tell whether gh is authenticated*;
     - `refused` is `warn` naming `gh auth login`.
- [ ] **Per concrete branch**, ask `['api', branchRulesEndpoint(branch)]`:
  - `answered` gives `rulesetBlocksOf`; an `undefined` parse is `unreadable` (*answered in a shape this check does not read*). `refused` / `unknown` give `unreadable` with `classifyGh`'s `why`.
  - When the read blocks all three, the classic read is `not-asked` and no second call is made. Otherwise ask `['api', classicProtectionEndpoint(branch)]`:
    - `answered` gives `classicProtectionOf`, and an `undefined` parse is `unreadable`;
    - `refused` whose `why` matches `CLASSIC_UNPROTECTED_PATTERN` gives `none`;
    - any other `refused`, and `unknown`, give `unreadable` (classic protection needs admin access, so name that in the `why`).
  - A `gh` that stops spawning mid-run is `warn` with the install remedy.
  - Then `describeCoverage(coverages, globs)` gives `pass` or `warn` with its `detail`.
  - **Read-only:** every argv is `auth status` or `api <path>`. None carries `--method`, `-X`, `-f`, `-F`, `--field`, `--raw-field` or `--input`.
  - The remedy string `install the GitHub CLI (https://cli.github.com) and run \`gh auth login\`, or point ${GH_CLI_VARIABLE} at it` is lifted into one module-level constant that both this check and `REMOTE_GITHUB_CHECK` use, so `remote-github`'s output stays byte-identical (`.claude/context/conventions.md` → *"Before adding a copy of anything, grep for it"*).
- [ ] **Register and explain the place.** Insert `BRANCH_PROTECTION_CHECK` into `CHECKS` directly after `FORGE_CHECK`. In the ordering doc comment above `CHECKS`, add one sentence: `branch-protection` follows `forge` because it reads the same key and asks GitHub the remote half of the question `pre-push-guard` and `protected-set` answer locally.
- [ ] **Keep the module's own statements true** (`.claude/context/cli.md` → *"A reviewer holds a change to its module's own header"*):
  - In the header's choice 1, add that the protected set is `generators/githooks.ts`'s `resolveProtectedBranches` / `isGlobPattern` and the coverage grading is `doctor/branchProtection.ts`'s.
  - In choice 3's *"Remote setup keeps the same line"* paragraph, add `BRANCH_PROTECTION_CHECK` as the second check that spawns `gh` only under `CheckContext.probeGithub`, and only reads.
  - Reword `CheckContext.probeGithub`'s comment to say it is read by `REMOTE_GITHUB_CHECK` and `BRANCH_PROTECTION_CHECK`.
- [ ] **`cli/test/doctor.test.mjs`.**
  - Insert `'branch-protection'` after `'forge'` in `PRE_BRANCH_CHECK_IDS`.
  - Then run the file. A `remote-github` case on a `forge: github` fixture under `--check-github` now also sees this check's `gh auth status` and `gh api …/rules/branches/…` calls, and the stub answers an unrecorded call with exit 0 and empty output, which this check grades as an unread shape (`warn`, exit status unchanged). Where such a case asserts an exact invocation list or count, narrow that assertion to `remote-github`'s own calls. Never change the check to suit it.
  - The `--check-github` help regex in that file (`/--check-github\s+Ask GitHub, through gh, whether the remote-execution setup/`) stays untouched: Task 3 keeps that prefix.

**Verification:**

- `bash scripts/typecheck.sh` exits zero.
- `npm test --workspace cli -- test/doctor.test.mjs` passes. It is the test file this task edits.
- Grep the new check's body for every `runGh` / `ask` argv and confirm each is `auth status` or `api <path>`, and that none of the write flags listed above appears.
- Grep the new check's body for `fail(` and `unevaluated(` and find neither.
