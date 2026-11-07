# Story: Sandbox honesty paragraphs, true and pointing at the document of record

## Context

This branch (sandbox3d, the last of sandbox3a–3d) rewrites every paragraph that tells a reader what an unattended run contains, so each one states, in a few lines and for its own reader, what the OS-level sandbox now holds and what it still does not, and links the sandbox's document of record, `docs/sandbox-record.md`, for the rest. It then brings the other documents in line with that record. The branch changes prose, comments, one generated `_README` string and one test. **No behaviour changes**: no guard, no deny floor, no `pre-push` hook, no profile entry and no runtime message moves. The only rendered output that changes is the profile's `_README` text.

**Decisions every task builds on.** Each per-task file restates the ones it consumes.

- **The document of record owns the model, the results and the residuals.** `docs/sandbox-record.md` → `## 1. What the sandbox contains, and what it does not`, `## 2. What runs outside the sandbox, and why`, `## 3. The domain list, and what an entry still permits`, `## 4. The measured results, per leg`, `## 6. The residuals` and `## 7. Follow-ups this record names`. `docs/sandbox-verification.md` is the evidence record, one row per check. **No sentence this branch writes is stronger than the record or the row it cites**: where the record says *not yet measured*, *derived from the code* or *recorded (not graded)*, the sentence says so too. A paragraph states the few facts its reader acts on and points at the record for the rest; it never re-walks the record.
- **What the record says the sandbox contains**, which every rewritten paragraph draws on: inside, every Bash command and every process it starts; outside, with the user's full access, the file tools (`Edit`, `Write`, `Read` and the rest), hooks, local MCP servers, plugin monitors, LSP servers, the status line and `apiKeyHelper` (§1, from Claude Code's documentation); the file tools are held by the profile's `Edit` and `Read` deny rules instead (W5, W6, S2, **pass**); four excluded scripts run outside by design (§2); a probe file run through `scratch-run.sh` is a Bash process, and a write outside the sandbox's roots from inside one was refused (§4, the `scratch` leg, SR1 and SR2, **pass** on macOS and in the Linux container); the network is the allowlist, `strictAllowlist` honoured from `--settings` (§3, N1 and N2, **pass**, Linux too); an interactive session matched a headless one on RT1's call (§1, HP1, **pass**); the residuals are numbered in §6, and the measurements still owed are §7's roadmap item 21 bullets (no WSL2 row, MC1 never run, the interactive-test phase unmeasured, residual 3).
- **Citation forms**, as sandbox3c fixed them. Prose cites `docs/sandbox-record.md` → `## N. …` or *§N*, and a residual as *residual N*. A shell comment or a `_README` string, which has no room for a heading, cites `docs/sandbox-record.md §N` or `docs/sandbox-record.md residual N`. A file under `plugin/` cites it repo-relative, never as a `${CLAUDE_PLUGIN_ROOT}` path (`.claude/context/plugin.md` → `## Citation`).
- **Do not shorten a site sandbox3c already reduced to a pointer** (for example `docs/cli.md` → `**Residuals, stated rather than hidden:**`, and every `[`sandbox-record.md`](sandbox-record.md) residual N` citation in `docs/watcher.md` and `docs/remote-execution.md`).
- **Anchors others quote stay byte-identical**: the heading `# WHAT THIS DOES NOT CONTAIN.` (quoted by the scratch README, `docs/watcher.md`, `cli/test/outer-loop-scripts.test.mjs`), `# WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX.`, the whiteboard's `**5. The sandbox**` label, and the bold paragraph leads of `docs/cli.md` §6 that `docs/sandbox-record.md` cites by name. Every anchor in the task prompt and in these plans is found by its quoted text, never by line number.
- **The explainer is sandbox10's.** `chore_unattended_sandbox_doc` writes `docs/sandbox.md` and turns the remaining restatements across the tree into pointers to it. This branch writes no explainer and touches no restating site outside the set the `## Scope register` derives.
- **The self-adopted copies follow their templates byte for byte, in this branch.** The prompt asks `scripts/scratch-run.sh` and `scripts/commit-on-branch.sh` to stay byte-identical to `cli/templates/scripts/…`, so Task 5 applies Task 1's two comment edits to them, and the scratch README's state-directory copy `harness-runs/scratch/README.md` with them. In a run copy (a clone) none of the three is write-protected: the protected set holds the **main** checkout's outer-loop scripts (`cli/src/generators/writeProtection.ts` → `protectedPaths`).
- **The `_README` is rendered, and what pins it is a test, not a `doctor` check.** `doctor` reads one thing from `_README`: `profile-sandbox` (`cli/src/doctor/checks.ts`) tests whether a line starts with `SANDBOX_OPT_OUT_MARKER` (`cli/src/generators/sandboxProfile.ts`), which this branch does not change. The text is pinned by `cli/test/profile.test.mjs`: the case `every path that runs outside the sandbox is write-protected on both sides` pins the generated write-protection line clause by clause, and no case pins a template line today. Task 3 adds the case that pins what Tasks 2 and 3 write.
- **The roadmap rows.** `docs/development.md` → `## 6. The roadmap this tree defers to`, items 22, 23 and 25, are the three sentences sandbox3c deferred. Task 6 fixes the `docs/cli.md` sites, Task 1 and Task 5 the `commit-on-branch.sh` comment, Task 3 the same *"CS2, owed"* in `cli/src/doctor/checks.ts`'s doc comment, and Task 11 marks each row **Shipped.**, adds them to that section's shipped paragraph, and closes the matching `docs/sandbox-record.md` §7 bullets with a *Since then* sentence. Item 21 stays owed: its measurement half is open. Task 11 also corrects shipped row 20's *"has not yet run on GitHub"* to the runner result, as Task 10 does for `ROADMAP.md`, which sets its sandbox row to `In progress` (never `Done`, which would leave index entry 37 listing finished work).

