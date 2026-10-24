### Task 2 — Extend `cleanup-run-copies.test.mjs` with the per-run profile cases under a temp `XDG_STATE_HOME`

**Goal:** The registry-driven sweep's suite proves that the per-run profile is removed with its run's copy, and kept in every case the story index's three gates name. Every sweep the suite runs resolves the machine state directory to a temp directory under the fixture root, never to the real one.

**Depends on:** Task 1, which changes `cli/templates/scripts/cleanup-merged-worktrees.sh`. The fixture already copies that file and `lib/harness-run-lib.sh` from `cli/templates/scripts/`. This task asserts on the lines Task 1 fixes, byte for byte, where `<file>` is the absolute profile path:

- `cleanup-merged-worktrees.sh: removed run profile <file> for '<branch>'`
- `cleanup-merged-worktrees.sh: [dry-run] would remove run profile <file> for '<branch>'`
- `cleanup-merged-worktrees.sh: keep run profile <file> for '<branch>' — the live run '<b>' uses that file`
- `cleanup-merged-worktrees.sh: no run profile path for '<branch>' (hr_run_profile_file refused the repository slug or the branch) — no profile removed`

The removal happens only after `removed clone|worktree …` and before `deleted merged branch …`. The slug is `hr_repo_slug` of the main checkout, never `HARNESS_REPO_SLUG`. The path is `<XDG_STATE_HOME>/autonomous-sdlc-harness/run-profiles/<slug>/<branch with every / as ->.json`. This task changes no shell file.

### Targets

- `cli/test/cleanup-run-copies.test.mjs` — the fixture, `decisions`/`sweepBoth`, the new and extended cases, the header.

**Work:**

- [ ] **Fixture.** Add `state = join(root, 'state')` under the fixture's temp root, so the existing `listing(root)` snapshot covers it and `--dry-run`'s unchanged-tree assertion covers the profile files too. `sweep(args, env = {})` passes `{ XDG_STATE_HOME: state, ...env }` to `runBash`. Add `slug()`, which is the copied library's `hr_repo_slug "$1"` over `main` through `call`. Add `profilePath(branch, slugValue = <own slug>)`, which builds the path **literally** from the documented shape above (`join(state, 'autonomous-sdlc-harness', 'run-profiles', slugValue, `${branch.replaceAll('/', '-')}.json`)`), so a drift in `hr_run_profile_file`'s shape fails here. Add `plantProfile(branch, slugValue?)`, which makes the directory and writes `{}\n` there, and returns the path.
- [ ] **`decisions` and `sweepBoth`.** `decisions` maps `removed run profile <f> for '<b>'` and the preview's `would remove run profile <f> for '<b>'` (after its existing `[dry-run] (would )?` strip) to one shared string, `remove profile <f>`. It keeps `keep run profile …` and `no run profile path …` lines verbatim after the strip. That way the existing preview-equals-sweep assertion grades the profile decision too. `sweepBoth(f, env)` forwards `env` to both runs and returns the real run with the preview's stdout attached (e.g. `{ ...real, dryStdout: dry.stdout }`). Existing callers keep working unchanged.
- [ ] **Removal cases.**
  - (a) Extend `a gone branch with a completed clone record`. Plant its profile. Also plant `feat_gone.json` under a second slug, `other-repo-slug`, and run the sweep with `HARNESS_REPO_SLUG: 'other-repo-slug'` in its env. Assert that the preview's stdout carries the `[dry-run] would remove run profile` line for the own-slug file, which the snapshot proves still exists after the preview. Assert that the real stdout carries `removed run profile`, that the own-slug file is gone, and that the other-slug file is still there with its bytes.
  - (b) Extend the legacy case. Plant profiles for `feat_old` and `feat_stray`. `feat_old`'s is removed with its worktree. `feat_stray`'s, a branch with no record and so no copy removed, is still there.
- [ ] **Keep cases.**
  - (c) Extend `a clone record naming another branch's clone, also recorded`. Plant profiles for `feat_gone` and `feat_other`. The refused `hr_clone_remove_var` leaves both in place, and no `removed run profile` line appears.
  - (d) Widen the live-status loop from `['running', 'parked']` to `['running', 'parked', 'park_loop', 'paused']`. Plant the profile in each case and assert it is still there.
  - (e) New case, the sanitized-name collision. Give `feat-x` a `hr_clone_create_var` clone, a `completed` record and a gone upstream. Give `feat/x` a record with only `status running`. The clone is removed. `feat-x.json` is kept, with the `keep run profile … the live run 'feat/x' uses that file` line.
  - (f) New case, an unanchorable state directory. Run the sweep with `XDG_STATE_HOME: ''` and `HOME: ''`, so `hr_lane_dir` cannot anchor. The clone and branch are removed as before, the `no run profile path for 'feat_gone'` line is printed, and the profile planted under `state` is untouched.
- [ ] **Header.** Add the profile rule to *"The rule these tests exist to enforce"*: the profile goes with the copy, only with the copy, at the watcher's path, and never while a live run maps to it. State that every case's sweep gets its own `XDG_STATE_HOME` under the fixture root, and that no case touches the real machine state directory. Name the behaviour not covered, and why: the `FAILED to remove run profile` line, which needs an `rm` that fails on a file the fixture owns. Add one RED ONCE entry, applied the same way as the existing ones to the fixture's copied sweep through a scratch copy of this file and never to the template, with the failure you observed. For example: `profile_remove` called before the `hr_clone_remove_var` result is tested, so case (c) fails.

**Verification:**

- `npm test --workspace cli -- test/cleanup-run-copies.test.mjs`, from the repository root, as one plain foreground command, exits 0. Read `# fail` / `ℹ fail` as 0 and the exit status, never only the summary line.
- `git grep -n 'XDG_STATE_HOME' -- cli/test/cleanup-run-copies.test.mjs` shows it set in the fixture's `sweep`. No `sweep(` call site overrides it with a path outside `root`; case (f)'s empty value is the only override.
- The RED ONCE mutation, applied to a scratch copy as the header states, turns case (c) red. Record the observed failure message in the header entry.

**Deviations from plan:** The fixture's `call` (library calls such as `hr_clone_create_var` and `hr_repo_slug`) also gets `XDG_STATE_HOME: state`, beyond the plan's `sweep`, so no fixture-side library call can resolve the real machine state directory either. The RED ONCE was run through `bash scripts/scratch-run.sh harness-runs/scratch/red_once_profile_remove.mjs`, which writes `red_once_profile_remove.generated.mjs` beside it; observed: 10 pass, 1 fail, case (c) `the preview and the sweep disagree`. Removing the generated file was refused by the tool layer; it remains under the uncommitted `harness-runs/scratch/`.
