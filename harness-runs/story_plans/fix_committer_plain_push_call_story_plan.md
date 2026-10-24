# Story: The committer pushes with one plain call

## Context

In an unattended run the generated profile exempts exactly one spelling of each main-checkout wrapper from the sandbox: `bash <main checkout>/scripts/commit-on-branch.sh:*` and `bash <main checkout>/scripts/push-branch.sh:*` under `sandbox.excludedCommands`. The `committer` already issues its commit in that one spelling — `plugin/agents/committer.md` → `## Process` → `### Standard procedure (`task` / `review_plan_file` / `review_item`)` step 4 says *"call the wrapper once, alone, with exactly step 3's paths and every placeholder as literal text"*. Steps 5 (**Verify:**) and 6 (**Push:**) say nothing about how their commands are issued. On `fix_run_gates_answered_park_resume` the committer merged them into one compound call twice, and once took the run copy's `push-branch.sh` instead of `<MAIN_REPO>`'s. All three pushes ran sandboxed and failed with `pushed: failed`. This branch closes that gap in the committer's own definition and pins the wording with a source guard. The wrappers, `harness-run-lib.sh`, the generated permission profile and the committer's return contract (`pushed: yes | no | failed`, a failed push never reverting the commit) all stay as they are (task prompt → `## Constraints`).

**The rule, and its one wording.** Every copy uses this sentence byte-for-byte. Task 1 introduces it in `plugin/agents/committer.md`, Task 2 copies it into `plugin/instructions/autonomous_pause_and_ledger.md` §1.6, and Task 3 asserts both copies match:

> `**Once, alone** means its own Bash call holding that one command and nothing else — no `cd`, `;`, `&&`, `||`, pipe, `echo "exit $?"`, `$(…)` or shell variable before or after it.`

The surrounding steps reuse step 4's existing phrase **once, alone**. They never paraphrase it: the push step reads *"call `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>` once, alone"*, and the verify step runs its two `git` commands *"as two separate calls, each once, alone"*.

**Where the rule is stated, and why only there.** The committer reads `plugin/agents/committer.md` and `<commit_conventions>`, and nothing else on a dispatch. The task prompt asks for the rule once in a shared place the committer *already* reads, and no such place exists, so the definition goes into `committer.md` step 4, where "once, alone" first appears. `### ui_test_pass procedure` gets it by reference and needs no new words: step f already says "call the wrapper once, alone", g says "**Verify** as step 5 does", and h says "**Push** as step 6 does". `review_plan_file` runs the standard procedure itself. Every orchestrator-side commit point already cites §1.6 as its canonical rule (`## Scope register` below lists each one). Those commit points already issue the push "as its **own** Bash call, never in the same call as the commit", and the orchestrator's own pushes succeeded on the observed run. §1.6 is the one shared place they all read, so Task 2 puts the identical sentence there and removes the one clause there that permits a newline-joined call. Re-wording the other fork files would add words but no behaviour (`.claude/context/plugin.md` → `## Writing agent prose` → **An agent's growth is paid for by behaviour.**). The lessons ledger's `## Agent prose` rule says the same: *"State a new behaviour once, in the section that decides it, and cite it from everywhere else."*

**Ship order.** The configured layer order is `cli`, `plugin`, `general`. Task 3 is a `cli` source guard over text that Tasks 1 and 2 write, so it ships after them. Contract comes before consumer (`.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`), and no task may depend on a later one. No task touches the `general` layer.

**Top risks:** (1) The definition sentence drifts between its two copies, or a later edit paraphrases step 5 or step 6 back into a form that permits compounding. Task 3 guards this by pinning both copies, compared after collapsing whitespace, and the "once, alone" phrase on steps 4, 5 and 6 and on `ui_test_pass` steps f–h. (2) The committer definition grows past what the behaviour needs, because rationale or a second wording of "once, alone" gets added. Task 1 adds exactly one new sentence plus re-worded steps 5 and 6, with no "why" clause, and its verification counts the changed lines. (3) Task 2 leaves §1.6's "plain and newline-separated single statements do not" clause in place. That clause would then contradict the new sentence for every orchestrator that reads §1.6. Task 2 removes that clause in the same edit.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker.** In every flow that dispatches one, that role is the `committer` agent. In the supervised flow, which dispatches none, it is the orchestrator itself. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside the per-task files, are informational progress markers for the implementer. They are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_committer_plain_push_call/task_<K>_plan.md`.

