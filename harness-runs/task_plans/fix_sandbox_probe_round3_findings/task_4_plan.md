### Task 4 — Grade a planted-config wrapper call refused at the permission layer as not run

**Goal:** CS15's session issues two calls under test, a push and then a commit through the main checkout's wrappers. That puts the `planted-config` leg in the audit set. Its shared refusal judge, `sp__pc_refusal` in `scripts/lib/sandbox-probe/legs-planted.sh`, grades a permission-layer refusal `fail` (*"the wrapper did not run: refused at permission: …"*), not `not run`. This task makes that one case `not run`. Because the function is shared, the change reaches all six of the leg's rows: C1, CW3, C2, K2, CW4 and CS15.

**Depends on:** Task 1, whose `planted-config` description ends *"a wrapper call refused at the permission layer is not run"*.

**The contract this task produces, which Task 10 tests.** `sp__pc_refusal <stream> <exact command> <prefix> <wanted text>` keeps its signature, its globals (`SP__PC_RV`, `SP__PC_RE`) and every arm but one. When `sp_judge_call` puts the call at the permission layer, it sets:

- `SP__PC_RV="not run"`
- `SP__PC_RE="refused at the permission layer, so it never reached the wrapper: $SP_EVIDENCE"`

Every other non-`ran` layer (sandbox, network, file-tool) stays `fail` with today's *"the wrapper did not run: refused at <layer>: …"*. For these rows the main wrapper must run excluded, so a sandbox refusal is a real finding. The callers already skip `sp__pc_held` and C1's marker clause when `SP__PC_RV` is `not run`, so they need no change.

### Targets

- `scripts/lib/sandbox-probe/legs-planted.sh`

**Work:**

- [x] In `sp__pc_refusal`, ahead of the `if [ "$SP_LAYER" != ran ]` block, add the permission-layer arm specified above.
- [x] The comment above `sp__pc_refusal` gains one clause: a permission-layer refusal is `not run`.
- [x] Check every caller of `sp__pc_refusal` (`sp__pc_c1`, `sp__pc_cw3`, `sp__pc_clone_row`, `sp__pc_cs15`) for a branch that would treat `not run` differently from today's `fail`. None should need an edit. If one does, make it read `not run` as its callers already do for an unissued call.

**Verification:**

- `grep -n 'refused at the permission layer, so it never reached the wrapper' scripts/lib/sandbox-probe/legs-planted.sh` returns the one new line.
- By hand, from a temp directory: in a `bash -c` that sources `core.sh`, `judge.sh`, `controls.sh` and this file, call `sp__pc_refusal` on the existing `cli/test/fixtures/sandbox-probe/p1b-permission.jsonl` with P1b's fixture command. It sets `not run` and the new text. (Task 10 adds the CS15-shaped fixture.)
- The type check (`bash scripts/typecheck.sh`) parses the file.
  - **Deviations from plan:** The by-hand check's direct `bash -c` from `$TMPDIR` was refused by the permission profile (*"Permission to use Bash has been denied because Claude Code is running in don't ask mode."*). It was run instead through the probe route, `bash scripts/scratch-run.sh harness-runs/scratch/task4_pc_refusal.mjs`, which spawns the same `bash -c` (sourcing `core.sh`, `judge.sh`, `controls.sh`, `legs-planted.sh`) with `cwd` set to `os.tmpdir()`. On `p1b-permission.jsonl` with P1b's fixture command it printed `not run|refused at the permission layer, so it never reached the wrapper: Permission to use Bash has been denied because Claude Code is running in don't ask mode.|layer=permission`. As a control, `sandbox-dd.jsonl` still printed `fail|the wrapper did not run: refused at sandbox: dd: @FIXTURE_ROOT@/outside/probe: Operation not permitted|layer=sandbox`. A first draft, `harness-runs/scratch/task4_pc_refusal.sh`, stays in the scratch directory because the `rm` was refused too. Nothing in the scratch directory is committed.
  - **Callers checked:** `sp__pc_c1` (line 263), `sp__pc_cw3` (line 299), `sp__pc_clone_row` (line 448) and `sp__pc_cs15` (lines 512, 516, 519–525) all branch on `"not run"` already, so none was edited. `sp__pc_print`'s marker check is independent of the verdict and still fails a row whose marker exists.
