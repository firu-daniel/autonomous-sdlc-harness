# Story: Fix Gate 12 round 10's run-control findings

## Context

Gate 12 round 10 (2026-10-07, CLI 0.6.4, `firu-daniel/harness-gate12`) ran observation (xiv), run control, with its new leg (j), mentions read by an agent, and observation (xv), the run-actor allow-list, with its new leg (d′). It raised two Low issues. This branch fixes both. The task prompt drops four more items "after review, as not worth a fix-and-test round", and no task here touches them: the `@sdlc-harness approve` mention path and leg (f)'s outdated text, the `harness-resume.yml` schedule, the review whose API call errored, and close jobs after a seed reset. The prompt carries no round-10 record text, so no task writes a round 10 paragraph into `docs/development.md`.

The work is cut into four single-layer tasks: two in `cli`, then two in `general`, the catch-all, which ships last because it documents what the `cli` tasks built. No `plugin` file changes. The mention-reading command and instruction are right to decline a read outside their context. The prompt calls that decline "by design", and the fix is in how the gate exercises `--restricted`, not in the agent.

**Issue 2 (Low): a refused commenter's control job still installs `claude` and fetches the plugin.** Tasks 1 and 2. The actor check lives in `remote-run.sh control`, the job's last step. So the three comment-only steps (`Set up Node`, `Install the claude CLI when absent`, `Fetch the pinned plugin`) run before anything has been decided. The fix takes the prompt's first suggestion: "run it first as its own step and expose an output". It also takes the second suggestion's condition, "only once a mention has passed the actor check". An exact-form command never starts an agent session, so it skips the install too.
- **Task 1** adds the mode `remote-run.sh control --needs-agent`. It reads the `issue_comment` event as `control` does, then answers one question: would the act step start an agent session for this comment? The answer is **exit 0** for a mention that passes `control`'s own gates 1 to 3 (`HARNESS_REMOTE_STOP`, `forge_on`, the re-runner, `authorise_actor`). It is **exit 2** for anything else: an ignored comment, an exact-form command, or a gate refusal. It is **exit 3** when the permission call failed and the answer is unknown. The mode posts nothing, dispatches nothing and writes nothing.
- The gates are **not copied**. Task 1 moves them into one function, which both `control` and `control --needs-agent` call. The refusal texts `control` replies with stay byte for byte as they are today.
- **Task 2** adds the step `Decide whether the comment needs the agent` (`id: needs`) to `harness-control.yml`. It writes `agent=no` to `$GITHUB_OUTPUT` only on exit 2, and `agent=yes` on every other exit. The three comment-only steps each gain `&& steps.needs.outputs.agent != 'no'`.
- **The workflow file is still not the authority.** The act step re-runs every check and replies as it does today. A failed or missing check (an older `remote-run.sh`, a refused permission call, a failed step) leaves the output anything but `no`. That installs as before, so the cost comes back but no mention goes unread.

**Issue 1 (Low): (xiv)(j) step 11 cannot exercise `--restricted`.** Tasks 3 and 4, documentation only. The mention skill tells the agent to answer from the run context only, so the agent declines before it calls any tool, and the confinement is never tested. The fix takes the prompt's first suggestion. Task 4 rewrites step 11 to drive `claude --restricted … -p` directly, from a throwaway directory, with the flag set `control_mention_session` passes. Its prompt asks for a `Read`, a `Grep` and a `Glob` of a sentinel file outside the directory, and, as positive controls, `Read`s inside the working directory and inside the one `--add-dir`. The pass condition needs the transcript to show each outside call **attempted and refused**, and the sentinel's text in no tool result. A transcript with no outside call is recorded as **not observed**, as the prompt asks ("Make the step's pass condition require the decision line or the log to show an attempted, refused read"). Task 3 repoints `docs/github-run-control.md` → `## 8.`'s `--restricted` row at the new step and records why round 10's mention form of the step was not observed.

**The record of Issue 2's change** (Tasks 3 and 4). Task 3 updates `docs/github-run-control.md`: `## 1.`'s ordered checks, `## 6.`'s credential bullets, and a new `## 8.` row for the GitHub behaviour the gating rests on (a step's `$GITHUB_OUTPUT` value read by a later step's `if:`). Task 4 updates the Gate 12 procedure in `docs/development.md`. (xiv)(j) step 10 and (xv) legs (d) and (d′) gain the condition that an exact-form or refused comment's job **skips** the install and the fetch. (j)'s **What it settles** names the new step 11 and the new row. Neither task writes a measured duration. The prompt's "~5–10 s" stays in the prompt (lessons ledger: *a wall-clock figure in a document of record is never one a run measured*), and the docs say "an install and a clone".

