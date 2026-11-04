# Task plan review — iteration 0

## Must Fix

1. **`task_1_plan.md` — the FR rows' "Read from" column is defined by a task that ships after it, so it is undefined on both sides**
   Task 1 ships first and its implementer reads only `task_1_plan.md` plus the index `## Context`. Its FR bullet tells that implementer to write a **Read from** that "names the surface Task 2's (xvi) names for that row". Task 2 has not landed at that point, and its file is out of the implementer's reach. Only FR4's surface is spelled out (in Task 1's own bullet and in the index's `Top risks:`). FR1, FR2, FR3, FR5, FR6 and FR7 therefore have no defined source. `task_2_plan.md` defers the other way: its **Depends on:** says "Its 'read from' for each FR row must match what Task 1's row names". If its reading of the sources differs, the difference is "named in the unit's return". Task 2 cannot edit `docs/sandbox-verification.md`, which Task 1 owns, so a mismatch between §10 and observation (xvi) would ship. Task 1's **Inputs to read first** also leaves out the shipped sources a Read-from rests on: `cli/templates/github/workflows/harness-run.yml` and `cli/templates/scripts/autonomous-watcher.sh` (`run_profile_check`). Task 2 cites both. This is a cross-task interface that no file defines. The producer leaves the contract to the consumer, and the consumer leaves it back to the producer's body.
   **Fix:** In `task_1_plan.md`, give each of FR1–FR7 a concrete **Read from**, written as "observation (xvi)" plus the surface, using the shipped step names and symbols. For example:
   - FR1: the `Run the harness` step log, with the watcher's launch line carrying `--settings`, `run_profile_check` passing and no `not launching` line.
   - FR2: the `Install the sandbox prerequisites` and `Preflight with doctor` step logs.
   - FR3: the `Run the harness` and `Push the branch` step logs.
   - FR5: the `Refuse a branch that changed the job's own files` and `Record the default branch's commit` step logs.
   - FR6: the `Save the state bundle` step log of the first job and the `Restore the previous job's state` step log of the next.
   - FR7: the resumed job's `Run the harness` log and the committed index.
   
   Add `harness-run.yml` and `autonomous-watcher.sh` to Task 1's inputs. Either fix the same list in the story index's `## Context` → **Shared anchors**, or have `task_2_plan.md` restate it byte for byte as the contract (xvi) carries. Remove the circular "names what Task 2 names" / "must match what Task 1 names" wording from both files.

2. **Index structure (`chore_sandbox_gate12_full_run_leg_story_plan.md`) — the scope register's procedure entry reaches a site that has no row**
   I re-walked the procedure entry "the prompt's records". Its traversal covers "any record its bullets name". Under `sandbox1c`, the §4 bullet names `docs/cli.md` §6, residual 1, as where the `Bootstrap the checkout` exposure is recorded ("is the known residual (`docs/cli.md` §6, residual 1), not a failure"). Residual 1's own sub-item 1 is that statement: **The bootstrap's configured commands, `commands.depInstall` and `commands.build`, run against a run's own manifest**. Under the entry's decision rule, that document-and-section is a candidate site. The register has a row for residual 1, item 5 (row 5) only, and none for residual 1 or its item 1. Disposition (i): every site the entry reaches that is not a row is `docs/cli.md` → `## 6.` → **Residuals, stated rather than hidden:** → residual 1 (its item 1, the bootstrap's configured commands).
   **Fix:** In the story index's `## Scope register`, add a row for `docs/cli.md` → `## 6.` → residual 1, item 1 ("The bootstrap's configured commands, `commands.depInstall` and `commands.build`, run against a run's own manifest"). Give it a disposition and a reason, for example `no-change`: JS4 cites it as the known residual and nothing the branch writes falsifies it. If it is `change`, name the owning task. Under the closure invariant, a later re-walk then finds every reached site as a row.

## Should Fix

1. **`task_2_plan.md` — the last Verification bullet's literal grep cannot match the log strings that carry placeholders.** "`git grep -n -F "<string>" cli/templates` finds each" fails for every quoted log string holding a placeholder: `restored the bundle of run <id>` is `restored the bundle of run $id into $root` in `cli/templates/scripts/remote-run.sh`, and `saved the bundle of <branch>` is `saved the bundle of $branch into $out_dir`. Grep the fixed text before the first placeholder (for example `saved the bundle of`), and say so in the bullet.

## Nice to Have

1. **Story index `## Context`.** The **Shared anchors** and **Cross-cutting rules** blocks are bullet lists. The sample's `## Context` is prose paragraphs. This is no format break, since the index has no `### Sources of truth` / `### Targets`, but the anchor list might sit better as a short paragraph per anchor.
