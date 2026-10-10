`fix_run_gates_typecheck` makes the Run gates phase (Phase G) run `commands.typecheck` over the whole tree as well as `commands.test`. Today it runs only `commands.test`, so a branch can reach "Run gates passed" while its static checks (format, lint, type check) fail, and the first place that shows up is the adopter's CI on the PR.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Line numbers given were true at v0.6.6 (`1bc3f706`) and are hints only.

---

## What happened

Adopter `scenewise`, branch `fix_artifacts_prefix_traversal_2`, run remotely on GitHub Actions on 2026-10-09. Its ledger ended with `- [x] G. Run gates passed (the test-suite wrapper printed pass)`, and every phase was ticked. PR #10's CI then failed its `static` job at `ruff format --check .`. The test jobs passed.

- The file `ruff format` flagged was a run artifact: the Python snippet in `sdlc-harness/skeptic_reviews/fix_artifacts_prefix_traversal_2_skeptic_review/finding_1.md`. The adopter's fix for that (excluding `sdlc-harness/` from ruff) is theirs, not this branch's.
- The harness defect is the next part. Three dispatches of that fix ran the whole-tree `bash harness-scripts/typecheck.sh`. Each saw `FAIL: typecheck (exit 1)`. Each then narrowed to `typecheck.sh <one file>` (mypy only) and recorded "Evidence downgrade: … Lint and import-contract status … is deferred to the Run gates phase." Nothing on the branch ever ran `ruff check`, the whole-tree mypy or lint-imports, because `ruff format` stops the wrapper first, and Phase G never runs `commands.typecheck` at all.
- The record called that "deferred". In fact it was never checked.

## What is already established

All of this was read at v0.6.6. Re-verify it before planning.

- **Phase G runs only the test key.** `plugin/instructions/plan_orchestration_instructions_core.md` → `## Phase G — Run gates`: "**It is the only place in the flow `<test_cmd>` runs**, and it runs only through the `run-test-suite.sh` wrapper." `### G.1 Run the gates` runs `bash <scripts_dir>/run-test-suite.sh <gate_key>_round_<gate_round>`.
- **The wrapper hard-codes `test`.** In `cli/templates/scripts/run-test-suite.sh`, `command_line="$(hr_command "$root" test)"`. It takes `<label>` or `--wait <label>` and nothing else. The repo's own `scripts/run-test-suite.sh` is a byte-identical copy. `hr_command` (`cli/templates/scripts/lib/harness-run-lib.sh`) already accepts every key in `HR_CFG_COMMAND_KEYS='typecheck test build devServer depInstall'`.
- **`commands.typecheck` is required, but may be the `<none>` sentinel** (`schemas/harness.config.schema.json`; `docs/typecheck-key-decision.md`). The core's `<test_cmd>` / `<typecheck_cmd>` row says that for `<none>`: "run nothing for that gate … record it as not run, never as a pass". The wrapper has no `<none>` handling today, and `eval`-ing `<none>` would fail as a shell redirect.
- **Nothing else runs it whole-tree before a PR.** `push-branch.sh`, `commit-on-branch.sh`, `remote-run.sh`, the watcher, the walker, the `pre-push` githook template and every reviewer run neither `typecheck` nor `hr_command`. Only `layer-implementer` runs `<typecheck_cmd>`, and a unit may call it with path arguments, which narrows it.
- **Phase G runs in four flows:**
  - the autonomous and semi-autonomous task flows, `<gate_key>` `task`;
  - the autonomous and semi-autonomous user-review fix flows, `<gate_key>` `review_<n>`, through `plugin/instructions/user_review_fixes_instructions_core.md` → `## Phase G — Run gates`, which runs the task core's G.0–G.5 "**verbatim**".

  The supervised flows run the wrapper once with labels `task_supervised` / `review_<n>_supervised`, in `code_review_instructions.md`, `code_review_fixes_instructions.md` and `user_review_fixes_instructions.md`, each citing G.1's wait mechanism. The docs flows run no gates. Phase G runs remotely unchanged; only QA is remote-skipped.
- **The fix loop can already take a static failure.** `plugin/agents/test-fix-plan-writer.md` lists "every failing gate and every failing test" in the log. A finding's `**Failing test:**` may be "`none — <gate name>`", and `layer-implementer.md` handles that through its fix-site fallback. Its wording assumes tests in places, e.g. "Never run the configured test command, a gate, or a test file". It derives `<gate_key>` and `<gate_round>` from the log's filename, so the log naming must keep that shape.
- **Where the wrong "deferred" came from.** `plugin/agents/layer-implementer.md` has two rules:
  - the Verification rule: "`<test_cmd>`, a gate script, or a test file this unit neither created nor edited" is recorded "as *deferred to the Run gates phase*";
  - the evidence-downgrade rule: "**An evidence downgrade is recorded, in every mode.**"

  No rule permits deferring a failing whole-tree `<typecheck_cmd>`. That case is listed as a transient blocker ("a failing `<typecheck_cmd>`"). The scenewise records mixed the two rules. Once Phase G runs typecheck, "deferred to the Run gates phase" becomes true for typecheck as well. The implementer contract has to say which.

## The goal

