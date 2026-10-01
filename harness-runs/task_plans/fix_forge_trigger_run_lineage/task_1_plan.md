### Task 1 — Bound `restore`'s previous-bundle selection to the branch's lineage by `headSha`

**Goal:** Change the job-side `remote-run.sh restore` so that it restores only a bundle written by a run of the branch's **current lineage**. A branch that `start`, the watcher's inbox route or `/autonomous-sdlc-harness:branch-prompt` has just recreated under a reused name must then restore nothing and log that this is its first job. A resume of a genuinely reused branch must still restore its own bundle and clarification history.

**Where this task stops.** It changes the `restore` verb's selection and its header paragraph only. It does not touch:
- the trigger's comment lookup (Task 2);
- the name rule (Tasks 3–4);
- `sync`, `fetch`, `status`, `list` or `review`, which the story index's `## Context` leaves unbounded on purpose;
- any document under `docs/` (Task 10 states the bound there, from the log lines this task fixes).

### Targets

- `cli/templates/scripts/remote-run.sh`: the new helper `lineage_commits_var`, `previous_bundle_run`, `verb_restore`, the header's `` `restore` SELECTS `` paragraph, and the header's `REPRO` lines for `restore`.
- `cli/test/remote-run.test.mjs`: the `// restore and save — the job-side verbs.` block, and the file header's `restore` / `save` rule paragraph.

**The interface this task defines, which Tasks 2, 10 and 12 rely on:**

- **`lineage_commits_var <checkout>`.** A function in `remote-run.sh`; Bash 3.2, with no output on stdout.
  - Return 0: it sets `LINEAGE_COMMITS` to the newline-separated full SHAs listed by `git -C <checkout> rev-list refs/remotes/origin/<defaultBranch>..HEAD`. `<defaultBranch>` comes from `hr_default_branch "$root"`.
  - Return 1: `LINEAGE_COMMITS` is empty and `LINEAGE_WHY` names the reason. The reason is one of: the configuration could not be read; `origin/<defaultBranch> is not present`; or `HEAD carries no commit beyond origin/<defaultBranch>`.
  - It never fetches, and it never calls `gh`.
- **The restore listing.** It reads `--json databaseId,displayTitle,status,createdAt,headSha`, adding `headSha` to today's field set.
- **New stdout lines.** These are wire for Task 12's Gate 12 leg (d) and for Task 10's prose, so spell them byte for byte:
  - `remote-run.sh: skipped <n> finished run(s) of <branch> from before its current lineage`. Printed only when at least one finished `harness run <branch>` run, other than `GITHUB_RUN_ID`, was excluded because its `headSha` is not in `LINEAGE_COMMITS`.
  - `remote-run.sh: the lineage of <branch> is not bounded (<LINEAGE_WHY>); every finished run of it is a candidate`. Printed when `lineage_commits_var` returned 1. Selection then proceeds exactly as today.
- **Unchanged lines.** `remote-run.sh: no previous bundle for <branch>; this is its first job` stays as it is. The `--resume answer` refusal with no bundle becomes `--resume answer, but no finished run of <branch>'s current lineage carries a state bundle; nothing written`.

**Work:**

- [ ] **Add `lineage_commits_var`** beside `previous_bundle_run`. It reads refs only: `git rev-parse --verify --quiet "refs/remotes/origin/<default>^{commit}"`, then the `rev-list` above. Its doc comment states the rule:
  - a run is of the current lineage when its `headSha` is a commit reachable from `HEAD` and not from `origin/<defaultBranch>`;
  - why `harness-run.yml`'s `fetch-depth: 0` makes the list complete;
  - why the bound survives `refresh-branch.sh` (it merges and never rebases) and `push-branch.sh` (it never forces);
  - what an empty list means.
- [ ] **Filter `previous_bundle_run`'s listing by the lineage, before the walk.** Keep the existing selection (title `harness run <branch>`, `status == "completed"`, not `GITHUB_RUN_ID`, newest first by `[createdAt, databaseId]`). When `LINEAGE_COMMITS` is set, also require `.headSha` to be one of them. A run with no `headSha` field is outside the lineage. Count the runs this drops for the `skipped` line.
  - The jq must stay on the 1.5 floor (`cli/templates/scripts/lib/harness-run-lib.sh` → `JQ 1.5 IS THE FLOOR`). Pass the list with `--arg` and test membership with `any(...; . == $h)`, not `index`/`IN`.
  - The expired-bundle stop then applies to lineage runs only. An older lineage's expired bundle is never reported for this branch, and an own-lineage expired bundle still warns, or refuses under `--resume answer`, exactly as today. This is the lessons ledger's *expiring store* rule.
