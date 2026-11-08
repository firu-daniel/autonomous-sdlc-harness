### 2. The new `deliver` job downloads its bundle while the workflow run is still in progress, which §6 records as unverified, but neither §6 nor roadmap item 35 names `deliver` as depending on it

**Sites:**
- `cli/templates/github/workflows/harness-run.yml`, the `deliver` job, step `Download the state bundle`: "if ! gh run download \"$GITHUB_RUN_ID\" --name harness-state --dir \"$RUNNER_TEMP/harness-state\"; then".
- `docs/remote-execution.md` → `## 6. What is not verified here`, the row beginning "An `actions/upload-artifact` artifact, at the major the run workflow pins".
- `docs/development.md` → `## 6.`, roadmap row `35`.

**Problem.** Before this branch, `remote-run.sh deliver` read the bundle that `Save the state bundle` had just written to `$RUNNER_TEMP/harness-state` on the same runner. Nothing was downloaded. The new `deliver` job runs on a fresh runner. It fetches this workflow run's own `harness-state` artifact with `gh run download "$GITHUB_RUN_ID"`. That workflow run is still in progress at that moment, because `collect` (`needs: [run, deliver]`) has not run yet.

This tree records that behaviour as unverified:
- `docs/remote-execution.md` §6 has a row for it: "... downloadable with `gh run download` while its run is still in progress". Its source cell reads "None retrieved".
- `docs/development.md` Gate 12 still lists "(v)'s enable and its in-progress artifact listing" under "What still owes a first recording".
- The §6 row's "What rests on it" cell names only "The poller's post-disable re-check". Its "If it is wrong" cell describes only the poller's consequence.

If the behaviour is wrong, the cost is now much larger than the poller's. A failed download prints `::notice::this workflow run has no harness-state artifact to download, so there is nothing to deliver.` and exits 0. Then `deliver` reads no status and posts nothing. On every completed run:
- the pull request is not flipped ready;
- no `ready_for_review` fires;
- there is no `completed` comment and there are no `done` labels;
- the job stays green.

Roadmap item 35 does not check this download either.

**Who is misled.** Suppose a maintainer measures the §6 row and finds it false. Reading the row as written, they would fix only the poller. They would not learn that every completed run's delivery depends on the same fact.

**Fix.** Documentation only.

1. In `docs/remote-execution.md` → `## 6. What is not verified here`, the row beginning "An `actions/upload-artifact` artifact, at the major the run workflow pins":
   - Change its "What rests on it" cell from "The poller's post-disable re-check, which counts a still-running job carrying a usage-paused bundle as waiting (§3)" to: "The poller's post-disable re-check, which counts a still-running job carrying a usage-paused bundle as waiting (§3); and `harness-run.yml`'s `deliver` job, whose `Download the state bundle` step fetches its own workflow run's bundle while `collect` has not yet run (§11, **The job's credential design.**)".
   - Append to its "If it is wrong" cell: " For `deliver`, the download fails, the step prints a `::notice::` that there is nothing to deliver, and no completed run's pull request is flipped ready, commented on or labelled `done`; the job stays green. Roadmap item 35 records which it is ([`development.md`](development.md) → `## 6.`)."

2. In `docs/development.md` → `## 6.`, roadmap row `35`, insert before "; and, for the record only, since the design does not rely on it," the clause:

   ```
   ; that the `deliver` job's `Download the state bundle` step downloads this workflow run's `harness-state` bundle while the run is still in progress — its log carries no "has no harness-state artifact to download" notice on a completed run — which also takes `docs/remote-execution.md` §6's in-progress-artifact row for `deliver`
   ```

No test changes. These are documentation edits only, so the fix runs no test.

- **Deviations from plan:** Fix step 1's "If it is wrong" append begins with a space, but the existing cell ends "records which it is" with no period, so appending verbatim would have run two sentences together. Implemented as ". For `deliver`, …" (a period inserted before the appended text); the appended text itself is verbatim.
