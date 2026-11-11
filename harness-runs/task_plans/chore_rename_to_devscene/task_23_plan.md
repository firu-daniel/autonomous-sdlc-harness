### Task 23 — Respell the CLI, analyze, config, watcher and outer-loop reference documents

**Goal:** The reference documents for the CLI, the analyze command, the configuration, the watcher, the outer-loop verification and the flow-graph walker name every command, package, label and machine path under the new names. Apply the spelling table and the measured-records rule in the story index's `## Context`.

**Depends on:** these tasks, whose values these documents describe:

- Task 1: the launchd label `com.devscene.watcher.<slug>`, the XDG machine directories `…/devscene`, and the `.gitignore` block header.
- Task 2: `npx devscene …` in every message the CLI prints.
- Tasks 5 and 6: the watcher's `/devscene:<command>` notifications, `watcher.env` / `push.env` under `~/.config/devscene/`, and the run-profile and usage-lane paths.
- Task 11: the plugin `devscene`.

**Where this task stops.** No heading changes. The `| \`<branch>_… \` | \`/branch-…\` |` table cells in `docs/watcher.md` and the `| \`task\` | \`/branch-start-plan-autonomous\` |`-shaped cells in `docs/outer-loop-verification.md` → `### 2.2 The launch prompt` carry no product name and stay byte-identical: `scripts/check-command-spelling.sh` exempts them by that text. The example registry entry in `docs/watcher.md` is illustrative, not measured, so it is respelled without a disclosure. `docs/outer-loop-verification.md` records past verification runs, so it gains the disclosure sentence if any record line in it is respelled.

### Targets

- `docs/cli.md`
- `docs/analyze.md`
- `docs/config.md`
- `docs/watcher.md`
- `docs/outer-loop-verification.md`
- `docs/flow-graph-walker.md`

**Work:**

- [ ] `docs/cli.md`: every `npx autonomous-sdlc-harness …` (fenced blocks and inline), `/autonomous-sdlc-harness:<command>`, the launchd-label sentence in the daemon section (`com.devscene.watcher.<slug>`), machine paths, and the package name in prose (`DevScene`, or `devscene` in backticks).
- [ ] `docs/analyze.md` (`/devscene:harness-analyze` throughout) and `docs/config.md` (the `<launchd_label>` row, and the row naming `/devscene:harness-analyze`).
- [ ] `docs/watcher.md`: the label paragraph, the illustrative `daemon list` JSON (`"label": "com.devscene.watcher.users-me-work-acme"` and its `unitPath`), the `watcher.env` and usage-lane paths, and every `/devscene:<command>`.
- [ ] `docs/outer-loop-verification.md` and `docs/flow-graph-walker.md`: respell each hit. Where an `outer-loop-verification.md` hit sits inside a recorded run, add the disclosure sentence under that document's opening statement.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- docs/cli.md docs/analyze.md docs/config.md docs/watcher.md docs/outer-loop-verification.md docs/flow-graph-walker.md` prints nothing.
- `git grep -n -F -e '| `/branch-start-plan-autonomous` |' -e '| `/branch-start-user-review-fix-autonomous` |' -e '| `/branch-start-docs-autonomous` |' -- docs/watcher.md docs/outer-loop-verification.md` prints the same lines as at `HEAD`.
- `git diff -U0 -- docs/cli.md docs/analyze.md docs/config.md docs/watcher.md docs/outer-loop-verification.md docs/flow-graph-walker.md` shows no changed line starting with `#`.
