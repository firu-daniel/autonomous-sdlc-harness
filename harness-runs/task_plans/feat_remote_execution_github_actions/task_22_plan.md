### Task 22 — Give `branch-status` and `branch-answer` their remote arms

**Goal:** Let the user read a remote run's state and answer its clarification from their own machine, with the same two commands they use for a local run, and with every read made only because the user asked.

**Depends on:** Task 6, whose verbs these commands call:

```
bash <scripts_dir>/remote-run.sh status <branch>   read-only: GitHub's recent runs for the branch, and the record's last-synced fields
bash <scripts_dir>/remote-run.sh sync <branch>     brings the newest bundle into the run's local working copy (its mirror) and updates the record
  exit 0 done · 1 usage/config · 2 refused (not a remote record, or the mirror is missing) · 3 gh failed
```

A remote record is one whose registry entry carries `"execution": "github-actions"`; `sync` writes its `status` (the unchanged vocabulary), `pause_reason` (`usage` | `budget` | `user` | `overload` | `killed`), `remote_run_url` and `remote_synced_at`, puts the job's clarification directory into `<worktree>/<state_dir>/clarifications/<branch>/`, and copies the job's readable log to `<MAIN_REPO>/<state_dir>/autonomous_logs/<branch>.remote.log`. And Task 12, whose watcher relays a completed answer: once every open question file in the mirror has its answer, the watcher dispatches the resume to the workflow, carrying the answers.

### Targets

- `plugin/commands/branch-status.md` (register row 6).
- `plugin/commands/branch-answer.md` (register row 3).

**Work:**

- [ ] `branch-status.md`: in `## Resolved values`, change the `<scripts_dir>` row to say this file names `remote-run.sh`, which it invokes read-only, as well as `autonomous-watcher.sh` in the fence. In `## Steps`, for a record carrying `execution: github-actions`: print `execution` beside `engine`; run `bash <scripts_dir>/remote-run.sh status <branch>` **once** and summarise its output (the newest runs with their status and URL, the last-synced record, and whether a run finished after the last sync); read the bounded tail from `<branch>.remote.log` when present instead of `<branch>.log`. For a remote record whose last-synced status is `parked`, `paused` or `park_loop`, the next-action pointer names the same commands as for a local run and adds that those commands sync first. Keep the command read-only: `status` writes nothing, and this command never runs `sync` — say so, and that `/autonomous-sdlc-harness:branch-answer`, `branch-resume`, `branch-pause` and `branch-user-review` are the commands that sync.
- [ ] `branch-answer.md`: in which-branch resolution, before building the candidate set, run `bash <scripts_dir>/remote-run.sh sync <branch>` for every record carrying `execution: github-actions` whose status is not `completed` or `failed`, so a remote run that parked since the last sync is a candidate; a `sync` that exits non-zero is reported with its message and that record is left out, never guessed about. Everything after — the lowest unanswered `question_<n>.md` in the record's `worktree`, showing the whole file, writing `answer_<n>.md` verbatim — is unchanged, because for a remote run the worktree is the mirror `sync` just filled. In the report step, for a remote record, say the watcher dispatches the resume to GitHub Actions once every open question file has its answer, and that the local watcher must be running to do that; for `park_loop`, the clear action is unchanged and is carried to the job with the next answer.
- [ ] Update each file's `## Resolved values` `<scripts_dir>` row and closing scope fence so neither still claims the file never invokes a script: both invoke `remote-run.sh` and neither modifies it.

**Verification:**

- Every slash command written carries the `/autonomous-sdlc-harness:` prefix (`bash scripts/check-command-spelling.sh`, gate 6d, exits 0).
- Read both files end to end against the contract above: a local record's path through each is word-for-word unchanged apart from the `<scripts_dir>` row and the fence.
- `bash scripts/test.sh` exits 0 (gate 1 validates the plugin under `--strict`).
