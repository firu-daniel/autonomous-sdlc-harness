# Dispatch discipline — what an orchestrator may and may not add to a dispatch prompt

## Resolved values

The two tokens below are neither Mode-contract **bindings** (this file declares none — the `**Placeholder resolution.**` note below states where the ones it *uses* come from) nor ordinary **path placeholders** (`<branch>`, plus the names this file's own text defines at their use sites — the `**Placeholder resolution.**` note below enumerates them): they resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<scripts_dir>` | config value | `scriptsDir` — the repo-relative directory the generated wrapper scripts live in. The two scripts this file names by path, `commit-on-branch.sh` in `## Commit mechanics` and `push-branch.sh` in `## Push`, are outer-loop scripts rather than generated wrappers — they are named by their destination path, and the item that delivers them settles that. |

---
An orchestrating agent composes every sub-agent prompt itself, and whatever it adds beyond the block its governing instruction defines exists only in the session transcript — gone when the session ends, while the finding, the verdict and the round count that text shaped are committed and read later as the agent's own. **This file is the canonical policy governing that added text.** A flow **activates** it by pointing at it from each site where its orchestrator composes a prompt; it never restates any part of it, per `${CLAUDE_PLUGIN_ROOT}/instructions/mode_contract.md` rule (5) — a copy creates a second owner of the contract. This file is otherwise inert.

**Placeholder resolution.** Per `${CLAUDE_PLUGIN_ROOT}/instructions/mode_contract.md` → `### Bindings vs. path placeholders`, the one `<…>` **path placeholder** this file resolves from outside itself — `<branch>` — and the `$REPO_ROOT` shell value resolve from the **activating flow's own entry core `## Setup`** and that flow's `<repo_root>` binding — never from the immediate citing file, and never from this file. Being a shared file reached by several cores confers no ownership of a path (the same rule `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `### Placeholder resolution` states). A flow whose entry core declares **no** path anchor of its own resolves `$REPO_ROOT` at the write point from a **bare** `git rev-parse --show-toplevel` — the read-only, allow-listed form — rather than from a machine literal, so activating this file never obliges a fork to mint a binding for it. Every other `<…>` name here is defined by this file's own text at its use site (the key parts in `## The entry format`, `<N>` in `## The disclosure line`, the illustrative `<file>` / `<section>` of the bare-pointer form) and resolves from nothing external. If `<branch>` or `$REPO_ROOT` is unresolved, you arrived without your entry core's `## Setup` — go read it.

**Mode-free and family-neutral.** This file declares no phase, holds no dispatch block of its own, and supplies no mode-specific value; the one fork document it names — cited in `## Push` as that step's rationale source — is a pointer, not a dependency. Every flow that activates it gets the same text.

## Knowledge, not conclusions — the boundary

One question, asked of every sentence you are about to add to a dispatch prompt: **does the addition change what the agent *knows*, or what it *concludes*?**

**Knowledge — permitted, and shaped.** Facts the receiving agent cannot obtain from any file it reads: a path correction, which sibling unit owns a site two units both touch, a constraint stated in an artifact outside its read set. Withholding these causes wrong work — the agent re-edits a site another unit already owns, or breaks a constraint it was never shown. Permitted knowledge is not free prose, though: it travels only in the shape `## The sanctioned form` below defines (that section's full heading carries a code span, so it is cited by that backtick-clean short form throughout, exactly as `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` cites its own `### Per-unit review step`).

**Derivable is not knowledge — the checkout root, settled.** Which checkout the run occupies is not a fact the receiving agent lacks: it obtains that root from a bare `git rev-parse --show-toplevel`, a read-only command an unattended profile allow-lists, and the rule binding every repo-relative path it is given to that root reaches it in the files it already loads. Passing it on a `context_notes:` line therefore changes nothing the agent could not derive, so it is not permitted knowledge and is not to be added — nor is the "pass repo-relative paths to the commit wrapper" extension of it, which is the receiving agent's own contract. A dispatch that carries it anyway is an addition like any other: record it under `## The record — where an addition is written`, where its `why the agent could not derive it:` line has no true answer left to give.

**Conclusions — barred.** Four kinds, each named so a borderline addition can be classified rather than argued about:

- **Attention-steering** — what to suspect, where to look, what to expect to find.
- **Verdict or severity calibration** — what should count as Must Fix, when to stop failing, what a further round is worth.
- **Scope narrowing** — what not to check, what not to re-run, which class of finding to pass over.
- **Output calibration** — what the output should look like relative to other units: its length, its section count, its shape "in keeping with" what already landed. This is the house-pattern ratchet, stated in full in `### What a dispatch prompt is` below, which this file now owns.

Each of the four removes the independence that makes the agent's output evidence rather than confirmation.

**The asymmetry that makes conclusions uniquely corrosive.** Steering **toward** is unfalsifiable-positive: the agent finds what it was aimed at, and no later reader can separate a finding that was *found* from one that was *pointed at*. Steering **away** is unfalsifiable-negative: nobody — the agent included — can know what it would have found. The two are mirror images, they destroy the same property, and **neither leaves a trace in the artifact**. That is why `## The record — where an addition is written` exists: the boundary below cannot be checked after the fact from the artifacts alone, so the addition is written down.

### What a dispatch prompt is

Do NOT add stylistic or consistency directives to a dispatch prompt. A dispatch prompt is exactly the block its governing instruction defines and nothing more — for a unit-loop dispatch, the shape `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The unit loop` defines for the row you are running (step 3's prompt plus that row's `Implementer prompt extras` for the implementer; `### Per-unit review step`'s fenced block for the reviewer); for a phase-level dispatch, the prompt written in that phase's own section of the instruction file that governs it — the fenced block in the core that declares that phase, for a phase that core declares, and the pointed-at module's own step spec for a phase a fork's override adds. "Nothing more" bars additions of your own; it does not bar a rule that already lives in a file the agent reads. That carve-out is a **bare pointer** and nothing wider: naming a rule in a file the agent already reads — `apply <file> → <section>` — is permitted, while restating, paraphrasing, summarising, quoting a threshold out of, or adding emphasis to that rule is a **conclusion**, because a paraphrase re-weights what the agent would have read for itself. Telling an agent to "follow the house pattern established by the committed sections" makes every later unit match or exceed the longest earlier one, because under-matching an established precedent reads as under-delivering, and the ratchet compounds across a whole plan. The per-task / per-finding detail file is the spec: if a convention must hold across units, it belongs in that file — dispatch an implementer to put it there — not in your prompt.

## The three measured cases — each decidable under this rule

Three additions observed on one measured run, decided here so the boundary above is settled in advance rather than argued at dispatch time. They are stated **de-identified** — the run, its branch and its repository are not what makes them instructive.

**Case 1 — a "where to be most suspicious" paragraph.** A reviewer dispatch carried an orchestrator-authored paragraph naming the flaw classes to hunt in the diff and asserting that further instances existed. **Attention-steering — barred.** Two of that reviewer's three findings landed inside the space the paragraph named, and which were found and which were pointed at is not decidable from the committed artifacts. The underlying fact — that the branch edits the instructions the orchestrator itself obeys — **is** knowledge and may ride in `context_notes:` as a fact. What may not ride with it: any list of flaw classes, and any assertion about what exists to be found.

**Case 2 — "report Must Fix only for a defect that would cause an implementer to produce wrong work… do not FAIL on stylistic preference."** **Verdict calibration — barred**, however closely it tracks the rubric the agent already carries. On the measured run both instances were immediately followed by the loop's terminating PASS, so that loop's reported round count was produced against a threshold the orchestrator moved mid-loop and cannot be read as the reviewer's own bar. The correct move is a **bare pointer** to the severity rubric the reviewing agent's own definition and its named convention files already state — never a paraphrase of its thresholds, never a threshold quoted out of it, never an added "only". This is the case the narrowed carve-out in `### What a dispatch prompt is` decides.

**Case 3 — "verification already established… do not re-litigate."** **Mixed — split it.** The facts (which gate ran, at which commit sha, with what result) are knowledge and belong in `context_notes:`, each closing with the source that makes it checkable. The instruction *not to re-check* is **scope narrowing — barred**: the receiving agent keeps the decision whether to re-run, and may spend the dispatch on it. That settles the standing question about narrowing under dispatch-cap pressure — narrowing is legitimate as a **supplied fact**, never as an **instruction**, and it is recorded either way.

## The sanctioned form — the `context_notes:` line

Permitted knowledge travels in exactly one shape: an **optional trailing `context_notes:` line appended to the dispatch block**, below every arg that block's governing instruction defines. One fact per line, each closing with the source that makes it checkable — a path, a commit sha, a finding id. Nothing else belongs on it: no flaw class, no severity, no instruction about what to check or skip.

Its value is positional as much as textual. Because permitted knowledge has exactly one place to be, **anything appearing outside it is visibly a violation** — a later reader does not have to judge a paragraph's intent, only notice where it sat.

Three properties keep it cheap:

- **Omit it entirely when there is no fact to pass**, which is the ordinary case. A ceremonial empty `context_notes:` is worse than none, because a field that is always present invites filling.
- **It rides any dispatch block in any flow** — implementer, reviewer, writer, committer alike. It is not a unit-loop feature and needs no per-flow variant.
- **No agent definition declares it.** An agent that does not recognise the arg reads it as prose, exactly as it reads the rest of its prompt — which is why nothing in the implementer, reviewer or committer contracts changes to accept one.

**What this form does not solve — stated plainly.** A structured field constrains **where** text goes, not **what** an orchestrator writes into it: a conclusion typed onto a `context_notes:` line is still a conclusion, and no field shape prevents that. That is exactly why `## The record — where an addition is written` and the receiving-side reporting rule carried by the agent definitions `## The receiving side — the roster that carries the backstop` names exist, rather than this form alone.

## The receiving side — the roster that carries the backstop

The backstop is **universal across the agents a caller bound by this file dispatches to grade** — not limited to the plan/branch-review tier. These agent definitions each state the receiving-side rule under their own `## Unsolicited dispatch guidance`: `architecture-reviewer`, `branch-reviewer`, `business-parity-reviewer`, `docs-reviewer`, `layer-reviewer`, `qa-tester`, `review-plan-reviewer`, `skeptic-reviewer`, `task-plan-reviewer`, `ui-tests-plan-reviewer`. An agent added later that one of the documents in `## Activation` dispatches to grade carries it too.

Two exclusions, each a decision with a reason rather than an omission. **An agent that produces work instead of grading it** — every implementer, every writer, `committer` — holds no verdict for steering to move, and what it produces is graded by an agent on the roster. **`conventions-reviewer`** does grade, but the setup command that dispatches it is not one of the documents in `## Activation`, so no caller bound by this file composes its prompt.

The rule body lives in those definitions and not here: an agent loads its own file, never this one, and an agent-side pointer at this file would add an activating document, which `## Activation` bars. This section fixes the roster; it does not restate the rule.

## The record — where an addition is written

The record is `<state_dir>/dispatch_additions/<branch>.md` — **one file per branch, never shared.** A single file appended to at EOF by every run is among the most reliable git-conflict generators there is, and a record every run had to touch would re-serialise runs that are otherwise free to proceed in parallel. A per-branch file is written by exactly one run, so the conflict risk is none.

**Its own file, not a field on an artifact already being committed.** Two structural reasons, either of which alone is decisive:

- **No committer mode fits.** The record is a **non-readiness** artifact: it has no `## Phase 2 Readiness` checkbox for a committer mode to flip, and every mode that would take it is locked to a different fixed subject. It is therefore committed by a direct wrapper call (`## Commit mechanics`), which is the canonical rule for a non-readiness artifact in `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` §1.6.
- **A review index is not yours to edit.** Every index that would host such a field is written by a reviewer or writer agent, and each orchestrating core carries its own *do NOT edit plan files yourself* rule. A field on one would put the orchestrator inside an artifact it is barred from touching, and would make the record's survival depend on that agent's next rewrite of the file.

**Write mechanics — absolute write, repo-relative commit.** Create or append with the file tool at the **absolute**, `$REPO_ROOT`-anchored path `$REPO_ROOT/<state_dir>/dispatch_additions/<branch>.md`, so the record lands in **this** worktree. Then pass the **repo-relative** path `<state_dir>/dispatch_additions/<branch>.md` to the commit wrapper, which resolves its staging paths against `--repo`. The split is not cosmetic: a bare `<state_dir>/…` write resolves against the main checkout, which would put this run's record on **that checkout's branch** instead of the run's own.

## The entry format

**One block per dispatch that carried an addition, and one per dispatch whose return carried a `## Unsolicited dispatch guidance` section** — never one per phase, never one summary per run. Each block is keyed by the dispatch's own identity **as the flow already names it**, so the key needs no new vocabulary and cannot drift from the transcript:

- **Where the flow emits a heartbeat that already names the agent and the iteration**, the heartbeat line *is* the key — the `[<phase> · <unit> · <layer-or-step> · iter <i>] → <agent_name>  (#<total_dispatches>)` line its core's `## Safety contract` prints immediately before the dispatch.
- **Where its heartbeat is coarser than one dispatch** — a per-entry or per-step line carrying no agent name and no iteration — extend it with both: `<heartbeat> → <agent_name> (iter <i>)`. A step that re-dispatches inside a fix loop is several dispatches under one heartbeat, so an un-extended key collides: the second block reads as already present under `## Write point — once per phase, never per dispatch` → **Resume safety** and is silently skipped. Extending the key is a write-time act only — it changes nothing the flow prints, and no flow's heartbeat line is edited to satisfy this.
- **Where it emits none**, the flow's own **step number** plus the agent name and that step's iteration counter. A core that states no safety scaffolding of its own prints no heartbeat, so this fallback is not a rare case — it is how a whole family keys every block it writes.

```markdown
## <dispatch key>
- **added:** `context_notes:` — or `outside the sanctioned form`, which is itself the disclosure of a violation
- **verbatim:** the exact text you passed beyond the block the governing instruction defines
- **why the agent could not derive it:** the artifact the fact is absent from
- **reported back by the agent:** the receiving agent's own `## Unsolicited dispatch guidance` section, copied verbatim (omit this line entirely when the return carried none)
```

**A returned report forces a block, whatever you believe you added.** When a receiving agent's return carries a `## Unsolicited dispatch guidance` section, write the block even where you judge that you added nothing beyond the governing block: set `added:` to `outside the sanctioned form`, or to `nothing — reported by the agent` where you hold the prompt was clean, and copy the agent's section verbatim on the `reported back by the agent:` line either way. In a `nothing — reported by the agent` block the `why the agent could not derive it:` line has no subject — write `n/a` rather than inventing one. Your own judgement about your own prompt is exactly what the report exists to check, so it is not the thing that decides whether the report outlives the session.

**`verbatim:` means verbatim.** A paraphrase of what you added is composed by the same judgement that decided to add it, and it is precisely the wording — an "only", a named flaw class, a "do not" — that decides which side of the boundary an addition fell on. Quote it.

The block is finished when a reader holding **only the committed artifacts** can answer, of the dispatch it names: *was this agent told anything beyond its instruction, and if so, what?* Nothing that fails to serve that question belongs in the block.

## Write point — once per phase, never per dispatch

- **Carry additions in-session and write once per phase.** The write happens at the end of each phase that owes at least one block — an addition made, or a return that carried a report, per `## The entry format` — **before the flow leaves that phase** and before any durable phase-completion marker its fork records for that phase — a write that lands after such a marker is skipped by a resume and lost with it. A write per dispatch would mean a commit per dispatch; that is not this step.
- **A flow with no phase sequence writes once, at its terminal point.** Three of the activating documents have no phases: the two planning loops write once at their `## Convergence`, before the hand-off, and the docs flow — which has no `## Convergence` — writes once before its Done summary, never per entry. Each activating document names its own terminal point; this bullet only fixes the cardinality.
- **A phase that owes no block writes nothing** — no empty block, no empty commit, no note that there was nothing to note. Silence is the ordinary outcome.
- **The honest limit, stated rather than papered over.** Additions made in a phase that pauses before that phase's boundary write are **not recoverable**, exactly as an in-session observation is not: nothing on disk holds them. Writing per phase rather than per run is what bounds that loss to a single phase, and it is the only thing that does.
- **Resume safety.** Read the existing file before appending and **skip any block whose `## <dispatch key>` is already present**. The key is unique per dispatch because every form `## The entry format` allows carries the agent name and the iteration, however the flow spells the rest of it — so a re-entered phase can neither duplicate an entry nor renumber an earlier one. Never rewrite, re-label or reorder a block that is already there.

## Commit mechanics

Commit through the wrapper — `bash <scripts_dir>/commit-on-branch.sh --repo "$REPO_ROOT"` — passing the record file as the **single explicit path**, with the fixed subject exactly as the block below spells it (no variant, no suffix, no round number). No `Co-Authored-By:` / trailer and no `--no-verify` — the wrapper enforces both.

```zsh
bash <scripts_dir>/commit-on-branch.sh --repo "$REPO_ROOT" \
  "<state_dir>/dispatch_additions/${branch}.md" \
  -- "chore: Log dispatch additions for ${branch}"
```

**Write the script-path token exactly as shown — unquoted and repo-relative**, resolved against the worktree cwd the run already starts in. This is the guard-safe spelling `${CLAUDE_PLUGIN_ROOT}/instructions/docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)` documents: a surrounding quote makes the token end in `.sh"`, and an absolute-variable path segment cannot be resolved textually by the script-allowlist guard — either one defeats its path match, so the whole invocation falls through to `ask` and **stalls** a headless run. Being a single unquoted token with no absolute segment is also what lets this invocation transpose to a differently-laid-out checkout unchanged. The args after the script path may be quoted and may carry a plain `$VAR` or `${VAR}`, but nothing the script-allowlist guard's whole-string construct scan reads — `$(…)`, a backtick, `|` (hence `||`), `>`, `<`, or any other braced form — wherever it sits, subject included.

**Why this is not a `committer` dispatch**, the wrapper's **exit 0/1/2/3** contract, and the ⚠️ **no-exit-code-gate** trap are canonical in `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` §1.6 — read them there, and do not restate them here. Two deltas belong to this step and to nothing else:

- **Exit 3 is the expected outcome of a re-entry that appended nothing** — every block this session would write is already in the file. Not an error, not something to retry.
- **An exit 1 or exit 2 on a write to an already-tracked record leaves the tracked tree dirty.** Revert the block you just added **with the file tool**, restoring the file to its committed content — `git restore` / `git checkout` sit in the headless profile's `ask` list, so either would stall the run. On a first write the file is merely untracked and there is nothing to revert. Either way, report the exit code where `## The disclosure line` says.

## Push

**This commit carries its own push — do not leave it to a later step.** In a flow that pushes its commits at all, the push follows the commit **immediately**, as a **plain, single-statement** Bash command, using the same `$REPO_ROOT` the commit above used:

```zsh
bash <scripts_dir>/push-branch.sh "$REPO_ROOT"
```

The script-path token obeys the same guard-safe spelling rule `## Commit mechanics` states above — unquoted and repo-relative — and the call is **unconditional**: never gated on the wrapper's exit status, never wrapped in a shell conditional. That is the ⚠️ **no-exit-code-gate** trap `## Commit mechanics` already points at (`${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` §1.6, which also states why no gate is needed here) — read it there. A flow that pushes **none** of its own commits — one whose fork deliberately leaves them unpushed for a human merge step — issues none here either: this step pushes exactly where the flow it runs in pushes, which is what keeps it family-neutral. A phase that owes no block skips the step whole (`## Write point — once per phase, never per dispatch`), so it issues neither commit nor push.

**Why it is issued here, and where the rationale lives.** A commit that leaves its push to a later step is pushed only where a later pushing step in fact runs, and this step's write points include ones where none does — the last write before a phase boundary, and a no-phase loop's terminal write at its convergence. The register this commit point belongs to, and the invariant its own push preserves, are single-sourced in `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md` → `## Autonomous-fork commit points — the clean-tree invariant (single source of truth)`; read the rationale there rather than restating it.

## Best-effort — never a gate

Any failure at this step — a write error, a wrapper refusal, a push that did not land — is **logged, and the flow proceeds unchanged**. This step must never block "branch ready for review", and it is never a stop condition. Best-effort does not license walking away from a dirty tree: `## Commit mechanics` states what to revert when the commit did not land.

## The disclosure line

The disclosure is **mandatory and affirmative** in the activating flow's Done summary / hand-off, so that *nothing was recorded* and *no record was kept* are distinguishable without opening a file:

`📌 Dispatch additions: <N> recorded → <state_dir>/dispatch_additions/<branch>.md`

or, when this session added nothing to any dispatch prompt **and no return carried a `## Unsolicited dispatch guidance` section**:

`📌 Dispatch additions: none`

— in which case this session writes no file and makes no commit, which is a normal outcome and the one this whole policy is trying to make ordinary. `<N>` is the number of blocks **actually written by this session**: never an estimate, never a count of blocks an earlier session or round already wrote, and never a number that survived a revert. Where the commit did not land, say so on the same line with the wrapper's exit code.

## Activation

Five orchestrating documents activate this file **by pointer**, at the site where each one's orchestrator composes a prompt:

- `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_core.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_core.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_core.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/docs_orchestration_instructions_autonomous.md`

`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` carries the same pointer in its pre-dispatch rule, for the three dispatches it owns — implementer, per-unit reviewer, committer — so a flow reaching a dispatch through the shared loop is bound identically to one reaching it through its own phase.

A citer **points and never restates**: this file stays the canonical policy for the boundary, the sanctioned form and the record alike, and **no document beyond the six named above may activate it.** A document that does activate it may carry the pointer at more than one site — its dispatch composition step, its record write point, its disclosure line, its prohibitions list — because each is a different moment in that flow; what may not multiply is the set of activating documents, and what may never appear at any site is a restatement.

**A mode fork that supplies a core's `<terminal_handoff>` binding value is not a seventh activator.** Where a core's hand-off is a fork-held value, the disclosure line has to be emitted inside that value — that is where the hand-off actually happens — so the fork carries the pointer at its own disclosure site. A fork and its core are **one** document for this purpose: `${CLAUDE_PLUGIN_ROOT}/instructions/mode_contract.md` rule (2) makes neither complete alone, so a fork pointer completes an already-activating core rather than adding a document to the list above.