- [ ] **`verb_restore`**: print the `not bounded` line or the `skipped` line before the existing outcome lines, and change the `--resume answer` no-bundle refusal text as stated above. Change nothing else in the verb.
- [ ] **Header.** Amend the `` `restore` SELECTS `` paragraph to state the lineage bound, its fallback and the two new lines. Amend the exit-map wording only where it says "no previous bundle". Add two `REPRO` lines under `restore and save run in the job's checkout`:
  - `lineage`: a branch with one commit beyond `origin/<default>` whose run list holds only an older run with another `headSha`. Expected: exit 0, the `skipped` and `first job` lines, no `run download`.
  - `own lineage`: the same branch with a newer run whose `headSha` is that commit. Expected: that run's bundle is restored.
- [ ] **`cli/test/remote-run.test.mjs`**:
  - Extend the header's `restore` / `save` rule paragraph with the lineage rule.
  - Update the existing assertion that the listing carries `--json databaseId,displayTitle,status,createdAt ` so that it names `headSha` too.
  - Add the acceptance cases. Each case builds the fixture, then commits a task-prompt-shaped file on a branch `feat_x` checked out in the fixture, so that `HEAD` has exactly one commit beyond `refs/remotes/origin/<defaultBranch>`. Fetch from the fixture's bare `origin` first if that ref is not present, as `remote-start.test.mjs` does. `ghRun` gains an optional `headSha`.
    - **(a) A recreated branch.** The run list holds only an older completed `harness run feat_x` run with a bundle and a `headSha` that is not in the lineage. Expected: exit 0, stdout matches `/skipped 1 finished run\(s\) of feat_x from before its current lineage/` and `/this is its first job/`, no `run download`, no `remote_status.json`, and no planning file placed. Under `--resume answer` the same list gives exit 2 naming the current lineage.
    - **(b) The same branch resumed after a pause in its own lineage.** Add a newer completed run whose `headSha` is the branch's commit, carrying its own bundle. Expected under `--resume pause`: exactly that run is downloaded, and its walker state and question file are restored.
    - **(c) A user-review round, or a chain, on a branch with two own commits.** A run whose `headSha` is the first of them is still selected.
    - **(d) The fallback.** With `HEAD` equal to `origin/<default>`, restore selects as today and prints the `not bounded` line.

**Verification:**

- `npm test -- test/remote-run.test.mjs` from `cli/` passes: the four new cases, and every existing `restore`, `save`, `sync` and `continue` case unchanged. The existing fixtures have no commit beyond `origin/<default>`, so they take the fallback.
- The type check (`commands.typecheck`) passes.
- `git grep -n 'lineage' -- cli/templates/scripts/remote-run.sh` lists only the helper, its two call sites in `previous_bundle_run` / `verb_restore`, the header paragraph and the `REPRO` lines. No other verb reads `LINEAGE_COMMITS` (the story index's first `Top risks:` entry).

**Deviations from plan:**
- The plan states that the existing fixtures have no commit beyond `origin/<default>`. They do: `init` makes a first commit, and that commit does not descend from the fixture's seeded `origin` commit. So the bound applied to them, and seven existing `restore` cases failed. `remoteFixture` now force-pushes `HEAD` to `origin/<defaultBranch>` when `HEAD` resolves. Every existing case then takes the unbounded fallback, as the plan intended, and no existing assertion changes.
- `restore keeps a planning file the fresh checkout already carries, and reports it kept` commits a story index after the fixture is built, so its `HEAD` is one commit beyond `origin/<default>`. `restoreFrom` gained an optional `headSha`, and that case passes the commit as run 401's `headSha`. That run is of the branch's own lineage, which is what the case models.
- `lineage_commits_var` also returns 1 with "the configuration could not be read" when `defaultBranch` resolves empty. `defaultBranch` is required by the schema, so an empty value means the configuration is not usable.
