### 2. The scratch root is joined by hand instead of through `hr_state_path`

**Site:** `scripts/lib/gate12-sandbox-round/state.sh` → `g12_scratch_dir`, whose body is `printf '%s\n' "$G12_ROOT/$G12_STATE_DIR/scratch/gate12-sandbox-round"`.

**Problem.** `.claude/context/conventions.md` → `### Where a new responsibility goes` says: *"A responsibility that already has a home does not get a second one"* and *"Before adding a copy of anything, grep for it."* Building a run-artifact path under the configured state directory already has a home. `scripts/lib/harness-run-lib.sh` → `hr_state_path` is documented as *"`<repo_root>/<state_dir>/<relative>` — the one place a run-artifact path is built, with `stateDir` normalized"*. The `scratch` segment also has an owner. `hr_scratch_path_var` sets `HR_SCRATCH_SUBDIR='scratch'` and declares it the mirror of the `scratch` row of `STATE_DIR_ENTRIES` in `cli/src/generators/stateDir.ts`. `g12_scratch_dir` is an undeclared third spelling of both:
- it joins `G12_STATE_DIR` by hand;
- it retypes the `scratch` literal, which `.claude/context/conventions.md` → *"a value is imported from its owner rather than retyped"* forbids.

`g12_scratch_dir` is the root that `g12_state_path`, `runs.sh`'s `runs/<id>/…` and `evidence/<row>.log` paths, and the teardown all build on. A drift in it would place the state file, and the files teardown removes, outside the directory the Gate 12 repository's managed ignore rule covers.

**Fix.** This depends on Finding 1 sourcing `scripts/lib/harness-run-lib.sh` in `g12_preflight`. In `scripts/lib/gate12-sandbox-round/state.sh`, rewrite `g12_scratch_dir` to print `hr_state_path "$G12_ROOT" "$HR_SCRATCH_SUBDIR/gate12-sandbox-round"`, or `hr_state_path "$G12_ROOT" scratch/gate12-sandbox-round` if `HR_SCRATCH_SUBDIR` is only set inside `hr_scratch_path_var`. In that second case, say in the header that the `scratch` segment mirrors `HR_SCRATCH_SUBDIR` / `STATE_DIR_ENTRIES`. On a non-zero status, return 1 after a `g12_refuse` line naming the unresolvable state directory. Update the header's first paragraph and the `g12_scratch_dir` row of the function list to name `hr_state_path` as the builder. Every other path stays derived from `g12_scratch_dir`, as the header already requires.

The function's output is unchanged for every configuration the fixture builds, so no `cli/test/` change is expected.

- **Deviations from plan:** `g12_state_path` and `g12_state_init` now propagate `g12_scratch_dir`'s non-zero status (`|| return 1`) so the new refusal is not swallowed by a command substitution; `HR_SCRATCH_SUBDIR` is set only inside `hr_scratch_path_var`, so the literal `scratch/gate12-sandbox-round` was used with the header mirror note. No `cli/test/` file was run: the unit edited none and no tree guard covers `scripts/lib/**/*.sh` — the gate12 suites are deferred to the Run gates phase.