1. [x] **Task 1** — State "once, alone" for the committer's verify and push calls in `committer.md` _(layer: plugin)_ _(points: 10)_
2. [ ] **Task 2** — Copy the "once, alone" rule into `autonomous_pause_and_ledger.md` §1.6 _(layer: plugin)_ _(points: 5)_
3. [ ] **Task 3** — Pin the "once, alone" wording with a source guard in `cli/test` _(layer: cli)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Check the other procedures in `plugin/agents/committer.md`, `ui_test_pass` and `review_plan_file` included, and any other agent or instruction document that tells an agent to run `commit-on-branch.sh` or `push-branch.sh`."*

**Derivation entry — corpus files (command).** Re-run verbatim from the checkout root: `git grep -l -E 'commit-on-branch\.sh|push-branch\.sh' -- plugin/agents plugin/instructions plugin/commands plugin/docs .claude/context`

**Derivation entry — committer procedures (procedure).** **Artifact:** `plugin/agents/committer.md`. **Traversal:** `## Process` → `### Standard procedure (`task` / `review_plan_file` / `review_item`)` steps 1–6 in order, then `### ui_test_pass procedure` steps a–i in order. **Decision rule:** a step is reached when it issues a Bash command whose form the procedure fixes, whether a wrapper call or the verify step's `git` checks.

