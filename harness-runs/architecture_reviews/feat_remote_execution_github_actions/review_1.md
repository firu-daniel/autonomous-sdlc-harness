# Architecture review — iteration 1

All four Must Fix findings from iteration 0 are resolved in the plan:

- Tasks 3 and 4 now amend the library header's write-exception list.
- Tasks 5, 6 and 10 document the new registry fields and the full `pause_reason` vocabulary, `killed` included, in the watcher's field-set comment.
- Tasks 18 and 19 define both checks in `cli/src/doctor/checks.ts` and put `pathAtRef` in `core/git.ts`.
- Task 14 leaves root resolution in the generator and gives `pluginRootEntries` the inputs the doctor builder really depends on.

The two Must Fix findings below are new. Both have the same shape as iteration 0's finding 1: the change breaks a rule that a module header states, and the plan does not name that header as a target.

## Must Fix

1. **Task 14 breaks two stated rules in `permissionProfile.ts`'s header without amending it.** Offending file: `task_14_plan.md`. Rules violated:
   - `.claude/context/cli.md` → `## What "done" means here`: *"A reviewer holds a change to its module's own header. Where the header states a rule, the change either satisfies it or amends the header in the same edit"*.
   - `.claude/context/cli.md` → `## How a module in this layer is written`: *"`WritePolicy`'s values are the whole vocabulary — a generator wanting different behaviour is asking for a different re-run contract, which is a decision for `cli/src/core/writer.ts`'s table and not for the call site"*.
   - `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one"*.

   `cli/src/generators/permissionProfile.ts` → `## What this module deliberately does not do` states two rules that Task 14 would make false:
   - *"It touches no filesystem beyond reading its two templates — and, on a forced run, the profile it is about to replace."* Task 14 adds two new reads on an **unforced** run: the generator resolves plugin roots through `resolvedPluginRoots`, and it checks whether the profile exists at `join(repoRoot, PROFILE_PATH)` to decide "create path".
   - *"It does not allow-list the interactive-test phase's own helper scripts … The resolving is therefore done at check time rather than here … Whether `init` should also *write* those entries is an open owner decision rather than a closed one; nothing here takes it."* Task 14 takes that decision for an opt-in flag and writes exactly those `Read` and helper `Bash` entries.

   The task prompt does authorise the decision (`### Running the harness in a job` → *"Decide how the job gets a profile … The profile also needs the `Read(//…/plugin/**)` entry"*). So the problem is the unamended header, not the behaviour. None of the Targets or Work bullets in Task 14 name either header bullet.

   The planned create-path test is also a problem. The generator predicts the write engine's `create-if-absent` outcome itself: "absent, or `force`". That is a second copy of a decision `writer.ts` owns, and the planned `'kept'` outcome depends on it.

   On a `--force` run with the flag set, the generated entries also land beside the entries `carriedPluginRootEntries` carries forward for the same roots. That gives two producers of the same `allow` line. The header's browser-fragment section states the rule this breaks: *"one producer per entry"*.

   **Fix:** In `task_14_plan.md`:
   - Add `cli/src/generators/permissionProfile.ts` → the module header's `## What this module deliberately does not do` section to **Targets**, naming the two bullets.
   - Add a Work bullet that amends the header in the same edit:
     - The filesystem bullet names the new reads under `--plugin-root-entries`.
     - The helper-scripts bullet records that the owner decision is taken for the opt-in `init --plugin-root-entries` only, with the reason: inside a job the plugin is installed immediately before and the profile dies with the job. Its default stays unchanged, for the reasons the bullet already gives.
   - Replace the generator's own "absent, or `force`" test. Use one of these two routes and name it:
     - **(a)** Always append the entries when the option is on. Take `written` versus `kept` from the write engine's own result for `PROFILE_PATH`, which is `WriteEffect` `'created'` / `'backed-up-and-replaced'` versus `'kept'`. Report the note from that result.
     - **(b)** Import a predicate that `writer.ts` exports for the `create-if-absent` decision, adding it there with a row in its header table.
   - State that on a forced run the generated entries are de-duplicated against the carried-forward ones, so each `allow` line has one producer.
   - Add a verification line: `grep -n "open owner decision" cli/src/generators/permissionProfile.ts` shows the amended wording.

