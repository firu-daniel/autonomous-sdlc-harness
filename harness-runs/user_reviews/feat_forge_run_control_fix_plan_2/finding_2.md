### 2. Four rows of `github-run-control.md` §8 still read "not retrieved here", though each has been checked

**File:** `docs/github-run-control.md` → `## 8. What is not verified here` — the rows "A concurrency group spans workflows in one repository", "An artifact uploaded by a job is listable before its workflow run completes", "The jobs API names a job with no `name:` key by its key, `run`" and "`concurrency: queue: max`, reported as added on 2026-05-07".

Also touched by this finding:

- `docs/github-run-control.md` → `## 2. A review that requests changes starts a round`:
  - **A check at the end of the run, not `concurrency: queue: max`.**, at "which is unverified here".
  - The paragraph after **One writer at a time.**'s list, at "A pending review job that GitHub replaces with a newer one loses nothing".
- `docs/development.md` → Gate 12 (xiv) → **What it settles.**, at "*An artifact uploaded by a job is listable before its workflow run completes* and *The jobs API names a job with no `name:` key by its key, `run`*, by leg (f)'s round placed by the `collect` job; *A concurrency group spans workflows in one repository*, by leg (f) only where".

**Problem.** §8 gives "Not retrieved here" as the source of all four rows. The `queue: max` row also adds "not verified, because no retrieval of GitHub's documentation was made in this branch". §2 repeats that `queue: max` "is unverified here". The maintainer has since checked each one. Gate 12's **What it settles.** still lists three of these rows as things leg (f) settles.

**Fix.** Change each row's **Source** cell to the evidence below. Leave the other cells as they are, except where this finding says otherwise. Quote the evidence as given:

1. **A concurrency group spans workflows in one repository.** Source: "Verified in GitHub's documentation, *Control the concurrency of workflows and jobs* (docs.github.com): \"concurrency group names must be unique across workflows to avoid canceling in-progress jobs or runs from other workflows\"."
2. **An artifact uploaded by a job is listable before its workflow run completes.** Source: "Verified in GitHub's changelog of 2023-12-14, *GitHub Actions – Artifacts v4 is now generally available*: \"This allows the artifact to become immediately available to download from the API after being uploaded, which was not possible before.\" The Artifacts REST reference is silent on it."
3. **The jobs API names a job with no `name:` key by its key, `run`.** Source: "GitHub's documentation is silent. Observed on `firu-daniel/harness-gate12`: the jobs API for run 36833810996 of `harness-run.yml` answers `run` and `warm`, and neither job carries a `name:` key."
4. **`concurrency: queue: max`.** Rename the behaviour cell to `` `concurrency: queue: max` `` and drop "reported as added on 2026-05-07".
   - **Source**: "Verified in GitHub's workflow syntax reference (`concurrency.queue`: `single` is the default, keeping at most one pending run, which a newer one cancels and replaces; `max` keeps up to 100 pending runs, cancelling any beyond that, and cannot be combined with `cancel-in-progress: true`) and in GitHub's changelog of 2026-05-07."
   - **What rests on it**: "Nothing ([§2](#2-a-review-that-requests-changes-starts-a-round)). It is deliberately not used: 100 pending jobs is still a hard limit, and the end-of-run `collect` job needs no queue. Keeping the default `single` queue on `harness-review-<branch>` has one consequence. When three or more reviews land while a review job is running, a pending review job can be replaced. That reviewer's review is still collected, but gets no reply."
   - Keep **If it is wrong** as "Nothing changes".

In §2, make two edits:

- In **A check at the end of the run, not `concurrency: queue: max`.**, replace "Nothing in this design rests on `queue: max`, which is unverified here ([§8](#8-what-is-not-verified-here))." with: "Nothing in this design rests on `queue: max`. It is deliberately not used, because 100 pending jobs is still a hard limit and the `collect` job needs no queue ([§8](#8-what-is-not-verified-here))."
- In the paragraph that opens "So two reviews submitted together become one round", after "A pending review job that GitHub replaces with a newer one loses nothing, because the newer one collects cumulatively and the round's comment names every reviewer it took.", add: "The replaced job posts no reply, though, so when three or more reviews land while a review job is running, a reviewer whose job was replaced may get no \"collected\" reply. Their review is still collected."

In `docs/development.md` → Gate 12 (xiv) → **What it settles.**, delete the two clauses that list these rows as still to be settled:

- "*An artifact uploaded by a job is listable before its workflow run completes* and *The jobs API names a job with no `name:` key by its key, `run`*, by leg (f)'s round placed by the `collect` job;"
- "*A concurrency group spans workflows in one repository*, by leg (f) only where a review job of `harness-control.yml` and the `collect` job are listed pending or in progress at the same time, which the two workflows' `gh run list` outputs show;"

Keep the clause list grammatical: the last remaining clause still opens with "and". Leave the clause about *A pull request's author cannot request changes on their own pull request* to Finding 3, which edits the same paragraph after this one.

No other file lists these four rows. A grep of the tree outside `harness-runs/` for "listable", "spans workflows", "queue: max" and "no `name:` key" finds only the lines named above.
