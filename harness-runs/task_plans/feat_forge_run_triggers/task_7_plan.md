### Task 7 — Add `remote-run.sh trigger` for a labelled GitHub issue

**Goal:** Build the GitHub event adapter: *event → (branch, task text)*, then Task 6's placement and dispatch. `remote-run.sh trigger [--repo <root>]` runs as the one step of the trigger workflow's job (Task 12). It reads the `issues` event GitHub hands the job, checks the labeller, derives the branch name, snapshots the issue as the task prompt and calls `start`. It then posts exactly one comment on the issue, naming the branch and the run or the reason for a refusal, and removes the trigger label so that re-applying it is a deliberate act. This task delivers acceptances 1–4 on the shell side.

**Depends on:**

- Task 1's names, which this script mirrors byte for byte:
  - `TRIGGER_LABEL_VARIABLE` = `HARNESS_TRIGGER_LABEL`;
  - `DEFAULT_TRIGGER_LABEL` = `harness`;
  - `TRIGGER_ALLOWED_BOTS_VARIABLE` = `HARNESS_TRIGGER_ALLOWED_BOTS`.
- Task 2's `hr_forge <root>`: prints `github`/`gitlab`/`none` with 0, nothing with 1 when unset, nothing with 2 when unresolvable.
- Task 3's `hr_derive_branch <root> <text> <fallback>`: prints the name with 0, 2 when it cannot tell, 3 when no suffix up to `_99` is free. It sets `HR_TAKEN_WHY` through `hr_branch_name_taken`.
- Task 6's `remote-run.sh start <branch> --prompt-file <file> [--repo <root>]`: 0 dispatched; 2 refused, nothing written; 3 `gh` failed on the dispatch after the branch and prompt were pushed; 4 placement failed, nothing dispatched.

**Where this task stops.** This task handles `GITHUB_EVENT_NAME` `issues` only. The `repository_dispatch` adapter is Task 8's, and it extends the verb this task creates. The workflow file that runs this step, with its `if:` label filter and its `permissions:`, is Task 12's. The step also filters here on the label, so a hand-run or a stale workflow cannot bypass the check. Lifecycle comments (`parked`, `completed`, …) are not written here: they belong to `feat_forge_run_control`, and `autonomous-notify.sh` is unchanged.

### Targets

- `cli/templates/scripts/remote-run.sh` — the verb, its header, usage line and REPRO.
- `cli/test/remote-trigger.test.mjs` (new) — the adapter's contract.

**Work:**

- [ ] **Verb, inputs, gate.**
  - Add `trigger` to the verb list and `usage()`. It takes no branch and no option but `--repo`.
  - It is a job-side verb, so `root` is `hr_repo_root` of the working directory, as for `restore`.
  - It takes no part in the sending-verb gate. It gates itself, so that a refusal can still be commented.
  - It reads, only through the environment: `GITHUB_EVENT_NAME`, `GITHUB_EVENT_PATH`, `GITHUB_REPOSITORY`, `GITHUB_SERVER_URL`, `GITHUB_RUN_ID`, `HARNESS_REMOTE_STOP`, `HARNESS_TRIGGER_LABEL` (empty → `harness`) and `HARNESS_TRIGGER_ALLOWED_BOTS`.
  - `GITHUB_EVENT_NAME` other than `issues` (and, after Task 8, `repository_dispatch`) → exit 1. An unreadable event file → exit 1.
  - Every event field is read with `jq -r` from `GITHUB_EVENT_PATH` into a shell variable: `.action`, `.label.name`, `.issue.number`, `.issue.title`, `.issue.body // ""`, `.issue.html_url`, `.issue.state`, `.sender.login` and `.sender.type`. None ever reaches a command as source; this is `docs/remote-execution.md` → `## 11. Security`'s rule, applied to event text.
  - An `action` other than `labeled`, or a label other than the configured one, is ignored: one line, exit 0, no `gh` call.
