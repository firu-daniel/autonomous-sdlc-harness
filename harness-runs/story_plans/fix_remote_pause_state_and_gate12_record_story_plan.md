# Story: Keep a remote run's planning drafts across a job boundary, move the workflows off Node 20, and record Gate 12 round 2

## Context

Round 2 of Gate 12 ran a full delivery on a GitHub-hosted runner with CLI 0.4.1. It exposed two defects and left results the documents still list as unverified. This branch fixes both defects and records the round.

**Finding 1: a pause in a remote job loses the planning drafts.** A remote job's planning drafts are untracked until P1/P3 convergence commits them. They are the story index, the per-task directory, the UI-test plan, and the four plan-review findings folders that `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 4 — commit the task plan after it converges` stages. The state bundle (`cli/templates/scripts/lib/harness-run-lib.sh` → `THE REMOTE STATE BUNDLE`) does not carry them. The next job starts in a fresh checkout, so the saved walk is unusable under `plugin/instructions/task_plan_writing_instructions_core.md` → **Continuing a saved walk.**, and Override 2(c) re-runs the writer from scratch.

**Decision: direction (a).** The bundle carries those untracked planning paths, and a job-mode restore puts them back. This is the remote equivalent of a worktree that keeps them on disk.

- **Why not (b).** Direction (b) commits the drafts before yielding. That puts unconverged plans into branch history. It also splits P1's single meaning ("converged" and "committed"), so the ledger, the walker's unusable-walk check and Overrides 2, 4 and 5 in the plugin would all have to tell the two apart. That is a cross-half contract change to fix a defect that exists only remotely. It buys no privacy either: a pushed draft is as readable as an artifact.
- **What (a) costs, stated rather than hidden.** The drafts become readable by anyone who can read the repository's Actions runs, as the clarification exchange and the run log already are. They expire with the repository's artifact retention. An expired bundle loses them, the loss is reported plainly as an expiry, and the writer runs again from the committed ledger.
- **Why no other branch sees them.** A bundle is restored per branch (`remote-run.sh` → `previous_bundle_run`).

**Which paths the bundle carries, and why only these.** Only the planning family is carried, because only planning has a saved walk. The walker's one graph is `cli/templates/scripts/flows/task_plan_writing.graph.json`. Implementation-phase per-unit review folders are not carried: the pause protocol waits for a clean tracked tree, so no unit's review loop spans a pause. A review index written before its own commit is not carried either; a pause there costs a regenerated review, not a broken resume.

**How a restore treats a path the checkout already has.** A restore places a carried file only where the fresh checkout has none. A file the branch already carries wins: that is the committed record, which is the source of truth across a session boundary. Only a job-mode restore places drafts. A mirror restore never does, because an untracked draft in the local mirror would block the later fast-forward to `origin/<branch>` that `/autonomous-sdlc-harness:branch-user-review` performs.

**The bundle schema stays `1`.** The new `planning/` directory is additive. An older reader ignores it, and a newer reader of an older bundle finds none and restores no drafts, which is today's behaviour.

**Finding 2: the actions run on Node 20.** The two workflow templates pin actions whose own runtime is Node 20. Task 3 moves each to the lowest major whose own `action.yml` declares `runs.using: node24`. It keeps major-tag pins rather than `.github/workflows/publish-main.yml`'s full-sha style, and argues that choice in each template's header. The version facts come from a record a maintainer takes by hand (see `Manual setup required:` below). The unattended run's permission profile grants no GitHub API call, and this plan does not route around that.

**Finding 3: the documents still list round 2's results as unverified.** `docs/remote-execution.md` → `## 6. What is not verified here` and Gate 12 in `docs/development.md` get round 2's results. They record only what round 2 measured, and they state plainly what it did not reach. Gate 12 gains an observation for a remote park answered and resumed.

**Task order.** The cut is six single-layer tasks, bottom-up in the configured layer order: `cli` (Tasks 1–3), then `plugin` (Task 4), then the catch-all `general` (Tasks 5–6) last, because those two document what the others built.

