# Story: Sandboxed git in a Linux run copy, with the sibling-glob trio re-rooted

## Context

`fix_linux_sandbox_deny_placeholders` (#212, merged as #217) removed the per-run copy's **exact** `denyWrite` entries for a clone's `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` on a bubblewrap host. On 2026-10-30, AP1–AP5 were re-taken in Gate 15's container on `dev` at `1a41540c`, on Claude Code 2.1.314 and bubblewrap 0.8.0 (`docs/sandbox-verification.md` §5 → *The route's re-take (owed)*). Sandboxed git in the clone still exited 128 on `failed to read <clone>/.git/commondir: Permission denied`. The per-run profile carries no exact entry for the trio. It still carries the base profile's three **sibling-glob** entries `<work_root>/<projectName>-*/.git/commondir`, `…/.git/config.worktree` and `…/.git/objects/info/http-alternates`, and the clone matches them. So on Linux, Claude Code expands a `denyWrite` glob against the directories that exist when the sandbox starts, and mounts a placeholder at each absent path it yields. Those placeholders are in no manifest, so after a killed session the sweep leaves `commondir` and `http-alternates` on disk, and the launch check refuses the clone for good (AP3).

**The route this plan takes, and why it departs from the prompt's first suggestion.** The prompt suggests leaving the three sibling-glob entries out of the per-run copy on a bubblewrap host, and asks what that costs. Checked against the code, the cost is too high:

- **Sibling copies are writable from a sandboxed command.** The base profile allows `Edit(/<worktree_glob>/**)` (`cli/templates/claude/settings.autonomous.json`), which Claude Code also grants to sandboxed commands. This is derived, not measured on Linux. With the glob rows simply gone, a session could plant `commondir` in **any** sibling `<projectName>-*` clone.
- **The launch check covers a parked run's clone, not every sibling.** A parked run's clone is refused at its next launch or resume: `spawn_engine` runs `hr_run_copy_check_var` on a clone before every launch on a bubblewrap host. A sibling clone the watcher did not make is not covered. Nothing checks it, and a person's unsandboxed git there would follow a planted `commondir` to another repository's configuration and hooks.
- **The one-run cap does not narrow that.** It keeps other **runs** from being live. It does nothing for a sibling no run owns.

So the plan **re-roots** the trio instead of dropping it.

- **On a bubblewrap host, the per-run copy replaces the base's three sibling-glob trio entries with exact entries.** It takes out of `denyWrite` exactly the base entries that carry a `*` and end in one of the three `omit` rows. In their place, it adds an exact `denyWrite` entry, kind `entry`, for that row in every **other** existing sibling directory whose `.git` is a real directory and in which that path's parent directory exists.
  - The run copy itself is left out of the expansion, compared with `-ef`, not by spelling.
  - Every `Edit` rule stays: the base's glob `Edit` rules are not touched.
  - macOS, and every host the placeholder probe answers `0` for, gets a per-run copy byte-identical to today's.
  - Job mode is untouched. It passes the base unchanged, and the job's own checkout is a main checkout, which the glob does not match.
- **The manifest records what every remaining glob yields.** At each spawn, the absent-path manifest takes every exact `denyWrite` entry, as today, **plus** each absent path that every remaining `*` entry expands to at launch. So a glob-made leftover in any sibling, after a killed session, is recorded and swept under the existing five-test rule. The manifest code is shared by both execution modes, so job mode gets this too.
- **What the re-rooting costs, stated as derived residuals.** Each one is in `docs/cli.md` §6, residual 12 (Task 7):
  - a sibling created after the spawn is not covered until the next spawn, where a glob would be expanded at every call;
  - a sibling whose `.git` is not a directory, or whose `.git/objects/info` is absent, gets no entry for the path whose parent is missing;
  - a sibling path carrying a quote, a `*`, a tab or a newline is skipped, not refused;
  - placeholders are still mounted at a sibling's absent trio paths during each call, as the glob mounts them today.
- **Unchanged.** The wrappers' refusal of an existing `commondir`, `config.worktree` or `http-alternates` stays as it is. The launch check stays. The one-run cap stays.

**`config.worktree`.** It is still created as a real `-rw-r--r--` file at session A's start, and its cause is still unknown (`docs/sandbox-verification.md` §0 → **Why `config.worktree` differed: unknown**). On 2026-10-30 the only profile entry naming it was the sibling glob. The re-take after this change is therefore also the control run AP2 lacked: a session whose per-run profile names the clone's `config.worktree` in no `denyWrite` entry, exact or glob. If it still appears, the branch records that in AP2's row and leaves the cause to the upstream report's third ask (`docs/sandbox-placeholder-upstream-report.md`, Task 8). The wrappers keep refusing a clone carrying it, so **the fix is not done while it appears**. Per *The decision rule*, that verdict is a proposal to the maintainer.

**Nothing Linux is claimed from a stub.** Every Linux statement this branch writes rests on a recorded container measurement with its Claude Code and bubblewrap versions: AP2 on 2026-10-30, and GW1 and GW2 on 2026-10-29. Everything else is marked derived or owed. The route's own effect is owed: AP1–AP5 re-taken, and a new AP6 for a sibling clone. The maintainer takes them by hand in Gate 15's container on this branch's head, before merge (Tasks 5–7).

**Cross-task names.** Every task that consumes one of these restates its contract.

- The library's `hr_deny_glob_expand <entry> [<exclude>]` and `hr_profile_deny_paths <profile>` (Task 1).
- The watcher's `run_profile_glob_drops` and the new sibling lines of `run_profile_entries` (Task 2). Task 3's text describes them and ships after them, so no commit documents a drop the watcher does not yet make.
- The absent-path check's `SIB` variable, default `<main>-sbx_sibling` (Task 5).
- `docs/sandbox-verification.md` row AP6 (Task 6).

**Top risks:**

- **A render the launch check then refuses.** `run_profile_check` today requires the base as an exact prefix of the copy, so dropping three base entries refuses every Linux launch unless the check learns exactly that drop. Task 2 guards it in both directions: a case shows the check accepting the placeholder-host render, and another shows it refusing a copy that drops any other base entry. The job-mode check, which passes no run copy, applies no drop.
- **The run copy being re-rooted onto itself.** If the run copy were not excluded from its own expansion, it would get the placeholder back. Task 1 compares with `-ef`, and Task 2 asserts the run copy has no exact trio entry on a placeholder host while a second sibling does.
- **Silent macOS drift.** Task 2 asserts that with the placeholder seam off, the per-run copy and the manifest are exactly today's.

**Manual setup required:**

- **Re-render the notes-app fixture.** After Task 3 lands, re-render the three `_README` lines Task 3 changes in `examples/notes-app/.claude/settings.autonomous.json`: *"THREE COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING"*, *"WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT"* and *"TWO RESIDUALS, STATED RATHER THAN HIDDEN"*. Run them through `examples/notes-app/README.md`'s three substitution clauses, and append one sentence to that README's paragraph *"The one edit the kept artifacts carry, and where it landed."* An unattended run's tool layer refuses any write under a `.claude/` directory ahead of the permission profile (`harness-runs/task_plans/fix_linux_sandbox_deny_placeholders/task_10_plan.md` → `## Disposition`). The README sentence records that edit, so both land together, by hand.
- **Re-take AP1–AP6, by hand, before merge.** Do this in Gate 15's container on this branch's head, with a sibling clone made before the probe starts, as Task 7's Gate 15 addition states. Record the result in Task 6's owed rows, `config.worktree` included.
- **Re-take the rows F9 blocked, after merge, on a record branch of their own.** On Linux, re-take T3, SR1, SR2, CS3, CS4, CL5, R1–R4, C2, K2, CW4, CS15, CS12 and CS14.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker to `[x]`.** That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside the per-task files, are informational progress markers only. They are never the iteration source, and the committer does not touch them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_linux_sandbox_sibling_glob_trio/task_<K>_plan.md`. The entries are ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Add the run library's `hr_deny_glob_expand` and `hr_profile_deny_paths` _(layer: cli)_ _(points: 15)_
2. [x] **Task 2** — Re-root the base's sibling-glob trio at every other sibling on a bubblewrap host, and record every glob's absent paths in the manifest _(layer: cli)_ _(points: 20)_
3. [x] **Task 3** — State the measured Linux glob treatment in the profile's `_README`, the template's residual line and `doctor`'s note _(layer: cli)_ _(points: 15)_
4. [x] **Task 4** — Refresh the self-adopted outer-loop scripts from their templates _(layer: general)_ _(points: 5)_
5. [x] **Task 5** — Teach the absent-path check a sibling clone and the watcher's manifest list _(layer: general)_ _(points: 15)_
6. [x] **Task 6** — Record the glob finding, the re-rooting and the owed re-take with AP6 in `docs/sandbox-verification.md` _(layer: general)_ _(points: 20)_
7. [ ] **Task 7** — Bring `docs/cli.md` §6, `docs/watcher.md` and Gate 15 into line with the re-rooting _(layer: general)_ _(points: 20)_
8. [ ] **Task 8** — Add the 2026-10-30 glob finding to the upstream report _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt's *Also in scope*:

> - The generated `_README` sentence above, and `doctor`'s `profile-write-protection` Linux note. Both should say what was measured: on Linux a glob `denyWrite` entry is expanded, absent paths included.
> - `docs/cli.md` §6's Linux statements on the same point.
> - §5 F9's follow-up cell, and the AP rows' expectations where the route changes them.

The generated `_README` sentence and `doctor`'s note are source code (`cli/src/generators/writeProtection.ts`, `cli/src/doctor/checks.ts`). Task 3 owns both, and neither needs a register row. The register covers the plan's corpus targets.

**Derivation entry — corpus files (command).** Re-run it verbatim from the checkout root:

`git grep -lE 'containing `?\*|may skip|Linux sandbox treats|globbed|sibling-glob|route.s re-take|absent-path check|http-alternates' -- docs README.md ARCHITECTURE.md cli/templates/claude cli/templates/scripts/README.md examples/notes-app/README.md examples/notes-app/.claude/settings.autonomous.json plugin`

**Plan targets the command does not reach** carry the evidence *plan target*.

**Closure invariant:** every file the command prints appears as at least one row below, and so does every corpus file a task creates or edits.

Each task-numbered row below is in **ship-order numbering**: the file of task K is `task_<K>_plan.md`, and the readiness list above is in the same order.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/claude/settings.autonomous.json` → two `_README` lines: *"THREE COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING"*, its clause *"how the Linux sandbox treats a `denyWrite` entry carrying one is unverified"*; and *"TWO RESIDUALS, STATED RATHER THAN HIDDEN"*, its clause *"how the Linux sandbox treats the globbed `denyWrite` entries is unverified"* | template | command entry | `change` | Task 3 |
| 2 | `examples/notes-app/.claude/settings.autonomous.json` → the `_README` lines *"THREE COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING"*, *"WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT"* and *"TWO RESIDUALS, STATED RATHER THAN HIDDEN"* | notes-app rendering | command entry | `no-change` | under a `.claude/` directory, which an unattended run's tool layer refuses to write. Re-rendered by hand: index `## Context` → **Manual setup required** |
| 3 | `examples/notes-app/README.md` → the paragraph *"The one edit the kept artifacts carry, and where it landed."* | — | command entry | `no-change` | it records row 2's edit, so it lands with that edit, by hand (**Manual setup required**) |
| 4 | `docs/sandbox-verification.md` → §5 F9's follow-up cell; §5 *The route's re-take (owed)*: its lead paragraph, AP2, AP3 and AP5's Expected cells, a new AP6 row and *The decision rule*; §6's point *"How the Linux sandbox treats a `denyWrite` entry containing `*`"*; §0 *Why `config.worktree` differed: unknown*; §8 `CS1 (Linux)`'s Expected cell; §8 GW1's Expected cell | — | command entry | `change` | Task 6 |
| 5 | `docs/sandbox-verification.md` → §2 CL1, CL4 and *What the rows settle* (the sibling-glob `.git` rules of 2026-10-19), §2 CS1–CS15's lead paragraph, and the 2026-10-30 AP1–AP5 Observed and Verdict cells | — | command entry | `no-change` | dated records of what was measured. The sibling-glob `.git` entries they name were retired earlier (`retiredProtectedPaths`), and the AP readings stand as taken |
| 6 | `docs/cli.md` → §6 **"Three wrappers run outside the sandbox, each in one spelling."** (its clause *"how the Linux sandbox treats a `denyWrite` entry containing `*` is unverified"*), *"Each run adds its own copy's paths by exact path, in a per-run profile."* and its bullets, residual 2, and residual 12's lead, **What a run cannot rely on** and **Job mode** | — | command entry | `change` | Task 7 |
| 7 | `docs/watcher.md` → `### The per-run profile`: the bullets of **What it adds**, **The launch check**'s third bullet, and **On a bubblewrap host (Linux, WSL2)**'s manifest sentence | — | command entry | `change` | Task 7 |
| 8 | `docs/development.md` → Gate 15, **The absent-path check, by hand.** | — | command entry | `change` | Task 7 |
| 9 | `docs/development.md` → the `npm link` paragraph (*"a reader may skip"*) and the `planted-files` leg row | — | command entry | `no-change` | they match on unrelated words (`may skip`, `http-alternates` as a planted-file name) and make no claim about Linux glob treatment |
| 10 | `docs/sandbox-placeholder-upstream-report.md` → `### Environment`, `### Two placeholders persist on the real filesystem` item 1, `### How to reproduce`, `### Asks` item 3, `## The harness's interim position`, and a new `### A glob entry does the same` | — | command entry | `change` | Task 8 |
| 11 | `plugin/commands/branch-status.md` → the **End-of-branch reviews** bullet | — | command entry | `no-change` | it matches only `may skip` in an unrelated sense and says nothing about the sandbox |