The work is cut by layer, in ship order: the three `cli` tasks (the shipped comments and the scratch README template, the profile template's `_README`, the generated line with its test), the one `plugin` task (the hooks README and the whiteboard), then the `general` tasks — the self-adopted copies, `docs/cli.md` §6, `docs/watcher.md`, `docs/remote-execution.md`, `docs/outer-loop-verification.md` §3, the root indexes, and last the roadmap rows that record what the earlier tasks shipped.

**Top risks:**

- **A sentence stronger than its row.** The record is careful about *measured*, *derived* and *recorded (not graded)*, and a rewrite that drops the qualifier overclaims. Every task's verification re-reads each verdict it writes against the row id it cites, and Task 3's test refuses the one unqualified claim the old `_README` carried (the headless line).
- **A pinned or quoted string broken by a rewrite.** The write-protection line's clauses are pinned verbatim by `cli/test/profile.test.mjs`, and the `WHAT THIS DOES NOT CONTAIN` heading is quoted by three files. Task 3 appends to the generated line and removes no pinned clause; Tasks 1 and 5 keep every heading byte-identical and verify the two copies are identical.
- **The self-adopted scripts refused or a remote job refusing the branch.** In job mode the session's checkout is the main checkout, whose outer-loop scripts are write-protected, and `Refuse a branch that changed the job's own files` compares the outer-loop scripts as job surfaces. Task 5 records a refused edit as its disposition and leaves those copies to the post-merge re-render, below.

**Manual setup required:**

- **After merge, re-render the notes-app example profile's `_README` and record it.** `examples/notes-app/.claude/settings.autonomous.json` is a live file re-rendered whenever a token-carrying template changes (`.claude/context/conventions.md` → `## Documents of record`), and Tasks 2 and 3 change its `_README` lines. An unattended run's write under a `.claude/` path is refused at the tool layer (`harness-runs/task_plans/chore_remove_legacy_worktree_arm/task_10_plan.md` → `## Disposition`), so it is a supervised step: render the profile in a scratch `notes-app` repository with the built CLI, apply `examples/notes-app/README.md`'s three substitution clauses, replace the `_README` lines Tasks 2 and 3 changed and no other byte, and append one *"A later re-render of …"* sentence before *"The file now carries"* in that README. Owner: Tasks 2 and 3.
- **After merge, regenerate this checkout's own untracked `.claude/settings.autonomous.json`** with the self-adopt `init --force`, as earlier sandbox branches did, so the profile a local run here launches with carries the new `_README`. Owner: Tasks 2 and 3.
- **Only if Task 5 records a refusal:** the supervised post-merge re-render of the self-adopted outer-loop scripts (`chore: re-render outer-loop scripts …`, as #294 and #300 did) carries Task 1's comment edits into `scripts/scratch-run.sh` and `scripts/commit-on-branch.sh`. Owner: Task 5.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom.

- **Only the committing role flips a marker to `[x]`.** That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none.
- **An implementer never changes a marker here**, and never edits any other line of this section, in an index a run is iterating.
- **`[ ]` markers anywhere else**, such as sub-step bullets inside per-task files, are informational progress markers. They are never the iteration source, and the committer does not touch them.

Each entry resolves 1:1 to `harness-runs/task_plans/chore_sandbox_honesty_paragraphs/task_<K>_plan.md`. The entries are ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Rewrite `scratch-run.sh`'s `WHAT THIS DOES NOT CONTAIN`, the scratch README's boundary paragraph and `commit-on-branch.sh`'s CS2 citation in the templates _(layer: cli)_ _(points: 15)_
2. [x] **Task 2** — Rewrite the profile template's `_README` lines on what the sandbox contains, leaves open and was measured _(layer: cli)_ _(points: 15)_
3. [x] **Task 3** — Point the generated write-protection `_README` line at the trio guard and the record, pin the new `_README` text in `profile.test.mjs`, and cite CS2's verdict in `checks.ts`'s doc comment _(layer: cli)_ _(points: 18)_
4. [x] **Task 4** — Rewrite the hooks README's containment sentences and the whiteboard's sandbox row, containment list and two other sandbox claims _(layer: plugin)_ _(points: 18)_
5. [ ] **Task 5** — Carry Task 1's edits into the self-adopted `scripts/scratch-run.sh`, `scripts/commit-on-branch.sh` and `harness-runs/scratch/README.md` _(layer: general)_ _(points: 5)_
6. [ ] **Task 6** — Bring `docs/cli.md` §6's containment sentences in line with the record, roadmap items 22, 23 and 25 included _(layer: general)_ _(points: 20)_
7. [ ] **Task 7** — Bring `docs/watcher.md`'s containment sentences in line with the record _(layer: general)_ _(points: 10)_
8. [ ] **Task 8** — Bring `docs/remote-execution.md`'s sandbox-series statuses and post-session containment bullets in line with the record _(layer: general)_ _(points: 15)_
9. [ ] **Task 9** — Add the paragraph on what the sandbox changes after `docs/outer-loop-verification.md` §3's measurement _(layer: general)_ _(points: 8)_
10. [ ] **Task 10** — Add the sandbox to `README.md` → `## Scope and limits`, and bring `ROADMAP.md`, `llms.txt` and the README's index line in line _(layer: general)_ _(points: 12)_
11. [ ] **Task 11** — Mark roadmap items 22, 23 and 25 shipped, close their `docs/sandbox-record.md` §7 bullets, and correct row 20's install-step status _(layer: general)_ _(points: 12)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"rewrites every paragraph that describes what the unattended run contains, so each one states what the sandbox now holds and what it still does not, and points at the sandbox's document of record rather than restating it. It then brings the other docs in line with that document."* — with goal 2's *"any sentence that describes containment says what the document of record says, or links it"* and *"Find the restating sites with a search you record, so the scope can be re-derived. Do not shorten a site that sandbox3c already reduced to a pointer."*

**Derivation entry A: the named honesty paragraphs (procedure).**

- **First step, runnable** from the checkout root:

  ```
  git grep -n -I -F -e "WHAT THIS DOES NOT CONTAIN." -e "Two boundaries an agent does not cross" -e "**5. The sandbox**" -e "## Scope and limits" -e "WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX" -- scripts/scratch-run.sh cli/templates/scripts/scratch-run.sh cli/templates/state-dir/scratch/README.md harness-runs/scratch/README.md plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md README.md cli/templates/scripts/commit-on-branch.sh scripts/commit-on-branch.sh
  ```

- **Artifact:** the task prompt's `## The goal`, item 1's bullet list, plus item 2's named `commit-on-branch.sh` comment.
- **Traversal:** each bullet in order; for each, every copy the bullet names (template and self-adopted), then each hit of the command above in that file.
- **Decision rule:** a site is the paragraph the bullet names, one row per copy. For `plugin/hooks/README.md`, which the bullet names with no anchor, a site is each sentence that states what bounds what an unattended run's commands or scripts can reach. For the whiteboard, the named row plus any paragraph of the same file that enumerates the run's containment layers.

**Derivation entry B: the profile's `_README` lines (procedure).**

- **First step, runnable:** `jq -r '._README[]' cli/templates/claude/settings.autonomous.json`, then `git grep -n "appendReadme(" -- cli/src/generators` for the generated lines.
- **Artifact:** the template's `_README` array and each generated line.
- **Traversal:** the template array in order, then each `appendReadme` call site.
- **Decision rule:** a line is reached when it states what the sandbox contains or leaves outside, what runs outside it, or a sandbox behaviour as measured, unmeasured or unresolved.

**Derivation entry C: containment sentences in the other documents (procedure).**

- **First step, runnable:**

  ```
  git grep -n -I -i -E "sandbox|containment|not yet measured|owed" -- docs/cli.md docs/remote-execution.md docs/watcher.md docs/outer-loop-verification.md ROADMAP.md llms.txt README.md plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md plugin/hooks/README.md docs/development.md docs/sandbox-record.md
  ```

- **Artifact:** the files named, with `docs/development.md` read only in `## 6. The roadmap this tree defers to` and `docs/sandbox-record.md` only in `## 7. Follow-ups this record names`.
- **Traversal:** each hit in file order, read as the whole sentence or table row it sits in.
- **Decision rule:** a hit is reached when its sentence (a) states what the unattended sandbox contains, leaves outside or holds, or (b) gives a status — *owed*, *not yet measured*, *derived … until … is taken*, *to be recorded*, *unresolved* — for a sandbox row or behaviour that `docs/sandbox-verification.md` or `docs/sandbox-record.md` now records differently, or (c) is one of roadmap items 21–25 or a §7 bullet naming them. A hit about host prerequisites, `doctor`'s grading, a non-sandbox measurement (`sandbox1h`, the main-checkout anchor, the daemon) or a citation sandbox3c already reduced to a pointer is not a row unless (a)–(c) also hold; a pointer is listed below only where a reviewer could read it as a candidate.

**Derivation entry D: standing-artifact rows (procedure).**

- **First step, runnable:** `grep -n -i -E "sandbox|containment" harness-runs/lessons.md harness-runs/improvement_suggestions.md harness-runs/README.md`
- **Artifact:** those three standing files. **Traversal:** each hit, in file order. **Decision rule:** a line is reached when it states what the sandbox contains. **Result at planning time:** every hit names a branch (`fix_linux_sandbox_…`) in an attribution, so it contributes no row.

**Derivation entry E: the strings roadmap items 22, 23 and 25 name, over the whole tree (command).** Re-run verbatim from the checkout root:

```
git grep -n -I -E "CS2, owed|CS6, owed|RG1, RG2 and RG3\)|RG1–RG3 owed|until AP9 is taken|this round's Finding 6|\(Linux, WSL2\) the gate launcher is the fourth" -- . ':(exclude)harness-runs'
```

Every hit is a site and owes a row: it is strictly wider than entries A–C for these strings, reaching source comments and the record's body, which those entries do not read. `harness-runs/` is excluded because its plans and reviews quote the strings; the self-adopted scratch README under it carries none of them.

**Closure invariant:** every site entries A–E reach appears as a row below. Each owning task's verification re-runs the entry that reached its rows over its own files and confirms every reached hit is a row.

**`Copy`:** `template` is a file under `cli/templates/`; `self-adopted` its `init` copy in this checkout (`scripts/`, `harness-runs/`); `rendered example` the notes-app fixture's rendered profile; `—` a site with no mirrored counterpart. Sites outside the files these entries search are sandbox10's (`chore_unattended_sandbox_doc`, goal 3).

| # | Site (path + symbol or quoted anchor) | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/scripts/scratch-run.sh` → `# WHAT THIS DOES NOT CONTAIN.` | template | A | `change` | Task 1 |
| 2 | `scripts/scratch-run.sh` → `# WHAT THIS DOES NOT CONTAIN.` | self-adopted | A | `change` | Task 5 |
| 3 | `cli/templates/scripts/scratch-run.sh` → `# THE REFUSAL IS THE WHOLE OF THE SAFETY` | template | A | `no-change` | States the script's own path test, which bounds which file runs; true as written, and the rewritten paragraph above it carries the sandbox |
| 4 | `cli/templates/state-dir/scratch/README.md` → *"Two boundaries an agent does not cross."* paragraph | template | A | `change` | Task 1 |
| 5 | `harness-runs/scratch/README.md`, same paragraph | self-adopted | A | `change` | Task 5 |
| 6 | `cli/templates/scripts/commit-on-branch.sh` → `# WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX.`, *"the whole-`.git` deny itself is row CS2, owed"* (roadmap item 22) | template | A, E | `change` | Task 1 |
| 7 | `scripts/commit-on-branch.sh`, same comment | self-adopted | A, E | `change` | Task 5 |
| 8 | template `_README` → *"THE PROBE ROUTE GRANTS AN INTERPRETER AT ONE REMOVE"* | template | B | `change` | Task 2 |
| 9 | template `_README` → *"THE SANDBOX IS STRICT"* | template | B | `change` | Task 2 |
| 10 | template `_README` → *"THE NETWORK ALLOWLIST IS EMPTY BUT FOR THIS REPOSITORY'S OWN PART"* | template | B | `no-change` | Matches record §1 and §3 as written; row 9 carries the outside list and the pointer |
| 11 | template `_README` → *"`strictAllowlist` IS SET, AND SETTING IT FROM THIS FILE IS HONOURED"* | template | B | `change` | Task 2 — cites macOS alone where the record has Linux and the runner |
| 12 | template `_README` → *"WHETHER A HEADLESS `-p` SESSION HONOURS ALL OF THIS EXACTLY AS AN INTERACTIVE ONE DOES IS UNRESOLVED"* | template | B | `change` | Task 2 — HP1 is **pass** |
| 13 | template `_README` → *"FOUR COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING"* | template | B | `change` | Task 2 — one pointer sentence |
| 14 | template `_README` → *"`allowLocalBinding` IS macOS ONLY"* | template | B | `no-change` | True as written (record §3, N3 and N3 (Linux)) |
| 15 | template `_README` → *"THE NETWORK-CLIENT DENIES ARE A SECOND LAYER"* | template | B | `no-change` | True as written (record §3) |
| 16 | template `_README` → *"TWO RESIDUALS, STATED RATHER THAN HIDDEN"* | template | B | `change` | Task 2 — becomes the residual pointer line |
| 17 | template `_README` → *"CREDENTIALS ARE DENIED ON BOTH SIDES"* | template | B | `no-change` | Its one unmeasured clause (`~/.npmrc`, `~/.gitconfig`, `~/.zshenv`) is still owed under roadmap item 21, as the record says |
| 18 | template `_README` → *"`autoAllowBashIfSandboxed` IS false ON PURPOSE"* | template | B | `no-change` | States a grant surface, not containment |
| 19 | generated line, `cli/src/generators/writeProtection.ts` → `applyWriteProtection`, *"WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT"* | — | B | `change` | Task 3 — appended clause only; every pinned clause stays |
| 20 | generated lines, `cli/src/generators/sandboxProfile.ts`, `ALLOWED DOMAIN <host>` | — | B | `no-change` | Repeats the adopter's own reason; no containment claim |
| 21 | generated line, `cli/src/generators/sandboxProfile.ts`, `SANDBOX_OPT_OUT_MARKER` line | — | B | `no-change` | True as written, and `doctor`'s `profile-sandbox` keys on its prefix |
| 22 | `examples/notes-app/.claude/settings.autonomous.json` → `_README`, the lines of rows 8, 9, 11, 12, 13, 16 and 19 | rendered example | B | `no-change` | A `.claude/` write is refused unattended; the post-merge supervised re-render (Manual setup required) carries them |
| 23 | `examples/notes-app/README.md` → the *"A later re-render of …"* chain | — | B | `no-change` | Written with that re-render, never before it |
| 24 | `plugin/hooks/README.md`, the `autonomous-script-allowlist-guard.sh` row, *"This is the capability containment for an unattended run."* | — | A, C | `change` | Task 4 |
| 25 | `plugin/hooks/README.md` → `## The deny list`, *"The last of them executes an *argument*, and is allowed on a narrower ground"* | — | A | `change` | Task 4 |
| 26 | `plugin/hooks/autonomous-script-allowlist-guard.sh` header, *"capability containment for an unattended run"* | — | C (reached through row 24's anchor) | `no-change` | Outside the searched files; a guard edit is re-measured in `docs/guard-verification.md` (`.claude/context/plugin.md`), so it is sandbox10's pointer pass |
| 27 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → `**5. The sandbox**` row (including its *"six `PreToolUse` guards"*) | — | A | `change` | Task 4 |
| 28 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → **The prompt is data, not instruction.**, *"The containment underneath — the deny floor, the protected-branch backstop, the script allowlist, no deploy and no bare push"* | — | A, C | `change` | Task 4 |
| 29 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → *"The protected-branch guarantee is ranked honestly"* and *"The protected-branch guarantee is a backstop, not a floor."* | — | C | `no-change` | Rank the string guard against the git hook, which the sandbox does not alter; `scratch-run.sh` and `docs/outer-loop-verification.md` §3 cite the first by name |
| 30 | `README.md` → `## Scope and limits` | — | A | `change` | Task 10 |
| 31 | `README.md` → `## Where to read more`, the `docs/sandbox-verification.md` line | — | C | `change` | Task 10 — kept in step with row 59 |
| 32 | `docs/cli.md` `### The sandbox block and the permission mode`, the paragraph **The unattended profile runs every Bash command, and every process it starts, inside Claude Code's OS-level sandbox, in strict mode.** | — | C | `change` | Task 6 |
| 33 | `docs/cli.md` §6, **The network.** | — | C | `change` | Task 6 |
| 34 | `docs/cli.md` §6, **The domain list ships empty but for one conditional entry.** | — | C | `no-change` | Record §3 cites it as the owner of the exfiltration statement; true as written |
| 35 | `docs/cli.md` §6, **Four scripts run outside the sandbox, each in one spelling.**, *"row CS2, owed"* (item 22) and *"On a bubblewrap host (Linux, WSL2) the gate launcher is the fourth"* (item 25) | — | C, E | `change` | Task 6 |
| 36 | `docs/cli.md` §6, **The excluded rule's `:*` accepts any argument…** | — | C | `no-change` | Record §2 cites it as the owner of the checks; its one *owed* (CS11) is still owed |
| 37 | `docs/cli.md` §6, **Everything that runs outside the sandbox is write-protected on both sides**, *"(derived from the code until AP9 is taken)"* and *"to be recorded in `docs/sandbox-verification.md` §5 by this round's Finding 6"* (item 23), and *"is owed (`docs/sandbox-verification.md`, rows RG1, RG2 and RG3)"* (item 22) | — | C, E | `change` | Task 6 |
| 38 | `docs/cli.md` §6, **Each run adds its own copy's paths by exact path, in a per-run profile.**, *"to be recorded in `docs/sandbox-verification.md` §5 by this round's Finding 6"* (item 23) | — | C, E | `change` | Task 6 |
| 39 | `docs/cli.md` §6, **A remote job passes the base profile, checked, and its checkout's `.git` stays write-denied.**, *"row CS6, owed"* (item 22) | — | C, E | `change` | Task 6 |
| 40 | `docs/cli.md` §6, **Credentials are denied on both sides.** | — | C | `no-change` | Its unmeasured clause is still owed under item 21 |
| 41 | `docs/cli.md` §6, **Unresolved, and planned around rather than decided:** | — | C | `change` | Task 6 — HP1 is **pass** |
| 42 | `docs/cli.md` §6, **Which configurable phases run under the sandbox:**, *"`qa` is unmeasured."* | — | C | `no-change` | Matches record residual 3 |
| 43 | `docs/cli.md` §6, **Residuals, stated rather than hidden:** | — | C | `no-change` | sandbox3c's pointer; not shortened |
| 44 | `docs/watcher.md`, **Why only the `yes` rows carry a profile entry, and why that is not the reachability answer.**, *"That is a bound on command strings, not on the run."* and the sentences after it | — | C | `change` | Task 7 |
| 45 | `docs/watcher.md` `### The per-run profile`, **What it adds.**, *"to be recorded in `docs/sandbox-verification.md` §5 by this round's Finding 6"* | — | C, E | `change` | Task 7 |
| 46 | `docs/watcher.md`, the sibling-trio bullet, *"its effect predicted, AP1–AP7 and the `dd` row owed"* | — | C | `change` | Task 7 |
| 47 | `docs/watcher.md`, *"These scripts run outside the sandbox, and a run's working copy is a tree a sandboxed session wrote"* | — | C | `no-change` | True; record §2 cites this file as the owner of the pins |
| 48 | `docs/watcher.md` §4, the clamp paragraph's quoted log line `docs/cli.md §6)` | — | C | `no-change` | A runtime string (roadmap item 32); no behaviour change on this branch |
| 49 | `docs/watcher.md` §4, **`PERMISSION_MODE` defaults to `dontAsk`.**, *"which is what holds where `strictAllowlist` is not honoured"* | — | C | `no-change` | Conditional and true |
| 50 | `docs/remote-execution.md` `## 6. What is not verified here`, the opening paragraph's *"the last four rows are taken by Gate 12's sandbox series round: the first three of them not yet measured, and the fourth measured in round 13"*, and those four rows (FR1, RJ2, RJ3, and the `actions/checkout` v7.0.1 row's FR3 and CS6 (runner)) | — | C | `change` | Task 8 — FR1 and RJ2 state the job session's containment; RJ3 and the checkout row change with them because the opening sentence states all four |
| 51 | `docs/remote-execution.md`, **The post-session steps on a job that passed.**, *"all *not yet measured*"* (FR6, SB2, SB3, SB4) and *"the unverified run-copy globs"* | — | C | `change` | Task 8 |
| 52 | `docs/remote-execution.md`, **The check on a real GitHub job is a post-release follow-up, not yet run.**, *"It is taken, still not yet run"* (FR5, JS1, JS3, JS3N, JS4) | — | C | `change` | Task 8 |
| 53 | `docs/remote-execution.md`, **Residual: `Bootstrap the checkout`'s configured commands…** | — | C | `no-change` | sandbox3c's pointer |
| 54 | `docs/remote-execution.md` §8, the sandbox-prerequisites install step paragraphs | — | C | `no-change` | Host prerequisites, not containment; their statuses match §9's rows |
| 55 | `docs/outer-loop-verification.md` §3, **The consequence, stated as the measurement.** | — | C | `change` | Task 9 — its text stays; a paragraph is added after it |
| 56 | `ROADMAP.md` → `## Security and containment`, row *"OS-level sandbox in the autonomous profile"* (status `Open`) | — | C | `change` | Task 10 |
| 57 | `ROADMAP.md`, row *"`doctor` sandbox checks"*, *"(not yet run on GitHub)"* | — | C | `change` | Task 10 — IS1–IS4 **pass** on the runner |
| 58 | `ROADMAP.md` → `## Documentation`, row *"Threat model"*, *"allowed commands such as tests, builds and the dev server run agent-written code with the user's full rights"* | — | C | `change` | Task 10 |
| 59 | `llms.txt`, the `docs/sandbox-verification.md` line, *"measured by hand, with each failing row's follow-up"* | — | C | `change` | Task 10 |
| 60 | `llms.txt`, the `docs/sandbox-record.md` line | — | C | `no-change` | Matches the record |
| 61 | `docs/development.md` §6, row 22 | — | C | `change` | Task 11 |
| 62 | `docs/development.md` §6, row 23 | — | C, E | `change` | Task 11 |
| 63 | `docs/development.md` §6, row 25 | — | C, E | `change` | Task 11 |
| 64 | `docs/development.md` §6, the paragraph opening **Items 3, 4, 13 and 14 have shipped** | — | C | `change` | Task 11 |
| 65 | `docs/development.md` §6, row 21 | — | C | `no-change` | Its measurement half is still owed (record §7); a partial-ship note is the maintainer's call |
| 66 | `docs/sandbox-record.md` → `## 7. Follow-ups this record names`, the bullets naming roadmap items 22, 23 and 25 | — | C, E | `change` | Task 11 — a *Since then* sentence each |
| 67 | `docs/sandbox-record.md` §7, the other bullets (items 21, 24, 26–34) | — | C | `no-change` | Not fixed on this branch |
| 68 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → the blockquote opening *"A headless multi-agent development system built on an agent runtime's plugin surface."*, *"launches a sandboxed headless session"* | — | C (a) | `change` | Task 4 — record §1 sandboxes the session's Bash commands, not the session (file tools and hooks run outside) |
| 69 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → **Isolating the interactive-test phase is the hard part of running several at once.**, *"that tree is the one shared directory a sandboxed command in any of them is allowed to write"* | — | C (a) | `change` | Task 4 — restated as the profile's one write grant beyond the sandbox's defaults (`docs/cli.md` → `### The sandbox block and the permission mode`), not as the only shared writable path |
| 70 | `docs/watcher.md` → **The pins.**, *"never a local ref, which a sandboxed session can write"* and *"`refs/replace/` and `info/grafts` are sandbox-writable too"* | — | C (a) | `no-change` | True as written: the run copy is a sandbox write root, and record residual 9 keeps a clone's `info/` and other `.git` files sandbox-writable |
| 71 | `docs/cli.md` §6 → the paragraph opening *"It lives at `${XDG_STATE_HOME:-$HOME/.local/state}/…`"*, *"every other root the profile lets a sandboxed command or a file tool write"* | — | C (a) | `no-change` | True as written: the machine state directory is neither the run copy nor the state directory, the profile's one `allowWrite` grant |
| 72 | `cli/src/doctor/checks.ts` → the doc comment above `SANDBOXED_WRAPPER_CONSEQUENCE`, *"`docs/sandbox-verification.md` CL4, and CS2, owed"* (item 22) | — | E | `change` | Task 3 — *"CS2, pass"*; doc comment only, no `doctor` output changes |
| 73 | `docs/development.md` §6, row 20, *"the install step **has not yet run on GitHub**, and its first real run is item 21's full-run leg"* | — | C (b) | `change` | Task 11 — record §4 `runner-install` IS1–IS4 **pass**, `docs/sandbox-verification.md` §10 FR2 **pass** (round 15); kept in step with row 57 |
| 74 | `docs/cli.md` §7 → **`remote` is a failure, and it is the check that can make a freshly wired repository exit non-zero.**, *"never takes the base from a local ref, which a sandboxed session can write"* | — | C (a) | `no-change` | True as written, for the same reason as row 70 |
| 75 | `docs/sandbox-record.md` residual 9, *"(derived from the code until AP9 is taken)"* | — | E | `no-change` | The record's body as written at the time, followed by its own *Since then* sentence (the record's convention for a later change); the fix is recorded at row 66 |
| 76 | `docs/sandbox-record.md` residual 12 → the **Job mode** lead, *"a job-mode-shaped session is `docs/sandbox-verification.md` CS6, owed"* | — | E | `no-change` | As row 75: the residual carries a *Since then* sentence |
| 77 | `docs/sandbox-record.md` residual 13 → the **What that sandbox holds** bullet *"the main checkout as `--bind`'s target only in job mode"*, *"(RG1–RG3 owed)"* | — | E | `no-change` | As row 75: the residual carries a *Since then* sentence |
