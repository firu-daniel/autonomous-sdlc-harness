### Task 3 — Add the planted-link suite `cli/test/remote-save-links.test.mjs` with its red-once record

**Goal:** Prove, by driving the real `init`-written `remote-run.sh save` against a fixture whose bundle sources a session has replaced with links, three things:

1. no planted link puts a byte of an outside file, or a link, into the bundle;
2. every source that was not linked is still saved with its exact bytes;
3. `save` reads the trusted `stateDir`, not the checkout's own.

Each case's mutation must be run red once and recorded.

**Depends on:** Task 1 and Task 2. This suite asserts their contracts exactly as those tasks define them.

- **Skip lines on stderr.** The library prints `remote state bundle: skipped <path>: <linked> is a symbolic link`. `remote-run.sh` prints `remote-run.sh: save: skipped <path>: <linked> is a symbolic link` for the status source and the registry. `<path>` is the absolute source path and `<linked>` the absolute first linked component.
- **The difference line on stderr.** `remote-run.sh: save: the checkout's harness.config.json names stateDir '<checkout>', the trusted configuration at <commit> names '<trusted>'; using '<trusted>'`.
- **The trusted switch.** `HARNESS_GITHUB_DEFAULT_COMMIT` non-empty selects the trusted configuration, read at that commit.
- **An honest bundle's layout** is unchanged: `status.json`, `clarifications/<branch>/…`, `PAUSE_PROGRESS.md`, `flow_walker_state`, `run.log` and `planning/<rel>` for each planning path.

This task edits neither `cli/templates/scripts/lib/harness-run-lib.sh` nor `cli/templates/scripts/remote-run.sh`; the mutations below are applied and reverted in place, and no mutation stays.

### Targets

- `cli/test/remote-save-links.test.mjs` (new) — the suite.

**Work:**

- [ ] **Header first.** State the rule the suite enforces: *a symbolic link a sandboxed session planted under the state directory never carries a byte of its target, or a link, into the `harness-state` bundle, an honest source beside it is still saved byte-for-byte, and `save` reads the state directory the trusted configuration names*. Use the planted-payload suites' marker technique (`cli/test/watcher-review-drop-payloads.test.mjs`'s header is the model). A sentinel file **outside** the state directory carries a unique random token, and each case links one source to it.
- [ ] **Fixture and helpers, file-local.** Build the fixture with `createFixture` plus `runCli(dir, ['init'])` from `./helpers/fixture.mjs`, as `cli/test/remote-run.test.mjs` → `remoteFixture` does. Set `execution.target` to `github-actions`, and route `HARNESS_GH_CLI` to a recorder stub so nothing reaches the network. Seed honest sources:
  - a registry record;
  - a job-mode `remote_status.json`, written through `hr_remote_status_write` as that suite's `save after a job-mode status write …` case does;
  - `clarifications/feat_x/question_1.md`, `PAUSE_PROGRESS.md`, `.flow_walker_state` and `autonomous_logs/feat_x.log`;
  - `story_plans/feat_x_story_plan.md` and `task_plans/feat_x/task_1_plan.md`.

  Drive `bash <scriptsDir>/remote-run.sh save feat_x <out>`. Pass `HARNESS_GITHUB_DEFAULT_COMMIT: ''` explicitly in every case except the trusted one, so an ambient value cannot select trusted mode. Write one assertion helper that walks `<out>` with `lstat`, without following anything. It fails when any entry is a symbolic link, or when any file's bytes contain the sentinel token. It also compares each honest source's bytes with what the case seeded.
- [ ] **The planted-link cases.** One case per shape. Each replaces one honest source with a link to the sentinel, or to a directory holding it, and asserts three things: the sentinel-free and link-free walk passes, every other honest source is present with its bytes, and stderr carries a skip line naming the linked path.
  - **(F) File sources, in turn:** `PAUSE_PROGRESS.md`, `.flow_walker_state`, `autonomous_logs/feat_x.log`, and `autonomous_logs/remote_status.json`. The bundle's `status.json` is then the registry-derived one with `decision` `stop`, and its bytes are not the sentinel's.
  - **(D) Directory source:** `clarifications/feat_x` itself a link to an outside directory holding the sentinel as `question_1.md`.
  - **(N) Nested link inside the clarification directory:** a real `clarifications/feat_x/` holding `question_1.md` plus `question_2.md` as a link to the sentinel, and a sub-directory link. `question_1.md` is saved; neither link is.
  - **(P) Linked planning path:** `task_plans/feat_x` as a link to an outside directory, and separately `story_plans/feat_x_story_plan.md` as a link to the sentinel.
  - **(U) Under a linked parent:** `clarifications` itself a link to an outside directory holding `feat_x/question_1.md` with the sentinel.
  - **(R) Linked registry with no status source:** the bundle is the never-started empty directory, and the skip line names the registry.
