### Task 1 — Add `execution.target` to the config model and the structural check

**Goal:** Declare the one key that chooses where a run executes — `execution.target`, `"local"` | `"github-actions"`, schema default `"local"` — in `cli/src/config/model.ts` and `cli/src/config/check.ts`, with the one predicate every TypeScript reader imports, so `config set execution.target github-actions` works and a typo is refused.

**Where this task stops.** It declares and checks the key and nothing reads it yet. Its readers are Task 17 (`init` writes the workflows), Task 18 and Task 19 (`doctor`), and — through the shell reader Task 3 adds — Task 11 (the watcher dispatches). The schema property is **Task 25's** (the configured layer order puts `general` last, as `feat_docs_catalog_retrieval` did for `docs.retrieval`): write the check clause from the exact schema clause stated below, so the four places agree by the end of the branch. `docs/config.md` §5 is Task 26's.

**The contract, stated once for every consumer.**

- Schema clause Task 25 adds, which this task mirrors: a top-level optional object `execution` with `additionalProperties: false` and one property `target`: `{ "type": "string", "enum": ["local", "github-actions"], "default": "local", "description": "Where an unattended run executes: on this machine, or in a GitHub Actions job the watcher dispatches." }`.
- Exports from `cli/src/config/model.ts`: `EXECUTION_TARGETS = ['local', 'github-actions'] as const`; `type HarnessExecutionTarget`; `interface HarnessExecution { target?: HarnessExecutionTarget }`; `HarnessConfig.execution?: HarnessExecution` placed where the schema places it (after `design`, or wherever Task 25 puts the property — keep the key order comment true); `DEFAULTS.execution = { target: 'local' }`; and `remoteExecutionApplies(config: HarnessConfig): boolean`, true exactly when `(config.execution?.target ?? DEFAULTS.execution.target) === 'github-actions'`.
- `buildConfig` in `cli/src/generators/harnessConfig.ts` is **not** changed: a fresh `init` writes no `execution` key, which is what keeps Acceptance 1 true.

### Targets

- `cli/src/config/model.ts` — the enum, the interface, the `DEFAULTS` entry and the predicate.
- `cli/src/config/check.ts` — the `execution` section in `checkConfigShape`.
- `cli/test/config-command.test.mjs` — the accompanying cases.

**Work:**

- [ ] `model.ts`: add the declarations above, each with a doc comment in the module's style. `EXECUTION_TARGETS` carries the "Exported for the same reason as `FORGE_KINDS`" sentence. `remoteExecutionApplies` carries a "Declared once, here, because every consumer has to agree" comment naming its four consumers (the workflow generator, the two `doctor` checks, and — as the shell mirror `hr_execution_target` — the watcher). Extend the `DEFAULTS` doc comment so its "every key the schema gives a `default`" sentence stays true.
- [ ] `check.ts`: validate `execution` as an optional object whose unknown keys are reported by `checkUnknownKeys`, and `execution.target` through `checkEnum` against `EXECUTION_TARGETS`, in the section order the file already uses. A value outside the enum is an `error` naming the allowed values.
- [ ] `config-command.test.mjs`: against a throwaway fixture, `config set execution.target github-actions` then `config get execution.target` prints `github-actions`; `config set execution.target gitlab` exits non-zero, names the two allowed values, and leaves `harness.config.json` byte-identical with no `.bak` written for the refused write; `config set execution.runner x` is refused as an unknown key. State the rule the new cases enforce in the suite's header block, beside the existing ones.

**Verification:**

- `bash scripts/typecheck.sh` and `bash scripts/test.sh` exit 0, run without a pipe.
- `grep -n "remoteExecutionApplies" cli/src/config/model.ts` finds the one declaration; `grep -rn "'github-actions'" cli/src` finds it only in `model.ts` (every later reader imports the constant or the predicate).
- An existing `init` fixture case still produces a `harness.config.json` with no `execution` key.

**Deviations from plan:**

- `bash scripts/test.sh` exited 1 rather than 0: 19 gates passed, including gate 4 (`npm test`, which runs `cli/test/config-command.test.mjs` with the new cases). Gate 11 (docs-retrieval relevance floor) failed in `evals/docs-retrieval/index-build.mjs` → `assertRealModelsAreAvailable` with "the retrieval runtime is not installed … missing: autonomous-sdlc-harness". That is an environment precondition this task does not touch. The claim that the suite passes therefore rests on gate 4 and gates 1–3 and 6 only, not on gate 11.
- The "no `execution` key after a fresh `init`" check is asserted inside the new `set execution.target github-actions` case. No existing `init` case was changed.