Top risks: The likeliest regression is Task 1's move of `control`'s gates into a shared function. It could change a refusal's text or exit code, or the order of the gates, for every route that already passes through them (comments, reviews). Task 1 keeps every reply byte-identical. Its new suite asserts that a `--needs-agent` refusal reason equals the reason `control` replies for the same event. The existing control suites run unchanged in Phase G. The second risk is Task 2's gating skipping the install for a comment that does need the agent. That leaves a mention answered with the "agent binary … is not on this job's PATH" refusal. Task 2 therefore writes `agent=no` on exit 2 alone, gates on `!= 'no'` rather than `== 'yes'`, and runs the step body under `bash -e -o pipefail` against stub exits 0 to 3. The third risk is Task 4's step 11 failing to settle the row a second time, because the agent again declines to try. Its prompt names the tool calls outright, with no harness instruction in the session to decline on. A transcript with no outside call is graded not observed, never a pass.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`.** That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker, or edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as the sub-step bullets inside the per-task files, are informational only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_forge_run_control_gate12_round10_findings/task_<K>_plan.md`. The entries are ordered bottom-up by ship sequence in the configured layer order: `cli` first, with the catch-all `general` layer last. No task is in `plugin`.

1. [ ] **Task 1** — `remote-run.sh control --needs-agent`: the actor and mention check, run alone, posting nothing _(layer: cli)_ _(points: 18)_
2. [ ] **Task 2** — `harness-control.yml` installs `claude` and fetches the plugin only when the comment needs the agent _(layer: cli)_ _(points: 14)_
3. [ ] **Task 3** — `docs/github-run-control.md`: the install gated on the agent check, and the `--restricted` row repointed _(layer: general)_ _(points: 10)_
4. [ ] **Task 4** — `docs/development.md` Gate 12: step 11 drives `claude --restricted` directly, and the skipped install in (j) and (xv) _(layer: general)_ _(points: 12)_

## Scope register

This plan's targets include durable corpus text. That is two documents under `docs/` (`github-run-control.md`, `development.md`), plus the header comments of the adopter-facing templates `cli/templates/scripts/remote-run.sh` and `cli/templates/github/workflows/harness-control.yml`. The tests are source, and none of them owes a row.

**Scope predicates**, quoted verbatim from the task prompt:
- *"Suggested fix: settle the `--restricted` row with a gate that drives `claude --restricted … -p` directly (asking for a `Read` of an absolute path outside the directory, and checking for the denial), or ask in step 11 for a file the agent has reason to read (one named in `run.md` but placed outside the context directory). Make the step's pass condition require the decision line or the log to show an attempted, refused read."*
- *"Suggested fix: gate the install and fetch steps on the actor check (run it first as its own step and expose an output), or install and fetch lazily inside `remote-run.sh control` only once a mention has passed the actor check."*

**Derivation entry D1 — the comment-only steps (command).** Re-run verbatim from the checkout root:

```
git grep -nE "Install the claude CLI when absent|Fetch the pinned plugin|Set up Node|comment-only steps|before any agent session" -- docs plugin cli/templates README.md ARCHITECTURE.md
```

**Derivation entry D2 — the `--restricted` confinement and step 11 (command).**

```
git grep -nE -e "--restricted|leg \(j\) step 11|step 11 settles" -- docs plugin cli/templates README.md ARCHITECTURE.md
```

**Derivation entry D3 — `control`'s interface and its ordered checks (command).**

```
git grep -nE "control \[--repo|remote-run\.sh control|The checks, in order, before any session" -- docs cli/templates README.md ARCHITECTURE.md
```

**Derivation entry D4 — template header paragraphs (procedure).**
- **Artifact:** the leading `#` comment block of `cli/templates/github/workflows/harness-control.yml`, and in `cli/templates/scripts/remote-run.sh` the `control` paragraphs of the header (`` `control` IS THE COMMENT AND REVIEW ADAPTER ``, `MENTION.`, `THE BRANCH.`, `THE ARMS.`) and its `REPRO` block's `control` cases.
- **Traversal:** each paragraph that opens with an upper-case or backticked lead, in file order.
- **Decision rule:** a paragraph is reached when it states (a) which checks run before an agent session, (b) which steps a comment job runs and when, (c) the interface between the workflow and `remote-run.sh control`, or (d) `control`'s usage or exit map.