1. **Phase G runs both gates, once per round.** Each round runs the whole-tree `commands.typecheck` with no path arguments, and `commands.test`. A round passes only when both pass. The ledger's `G` / `RG` rows flip only then, and the Done summary reports both.
2. **One log per round, the same verdict line.** Whatever runs both commands, the round still produces exactly one verdict from the wrapper (`pass`, `fail <log path>`, `pending`) and one log under `<state_dir>/test_run_logs/<sanitized branch>/<label>.log`. The log holds the typecheck output and then the test output, each under a header naming the gate. The orchestrator still never reads the log. `test-fix-plan-writer` reads it and can tell a static failure from a test failure.
3. **Decide whether test still runs when typecheck fails, and record why.** Two candidates:
   - fail fast and skip the suite, which is cheaper but costs a round when both are broken;
   - run both and report both, which gives one fix plan for everything that is broken.

   The `MAX_GATE_ROUNDS = 5` cap counts gate runs, so this choice changes how many rounds a branch with both kinds of failure needs. Pick one, and state the effect on the cap.
4. **`<none>` is not run and not a pass.** With `commands.typecheck` = `<none>`, the round runs only the test command. The log says typecheck was not run, as the core's `<none>` rule requires. That never makes the round fail.
5. **The supervised flows get the same behaviour.** Their single wrapper run (`task_supervised`, `review_<n>_supervised`) includes typecheck too, because they cite G.1's mechanism. If the plan decides otherwise, it says why.
6. **The implementer contract tells the truth.** `layer-implementer.md` says what a unit does when the whole-tree `<typecheck_cmd>` fails for a cause outside its own change, as the scenewise case did. Either it is a blocker, or it is recorded as a downgrade that Phase G now verifies. In both cases, "deferred to the Run gates phase" must only ever name something Phase G actually runs. Align the core's test-run rule (`unit_loop_core.md` → `## The test-run rule`) and the autonomous fork's "the Run gates phase is the verification gate" sentence with whatever is chosen.
7. **Tests pin it.** In `cli/test/run-test-suite.test.mjs`, add cases for:
   - typecheck failing with the test passing;
   - typecheck passing with the test failing;
   - both failing;
   - typecheck `<none>`;
   - the log's per-gate headers;
   - "exactly once" for each command per run.

   Keep every existing case passing, or change it on purpose and say why. The fixture today seeds `typecheck: 'echo typecheck'`.
8. **Docs and descriptions match.** Update every place that says Phase G runs only the test command, e.g. "runs the configured test command once" (both cores' intros) and "It is the only place in the flow `<test_cmd>` runs". The minimum set is:
   - both cores and the four forks;
   - `plugin/docs/AUTONOMOUS_FLOW.md` → "**5. The Run gates phase (Phase G).**";
   - `docs/config.md` (the `commands.test` and `commands.typecheck` rows);
   - `docs/watcher.md` (the `run-test-suite.sh` row);
   - `docs/cli.md`, `cli/README.md`, `cli/templates/scripts/README.md`;
   - `cli/templates/state-dir/test_run_logs/README.md` ("holding the full output of one run of the configured test command");
   - the two `branch-implement-*-semi-autonomous` command docs;
   - the `test-fix-plan-writer` agent description.

   A grep for "Run gates", "Phase G", "test-suite wrapper" and "`<test_cmd>`" across `plugin/`, `docs/`, `cli/` and `schemas/` is the check.

## Leads (re-verify every one)

- **Where the second command goes:**
  - the wrapper runs both itself, e.g. `hr_command` for `typecheck` and then `test`, into one log;
  - G.1 calls the wrapper twice with two labels;
  - a new key option, e.g. `--key typecheck`.

  One wrapper call keeps "one verdict line per round" and the `<label>.running` / `.verdict` / `--wait` mechanics unchanged, which suggests the first. Weigh it against the second, which makes the orchestrator handle two verdicts and two `--wait`s.
- **The script is renamed or not.** `run-test-suite.sh` is registered in `cli/src/generators/outerLoopScripts.ts` and pinned by name in `cli/test/outer-loop-scripts.test.mjs` and `cli/test/init.test.mjs`. A rename spreads into adopters' permission profiles and allow-lists. Keeping the name and changing the header contract is cheaper. Decide, and state it.
- **Adopters' copies.** `run-test-suite.sh` is an outer-loop script that ships fixed, so adopters get the change on update. Check how an update reaches an adopter's copy under `scriptsDir`, and whether `doctor` or `init --force` is the route.
- **Remote runs.** `harness-run.yml` sets up no toolchain of its own. It runs `setup-worktree.sh`, i.e. `commands.depInstall` then `commands.build`. Units already run `<typecheck_cmd>` remotely, so the whole-tree run should work wherever the unit run does. Confirm this rather than assuming it.
- **Ledger ids stay.** `harness-run-lib.sh` parses ledger rows by id (`G`, `RG`), and `cli/test/ledger-phases.test.mjs` / `remote-progress.test.mjs` pin the ids. Change the rows' wording ("the test-suite wrapper printed pass"), not their ids. The fork flip rules quote that wording, so change them together.

## Constraints

- Do not add a new phase or a new ledger row. This widens what Phase G checks; it does not add a step.
- Keep the orchestrator blind to gate output. It reads only the wrapper's verdict line, as now.
- Do not change `MAX_GATE_ROUNDS`.
- Do not change what a unit runs per dispatch beyond what goal 6 decides.
- The repo's own `scripts/run-gates.sh` must still pass.
- Leave an adopter's rendered `typecheck.sh` / `test.sh` wrappers alone: they are "yours from there on". The change lives in the harness-owned outer-loop script and the instructions.
