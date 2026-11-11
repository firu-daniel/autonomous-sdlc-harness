### Task 6 — Respell the shared run library and the remaining script templates

**Goal:** The shell half of every machine-scoped name moves to `devscene`, together with the remaining script templates' messages, headers and REPRO lines. Apply the spelling table in the story index's `## Context`.

**Depends on:** Task 1, which set the TypeScript halves this library mirrors. Each pair must now agree byte for byte:

| TypeScript owner (Task 1) | Shell mirror (this task) | Value |
|---|---|---|
| `cli/src/machine/paths.ts` → `MACHINE_DIR_NAME` | `harness-run-lib.sh` → the cache, config and state directory functions (`printf '%s/devscene\n' …`, three sites) | `devscene` |
| `cli/src/doctor/keepAwake.ts` → `KEEP_AWAKE_WHO` | `harness-run-lib.sh` → `HR_KEEP_AWAKE_WHO` | `devscene` |
| `cli/src/retrieval/runtime.ts` → `RUNTIME_CLI_RELATIVE` | `docs-search-server.sh` → `entry="$cache_dir/retrieval/runtime/node_modules/devscene/dist/cli.js"` | `node_modules/devscene/dist/cli.js` |

**Where this task stops.** No test file. Task 9 respells the suites that pin the library and `docs-search-server.sh`. This repository's own `scripts/lib/harness-run-lib.sh` and `scripts/docs-search-server.sh` are Task 17's byte copies. The suite that sources the root library, `cli/test/sandbox-probe-job-launch.test.mjs`, is Task 18's.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`
- `cli/templates/scripts/docs-search-server.sh`
- `cli/templates/scripts/cleanup-merged-worktrees.sh`, `cli/templates/scripts/create-worktree.sh`, `cli/templates/scripts/flow-walker.sh`, `cli/templates/scripts/prompt-injection-screen.sh`
- `cli/templates/scripts/deploy.sh`, `cli/templates/scripts/start-dev-server.sh`, `cli/templates/scripts/test.sh`, `cli/templates/scripts/typecheck.sh`
- `cli/templates/scripts/README.md`

**Work:**

- [ ] `lib/harness-run-lib.sh`: the three `printf '%s/autonomous-sdlc-harness\n' "${base%/}"` sites become `printf '%s/devscene\n' "${base%/}"`; `HR_KEEP_AWAKE_WHO='devscene'`; the placeholder manifest becomes `printf '%s/devscene-placeholders/%s.absent\n' …`, with its comment `$RUNNER_TEMP/devscene-placeholders/<hr_sanitize_branch branch>.absent`; and the REPRO block's two `machine dirs` lines respelled. No function name, variable name or other byte changes.
- [ ] `docs-search-server.sh`: the runtime `entry=` path, the header comment's `node_modules/devscene/dist/cli.js`, and the four `npx devscene doctor` / `npx devscene init` messages.
- [ ] `cleanup-merged-worktrees.sh` (the two `run-profiles` comments), `create-worktree.sh` (the two `npx devscene doctor` echo lines), `flow-walker.sh` (*"re-run devscene init"*), `prompt-injection-screen.sh` (the REPRO header line and the three `/devscene:branch-status` / `/devscene:branch-*` texts in the park message).
- [ ] The `# Written by \`devscene init\`, and yours from there on …` header line of `deploy.sh`, `start-dev-server.sh`, `test.sh` and `typecheck.sh`, and `npx devscene init --force` in `scripts/README.md`'s fenced block.
- [ ] Parse each edited `.sh` file with `bash -n <file>`, one plain command per file.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- cli/templates/scripts` prints nothing (Task 5 has already cleared the four files it owns).
- `bash -n` exits 0 on each edited `.sh` file.
- `git grep -n -F -e "HR_KEEP_AWAKE_WHO='devscene'" -e "%s/devscene" -- cli/templates/scripts/lib/harness-run-lib.sh` lists the keep-awake constant, every directory site and the manifest site, and `git show HEAD:cli/templates/scripts/lib/harness-run-lib.sh` carries the old spelling at exactly those sites.