**Derivation entry D5 — adopter documents by section (procedure).**
- **Artifact:** `docs/github-run-control.md` and `docs/development.md` → Gate 12.
- **Traversal:**
  - in `github-run-control.md`: `## 1.` → *Mentions read by an agent*, paragraph by paragraph; `## 6.`'s bullets under **A credential and an agent in the control job.** and the numbered list under **Why hostile text stays inside the closed set.**; and `## 8.`'s table, row by row;
  - in `development.md`: (xiv) leg (j)'s opening paragraphs, steps 1 to 11 and its **What it settles**; (xiv) leg (f)'s first pass condition; and (xv) legs (d) and (d′) and its **What it settles**.
- **Decision rule:** a row, step or paragraph is reached when it states D4's (a) or (b), what a comment job installs or spends, the `--restricted` confinement, or a pass condition that reads the control job's step list or decision line.

**Derivation entry D6 — sites the task prompt names (procedure).**
- **Artifact:** the task prompt, `harness-runs/task_prompts/fix_forge_run_control_gate12_round10_findings_task_prompt.md`.
- **Traversal:** the issue table, the **Dropped after review** list, the **Re-observed fixed** paragraph, then each issue's **What**, **Why it matters** / **Effect** and **Suggested fix** lines.
- **Decision rule:** a named leg or step, a named row, a named step of a workflow, or a named script function is a site.

**Derivation entry D7 — conventions documents (procedure).**
- **First step, runnable:** `grep -nE "restricted|install|harness-control|remote-run" .claude/context/conventions.md .claude/context/cli.md .claude/context/plugin.md`
- **Artifact:** the three `layers[].conventions` documents.
- **Traversal:** each `##` section in file order.
- **Decision rule:** a sentence is reached when it states D4's (a) to (d) or the `--restricted` confinement. It reached none: the grep's hits concern the docs-retrieval carve-out's optional installs, the `Reporter`'s default sinks, the plugin-root token's dead spot in a shell body, the citation form for a path outside the plugin, the `forge` key's readers (`remote-run.sh trigger`) and the templates the compiler does not see.

**Derivation entry D8 — standing-artifact rows (procedure).**
- **First step, runnable:** `grep -nE "^## |^- " harness-runs/lessons.md`
- **Artifact:** that standing ledger.
- **Traversal:** its topic headings in file order, then the one-line rules under each.
- **Decision rule:** a rule is reached when it names a command an adopter runs, a measured figure in a document of record, a retry in an unattended path, or a person's input or command.

