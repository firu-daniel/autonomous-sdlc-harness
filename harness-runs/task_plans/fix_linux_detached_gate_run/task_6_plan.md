### Task 6 — Bind `<gate_launcher>` in the four forks and name the launcher in the autonomous flow document

**Goal:** Every fork over a core that declares `<gate_launcher>` binds it, so no flow halts on an unbound binding (`plugin/instructions/mode_contract.md` rule (1)).

- **The two autonomous forks** bind the main checkout's launcher, spelled literally.
- **The two semi-autonomous forks** bind `none`. They run under the user's own settings, which `init` merges with no sandbox block, so F10 does not reach them.

The plugin's flow document names the launcher in the Run gates row.

**Depends on:** Task 5, which declares `<gate_launcher>` in `plan_orchestration_instructions_core.md` and `user_review_fixes_instructions_core.md`, and states G.1 step 2's rule:

- when the binding is not `none`, issue it first;
- `pending` → go to step 3;
- `in-session`, or a permission-layer refusal → issue the run form;
- a stderr refusal → the no-verdict-line case.

It also depends on Task 2's spelling: `launch-sandboxed-gates.sh <target> <label>`, where `<target>` is the run copy's root, or a job's checkout.

### Targets

- `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `## Mode contract — bindings`: a `<gate_launcher>` row after `<park_answer_lookup>`'s.
- `plugin/instructions/user_review_fixes_instructions_autonomous.md` → its binding table: the same row.
- `plugin/instructions/plan_orchestration_instructions_semi_autonomous.md` → its binding table: a `<gate_launcher>` row after `<park_answer_lookup>`'s.
- `plugin/instructions/user_review_fixes_instructions_semi_autonomous.md` → its binding table: the same row.
- `plugin/docs/AUTONOMOUS_FLOW.md` → the *"Run gates phase"* row.

**Work:**

- [ ] **The two autonomous rows**, identical in both files: ``| `<gate_launcher>` | `bash <MAIN_REPO>/<scripts_dir>/launch-sandboxed-gates.sh <repo_root> <gate_key>_round_<gate_round>` — `<MAIN_REPO>` and `<repo_root>` each spelled as the literal absolute path it resolves to, with no `$` anywhere in the command, as the commit and push wrapper calls are spelled: the profile's literal `allow` entry is the call's only grant from a run copy, and its excluded entry matches only that exact prefix. `<MAIN_REPO>` resolves as this file's **`AUTONOMOUS_STOP`** paragraph states. |``. Fit the wording to each file's own phrasing of where `<MAIN_REPO>` is resolved, and change nothing else in either table.
- [ ] **The two semi-autonomous rows**, identical in both files: ``| `<gate_launcher>` | `none` — this flow runs under the session's own settings, which carry no sandbox block, so the run form's detached worker outlives its call on every host and the core's G.1 issues the run form directly. |``.
- [ ] **`AUTONOMOUS_FLOW.md`.** In the *"Run gates phase"* row, after the `run-test-suite.sh` entry, add the gate launcher `launch-sandboxed-gates.sh` in `<scripts_dir>`. It is the main checkout's copy, an agent-invocable, excluded row of the shipped table, which on a bubblewrap host starts the round's gates under its own sandbox, through the binding `<gate_launcher>`. Cite `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `### G.1 Run the gates`. Keep the row's other cells.

**Verification:**

- `git grep -n -F '| `<gate_launcher>` |' -- plugin/instructions` returns one row in each of the four forks, plus the rows Task 5 added in `mode_contract.md` and the two cores.
- `git grep -n -F '| `<park_answer_lookup>` |' -- plugin/instructions` returns the same files as the previous command. Invariant: every file that binds `<park_answer_lookup>` binds `<gate_launcher>`.
- Neither autonomous row's command carries a `$`.
- `claude plugin validate --strict plugin` passes.
