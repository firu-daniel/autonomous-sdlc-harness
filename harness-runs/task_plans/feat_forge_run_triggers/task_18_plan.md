### Task 18 — Restate the forge coupling's status in the plugin's flow documents

**Goal:** Bring the plugin's two flow documents level with what this branch ships. Each states in the present tense that the `forge` key *"has no reader"*, and that file drops are the only way a run starts (scope register rows 17–20). After this branch:

- `forge` has a reader: with `execution.target` `github-actions`, `github` makes `init` write the issue-trigger workflow, and the trigger re-reads the key at run time;
- a labelled issue is a second way a task run starts, and the run's own side of the step is identical to a dropped prompt;
- the coupling's other two parts, draft-pull-request output and comment-based park-and-ask, still wait for `feat_forge_run_control`.

**Depends on:**

- Task 12, whose `cli/templates/github/workflows/harness-trigger.yml` exists and can be cited.
- Tasks 6 and 7, whose `remote-run.sh start` and `trigger` verbs exist, each with its header paragraph.
- Task 10, whose `adopt` exists.

These documents cite those files and their headers, which exist by this point, and no document a later task writes.

**Where this task stops.** It edits prose in `plugin/docs/`. The design of record for the trigger is the harness repository's `docs/github-issue-trigger.md` (Task 20). It ships after this task, so nothing here points at it; these documents cite the code of record, as the existing *Remote execution* wiring row already cites `remote-run.sh`. No heading is renamed. Every heading here is a wire other files cite (`plugin/docs/README.md` → the `AUTONOMOUS_FLOW` citer sweep).

### Targets

- `plugin/docs/AUTONOMOUS_FLOW.md`
- `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`

**Work:**

- [ ] **`AUTONOMOUS_FLOW.md` → `## The wiring table`, the *Remote execution* row.** Add, beside the two workflows:
  - the third workflow `init` writes when `forge` is `github` as well: `harness-trigger.yml`, which starts a task run from a labelled issue or a `repository_dispatch` of type `harness-task`;
  - `remote-run.sh`'s `trigger`, `start` and `adopt` verbs.

  Keep the row's closing *format of record* clause.
- [ ] **`AUTONOMOUS_FLOW.md` → `## Drop a task prompt`.** Add one paragraph after the first. A task run can also start from a labelled GitHub issue, when the repository sets `forge` to `github` and runs on GitHub Actions. A workflow on GitHub then cuts the branch, commits the issue's title and body as `<state_dir>/task_prompts/<branch>_task_prompt.md` and dispatches the run. The prompt reaches the run at the same path, committed the same way, and is the same untrusted task data. The run's side of the step is unchanged. Cite `remote-run.sh`'s `trigger` paragraph in `<scripts_dir>` for who may start one. Leave `## The operator-facing steps`' count of six sections true: this is a paragraph, not a seventh section.
- [ ] **`AUTONOMOUS_FLOW.md` → `## Output guarantee`, the paragraph *"A forge-side branch ruleset would be a true un-bypassable floor"*.** Replace *"The harness is forge-agnostic in this release and applies none: the `forge` configuration key is declared and nothing reads it yet"* with a sentence that holds after this branch. The harness applies no branch ruleset on any forge. `forge` is read only to write and run the issue trigger, and nothing in that trigger provisions a ruleset either.
- [ ] **`AUTONOMOUS_FLOW.md` → `## Out of scope in this release`, the bullet *"No forge coupling."*.** Retitle the bullet's bold lead to say the coupling is partial, then say:
  - the issue-label trigger ships, gated on `forge` `github` and `execution.target` `github-actions`;
  - draft-pull-request output and comment-based clarification do not, and belong to the follow-up;
  - an answer, a pause or a resume is still a file drop into a local mirror — which reaches a trigger-started run once a syncing command has adopted it — or the **Run workflow** form on GitHub;
  - the watcher stays a thin adapter, and the trigger feeds the same engines through the same placement rather than reworking them.
- [ ] **`AUTONOMOUS_FLOW_WHITEBOARD.md`.** Two sentences:
  - *"the configuration key for forge coupling is declared and has no reader yet"* becomes: the `forge` key is read only by the issue trigger, and still provisions no ruleset;
  - *"no forge coupling — an opted-in run executes in a GitHub Actions job, but file drops still start and steer it"* becomes: a partial forge coupling — an opted-in run executes in a GitHub Actions job and may be started by labelling an issue, while file drops or the **Run workflow** form still steer it.

  Keep the surrounding narrative's register and its pointer to `AUTONOMOUS_FLOW.md` → `## Out of scope in this release`.

**Verification:**

- `git grep -n -i -E "nothing reads it yet|has no reader yet|no forge coupling" -- plugin/docs` prints nothing.
- `git grep -n "## " -- plugin/docs/AUTONOMOUS_FLOW.md` lists the same headings as before this task: no heading was renamed, added or removed.
- Every repo-relative path the new sentences cite resolves in the tree (`git ls-files` shows it), and no new sentence cites `docs/github-issue-trigger.md`.
