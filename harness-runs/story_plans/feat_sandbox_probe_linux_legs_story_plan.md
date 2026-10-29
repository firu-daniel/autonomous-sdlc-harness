# Story: The sandbox probe's Linux legs, in a local container

## Context

This branch extends `scripts/sandbox-probe.sh` and its hand-run gate (Gate 15 in `docs/development.md` → `## 5. Verifying a change`) so a person can measure the unattended sandbox **on Linux, in a local container**, and adds the legs only Linux can answer. **It takes no measurement and records no result.** Every row it adds to `docs/sandbox-verification.md` says *not yet measured*. It changes no profile, generator, wrapper, guard or watcher behaviour. A defect it would expose becomes a follow-up task prompt, F7 and F8 included. `LOOPBACK_ALLOWED_HOST` (`cli/src/generators/sandboxProfile.ts`) stays as it is. No profile the probe measures sets `allowNestedUserNamespaces` or `enableWeakerNestedSandbox`.

**What the probe gains.**

- **A platform.** Preflight refusal 2 now admits Linux as well as macOS and sets `SP_PLATFORM` (`macos` | `linux`). Every Linux-specific behaviour keys on that variable. With it empty or `macos`, every existing function behaves byte for byte as today, so the macOS legs' verdicts on the recorded evidence do not change. The one deliberate macOS change is PD18's fix, which changes evidence text and no verdict.
- **A stamp.** After preflight passes, `run` and `refusal` print the host's versions on stderr: `uname -a`, the distribution, `bwrap`, `socat`, `git`, the agent CLI, the AppArmor sysctl, and whether the caller is root.
- **The judge on Linux.** PD18 is fixed first: the `ran` arm quotes the message under the Bash tool's `Exit code <n>` line. Then `Read-only file system` (EROFS, what a write into a bubblewrap read-only bind mount returns) is added as a sandbox refusal, on Linux only. On Linux, a call expected to be refused that errors with no known refusal string gets the new layer `unrecognised` and prints `not run`, naming the text, never `fail`. Gate 15 says such strings are taken from the first run's kept evidence. Some grades read a plain curl error as their data rather than as a refusal, so for them `unrecognised` falls through to their own logic:
  - N3's grade, on the body;
  - N4's grade, by comparison with its unsandboxed control (Task 22).

  The `loopback` leg sidesteps the question: it judges its curl calls at `ran`.
- **sandbox3a's legs run on Linux unchanged**, under the same row ids. Only `mktemp` and `gates` choose a different row on Linux: `TD4` with TD3's expectation, and `T3`.
- **Five Linux-only legs.** Each is in its own new library file, already on the entry point's source list (Task 2):
  - `glob-deny` (GW1, GW2);
  - `registry` (RG1–RG3);
  - `detached` (BG9, WF5);
  - `loopback` (LB1–LB5);
  - `refusal` (RF1–RF3).
- **How the Linux-only legs are skipped and run.** A default `run` on macOS skips them. `run --leg <one of them>` on macOS prints one `not run` line per row. `refusal` runs only through the new `sandbox-probe.sh refusal` subcommand. That subcommand has its own narrower preflight: refusal 6 inverted, so it needs a Linux host lacking `bwrap` or `socat`. Refusal 6 stays as strict as before for `run`.
- **Hand rows.** The watcher's archive-as-failed refusal (RF4) and `doctor`'s `sandbox-prerequisites` rows (DP1–DP7) are hand rows in the gate. Both change state that the probe's footprint rule ("changes nothing outside its own temp area, the probe clone and the probe branch") forbids it to touch.

**Interpretations this plan takes rather than asks about.**

- **The refusal leg is a separate subcommand, not a hand step.** RF1 and RF3 each need a session launched on the probe clone's per-run profile, which the probe already knows how to cut and judge.
- **The series' `doctor` rows A–E** (`feat_unattended_sandbox_preflight`) are recorded as **DP1–DP7**, one per state the task prompt names: both packages present; `bwrap` absent; `socat` absent; neither; the AppArmor answer; a non-root caller against a root one; a taken opt-out. The checks file that names A–E was not readable from this run.
- **Rows that already have a Linux id keep it** (TD4, T3, BG9, WF5).
- **The Linux results of sandbox3a's rows** are recorded as `<id> (Linux)` rows of a new `## 8. The Linux legs (owed)` section.
- **The new ids are GW, LB, RF and DP.** None collides with an id in use.
- **`--noproxy '*'`** is spelled exactly as the task prompt gives it. If the `*` in its exact `--allowedTools` rule does not match, the call is refused at the permission layer and prints `not run` with that text, which is the evidence a fix needs.

