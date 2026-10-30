# Story: Move the change-request fence's opt-out command into one shipped, allow-listed script

## Context

`fix_clone_main_repo_resolution` (#214) made the change-request fence resolve the main checkout from a run clone by inlining a compound one-liner into `cli/templates/claude/CLAUDE.md` → `## Where a change request runs`, item **4. Opt-out.** The rule is right; where it lives is not. `CLAUDE.md` is loaded into every agent on every turn while only the interactive main session ever runs the fence; the one-liner is a third copy of the clone check beside `hc_main_root_var` and `hr_clone_target_check_var`; and a compound command carrying `$(…)` matches no literal `Bash(…)` rule, so it can raise a permission prompt in every conversation that asks for a change — and a declined prompt is silence, so the offer is lost. This branch moves the answer into one shipped outer-loop script, `task-offer-check.sh`, shrinks item 4 to the bare invocation, and allow-lists exactly that invocation in the generated `.claude/settings.json`. It is a move, not a rule change: same main checkout, same marker path, same silence cases, apart from the one stricter case the user accepted (below).

**The script and its contract (Task 1).** `cli/templates/scripts/task-offer-check.sh`, written into `<scriptsDir>` like every outer-loop script (`create-if-absent`, mode `0755`, copied verbatim). Called bare, with no argument, from the root of the checkout the session runs in, it prints the main checkout and exits 0 **only** when the offer may proceed; every other outcome exits non-zero with nothing on stdout (1 for every no-offer outcome, 2 for bad usage). It sources `lib/harness-run-lib.sh` and reuses it for every decision that already has a home there: `hr_repo_root` for the checkout, `hr_main_repo` (the first `worktree ` line of `git worktree list --porcelain`, exactly today's non-clone arm) when `<top>/.git/objects/info/alternates` does not exist, and on the clone arm `hr_copy_sync_main_of` for the candidate's main-checkout predicate plus `hr_clone_target_check_var` unchanged for the clone check. **The derivation from `alternates`** — the file holds exactly one line, that line matches `/*/.git/objects`, and the candidate is the line with `/.git/objects` removed — is a function of the script itself, `toc_alternates_candidate`, not of the library. **Why no existing script changes behaviour:** this branch does not edit `harness-run-lib.sh` at all, in either copy, so no existing caller's path through it can change; every task that could touch it verifies `git diff --name-only <base> -- cli/templates/scripts/lib scripts/lib` prints nothing, with `<base>` from a bare `git merge-base HEAD origin/dev`. The script reads no `HARNESS_MAIN_REPO` (the anchor module's rule for outer-loop scripts, and today's one-liner never read it either), and reaches `jq` only on the clone arm, so a main checkout or a linked worktree needs none.

**The two user decisions this plan carries** (`harness-runs/clarifications/fix_task_offer_check_script/answered/answer_1.md`):

- **Q1 (a): the unattended profile gains one protection entry and no grant.** The script is a row of `OUTER_LOOP_SCRIPTS` with `agentInvocable: false`, so `cli/src/generators/writeProtection.ts` → `protectedPaths` gives the main checkout's copy one `sandbox.filesystem.denyWrite` entry and one `Edit` deny rule, exactly as every other top-level outer-loop script has; the profile gains no allow entry. "Gains nothing" is read as "gains no grant". A repository upgrading the CLI sees `doctor`'s `profile-write-protection` warn until its machine-local profile is regenerated — the existing contract for every new protected path.
- **Q2 (a): the script may be stricter than the one-liner for a modified clone.** `hr_clone_target_check_var` additionally refuses a clone carrying a planted `commondir`, `config.worktree` or `http-alternates`, non-directory `objects`, or a `.git/config` key outside its allow-list (for example a hand-run `git push -u`'s `branch.<name>.*`). In the eight layouts the task prompt lists the answers are identical; the stricter case is pinned by its own test (Task 5) and stated in the script's header, together with the Linux case where it bites today: until #219 lands, a Linux run copy can carry leftover `commondir` / `http-alternates` placeholders after a killed session and a `config.worktree` (cause unknown), so the fence is silent there, as the wrappers already refuse that copy. The script also requires the candidate's `.git` to be a real directory rather than a symbolic link, and prints the canonical main checkout rather than the raw `alternates` prefix; both are identical in every listed layout and stated in the header.

**One string, one producer.** The fence item and the allow rule are two views of one string: `cli/src/generators/scripts.ts` → `scriptInvocation`, reached through two helpers Task 1 adds to `cli/src/generators/outerLoopScripts.ts` — `taskOfferCheckInvocation(config)` (`bash <scriptsDir>/task-offer-check.sh`) and `taskOfferCheckRule(config)` (`Bash(<that invocation>)`, exact, with no `:*`, as `MAIN_REPO_ANCHOR_RULE` is). The template therefore takes a placeholder holding the whole rendered command, `{{taskOfferCheckCommand}}` (Task 2), never `bash {{scriptsDir}}/…`: with `scriptsDir` `.` that spelling would render `bash ./task-offer-check.sh` while the rule names `bash task-offer-check.sh`.

**The settings merge, and what `doctor` says (Tasks 3–4).** `.claude/settings.json` stays `merge-json`, missing keys only (`cli/src/core/json.ts` → `mergeMissing` treats an array as a leaf). The payload gains `permissions.allow: [<rule>]`: a file with no `permissions.allow` gets the rule and keeps every other key; a file that already carries a `permissions.allow` list is kept as it stands and `init` warns, naming the rule to add by hand — the same posture `plugin-wiring` takes toward an existing malformed marketplace entry. `doctor` warns when the rule is missing, settled from what it already checks: `task-offer-rules` already reads `.claude/CLAUDE.md` to grade the fence, and `plugin-wiring` already reads `.claude/settings.json`, so the fence's own check gains two `warn` arms that fire only when the project file's fence names the invocation — the script absent at `<scriptsDir>`, and the rule absent from `permissions.allow`. A project file that still carries the one-liner is graded exactly as today.

**Settled and recorded (Task 1's header, Task 7's docs):** a checkout that predates the script — its fence names the invocation and the file is absent — gets `bash: …: No such file or directory`, a non-zero exit and empty stdout: silence, which item 4 already names as a no-offer outcome. A script that is present but older than the template needs nothing: its exit contract is the whole interface, and it is upgraded like every outer-loop script, by `init --force` after a `.bak`.

**Reachability.** The plugin's script-allowlist guard already auto-allows a `.sh` under `scriptsDir` whose basename it does not deny, so an agent can run the script; it is read-only and prints one path, so it joins the guard's documented left-allowed set rather than its deny list (Task 6, comment and README only; no decision changes). An interactive session opened in a run copy runs that copy's own script, which the run could have written — the same trust that copy's `.claude/CLAUDE.md` fence text already carries, so no new exposure.

**Renders (Tasks 8–9).** This repository's root `.claude/` and `examples/notes-app/.claude/` are written by the maintainer, because the tool layer refuses an agent's write under `.claude/**` ahead of any permission entry and an attempted write there can park the run. Those tasks therefore never attempt a `.claude/` write: each records the exact paste, checked against a fresh fixture render, and the maintainer applies it (below). `scripts/task-offer-check.sh` is outside `.claude/` and is copied by Task 8.

**Ship order.** The configured `cli`, `plugin`, `general` order, bottom-up: the script and its table row, the template, the settings merge, `doctor`, then the fence test that grades all four; the plugin's guard-set prose; then the documents and the renders.

**Top risks:** the script answers differently from today's one-liner in some layout or shell — Task 5 runs it in every layout of `cli/test/helpers/run-copy-layouts.mjs` under bash and zsh, with and without `HARNESS_MAIN_REPO`, asserting identical answers, and pins the one accepted stricter case separately. The fence's invocation and the allow rule drift apart, leaving the prompt the branch exists to remove — Task 1 makes both come from one helper pair and Task 3's test asserts `Bash(<fence invocation>)` equals the written rule for two `scriptsDir` values. The renders under `.claude/` never get applied — Tasks 8 and 9 record each paste checked against a fresh fixture render, and the list below carries them.

**Manual setup required:**

- **Paste this repository's root renders** from `harness-runs/task_plans/fix_task_offer_check_script/task_8_plan.md` → `## Paste record`: item 4 of `.claude/CLAUDE.md` → `## Where a change request runs`, and the merged `.claude/settings.json`. `.claude/harness-task-offer.md` is unchanged (its template is). Do it on the branch before merge (depends on Task 8).
- **Paste the worked example's renders** from `harness-runs/task_plans/fix_task_offer_check_script/task_9_plan.md` → `## Paste record`: item 4 of `examples/notes-app/.claude/CLAUDE.md`, `examples/notes-app/.claude/settings.json`, and the three additions to `examples/notes-app/.claude/settings.autonomous.json`; then re-run the two count commands that record names and confirm they print the figures Task 9 wrote into `examples/notes-app/README.md`. On the branch before merge (depends on Task 9).
- **After merge, regenerate the main checkout's machine-local permission profile** (`.claude/settings.autonomous.json`), or add its two new entries by hand: `doctor`'s `profile-write-protection` names them. Until then that checkout's `scripts/task-offer-check.sh` is writable by an unattended run's file tools — the gap Q1 closed (depends on Task 1).
- **Hand-check the prompt is gone:** in an interactive Claude Code session in this checkout, after the pastes above, ask for a code change and confirm the fence runs `bash scripts/task-offer-check.sh` without a permission prompt. No automated test can observe a prompt (depends on Tasks 2–3 and the first item).

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each one to `[x]` when that task's commit lands. **Only the committing role flips a marker**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. An implementer never changes a marker here, and never edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as sub-step bullets in the per-task files, are informational progress markers only; they are never the iteration source, and the committer does not touch them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_task_offer_check_script/task_<K>_plan.md`.

1. [x] **Task 1** — Ship `task-offer-check.sh` as an outer-loop script, with its table row and the one invocation/rule producer _(layer: cli)_ _(points: 20)_
2. [x] **Task 2** — Shrink fence item 4 to the rendered `{{taskOfferCheckCommand}}` invocation _(layer: cli)_ _(points: 10)_
3. [x] **Task 3** — Merge the fence's `Bash(…)` allow rule into `.claude/settings.json` _(layer: cli)_ _(points: 15)_
4. [x] **Task 4** — Warn in `task-offer-rules` when the fence's script or its allow rule is missing _(layer: cli)_ _(points: 15)_
5. [x] **Task 5** — Run the script, not a template command, in every layout under bash and zsh _(layer: cli)_ _(points: 20)_
6. [x] **Task 6** — Add `task-offer-check.sh` to the script-allowlist guard's documented left-allowed set _(layer: plugin)_ _(points: 5)_
7. [x] **Task 7** — State the script, the allow rule and the new `doctor` arms in `docs/cli.md`, `docs/watcher.md` and `docs/guard-verification.md` _(layer: general)_ _(points: 15)_
8. [x] **Task 8** — Self-adopt the script under `scripts/` and record the root `.claude/` paste _(layer: general)_ _(points: 10)_
9. [ ] **Task 9** — Record the worked example's `.claude/` paste and update its README's re-render record _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt:

- Goal 6: *"Update every document that describes the fence's opt-out command or quotes the one-liner (`git grep -n 'objects/info/alternates'` and `git grep -n 'harness-no-offer'`, outside `harness-runs/`). Update the shipped scripts' README with the new script's row."*
- Goal 5: *"Re-render this repository's `.claude/CLAUDE.md` fence section and `.claude/harness-task-offer.md`, `.claude/settings.json`, the new script under `scripts/`, and `examples/notes-app/`, by the forced self-adopt route `docs/development.md` documents."*

**Derivation entries** — every command is run bare from the repository root, read-only, and was executed when this plan was written.

- **D1 — the one-liner's alternates path (command):** `git grep -l -F 'objects/info/alternates' -- . ':!harness-runs'`
- **D2 — the opt-out marker (command):** `git grep -l -F 'harness-no-offer' -- . ':!harness-runs'`
- **D3 — the project settings file and its renders (command):** `git grep -l -F 'enabledPlugins' -- .claude examples/notes-app/.claude cli/templates docs`
- **D4 — the protected outer-loop script reason, as rendered (command):** `git grep -l -F 'the run watcher, the remote job or a person runs the main checkout' -- . ':!harness-runs'`
- **D5 — the script-allowlist guard's allowed and denied sets (command):** `git grep -l -E 'LEFT ALLOWED|left-allowed|stay allowed|DENY_SCRIPT_BASENAMES' -- docs plugin cli/src cli/templates`
- **D6 — the `task-offer-rules` check (command):** `git grep -l -F 'task-offer-rules' -- docs cli/src`
- **D7 — prose enumerating the outer-loop family (command):** `git grep -l -E 'run-analytics(\.sh| script)' -- docs cli/templates/scripts/README.md cli/templates/README.md README.md plugin/docs`
- **D8 — the worked example's re-render record (command):** `git grep -l -F 'A later re-render of' -- examples`
- **D9 — standing ledger rows (procedure).** **Artifact:** `harness-runs/lessons.md` and `harness-runs/improvement_suggestions.md`. **Traversal:** each file's headings in file order, then each one-line entry under them. **Decision rule:** an entry is reached when it names the change-request fence or offer, the opt-out marker, `.claude/settings.json`, the outer-loop script table or the script-allowlist guard's sets. Walked when this plan was written, it reached no entry, so it contributes no row.

**Closure invariant:** every site each derivation entry reaches appears as a row below; a re-run of D1–D8 on the pre-branch tree prints only paths that are rows here. After the branch, D1 and D2 may additionally reach `cli/templates/scripts/task-offer-check.sh`, `scripts/task-offer-check.sh` and Task 3's new test file, which are this branch's own new files rather than missed sites. The one-liner has left the template tree: after Task 2, `git grep -l -F 'worktree list --porcelain | sed' -- cli/templates` prints nothing (before the branch it prints `cli/templates/claude/CLAUDE.md`).

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/claude/CLAUDE.md` → `## Where a change request runs`, item **4. Opt-out.** | template | D1, D2 | `change` | Task 2 |
| 2 | `.claude/CLAUDE.md` → `## Where a change request runs`, item 4 | this repository's render | D1, D2 | `no-change` | The tool layer refuses an agent's write under `.claude/**`; Task 8 records the paste, the maintainer applies it (`## Context` → **Manual setup required**) |
| 3 | `examples/notes-app/.claude/CLAUDE.md` → `## Where a change request runs`, item 4 | worked example's render | D1, D2 | `no-change` | As row 2; Task 9 records the paste |
| 4 | `cli/templates/claude/harness-task-offer.md` → `## Answer 4 — write the marker, then do the work` and the opening paragraph | template | D2 | `no-change` | Names "the path the fence's opt-out command printed", never the one-liner; goal 2 changes it only if it names the one-liner |
| 5 | `.claude/harness-task-offer.md` | this repository's render | D2 | `no-change` | Its template (row 4) is unchanged, so the render is unchanged |
| 6 | `examples/notes-app/.claude/harness-task-offer.md` | worked example's render | D2 | `no-change` | As row 5 |
| 7 | `.gitignore` → the `.claude/harness-no-offer` ignore line | this repository's render | D2 | `no-change` | The marker's path and its ignore rule are unchanged |
| 8 | `cli/templates/repo/gitignore` → the `.claude/harness-no-offer` line | template | D2 | `no-change` | As row 7 |
| 9 | `examples/notes-app/.gitignore` → the `.claude/harness-no-offer` line | worked example's render | D2 | `no-change` | As row 7 |
| 10 | `cli/test/init.test.mjs` → `OUTER_LOOP_SCRIPT_FILES`; the marker ignore-rule assertions | — | D2 | `change` | Task 1 adds the new script to `OUTER_LOOP_SCRIPT_FILES`; the marker assertions are unchanged |
| 11 | `cli/test/task-offer-fence.test.mjs` | — | D1, D2 | `change` | Task 5 |
| 12 | `.claude/settings.json` | this repository's render | D3 | `no-change` | As row 2; Task 8 records the merged file |
| 13 | `examples/notes-app/.claude/settings.json` | worked example's render | D3 | `no-change` | As row 2; Task 9 records the merged file |
| 14 | `docs/analyze.md` → *"The hand-off has two halves"* | — | D3 | `no-change` | About the `enabledPlugins` key in `init`'s closing report; no statement about `permissions` |
| 15 | `docs/development.md` → *"`uninstall` edits committed files in this repository"* and the `--settings` probe | — | D3 | `no-change` | Measured records about `enabledPlugins`; untouched by the new key |
| 16 | `examples/notes-app/.claude/settings.autonomous.json` → `denyWrite`, `permissions.deny`, the write-protection `_README` line | worked example's render | D1, D4 | `no-change` | As row 2; Task 9 records the three additions the new protected path brings |
| 17 | `cli/src/generators/writeProtection.ts` → `protectedPaths`' reason clause and `COPY_GIT_PATHS` | — | D1, D4 | `no-change` | The new row's protection derives from `OUTER_LOOP_SCRIPTS` through the existing filter; the run-copy trust files are not the fence |
| 18 | `cli/src/generators/outerLoopScripts.ts` → `OUTER_LOOP_SCRIPTS`, `OuterLoopScript.agentInvocable` doc comment | — | D5 | `change` | Task 1 |
| 19 | `cli/templates/scripts/README.md` → *"The other family in this directory is not generated."* | template | D7 | `change` | Task 1 |
| 20 | `plugin/hooks/autonomous-script-allowlist-guard.sh` → `# LEFT ALLOWED, DELIBERATELY:` comment | — | D5 | `change` | Task 6 (comment only) |
| 21 | `plugin/hooks/README.md` → `## The deny list`, *"The other outer-loop scripts written into the same directory"* | — | D5 | `change` | Task 6 |
| 22 | `docs/watcher.md` → `## 2. The scripts` table and *"That guard auto-allows the `no` rows …"* | — | D5, D7 | `change` | Task 7 |
| 23 | `docs/watcher.md` → clone-sync and `### The main-checkout anchor` passages | — | D1 | `no-change` | Describe the outer loop's and the plugin's resolution, not the fence |
| 24 | `docs/cli.md` → §3 the `.claude/settings.json` and outer-loop-scripts rows; §5 *"Two families land in `scriptsDir`"*; §7 the `task-offer-rules` row and bullet | — | D5, D6, D7 | `change` | Task 7 |
| 25 | `docs/cli.md` → the clone-check and protected trust-file passages | — | D1 | `no-change` | The clone check is reused unchanged |
| 26 | `docs/guard-verification.md` | — | D5 | `change` | Task 7 appends one dated entry for the comment-only guard edit; earlier entries unchanged |
| 27 | `docs/outer-loop-verification.md` → §3 *"Which outer-loop scripts carry a generated permission entry"* | — | D5 | `no-change` | A dated measurement of the set as it then stood |
| 28 | `docs/sandbox-verification.md` | — | D1, D7 | `no-change` | Dated measurement records |
| 29 | `plugin/docs/AUTONOMOUS_FLOW.md` → the run-analytics row | — | D7 | `no-change` | Names one script's role, not the family |
| 30 | `cli/src/doctor/checks.ts` → `TASK_OFFER_RULES_CHECK` and its doc comment | — | D6 | `change` | Task 4 |
| 31 | `cli/src/doctor/checks.ts` → `PROFILE_MAIN_ANCHOR_CHECK` doc comment | — | D1 | `no-change` | Describes the plugin's `<MAIN_REPO>` fallback, out of scope by constraint 3 |
| 32 | `cli/templates/claude/settings.autonomous.json` → `_README` *"TWO RESIDUALS, STATED RATHER THAN HIDDEN"* | template | D1 | `no-change` | Run-copy trust files, not the fence |
| 33 | `cli/templates/scripts/lib/harness-run-lib.sh` | template | D1 | `no-change` | Reused unchanged (constraint 2) |
| 34 | `scripts/lib/harness-run-lib.sh` | this repository's render | D1 | `no-change` | As row 33 |
| 35 | `cli/templates/scripts/autonomous-watcher.sh`, `create-worktree.sh` | template | D1, D5 | `no-change` | Clone handling and their own deny-list notes; constraint 2 |
| 36 | `scripts/autonomous-watcher.sh`, `scripts/create-worktree.sh` | this repository's render | D1 | `no-change` | As row 35 |
| 37 | `cli/templates/scripts/autonomous-notify.sh`, `scratch-run.sh`, `setup-worktree.sh` → their `DENY_SCRIPT_BASENAMES` notes | template | D5 | `no-change` | Each describes its own guard status, unchanged |
| 38 | `cli/test/clone-trust-check.test.mjs`, `cli/test/profile.test.mjs` → the trust-file assertions | — | D1 | `no-change` | Grade the library and `COPY_GIT_PATHS`, both unchanged |
| 39 | `plugin/hooks/lib/harness-config-lib.sh`, `plugin/instructions/main_repo_resolution.md`, `plugin/scripts/reserve-qa-user.sh`, `plugin/scripts/release-qa-user.sh` | — | D1 | `no-change` | Constraint 3: the plugin's resolution clause and `hc_main_root_var` are out of scope |
| 40 | `scripts/lib/sandbox-probe/preflight.sh` | — | D1 | `no-change` | This repository's sandbox probe reads clone trust files; not the fence |
| 41 | `examples/notes-app/README.md` → the *"A later re-render of …"* sentences and the `/workspace` counts | — | D8 | `change` | Task 9 |
