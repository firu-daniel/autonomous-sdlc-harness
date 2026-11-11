### Task 10 — Respell the watcher, remote and prompt-injection suites

**Goal:** The suites that pin the commands the watcher, `remote-run.sh` and the prompt-injection park tell a person to run expect `/devscene:<command>`, and pass against the renamed templates.

**Depends on:** Tasks 1, 2, 5, 6 and 7. The values pinned here, and their owners:

- The notification and comment texts `/devscene:branch-resume <branch>`, `/devscene:branch-answer`, `/devscene:branch-status`, `/devscene:branch-qa-test` and `/devscene:branch-user-review` (Task 5's watcher and `remote-run.sh`).
- `MENTION_COMMAND` = `/devscene:harness-read-mention`, held equal in TypeScript (Task 1, through `PLUGIN_NAME`) and in `remote-run.sh` (Task 5).
- The prompt-injection park's `/devscene:branch-status` and `/devscene:branch-*` (Task 6).
- The stall-reset payloads' `devscene@<version>` and the planted `node_modules/devscene` package (Task 5's watcher, which runs `npx --yes "devscene@$HARNESS_CLI_VERSION"`).

### Targets

- `cli/test/watcher-remote-job.test.mjs`
- `cli/test/watcher-ledger-classification.test.mjs`
- `cli/test/watcher-stall-reset-payloads.test.mjs`
- `cli/test/prompt-injection-park.test.mjs`
- `cli/test/remote-run.test.mjs`
- `cli/test/remote-collect.test.mjs`
- `cli/test/remote-control-mention.test.mjs`
- `cli/test/remote-deliver.test.mjs`
- `cli/test/remote-names.test.mjs`
- `cli/test/remote-report.test.mjs`
- `cli/test/remote-review-payloads.test.mjs`

**Work:**

- [ ] Watcher suites: every `/\/autonomous-sdlc-harness:branch-…/` expression in `watcher-remote-job.test.mjs`, including `SKIP_DETAIL` and the `new RegExp(…branch-answer…)`, and `RESUME_COMMAND = '/devscene:branch-resume feat_x'` in `watcher-ledger-classification.test.mjs`.
- [ ] `watcher-stall-reset-payloads.test.mjs`: the expected `devscene@${CLI_VERSION}`, and the planted session package. That is `dependencies: { devscene: CLI_VERSION }`, the directory `node_modules/devscene`, the `package.json` `{ name: 'devscene', … bin: { devscene: 'cli.js' } }`, the `node_modules/.bin/devscene` link to `../devscene/cli.js`, and the doc comment.
- [ ] Remote suites: `remote-run.test.mjs` (every `/devscene:branch-resume feat_x` expectation and the `doesNotMatch(…/\/devscene:/)` one), `remote-collect.test.mjs`, `remote-control-mention.test.mjs` (`MENTION_COMMAND` and the `/devscene:branch-user-review` reply), `remote-deliver.test.mjs`, `remote-names.test.mjs` (`assert.equal(MENTION_COMMAND, '/devscene:harness-read-mention')`), `remote-report.test.mjs` (`doesNotMatch(…, /\/devscene:/)`) and `remote-review-payloads.test.mjs`'s header comment. A negative assertion is respelled, never deleted, so it still guards something.
- [ ] `prompt-injection-park.test.mjs`: the two expressions `` /`\/devscene:branch-status` prints for/ `` and `` /`\/devscene:branch-\*` commands/ ``.
- [ ] Run each edited suite through `npm test --workspace cli -- test/<name>.test.mjs` from the checkout root, one plain foreground command each.

**Verification:**

- All eleven edited suites pass.
- `git grep -n -F 'autonomous-sdlc-harness' -- cli/test/watcher-remote-job.test.mjs cli/test/watcher-ledger-classification.test.mjs cli/test/watcher-stall-reset-payloads.test.mjs cli/test/prompt-injection-park.test.mjs cli/test/remote-run.test.mjs cli/test/remote-collect.test.mjs cli/test/remote-control-mention.test.mjs cli/test/remote-deliver.test.mjs cli/test/remote-names.test.mjs cli/test/remote-report.test.mjs cli/test/remote-review-payloads.test.mjs` prints nothing.