**Cross-task interfaces** (each producer's file defines the contract, and each consumer's file restates the part it calls):

- **Task 1 → Tasks 2, 3, 4, 5, 10.** `sp_platform_of <uname -s>` prints `macos` or `linux`, or nothing with status 1. `SP_PLATFORM` is declared empty in `platform.sh`. `sp_prereq_cmd bwrap|socat` prints the command name looked up, honouring `SANDBOX_PROBE_BWRAP` / `SANDBOX_PROBE_SOCAT`. `sp_stamp` prints the stamp.
- **Task 2 → every later probe task:**
  - the leg table and its rows;
  - `SP_LINUX_ONLY_LEGS`, `sp_leg_linux_only <leg>`, `sp_leg_platform_skip <leg>`;
  - `sp_leg_row_for <macOS row> <Linux row>`;
  - `SP_PREFLIGHT_PREREQ=present|absent`;
  - the source list naming `legs-glob.sh`, `legs-registry.sh`, `legs-detached.sh`, `legs-loopback.sh`, `legs-refusal.sh`;
  - the `refusal` subcommand, which calls `sp_leg_refusal`.
- **Task 3 → Tasks 4, 5, 6–10, 15, 17, 22, 23.** `sp__message_line <text>`. On Linux, `Read-only file system` is layer `sandbox`, and an expected sandbox or network refusal that errors with no known string is layer `unrecognised` with verdict `not run`.
- **Task 22 → Task 23.** `sp__net_n3_grade` and `sp__net_n4_grade` keep their signatures, and on an `unrecognised` judge result fall through to their curl-line logic.
- **Task 7 → Task 18.** `session.sh` gains the pending-restore slot, `sp_restore_register <function> <arg>` / `sp_restore_clear`. `sp_teardown` runs it before its clone loop. RG3 registers `sp__rg_restore <dir>` before its session.
- **Task 9 → Task 19.** The loopback grades judge at `ran`. `sp__lb5_grade` takes a fifth argument, `<listener alive: 1|0|?>`, from a `pgrep -f` after the last outside request.
- **Tasks 4–10 and 22 → Tasks 13–20 and 23.** The grading functions each probe task's file names. Each test task restates the exact signature it drives.
- **Task 2's leg table → Task 11.** Gate 15 restates `--list` row for row.

**Ship order, and why it departs from the configured layer order.** The configured order is `cli → plugin → general`, with the catch-all last. As on `fix_sandbox_probe_round1_findings` and `fix_sandbox_probe_round3_findings`, the `cli` suites test a `general`-layer script, so the dependency runs against that order:

1. Tasks 1–10 and 22 build the probe (`general`). Task 22 ships right after Task 5, the other task that adapts legs to Task 3's `unrecognised`.
2. Task 11 restates Gate 15 (`general`). It ships before the suites because `cli/test/sandbox-probe-git-and-legs.test.mjs` compares Gate 15's leg table with `--list`, and Task 14's own run of that file must pass.
3. Tasks 12–20 and 23 test the probe (`cli`). Task 23 ships right after Task 17.
4. Task 21 adds the rows of record (`general`), last.

Task numbers are ids, not positions. Tasks 22 and 23 were added in revision, and the readiness list below places them in ship order.

**Between those commits some existing cases fail, and that is expected.** Each case below fails from the probe task named until the test task named updates it. Phase G runs the whole suite once, at the end.

| Suite and case | Fails from | Updated by |
|---|---|---|
| `sandbox-probe-shell.test.mjs`, refusal 2's message | Task 2 | Task 13 |
| `sandbox-probe-git-and-legs.test.mjs`, `LEG_ORDER` | Task 2 | Task 14 |
| `sandbox-probe-wrappers-legs.test.mjs`, CW6's PD18 evidence | Task 3 | Task 15 |

**Top risks:**

