### 1. Gate 12 (xiii) leg (d) deletes `<slug>_2` while leg (a)'s run on it is still in flight, so its pass condition is unreachable

**File:** `docs/development.md` (Gate 12 → **(xiii)** → **(d) A name with run history.**). Anchor quote: "Run it after leg (a), while `<slug>` and `<slug>_2` both have runs. Delete `<slug>_2`'s remote branch:"

**The problem.** Leg (a) passes as soon as the second issue's comment names `<slug>_2`. Nothing in (xiii) waits for that run to finish, and (xiii)'s main leg runs to "branch ready for review", which takes hours. So when an operator starts leg (d) "after leg (a)", the `harness run <slug>_2` run is normally still queued or in progress. The leg as written then fails for reasons that have nothing to do with the code under test:

- **The pass line cannot appear.** `previous_bundle_run` in `cli/templates/scripts/remote-run.sh` keeps only `.status == "completed"` runs *before* it applies the lineage filter. The count it prints is `($done | length) - ($kept | length)` over those completed runs only. An in-flight leg (a) run is therefore not counted, `LINEAGE_SKIPPED` is 0, and `verb_restore` prints no `skipped <n> finished run(s) of <slug>_2 from before its current lineage` line. Step 2 requires that line, so the operator records a failure against a correct fix.
- **The deleted branch comes back.** The in-flight job's `Push the branch` step runs under `always()` (`cli/templates/github/workflows/harness-run.yml`) and pushes `<slug>_2` again. Its `continue` step may also dispatch another `harness run <slug>_2` on that branch. Step 2's `remote-run.sh start <slug>_2 …` then either refuses because the branch exists on `origin`, or races the old lineage's next job.

**Fix.** In `docs/development.md` → Gate 12 → **(xiii)** → **(d) A name with run history.**, replace the opening sentence and its single command with the text below. Keep every command in its own fenced block, one per line, per the lessons ledger's adopter-facing-documentation rule.

> **(d) A name with run history.** Run it after leg (a), once `<slug>_2`'s runs have all finished. Stop the run leg (a) started, then list its runs:
>
> ```
> bash <scriptsDir>/remote-run.sh stop <slug>_2
> ```
>
> ```
> gh run list --repo <owner>/<scratch-repo> --workflow harness-run.yml --branch <slug>_2 --json databaseId,displayTitle,status
> ```
>
> Repeat the listing until every `harness run <slug>_2` entry has `status` `completed`. A stopped run is `completed` with conclusion `cancelled`, and `restore` counts it as a finished run. Then delete `<slug>_2`'s remote branch:
>
> ```
> git push --no-verify origin --delete <slug>_2
> ```

Leave steps 1 and 2, their pass conditions, the closing "Record …" sentence and the **Teardown** paragraph as they are. `stop` has to come before the delete because it dispatches its marker with `--ref <slug>_2` (`remote-run.sh` → `verb_stop`), and that needs the branch to still exist on `origin`.