- [ ] **The refusals**, tested in this order, each posting one comment that names the reason and the way on, removing the label, and exiting 2:
  1. `HARNESS_REMOTE_STOP` is non-empty: every start is stopped.
  2. `hr_forge` is not `github`, or `hr_execution_target` is not `github-actions`: the default branch's `harness.config.json` does not turn the issue trigger on. Name both keys.
  3. `.issue.state` is not `open`: reopen the issue first.
  4. `.sender.login` is `ghost`, empty, or not a GitHub login shape (`^[A-Za-z0-9][A-Za-z0-9-]*$`, or that shape followed by `[bot]` for a bot). The `ghost` case is research T1: GitHub warns that `sender` can be the `ghost` placeholder.
  5. `.sender.type` is not `User`, and the login is not an exact entry of `HARNESS_TRIGGER_ALLOWED_BOTS` (split on `,`, entries trimmed). A listed bot is authorised by the listing and is not asked about, because the permission API answers `none` or 404 for one (T3). An unlisted bot is refused without a permission call.
  6. For a `User`: `gh_call api repos/$GITHUB_REPOSITORY/collaborators/<login>/permission`, reading `.permission`. Only `admin` or `write` passes; this admits maintain, which the API maps to write, and refuses triage, which it maps to read (T3). A `gh` failure or any other answer is a refusal that says *"could not confirm write access"*, and is never a pass.

  State the order and its reasons in the header. The config gate comes before authorisation, so a disabled trigger asks GitHub nothing about the labeller.
- [ ] **Derive, snapshot, start.**
  - Run `git -C "$root" fetch origin <defaultBranch>`, tolerating a failure, so `hr_branch_name_taken` reads the current default branch.
  - Then `hr_derive_branch "$root" "$title" "issue_<number>"`. A return of 2 is a refusal naming that the name could not be checked; 3 is a refusal naming the exhausted suffixes.
  - Write the prompt into `${RUNNER_TEMP:-<a mktemp directory>}` in exactly this shape: a line `# <title>`, a blank line, the body bytes unchanged, a blank line, `---`, a blank line, then one provenance sentence:

    ```
    Started from <html_url> by @<login>, who applied the label `<label>` at <UTC ISO-8601 time>. This is the issue's text at that moment; later edits to the issue do not reach this run.
    ```

    This file is the snapshot the task prompt asks for.
  - Run `bash "$script_dir/remote-run.sh" start "$branch" --prompt-file "$file" --repo "$root"` as a child and capture its status and its stderr's last line:
    - 0 → started;
    - 2 or 4 → a comment that says no run started and quotes that line, then exit 4;
    - 3 → a comment that says the branch `<branch>` was pushed with the task but the dispatch failed, and names the manual way on: **Run workflow** on the run workflow, with `action` `run` and `branch` `<branch>`. The comment text interpolates the workflow's file name from `"$WORKFLOW_RUN_FILE"` and never spells it. Then exit 3.
- [ ] **Feedback.**
  - **One string, one producer** (`.claude/context/cli.md` → `## How a module in this layer is written`). `remote-run.sh` already declares `WORKFLOW_RUN_FILE` as a byte-for-byte mirror of `cli/src/remote/githubActions.ts`'s `WORKFLOW_RUN_FILE` (header mirror table; assignment `WORKFLOW_RUN_FILE='harness-run.yml'`). `trigger` reads the run workflow's name **only** from that existing variable — in the lookup's `run list --workflow`, in the fallback URL and in the dispatch-failed comment above — and adds no code line spelling the file name. Likewise every `gh` call `trigger` makes (the permission `api` call, `run list`, `issue comment`, `issue edit`) goes through the script's existing `gh_call` (stdout in `GH_OUT`, first stderr line in `GH_ERR`), so `gh` is resolved only via `GH="${HARNESS_GH_CLI:-gh}"` — the `HARNESS_GH_CLI` mirror the test stub depends on. No bare `gh` or `"$GH"` invocation is added.
  - After a start, look the run up with at most `TRIGGER_RUN_LOOKUP_TRIES=6` calls of `gh_call run list --workflow "$WORKFLOW_RUN_FILE" --branch "$branch" --json url,displayTitle --limit 5`. Wait `${HARNESS_TRIGGER_LOOKUP_SECS:-5}` seconds between calls; that variable is a declared test seam. Take the first run whose `displayTitle` is exactly `harness run <branch>`. When none appears, use the filtered list `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/workflows/${WORKFLOW_RUN_FILE}?query=branch%3A<branch>`, a name of `[a-z0-9_]` only needing no encoding. This bound is the ledger's *"Every automatic retry in an unattended path is bounded"* rule, applied.
  - The success comment names the branch and that URL, says the task is the issue's title and body as they were when the label was applied, and says re-applying the label starts another run on the next indexed branch.
  - Post every comment with `gh_call issue comment <n> --repo "$GITHUB_REPOSITORY" --body-file <file>`, then remove the label with `gh_call issue edit <n> --repo "$GITHUB_REPOSITORY" --remove-label <label>`.
  - A comment that cannot be posted prints `::error::` naming `gh`'s error and makes the exit 3, so the Actions run shows it. A failed label removal is one `::warning::` line and changes no exit.
  - Header: the verb's paragraph, its exit map (0 started or ignored, 2 refused and commented, 3 a `gh` step after the decision failed, 4 start failed and commented), the mirror declarations above, and REPRO lines for an authorised start, a `read` labeller and an ignored label.
