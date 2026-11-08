### 3. `sandboxPassEnv` is a new export with no caller

**File:** `cli/src/config/model.ts` (`sandboxPassEnv`) — "export function sandboxPassEnv(config: HarnessConfig): readonly string[]"

The branch adds the exported reader `sandboxPassEnv(config)`. A grep of every layer path (`cli`, `plugin` and the repository root) for `sandboxPassEnv` finds three hits, and none of them is a call. One is the declaration. One is the `{@link sandboxPassEnv}` in the `HarnessSandbox` doc comment ("Read through {@link sandboxOptedOut}, {@link sandboxAllowedDomains} and {@link sandboxPassEnv}."). One is a task-plan line under `harness-runs/`. `checkSandbox` in `cli/src/config/check.ts` reads `sandbox['passEnv']` directly, as it does the other two sandbox keys. The key's only run-time consumer is the shell reader `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_session_pass_env`, which `autonomous-watcher.sh` → `spawn_engine` calls. No `init` generator and no `doctor` check reads the key. The sibling readers that the doc comment puts beside it do have callers: `sandboxOptedOut` and `sandboxAllowedDomains` are imported by the profile generator and by `doctor`.

`noUnusedLocals` does not catch an unused export, so this dead reader stays in the tree. It also tells a later reader that a TypeScript consumer of `sandbox.passEnv` exists, and none does.

**Fix:** remove the reader and the doc-comment link that advertises it. Leave `SANDBOX_PASS_ENV_PATTERN` and the `passEnv` field in place, since `checkSandbox` and the schema mirror both use them.

1. In `cli/src/config/model.ts`, delete the doc comment "/** The configured `sandbox.passEnv` names; an absent key is none. Import it; do not re-spell the fallback. */" and the `sandboxPassEnv` function under it.
2. In the same file, change the `HarnessSandbox` doc comment to "/** The unattended run's Bash sandbox. Read through {@link sandboxOptedOut} and {@link sandboxAllowedDomains}; `passEnv` has no TypeScript reader, and the run watcher reads it through `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_session_pass_env`. */".
3. Run `commands.typecheck` (`bash scripts/typecheck.sh`) to confirm that nothing imported the removed function. No test file changes.