**Top risks:**
- **The restore.** The likeliest breakage is a restore that is too eager. Overwriting a committed plan would undo the ledger's authority. Placing drafts into the mirror would make the next fast-forward refuse. Task 1's never-overwrite, job-mode-only rule guards both, and Task 2's end-to-end case proves the walk continues in a second checkout while a tracked file stays byte-identical.
- **Over-recording round 2.** Round 2 verified `retention-days` capping on `upload-artifact@v4` only, while Task 3 moves the pin to a later major. The enable, the in-progress artifact and the push-starts-no-workflow half were never observed. Tasks 5 and 6 each state that boundary instead of moving a row wholesale.
- **Citing Cloud QA by number.** Writing the remote QA follow-up as "roadmap point 31" would trip `docs/development.md` → `## 6. The roadmap this tree defers to`, whose legend has no such row. Tasks 5 and 6 cite `ROADMAP.md`'s *Cloud QA* row by name.
- **Silent action upgrades, or versions from memory.** A bumped action can change an input's meaning. `setup-node`'s automatic package-manager caching is the known case. Task 3 reads each new major's `.0.0` release notes from the maintainer's record, and checks every input the templates pass. It takes no version fact from memory, and it returns a blocker when the record is missing.

**Manual setup required:**
- **Record the action runtimes before the implementation loop reaches Task 3.** On a machine where `gh auth status` succeeds, run these read-only lookups by hand for each of `actions/checkout`, `actions/setup-node`, `actions/cache` and `actions/upload-artifact`. Substitute `<repo>` with the action's repository name, and `<N>` with each major from `5` up to the newest release's major.
  1. The newest non-prerelease release:
     ```
     gh release list --repo actions/<repo> --exclude-pre-releases --limit 1
     ```
  2. `action.yml` at `v4` and at each later major:
     ```
     gh api -H "Accept: application/vnd.github.raw" "repos/actions/<repo>/contents/action.yml?ref=v<N>"
     ```
     For `actions/cache`, also read `restore/action.yml` at each ref, because the templates pin `actions/cache/restore` too:
     ```
     gh api -H "Accept: application/vnd.github.raw" "repos/actions/cache/contents/restore/action.yml?ref=v<N>"
     ```
  3. Each later major's opening release notes:
     ```
     gh release view v<N>.0.0 --repo actions/<repo>
     ```
  Save their verbatim output, each block headed by the command that produced it, together with the date the lookups were run. Write it to `harness-runs/task_prompts/fix_remote_pause_state_and_gate12_record_action_runtimes.md` and commit it on this branch. That makes it present in every checkout the run uses, a remote job's included. Task 3 depends on this record. Without it, Task 3 returns a blocker naming the missing file and changes nothing.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top-to-bottom, and the committing role flips each one to `[x]` as that task's commit lands. **Only the committing role flips a marker.** That role is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside the per-task files, are informational progress markers for the implementer only. They are never the iteration source, and the committer does not touch them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_remote_pause_state_and_gate12_record/task_<K>_plan.md`. The order is bottom-up in the configured layer order: `cli`, `plugin`, then the catch-all `general` last.

1. [x] **Task 1** — Carry the untracked planning drafts in the remote state bundle and restore them in job mode without overwriting _(layer: cli)_ _(points: 15)_
2. [x] **Task 2** — Report planning drafts in `remote-run.sh` restore and prove a pause-then-restore across two job checkouts continues the saved walk _(layer: cli)_ _(points: 15)_
3. [x] **Task 3** — Move both workflow templates to action majors that run on Node 24 and make their headers true _(layer: cli)_ _(points: 15)_
4. [x] **Task 4** — Name the lost planning drafts in `branch-resume`'s expired-bundle report _(layer: plugin)_ _(points: 5)_
5. [ ] **Task 5** — State the planning-draft design and record round 2 in `docs/remote-execution.md` _(layer: general)_ _(points: 20)_
6. [ ] **Task 6** — Record Gate 12 rounds 1 and 2 and add the remote park-and-answer observation in `docs/development.md` _(layer: general)_ _(points: 15)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt (three sentences, one per site class):

- *"Whichever is chosen: which untracked paths are carried (planning, and any other phase that writes untracked artifacts a saved walk depends on), how a restore treats a path the fresh checkout already has, and the bundle format's own fence in `harness-run-lib.sh` all change together, and `docs/remote-execution.md` states the result."*
- *"Both workflow templates pin actions that target Node 24, and their headers stay true."*
- *"`docs/remote-execution.md` → `## 6.` and Gate 12 record round 2's results as above: nothing still listed as unverified that round 2 measured, and nothing listed as verified that it did not."*

