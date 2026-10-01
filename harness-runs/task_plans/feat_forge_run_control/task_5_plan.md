### Task 5 — Mark the trigger's comments, set the first state label, and share the actor check

**Goal:** Three changes to `remote-run.sh trigger`, the issue adapter `feat_forge_run_triggers` shipped:

1. Every comment it posts carries the hidden marker, so no harness comment is ever read as a command (goal 4). A start's marker also names the branch, `event=started`, which is how an issue command later finds its run.
2. A start sets the first state label, `sdlc-harness: running`, on the issue in the same step that removes the trigger label (goal 6, acceptance 5).
3. Its labeller check moves into one function that `control` reuses for every commenter and reviewer (the *Authorisation* lead: *"Reuse the check `feat_forge_run_triggers` built"*).

**Depends on:**

- Task 2, whose `trigger` matches `DEFAULT_TRIGGER_LABEL` = `sdlc-harness` or, with `HARNESS_TRIGGER_LABEL` empty, `LEGACY_TRIGGER_LABEL` = `harness`.
- Task 3's functions in `remote-run.sh`:
  - `forge_marker <event> <branch> [<question>]`, which prints `<!-- sdlc-harness event=<event> branch=<branch> -->`;
  - `forge_repo_var`, which sets `FORGE_REPO`;
  - `forge_set_state <number> <state>`, which leaves exactly one `sdlc-harness: <state>` label on the item and returns 1 on failure, never exiting.

**Where this task stops.** The trigger keeps posting through `gh issue comment … --body-file`, its own route, which this task only extends. `control`, which calls the new function, is Task 10's. The `started` marker's reader is Task 10's issue-to-branch lookup, and this task fixes its format: `event=started branch=<branch>`, posted by the trigger job as `github-actions[bot]`.

### The function this task defines

`authorise_actor <login> <type>` → 0 when authorised; otherwise a non-zero status, with `AUTH_WHY` holding one sentence naming the reason:

- 1 — `ghost`, empty, or not a login shape (`^[A-Za-z0-9][A-Za-z0-9-]*$`, plus a `[bot]` suffix when `<type>` is `Bot`);
- 2 — `<type>` is not `User` and `<login>` is not an exact entry of `HARNESS_TRIGGER_ALLOWED_BOTS`, checked with the existing `trigger_bot_listed` and no permission call;
- 3 — a `User` whose `gh_call api repos/<repo>/collaborators/<login>/permission` answers anything but `admin` or `write`, with `AUTH_PERMISSION` holding the answer;
- 4 — that permission call failed, with `GH_ERR` holding why.

The repository is `${GITHUB_REPOSITORY}`, as today. The function prints nothing and never posts; each caller words its own refusal and its own way on. This is refusals 4–6 of the header's `trigger` paragraph, moved without changing their order or meaning.

### Targets

- `cli/templates/scripts/remote-run.sh` — `authorise_actor`, `verb_trigger`, `trigger_finish`, and the header's `trigger` paragraph.
- `cli/test/remote-trigger.test.mjs` — the marker, the label and the stub's label answers.

**Work:**

- [ ] **`authorise_actor`** as specified, beside `trigger_bot_listed`. `verb_trigger` calls it once for an `issues` event and maps each status to the refusal comment it posts today, wording unchanged, so every existing refusal case keeps passing.
- [ ] **The marker.** `trigger_finish <exit> <comment>` gains a third argument, the marker event: `started` for a start and `refused` for every refusal. For an issue it appends a blank line and `forge_marker <event> "$branch"` to the comment body. Before a branch is derived, `$branch` is empty and the marker reads `branch=`, which the Task 10 lookup ignores. A dispatch event's step-summary text carries no marker: it is not a comment.
- [ ] **The first state label.** On the success path for an issue, after the trigger label is removed, call `forge_repo_var` and `forge_set_state "$issue_number" running`. A failure there is one `::warning::` line and changes no exit code: the run has started either way. State in the header's `trigger` paragraph that the comment, the label removal and this one label are the trigger's only writes to the issue, and that no label is set on a refusal.
- [ ] **`remote-trigger.test.mjs`**:
  - the stub answers `api repos/octo/fixture/issues/<n>/labels` (GET) with `[]`, and logs the `--method POST …/labels` call;
  - the started case asserts the comment body ends with `<!-- sdlc-harness event=started branch=<derived branch> -->`, and that `sdlc-harness: running` is added after the `--remove-label`;
  - a refusal case asserts `event=refused` in the body and no label add;
  - a failing label add → exit 0, with one warning line;
  - the header gains a sentence naming the marker and the label.

**Verification:**

- `npm test -- test/remote-trigger.test.mjs` from `cli/` passes, every pre-existing refusal case unchanged.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `git grep -n "collaborators/" -- cli/templates/scripts/remote-run.sh` has its only code hit inside `authorise_actor`: one permission check for every actor.

**Deviations from plan:**

- The `bash -n cli/templates/scripts/remote-run.sh` verification bullet was not executed: the command was refused by the permission layer in this session (twice, plain and compound). The claim that the script parses rests instead on `npm test -- test/remote-trigger.test.mjs` from `cli/`, which runs the script through `bash` in every one of its 29 cases, all passing.
- `trigger_finish`'s two non-refusal, non-start callers — the dispatch that failed after the push (exit 3) and the failed placement (exit 4) — pass `refused`: no run started, so neither sets `sdlc-harness: running` and neither posts a `started` marker the Task 10 lookup would follow.
