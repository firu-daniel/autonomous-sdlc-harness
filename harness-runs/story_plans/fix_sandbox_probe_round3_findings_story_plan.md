# Story: Fix the sandbox probe defects the second Gate 15 run exposed

## Context

This branch fixes the probe defects found after the second run of `scripts/sandbox-probe.sh` (2026-10-27; `dev` at `8204260c`, after #188 and #190). After the merge, the next macOS run can then grade the rows that the first two runs passed without proof or never took. The branch **takes no measurement and records no result**. After the merge the maintainer reruns `bash scripts/sandbox-probe.sh run --leg wrappers --leg write-protection --leg network --leg invalid-profile`, then `run --leg headless-parity`, from the main checkout. A later record branch writes what that run settles. That rerun also retakes three rows that need no probe change: CS7's `Edit` half (PD16), the headless-parity checklist (PD15) and the `Read(//<run profile>)` allow rule CS7 relies on. No task here touches them.

**Constraints that bind every task.**

- **No measured result is invented.** A row this branch amends changes only its Check (call) and Expected columns. Its Observed and Verdict cells stay byte-identical. So does every other paragraph of `docs/sandbox-verification.md`, including the §5 F/PD rows' Follow-up cells and the §2 / §6 prose that still calls CS8 (b) a hand row: the record branch after the rerun updates those.
- **No profile, generator, wrapper, guard or watcher behaviour changes.** The probe (`scripts/sandbox-probe.sh`, `scripts/lib/sandbox-probe/*.sh`) is in scope. So are its tests and fixtures (`cli/test/sandbox-probe-*.test.mjs`, `cli/test/fixtures/sandbox-probe/`), Gate 15's entry in `docs/development.md` → `## 5. Verifying a change`, and the amended rows. Nothing under `cli/src/`, `cli/templates/`, `plugin/`, `scripts/lib/harness-run-lib.sh`, `scripts/autonomous-watcher.sh` or the wrappers is edited. CS8 (b) **sources** the watcher read-only, as `session.sh` → `sp__render` already does.
- **The probe's own tests drive every fix against recorded stream fixtures. No test launches `claude`.** Each fix therefore puts its decision in a **named grading function**. The function reads its arguments, a stream file and, where it judges refs, git state through `judge.sh`'s `sp_judge_ref`. It sets a stated pair of variables, so a test can source `core.sh`, `judge.sh`, `controls.sh` and the leg file and call it directly. Each probe task states its function's exact signature, and the test task restates it.
- **Bash 3.2 floor** (macOS `/bin/bash`): no associative array, no `test -v`, no `${var,,}`. `commands.typecheck` (`bash scripts/typecheck.sh`) parses every shell script, and the Run gates phase runs `scripts/run-gates.sh`; both must pass. Fixtures hold no machine path: `@FIXTURE_ROOT@` stands in for every path, as in the existing fixtures.
- **Find every anchor by its quoted text or function name, never by a line number**, including in the docs this branch edits.

**The audit (task prompt, defect 2).** The prompt asked for an audit of every leg whose session issues more than one call under test, or a call carrying an assignment prefix, `${…}`, a compound, or anything else an `--allowedTools` rule may not match. Each such leg must meet two tests: (i) the call has an allow rule that matches it literally; (ii) a permission-layer refusal grades `not run`, never `pass`. Below is every leg the probe declares (`core.sh` → `sp_leg_declare`), with the result. "Profile prefix rule" means the base profile's `Bash(bash <main>/scripts/<wrapper>.sh:*)` entry or its per-run twin, which every per-run copy carries. For a compound, the match is per subcommand: run 1's P1c and CW5 were answered `ran` with no departure.

- **`gates` (T2, W7). In the set** (T2 issues two calls; W7 six, one quoted `'<probe>'`). (i) T2 by `Bash(bash scripts/run-test-suite.sh:*)`. W7 by the script-allowlist guard or the per-run twin, which is what W7 measures. (ii) T2: `not run` (`sp__t2_grade`). W7: the permission layer *is* the layer W7 measures, so a denial is its `fail` by design. **Holds; no change.**
- **`mktemp` (TD2). In the set** (four calls; the `${…}` form was PD3). (i) `Bash(printenv TMPDIR)` exact, and `Bash(mktemp:*)` for the four calls, the explicit one spelled as a literal path. (ii) `not run` (`sp__td2_grade`). **Holds; no change.**
- **`scratch` (SR1, SR2). Outside the set**: one plain call, matched by the profile's `scratch-run.sh` rule. A permission-layer refusal grades `fail`, never `pass`. Not changed.
- **`retrieval` (MC1). Outside the set**: one MCP call, which no `Bash(…)` rule governs. Not changed.
- **`wrappers` (CS4, P3, CW2, P1c, CW5, P1b, CW6). In the set. Falls short.**
  - (i) CW6's `GIT_DIR=<x> …` call has no allow rule: an assignment prefix defeats the profile prefix rule, as P1b's did in run 1 (PD9). Every other call matches: CS4's three by the profile prefix rules, P3 and CW2 by the per-run twins, P1c and CW5 per subcommand, and P1b by its exact `--allowedTools` rule.
  - (ii) `sp__wr_push_held` and `sp__wr_commit_held` grade a permission-layer refusal `pass`, because the refs are unchanged. That reaches P3, P1c and CW5. CW2 and CW6 pass on the same shape inline. CS4 grades it `fail`. Only P1b is screened.
  - **Fixed by Task 2; fixtures in Task 7.**
- **`wrappers-refresh` (R0–R4). Outside the set**: each session issues one plain call, matched by a profile prefix rule or a per-run twin. A permission-layer refusal grades `fail` (R0–R3, R4's fetch) or `not run` (R4 `--local`), never `pass`. Not changed.
- **`planted-config` (C1, CW3, C2, K2, CW4, CS15). In the set through CS15** (two calls). (i) Both match the profile prefix rules. (ii) `sp__pc_refusal` grades a permission-layer refusal `fail` ("the wrapper did not run"), not `not run`. **Falls short. Fixed by Task 4**, in the one function all six rows share; **fixture in Task 10.**
- **`planted-files` (CS12–CS14, L1, L2). Outside the set**: one plain wrapper call per session, matched by a profile prefix rule; L2's call is the probe's own, from the terminal. A permission-layer refusal grades `fail`, never `pass`. Not changed.
- **`write-protection` (CS1, CS2, CS7, W6, W8). In the set** (many calls).
  - (i) The `dd` calls by `Bash(dd:*)`; the rename helper by its exact `Bash(bash <helper>)`; CS7's `Read` by `sp__wp_cs7_read_rule`; `Edit` / `Write` through the file tools.
  - (ii) Most refusals are already handled. The helper's refusal leaves no `sbx_wp_mv` line, so `not run`. CS7's `Edit` is screened (PD16). W6 records a dontAsk refusal inside `.git` as the runtime's guard, neither pass nor fail. But **a `dd` refused at the permission layer grades `fail`** in `sp__wp_judge_row`, the PD3 shape.
  - **Falls short. Fixed by Task 3; fixture in Task 9.**
- **`git` (CS3, CL5). In the set** (eight calls, the commit carrying a quoted subject). (i) Each by a profile rule or the `Bash(<prefix>:*)` departure `sp_leg_git` adds where the profile has none. (ii) The fetch is screened (`sp__git_cs3_fetch`). CS3's other six calls and CL5's `git config` grade a permission-layer refusal `fail`. **Falls short. Fixed by Task 3; fixture in Task 9.**
- **`network` (N1–N5). In the set through the N3/N4 session** (two calls). (i) Every call has an exact `--allowedTools` rule on the network scratch profile. (ii) N1–N4 are `not run` (`sp__net_unlisted`, `sp__net_n3_grade`, `sp__net_n4_grade`). N5 passes a permission-layer refusal by its row's own Expected ("refused at any layer: … a permission-layer refusal"): N5 measures whether the call can widen its own grant, and any refusal answers that. **Holds.** N4's grade changes under defect 4 (Task 5).
- **`retry` (RT1). Outside the set**: one call. It passes a permission-layer refusal by its row's own Expected ("refused at the sandbox, network, permission or file-tool layer"). Not changed.
- **`repo-settings` (RS1). In the set** (three calls). (i) The `curl` by its exact rule, and the retry and write `dd` calls by `Bash(dd:*)`. (ii) The network and write calls are `not run` (pending). The retry half accepts a permission-layer refusal as RT1's Expected does. **Holds; no change.**
- **`credentials` (S1, S2, S4, S5). In the set** (S1's `cat ~/.ssh/config` carries a `~`, and S4's calls a redirect). (i) `Bash(cat:*)` (profile or departure), `Bash(printenv:*)`, `Bash(ssh-add -l)`; the `Read` through the file tool. (ii) S2, S4 and S5 are `not run`. S1 passes a permission-layer refusal by its row's Expected ("refused"): run 2's was the profile's deny rule refusing the read, which is the protection S1 measures. **Holds; no change.**
- **`invalid-profile` (CS8). Outside the set by its shape** (two sessions, one call each). It is checked because Task 6 changes this leg. On `<bad>`, a permission-layer refusal *and* a call never issued are both printed `pass` ("recorded"). **Falls short. Fixed by Task 6; fixture in Task 11.**
- **`headless-parity` (HP1). Outside the set**: no session; it prints the parity script and grades nothing. Not changed.

**CS8 (b) (defect 3) can be driven by the probe.** Before a launch, the watcher's `spawn_engine` calls `run_profile_render`, then `run_profile_check <settings file> <copy>` (`scripts/autonomous-watcher.sh`). `run_profile_check` compares each key of `RUN_PROFILE_SANDBOX_STRICT` with jq's JSON equality, and that key's `sandbox.failIfUnavailable` is the boolean `true`. A string `"true"` is therefore refused, with *"… does not carry sandbox.enabled true, sandbox.failIfUnavailable true and sandbox.allowUnsandboxedCommands false, and names no sandbox opt-out"*. That clause is the first one the check's jq evaluates. The probe already sources the watcher read-only in `autonomous-watcher.sh status` mode to call that same check (`session.sh` → `sp__render`). So CS8 (b) becomes a probe-graded half of the `invalid-profile` leg (Task 6):
- `run_profile_check` runs on a scratch copy of the per-run profile carrying the bad value, under `SP_TMP`, with the unmodified per-run profile as its positive control.
- No run is launched, and the live watcher is untouched.
- The plan finds the check **refuses** such a profile, so there is no watcher finding and no follow-up task prompt. The probe's half will confirm or contradict that on the rerun.

**N4 (defect 4) gets an unsandboxed control from the probe's own shell.** Right after the N3/N4 session, the probe issues the same `curl -sS --max-time 5 http://169.254.169.254/` itself. It runs from its own shell, outside any session and unsandboxed, as L2's call already does, and N4's grade compares the two outcomes:
- **Pass:** a response from the control, or a different curl exit code (for example `(28)`, a timeout, against the session's `(7)`). Same machine, same moment, so the difference is the sandbox's.
- **Not run:** the same code. N4's row then says so.

Elapsed time is not compared: an interface with no link-local route also fails at once, so a fast failure alone cannot separate a refusal from an unreachable host. Nothing is bound to a link-local address. The control's response body is never quoted, only its byte count, because on a cloud host that address serves instance metadata.

**Who owns which file.** Exactly one task owns each file.

- `scripts/lib/sandbox-probe/core.sh` and `docs/development.md` (Gate 15): Task 1.
- `scripts/lib/sandbox-probe/legs-wrappers.sh`: Task 2.
- `scripts/lib/sandbox-probe/legs-protection.sh`: Task 3.
- `scripts/lib/sandbox-probe/legs-planted.sh`: Task 4.
- `scripts/lib/sandbox-probe/legs-network.sh`: Task 5.
- `scripts/lib/sandbox-probe/legs-settings.sh`: Task 6.
- The test suites, each with the fixtures it names:
  - `cli/test/sandbox-probe-wrappers-legs.test.mjs` (new): Task 7.
  - `cli/test/sandbox-probe-remote-legs.test.mjs`: Task 8.
  - `cli/test/sandbox-probe-protection-legs.test.mjs`: Task 9.
  - `cli/test/sandbox-probe-planted-legs.test.mjs` (new): Task 10.
  - `cli/test/sandbox-probe-invalid-profile.test.mjs` (new): Task 11.
- `docs/sandbox-verification.md`: Task 12.

**Cross-task interfaces, stated once.** Each per-task file restates the part it produces or consumes.

- **Task 2 → Task 7:**
  - `sp__wr_reached <stream> <exact command>`
  - `sp__wr_push_held` / `sp__wr_commit_held`, whose signatures are unchanged and which now screen first
  - `sp__wr_cw6_grade <stream> <exact command> <x .git dir> <x ref before> <clone ref before>`, which reads `SP_CLONE` and `SP_BRANCH`
- **Task 3 → Task 9:**
  - `sp__wp_dd_grade <stream> <exact dd command>` → `SP__WP_DD_V` / `SP__WP_DD_E`
  - `sp__git_cs3_call <stream> <exact command>` → `SP__GIT_CALL_V` / `SP__GIT_CALL_E`
  - `sp__git_cl5_grade <stream> <exact command>` → `SP_VERDICT` / `SP_EVIDENCE`
- **Task 4 → Task 10:** `sp__pc_refusal <stream> <exact command> <prefix> <wanted text>` → `SP__PC_RV` / `SP__PC_RE`. The signature is unchanged; a permission-layer refusal is now `not run`.
- **Task 5 → Task 8:** `sp__net_n4_grade <stream> <command> [<control exit> <control line>]`. With the two control arguments absent it behaves exactly as today, byte for byte.
- **Task 6 → Task 11:**
  - `sp__cs8a_grade <stream> <exact command> <marker written: 1|0>` → `SP__CS8A_V` / `SP__CS8A_E`
  - `sp__cs8b_check <watcher script> <profile> <copy>` → `SP__CS8B_RC` / `SP__CS8B_REFUSAL`
  - `sp__cs8b_grade <rc> <refusal> <control rc> <control refusal>` → `SP_VERDICT` / `SP_EVIDENCE`
- **Task 1 → every later task.** The leg table in `core.sh` and its Gate 15 restatement state the changed legs' expectations. Their exact texts are in Task 1's file.

**Ship order, and why it departs from the configured layer order.** The configured order is `cli → plugin → general`, with the catch-all last. As on `fix_sandbox_probe_round1_findings`, the `cli`-layer suites test a `general`-layer script, so the dependency runs against that order. The ship order is:

1. Tasks 1–6 fix the probe (`general`).
2. Tasks 7–11 test it (`cli`).
3. Task 12 amends the record's rows (`general`).

Task 1 ships first because the leg table is the probe's one declaration of what each leg expects (`.claude/context/conventions.md` → *Contract before consumer, always*). Its Gate 15 restatement changes in the same task, because `cli/test/sandbox-probe-git-and-legs.test.mjs` compares the two row for row.

**Interpretations this plan takes rather than asks about.**

- **"Grades `not run`, never `pass`" is read literally.** A permission-layer refusal graded `fail` falls short too: it is PD3's shape, a call that never reached the layer its row measures, printed as a finding. Rows whose own Expected names a permission-layer refusal as the protection they measure (N5, RT1 and RS1's retry half, S1) are left as they are, and the audit says so per leg.
- **Legs outside the audit set are not changed**, even where a permission-layer refusal grades `fail` (scratch, wrappers-refresh, planted-files). The audit lists them with their grade so the next round can choose. The one exception is `planted-config`: its fix is in the shared `sp__pc_refusal`, so it reaches C1, CW3, C2, K2 and CW4 as well as CS15, and Task 12 amends all six Expected cells.
- **CW6's `--allowedTools` rule is the exact call**, `Bash(GIT_DIR=<x> bash <main>/scripts/commit-on-branch.sh --repo <clone> <file> -- "chore: Sandbox probe CW6")`. It is the same form as P1b's, which run 2 showed works, with the subject's quotes and colon inside it. The subject is not changed. If the rule fails to match, the new screen grades CW6 `not run` with the permission layer's own text, which is the evidence a further fix would need.
- **CS8's single line carries both halves.** `fail` when (b) fails. Otherwise `not run` when either half is `not run`. Otherwise `pass`. The evidence reads `(a) …; (b) …`. A failed (a) control no longer stops (b) from being graded.

**Top risks:**

- **A screen that misses a call.** Wrapper calls are checked one at a time, so a missed one keeps a false `pass`. Task 2 routes every measured wrapper call through one helper, `sp__wr_reached`. Task 2's verification greps that `sp__wr_called` has no caller left outside `sp__wr_reached`. Task 7 drives a permission-refused fixture through each of `sp__wr_push_held`, `sp__wr_commit_held`, `sp__wr_reached` (CS4's and CW2's route) and `sp__wr_cw6_grade`.
- **CS8 (b) touching the live watcher.** Task 6 calls the check only in a child `bash -c` that sources `autonomous-watcher.sh status` with all output discarded, exactly `sp__render`'s form. It writes its scratch profile only under `SP_TMP`. Task 11 drives the plumbing against a stub watcher fixture and never against this repository's own watcher.
- **Leg table and Gate 15 drift.** Task 1 changes both in one edit, with texts that carry no `|`, no tab and no double quote. The existing row-for-row test keeps them aligned.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.**

- The orchestrator walks the `[ ]` entries below top-to-bottom.
- **Only the committing role flips a marker to `[x]`:**
  - the `committer` agent, in every flow that dispatches one;
  - the orchestrator itself, in the supervised flow, which dispatches none.
- No implementer changes a marker, or edits any other line of this section, in an index a run is iterating.
- `[ ]` markers elsewhere, such as the sub-step bullets in per-task files, are informational only. The committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_sandbox_probe_round3_findings/task_<K>_plan.md`.

1. [x] **Task 1** — Restate the changed legs' expectations in the leg table and Gate 15, and make CS8 (b) a probe half there _(layer: general)_ _(points: 15)_
2. [x] **Task 2** — Allow and screen CW6's prefixed call, name its answering layer, and screen every measured wrapper call for a permission-layer refusal _(layer: general)_ _(points: 20)_
3. [x] **Task 3** — Grade a `dd`, a CS3 call or CL5's `git config` refused at the permission layer as not run _(layer: general)_ _(points: 18)_
4. [x] **Task 4** — Grade a planted-config wrapper call refused at the permission layer as not run _(layer: general)_ _(points: 8)_
5. [ ] **Task 5** — Grade N4 against the same call issued unsandboxed from the probe's own shell _(layer: general)_ _(points: 15)_
6. [ ] **Task 6** — Add CS8 (b) as a probe-graded half through the watcher's own `run_profile_check`, and grade CS8 (a)'s unreached call as not run _(layer: general)_ _(points: 20)_
7. [ ] **Task 7** — Test the wrappers leg's permission screen and CW6's grading against recorded streams _(layer: cli)_ _(points: 20)_
8. [ ] **Task 8** — Test N4's grading against its unsandboxed control _(layer: cli)_ _(points: 10)_
9. [ ] **Task 9** — Test the write-protection and git legs' permission-layer grading against recorded streams _(layer: cli)_ _(points: 15)_
10. [ ] **Task 10** — Test the planted-config refusal's permission-layer grading against a recorded stream _(layer: cli)_ _(points: 10)_
11. [ ] **Task 11** — Test CS8 (a)'s and CS8 (b)'s grading against recorded streams and a stub watcher _(layer: cli)_ _(points: 15)_
12. [ ] **Task 12** — Amend the call and Expected columns of the rows whose grading this branch changes _(layer: general)_ _(points: 20)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"In scope: the probe, its tests and fixtures, Gate 15's entry in `docs/development.md` → `## 5. Verifying a change`, and the call and Expected columns of the rows it amends."* A row this branch reaches is `change` when the leg that grades it changes what it calls or how a permission-layer refusal grades. Everything else this branch makes stale stays `no-change` under the prompt's *"Rows in `docs/sandbox-verification.md` change only in their call and Expected columns, for the legs this branch changes."*

**Derivation entry 1 — the rows the changed legs grade, and the prompt's named PD and F rows (command).** Re-run verbatim from the checkout root:
`grep -nE '^\| (CS1|CS2|CS3|CS4|CS7|CS8|CS15|C1|C2|K2|CW2|CW3|CW4|CW5|CW6|P1b|P1c|P3|CL5|N4|F7|PD[0-9]+) \|' docs/sandbox-verification.md`

**Derivation entry 2 — Gate 15's entry and its leg table (command).** Re-run verbatim:
``grep -nE '^\*\*Gate 15|^\*\*The rows this probe does not take|^\| `(gates|mktemp|scratch|retrieval|wrappers|wrappers-refresh|planted-config|planted-files|write-protection|git|network|retry|repo-settings|credentials|invalid-profile|headless-parity)` \|' docs/development.md``

**Derivation entry 3 — other prose naming CS8 (b), a hand row, or the link-local host (command).** Re-run verbatim:
`git grep -nE 'CS8 \(b\)|hand row|169\.254' -- docs README.md ARCHITECTURE.md`

**Derivation entry 4 — the lessons ledger (procedure).**
- **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`.
- **Artifact:** that ledger.
- **Traversal:** topic headings in file order, then each rule under its heading.
- **Decision rule:** a rule is reached when it names a measurement or a document of record, a temporary working copy or process, a bounded retry or wait, or a command an adopter runs.

**Closure invariant:** every site any derivation entry reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/sandbox-verification.md` → row CL5 (§2 *The per-run clone (2026-10-19)*) | — | entry 1 | `change` | Task 12 — Expected: a `git config` refused at the permission layer is `not run` |
| 2 | row CS1 (§2 *The clone layout (owed)*) | — | entry 1 | `change` | Task 12 — Expected: a `dd` refused at the permission layer is `not run` |
| 3 | row CS2 | — | entry 1 | `change` | Task 12 — as row 2 |
| 4 | row CS3 | — | entry 1 | `change` | Task 12 — Expected: a call refused at the permission layer is `not run` |
| 5 | row CS4 | — | entry 1 | `change` | Task 12 — Expected: a call refused at the permission layer is `not run` |
| 6 | row CS7 | — | entry 1 | `change` | Task 12 — Expected: a `dd` refused at the permission layer is `not run`; the `Edit` half's wording is untouched |
| 7 | row CS8 | — | entries 1 and 3 | `change` | Task 12 — (b)'s Check becomes the probe's `run_profile_check` form; (a)'s Expected adds the `not run` cases |
| 8 | row CS15 | — | entry 1 | `change` | Task 12 — Expected: a call refused at the permission layer is `not run` |
| 9 | row P1b (§3) | — | entry 1 | `no-change` | its Check already names the exact `--allowedTools` rule and its Expected already grades a permission-layer refusal `not run`; Task 2 keeps its route |
| 10 | row P1c | — | entry 1 | `change` | Task 12 — Expected drops *"or the call is refused at the permission layer"* as a pass, and grades it `not run` |
| 11 | row P3 | — | entry 1 | `change` | Task 12 — Expected: a call refused at the permission layer is `not run` |
| 12 | row C1 | — | entry 1 | `change` | Task 12 — Expected: the wrapper call refused at the permission layer is `not run` (shared `sp__pc_refusal`) |
| 13 | row C2 | — | entry 1 | `change` | Task 12 — as row 12 |
| 14 | row K2 | — | entry 1 | `change` | Task 12 — as row 12 |
| 15 | row CW2 | — | entry 1 | `change` | Task 12 — Expected: a call refused at the permission layer is `not run` |
| 16 | row CW3 | — | entry 1 | `change` | Task 12 — as row 12 |
| 17 | row CW4 | — | entry 1 | `change` | Task 12 — as row 12 |
| 18 | row CW5 | — | entry 1 | `change` | Task 12 — as row 10 |
| 19 | row CW6 | — | entry 1 | `change` | Task 12 — Check names the exact `--allowedTools` rule and P1b's session; Expected grades a permission-layer refusal `not run` and names the answering layer |
| 20 | row N4 (§4) | — | entries 1 and 3 | `change` | Task 12 — Check adds the unsandboxed control from the probe's own shell; Expected states the comparison and the `not run` when the two cannot be told apart |
| 21 | row F7 (§5) | — | entries 1 and 3 | `no-change` | its Follow-up cell calls CS8 (b) *"a hand row"*; after Task 6 that is stale, but only Check and Expected columns change on this branch, so the record branch after the rerun restates it |
| 22 | rows PD3, PD9, PD11, PD16 (§5 *The probe's own defects*) | — | entry 1 | `no-change` | the lessons the prompt cites; their Follow-up cells record past fixes and are not Check or Expected columns; the record branch adds this branch's defects |
| 23 | rows PD1, PD2, PD4–PD8, PD10, PD12–PD15 | — | entry 1 | `no-change` | unrelated to this branch's defects; the record branch, not this one, edits §5 |
| 24 | §2 *The clone layout (owed)* intro paragraph (*"CS5, CS6, CS8 (b) and CS11 stay owed"*) | — | entry 3 | `no-change` | still true until the rerun takes CS8 (b); not a row's Check or Expected column |
| 25 | §2 **Stamp.** line naming CS8 (b) | — | entry 3 | `no-change` | as row 24 |
| 26 | §6 → *Loopback and link-local destinations* bullet | — | entry 3 | `no-change` | it records link-local as unsettled, which stays true until the rerun grades N4 |
| 27 | §6 → the empty-`--settings` bullet (*"CS8 (b), the watcher's refusal, is owed"*) | — | entry 3 | `no-change` | as row 24 |
| 28 | `docs/development.md` → `**Gate 15 — the unattended sandbox probe (macOS).**` paragraph | — | entry 2 | `no-change` | its text names no leg's expectation this branch changes (its *"renders that clone's per-run profile with the watcher's own render and check"* already covers CS8 (b)'s read-only use of the check); the leg table carries the changed expectations |
| 29 | `docs/development.md` → `**The rows this probe does not take, named so the list is complete.**` paragraph | — | entries 2 and 3 | `change` | Task 1 — CS8 (b) leaves the hand rows ("Three" becomes "Two"), and the closing sentence names the `invalid-profile` leg's two halves |
| 30 | Gate 15 leg-table rows `wrappers`, `planted-config`, `write-protection`, `git`, `network`, `invalid-profile` | — | entry 2 | `change` | Task 1 — mirrored from `core.sh` |
| 31 | Gate 15 leg-table rows `gates`, `mktemp`, `scratch`, `retrieval`, `wrappers-refresh`, `planted-files`, `retry`, `repo-settings`, `credentials`, `headless-parity` | — | entry 2 | `no-change` | those legs' grading is unchanged (the audit in `## Context`) |
| 32 | `harness-runs/lessons.md` → *"A figure measured under a test stub or a fixture-sized corpus never justifies a design decision…"* | — | entry 4 | `no-change` | no design decision here rests on a stubbed figure; Task 11's stub watcher tests the plumbing, not the check's verdict, which the rerun measures |
| 33 | `harness-runs/lessons.md` → *"A feature that ships as "not yet measured" ships the seam…"* | — | entry 4 | `no-change` | no row is newly declared measured; amended rows keep their Observed and Verdict cells |
| 34 | `harness-runs/lessons.md` → *"A decision rule's outcome is a proposal to the maintainer, not a settled future…"* | — | entry 4 | `no-change` | CS8 (b)'s finding path is a follow-up task prompt, never pending work written into another document; this plan finds no finding |
| 35 | `harness-runs/lessons.md` → *"A wall-clock figure in a document of record is never one a run measured inside its own session…"* | — | entry 4 | `no-change` | N4's grade deliberately compares no elapsed time, and this branch records no figure |
| 36 | `harness-runs/lessons.md` → *"Every automatic retry in an unattended path is bounded…"* | — | entry 4 | `no-change` | a constraint Task 5 satisfies: N4's control is one `curl --max-time 5`, never retried |
| 37 | `harness-runs/lessons.md` → *"A script that creates a temporary working copy or branch removes it on every exit path…"* | — | entry 4 | `no-change` | a constraint Task 6 satisfies: CS8 (b)'s scratch profile is written under `SP_TMP` by `sp_scratch_profile`, which teardown removes on every exit path |
| 38 | `harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block…"* | — | entry 4 | `no-change` | Gate 15's command block is unchanged; Task 1 adds no inline command |
