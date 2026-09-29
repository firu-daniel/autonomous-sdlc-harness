### 1. Gate 12 observation (iii)'s push probe always lists a run from the watcher's own push, so the push half reads as "a `GITHUB_TOKEN` push started a workflow"

**File:** `docs/development.md` → **Gate 12 — remote execution against a real GitHub repository.** → **(iii) The self-pause chain, and the `GITHUB_TOKEN` dispatch exception.** — "After the first job has pushed, list the probe's runs on the task's branch:"

The new probe step commits `.github/workflows/push-probe.yml` (`on: push`, no branch filter) to the scratch repository's default branch **before the drop**, so the task branch, cut from `origin/<default branch>`, carries the probe. Before any job runs, the local watcher commits the task prompt and pushes the branch itself, with the operator's `gh` credential: `cli/templates/scripts/autonomous-watcher.sh` → `remote_commit_and_push` runs `"$PUSH_BRANCH" "$worktree"` and refuses to dispatch until `origin/<branch>` carries HEAD, because the job checks out `origin/<branch>`. That push is not a `GITHUB_TOKEN` push, so it starts a probe run on `<branch>`.

So `gh run list --workflow push-probe.yml --branch <branch>` always lists at least one run. The pass text says to record "whether a push the first job made started a run of `push-probe.yml`, with that last command's output verbatim". Read as written, a gate runner sees a run and records that a `GITHUB_TOKEN` push started a workflow. That is the opposite of what `docs/remote-execution.md` → `## 6. What is not verified here` needs to learn, and nothing in the step tells the runner to tell the operator's run apart from the job's.

**Fix:** keep the probe setup (the YAML block and its three `git` commands) unchanged. Replace the paragraph "After the first job has pushed, list the probe's runs on the task's branch:" and the fenced `gh run list --workflow push-probe.yml --branch <branch>` block after it with the text below. Each command goes in its own fenced block, as the lessons ledger's *Adopter-facing documentation* entry requires:

    After the first job has pushed, list the probe's runs on the task's branch with the commit each ran for:

    ```
    gh run list --workflow push-probe.yml --branch <branch> --json databaseId,headSha,event,createdAt
    ```

    Then list the branch's commits:

    ```
    git fetch origin <branch>
    ```

    ```
    git log --format='%H %s' origin/<branch>
    ```

    One probe run is expected before any job ran. The watcher pushed the task-prompt commit, `chore: add task prompt for <branch>`, with your own `gh` credential, and that push is not a `GITHUB_TOKEN` push. Only a probe run whose `headSha` is a commit the first job pushed, which is any commit newer than that task-prompt commit, answers the push half.

Then, in the **Passes when …** sentence of the same observation, replace "and whether a push the first job made started a run of `push-probe.yml`, with that last command's output verbatim." with:

    and whether any `push-probe.yml` run's `headSha` is a commit the first job pushed, with the `gh run list` and `git log` output verbatim.

- [ ] Replace the listing paragraph and its fenced command
- [ ] Replace the record clause in the **Passes when …** sentence

This is a docs-only edit. It runs no test.