**Derivation entry D1 — claims of an unverified GitHub behaviour (command).** Re-run verbatim from the repository root:
`git grep -n -E "Gate 12 records|UNVERIFIED|is unverified|was not confirmed|not verified here|could not be re-checked|could not be checked" -- docs cli/templates plugin README.md ROADMAP.md ARCHITECTURE.md`

**Derivation entry D2 — statements of what the state bundle carries or loses (command).**
`git grep -n -E "clarification directory|the walker state|clarification history|carried counts|only remote copy" -- docs plugin cli/templates cli/src README.md ARCHITECTURE.md ROADMAP.md`

**Derivation entry D3 — action pins (command).**
`git grep -n -E "actions/(checkout|setup-node|cache|upload-artifact)(/restore)?@" -- . ':!harness-runs' ':!examples' ':!node_modules'`

**Derivation entry D4 — Gate 12's round and observation-count statements (command).**
`git grep -n -E "Ten observations|re-run on 0\.4\.1|none has been observed on a runner|No job has yet been observed" -- docs cli plugin README.md`

**Derivation entry D5 — statements about untracked planning drafts across a pause (command).**
`git grep -n -i -E "untracked (story|planning|in-progress)|in-progress story index|untracked until" -- docs plugin cli/templates`

**Derivation entry D6 — lessons-ledger rows (procedure).** **First step, runnable:** `grep -n -E "^## |^- " harness-runs/lessons.md`. **Artifact:** the standing ledger `harness-runs/lessons.md`. **Traversal:** its topic headings in file order, then the one-line rules under each. **Decision rule:** a rule is reached when it names the state bundle, a store that expires, the resume poller's on/off switch, or a new execution environment.

**Closure invariant:** every site each derivation entry reaches appears as a row below. Rows marked *owning-task target* are further sites a task changes that no entry reaches; they are listed so the table covers every durable-corpus target of this plan.

