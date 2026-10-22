### Task 2 — Keep a state-dir README whose bytes already match its template, so `--force` takes no `.bak` of it

**Goal:** A forced `init` stops writing a `README.md.bak` beside every run-artifact README it would rewrite with identical bytes. This applies to the tree's root README and to every per-directory README. A forced dry run on this repository reports `would replace … (backed up to README.md.bak)` for every one of them, five inside directories git ignores by their contents. The rule is the one `generators/claudeContext.ts` already applies to `.claude/CLAUDE.md`: a write that would put nothing new in the `.bak` must not spend the single `.bak` generation on it. It applies to every adopter, because it changes no file's content. It only declines a backup of bytes that were not going to change.

**Where this layer stops.** This task makes the identical case write nothing. It does **not** report anything. A README whose bytes **differ** from its template is still replaced after a `.bak` under `--force`, exactly as today, and naming each such `.bak` that lands inside a contents-ignored directory is **Task 3's** work in `cli/src/commands/init.ts`. Which directories are contents-ignored stays declared in `cli/src/generators/repoRoot.ts` → `CONTENTS_IGNORED_DIRS`, and this task neither reads nor copies that set. The ledgers' `forceOverride: 'never'` is unchanged.

**Source:** `cli/src/generators/stateDir.ts` → `writeStateDir`; `cli/src/core/writer.ts` → the module header and `WriteRequest.forceOverride`'s doc comment, which enumerate the per-request users.

### Targets

- `cli/src/generators/stateDir.ts`: the per-request `forceOverride` on the README requests, plus its header and `writeStateDir` doc comment.
- `cli/src/core/writer.ts`: **doc comments only**. The module header's paragraph that counts the per-request `forceOverride` users (*"**Three more** read the tree and answer **per request**"*) and the matching paragraph in `WriteRequest.forceOverride`'s comment gain this generator's README case. No code change here.
- `cli/test/state-dir-readme-force.test.mjs` (new): the suite for the rule.

**Work:**

- [ ] `writeStateDir`: for the root README request and each per-directory README request, read the file at the target path (a read only, `readFileSync` under a guard for absence and read failure). Set `forceOverride: 'never'` **only** when it exists and its bytes equal the template content this run enqueues. Leave `forceOverride` unset otherwise, so an absent file is still `created` and a differing one still follows the run's `--force`. A read failure leaves it unset too: the existing behaviour is the fallback, never a guess.
- [ ] Amend `cli/src/generators/stateDir.ts`'s module header and `writeStateDir`'s doc comment, which today say *"A README is template content, so `--force` replaces one after the write engine has taken a `.bak`"*. They should state the identical-bytes exception and its reason, the single-generation `.bak` (the same argument the ledger paragraph makes), and that a differing README is still replaced after a `.bak`.
- [ ] Amend the two `cli/src/core/writer.ts` doc paragraphs that enumerate the per-request `forceOverride` users, so this generator's README case is listed beside `generators/claudeContext.ts`'s identical-bytes `.claude/CLAUDE.md` case. The header is read as the engine's guarantee, so a user it does not list is a header that no longer describes the code.
- [ ] `cli/test/state-dir-readme-force.test.mjs` (new): its header opens with the rule, in the words *a forced `init` takes no `.bak` of a run-artifact README whose bytes already are its template, and still replaces a differing one after a `.bak`*. Drive the compiled CLI (`runCli` from `cli/test/helpers/fixture.mjs`) against a throwaway fixture: `init`, then `init --force`. Assert that no file ending `README.md.bak` exists anywhere under the fixture's `stateDir` (walk the tree rather than listing paths). Then overwrite one contents-ignored README (`sdlc-harness/scratch/README.md`) and one committed one (`sdlc-harness/task_prompts/README.md`) with edited text and run `init --force` again. Each now has a `.bak` holding exactly the edited text, the README is back to the template bytes, and no other `README.md.bak` appeared. That second arm is the first arm's perturbation: one edit apart, opposite outcome.

**Verification:**

- `npm test --workspace cli -- test/state-dir-readme-force.test.mjs`, run from the repository root as one plain foreground command, passes.
- The ledgers are unaffected: `git grep -n "forceOverride" -- cli/src/generators/stateDir.ts` shows the ledgers' unconditional `'never'` unchanged, beside the new conditional one.
- `commands.typecheck` (`bash scripts/typecheck.sh`) exits zero.