- [ ] **`cli/test/remote-trigger.test.mjs`** opens with its rule: *only a write-or-admin human or a listed bot starts a run; every refusal sends no `workflow run` and posts one comment naming why; event text is data*. The fixture is Task 6's shape plus `forge: "github"`, event JSON files written by the test, and a `gh` stub that:
  - answers `api …/collaborators/<login>/permission` from a per-login table;
  - answers `run list` with a `harness run <branch>` run carrying a `url`;
  - copies each `--body-file`'s content into its log.

  `HARNESS_TRIGGER_LOOKUP_SECS=0`. Cases:
  - a `write` user → one `workflow run` for the derived branch, one comment naming it and the URL, one `--remove-label`, exit 0;
  - `admin` → started;
  - a `read` answer (triage) → exit 2, no `workflow run`, a comment naming write access;
  - `ghost` → refused;
  - an unlisted `type: Bot` → refused with no permission call;
  - the same bot listed in `HARNESS_TRIGGER_ALLOWED_BOTS` → started;
  - a failing permission call → refused;
  - `HARNESS_REMOTE_STOP=1` → refused;
  - `forge: "none"` → refused, with no permission call;
  - a closed issue → refused;
  - `action: opened` and a different label → exit 0 with no `gh` call;
  - two issues with the same title → the second on `<slug>_2`;
  - an empty-slug title → `issue_<number>`;
  - a body carrying `` $(touch pwned) `` and a backtick → the committed prompt holds those bytes and no `pwned` file exists.

**Verification:**

- `npm test -- test/remote-trigger.test.mjs` from `cli/` passes.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `grep -n "workflow run" cli/templates/scripts/remote-run.sh` shows no new `workflow run` composed outside `verb_dispatch`, `verb_pause`, `verb_warm` and `verb_stop`: the trigger dispatches only through `start`.
- `grep -n "harness-run.yml" cli/templates/scripts/remote-run.sh` shows only the one `WORKFLOW_RUN_FILE=` assignment, the header mirror-table row and comment / REPRO lines — no code line inside `trigger`; the invariant is *no hit on an uncommented line other than the assignment*.
- `grep -n '"\$GH"\|^[^#]*\bgh ' cli/templates/scripts/remote-run.sh` has every hit inside the `gh_call` function body (and its `GH_ERR` messages), none inside `trigger`: `trigger` reaches `gh` only through `gh_call`.

- **Deviations from plan:**
  - The suite carries one case beyond the plan's list: a `workflow run` that fails after the push exits 3 and comments the manual **Run workflow** way on, naming the workflow file from `WORKFLOW_RUN_FILE`. The stub gained `STUB_FAIL_ON` for it, as in `remote-start.test.mjs`.
  - The shell-syntax body case uses LF line endings only: the adopter's `.gitattributes` (`* text=auto`, from `cli/templates/repo/gitattributes`) normalises a CRLF body on commit, so "the committed prompt holds those bytes" is asserted for bytes git stores unchanged.
  - Refusal 4 accepts the `[bot]`-suffixed login shape only when `.sender.type` is `Bot`, reading "that shape followed by `[bot]` for a bot" as a condition on the type.
