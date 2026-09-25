# Autonomous pause/resume + flow-progress ledger (canonical, single source of truth)

This file is the **one** definition of two coupled, **autonomous-fork-only** mechanisms. The engine forks
(planner, orchestrator, user-review-fix-plan, user-review-fixes) reference this file at the points named
below and do **not** restate its body; the watcher (`<scripts_dir>/autonomous-watcher.sh`) implements
the file lifecycle + registry status and back-references this file.

1. **Flow-progress ledger** — a committed, phase-level checklist that makes the whole autonomous flow
   deterministically resumable (turns "where do I resume" from a judgment into a computed fact).
2. **Pause/resume protocol** — a clean-boundary suspend/resume built on the ledger, the lighter sibling of
   the clarification park/resume.

Both are **autonomous only**. The supervised / semi-autonomous flows have a live human who interrupts and
re-runs, and are **unchanged** — do not propagate any of this into the shared semi-auto files (same
discipline as Overrides D/E/F).

---

## Resolved values

The `<…>` names in this file that resolve from **outside** it — from the runtime, or from the adopting
repository's `harness.config.json` — are declared here once. After this table the body uses each one as an
ordinary path placeholder, exactly as it uses `<branch>`, `<entry-id>` and `<n>`.

| Token | Class | How to resolve it |
|---|---|---|
| `<repo_root>` | derived at runtime | The absolute root of the checkout this run is executing in — in an autonomous run, the run's **own worktree**, not the main checkout. Obtain it with a **bare** `git rev-parse --show-toplevel` and build every literal path from the result. Never embed the `$(…)` substitution inside another shell command, and never stash it in a shell variable across separate Bash calls — separate calls do not share shell state. |
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to, the ledger and the four pause sentinels included. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<scripts_dir>` | config value | `scriptsDir` — the directory the project-command wrapper scripts live in. The three outer-loop scripts this file names (`autonomous-watcher.sh`, `commit-on-branch.sh`, `push-branch.sh`) are written into it by setup as well — copied verbatim rather than rendered from a detected command line, since each reads the configuration at run time — so every `<scripts_dir>/…` invocation below resolves in a wired repository. The two guard hooks it names (`allow-safe-compounds.sh`, `git-commit-branch-guard.sh`) ship as plugin hooks and are **not** under it either: they are named bare and take no prefix. |
| `<default_branch>` | config value | `defaultBranch` — the branch work starts from and merges back into. Never a remembered branch name. Bound for completeness — no step in this file consumes it. |
| `<protected_branches>` | config value | `protectedBranches` — the branches the commit wrapper and the `git-commit-branch-guard.sh` hook refuse to commit or push to, and the set the guard quotes back in its refusal message (§1.6). The effective set is these together with `<default_branch>`. |
| `<worktree_glob>` | derived at runtime | The **parent directory of `<repo_root>`** (the work root) joined to the configured `projectName` stem and a `-*` suffix — the sibling-worktree pattern an autonomous run's per-branch worktrees match, and the pattern the generated permission profile is materialized with. It is **absolute**, so a permission rule written over it takes one leading slash of its own — `Write(/<worktree_glob>/**)`, two slashes in the rendered rule, never three; §2.2 sub-step (a) states that rule where it is used. |

---

## 1. Flow-progress ledger

### 1.1 File
`<state_dir>/flow_progress/<branch>_progress.md`, in the run's own worktree. **Committed & pushed** — it is the
authoritative durable resume state, so it must survive a worktree recreate (the user-review path can
recreate a worktree) and reach origin like every other autonomous commit.

### 1.2 Two levels — do not conflate
- **Phase-level ledger** (this file): flow-structural and *fixed* per engine, independent of the branch's
  work. Authoritative for **which phase** the run is in.
- **Item-level detail indices** (already exist, unchanged owners): the story index's `## Phase 2 Readiness`
  task list, each review's findings index, the UI-test index. Authoritative for **which item within a phase**.

A phase entry flips `[x]` **only after** its phase reached one of the **recorded outcomes** the entry names:
its underlying detail checklist fully `[x]` **and** its artifact committed where the phase produces one, or
the clean-pass outcome where it correctly produces none — never merely "the phase ended". Every flip that
carries an artifact therefore lands *after* the commit that made it durable, so the ledger is always honest
against a crash or pause.

### 1.3 Templates (fixed — the driving fork lays this down verbatim, substituting `<branch>`)

**Task engine** (`/autonomous-sdlc-harness:branch-start-plan-autonomous`):
```markdown
# Flow progress — <branch>   (engine: task)

## Run mode
Source: <state_dir>/task_prompts/<branch>_task_prompt.md → `### Run mode`
- skipped: <directive ids, comma-separated, or `none`>
- ignored: <verbatim directive> (<reason>) — one line per ignored directive; omit the line entirely when there are none
- phases: parity=<true|false>, qa=<true|false>, docs=<true|false>   (from harness.config.json, read at this write; an unset flag is false)

## Planning
- [ ] P1. Task plan converged (business_parity + architecture + task-plan-reviewer all PASS)
- [ ] P2. UI-test plan converged (ui-tests-plan-reviewer PASS) — or no_ui
- [ ] P3. Plans committed & pushed (story index + per-task dir + UI-test plan)

## Implementation
- [ ] A.      Tasks implemented (story-index readiness all [x])
- [ ] A1.5g.  Branch parity review resolved (index committed — or PASS with no findings, no file written)
- [ ] A1.5f.  Parity findings fixed (findings index all [x] — or no index, the review having passed clean)
- [ ] A2g.    Branch architecture review resolved (index committed — or PASS with no findings, no file written)
- [ ] A2f.    Architecture findings fixed (findings index all [x] — or no index, the review having passed clean)
- [ ] Bg.     Branch review generated & committed
- [ ] Bm.     Review-plan meta-review PASS (B.2)
- [ ] C.      Code-review findings fixed
- [ ] C2g.    Skeptic review resolved (index committed — or PASS with no net-new findings, no file written)
- [ ] C2m.    Skeptic meta-review PASS — or not owed (C2.1 returned PASS, so C2.2 never ran)
- [ ] C2f.    Skeptic findings fixed (findings index all [x] — or no index, the review having passed clean)
- [ ] E.      QA passed (UI-test index all [x] / no_ui)
- [ ] D.      Branch statistics committed & pushed
```

**User-review engine** (`/autonomous-sdlc-harness:branch-start-user-review-fix-autonomous`), re-seeded per round `<n>`:
```markdown
# Flow progress — <branch>   (engine: user_review, round <n>)

## Run mode
Source: <state_dir>/task_prompts/<branch>_task_prompt.md → `### Run mode`
- skipped: <directive ids, comma-separated, or `none`>
- ignored: <verbatim directive> (<reason>) — one line per ignored directive; omit the line entirely when there are none
- phases: parity=<true|false>, qa=<true|false>, docs=<true|false>   (from harness.config.json, read at this write; an unset flag is false)

## Fix planning
- [ ] R1. Fix plan written & converged (parity + architecture gates PASS)
- [ ] R2. Fix plan + source review committed
## Fixing
- [ ] R3. All fix-plan findings implemented (fix-plan index all [x])
- [ ] R4. QA passed (UI-test index all [x] / no_ui / no-op augment)
- [ ] R5. Post-user-review statistics committed
```

**The three markers.** Every phase entry carries exactly one of:
- `[ ]` — **not yet done.** The first one is the resume point (§1.7).
- `[x]` — **done**, on §1.2's terms: its phase reached a recorded outcome the entry names — detail checklist
  fully `[x]` **and** artifact committed, or, where the phase correctly writes no file, the clean-pass outcome.
  Where an entry names more than one admissible outcome — a `*g` entry's committed index **or** its clean pass
  with no file, say — its `[x]` asserts that one of them was reached, **not which**: *which* is answerable from
  the branch, the artifact being there or not, whereas *whether the phase ran at all* is answerable only here,
  and that is the distinction this marker set exists to carry.
- `[-]` — **skipped before the run began.** The phase never ran, no artifact exists, and none is owed. Two
  provenances put an entry here and there is no third: an **authored run-mode directive** naming the phase,
  and a **`phases.*` flag that is `false`** in `harness.config.json`. Both are knowable at ledger-creation
  time, because the ledger is created after the configuration has been read. Both are also **recorded** at
  that moment — the run mode on the block's `skipped:` line, the configuration on its `phases:` line — so a
  later reader, and the Done summary's arms, read a `[-]`'s provenance off the ledger rather than re-deriving
  it from a file that may have changed since.

`[-]` is admissible on **exactly** the entries a run mode **or a `phases.*` flag** can switch off — `A1.5g`,
`A1.5f`, `A2g`, `A2f`, `P2` and `E` in the task-engine template, and `R4` in the user-review-engine template
— and on **no other entry**, because every other entry either names a step inside the **safety floor**, which
**neither switch** can turn off (`Bg`/`Bm` the branch review and its meta-review, `C`/`C2g`/`C2m`/`C2f` the
fixes and skeptic phases, `R2`/`R3` the fix-plan commit and its fix loop, `D`/`R5` the statistics
bookkeeping), or names something **neither switch** reaches: `P3` and `A` name steps no directive addresses
and no flag gates, and `P1` and `R1` are the **gate-bearing** entries — each contains the two plan gates the
`parity` / `architecture` ids and the `phases.parity` flag *do* switch off, yet each still runs and still
flips. The **docs** phase, which the `docs` id and `phases.docs` each switch off, has **no ledger entry of
its own**, so there is nothing to mark for it.

Membership is **unchanged** by the second provenance: the three `phases.*` flags reach a subset of what the
four ids reach. Which switch reaches which entry:
1. `parity` / `phases.parity` → `A1.5g`, `A1.5f`.
2. `architecture` → `A2g`, `A2f`. **Run mode only** — the configuration schema declares no `architecture`
   flag, so this pair has one provenance where the others have two.
3. `qa` / `phases.qa` → `P2` and `E` in the task-engine template, and `R4` in the user-review-engine one.
4. `docs` / `phases.docs` → nothing, the docs phase having no ledger entry of its own.

Two mechanisms, so a reader never has to guess which applies:
- **Seeded, never flipped.** The `[-]`-eligible phase entries above are written `[-]` at ledger
  creation / re-seed (§1.4), from the recorded `## Run mode` block **and** the phase configuration read at
  that same moment, and are never flipped afterwards.
- **Passed by exclusion.** A *gate* that never ran sits **inside a phase that still runs** — whether the run
  mode excluded its `parity` / `architecture` id, or `phases.parity` is `false` so the business-parity gate
  does not run at all — so the gate-bearing phase entry flips `[x]` in the ordinary way and is correctly
  **not** `[-]`-eligible **under either provenance**. `P1` flips when the task plan converges; `R1` flips
  "when **both gates PASS** (business-parity step 7, then architecture step 8)" — and a gate passed by
  exclusion **counts as passed**, so `P1` and `R1` still flip `[x]` on a round where either exclusion
  applies. `R4` — the QA entry the `qa` id and `phases.qa` each switch off whole — is the **one**
  `[-]`-eligible entry in that template.

`P2` is in the seeded set and **not** in the passed-by-exclusion one, under **either** provenance: it names
the UI-test-plan loop *itself*, which `qa` and `phases.qa` each switch off whole, so under either exclusion
nothing ever flips it — and a `P2` left `[ ]` would make §1.7's first-`[ ]` rule land the resume squarely on a
phase that cannot run, the exact defect the third marker removes.

**Keep the three provenances apart.** `E` and `R4` already read `[x] … / no_ui`, and `P2` `… — or no_ui`.
`no_ui` is the **flow's own finding** that there is nothing to test; a **run mode** is an **authored**
exclusion decided for this branch; a **`phases.*` flag** is a **repository-level** exclusion that holds for
every branch of every run. The first is the flow's own and is not a `[-]`; the second and third both are.
All three are non-re-entrant, and each owes the reader a **different disclosure** — which the flow's Done
summary words, not this file.

**The `## Run mode` block** carries the run mode itself **and, on its `phases:` line, the configuration the
same write seeded from**. It deliberately holds **no checkboxes**, so §1.7's first-`[ ]` scan cannot mistake
any of its lines for a phase entry. Both
data lines are written **affirmatively even when there is nothing to exclude** (`skipped: none`; every
`phases.*` recorded, false included), which is what keeps *this branch has no run mode* distinguishable from
*nobody read one*. For what a directive id is, which ids exist, and what makes a directive ignored, see
`${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` — none of that is restated here.

**Planning entries are coarse on purpose.** Planning converges as a unit (a revision re-runs
parity → architecture → structural together), so there is no durable "parity passed but architecture didn't"
mid-state to checkpoint. The **Implementation** review phases *do* split into generate/fix (`*g` / `*f`),
which is where resume precision pays off: resume between "review generated + committed" and "findings fixed"
**skips regeneration** (no reviewer re-dispatch) and resumes the fix loop from the findings index. `Bm`/`C2m`
(meta-reviews): `*g` = "a review is committed, or the reviewer passed clean and wrote none"; `Bm` = "the
committed review passed its meta-review"; `C2m` = that, or not owed because C2.1 passed clean so C2.2 never
ran. A meta FAIL regenerates the review (a new commit; `*g` stays `[x]`) and re-runs the meta; the ledger tracks
convergence, not the iteration count (the existing `>= 5` caps own that).

### 1.4 Creation
**Task engine — the `planner fork's Setup` creates the ledger once per branch, idempotently.** If
`<state_dir>/flow_progress/<branch>_progress.md` already exists (a resume), do NOT recreate or reset it — read
it. The task engine has exactly one ledger per branch and it only ever grows monotonically. On the create
path the fork writes the `## Run mode` block — the run mode it read at its own Setup, and on the `phases:`
line the flags it read from `harness.config.json` — and, in that **same write**, seeds a `[-]`-eligible entry
as `[-]` rather than `[ ]` when **either** a `skipped:` id names it **or** the `phases.*` flag gating it is
`false` in `harness.config.json` (§1.3 maps switch to entry). The
configuration is read before the ledger is written, so both provenances are known at that one write. Because a
resume does **not** re-read or reset the ledger (the rule just above), the block recorded at creation is what
governs the branch from then on.

**User-review engine — the `fix-plan fork's Setup` creates OR re-seeds the ledger per round.** Each
user-review round is a fresh `R1–R5` fix cycle against the same branch/worktree, and the ledger is committed,
so the *previous* round's all-`[x]` ledger is present at the next round's start. Decide by comparing the
existing ledger's header round to the **active round** (the latest `<branch>_review[_<n>].md`):
- exists **and** header round **==** active round → **resume** (read it, do NOT reset — a pause/park resume
  within the same round);
- exists with an **older** header round (a fresh round) → **re-seed**: overwrite from the template with the
  new round number (fresh all-`[ ]` `R1–R5`), so §1.7 does not skip the new round as already-done;
- absent → **create** from the template with the active round.

⚠️ The round comparison is **load-bearing**: without it a round-≥2 run reads the stale all-`[x]` ledger and
§1.7 skips the entire fix cycle — **silently voiding the round**.

On the **create** and **re-seed** paths alike the `## Run mode` block is derived for the active round from the
run mode the fork read at its Setup and the flags it read from `harness.config.json`, in the same write as the
fresh all-`[ ]` `R1–R5`, and `R4` is seeded `[-]` when **either** a `skipped:` id names it **or** `phases.qa`
is `false` in `harness.config.json`. On the **same-round resume** path the block is read, never rewritten —
like every entry around it.

**Tie-break.** Where the prompt's current run mode diverges from the recorded block — a prompt edited
mid-branch — **the recorded block wins**, and the divergence is reported on the run's disclosure line.
Changing a run mode mid-branch therefore means editing this block and the markers it seeded; editing the
prompt alone changes nothing any running fork reads. A `phases.*` value edited mid-branch does not re-seed a
ledger either — but it is **not** symmetric with the run mode, and the difference is load-bearing. A run-mode
gate re-reads the **recorded block** (`${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` →
`## The durable record`), so a prompt edit reaches nothing a running fork reads. Each phase's
**`Skip this phase unless …`** configuration gate re-reads the **live `harness.config.json`** on every entry,
so a flag edit can run a phase whose entries were seeded `[-]`, or skip one whose entries are `[ ]` — and no
flip repairs either state (§1.5). **Changing a `phases.*` value mid-branch therefore means editing the live
file, the recorded `phases:` line and the markers it seeded in one act — all three, or none.** A ledger whose
`phases:` line disagrees with the live configuration is an **unresolved ledger** for §1.8 and is escalated
there, never silently reconciled.

In every create/re-seed case, commit the ledger immediately via the wrapper (§1.6) so it is tracked from step
one; on the same-round resume path there is nothing to commit (wrapper exit 3).

### 1.5 Who flips
The **driving fork** flips only its own entries — the **planner** flips `P1–P3`, the **orchestrator** flips
`A–D`, the **fix-plan fork** flips `R1–R2`, the **fixes fork** flips `R3–R5`. **Sub-agents never touch the
ledger** (implementers, reviewers, committers stay single-purpose). Flip points are named in each fork's thin
override.

`[-]` is **not** a flip: it is set at ledger **creation / re-seed by the creating fork**, from the recorded
`## Run mode` block and the phase configuration (§1.4), so it does not disturb "the driving fork flips only
its own entries" above. A `[-]` entry is already **resolved**, and the seeding act is the **only** thing that
resolves it — nothing later in the run does. A driving fork that reaches a `[-]` entry leaves it alone: no
fork flips it, in either direction. Re-running creation is idempotent exactly as §1.6 describes (no diff →
wrapper exit 3).

**No rule anywhere licenses writing `[x]` over an entry whose phase never ran** — not for a run-mode skip, not
for a `phases.*` flag that is `false`, and not for an entry a fork finds still `[ ]` at the end of a run.
`[x]` asserts, on §1.2's terms, that the phase ran and committed its artifact, so an `[x]` over a phase that
was switched off destroys the one record a reader consults to tell a real completion from a false one. It is
strictly worse than leaving the entry `[ ]`, which at least reads as unfinished. An eligible entry that
should have been `[-]` and was seeded `[ ]` is corrected by fixing the **seeding**, never by flipping it.

### 1.6 How to flip / create — direct `commit-on-branch.sh`, NEVER a committer dispatch
Each flip (and the initial creation) is: **Edit the ledger file, then commit and push via the wrapper** —
`<scripts_dir>/commit-on-branch.sh`, then `<scripts_dir>/push-branch.sh`, using the `$REPO_ROOT` the fork
resolved at session start (both wrapper paths are repo-relative and take no app-root prefix). Fixed subject `chore: Flow progress <entry-id> for <branch>`
(e.g. `chore: Flow progress A1.5f for <branch>`; for creation, `chore: Add flow-progress ledger for
<branch>`). No `Co-Authored-By:` / trailer, no `--no-verify` — the wrapper enforces both.

⚠️ **Run the commit and the push as two separate, literal single-statement Bash commands — do NOT gate the
push on the commit's exit code with a shell conditional** (`commit … ; if [ "$?" -eq 0 ]; then push … ; fi`).
That compound is a headless trap: `allow-safe-compounds.sh` splits on `;` and the ` then bash push-branch.sh …`
piece begins with a non-allow-listed `then`/`bash` prefix, so the whole command falls through the safe-compound
allow — and nothing else matches it either, so the run **stalls on a permission prompt it cannot answer
headlessly** and the commit is never made. No guard rescues it and none refuses it:
`git-commit-branch-guard.sh` judges only a piece whose own command word is `git`, and it judges the repository
that command names, so a `bash <scripts_dir>/commit-on-branch.sh …` piece is outside its scope by construction
and it stays silent — its own protected-branch `ask`, which quotes the configured set back, is reserved for a
real `git … commit` on a protected branch. Any
`if …; then … ; fi` / `for …; do … done` control-flow block trips the same trap; plain and newline-separated
single statements do not — but a wrapper invocation carrying `$(…)`, a backtick, `|` (hence `||`), `>`, `<` or a
braced expansion other than a bare `${IDENT}` loses `autonomous-script-allowlist-guard.sh`'s allow, so keep
those out of the command itself and not only out of the compound (`$?` and `${branch}` are fine). No
exit-0 gate is needed anyway:
`push-branch.sh` is non-fatal and only fast-forwards already-committed work, so an unconditional push is a
harmless no-op ("Everything up-to-date") whenever the wrapper made no new commit — including the idempotent
exit-3 re-flip. If a flip ever does hang on an unanswerable permission prompt, treat the commit as **not
landed** and re-run it as a plain single-statement command.

This is **NOT** a `committer` agent dispatch, for three reasons — the same rationale the task flow's Override
D uses for `statistics.md`:
1. **It fits no committer mode.** `task` / `review_item` / `ui_test_pass` each flip a `## Phase 2 Readiness`
   box — the first two under a free-form subject; `review_plan_file` flips no box and is locked to a fixed
   subject. The ledger has neither shape: its `## Planning` / `## Implementation` sections hold no readiness
   box, and its subject is its own. Routing through the committer would force a new `committer.md` mode.
2. **It would violate a stated invariant.** A committer call is an **Agent dispatch** counting against
   `MAX_TOTAL_DISPATCHES`; a direct wrapper call is a **Bash command** costing **zero** dispatches. Across
   ~13 (task) / ~5 (user-review) phase boundaries the committer route would burn that many dispatches for
   nothing.
3. **Nothing to infer.** The fork already knows exactly which entry it just completed.

`commit-on-branch.sh` is the same wrapper the committer uses internally, so the fork inherits identical
safety (no shell-expansion stall on `${branch}`, explicit-path staging — never `git add -A`/`.`,
protected-branch refusal, the exit-code 0/1/2/3 contract). **Idempotency:** re-flipping an already-`[x]`
entry stages no diff → the wrapper returns **exit 3** (nothing to commit) → no commit is made, and the
unconditional push that follows is a harmless "Everything up-to-date" no-op (there is **no** exit-0 gate —
see the warning above). This makes every flip safe to re-run on a resumed run.

### 1.7 Resume-from-ledger (every fork, on every (re-)entry)
1. Read `<state_dir>/flow_progress/<branch>_progress.md`.
2. The **first `[ ]` phase entry** is the resume point. A `[-]` entry is not a `[ ]` entry, so a phase
   excluded before the run began — by a run mode or by a `phases.*` flag — is provably never the resume point
   — not on this entry and not on any later one.
3. **Skip every `[x]` and every `[-]` phase** — no reviewer re-dispatch, no review regeneration, no
   re-commit.
4. Within the resume-point phase, the phase's **detail index** drives within-phase resume, exactly as the
   per-task / per-finding / per-test loops already do today (find the first `[ ]` item). The planning
   entries `P1` and `P2` have no detail index: their within-phase position is the planning walker's
   saved walk, as `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md` →
   `## Override 2 — resumability` applies it. That walk is machine-local and never a second record — where it
   and this ledger disagree, this ledger wins — and a planning loop whose entry is `[ ]`, with its draft on
   disk and no usable walk, is reviewed again rather than skipped.
5. `PAUSE_PROGRESS.md` (§2) is read only as a **human-readable hint / audit trail** — the ledger is
   authoritative. This composes with the clarification park/resume (`Override 2(a)`): the top-level answered pairs
   the watcher resumed for are consumed as `Override 2(a)` states; the ledger independently says which phase to be in.

This is what makes resume deterministic and answers "will the fork know where to resume" — it also removes
the naive re-run of the non-checkbox review phases that the existing clarification park/resume otherwise
suffers.

**Consumer cost of the third marker — zero parsers, one prose edit.** Three consumers, none of which parses
the ledger. The watcher (`<scripts_dir>/autonomous-watcher.sh`) only *names* it in the resume prose it emits
into a relaunch prompt ("continue at the first phase entry still marked [ ] and SKIP every phase already
marked [x]"), which stays true verbatim under `[-]`, since a `[-]` entry is neither of the two markers that
sentence quantifies over. The branch-status command never opens the ledger at all. `/autonomous-sdlc-harness:branch-resume` **does**
state the marker set in its own resume prose ("skipping every phase already marked `[x]` or `[-]`"), so it is
edited whenever that set changes — it already carries the third marker. To re-derive which surfaces name a
marker at all, grep the corpus for the literal `[-]`.

### 1.8 Completion check — no Done summary over an unresolved ledger
No run declares itself done over a ledger that still carries an unresolved entry. The driving fork verifies
the ledger is fully resolved **before** it flips the terminal entry:

- **When.** Once per run, at Phase D, **after** every other Phase-D step that writes an artifact (the branch
  statistics, the phase's dispatch-additions record, the improvement-observations write, and the
  clarification-digest write) and **immediately before** the terminal entry's flip.
  Not per phase, and not after the flip.
- **What is read.** The committed ledger, whole — both checklist sections, every phase entry — plus the
  `## Run mode` block's `phases:` line and the live `harness.config.json`. The block contributes no *entry*:
  it carries no checkbox by design (§1.3).
- **The predicate.** Every phase entry **other than the terminal entry itself** is `[x]` or `[-]`, **and**
  the recorded `phases:` line matches the live `harness.config.json`. The terminal entry is `[ ]` at this
  instant by construction — it is the flip this check gates — so it is never its own subject. A `phases:`
  disagreement means a `phases.*` value was edited mid-branch (§1.4 **Tie-break**), so at least one `[-]` or
  `[ ]` no longer describes what the gates did.
- **Pass.** Flip the terminal entry and continue to the Done summary, unchanged.
- **Fail — any other entry still `[ ]`, or a `phases:` disagreement.** Do **not** flip the terminal entry and
  do **not** emit the Done
  summary. That entry is a phase that neither ran nor was authorised to be skipped, which is a blocker and
  not a summary line. On a disagreement, name the entry ids the edited flags gate exactly as an unresolved
  `[ ]` is named. Halt and hand off through the flow's **existing** `<escalate>` binding, at the halt
  site its core states in `## Stop conditions (halt and do NOT continue)`, naming every unresolved entry id
  and the phase each one names. This document defines **no channel of its own**: it owns the check, the
  cores own where a flow may halt. This site is **unconditional**: it does not pass through the
  ask-vs-assume policy, and there is no assume-and-proceed arm for it. That policy weighs whether a decision
  is reversible enough to take alone; the decision here is whether the run may declare itself done, which is
  the one thing the check exists to take out of the fork's hands. It borrows the cores' halt channel and
  nothing else about how that channel is normally entered.

**The remedy the hand-off must carry.** The fork picks none of the four dispositions — the **operator**
does, over the entry ids the hand-off named: the phase genuinely did not run and is owed, so re-enter and
run it; the phase was switched off before the run began but its marker was never seeded (an in-flight ledger
created before this rule shipped), so the marker is corrected the way §1.4's **Tie-break** already
prescribes — edit the recorded block and the markers it seeded, then resume; a `phases.*` value was edited
mid-branch, so the operator restores the recorded `phases:` line and its markers, or re-seeds the ledger
deliberately; or the entry is stale for a fourth reason the operator names. **The fork never edits a marker to clear its own check**, which would make
the check self-satisfying; §1.5 already bars writing `[x]` over a phase that never ran, and correcting a
mis-seeded entry is a seeding fix, not a flip.

**Cost, and interaction with the invariants.** The check is a read of one short committed file the fork
already opens on every (re-)entry (§1.7), plus `harness.config.json`. It dispatches nothing, so it touches no `MAX_TOTAL_DISPATCHES`
budget; it commits nothing, so it adds no commit point to §3's clean-tree set. Its fail path leaves the tree
clean, because every earlier Phase-D artifact is already committed.

---

## 2. Pause/resume protocol

### 2.0 The three pause triggers — one protocol, three ways in
All three converge on the same artifacts (`PAUSE_PROGRESS.md` + `PAUSE_ACK` + end-session) and the same
watcher-owned resume, and differ only in **who notices** and **who resumes**:

| Trigger | Detected by | Path in | Auto-resumes? |
|---|---|---|---|
| Operator pause (`/autonomous-sdlc-harness:branch-pause`) | the operator | drops `<state_dir>/PAUSE` → run honors it at a clean boundary (**§2.2**) | no — waits for `/autonomous-sdlc-harness:branch-resume` |
| **Usage limit** (5 h `five_hour` / weekly `seven_day`) | the **watcher**, parsing `rate_limit_event` off the run's `<branch>.stream.jsonl` | watcher drops `<state_dir>/PAUSE` → run honors it (**§2.2**) | **yes** — watcher records `usage_resume_at` and drops `RESUME` when the window resets |
| **API overload** (`529` / `500` / `503`) | the **run itself**, from a failed Agent dispatch | run writes `PAUSE_ACK` directly — **no `PAUSE` request** (**§2.5**) | no — an outage has no predictable reset; waits for `/autonomous-sdlc-harness:branch-resume` |

So the usage gate is *not* a self-pause: it is watcher-detected and routed through the ordinary request/ack
path. §2.5 is the only **run-initiated** pause, which is why it is the only one that writes `PAUSE_ACK` with no
`PAUSE` present (§2.4 explains why that is sound).

⚠️ Note where the load-bearing difference lies. Detection could in principle move to the watcher for the
overload case too (it already tails the same stream) — but that alone would **not** fix a false `completed`:
a watcher-dropped `PAUSE` is only honored at the run's next safety-contract checkpoint, and a run that ends
its turn before reaching one still exits `rc=0` with no `PAUSE_ACK` and is stamped `completed`. **The ack is
what fixes classification**, so the run-side rule in §2.5 is required regardless of who does the detecting.

### 2.1 Files — FLAT under `<state_dir>/`, machine-local (never commit them)
| File | Role | Written / removed by |
|---|---|---|
| `<state_dir>/PAUSE` | **request** (input): pause this run | user drops it (or `/autonomous-sdlc-harness:branch-pause`); **watcher** removes on resume |
| `<state_dir>/PAUSE_PROGRESS.md` | append-only pause note (phase, ledger state, next step) | driving fork appends; kept across resumes |
| `<state_dir>/PAUSE_ACK` | **ack**: "I actually paused" (drives registry `paused`) | driving fork **writes** (never `touch` — §2.2b); also written *unrequested* on a §2.5 self-pause; **watcher** removes on resume |
| `<state_dir>/RESUME` | **trigger** (input): resume this run | user drops it (or `/autonomous-sdlc-harness:branch-resume`); **watcher** removes on resume |

They are **flat** under `<state_dir>/` — deliberately **never** a `<state_dir>/pause/` subdir, because on a
case-insensitive filesystem (macOS default) `<state_dir>/PAUSE` and `<state_dir>/pause/` are the **same path**
and collide (a `mkdir <state_dir>/pause` fails whenever `<state_dir>/PAUSE` exists).

### 2.2 Honoring a PAUSE (driving fork, folded into the safety contract)
The safety contract runs **before every Agent dispatch** and already does the per-run `<state_dir>/STOP` check.
**Immediately after the STOP check**, add:

1. `ls <state_dir>/PAUSE` — if **absent**, continue normally.
2. If **present**, check for uncommitted **tracked** changes by running the **bare** command
   `git status --porcelain` (no `-C`, no pipe) and **inspecting the output yourself**. Two traps to avoid —
   one about what you read, one about the headless profile: (a) do **NOT** pipe to `grep` — a piped form is
   not refused (`allow-safe-compounds.sh` never splits on `|`, so the pipe is answered by the permission
   profile, which allow-lists both halves: `Bash(git status:*)` and `Bash(grep:*)`), it just hands you a
   filtered view instead of the lines the classification below is stated over; and (b) do **NOT** add `-C <repo_root>`
   — only a **bare** `git status …` matches the `Bash(git status:*)` allow entry, whereas
   `git -C <worktree-root> status` matches **no** allow entry (the generated permission profile at
   `.claude/settings.autonomous.json` allow-lists `Bash(git status:*)` and carries no `git -C …` entry at all, so
   any `-C` form falls through to neither `allow` nor `deny`) and stalls. The bare form is correct because the
   run's cwd is the worktree root (the engine never `cd`s) and `git status` reports the whole worktree's tracked
   state regardless. Read its lines: if every line begins with `??` (untracked) or there is no output, the
   **tracked** tree is clean; any line NOT beginning with `??` (a staged/modified/renamed/deleted tracked
   path) means dirty-tracked. Untracked `<state_dir>/…` artifacts are tolerated — the same clean-of-tracked-changes
   invariant the watcher's worktree-reuse check uses (the watcher applies it with a pipe; the engine states it
   over unfiltered output).
   - **Dirty-tracked** (a unit is mid-commit, between an implementer and its committer): do **NOT** pause
     yet. Let the loop proceed through the next commit that cleans the tree (a bounded committer dispatch),
     and honor the pause at the following checkpoint — which will be clean. This keeps the pause at a clean
     boundary so resume is identical to a fresh re-launch.
   - **Clean-tracked**: honor the pause now —
     a. Append an entry to `<state_dir>/PAUSE_PROGRESS.md`: a timestamp, the current phase (from the ledger),
        the active detail-index state, and the exact next step. **Append, never overwrite** (a run may pause
        more than once) — use the **`Write` tool** (Read the existing file, if any, then Write back its
        content plus the new entry) or `echo "<entry>" >> <state_dir>/PAUSE_PROGRESS.md`. Both are allowed;
        `Write(/<worktree_glob>/**)` and `Bash(echo:*)` are on the profile. **A permission rule naming an
        absolute path needs a `//` prefix — for `Read`, `Edit` and `Write` alike**: `//` anchors the rule at
        the filesystem root, whereas a single leading `/` is resolved relative to the settings source root
        and so names a path nobody has. That `//` is one written slash plus the path's own leading one —
        `<worktree_glob>` is already absolute, so the rule carries two slashes and not three; adding a
        third gives the same silent nothing from the other side.
     b. Create the ack marker `<state_dir>/PAUSE_ACK` with the **`Write` tool** (an empty/one-char file) or
        `echo "" > <state_dir>/PAUSE_ACK`. **Do NOT use `touch`** — `Bash(touch:*)` is **not** on the allow list
        and stalls in the headless `-p` profile (same trap as the `-C` form above).
     c. Emit a one-line `PAUSED: <branch> — <phase>` to the run log (ordinary assistant output — no shell).
     d. **End the session** — truly stop and yield. Do NOT spin, poll, sleep, or re-dispatch. Ending the
        session is what makes the pause free of dispatch cost (same rule as a clarification park).

Do **not** delete `<state_dir>/PAUSE` yourself (the watcher owns its lifecycle, and `rm` is not allow-listed in
the generated profile — only `rm -rf` is on its deny floor, so a bare `rm` stalls rather than being refused). The
`PAUSE_PROGRESS.md` append and `PAUSE_ACK` write are ordinary `<state_dir>/…` writes (allowed under the profile)
and are the run's only actions before ending.

Granularity note: the safety contract only regains control **between** dispatches, so pause is inherently
between-dispatch — an in-flight sub-agent (a long QA test, a review generation) finishes first. Letting a
pending committer also finish (the dirty-tracked case above) costs at most one bounded dispatch and is worth
it for a clean-boundary resume.

### 2.3 Resuming
The **watcher** owns the resume: on a `<state_dir>/RESUME` trigger for a `paused` run (kill-switch off, under
cap) it deletes `PAUSE` + `RESUME` + `PAUSE_ACK`, **keeps** `PAUSE_PROGRESS.md`, flips the registry to
`running`, and re-launches the same engine with a pause-resume clause. The re-entered fork reads
`PAUSE_PROGRESS.md` as a hint and resumes via **§1.7 resume-from-ledger**. For a §2.2 pause no dirty-tree
reconciliation is needed, because the pause was taken at a clean tracked-tree boundary and every completed
phase's artifacts are already committed and pushed. A **§2.5 overload self-pause** is the one exception — it
may land mid-unit — and it needs no reconciliation either, for the different reason given there: the stray
edits belong to a unit whose detail-index box is still `[ ]`, so the normal loop re-runs it and supersedes
them.

### 2.4 Why `PAUSE_ACK` is separate from `PAUSE`
`PAUSE` is the *request*; `PAUSE_ACK` is the fork's positive *"I paused"* ack. A run that reaches genuine
completion never writes `PAUSE_ACK`, so `classify_run_exit` can never misread a completion that happened
while a `PAUSE` was sitting there as `paused`. This mirrors how a clarification park uses the *written
question file* (not the request) as the positive park signal.

The separation cuts the other way too, and §2.5 depends on it: because `PAUSE_ACK` is the **sole** signal
`classify_run_exit` keys `paused` off — it never checks whether a `PAUSE` request preceded it — a fork may
write `PAUSE_ACK` **unrequested** and be classified `paused`. No watcher change is needed to support a
self-initiated pause.

### 2.5 Self-pause on sustained API overload (no `PAUSE` request involved)

Every pause in §2.2 is a *reaction* to an external request. This one the run raises **itself**, and it is the
only sanctioned response to an infrastructure failure that no amount of retrying inside the turn can fix.

**Trigger.** An Agent dispatch comes back having died on an API-infrastructure error rather than on anything
the sub-agent did — the run log shows `Agent terminated early due to an API error: API Error: 529 Overloaded`
(likewise `500`, `503`, or `overloaded_error`). This is **not** a sub-agent failure: it does **not** count as
a reviewer `FAIL`, does **not** advance any `>= 5` iteration cap, and does **not** mean the unit is broken.
The dispatch simply never ran.

**Retry budget — three attempts, ≤60 s of in-turn waiting, then pause.**
1. Attempt 1 fails → re-dispatch **immediately** (same unit, same prompt).
2. Attempt 2 fails → **one** bounded backoff of **at most 60 s**, then re-dispatch.
3. Attempt 3 fails → **self-pause** (below). Do not attempt a fourth.

Each re-dispatch re-runs the full safety contract (STOP + PAUSE checks, `.dispatch_counter` increment) and
counts against `MAX_TOTAL_DISPATCHES` like any other dispatch — an overloaded dispatch still costs a slot.

⚠️ **A backoff is not a resumption mechanism, and neither is a `Monitor`.** Do **not** schedule a `Monitor`,
do **not** sleep for minutes, and above all do **not** end the turn "intending to continue once the backoff
elapses". A headless `claude -p` session is torn down when the turn ends: the process exits, any pending
monitor dies with it, and nothing re-invokes the run. That exit is `rc=0` with no `PAUSE_ACK`, so
`classify_run_exit` stamps the run **`completed`** and fires a **success** notification for a run that never
finished — the flow is silently abandoned mid-phase behind a green light, and because the registry says
`completed` rather than `paused`, both `/autonomous-sdlc-harness:branch-resume` and the watcher's `resume_paused_runs` (which filters
on `status == "paused"`) refuse to touch it, so even a hand-dropped `RESUME` is ignored. Writing `PAUSE_ACK`
and ending the session is the **only** durable way to survive an outage.

**Action** — identical artifacts to §2.2, minus the request file (there is no `<state_dir>/PAUSE` to leave alone):
   a. Append an entry to `<state_dir>/PAUSE_PROGRESS.md` (Write tool or `echo … >>`, per §2.2a) recording — on top
      of the usual timestamp / phase / detail-index state / next step — **the reason** (`API overload — 3
      consecutive dispatch failures`), **the exact dispatch** that could not be placed (its heartbeat label and
      `#<n>`), and **the tracked-tree state** (see the dirty-tree rule below).
   b. Write `<state_dir>/PAUSE_ACK` (Write tool or `echo "" > <state_dir>/PAUSE_ACK`; **never** `touch` — §2.2b).
   c. Emit `PAUSED: <branch> — <phase> (API overload)` to the run log. The `(API overload)` suffix is what tells
      this pause apart from a usage pause or a hand-dropped `/autonomous-sdlc-harness:branch-pause` in the notification's log tail.
   d. **End the session** — truly stop and yield, exactly as §2.2d.

**Dirty-tracked tree — this pause deliberately diverges from §2.2.** §2.2 *defers* a pause while a unit is
mid-commit, letting the next committer dispatch clean the tree first. Under overload that committer will fail
too, so waiting for a clean boundary never terminates. **Self-pause regardless of tree state**, and record
every non-`??` path from the bare `git status --porcelain` in the pause note. This is sound because both
checklists stay honest under §1.2: a phase entry flips only after its recorded outcome, and where that outcome
has an artifact only after that artifact is committed; a detail-index item flips only on its committer's
commit — so an uncommitted implementer edit necessarily
belongs to a unit still marked `[ ]`. On resume the fork re-enters that unit from its detail index through the
normal loop and the stray edits are superseded. No bespoke reconciliation, and §1.7 is unchanged; only §2.3's
"no dirty-tree reconciliation is needed" sentence is narrowed, because an overload pause is the one pause that
can land mid-unit.

**A lost sub-agent result is re-earned, never trusted from the note.** When the failed dispatch was a
`committer` closing a unit whose sub-agent had already produced a verdict (a `qa-tester` PASS, a reviewer
verdict), that verdict dies with the pause — its index box was never flipped. Record it in the pause note as
an audit hint, but the index stays `[ ]` and the resumed run **re-earns** it; §1.7 step 5 already makes the
ledger and detail indices authoritative and `PAUSE_PROGRESS.md` a hint. Repeating one QA test is the price of
never marking a test passed on the strength of an uncommitted claim.

**Who resumes.** Nothing auto-resumes an overload pause. An outage has no predictable reset the way the 5 h
usage window does, so — unlike the usage auto-pause, which records `usage_resume_at` and drops `RESUME`
itself — the run sits at registry `paused` at zero dispatch cost until a `<state_dir>/RESUME` lands. The operator
resumes it with `/autonomous-sdlc-harness:branch-resume` once the incident is clear. Because the status is genuinely `paused`, both
`/autonomous-sdlc-harness:branch-resume` and `resume_paused_runs` act on it normally, which is precisely what a falsely-`completed`
run denies them.

---

## 3. Interaction with the clean-tree invariant + hard boundary
- **New commit points.** Ledger creation and each ledger flip are new autonomous-fork commit points — add
  them to the **Autonomous-fork commit points — the clean-tree invariant** set in
  `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md`. They keep the tree
  clean-of-tracked-changes at every checkpoint (an Edit-then-commit flip is atomic from the safety contract's
  between-dispatch view).
- **Not dispatches.** Ledger flips/creation are Bash commits, so they do **not** count against any fork's
  `MAX_TOTAL_DISPATCHES`, whatever value the driving fork's core binds — no numeric change is needed.
- **Protected-branch boundary unchanged.** Ledger commits and pause-resume reach only the run's own
  non-protected worktree branch (the wrapper + `pre-push` hook refuse targets in `<protected_branches>`); the
  flow still ends at "branch ready for review," never merges, never opens a PR.
- **No `rm` in the headless run.** The watcher deletes the pause files; the fork only writes `<state_dir>/…`.
