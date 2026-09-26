### Task 7 — Add the job-side `restore` and `save` to `remote-run.sh`

**Goal:** Give a remote job the two steps that carry state across a job boundary: `restore`, which runs before the harness step and brings the previous job's bundle (and, on a `resume: answer`, the dispatched answers) into this job's checkout; and `save`, which runs after it under `always()` and assembles this job's bundle for upload.

**Depends on:** Task 6, which last extended `cli/templates/scripts/remote-run.sh` and `cli/test/remote-run.test.mjs` (the exit map is Task 5's: 0 done, 1 usage/config, 2 refused, 3 `gh` failed). And Task 4, whose `hr_remote_bundle_restore <bundle_dir> <root> <branch> job` and `hr_remote_bundle_write <root> <branch> <registry_file> <out_dir>` these two verbs wrap, and whose bundle layout (`status.json`, `clarifications/<branch>/`, `PAUSE_PROGRESS.md`, `flow_walker_state`, `run.log`) they move.

**The two verbs, stated once for every consumer** (Task 15's workflow calls both; Task 9's job mode reads what `restore` placed):

```
remote-run.sh restore <branch> --resume none|answer|pause
remote-run.sh save <branch> <out_dir>
```

- **Workflow inputs reach these verbs through the environment, never through `${{ }}` interpolation into a shell line**, because an input is attacker-shaped text in a script-injection sense: `HARNESS_INPUT_ANSWERS` (the `answers` input), `HARNESS_INPUT_PARK_LOOP_CLEAR` (`park_loop_clear`). Task 15 sets them with `env:`.
- **`restore`** finds the newest **finished** run of `harness-run.yml` on this branch, titled `harness run <branch>`, other than `GITHUB_RUN_ID`, that has a `harness-state` artifact; downloads it under the checkout's gitignored `<state_dir>/autonomous_logs/remote_download/`; and restores it in `job` mode, which places the clarification directory, the pause note, the walker state (as `.flow_walker_state`) and `status.json` as `<state_dir>/autonomous_logs/remote_status.json`. It restores on every resume kind, including `none`, because a reused branch keeps its clarification history locally too. On `--resume answer` it writes each `HARNESS_INPUT_ANSWERS` entry `"<n>": "<text>"` to `<state_dir>/clarifications/<branch>/answer_<n>.md` with the exact bytes, and refuses (exit 2, writing nothing more) an entry whose `question_<n>.md` is not at the top level. With `HARNESS_INPUT_PARK_LOOP_CLEAR` `true` it sets `park_loop_cycles` to `0` in the restored `remote_status.json`. No previous bundle is an ordinary first job: exit 0, one line saying so — except under `--resume answer`, where it is exit 2.
- **`save`** calls `hr_remote_bundle_write` into `<out_dir>`, and when `GITHUB_STEP_SUMMARY` is set appends a short Markdown table of `status`, `decision` and `detail` to it. A missing `remote_status.json` (the harness step never started) leaves `status.json` out of the bundle, which Task 8's `continue` reads as "never started". `save` never fails the job: every problem is one line and exit 0.

### Targets

- `cli/templates/scripts/remote-run.sh` — the two verbs, their header table rows and `REPRO` entries.
- `cli/test/remote-run.test.mjs` — the accompanying cases.

**Work:**

- [ ] Implement `restore` per the contract, selecting the previous run with `gh run list … --json databaseId,displayTitle,status,createdAt` and `jq`, never by parsing `gh`'s human output; writing each answer with `jq -j` from the environment variable so no byte is added or lost.
- [ ] Implement `save` per the contract, including the job-summary table.
- [ ] Extend the header: the two verbs, the environment variables they read and why inputs arrive that way, and a `REPRO` entry for each outcome.
- [ ] Cases with the recorder stub: a previous run with a bundle → the checkout carries `question_1.md`, `.flow_walker_state` and `remote_status.json`; `--resume answer` with `HARNESS_INPUT_ANSWERS='{"1":"Use B.\n"}'` → `answer_1.md` holds exactly `Use B.` plus its newline; an answer for index 2 with no `question_2.md` → exit 2; `HARNESS_INPUT_PARK_LOOP_CLEAR=true` → `park_loop_cycles` is `"0"`; no previous run → exit 0 under `none`, exit 2 under `answer`; the current `GITHUB_RUN_ID` is never selected; `save` after a job-mode status write produces the full layout and, with `GITHUB_STEP_SUMMARY` pointed at a temp file, a table naming the decision.

**Verification:**

- `bash scripts/test.sh` exits 0.
- `grep -n '\${{' cli/templates/scripts/remote-run.sh` finds nothing: no GitHub expression is ever written into the script.
- The written script still matches its template byte for byte.

**Deviations from plan:**
- `save` with neither `remote_status.json` nor a registry file does not call `hr_remote_bundle_write` (its registry fallback would create a registry in the checkout and then fail before copying anything); it creates `<out_dir>` empty. The contract said only `status.json` is left out; the rest is left out too, which no reader can observe, since every reader (`hr_remote_bundle_restore`, `sync`) treats a bundle with no `status.json` as unrecognised. With a registry file but no in-vocabulary record, the library's own early return gives the same empty bundle.
- `save`'s usage errors and configuration failures also exit 0 with one line, per "never fails the job"; the exit map in the header states it.
- `restore` requires `--resume` (the verb's stated syntax names it), and refuses (exit 2, before any `gh` call) an `HARNESS_INPUT_ANSWERS` that is not a non-empty object of positive-integer keys to strings under `--resume answer`.
- The job-side verbs gate on neither `execution.target` nor a registry record, and without `--repo` act on `hr_repo_root` of the working directory rather than `hr_main_repo`; both stated in the header.
