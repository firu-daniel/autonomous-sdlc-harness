# cli review — 3. Storage and artifact retention are uncovered, and an expired state bundle is silently treated as a first job — iteration 0

Verification run: `node --test cli/test/remote-run.test.mjs` → 67/67 pass, including the five new expired-bundle cases. `node --test --test-name-pattern=remote-github cli/test/doctor.test.mjs` → 20/20 subtests pass. That doctor run used the existing `cli/dist` (built 11:11, after `cli/src/doctor/checks.ts` at 11:10). `npm run build` / `tsc` could not be re-run in this review because the permission prompt declined it, so the compile is confirmed only through that dist.

## Should Fix
1. **sync case 4 still reads an older expired bundle as "no bundle ever", so it records `failed` with a false detail** — `cli/templates/scripts/remote-run.sh` (`verb_sync`) — "if has_bundle \"$older\"; then bundle_exists=1; break; fi"
   Case 4/5 scans the older finished runs with `has_bundle`, which filters `(.expired != true)`. Take a record never synced (`remote_run_id` empty) whose newest finished run left no artifact while an older run's bundle has expired. It falls through to case 5: `status: failed`, `remote_detail` "no run of $branch ever uploaded a state bundle". That is false: a bundle was uploaded and has since expired, and the ledger is intact, so the run is resumable with `/autonomous-sdlc-harness:branch-resume` like case 2. This is the same expired-read-as-absent confusion the finding exists to remove, one branch further down. The plan's letter covers only the newest run, so this is a gap in scope rather than a deviation. Confirmed by reading the code only; no probe was run for this path.
   **Fix:** in the case-4 older-run loop, call `bundle_state "$older"` and set `bundle_exists=1` when `BUNDLE_STATE` is `present` or `expired`. That route gives the record `paused` / `killed`, which is resumable. Add a test beside "no bundle in any run and an empty remote_run_id syncs as failed" with an older run's artifact listed `expired: true`, asserting `paused` rather than `failed`.

## Nice to Have
1. **The "not asked" pass line of `remote-github` omits the new retention read** — `cli/src/doctor/checks.ts` (`REMOTE_GITHUB_CHECK`) — "to ask GitHub about the secrets, variables and workflows a remote run needs"
   `--check-github` now also reads the repository's artifact retention. The default-run sentence that says what the flag would ask still lists only secrets, variables and workflows.
   **Fix:** append "and the repository's artifact retention" to that sentence.
2. **Unwrapped long line in the `restore` SELECTS header paragraph** — `cli/templates/scripts/remote-run.sh` (header) — "job continues from the committed ledger. An unexpired one it downloads to"
   The edited paragraph leaves one line well past the header's wrap width.
   **Fix:** reflow the paragraph to the surrounding width.

---

# general review — 3. Storage and artifact retention are uncovered, and an expired state bundle is silently treated as a first job — iteration 0

The `general` layer review shares iteration 0 and this folder with the `cli` layer review above. It is appended below that review instead of replacing it, because writing `review_0.md` from scratch would have deleted the `cli` layer's Should Fix and Nice to Have items, which the `branch-reviewer` Pass 2 reconciliation reads from this file.

## Should Fix
1. **The residuals paragraph's new count, "six behaviours", still leaves out a §6 row that has no source** — `docs/outer-loop-verification.md` (`### ` "A real GitHub Actions run.") — "nothing here shows any of six behaviours `docs/remote-execution.md` → `## 6. What is not verified here` rests on"
   This unit changed "five" to "six" and added the retention-cap behaviour. The paragraph now reads as the full list of GitHub behaviours in §6 that no real run has checked, but one is still missing: the row "An `actions/upload-artifact@v4` artifact is listed by `repos/{owner}/{repo}/actions/runs/<id>/artifacts` … while its run is still in progress" (source: "None retrieved"; Gate 12 observation (v) records it). The poller's post-disable re-check depends on that behaviour. The row was left out before this unit, but the recount is this unit's edit, and it still leaves the count one short. Confirmed by listing §6's table rows with `grep -n "^| " docs/remote-execution.md` and matching each unsourced row against the paragraph.
   **Fix:** make it "seven behaviours". Add a sentence for the in-progress listing: if it does not hold, the post-disable re-check finds nothing, and a job that enables the poller while a tick disables it can be left with no poller.
2. **"configurable from 1 to 400" is only true for private repositories** — `docs/remote-execution.md` (`## 4.` → "**The bundle expires.**") — "90 days by default, configurable from 1 to 400"
   From what I recall of GitHub's artifact-retention documentation, a public repository can be set to 1–90 days and only a private one to 1–400. On a public repository the stated range is wrong. No harness decision depends on it, because `doctor` warns below 30 either way and the workflow's 400 is claimed to be capped. This rests on recall only: no network was available to fetch https://docs.github.com/en/organizations/managing-organization-settings/configuring-the-retention-period-for-github-actions-artifacts-and-logs-in-your-organization, and no probe was run.
   **Fix:** write "configurable from 1 to 90 days on a public repository and 1 to 400 on a private one". Mark the figure as carried and not re-fetched, the way `## 10.` marks its storage figures, until someone fetches the source.
