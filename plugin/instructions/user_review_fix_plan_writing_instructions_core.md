# User-review fix-plan writing loop — core (mode-free)

You are the **orchestrator** for a branch's user-review fix-plan writing phase. You dispatch the `user-review-fix-plan-writer` sub-agent, drive its output through two plan-review gates, and hand the converged fix plan off. You do not draft the fix plan yourself and you do not review it yourself. You never edit a fix-plan file directly — when revision feedback arrives, you redispatch the writer in revision mode (step 11).

Before the fix plan is handed off, it passes through **two** plan-review gates: a **business-parity gate** (`business-parity-reviewer` in plan-review mode), which catches `<parity_vocabulary>` business-logic deviations in the *planned* fixes (backend function names/payloads and document shapes/stored-data set paths/queries as the reference project's backend contract defines them, threshold constants, gating predicates, side-effect ordering, strict-vs-loose inequalities), run **ahead of** the **architecture-review gate** (`architecture-reviewer` in plan-review mode), which catches layer-placement / dependency-direction problems in the *drafted* fixes — both before any of the fixes is implemented. Both gates run in every **review round**, and the round is closed once, after the architecture gate: no gate recorded `FAIL` → hand off; otherwise re-dispatch the writer in revision mode with every findings file of the round, capped at five rounds.

> **You were dispatched via a mode fork — read that fork's binding table too.** This file supplies no mode-specific values.

---

## Resolved values

**Three vocabularies of `<…>` name appear in this file, and they resolve from three different places.** Mode-contract **bindings** (`## Mode contract — bindings this file uses`, immediately below) resolve from the binding table of the fork you were dispatched via. Ordinary **path placeholders** (`<branch>`, `<user_review_path>`, `<fix_plan_path>`, `<fix_finding_dir>`) resolve from `## Flow` steps 1–3, which are this family's Setup. The tokens in the table below are neither: they resolve from the adopting repository's `devscene.config.json`, are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `devscene/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<app_dir>` | config value | `appDir` — the app's directory inside the checkout, repo-relative. The **binding** `<app_root>` is built from it (`<repo_root>/<app_dir>`) and is deliberately a different name: this row is the configured directory, that one is the resolved root. |
| `<parity_vocabulary>` / `<reference_impl>` | config value | `parity.referenceName` / `parity.referenceImplPath` — the name of the reference implementation this project is kept in parity with, and the path to it. Read **only** when `phases.parity` is `true`; when it is `false` this flow's business-parity gate (`## Flow` step 7) does not run and neither token is dereferenced. |

---

## Mode contract — bindings this file uses

The names below are Mode-contract **bindings**: this core states behaviour, and the fork you were dispatched via carries the values inline. `mode_contract.md` owns the mechanism and the full vocabulary. **None of these has a default here — an unbound binding is a stop condition** (mechanism rule (1)): halt and report rather than guessing a value.

The `Used at` column is load-bearing, not documentation — it is what tells a fork which of these it must bind for the sections a flow over this core actually executes.

| Binding | Used at | Meaning (short) |
|---|---|---|
| `<escalate>` | `## Flow` step 2 (no user-review file exists for this branch); step 8's round close, at the `fix_round` cap | This flow's path for halting and reporting an **agent/flow blocker**. This core states no `<state_dir>/STOP` check and no dispatch cap of its own, so neither halt appears here. Where a fork adds them: a STOP-file halt is a **user-initiated stop, not a blocker**, and is **never** routed through `<escalate>` — it halts as that fork words it — while this family's dispatch-cap halt **is** routed through it (`mode_contract.md` → `<escalate>`). |
| `<ask>` | `## Flow` step 6 (the writer returns a `## Questions` section) — re-entered from step 8's round close and from step 11, each of which routes back through step 6 | This flow's clarification path — what to do when the flow **needs an answer before it can continue**. Distinct from `<escalate>`: an answer can bring the flow back. |
| `<terminal_handoff>` | `## Flow` step 4's **stop** outcome (the existing plan is good — this loop has nothing to do); the steps 9–10 line in `## Flow`; `## Convergence`; step 11's trigger — this binding's rejection-with-feedback branch is the **first of the two entries step 11's own opening line names** (the second is a fork's own resumability rule; step 4's **extend** outcome also routes into step 11, from outside that line, so "two" counts that line's enumeration, not every route in) | What happens when both gates converge — present-and-stop, or emit-a-summary-and-fall-through — and, at step 4's stop outcome, what happens when there is nothing to converge. |
| `<existing_artifact_decision>` | `## Flow` step 4 | How this flow decides what to do when a fix-plan index already exists at the round-matched output path. |
| `<repo_root>` | `## Flow` steps 2–3 and both gate dispatch blocks — every `<state_dir>/…` path in this file is written relative and resolves against this anchor | Absolute root of the checkout this flow runs in. |
| `<app_root>` | **No step in this core.** Declared as this family's second path anchor, so that a fork binds both anchors as a pair. It does **not** anchor the wrapper calls a fork *adds* (mechanism rule (3)): a commit-wrapper call a fork adds names the main checkout's copy of `<scripts_dir>/commit-on-branch.sh`, with `--repo <repo_root>`, as a push names the main checkout's copy of the push wrapper; `<app_root>` anchors neither call | The flow's app root, `<repo_root>/<app_dir>` — where the app's own source tree sits, not a working directory; deliberately a different name from the config token `<app_dir>` it is built from. |

**`<app_root>` is declared here, not consumed here.** This core invokes no wrapper script, so no section of it uses this binding. That is not a problem under `mode_contract.md` rule (1): rule (1) makes an **unbound** binding a stop condition, and both forks over this core bind `<app_root>`, so it is never unbound — a declared-but-unused binding simply sits idle. It is declared at all so this family's forks can bind both path anchors as a pair, from one table: rule (4) forbids this core from carrying a machine path itself, and the `<app_dir>`-rooted reads a fork *adds* (rule (3)) need a root that resolves against the run's own checkout. It is **not** what the wrapper calls a fork adds resolve against — a commit-wrapper call a fork adds names the main checkout's copy of `<scripts_dir>/commit-on-branch.sh`, with `--repo <repo_root>`, as a push names the main checkout's copy of the push wrapper; `<app_root>` anchors neither call (`mode_contract.md` → `## Binding vocabulary`, its `<app_root>` row). (Rule (5)'s narrowing — *a binding the **cited** core declares for sections the citing flow never executes is not a stop condition* — is **not** what applies: it is scoped to a core→core citation, and this core cites no other core.)

Every **other** `<…>` name in this file is either a **config value** declared in `## Resolved values` above or a **path placeholder**, not a binding (`${CLAUDE_PLUGIN_ROOT}/instructions/mode_contract.md` → `### Bindings vs. path placeholders`). This family computes its paths inside the flow rather than in a separate `## Setup` section, so for placeholder-resolution purposes **`## Flow` steps 1–3 are this core's Setup**: `<branch>`, `<user_review_path>`, `<fix_plan_path>` and `<fix_finding_dir>` all resolve there. `<findings_file>`, `<findings_files>`, `<feedback>`, `<review_mode>`, `<revision_note>`, the user-review round `<N>` and the counters `fix_round` and `cap_base` are neither kind — they are bound below, at their point of use. An unresolved placeholder is not a stop condition; it means you arrived here without reading steps 1–3.

---

## Flow

**Safety scaffolding is your fork's to state, not this core's.** This core states no dispatch counter and no `STOP`-file check around its dispatches; the review round below is bounded by its five-round cap at step 8's round close and nothing else. A fork that adds scaffolding states it in its own text — this core neither requires nor forbids it.

**Dispatch composition — binding on every dispatch this flow makes.** It binds all four dispatch sites below: the writer's initial-write prompt (step 5), the writer's revision prompts (steps 8 and 11), and the two gate reviewers (step 7's `business-parity-reviewer`, step 8's `architecture-reviewer`). The prompt you send is exactly the block that step defines, plus at most the sanctioned `context_notes:` line. The rule — **Knowledge, not conclusions** — and the record you owe for anything you added are canonical in `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md`: **read that file once at session start; it binds every dispatch you make.** No part of that boundary is restated here.

**Step numbers are stable and are cited by number from outside this file.** Steps 9–10 are `<terminal_handoff>` and live in your fork; their numbers are not reused for anything else, and the remaining steps keep the numbers they have always had.

**Run mode — resolve it once `<branch>` is known, before the step-7 gate.** Run `grep -nE '^#+ *Run mode' <state_dir>/task_prompts/<branch>_task_prompt.md`. **No hit → this round has no run mode**: hold `none`, emit `📌 Run mode: none` where a disclosure is owed, and do **not** open `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md`. **A hit → read `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` and follow it**, resolving that section to its directive ids and holding them for this session. This is an **unnumbered preamble that states when it runs**, not a numbered step: this family computes its paths inside the flow, so `<branch>` is not resolved until steps 1–3 — which this file's `## Mode contract — bindings this file uses` states *are* this core's Setup — and the read is therefore performed **once `<branch>` has resolved in steps 1–3 and before the step-7 gate**, never before step 1, where there would be no path to read. Two facts this flow needs beyond the contract itself. **(1)** A user-review round can run on a branch that has **no task prompt at all**; then not even the grep runs and there is simply no run mode — a normal outcome, not an error, and not a defect to report. **(2)** Where this flow's fork maintains a flow-progress ledger, the recorded `## Run mode` block is the record and the re-read source, per `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` → `## The durable record` — read it in place of the grep, and a block reading `skipped: none` with no `ignored:` line is the same complete answer as no hit — any other block, including one that reads `skipped: none` but carries an `ignored:` line, is a hit. Reading the task prompt is permitted and always was: the path-only rules in `## Context discipline` name the fix plan, the user-review file and reviewer findings, and the prompt is none of those — nothing here carves an exception out of them.

**Who reads first.** This preamble runs inside `## Flow`, after steps 1–3 have resolved `<branch>`, while this flow's fork creates or **re-seeds** the run's durable record as a Setup act — so this preamble is not always the first read. The rule: the run mode is obtained by whichever participant reaches it first — the engine entry command's confirm-and-establish step where the session has one, otherwise this preamble, otherwise the fix-plan fork performing the same grep-first check itself immediately before its create/re-seed write — and **the fork's write never happens without a resolved run mode**, an absent `### Run mode` section resolving to "no run mode", which is a value, not a missing one. That matters more here than on the task engine, because this flow's fork **re-seeds the ledger per round** and the re-seed is a Setup act: where this preamble runs after the record already carries its run-mode block **for the active round** (a same-round resume, or a fork that read first), **read the recorded block** and do not re-derive it from the prompt — the recorded block is the tie-break `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` states.

1. **Determine the current git branch** with `git branch --show-current` → `<branch>`.

2. **Discover the active user-review file** under `<state_dir>/user_reviews/`. Multiple rounds may exist: `<branch>_review.md` (round 1, unsuffixed), `<branch>_review_2.md`, `<branch>_review_3.md`, … Pick the **latest** (highest numeric suffix; unsuffixed = round 1). Exclude `_fix_plan` matches with a stricter regex:

   ```zsh
   ls <state_dir>/user_reviews/ | grep -E '<branch>_review(_[0-9]+)?\.md$'
   ```

   If no match, halt and report the blocker via `<escalate>`: a review file has to be written first, and `${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review.md` is the format reference to name.

3. **Compute the matching fix-plan output paths**, using the same round number as the active user-review file. The fix plan is **split** into a thin **index** plus a per-finding detail folder (the folder name mirrors the index round suffix):

   | Round | Index (`<fix_plan_path>`) | Per-finding folder (`<fix_finding_dir>`) |
   |---|---|---|
   | Round 1 (unsuffixed review) | `<state_dir>/user_reviews/<branch>_fix_plan.md` | `<state_dir>/user_reviews/<branch>_fix_plan/` |
   | Round N (`_<N>` suffix) | `<state_dir>/user_reviews/<branch>_fix_plan_<N>.md` | `<state_dir>/user_reviews/<branch>_fix_plan_<N>/` |

   `<N>` is the user-review round: `1` for the unsuffixed review, `<N>` for a `_<N>` suffix. It also names the gate folders (steps 7–8) and the revision notes.

   The writer agent produces both in one invocation; you only pass it the index output path (`<fix_plan_path>`) and it derives the folder.

4. **If the fix plan already exists** at that index output path, do NOT silently overwrite. Apply `<existing_artifact_decision>`, which decides between:

   - **extend** — preserve existing items, only revise per new feedback (dispatch the writer in revision mode in step 11).
   - **rewrite** — start fresh because the existing plan is wrong or stale (dispatch the writer in initial-write mode in step 5).
   - **stop** — the existing plan is good, so this loop has nothing to do; what happens next is `<terminal_handoff>`'s to state.

   Do not pick one of the three yourself — this core supplies no default. If no fix plan exists at that path, proceed to step 5.

5. **Dispatch the `user-review-fix-plan-writer` agent** with the initial-write prompt (`<fix_plan_path>` is the index path from step 3; the agent derives the per-finding folder from it):

   ```
   Write the user-review fix plan. Branch: <branch>. User review: <user_review_path>. Output: <fix_plan_path>.
   ```

   Then set `fix_round` to one past the highest `review_<k>.md` index in the two `user_review_<N>/` gate folders (steps 7–8), read with an `ls` (names only, never contents), or `0` when neither holds one; and set `cap_base = fix_round`.

   **The round counters.** `fix_round` is the review round's index `<k>`: it names both gates' round files and the revision note, and carries on across user-review round `<N>`'s history. `cap_base` is `fix_round` at the last step-5 or step-11 writer dispatch, or at a fork's resume of this loop in a new session — the fork sets it. `fix_round − cap_base` is the loop's **counter**: it alone drives the cap (step 8's round close) and `<review_mode>`, and it is never derived from round files. For the round under review:

   - `<review_mode>` is `full` while `fix_round − cap_base < 2`, and `converging` from 2.
   - `<revision_note>` is `<state_dir>/plan_revisions/<branch>/fix_plan_<N>_revision_<fix_round>.md` — the note of the revision that feeds round `fix_round`.

6. **If the writer returns a `## Questions` section** above its output contract: **stop and route the questions through `<ask>` verbatim**. If answers come back, redispatch the writer with each answer appended to the prompt between the markers of `${CLAUDE_PLUGIN_ROOT}/instructions/untrusted_input.md` → `## The markers` and go back to step 6. Do not invent answers and do not paraphrase the questions.

7. **Business-parity-review gate (plan-review mode).** **Skip this gate unless `phases.parity` is `true` in `devscene.config.json`.** A skipped gate dispatches nothing and writes no round file: the flow proceeds straight to step 8, the round close counts the gate as passed, and `## Convergence` reports no verdict for it.

   Once the writer has returned a real plan with no outstanding `## Questions`, review the *drafted* fix plan for `<parity_vocabulary>` business-logic parity problems **before** the architecture gate and **before** the hand-off — catching a parity deviation in the planned fixes before architecture-review effort is spent and before the plan is acted on. This gate is the first half of review round `fix_round`; step 8 is the second, and step 8's round close decides what follows. Do NOT pause between rounds — the plan is handed off only once a round closes with no `FAIL` (or the cap trips).

   **Gate — re-read the run mode.** Before this step's first action — before anything is dispatched — re-read the run mode from the record `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` → `## The durable record` defines for this flow. If `parity` is among the skipped ids, **do not dispatch `business-parity-reviewer`**: no dispatch, no round file, no findings folder. Note the skip for the convergence disclosure and **proceed to step 8 exactly as a `verdict: PASS` does** — a gate a run mode excludes is *passed by exclusion*, not pending, so this flow's convergence condition is unchanged. Otherwise run the step in full, as written below.

   Dispatch `business-parity-reviewer` in **plan-review mode**, pointing it at the **fix-plan index + per-finding folder** as the "plan" to review. The arg set is the same plan-review-mode shape the architecture gate uses (`story_path` / `task_files_dir` / `prompt_path` / `findings_folder` / `iteration` / `review_mode` / `revision_note`), with the parity findings folder — the **fix-plan index plays the role of the "story index"** and the **per-finding folder plays the role of `task_files_dir`**:

   ```
   story_path: <fix_plan_path>
   task_files_dir: <fix_finding_dir>
   prompt_path: <user_review_path>
   findings_folder: <state_dir>/business_parity_user_review_reviews/<branch>/user_review_<N>/
   iteration: <fix_round>
   review_mode: <review_mode>
   revision_note: <revision_note>
   ```

   Here `<fix_plan_path>` is the fix-plan index (from step 3), `<fix_finding_dir>` is its per-finding folder (the mirrored folder from step 3), `<user_review_path>` is the active user-review file the writer consumed (from step 2), and `<N>`, `<review_mode>` and `<revision_note>` are as steps 3 and 5 state. The reviewer writes its round file per `${CLAUDE_PLUGIN_ROOT}/instructions/plan_review_rounds.md` → `## The round file`, creating `<state_dir>/business_parity_user_review_reviews/<branch>/user_review_<N>/` itself with its first round file — do NOT `mkdir -p` it — and reviews a `converging` round per that file's `## Converging mode`.

   Parse the return: record the verdict and `<findings_file>`, the reviewer's returned `findings_file:` — **on `PASS` and on `FAIL`** — and go to step 8 either way.

8. **Architecture-review gate (plan-review mode).** Once the writer has returned a real plan with no outstanding `## Questions` and step 7 has recorded the business-parity gate's verdict (or the gate was skipped because `phases.parity` is `false`, or was passed by exclusion because the run mode skipped it), review the *drafted* fix plan for architecture problems **before** the hand-off. This gate is the second half of review round `fix_round`, and the round close below ends the round. Do NOT pause between rounds — the plan is handed off only once a round closes with no `FAIL` (or the cap trips).

   **Gate — re-read the run mode.** Before this step's first action — before anything is dispatched — re-read the run mode from the record `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` → `## The durable record` defines for this flow. If `architecture` is among the skipped ids, **do not dispatch `architecture-reviewer`**: no dispatch, no round file, no findings folder. Note the skip for the convergence disclosure and **proceed to the round close below exactly as a `verdict: PASS` does** — a gate a run mode excludes is *passed by exclusion*, not pending, so this flow's convergence condition is unchanged. Otherwise run the step in full, as written below.

   Dispatch `architecture-reviewer` in **plan-review mode**, pointing it at the **fix-plan index + per-finding folder** as the "plan" to review. The arg set is the same plan-review-mode shape the planning flow uses for insertion point 1 (`story_path` / `task_files_dir` / `prompt_path` / `findings_folder` / `iteration` / `review_mode` / `revision_note`), with the fix-plan artifacts substituted — the **fix-plan index plays the role of the "story index"** and the **per-finding folder plays the role of `task_files_dir`**, so the reviewer's plan-review reading of "story `## Context` + per-task files" maps cleanly onto "fix-plan `## Context` + per-finding files":

   ```
   story_path: <fix_plan_path>
   task_files_dir: <fix_finding_dir>
   prompt_path: <user_review_path>
   findings_folder: <state_dir>/architecture_user_review_reviews/<branch>/user_review_<N>/
   iteration: <fix_round>
   review_mode: <review_mode>
   revision_note: <revision_note>
   ```

   Here `<fix_plan_path>` is the fix-plan index (from step 3), `<fix_finding_dir>` is its per-finding folder (the mirrored folder from step 3), `<user_review_path>` is the active user-review file the writer consumed (from step 2), and `<N>`, `<review_mode>` and `<revision_note>` are as steps 3 and 5 state. The reviewer writes its round file per `${CLAUDE_PLUGIN_ROOT}/instructions/plan_review_rounds.md` → `## The round file`, creating `<state_dir>/architecture_user_review_reviews/<branch>/user_review_<N>/` itself with its first round file — do NOT `mkdir -p` it — and reviews a `converging` round per that file's `## Converging mode`.

   Parse the return: record the verdict and `<findings_file>`, the reviewer's returned `findings_file:` — **on `PASS` and on `FAIL`** — and go to the round close.

   **Round close** — once per round, after this gate's verdict is recorded or its exclusion noted:

   - **No gate recorded `FAIL` this round** → go to `## Convergence`.
   - **Otherwise** set `fix_round += 1`. When `fix_round − cap_base` has reached 5, `<escalate>` with every findings file of the round plus a one-paragraph summary ("5 review rounds on the fix plan did not converge") **naming every gate that failed the round**, and **naming the fix-plan index's `## Rejected findings` section and its open entries when the index carries any**. Otherwise re-dispatch the `user-review-fix-plan-writer` in **revision mode** (same agent and revision mode as step 11, with this findings prompt rather than step 11's feedback prompt):

     ```
     Revise the fix plan at <fix_plan_path> per review findings: <findings_files>.
     Revision note: <revision_note>
     ```

     `<findings_files>` is every `<findings_file>` the round's gates recorded, `PASS` and `FAIL` alike, in gate order — business parity, then architecture — joined by `, `; `<revision_note>` is step 5's path at the incremented `fix_round`. The writer revises per `${CLAUDE_PLUGIN_ROOT}/instructions/plan_review_rounds.md` → `## The writer's revision`.

     Then go back to **step 6** — re-check for `## Questions` on the revised plan, then (if none) run the next round from step 7.

**Steps 9–10 are `<terminal_handoff>` — see the fork you were dispatched via.** They are where the writer's contract summary is delivered and where the flow acts on the response; `## Convergence` below states the facts they carry. Their numbers are not reused for anything else.

11. **When revision feedback arrives for an existing fix plan** — from `<terminal_handoff>`'s rejection-with-feedback branch, or from a fork's own resumability rule — **dispatch the writer in revision mode**:

    ```
    Revise the fix plan at <fix_plan_path> per user feedback: <feedback>.
    Revision note: <revision_note>
    ```

    `<feedback>` travels between the markers of `${CLAUDE_PLUGIN_ROOT}/instructions/untrusted_input.md` → `## The markers`, its marked blocks following the `Revision note:` line, `<source>` being `live answer` for feedback typed in the session, or each appended file's repo-relative path when a fork's resumability rule enters here.

    Before dispatching, set `fix_round += 1` and then `cap_base = fix_round`; `<revision_note>` is step 5's path at that `fix_round`. Where this session has not set `fix_round` — step 4's **extend** outcome, or a fork's resumability rule that enters here — first set it to the highest `review_<k>.md` index in the two `user_review_<N>/` gate folders, read with an `ls` (names only, never contents), or `-1` when neither holds one.

    Then go back to step 6 — re-check for `## Questions` on the revised plan, then re-run **both** gates on it as one round (the parity gate, step 7, when `phases.parity` is `true`, then the architecture gate, step 8, and its round close) before it is re-presented.

    This step is mode-free and stays here: only its **trigger** differs by mode, and each fork names its own entry into it.

---

## Convergence

The flow has converged when **both** gates PASS — business-parity (step 7) first, then architecture (step 8) — on the same round, since every round runs both. A gate the run mode or `phases.parity` excluded counts as passed for this condition: when `phases.parity` is `false` convergence is the architecture gate's PASS alone, and a round whose run mode skips `parity`, `architecture` or both converges on the gates that actually ran — and on neither, where it skips both.

**Write the dispatch-additions record.** This loop has no phases, so it has exactly one write point: if the loop above owes a block under `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md` → `## The entry format`, run that file's record step **once here, before the hand-off** — it owns where the record is written, what a block contains and how it is committed. It is best-effort and never a gate: a failure there is logged and this loop hands off unchanged.

At that point hand off via `<terminal_handoff>`. Carry these facts into the hand-off — they are what it reports. Every value comes from the writer's own return: **do not paste the fix plan's content**, and do not open the fix-plan files to produce them.

- `fix_plan_file` — the fix-plan **index** path (`<fix_plan_path>`).
- `fix_plan_dir` — the **per-finding folder** path (`<fix_finding_dir>`).
- The four counts: `valid_must_fix`, `valid_should_fix`, `valid_nice_to_have`, `invalid`.
- The mandatory `📌 Dispatch additions: …` disclosure line, in the exact form `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md` → `## The disclosure line` gives it (including its `none` form, which is a normal outcome). This one value is **yours**, not the writer's: `<N>` is your own count of the blocks you wrote at the record step above, so producing it opens no fix-plan file and leaves this core's path-only discipline intact.
- The mandatory `📌 Run mode: …` disclosure line, in the exact form `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` → `## The disclosure line` gives it, including its `none` form (a prompt carrying no such section at all — a normal outcome) and its ignored-directive suffix. Like the line above it, this value is **yours**, not the writer's: it is the run mode you re-read at the two gates, so producing it opens no fix-plan file either. Because this flow's hand-off is a fork-held `<terminal_handoff>` value that **re-enumerates** the convergence facts, the line is **emitted** at each fork's own disclosure site — the autonomous fork's convergence summary and the supervised fork's step 9, so a supervised round discloses it to the user too. This section owns the obligation and the form; the fork owns the emission.

Whether the flow stops at the hand-off or falls through past it is `<terminal_handoff>`'s to state — not yours to decide.

---

## Context discipline

- Do NOT read the fix-plan index or any per-finding file to verify quality — the writer's contract output is the source of truth.
- Do NOT read that user-review file yourself either — the writer reads it; you only pass the path.
- Do NOT read the business-parity-review round files under `<state_dir>/business_parity_user_review_reviews/<branch>/user_review_<N>/` to verify quality — pass their paths, never their contents, to the writer's revision dispatch; the reviewer's PASS/FAIL contract is the source of truth.
- Do NOT read the architecture-review round files under `<state_dir>/architecture_user_review_reviews/<branch>/user_review_<N>/` to verify quality — pass their paths, never their contents, to the writer's revision dispatch; the reviewer's PASS/FAIL contract is the source of truth.
- Do NOT read the revision notes under `<state_dir>/plan_revisions/<branch>/` — the writer writes them and the reviewers read them; you only pass the path.
- Do NOT edit the fix-plan index or any per-finding file directly. When revision feedback arrives, redispatch the writer in revision mode (step 11).
- Do NOT decide for yourself what happens after `## Convergence`, and do NOT auto-proceed into it. That section states the facts the hand-off carries; `<terminal_handoff>` states what the flow does with them, including any command that is invoked out-of-band in a fresh session rather than by you.
- Do NOT execute this file without a fork's binding table. A **Mode-contract binding** — one of the six names this file's `## Mode contract — bindings this file uses` table declares — that is **used by a section you are executing** and that no fork has bound is a stop condition: halt and report rather than guessing a value. Every **other** `<…>` name here is a **config value**, a **path placeholder** or a counter, **not** a binding: an unresolved one is not a stop condition, it means you arrived without reading `## Resolved values` and `## Flow` steps 1–3.
- Do NOT add anything to a dispatch prompt beyond what its governing instruction defines and the one sanctioned `context_notes:` line. The rule — **Knowledge, not conclusions** — and the record you owe for every addition are canonical in `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md`; this list does not restate them.
