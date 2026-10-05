# Task plan review — iteration 0

## Must Fix

1. **D5 misses a gate-count site: `docs/development.md` → `## 5. Verifying a change` opens with "Thirteen gates."** — story index (`fix_forge_run_control_gate12_round7_findings_story_plan.md`, `## Scope register`) and `task_8_plan.md`.
   Re-running derivation entry D5 word for word reaches `docs/development.md` ("Seven of the thirteen run unattended"), `scripts/run-gates.sh` (header, "defines thirteen gates … gates 1, 2, 3, 4, 6, 11 and 13") and the `hand_run=` line. All of them are rows 16 to 18. It does not reach the first sentence of `## 5. Verifying a change`, which reads `Thirteen gates. Run each **without a pipe** and read the exit status: …`. D5's pattern `thirteen gates|of the thirteen|…` is case-sensitive, so the capitalised "Thirteen gates." falls outside it. Task 7 adds gate 14, so that sentence becomes false. No row covers it, and Task 8's `### Targets` and `**Work:**` name only the "**Seven of the thirteen run unattended**" paragraph. Task 8's own verification grep, `git grep -nE "thirteen|Seven of the" -- docs/development.md`, is case-sensitive as well. It would pass with "Thirteen gates." still standing.
   A case-insensitive search for `thirteen` across `docs`, `scripts`, `README.md`, `ARCHITECTURE.md`, `cli/README.md` and `plugin` turns up no other gate-count site. The `plugin/hooks/allow-safe-compounds.sh` hits are about the profile's verbs, not gates.
   **Fix:** In the story index:
   - Replace D5 with a strictly wider, case-insensitive command, for example `git grep -niE "thirteen gates|of the thirteen|gates 1, 2, 3, 4, 6, 11 and 13|5, 7, 8, 9, 10 and 12" -- docs scripts README.md ARCHITECTURE.md cli/README.md`.
   - Add a row for `docs/development.md` → `## 5. Verifying a change` → its opening sentence ("Thirteen gates."), with disposition `change` and owner Task 8.

   In `task_8_plan.md`:
   - Add that sentence to `### Targets`.
   - Add a `**Work:**` step turning it into "Fourteen gates.".
   - Make the verification grep case-insensitive (`git grep -niE "thirteen|seven of the" -- docs/development.md`), so it finds no hit that refers to §5's gate count.

## Should Fix

1. **`task_8_plan.md` / story index — the claim that no sentence of the Round 7 paragraph becomes untrue.** The paragraph's finding 1 ends "No gate parses the rendered workflows.", and Task 7 adds exactly that gate. Its finding 3 says `forge_report` "checks whether the branch was stopped for `failed` alone", which Task 5 changes. The prompt says to "adjust the wording only where this branch's fixes make a sentence untrue, and say so in the plan". The round 5 and round 6 records show the house pattern: the paragraph is kept, and a sentence saying which branch addressed each finding is added (round 6: "The defects (findings 1–8) and the two open questions were then addressed by `fix_forge_run_control_gate12_findings`"; round 5: "For finding 1, `fix_forge_trigger_run_lineage` bounded … — *not yet re-observed*"). Either follow that precedent with one appended sentence, or argue in the index why present-tense finding descriptions are exempt. As it stands, the plan's reason ("its findings say they are carried to this branch, which is true") does not engage these two sentences.

2. **`task_3_plan.md` — a repair together with a replacing `--upgrade-workflows` prints contradictory text.** When `workflows.upgrade?.replaced === true` and the control copy is repaired in the same run, two things go wrong:
   - `reportWorkflowUpgrade` already prints `git diff --no-index <path>.bak <path>` for every `replacedWorkflows` entry, the control file included. The repair block then prints the same diff line a second time.
   - The upgrade block says "The .bak files are ignored by the managed .gitignore block, so git add -A leaves them out". Task 2 deliberately leaves the control `.bak` out of that block, so that sentence is false for it.

   State in Task 3 how the combined case reads: no second diff line, and the repair block's "this `.bak` is not ignored" sentence is the one that holds for the control file. Assert it in case 2.

## Nice to Have

1. **`task_4_plan.md`** — `### Targets` places `WORKFLOWS_ENDPOINT` "beside `PR_SETTING_ENDPOINT`", while `**Work:**` places it "beside `ARTIFACT_RETENTION_ENDPOINT`". Pick one.
2. **`task_5_plan.md`** — the fresh listing guards `round` correctly when `run_by_sha_var` found the dispatched run. When that lookup gave up after `TRIGGER_RUN_LOOKUP_TRIES`, a branch whose newest `harness stop` is newer than every listed `harness run` reads as stopped, and a legitimate `round` is withheld. Consider a sentence on that edge, or a case for it.
3. **`task_4_plan.md`** — `?per_page=100` reads one page. A path that is absent from the listing is simply not judged, which is safe. A sentence saying so in the doc comment would stop a later reader from treating "not listed" as "listed by name".
