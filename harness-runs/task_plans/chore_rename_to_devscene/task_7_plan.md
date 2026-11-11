### Task 7 — Respell the `daemon`, stack-preset and retrieval suites and the shared fixture helper

**Goal:** The suites that pin what `daemon` writes and what the stack presets propose, and the fixture helper that plants the retrieval cache, expect the new names. They pass against the CLI and templates Tasks 1–6 renamed.

**Depends on:** Tasks 1–6. The values these files pin, and their owners:

- `ANALYZE_COMMAND` = `/devscene:harness-analyze`, from `PLUGIN_NAME` (Task 1).
- The machine directory `devscene` under each XDG base (Task 1, `MACHINE_DIR_NAME`).
- The retrieval runtime `…/devscene/retrieval/runtime` with its `node_modules/devscene/dist/cli.js` entry (Task 1).
- The launchd label `com.devscene.watcher.<slug>` (Task 1).
- `cli/package.json` → `name` `devscene`, which the fixture helper's planted runtime manifest is read from (Task 1).

**Where this task stops.** `cli/test/helpers/fixture.mjs` is owned here. Tasks 8–10 and 18 import from it but do not edit it, so its retrieval-cache helpers must come out of this task already pointing at `<cacheHome>/devscene/retrieval`.

`cli/test/init.test.mjs` is **not** this task's. That suite reads this workspace's own `plugin/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` (its rendered-offer case, `pluginKey()`, and the *"the shipped manifests name a resolved owner, agree on it, and resolve an unflagged run"* case). Those manifests keep the old name until Task 11 and Task 14, so `init.test.mjs` cannot pass at this point in the order. Task 18 respells it after both have landed. This task neither edits nor runs it.

### Targets

- `cli/test/daemon.test.mjs`
- `cli/test/stack-presets.test.mjs`
- `cli/test/docs-retrieval.test.mjs`
- `cli/test/helpers/fixture.mjs`

**Work:**

- [ ] `daemon.test.mjs`: `LAUNCHD_LABEL_PREFIX = 'com.devscene.watcher.'`, `MACHINE_DIR = 'devscene'`, the seeded labels and plist names, and the two `launchd.label` / `targetPath` expectations, plus every comment naming the product.
- [ ] `stack-presets.test.mjs`: the two ``"`/devscene:harness-analyze`'s to propose"`` keys and the header comment.
- [ ] `helpers/fixture.mjs`: the retrieval-cache helpers and their doc comments, `<cacheHome>/devscene/retrieval`, and the planted runtime `node_modules/devscene/dist/cli.js` and `node_modules/devscene/package.json`. `docs-retrieval.test.mjs`: the models directory `join(cacheHome, 'devscene', 'retrieval', 'models')`.
- [ ] Run each of the three edited suites through `npm test --workspace cli -- test/<name>.test.mjs` from the checkout root, one plain foreground command each. `helpers/fixture.mjs` is not a suite: `test/docs-retrieval.test.mjs`, which imports its retrieval helpers, is the run that exercises it.

**Verification:**

- `daemon.test.mjs`, `stack-presets.test.mjs` and `docs-retrieval.test.mjs` pass.
- `git grep -n -F 'autonomous-sdlc-harness' -- cli/test/daemon.test.mjs cli/test/stack-presets.test.mjs cli/test/docs-retrieval.test.mjs cli/test/helpers/fixture.mjs` prints nothing.