| # | Site (path + symbol or quoted anchor, or standing-artifact row id) | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/claude/settings.autonomous.qa.json` ("carries every absolute entry outside the checkout forward UNVERIFIED") | — | D1, `UNVERIFIED` | `no-change` | About `init --force` carrying profile entries, not a GitHub behaviour round 2 touched |
| 2 | `cli/templates/github/workflows/harness-resume.yml` header ("UNVERIFIED: whether GITHUB_TOKEN with `actions: write` may enable and disable") | — | D1, `UNVERIFIED` | `change` | Task 3 — disable verified in round 2, enable not observed |
| 3 | `cli/templates/github/workflows/harness-run.yml` header `WHY THE TIMEOUT IS COMPUTED INTO GITHUB_ENV` ("could not be checked against") | — | D1, `could not be checked` | `change` | Task 3 |
| 4 | `cli/templates/github/workflows/harness-run.yml` header, same paragraph ("`env` value. Gate 12 records the real behaviour.") | — | D1, `Gate 12 records` | `change` | Task 3 |
| 5 | `cli/templates/github/workflows/harness-run.yml` header `WHY retention-days IS SET` ("could not be re-checked against its v4 README") | — | D1, `could not be re-checked` | `change` | Task 3 |
| 6 | `cli/templates/github/workflows/harness-run.yml` header, same paragraph ("(no network access); Gate 12 records the real behaviour.") | — | D1, `Gate 12 records` | `change` | Task 3 |
| 7 | `cli/templates/scripts/remote-run.sh` header, `continue` block ("(the job token's enable permission is unverified)") | — | D1, `is unverified` | `no-change` | Round 2 did not observe the enable; the sentence stays true |
| 8 | `docs/development.md` → **Gate 12 — remote execution against a real GitHub repository.** ("Ten observations, after a setup that is itself the first.") | — | D1, `not verified here`; D4, `Ten observations` | `change` | Task 6 — eleven observations |
| 9 | `docs/development.md` → Gate 12 → **Where the results go.** | — | D1, `not verified here` | `no-change` | The procedure stands; Task 6 follows it |
| 10 | `docs/outer-loop-verification.md` → **A real GitHub Actions run.** | — | D1, `not verified here` | `no-change` | States what the stub-driven suite exercises, which a hand-run does not change, and already points at Gate 12 |
| 11 | `docs/remote-execution.md` → `### Resuming without the local watcher` → **The enable is unverified.** | — | D1, `is unverified` / `was not confirmed` | `change` | Task 5 — disable verified, enable not observed |
| 12 | `docs/remote-execution.md` → `## 6. What is not verified here` (heading kept byte-identical; intro and table) | — | D1, `not verified here` | `change` | Task 5 |
| 13 | `docs/remote-execution.md` §6 row "A step's `timeout-minutes` accepts an expression" | — | D1, `Gate 12 records` | `change` | Task 5 — verified |
| 14 | `docs/remote-execution.md` → `## 10. What it costs` table row "Billing unit" ("the research's reading, not verified here") | — | D1, `not verified here` | `no-change` | Round 2 measured a skipped job's zero, not the per-job billing unit |
| 15 | `cli/templates/scripts/autonomous-watcher.sh` header ("clarification directory. And it carries the last two passes") | — | D2, `clarification directory` | `no-change` | Names where `PARK_LOOP_CLEAR` goes, not bundle content |
| 16 | `cli/templates/scripts/lib/harness-run-lib.sh` → `THE REMOTE STATE BUNDLE` → `WHO READS EACH FILE` ("The clarification directory and `PAUSE_PROGRESS.md`:") | — | D2, `clarification directory` | `change` | Task 1 |
| 17 | `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_bundle_restore` doc ("<mode> `job` places the clarification directory") | — | D2, `clarification directory` | `change` | Task 1 |
| 18 | `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_bundle_restore` doc ("A bundle carrying no clarification directory") | — | D2, `clarification directory` | `no-change` | Still true; the planning rule is a separate paragraph |
| 19 | `cli/templates/scripts/remote-run.sh` header, `restore` paragraph ("the lost counts and clarification history") | — | D2, `clarification history` | `change` | Task 2 |
| 20 | `cli/templates/scripts/remote-run.sh` header, `restore` paragraph ("branch keeps its clarification history") | — | D2, `clarification history` | `no-change` | Still true |
| 21 | `cli/templates/scripts/remote-run.sh` → `verb_restore` (`::warning::remote-run.sh: the state bundle of run $id expired`) | — | D2, `clarification history` | `change` | Task 2 — names the lost drafts |
| 22 | `docs/remote-execution.md` → `## 1.` command table, `/autonomous-sdlc-harness:branch-resume` row ("its carried counts and clarification history are lost") | — | D2, `clarification history` | `change` | Task 5 |
| 23 | `docs/remote-execution.md` → `## 4.` → **Central state.** | — | D2, `the walker state` | `change` | Task 5 |
| 24 | `docs/remote-execution.md` → `## 4.` → **The bundle expires.** | — | D2, `clarification history` | `change` | Task 5 |
| 25 | `plugin/commands/branch-resume.md` → step 3, expired remote record ("stall counts and its clarification history are lost") | — | D2, `clarification history` | `change` | Task 4 |
| 26 | `.github/workflows/publish-main.yml` (`actions/checkout@fbc6f39… # v5.1.0`) | — | D3 | `no-change` | This repository's own workflow, already on a Node 24 major and sha-pinned for its own stated reason |
| 27 | `cli/templates/github/workflows/harness-resume.yml` → step `Check out the default branch` (`actions/checkout@v4`) | — | D3 | `change` | Task 3 |
| 28 | `cli/templates/github/workflows/harness-resume.yml` → step `Upload the poller state` (`actions/upload-artifact@v4`) | — | D3 | `change` | Task 3 |
| 29 | `cli/templates/github/workflows/harness-run.yml` → `run` job step `Check out the run's branch` (`actions/checkout@v4`) | — | D3 | `change` | Task 3 |
| 30 | `cli/templates/github/workflows/harness-run.yml` → `run` job step `Set up Node` (`actions/setup-node@v4`) | — | D3 | `change` | Task 3 |
| 31 | `cli/templates/github/workflows/harness-run.yml` → step `Restore the docs-retrieval cache` (`actions/cache/restore@v4`) | — | D3 | `change` | Task 3 |
| 32 | `cli/templates/github/workflows/harness-run.yml` → step `Upload the state bundle` (`actions/upload-artifact@v4`) | — | D3 | `change` | Task 3 |
| 33 | `cli/templates/github/workflows/harness-run.yml` → `warm` job step `Check out the dispatched ref` (`actions/checkout@v4`) | — | D3 | `change` | Task 3 |
| 34 | `cli/templates/github/workflows/harness-run.yml` → `warm` job step `Set up Node` (`actions/setup-node@v4`) | — | D3 | `change` | Task 3 |
| 35 | `cli/templates/github/workflows/harness-run.yml` → step `Restore and save the docs-retrieval cache` (`actions/cache@v4`) | — | D3 | `change` | Task 3 |
| 36 | `docs/remote-execution.md` §6 row "An `actions/upload-artifact@v4` artifact is listed" | — | D3 | `change` | Task 5 — not observed; names the bumped major |
| 37 | `docs/remote-execution.md` §6 row "`actions/upload-artifact@v4` caps a `retention-days`" | — | D3 | `change` | Task 5 — verified on v4 only |
| 38 | `docs/development.md` → Gate 12 → **Round 1** paragraph close ("The fixes ship in 0.4.1; none has been observed on a runner.") | — | D4 | `change` | Task 6 |
| 39 | `docs/remote-execution.md` → `## 4.` → **What a profile with no plugin-root grant cost — measured.** ("No job has yet been observed reading the plugin root under the grant above.") | — | D4 | `change` | Task 5 |
| 40 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 5` → **Honoring a PAUSE during planning.** | — | D5, `untracked until` | `no-change` | Its tolerance of untracked drafts and "saved walk continues" stay true; after Task 1 they also hold in a fresh job checkout |
| 41 | `harness-runs/lessons.md` → `## Unattended control loops` → "State held only in an expiring store must be reported plainly as expired…" | — | D6, names an expiring store | `no-change` | Applied, not changed: Tasks 2, 4 and 5 report the lost drafts as an expiry |
| 42 | `harness-runs/lessons.md` → `## Unattended control loops` → "A process that turns off a shared switch…" | — | D6, names the poller's switch | `no-change` | No poller behaviour changes here |
| 43 | `harness-runs/lessons.md` → `## Unattended control loops` → "A new execution environment must state…" | — | D6, names an execution environment | `no-change` | No new environment is added |
| 44 | `cli/templates/scripts/lib/harness-run-lib.sh` header → `THE WRITE EXCEPTIONS TO "WRITES NOTHING", AND THEIR FENCES` item 3 | — | owning-task target | `change` | Task 1 |
| 45 | `cli/templates/scripts/lib/harness-run-lib.sh` → `THE REMOTE STATE BUNDLE` → `THE FORMAT OF RECORD` | — | owning-task target | `change` | Task 1 |
| 46 | `docs/remote-execution.md` → `## 3.` → `### Runs longer than a job` | — | owning-task target | `change` | Task 5 — the decision of record for finding 1 |
| 47 | `docs/remote-execution.md` → `## 3.` → `### The kill switch and stopping` | — | owning-task target | `change` | Task 5 — round 2's pause and stop measurements |
| 48 | `docs/remote-execution.md` → `## 4.` → **The walker state.** | — | owning-task target | `change` | Task 5 |
| 49 | `docs/remote-execution.md` → `## 11. Security` → **What a reader of the repository's Actions runs can see.** | — | owning-task target | `change` | Task 5 |
| 50 | `docs/development.md` → Gate 12, new **Round 2** paragraph and new observation **(xi)** | — | owning-task target | `change` | Task 6 |
| 51 | `docs/remote-execution.md` → `## 7. Turning it on` → step 3's re-render paragraph for an earlier adopter | — | owning-task target | `change` | Task 5 — existing workflow copies keep their Node 20 pins until re-rendered |
| 52 | `cli/templates/github/workflows/harness-run.yml` header `WHY retention-days IS SET`, opening sentence ("The `harness-state` bundle is the only remote copy of a run's clarifications and carried counts; … loses those counts.") | — | D2, `only remote copy` / `carried counts` | `change` | Task 3 — names the uncommitted planning drafts beside the clarifications and counts; Task 3 already edits this paragraph |
| 53 | `cli/templates/scripts/autonomous-watcher.sh` → registry-field comment for `pause_reason`, value `expired` ("the job can no longer take an answer, and the carried counts are lost") | — | D2, `carried counts` | `change` | Task 2 — names the uncommitted planning drafts beside the carried counts, in the `::warning::` line's words |
| 54 | `cli/src/doctor/checks.ts` → `REMOTE_GITHUB_CHECK` doc comment, **Why 30 days.** ("the `harness-state` bundle is the only remote copy of either; … loses its carried counts") | — | D2, `only remote copy` / `carried counts` | `no-change` | An application source comment, outside the durable corpus. It argues the 30-day warning threshold for a parked or usage-paused run's question, which no task changes |
