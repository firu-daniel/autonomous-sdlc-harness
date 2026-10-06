### Task 1 — Declare `execution.progressComments` in the configuration model and its check

**Goal:** Add the configuration key that turns item 6's phase-progress comment off. `execution.progressComments` is a boolean, default `true`, and it joins the TypeScript model and the hand-written configuration check, so `doctor` and `config` accept the key and name a value that is not a boolean.

**Where this task stops.** This task covers two of the key's four places (`.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`, shape 1). The schema property and the `docs/config.md` §5 row are **Task 14's**. The layer order ships the catch-all layer last, so they land after this task. Until then no configuration carries the key, and the shell reader defaults it on, so the gap is inert. The key's only run-time reader is the shell function `hr_progress_comments`, which **Task 2** adds, and **Task 9** consumes it. Nothing in `cli/src` reads the value to decide anything. The model field's doc comment says so, which meets the *"a consumer or a written statement of which work delivers one"* clause of `.claude/context/conventions.md` → `## What accompanies a new unit of each kind`.

**The contract both sides use:** the key `execution.progressComments`, a JSON boolean. Absent means `true`, so the comment is posted, and `false` turns it off. The same `lowerCamelCase` identifier is used in JSON and in TypeScript, with no mapping layer (`.claude/context/conventions.md` → *"Serialized names and in-language names are the same identifiers."*).

### Targets

- `cli/src/config/model.ts` — `HarnessExecution` (the `progressComments?: boolean` field) and `DEFAULTS.execution`.
- `cli/src/config/check.ts` — `EXECUTION_KEYS` and the `execution` section's checks.
- `cli/test/config-command.test.mjs` — a case for the new key.

**Work:**

- [ ] `cli/src/config/model.ts`: add `progressComments?: boolean` to `HarnessExecution`. Its doc comment condenses the schema description Task 14 writes to one line: *whether a run on GitHub Actions with `forge` `github` keeps one phase-progress comment on its pull request; read at run time by `hr_progress_comments` in the run library, and by nothing in this package*. Add `progressComments: true` to `DEFAULTS.execution`, because the schema gives the key a default and `DEFAULTS` mirrors every schema default (its own doc comment states that rule). Keep the existing *"`execution` is the one section here that no generator seeds"* sentence true: `buildConfig` still writes no `execution` key.
- [ ] `cli/src/config/check.ts`: extend `EXECUTION_KEYS` from `['target']` to `['target', 'progressComments']`, so the key is not reported as unknown. Inside the `if (execution !== undefined)` block, after the `checkEnum` for `target`, add `checkBoolean(execution, 'progressComments', 'execution', problems)`, the same helper `phases` and `docs.retrieval` use. The module header's sentence that the key sets mirror the schema stays true once Task 14 lands.
- [ ] `cli/test/config-command.test.mjs`: add one case in that suite's own style. It drives the built CLI against a throwaway fixture (`cli/test/helpers/fixture.mjs`) and shows that a `harness.config.json` carrying `"execution": {"progressComments": "yes"}` is reported, naming `execution.progressComments`. It also shows that `"progressComments": false` and an absent key are both accepted with no problem named. Assert on the reported text the suite already reads, never by stubbing `console`.

**Verification:**

- `npm test --workspace cli -- test/config-command.test.mjs` passes, run once from the repository root as one plain foreground command.
- `bash scripts/typecheck.sh` passes. `noUnusedLocals` / `noUncheckedIndexedAccess` stay clean, and `DEFAULTS` keeps its `as const`.
- Grep `cli/src` for `progressComments` and find it only in `model.ts` and `check.ts`. The reader is the shell's, so no other module may grow a second one.