- **A macOS verdict moves.** Every Linux arm is gated on `SP_PLATFORM` being `linux`, and `judge` and `print-parity-script` default it from `${SANDBOX_PROBE_UNAME:-Darwin}`, so the existing fixture suites grade the same on a Linux CI host. Tasks 15–17 run each Linux fixture twice, once with `SANDBOX_PROBE_UNAME=Linux` and once without, and assert the macOS verdict is unchanged.
- **RG3 moves the live registry's directory.** RG3 deliberately tries to move `<main>/<stateDir>/autonomous_logs` aside from inside the sandbox, and on Linux it might succeed. Task 7 runs RG3 in a session of its own, last. Before launching it, Task 7 registers `sp__rg_restore` in `session.sh`'s pending-restore slot, so `sp_teardown` restores the directory on every exit path: normal, `EXIT`, `INT` and `TERM`. It also restores at once after the session, raising exit 5 when it cannot. It refuses to act on an `.aside` it did not create. Task 18 drives the restore against temporary directories, both directly and through `sp_teardown`.
- **A Linux leg passes on a call that never ran, or on a listener that was gone.** Every new session carries an exact `--allowedTools` rule per measured call and a positive control, so a call refused at the permission layer prints `not run`, never a refusal (PD9 and PD17's lesson). LB5 records *unreachable* only when a `pgrep` after the last outside request finds its listener still running (Task 9). Tasks 18–20 drive a permission-refused fixture through every new grading function, and Task 19 drives LB5's dead-listener case.
- **N3 and N4 go unmeasured on Linux.** Task 3's `unrecognised` arm would turn their plain `curl: (7)` data into `not run`. Task 22 lets both grades read it, and Task 23 holds each Linux case to its macOS twin's output.
- **The refusal subcommand weakens refusal 6.** Task 2 changes check 6 only under `SP_PREFLIGHT_PREREQ=absent`, which only the `refusal` subcommand sets. Task 13 asserts that `run` still refuses on a non-passing `sandbox-prerequisites`.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.**

- The orchestrator walks the `[ ]` entries below top-to-bottom.
- **Only the committing role flips a marker to `[x]`:**
  - the `committer` agent, in every flow that dispatches one;
  - the orchestrator itself, in the supervised flow, which dispatches none.
- No implementer changes a marker, or edits any other line of this section, in an index a run is iterating.
- `[ ]` markers elsewhere, such as the sub-step bullets in per-task files, are informational only. The committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/feat_sandbox_probe_linux_legs/task_<K>_plan.md`.

1. [x] **Task 1** — Add the probe's platform library: `sp_platform_of`, `sp_prereq_cmd` and the stamp _(layer: general)_ _(points: 10)_
2. [x] **Task 2** — Declare the Linux legs and rows, admit Linux at preflight refusal 2, and add the `refusal` subcommand with its narrower preflight _(layer: general)_ _(points: 20)_
3. [x] **Task 3** — Fix PD18 in the judge, and add the Linux refusal string and the `unrecognised` layer _(layer: general)_ _(points: 15)_
4. [x] **Task 4** — Take TD4 with TD3's expectation and T3 in place of TD2 and T2 on Linux _(layer: general)_ _(points: 15)_
5. [x] **Task 5** — Grade the write-protection and git legs' Linux refusals, and print the parity script's Linux expectations _(layer: general)_ _(points: 12)_
6. [x] **Task 22** — Let N3's and N4's grades read an `unrecognised` curl error as their data _(layer: general)_ _(points: 8)_
7. [x] **Task 6** — Add the `glob-deny` leg (GW1, GW2) _(layer: general)_ _(points: 15)_
8. [x] **Task 7** — Add the `registry` leg (RG1–RG3), restoring the registry's directory after RG3 on every exit path _(layer: general)_ _(points: 20)_
9. [x] **Task 8** — Add the `detached` leg (BG9, WF5) _(layer: general)_ _(points: 15)_
10. [x] **Task 9** — Add the `loopback` leg (LB1–LB5) _(layer: general)_ _(points: 20)_
11. [x] **Task 10** — Add the `refusal` leg (RF1–RF3) _(layer: general)_ _(points: 18)_
12. [x] **Task 11** — Restate Gate 15 for macOS and Linux: the leg table, the container recipe, the Linux expectations beside their macOS baselines, the refusal subcommand and the hand rows _(layer: general)_ _(points: 20)_
13. [x] **Task 12** — Test `sp_platform_of`, `sp_prereq_cmd` and the stamp _(layer: cli)_ _(points: 10)_
14. [x] **Task 13** — Test refusal 2 on Linux and the refusal subcommand's preflight _(layer: cli)_ _(points: 15)_
15. [x] **Task 14** — Test the new leg table, the Linux-only skip and the parity script's Linux text _(layer: cli)_ _(points: 10)_
16. [x] **Task 15** — Test PD18's evidence and the judge's Linux layers against recorded streams _(layer: cli)_ _(points: 15)_
17. [x] **Task 16** — Test TD4's grading, the row choice and T3's log strings _(layer: cli)_ _(points: 12)_
18. [x] **Task 17** — Test the write-protection and git legs' Linux grading _(layer: cli)_ _(points: 10)_
19. [x] **Task 23** — Test N3's and N4's grading on Linux against their macOS twins _(layer: cli)_ _(points: 8)_
20. [x] **Task 18** — Test the glob-deny and registry legs' grading and RG3's restore, directly and through teardown _(layer: cli)_ _(points: 20)_
21. [x] **Task 19** — Test the detached and loopback legs' grading _(layer: cli)_ _(points: 20)_
22. [x] **Task 20** — Test the refusal leg's grading _(layer: cli)_ _(points: 12)_
23. [x] **Task 21** — Add the Linux rows of record, each *not yet measured*, and point the existing Linux rows at the legs that take them _(layer: general)_ _(points: 20)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Gate 15 gains these legs, each with its expected result and macOS baseline. `docs/sandbox-verification.md` gains a row for each (a new row id where none exists), marked *not yet measured*."* It is read with the prompt's constraints: *"No measured result is invented. Every row this branch adds says *not yet measured*"* and *"No profile, generator, wrapper, guard or watcher behaviour changes."* So a statement about Linux that no measurement has yet answered stays as it is, and is `no-change`.

**Derivation entry 1 — the record's rows the Linux legs take or compare against (command).** Re-run verbatim from the checkout root:
`grep -nE '^\| (TD3|TD4|T3|WF5|BG2|BG9|CL5|RG1|RG2|RG3|N3|N4|CS8|HP1|F7|F8|PD18|PD19) \|' docs/sandbox-verification.md`

**Derivation entry 2 — durable text naming the Linux deferral or an unmeasured Linux behaviour (command).** Re-run verbatim:
`git grep -nE 'Linux legs|roadmap item 21|Linux is unmeasured|Linux may skip|no Linux host|Linux or WSL2 host|private loopback|probe measures the macOS|sandbox probe \(macOS\)' -- docs README.md ARCHITECTURE.md cli/templates/claude examples/notes-app/.claude/settings.autonomous.json`

**Derivation entry 3 — Gate 15's entry (command).** Re-run verbatim:
`grep -nE '^\*\*Gate 15|^\| Leg \| Rows|^\*\*A leg that does not pass|^\*\*The rows this probe does not take' docs/development.md`

**Derivation entry 4 — where the record's new section and its pointer go, and the stamp lines naming the Linux rows (command).** Re-run verbatim:
`grep -nE '^\*\*Since then\.\*\*|^## 7\. |^\*\*Stamp\.\*\* (TD1|WF1|BG1)' docs/sandbox-verification.md`

**Derivation entry 5 — the lessons ledger (procedure).**
- **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`.
- **Artifact:** that ledger.
- **Traversal:** its topic headings in file order, then each rule under its heading.
- **Decision rule:** a rule is reached when it names a measurement or a document of record, a temporary working copy or process, a bounded retry or wait, or a command a person runs.

**Closure invariant:** every site any derivation entry reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/sandbox-verification.md` → row TD4 | — | entries 1, 2 (`no Linux host`) | `change` | Task 21: Expected changes from the copied `as TD2, on Linux` to TD3's result, citing row TD3. The task prompt says *"TD4's expectation is TD3's, not TD2's."* Observed and Verdict become *not yet measured*, naming the `mktemp` leg that takes it on Linux |
| 2 | row T3 | — | entry 1 | `change` | Task 21: as row 1, the `gates` leg |
| 3 | row WF5 | — | entries 1, 2 | `change` | Task 21: as row 1, the `detached` leg, which takes the GNU `stat -c %Y` arm of `hr_lane_mtime` sandboxed |
| 4 | row BG9 | — | entries 1, 2 | `change` | Task 21: as row 1, the `detached` leg, which takes BG2's shape |
| 5 | row PD18 | — | entry 1 | `change` | Task 21: its follow-up names this branch's fix, not yet confirmed by a run |
| 6 | row TD3 | — | entry 1 | `no-change` | the unsandboxed Linux record TD4's expectation is taken from; Gate 15 and §8 cite it |
| 7 | row BG2 | — | entry 1 | `no-change` | BG9's macOS baseline, cited, not edited |
| 8 | row CL5 | — | entry 1 | `no-change` | macOS record; its Linux row is `CL5 (Linux)` in §8 (Task 21) |
| 9 | row RG1 | — | entry 1 | `no-change` | the macOS record, 2026-10-20; `RG1 (Linux)` is in §8 (Task 21) |
| 10 | row RG2 | — | entry 1 | `no-change` | as row 9, `RG2 (Linux)` |
| 11 | row RG3 | — | entry 1 | `no-change` | as row 9, `RG3 (Linux)` |
| 12 | row N3 | — | entry 1 | `no-change` | macOS record; `N3 (Linux)` and LB1–LB5 are in §8 (Task 21) |
| 13 | row N4 | — | entry 1 | `no-change` | macOS record; `N4 (Linux)` is in §8 (Task 21) |
| 14 | row CS8 | — | entry 1 | `no-change` | macOS record; `CS8 (Linux)` and RF3 are in §8 (Task 21) |
| 15 | row HP1 | — | entry 1 | `no-change` | macOS record; `HP1 (Linux)` is in §8 (Task 21) |
| 16 | row F7 | — | entry 1 | `no-change` | a finding that stands; the prompt routes any change to a follow-up task prompt |
| 17 | row F8 | — | entry 1 | `no-change` | as row 16 |
| 18 | row PD19 | — | entry 1 | `no-change` | the defect is the watcher's and stays open; how to tell it apart in a container is Gate 15's (Task 11) |
| 19 | `docs/sandbox-verification.md` → §6 bullet *How the Linux sandbox treats a `denyWrite` entry containing `*`* | — | entry 2 (`Linux or WSL2 host`) | `change` | Task 21: still not run; it names the legs that take each point and §8 |
| 20 | `docs/sandbox-verification.md` → row CS11 | — | entry 2 (`roadmap item 21`) | `no-change` | the signing measurement, unrelated to the Linux legs |
| 21 | `docs/sandbox-verification.md` → `**Since then.**` paragraph | — | entry 4 | `change` | Task 21: one sentence pointing at §8 |
| 22 | `docs/sandbox-verification.md` → `## 7. Observed on the watcher's own runs` | — | entry 4 | `no-change` | §8 is appended after §7's last paragraph; §7 is unchanged |
| 22a | `docs/sandbox-verification.md` → *The temporary directory*'s `**Stamp.** TD1 …` line (*"TD4 not taken"*) | — | entry 4 | `change` | Task 21: TD4 is owed, and taken by the `mktemp` leg |
| 22b | `docs/sandbox-verification.md` → *The Run gates wait form*'s `**Stamp.** WF1 …` line (*"WF5 not run"*) | — | entry 4 | `change` | Task 21: WF5 is owed, and taken by the `detached` leg |
| 22c | `docs/sandbox-verification.md` → *The Run gates run form …*'s `**Stamp.** BG1–BG6 …` line (*"BG9 not taken"*) | — | entry 4 | `change` | Task 21: BG9 is owed, and taken by the `detached` leg in BG2's shape |
| 23 | `docs/development.md` → `**Gate 15 — the unattended sandbox probe (macOS).**` | — | entries 2, 3 | `change` | Task 11: the heading names macOS and Linux, and the paragraph admits Linux and the `refusal` subcommand |
| 24 | `docs/development.md` → Gate 15's leg table (`\| Leg \| Rows \| Expected \| Recorded in \|`) | — | entry 3 | `change` | Task 11: restated from Task 2's `--list` |
| 25 | `docs/development.md` → `**A leg that does not pass leaves its evidence behind.**` | — | entry 3 | `no-change` | the evidence rule is platform-free and applies to the new legs as written |
| 26 | `docs/development.md` → `**The rows this probe does not take, named so the list is complete.**` | — | entries 2, 3 | `change` | Task 11: the Linux local-container legs move out of the deferral, and the GitHub-hosted runner legs stay owed under roadmap item 21 on `feat_sandbox_probe_job_mode` |
| 27 | `docs/cli.md` → the CS11 signing sentence (*"owed under roadmap item 21"*) | — | entry 2 | `no-change` | unrelated to the Linux legs |
| 28 | `docs/cli.md` → *"Credentials are denied on both sides."* (roadmap item 21) | — | entry 2 | `no-change` | unrelated to the Linux legs |
| 29 | `docs/cli.md` → *"`qa` is unmeasured."* (*"On Linux each sandboxed command has a private loopback"*) | — | entry 2 | `no-change` | LB5 measures it; no result yet, and no measured result is invented |
| 30 | `docs/cli.md` → *"The copy check reads a clone's trust files once."* (*"while Linux is unmeasured"*) | — | entry 2 | `no-change` | `CL5 (Linux)` measures it; still unmeasured |
| 31 | `docs/remote-execution.md` → *"The step has not yet run on GitHub."* | — | entry 2 | `no-change` | the GitHub-hosted runner leg is `feat_sandbox_probe_job_mode`'s and `chore_sandbox_gate12_full_run_leg`'s |
| 32 | `docs/retrieval.md` → *"One gap remains, and it is a platform gap rather than a leg."* | — | entry 2 | `no-change` | docs retrieval's platform gap, unrelated |
| 33 | `cli/templates/claude/settings.autonomous.json` → `_README` *"`allowLocalBinding` IS macOS ONLY …"* | template | entry 2 (`private loopback`) | `no-change` | no profile or generator change (prompt constraint); LB5 measures it, no result yet |
| 34 | `examples/notes-app/.claude/settings.autonomous.json` → the same `_README` line | rendered example | entry 2 | `no-change` | live render of row 33's template, which does not change |
| 35 | `cli/templates/claude/settings.autonomous.json` → `_README` *"TWO RESIDUALS, STATED RATHER THAN HIDDEN: how the Linux sandbox treats the globbed `denyWrite` entries is unverified …"* | template | entry 2 | `no-change` | GW1 and GW2 measure it, no result yet; no profile change |
| 36 | `examples/notes-app/.claude/settings.autonomous.json` → the same `_README` line | rendered example | entry 2 | `no-change` | as row 34 |
| 37 | `cli/templates/claude/settings.autonomous.json` → `_README` *"CREDENTIALS ARE DENIED ON BOTH SIDES …"* (roadmap item 21) | template | entry 2 | `no-change` | unrelated to the Linux legs |
| 38 | `examples/notes-app/.claude/settings.autonomous.json` → the same `_README` line | rendered example | entry 2 | `no-change` | as row 37 |
| 39 | `harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block, one command per line …"* | — | entry 5, a command a person runs | `no-change` | honoured by Task 11: every recipe and gate command sits alone on its line in a fenced block, and the exit status is read by a second line, not by `; echo` |
| 40 | `harness-runs/lessons.md` → *"A figure measured under a test stub or a fixture-sized corpus never justifies a design decision …"* | — | entry 5, measurement | `no-change` | honoured: no fixture result is written as a measurement (Tasks 12–21) |
| 41 | `harness-runs/lessons.md` → *"A feature that ships as "not yet measured" ships the seam that will measure it …"* | — | entry 5, measurement | `no-change` | honoured: every *not yet measured* row Task 21 adds names the leg or hand step that takes it |
| 42 | `harness-runs/lessons.md` → *"A decision rule's outcome is a proposal to the maintainer, not a settled future …"* | — | entry 5, document of record | `no-change` | honoured: no Linux outcome is written into another document as pending work (Tasks 11, 21) |
| 43 | `harness-runs/lessons.md` → *"A wall-clock figure in a document of record is never one a run measured inside its own session …"* | — | entry 5, measurement | `no-change` | honoured: the plan's waits (BG9's 20 s, LB5's 60 s) are bounds, not records, and no task's verification is a timing run |
| 44 | `harness-runs/lessons.md` → *"Every automatic retry in an unattended path is bounded by a count or a deadline …"* | — | entry 5, a bounded wait | `no-change` | honoured: BG9's poll, LB5's outside request and the detached worker are each bounded (Tasks 8, 9) |
| 45 | `harness-runs/lessons.md` → *"A script that creates a temporary working copy or branch removes it on every exit path …"* | — | entry 5, a temporary working copy or process | `no-change` | honoured: every new file and process is registered for teardown (Tasks 6–10). RG3's directory move is registered as a pending restore in `session.sh` before its session launches, so `sp_teardown` restores it on every exit path, normal, `EXIT`, `INT` and `TERM`. It is also restored at once after the session, and an `.aside` the probe did not create is never acted on (Task 7). Task 18 drives the teardown path |
</content>
</invoke>
