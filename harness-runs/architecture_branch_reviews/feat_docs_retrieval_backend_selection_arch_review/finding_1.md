### 1. Declare the shell mirrors of `retrievalApplies` and `DEFAULT_RETRIEVAL_BACKEND` in `config/model.ts`

**Severity:** Must Fix

**Site:** `cli/src/config/model.ts`. Two places:
- the doc comment above `export function retrievalApplies(config: HarnessConfig): boolean`, at the sentence *"nothing checks two spellings of the config question against each other, so there is only ever one. Import it; do not re-spell it."* (around line 562);
- the doc comment above `export const DEFAULT_RETRIEVAL_BACKEND` (around line 513).

**Problem.** This branch adds a second spelling of both values, in shell:

- `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_docs_retrieval_applies` is introduced as *"The shell mirror of `cli/src/config/model.ts` → `retrievalApplies`: change the predicate there and here together."* The launcher `cli/templates/scripts/docs-search-server.sh` routes on it.
- `hr_docs_retrieval_backend` prints the literal `typescript` for an absent key. It calls itself the shell mirror of `RETRIEVAL_BACKENDS` / `DEFAULT_RETRIEVAL_BACKEND`. The launcher also seeds `backend=typescript` as its own default.

The owner module does not record either copy. `retrievalApplies`'s header still says the predicate has exactly one spelling. `DEFAULT_RETRIEVAL_BACKEND`'s header names no mirror. Only `RETRIEVAL_BACKENDS`' comment names `hr_docs_retrieval_backend`, and it does so as the enum's mirror, not the default's. So a maintainer who reads the owner and changes the predicate or the default has nothing pointing at the shell copies. The launcher would then gate or default on a different answer from `init` and `doctor`, and no test compares the two spellings.

This breaks rules in the conventions documents:

- `.claude/context/cli.md` → `## What "done" means here`: *"A reviewer holds a change to its module's own header. Where the header states a rule, the change either satisfies it or amends the header in the same edit."* `retrievalApplies`' header states a single-spelling rule. The branch broke that rule and did not amend the header.
- `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one."* The established way to allow a shell copy of a model predicate is to declare it at the owner. The model's own `remoteExecutionApplies` (*"— as the shell mirror `hr_execution_target` — the watcher"*) and `forgeTriggerApplies` (*"as the shell mirror `hr_forge` plus `hr_execution_target`"*) both do this. `retrievalApplies` and `DEFAULT_RETRIEVAL_BACKEND` now have shell copies and declare neither.

**Fix.** Edit only the two doc comments in `cli/src/config/model.ts`. No code changes.

1. In `retrievalApplies`' comment, replace the claim that there is only one spelling with a declaration of the mirror, in the same form `remoteExecutionApplies` uses. For example: *"…`doctor`'s checks, and — as the shell mirror `hr_docs_retrieval_applies` in `cli/templates/scripts/lib/harness-run-lib.sh` — the `docs-search-server.sh` launcher. A drift between them would start a backend `init` and `doctor` never prepared or graded. Change the predicate there and here together; import it everywhere else, and do not re-spell it."*
2. In `DEFAULT_RETRIEVAL_BACKEND`'s comment, add one sentence declaring its shell copies: *"Its shell mirrors are `hr_docs_retrieval_backend`'s absent-key answer in `cli/templates/scripts/lib/harness-run-lib.sh` and the `backend=typescript` seed in `cli/templates/scripts/docs-search-server.sh`; change all three together."*

Verification: run `commands.typecheck` (`bash scripts/typecheck.sh`). No test file is created or edited, so no test run is needed.
