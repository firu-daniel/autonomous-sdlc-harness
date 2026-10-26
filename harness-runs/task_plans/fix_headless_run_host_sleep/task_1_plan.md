### Task 1 — Add `execution.keepAwake` to the configuration model and its structural check

**Goal:** The configuration model carries `execution.keepAwake`, a boolean whose default is `true`. It is exposed through one reader, `keepAwakeEnabled(config)`. The structural check accepts `true` and `false` and reports any other value, so `config set`, the write guard and `doctor`'s `config` check all treat the key as declared rather than unknown.

**Where this task stops.** This task changes only the two TypeScript modules under `cli/src/config/` and adds cases to `cli/test/config-command.test.mjs`. **Task 9** adds the schema property under `schemas/harness.config.schema.json` → `properties.execution.properties` and the `docs/config.md` §5 row. Until then the model is ahead of the schema, a state no gate sees, because the gates run after Task 10. Every consumer is a later task. The shell reader `hr_keep_awake` is **Task 2**'s. **Task 8**'s `keep-awake` check calls `keepAwakeEnabled` exactly as this file defines it:

```ts
export function keepAwakeEnabled(config: HarnessConfig): boolean
```

It returns `false` only when `config.execution?.keepAwake === false`, and `true` otherwise, including when `execution` or the key is absent.

### Targets

- `cli/src/config/model.ts` — `HarnessExecution.keepAwake`, `DEFAULTS.execution.keepAwake`, `keepAwakeEnabled`.
- `cli/src/config/check.ts` — `EXECUTION_KEYS` and the boolean check.
- `cli/test/config-command.test.mjs` — the key's acceptance and refusal cases.

**Work:**

- [ ] `model.ts` → `HarnessExecution`: add `keepAwake?: boolean`, with a one-line doc comment condensed from the schema description Task 9 writes: *"Whether a run the local watcher launches holds this host awake for its engine's life (macOS on AC power, Linux on mains power); read at run time by `hr_keep_awake_mode_var` in the run library and by `doctor`'s `keep-awake` check through `keepAwakeEnabled`."* Extend `DEFAULTS.execution` to `{ target: 'local', progressComments: true, keepAwake: true }`. The `DEFAULTS` doc comment's sentence that "no generator seeds" `execution` stays true, because `buildConfig` still writes no `execution` key. Leave it unchanged.
- [ ] `model.ts`: add `keepAwakeEnabled(config: HarnessConfig): boolean` beside `remoteExecutionApplies`, with a doc comment stating it is the one TypeScript reader of the key and naming its shell mirror, `hr_keep_awake` in `cli/templates/scripts/lib/harness-run-lib.sh` (Task 2). Its absent-is-true rule matches that mirror.
- [ ] `check.ts`: `EXECUTION_KEYS` becomes `['target', 'progressComments', 'keepAwake']`. In the `execution` section, add `checkBoolean(execution, 'keepAwake', 'execution', problems);` after the `progressComments` one. Extend the `checkBoolean` doc comment ("A declared boolean key: the three `phases` toggles, `docs.retrieval` and `execution.progressComments`") to name `execution.keepAwake`.
- [ ] `config-command.test.mjs`: add a case beside *"execution.progressComments is reported when it is not a boolean, and accepted false or absent"*, built the same way through `withExecution`. A file with `{ keepAwake: 'yes' }` has `doctor`/`config` report `execution.keepAwake: must be true or false`, and `config get` refuses it naming `execution.keepAwake`. `{ keepAwake: false }` and `{ keepAwake: true }` are accepted. And `config set execution.keepAwake false` stores the JSON boolean `false`, not the string. Extend the file header's rule sentence (*"`execution.target` takes exactly `local` or `github-actions`, `execution.progressComments` only a …"*) to name `execution.keepAwake`.

**Verification:**

- `bash scripts/typecheck.sh` exits 0. `noUnusedLocals` holds, because `keepAwakeEnabled` is exported.
- `npm test --workspace cli -- test/config-command.test.mjs` passes, the new case included.
- `grep -n "keepAwake" cli/src/config/check.ts` hits `EXECUTION_KEYS` and the one `checkBoolean` call, and nothing else outside a comment.