2. **Tasks 10, 11 and 12 make rules in the watcher's header false, and only add new paragraphs beside them.** Offending files: `task_10_plan.md`, `task_11_plan.md`, `task_12_plan.md`. Rule violated: `.claude/context/cli.md` → `## What "done" means here`: *"Where the header states a rule, the change either satisfies it or amends the header in the same edit — a header a review reads as a guarantee is worth exactly what the code under it still does."*

   The header of `cli/templates/scripts/autonomous-watcher.sh` states these as unqualified guarantees:
   - *"The watcher knows only about inbox files, working copies, central logs, the run registry …, the concurrency cap, the kill switch, and exit notifications."* Tasks 11–12 add dispatching to GitHub Actions and relaying to it. Task 9 adds a job mode.
   - *"THE TWO RESUME PASSES, the only ones that bring a run BACK … Both re-launch the SAME engine in the run's EXISTING working copy … through `spawn_engine`"*. Task 12 makes both passes **dispatch** for a remote record instead of re-launching. Task 10 adds a third path that brings a run back: job mode's bounded auto-resume.
   - Under THE USAGE GATE: *"WHILE A PAUSE IS IN EFFECT THE HOLD MARKER IS UP, which is what defers a fresh inbox drop"*. Task 11 dispatches a remote drop through the hold.
   - Under the lane paragraph: *"the three passes that START work (a fresh inbox drop, a park resume, a pause resume) CONSULT that record before acting"*. Tasks 11–12 skip the lane for remote drops and remote resumes.

   Task 11's Targets name only `WHAT IT COMMITS` and a new `REMOTE DISPATCH` paragraph. Task 12's name only that new paragraph. Task 10's name no header prose at all. A new paragraph elsewhere leaves each sentence above still reading as a guarantee.

   **Fix:**
   - In `task_11_plan.md`, add to **Targets** the header's opening "knows only about" sentence, the hold-marker bullet under THE USAGE GATE, and the lane paragraph's "three passes that START work … CONSULT" sentence. Add a Work bullet that qualifies each one in place: the watcher also dispatches to GitHub Actions when `execution.target` is `github-actions`; a remote drop is dispatched through the hold and does not consult the lane. Each qualification points at `REMOTE DISPATCH`.
   - In `task_12_plan.md`, add the `THE TWO RESUME PASSES` sentence to **Targets**. Qualify it in place: for a remote record each pass dispatches instead of re-launching, and it neither consults the lane nor holds a cap slot.
   - In `task_10_plan.md`, add the same `THE TWO RESUME PASSES` sentence to **Targets**. Name job mode's bounded auto-resume as the one other path that brings a run back, local to a job and pointing at the `JOB MODE` block.
   - Give each of the three tasks a verification grep over those sentences showing the qualification, for example `grep -n -E "knows only about|the only ones that bring a run BACK|defers a fresh inbox drop|CONSULT that record" cli/templates/scripts/autonomous-watcher.sh`, with each hit followed by its remote qualification.

## Should Fix

- **Carried from iteration 0, not yet addressed: `task_15_plan.md` still re-spells `retrievalApplies`.** The workflow still reads "whether retrieval applies from `harness.config.json` with `jq`", and `cli/src/config/model.ts` → `retrievalApplies` says *"Declared once, here … Import it; do not re-spell it"*. Name the exact `jq` expression in the template header as a declared mirror, and add the template to `retrievalApplies`' doc comment. Alternatively, restore the cache unconditionally and let `init` decide.
- **Carried from iteration 0, not yet addressed: `task_26_plan.md` still credits Task 2 with names Task 2 does not own.** `HARNESS_MAX_CHAIN`, `HARNESS_SELF_PAUSE_AFTER_MINUTES` and `HARNESS_STEP_TIMEOUT_MINUTES` are still called "Task 2's", and its verification checks them against "Task 2's constants", but `task_2_plan.md`'s export table does not carry them. The same applies to `HARNESS_REMOTE_SLUG` and `HARNESS_JOB_MODE`. Either add them to Task 2's table with their shell and YAML mirrors, or have Tasks 26 and 29 name `harness-run.yml`'s header and `remote-run.sh`'s header as their owners and verify against those.
- **Carried from iteration 0, not yet addressed: `harness-state` is used in `remote-run.sh` without being declared a mirror.** Task 2's header lists `remote-run.sh` as a mirror of `STATE_ARTIFACT_NAME`. Tasks 6, 7 and 8 use `-n harness-state`, but Task 5's mirror declaration and its verification grep cover only `harness-run.yml` and `HARNESS_GH_CLI`. Add `harness-state` to Task 5's declared mirrors and grep.
- **The remote state bundle has two declared formats of record.** Task 4 makes the library section `THE REMOTE STATE BUNDLE` state the layout *"as the format of record"*. Task 24's new `plugin/docs/AUTONOMOUS_FLOW.md` owner row says *"the harness repository's `docs/remote-execution.md` is its format of record"*, and Task 28 re-describes the layout and the `status.json` keys there. That breaks `.claude/context/conventions.md` → *"A responsibility that already has a home does not get a second one"*. Keep one owner. For example, `docs/remote-execution.md` is the design record and cites the library section for the format, and Task 24's row says the same.
- **`task_6_plan.md`: the logs-directory README gets its readers sentence fixed, but its writers sentence stays false.** `cli/templates/state-dir/autonomous_logs/README.md` also says *"Everything here is written by the run daemon"* and enumerates the directory's contents. After Tasks 4–8, `remote-run.sh` writes `registry.json`, `remote_status.json`, `remote_download/`, `remote_superseded/` and `<branch>.remote.log` there. Add the writers sentence and the contents enumeration to Task 6's Targets.
- **`task_15_plan.md`: the measurement's home.** `.claude/context/conventions.md` → `### Where a new responsibility goes` puts *"a measured fact or a decision of record"* in `docs/`. The plan writes the measurement's command, date and figures into the shipped template's header, and Task 28 restates them in `docs/remote-execution.md`. That makes two copies, and the recorded command names this repository's own `harness-runs/autonomous_logs/` inside a file every adopter receives. The watcher template does carry short measured justifications in its header, so a one-line provenance note in the template is precedent. The full record belongs in `docs/remote-execution.md` → `### Runs longer than a job`, and the template should cite it: the derived default, plus a pointer to that section.

## Nice to Have

- Iteration 0's note still stands: between Task 5 and Task 21, `remote-run.sh` is in the shipped table with `agentInvocable: false` but is not yet on `DENY_SCRIPT_BASENAMES`. Task 5 names Task 21 as the one that adds the entry. One sentence saying that no adopter receives the script before the branch merges would make the half-built window explicit.