- [ ] **The trusted `stateDir` case (T).** Commit the fixture's `harness.config.json`, `stateDir` `sdlc-harness`, with the honest sources under it. Then rewrite the working tree's `stateDir` to a second directory that holds a full set of sentinel-carrying sources, the registry and status included. Run `save` with `HARNESS_GITHUB_DEFAULT_COMMIT` set to that commit's full id. Assert three things: the bundle's bytes are the `sdlc-harness` sources' and carry no sentinel; stderr carries the difference line naming both values; and the run exits 0.
- [ ] **Red once, recorded in the header.** Apply each mutation to the named template file, run `npm test --workspace cli -- test/remote-save-links.test.mjs`, observe the result and revert. Record each mutation in a `RED ONCE` list, in the form the payload suites use, with **the failing assertion that run actually produced** — copied from the test output, never the expectation below — and the cases that stayed green. Why the list has this shape: Task 1's `hr_remote_bundle_write` runs `hr_remote_link_free_var` on every prefix of a source **before** the source is tested or copied, so in (D), (U) and (P)'s directory half the source is refused before any copy runs, and restoring `cp -R` alone cannot reach them. Only (N), whose links sit below a real directory, reaches the copy. (D) and (P)'s directory half are also guarded a second time: Task 1's `hr_remote_copy_tree` walks with `find` and no `-H` / `-L`, which does not descend a top-level source that is itself a link and prints its own skip line for it. The mutations, all in `cli/templates/scripts/lib/harness-run-lib.sh` unless named otherwise:
  - **(M1)** `hr_remote_bundle_write`'s link test dropped **for file sources only** — guard it so it runs only when the source is a directory (`[ -d <src> ] && ! hr_remote_link_free_var …`), leaving the plain `[ -f ]` + `cp`. Expect (F) and (P)'s file half to fail: the sentinel's bytes in the bundle and no skip line.
  - **(M2)** `cp -R` restored in place of `hr_remote_copy_tree` for directory sources, the link test intact. Expect **(N) only** to fail, on a link in the bundle. (D), (U) and (P)'s directory half are expected to stay green, because the link test refuses them first.
  - **(M3)** `remote-run.sh` → `verb_save`'s link test on the registry dropped. Expect (R) to fail.
  - **(M4)** `hr_state_dir "$root"` restored in `hr_remote_bundle_write`, then separately in `remote-run.sh` → `verb_save` / the setup gate. Expect (T) to fail on the sentinel or on the missing difference line.
  - **(M5)** `hr_remote_bundle_write`'s link test dropped **for directory sources only** — guard it so it runs only when the source is not a directory (`[ -d <src> ] || ! hr_remote_link_free_var …`), with `hr_remote_copy_tree` intact. Expect (U) to fail on the sentinel: its source path `clarifications/feat_x` is a real directory reached through the linked parent `clarifications`, and `find` resolves the argument's parent link like any path, so the walk copies the sentinel. Expect (D) and (P)'s directory half to **stay green**, because `hr_remote_copy_tree`'s `find` does not descend the linked top-level source and prints its skip line. If either of them turns red here instead, record that observed failure for it, and record M6 as well.
  - **(M6)** M5 **and** M2 together: the link test dropped for directory sources and `cp -R` restored. Expect (D) and (P)'s directory half to fail: `cp -R` with no `-L` / `-H` copies the linked source as a link on BSD and GNU alike, so the no-link walk fails, and no skip line is printed.

  **Coverage rule.** After the runs, every case — (F), (D), (N), (P) file half, (P) directory half, (U), (R) and (T) — is turned red by at least one recorded mutation. A case no mutation turned red is a defect in the suite or in Task 1 / Task 2's code. Stop and report it as a blocker, naming the case and every mutation tried, rather than recording an expectation in its place.

**Verification:**

- `npm test --workspace cli -- test/remote-save-links.test.mjs`, run from the repository root as one plain foreground command, passes. Read its `# pass` / `# fail` counts and exit status.
- The header's `RED ONCE` list names every mutation (M1)–(M6), each with the failing assertion that run actually printed and the cases that stayed green. Every case (F), (D), (N), (P) file half, (P) directory half, (U), (R) and (T) appears as red under at least one mutation. `git diff -- cli/templates/scripts` shows no leftover mutation.
- No case creates anything inside this checkout: every fixture sits under the system temp directory, and its teardown runs in process.

- **Deviations from plan:**
  - (M5) did not leave (D) and (P)'s directory half green. `hr_remote_copy_tree` does not print a skip line for a top-level source that is itself a link: its guard `[ -d "$src" ] && [ ! -L "$src" ] || return 1` returns 1 silently, and `hr_remote_bundle_write`'s `|| return 1` then stops the bundle. Observed: (D) failed on `the bundle's file set`, with only `status.json` in the bundle. (P)'s directory half failed on `no skip line for …/sdlc-harness/task_plans/feat_x`. As the plan instructs, both failures are recorded and (M6) was run as well. Under (M6), (D) failed on `a link is in the bundle: clarifications/feat_x` and (P)'s directory half on `a link is in the bundle: planning/task_plans/feat_x`. Behaviour with the link test intact is unaffected, because the test refuses those sources before `hr_remote_copy_tree` is reached. But the plan's "second guard" for (D) and (P) is a stop, not a skip: if it is ever reached, every later source of the bundle is lost too.
  - (M1) and (M5) were applied at `hr_remote_bundle_source_ok`, the per-source gate that `hr_remote_bundle_write` calls for every source, as `[ -d "${1%/}/${2-}" ] || return 0` and `[ -d "${1%/}/${2-}" ] && return 0` ahead of its `hr_remote_link_free_var`. Task 1 puts the link test there, not inline at each call site.
  - The sentinel is one JSON file shaped as a registry whose `feat_x` record's `engine` is the token. With a plain-text sentinel, (M3) would have read the linked registry, failed to derive a status, and failed only on the missing skip line. With this sentinel, the registry-derived `status.json` carries the token, and (M3)'s red is an observed leak.
  - Added an honest-baseline case (no link planted) beside the planted-link cases. It asserts the exact layout and bytes, and no skip line.
  - `commands.test` (`bash scripts/test.sh`) was not run here: deferred to the Run gates phase.
