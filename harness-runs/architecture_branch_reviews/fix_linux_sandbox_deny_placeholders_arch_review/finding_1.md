### 1. Move manifest enumeration into the run library instead of globbing `*.absent` twice in the watcher

**Severity:** Must Fix · **Layer:** cli (the template), then general (the self-adopted copy)

**Sites:**
- `cli/templates/scripts/autonomous-watcher.sh` → `placeholder_start_recover`, the substring `manifest="$(hr_run_profile_absent_file "$slug" x)"` and the loop `for m in "${manifest%/*}"/*.absent; do`
- `cli/templates/scripts/autonomous-watcher.sh` → `placeholder_sweep_pass`, the substring `manifest="$(hr_run_profile_absent_file "$HARNESS_REPO_SLUG" x)" || return 0` and the same `for m in "${manifest%/*}"/*.absent; do` loop
- `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_run_profile_absent_file`, the owner of the manifest's name
- `scripts/autonomous-watcher.sh` and `scripts/lib/harness-run-lib.sh`, the byte-identical self-adopted copies

**Problem.** The absent-path manifest is a new persisted machine-state artifact. Its name belongs to the run library: the lib's FOUR ARTIFACTS header says `run-profiles/<slug>/<branch>.absent` is *"Named by `hr_run_profile_absent_file`"*, and that function is the only one that forms the `.absent` suffix. The watcher does not ask the library for the set of manifests. Instead, in two places, it:

1. calls `hr_run_profile_absent_file <slug> x`, using a fabricated branch `x` only to get a path whose directory it can strip with `${manifest%/*}`, and
2. globs `*.absent` in that directory itself.

So the watcher knows the artifact's suffix and the directory layout independently of the owner. If the manifest is renamed or relocated in `hr_run_profile_absent_file`, both sweeps silently find nothing, and nothing fails. The two functions also each carry their own copy of the same block: collect the manifests, call `hr_placeholder_sweep_var`, and walk `HR_PLACEHOLDER_REMOVED` / `HR_PLACEHOLDER_KEPT`. They differ only in the log sink.

Rules this violates:
- `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`, the persisted-key bullet: *"a new persisted artifact joins the module that owns it rather than being named at its use site."*
- `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one"* and *"Before adding a copy of anything, grep for it."*
- `.claude/context/cli.md` → `## How a module in this layer is written`, *"One string, one producer"*: a shipped name spelled again where it is resolved, joined or read as a path is a second source.
- This branch's own `cleanup-merged-worktrees.sh` header states the same discipline for the sibling profile: *"No glob, no hand-built path."*

**Fix.**
1. In `cli/templates/scripts/lib/harness-run-lib.sh`, beside `hr_run_profile_absent_file`, add one enumerator, for example `hr_run_profile_absent_files <repo slug>`. It prints every existing regular `*.absent` file in `<hr_lane_dir>/run-profiles/<slug>/`, one per line, and returns 1 (printing nothing) when `hr_lane_dir` cannot anchor or the slug is empty. It creates nothing. Derive the directory and the suffix from the same expression `hr_run_profile_file` / `hr_run_profile_absent_file` use, so the `.absent` suffix and the `run-profiles/<slug>/` layout are spelled in one place. Give it a header in the lib's style that names its callers, and add it to the FOUR ARTIFACTS paragraph's *Named by …* sentence.
2. In `cli/templates/scripts/autonomous-watcher.sh`, replace the `hr_run_profile_absent_file … x` call and the `"${manifest%/*}"/*.absent` loop in both `placeholder_start_recover` and `placeholder_sweep_pass` with a read of that enumerator into the `manifests` array. Then neither function contains the `.absent` suffix, the dummy branch `x`, or a `${manifest%/*}` directory strip. Optionally, also fold the duplicated removed/kept walk into one helper that takes the line prefix and the sink, so the two call sites differ only in that argument.
3. Refresh `scripts/autonomous-watcher.sh` and `scripts/lib/harness-run-lib.sh` from the two templates so they stay byte-identical, as Task 5 did.
4. Cover the enumerator in the suite that already owns the library's placeholder primitives, `cli/test/placeholder-sweep-lib.test.mjs`. Add cases for: an empty directory, a mixed directory where only `.absent` regular files are listed and a `.json` profile and a symbolic link are not, and an unanchorable lane (exit 1, nothing printed). That is the unit's own edited test file. Its existing header rule covers the case, so extend the header's list of primitives to name the new function.

- **Deviations from plan:** Fix step 3 (refresh `scripts/autonomous-watcher.sh` and `scripts/lib/harness-run-lib.sh` from the templates) lies outside the dispatched `cli` path scope and was not done; it belongs to the `general`-layer pass the finding's own **Layer** line names. Fix step 2's optional fold of the removed/kept walk was not taken: the two walks differ in sink and in the start path's removed count. The duplicated enumeration read was folded instead, into the watcher helper `placeholder_manifests_var`, which both sweeps call. The watcher's behavioural suite `cli/test/watcher-placeholder-host.test.mjs` was not run: this unit did not edit it, and the Run gates phase runs it.
- **Deviations from plan:** (`general` pass) Fix step 3 done: `scripts/autonomous-watcher.sh` and `scripts/lib/harness-run-lib.sh` were brought to the templates' content. A plain `cp` from template to copy was refused by the tool layer (don't-ask mode), so the cli pass's hunks were applied with the Edit tool instead. Bare `cmp` of each template against its copy then exited 0 with no output, which confirms they are byte-identical. Before the edit, `git diff HEAD --quiet -- scripts/` exited 0, so the copies were clean at HEAD and differed from the templates only by the cli pass's hunks.