**Derivation entry — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md harness-runs/improvement_suggestions.md`. **Artifact:** those two standing files. **Traversal:** each file's headings in order, then the one-line entries under each heading. **Decision rule:** an entry is reached when it states how a wrapper call or a `git` check is issued (compounding, chaining, "alone", the run copy versus `<MAIN_REPO>`).

**Closure invariant:** every site any derivation entry reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/agents/committer.md` → `### Standard procedure` step 4 ("call the wrapper once, alone, with exactly step 3's paths") | — | command entry; procedure entry (committer), step 4 | `change` | Task 1 — the definition sentence is added here |
| 2 | `plugin/agents/committer.md` → `### Standard procedure` step 5 (`**Verify:**`) | — | procedure entry (committer), step 5 | `change` | Task 1 |
| 3 | `plugin/agents/committer.md` → `### Standard procedure` step 6 (`**Push:**`) | — | procedure entry (committer), step 6 | `change` | Task 1 |
| 4 | `plugin/agents/committer.md` → `### Standard procedure` step 4's landed-exit-1 re-sync ("re-sync it with one identical call") | — | procedure entry (committer), step 4 | `no-change` | "identical" to a call that is already once, alone, so it inherits the rule |
| 5 | `plugin/agents/committer.md` → `### Standard procedure` step 1 (**Sanity:** `git branch --show-current` and `git status --short`) | — | procedure entry (committer), step 1 | `no-change` | runs no wrapper and nothing after it depends on the sandbox exemption; the task prompt names only step 5's checks |
| 6 | `plugin/agents/committer.md` → `### ui_test_pass procedure` steps a, e (`git branch --show-current`, `git status --short`) | — | procedure entry (committer), steps a, e | `no-change` | sanity reads, as row 5 |
| 7 | `plugin/agents/committer.md` → `### ui_test_pass procedure` step f ("call the wrapper once, alone") | — | procedure entry (committer), step f | `no-change` | already uses step 4's phrase, so the definition reaches it from step 4; pinned by Task 3 |
| 8 | `plugin/agents/committer.md` → `### ui_test_pass procedure` steps g, h ("**Verify** as step 5 does", "**Push** as step 6 does") | — | procedure entry (committer), steps g, h | `no-change` | they point to steps 5 and 6, which Task 1 changes; pinned by Task 3 |
| 9 | `plugin/agents/committer.md` → `## Resolved values` `<scripts_dir>` row and `## Invocation contract` `push` bullet | — | command entry | `no-change` | they name the wrappers but issue no call; the `<MAIN_REPO>` row already says "never through a substitution or a variable" |
| 10 | `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.6 How to flip / create — direct `commit-on-branch.sh`, NEVER a committer dispatch` | — | command entry | `change` | Task 2 — the shared place every orchestrator commit point cites |
| 11 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)` ("Then issue the push as its **own** Bash call, never in the same call as the commit") | — | command entry | `no-change` | already issues each wrapper as the call's only command and cites §1.6 |
| 12 | `plugin/instructions/docs_phase_instructions.md` → `## Commit mechanics` ("push-branch.sh issued unconditionally as a separate statement") | — | command entry | `no-change` | points to row 11's section and states the separate call |
| 13 | `plugin/instructions/dispatch_discipline_instructions.md` → `## Commit mechanics` ("as its own Bash command") and `## Push` ("a **plain, single-statement** Bash command") | — | command entry | `no-change` | already states both calls as their own; cites §1.6 |
| 14 | `plugin/instructions/clarification_digest_instructions.md` → `## Push` ("a **plain, single-statement** Bash command") | — | command entry | `no-change` | already states it; cites §1.6 in `## Commit mechanics` |
| 15 | `plugin/instructions/improvement_observations_instructions.md` → `## Commit mechanics` ("issued alone and never compounded") and `## Push` | — | command entry | `no-change` | already states it; cites §1.6 |
| 16 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → Override D **Exact staging + commit.** ("as the call's only command") and Override E ("a **plain, single-statement Bash command**") | — | command entry | `no-change` | already states it; cites §1.6 |
| 17 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → Override 3 and Override 4 ("Then issue the push as its **own** Bash call, never in the same call as the commit") | — | command entry | `no-change` | already states it; cites §1.6 |
| 18 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → Override 3 and Override 5 ("as its **own** Bash call") | — | command entry | `no-change` | already states it; cites §1.6 |
| 19 | `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` → the `<app_root>` row and paragraph | — | command entry | `no-change` | says the core invokes no wrapper; it only names which root a fork's call uses |
| 20 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → Override D, Override E ("a **plain, single-statement Bash command**") and the QA.0 augment ("as its **own** Bash call") | — | command entry | `no-change` | already states it; cites §1.6 |
| 21 | `plugin/commands/branch-start-docs-autonomous.md` → `<scripts_dir>` row and hard boundary | — | command entry | `no-change` | names `push-branch.sh` and "invokes neither" |
| 22 | `plugin/commands/branch-start-plan-autonomous.md` → `<scripts_dir>` row and hard boundary | — | command entry | `no-change` | names `push-branch.sh` and "invokes none" |
| 23 | `plugin/commands/branch-start-user-review-fix-autonomous.md` → `<scripts_dir>` row, step 1 and hard boundary | — | command entry | `no-change` | names the wrappers and "invokes neither"; the forks own the calls (rows 18, 20) |
| 24 | `plugin/docs/AUTONOMOUS_FLOW.md` → the "Git wrappers" row and **What the flow does push.** | — | command entry | `no-change` | describes the wrappers and points to §1.6; issues no call |
| 25 | `.claude/context/conventions.md` → `## Shell assets` ("A call to a main-checkout wrapper … carries no `$` at all") | — | command entry | `no-change` | a conventions document, never a plannable target; the rule it states still holds, and this branch falsifies nothing in it |
| 26 | `harness-runs/lessons.md` and `harness-runs/improvement_suggestions.md` — every entry | — | standing-artifact procedure: no entry states how a wrapper call is issued | `no-change` | no entry is reached |