**Closure invariant:** every site that any entry above reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/scripts/remote-run.sh` header → the verb list's `remote-run.sh control [--repo <root>]   (its own exit map: its paragraph)` | — | D3, D4 (d) | `change` | Task 1 (`control [--needs-agent] [--repo <root>]`) |
| 2 | `remote-run.sh` → `usage()`'s `remote-run.sh control [--repo <root>]` echo, and the argument parser | — | D3, D4 (d) | `change` | Task 1 |
| 3 | `remote-run.sh` header → `` `control` IS THE COMMENT AND REVIEW ADAPTER `` → the ordered refusal list (1 to 4) | — | D4 (a)(d) | `change` | Task 1 (a `--needs-agent` sentence: the same gates 1 to 3, run alone, replying to nothing, with its own exit map) |
| 4 | `remote-run.sh` header → `MENTION.` → "The workflow's interface: `IN_OAUTH` / `IN_API` and `HARNESS_MENTION_PLUGIN_DIR`." | — | D4 (c) | `change` | Task 1 (adds `control --needs-agent`'s exit 2 as the workflow's interface too) |
| 5 | `remote-run.sh` header → `THE BRANCH.` and `THE ARMS.` | — | D4 (traversed; neither states (a) to (d)) | `no-change` | The branch and the arms are unchanged; `--needs-agent` stops before the branch |
| 6 | `remote-run.sh` header → `REPRO` → the `control` cases (`pause`, `ignored`, `mention`, `act`) | — | D3, D4 (d) | `change` | Task 1 adds `needs-agent` cases after them; the four existing cases are unchanged |
| 7 | `remote-run.sh` → the `MENTION.` paragraph's flag string (`--tools Read,Grep,Glob --restricted --strict-mcp-config …`) and `control_mention_session`'s argv | — | D2 | `no-change` | The session and its flags are unchanged. Task 4's step 11 reads its flag set from this function |
| 8 | `cli/templates/github/workflows/harness-control.yml` header → `WHAT IT DOES.` ("One job runs `remote-run.sh control`, which does everything else …"; "which `remote-run.sh control` launches and whose decision it validates") | — | D3, D4 (a)(b) | `change` | Task 2 (a comment job asks `control --needs-agent` first; every decision still lives in that script) |
| 9 | `harness-control.yml` header → `THE PLUGIN.` → "The three comment-only steps are `continue-on-error`, so a failed install never blocks an exact-form command …" | — | D1, D4 (b) | `change` | Task 2 (they run only when the agent check did not answer `no`, which an exact-form command now does) |
| 10 | `harness-control.yml` header → a new `THE AGENT CHECK.` paragraph | — | D4 (a)(b)(c) | `change` | Task 2 |
| 11 | `harness-control.yml` header → `DECLARED MIRRORS` → the `remote-run.sh (the scriptsDir copy)` row | — | D4 (c) | `change` | Task 2 (adds `control --needs-agent` and its exit 2) |
| 12 | `harness-control.yml` header → `A REFUSAL IS A SUCCESS.` | — | D3, D4 (d) | `no-change` | Still true of the act step, whose line is unchanged; the agent-check step's own mapping is stated in row 10's paragraph |
| 13 | `harness-control.yml` header → `THE PREFILTER.`, `THE PERMISSIONS.`, `FORK PULL REQUESTS.`, `THE CONCURRENCY GROUP …`, `THREE RULES EVERY EDIT KEEPS.`, `ACTION PINS.` | — | D4 (traversed; none states (a) to (d)) | `no-change` | The new step adds no permission, expression form, action or concurrency change, and passes no credential |
| 14 | `harness-control.yml` → the `Set up Node`, `Install the claude CLI when absent` and `Fetch the pinned plugin` steps | — | D1, D6 (issue 2 **What**) | `change` | Task 2 (each `if:` gains `&& steps.needs.outputs.agent != 'no'`; the run bodies are unchanged) |
| 15 | `cli/templates/github/workflows/harness-run.yml` → its `Set up Node` steps and `Install the claude CLI when absent` | — | D1 | `no-change` | The run job always needs the agent; `control`'s install keeps mirroring this body byte for byte |
| 16 | `docs/github-run-control.md` → `## 1.` → *Mentions read by an agent* → **The checks, in order, before any session.** | — | D3, D5 | `change` | Task 3 (checks 1 to 4 run first in a step of their own, before the install and the fetch, and again in the act step) |
| 17 | `docs/github-run-control.md` → *Mentions read by an agent* → the other paragraphs (**A mention is …**, **What reads it.**, **What the agent receives**, **The decision is one of a closed set** and its table) | — | D5 (traversed) | `no-change` | None states which steps a job runs, or what it installs |
| 18 | `docs/github-run-control.md` → `## 6.` → **What reads the mention.** ("The comment job's `Fetch the pinned plugin` step clones that release's tag …") | — | D1, D5 | `change` | Task 3 (the step runs only for a mention whose commenter passed checks 1 to 4) |
| 19 | `docs/github-run-control.md` → `## 6.` → **What one mention spends.** | — | D5 | `change` | Task 3 (a new sibling bullet, **What a comment that is not read spends.**) |
| 20 | `docs/github-run-control.md` → `## 6.` → **Which events reach it.**, **The merge-commit caveat.**, **The exposure that already held.** | — | D5 (traversed) | `no-change` | No credential reaches a new step; the check is still in code before any session |
| 21 | `docs/github-run-control.md` → `## 6.` → **Why hostile text stays inside the closed set.** → item 2 ("The session's `--tools` names `Read`, `Grep` and `Glob` only, under `--restricted`") | — | D2, D5 | `no-change` | It states the design. The §8 row (row 24) carries its unverified status |
| 22 | `docs/github-run-control.md` → `## 8.` → the rows *A `--plugin-dir` plugin's slash command runs as the `-p` prompt under `--restricted` …* and *The comment job's installed `claude` accepts the session's flags* | — | D2, D5 | `no-change` | Neither rests on step 11 or on the agent check |
| 23 | `docs/github-run-control.md` → `## 8.` → *The whole mention path on a real repository* ("All of *Mentions read by an agent*, and the `Fetch the pinned plugin` step") | — | D1, D5 | `no-change` | Still true: the fetch step is still on the mention path |
| 24 | `docs/github-run-control.md` → `## 8.` → *`--restricted` confines `Read`, `Grep` and `Glob` to the working directory and the one `--add-dir`* | — | D2, D5, D6 (issue 1 **Why it matters**) | `change` | Task 3 (Source: round 10's mention form not observed, the agent declining before any tool call; step 11 now drives `claude --restricted` directly) |
| 25 | `docs/github-run-control.md` → `## 8.` → a new row: a step's `$GITHUB_OUTPUT` value is read by a later step's `if:` as `steps.<id>.outputs.<name>`, and a failed `continue-on-error` step leaves it empty | — | D5 | `change` | Task 3 |
| 26 | `docs/github-run-control.md` → `## 8.` → every other row | — | D5 (traversed) | `no-change` | None states D4's (a) or (b) or the confinement |
| 27 | `docs/development.md` → Gate 12 → (xiv) leg (j) → "From each log, record the `claude --version` line; the `Fetch the pinned plugin` step's outcome …" | — | D1, D5 | `change` | Task 4 (step 10's exact-form job skips both, so its log carries neither) |
| 28 | `docs/development.md` → (xiv) leg (j) → step 10, the exact form | — | D5 | `change` | Task 4 (its job's install and fetch steps are `skipped`, and its agent-check line reads `no`) |
| 29 | `docs/development.md` → (xiv) leg (j) → step 11, a read outside the context directory | — | D2, D5, D6 (issue 1) | `change` | Task 4 (rewritten to drive `claude --restricted` directly, with an attempted, refused read required to pass) |
| 30 | `docs/development.md` → (xiv) leg (j) → steps 1 to 9 | — | D5 (traversed) | `no-change` | Each is a mention or a refusal after the branch, so its job still installs and fetches. Step 1's job is where the new §8 row (row 25) is seen to run the steps |
| 31 | `docs/development.md` → (xiv) leg (j) → **What it settles** ("and step 11 settles *`--restricted` confines …*") | — | D2, D5 | `change` | Task 4 (step 11's new form settles it; steps 1 and 10 together settle row 25's new row) |
| 32 | `docs/development.md` → (xiv) leg (f) → `@sdlc-harness approve`'s pass condition ("Passes when the reply lists the six commands …") | — | D5, D6 (**Dropped after review**, first item) | `no-change` | Excluded by the task prompt: "Only (f)'s spec text is outdated, and the leg passes either way", under "Dropped after review, as not worth a fix-and-test round" |
| 33 | `docs/development.md` → (xv) leg (d), a comment command ("Passes when the reply names `HARNESS_RUN_ACTORS`.") | — | D5 | `change` | Task 4 (its job's install and fetch steps are `skipped`) |
| 34 | `docs/development.md` → (xv) leg (d′), a mention ("… which must refuse it before any agent session starts …"; its pass condition) | — | D1, D5, D6 (issue 2 **What**) | `change` | Task 4 (adds the agent-check line naming `HARNESS_RUN_ACTORS`, and the three comment-only steps `skipped`) |
| 35 | `docs/development.md` → (xv) → **What it settles** | — | D5 (traversed) | `no-change` | It settles rows of `docs/remote-execution.md` and `docs/team-accounts-research.md` that this branch does not touch. Row 25's row is settled by (xiv)(j) (row 31) |
| 36 | `docs/development.md` → Gate 12 → **Teardown.** ("Where (xiv) ran, close the round's pull request first, before any branch is deleted") | — | D6 (**Dropped after review**, fourth item) | `no-change` | Already orders the close before the reset, as the prompt says round 10 did |
| 37 | `docs/remote-execution.md` → `## 6.` → the row *A `schedule` workflow whose record GitHub reused …* | — | D6 (**Dropped after review**, second item) | `no-change` | Excluded by the task prompt: "There is no harness fix to make" |
| 38 | `docs/remote-execution.md` → **The `workflow_dispatch` inputs are the seam …**, the `HARNESS_TRIGGER_ALLOWED_BOTS` variable row, and **Pull requests from forks.** | — | D3 | `no-change` | Each names `remote-run.sh control` as the control job's script, which it still is |
| 39 | `ARCHITECTURE.md` → the `## 7.` sweep invariant paragraph ("`remote-run.sh control` launches one read-only, one-shot mention session …") and the `control_mention_session` row | — | D2, D3 | `no-change` | The session it launches and its flag string are unchanged |
| 40 | `plugin/commands/harness-read-mention.md` → **Read-only, by the session.**; `plugin/instructions/mention_reading.md`'s opening paragraph | — | D2 | `no-change` | The decline is the instruction working as designed (the prompt: "the agent declines to try the read, so the step is 'not observed' by design"). Step 11 now sidesteps the instruction rather than changing it |
| 41 | `.claude/context/conventions.md`, `.claude/context/cli.md` and `.claude/context/plugin.md` | — | D7 (no sentence reached) | `no-change` | None states which checks precede a session, which steps a comment job runs, or the `--restricted` confinement |
| 42 | `harness-runs/lessons.md` → *Adopter-facing documentation* → "Every command an adopter is meant to run sits in a fenced block, one command per line …" | — | D8 (a command an adopter runs) | `no-change` | Obeyed: Task 4's step 11 gives each command (the throwaway files, the `cd`, `claude --version`, the `claude -p` drive) in its own fenced block |
| 43 | `harness-runs/lessons.md` → *Evidence and measurement* → "A wall-clock figure in a document of record is never one a run measured inside its own session …" | — | D8 (a measured figure) | `no-change` | Obeyed: Tasks 3 and 4 say "an install and a clone" and write no seconds figure |
| 44 | `harness-runs/lessons.md` → *Unattended control loops* → "Every automatic retry in an unattended path is bounded …" | — | D8 (a retry) | `no-change` | Not engaged: the agent check adds no retry. A failed check falls back to installing once |
| 45 | `harness-runs/lessons.md` → *Remote and branch-scoped operations* → "Never refuse a person's input because a run is in flight …", "A collector fired by one event gathers …", "Let an input's type or state decide only whether it triggers an action …" | — | D8 (a person's input) | `no-change` | Not engaged: the agent check changes which steps run, not whether a comment is accepted, kept or answered. The act step's reply to each comment is unchanged |
| 46 | `harness-runs/lessons.md` → *Evidence and measurement* → "A figure measured under a test stub or a fixture-sized corpus never justifies a design decision …" and "A feature that ships as "not yet measured" ships the seam that will measure it …" | — | D8 (a measured figure) | `no-change` | Not engaged: no design decision here cites a figure. The one unmeasured behaviour Task 3 adds (row 25) fails open to today's install, and Gate 12 (xiv)(j), which Task 4 names, is the seam that observes it |
| 47 | `cli/templates/github/workflows/harness-control.yml` → the step `Act on the comment, review, close or deletion` | — | D4 (b), D6 (issue 2 **What**: "`Act on the comment …: success`"; "The actor check lives in `remote-run.sh control`, the last step") | `no-change` | Its run line `bash "$SCRIPTS_DIR/remote-run.sh" control \|\| [ $? -eq 2 ]` and its credential `env:` (`IN_OAUTH`, `IN_API`) stay byte-identical. It still runs after the agent check, re-checks every gate and replies as it does today, so it stays the authority (Task 2 leaves it unchanged) |
| 48 | `cli/templates/github/workflows/harness-run.yml` → the `collect` job (`remote-run.sh collect`, `verb_collect`) | — | D6 (**Dropped after review**, third item: "round 1's `collect` placed it anyway") | `no-change` | Excluded by the task prompt: "This is GitHub behaviour", under "Dropped after review, as not worth a fix-and-test round" |
| 49 | `harness-control.yml` → the close job: the act step's path for a `pull_request` or `issues` `closed` event | — | D6 (**Dropped after review**, fourth item: "their close jobs failed") | `no-change` | Excluded by the task prompt: "an edge case with no clear fix", under "Dropped after review, as not worth a fix-and-test round". Task 2's new step runs on `issue_comment` alone, so a close job's steps are unchanged |
| 50 | `cli/templates/github/workflows/harness-resume.yml` → its `schedule` trigger | — | D6 (**Dropped after review**, second item) | `no-change` | Excluded by the task prompt: "There is no harness fix to make" |
| 51 | `cli/templates/scripts/push-branch.sh` → the refusal "… no longer has $branch … not pushing it back", and the `stopped` path for a pull request closed by a branch deletion (round 9 issues 1 and 3) | — | D6 (**Re-observed fixed**) | `no-change` | The task prompt re-observed both as fixed on 0.6.4. Round 9 issue 2 was "not exercised", so it names no site to change |
