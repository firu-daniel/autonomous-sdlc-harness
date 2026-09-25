### Task 4 — Define the remote state bundle in the outer-loop library

**Goal:** Define, in one place, the state a remote job carries across a job boundary and reports back to the user — the **state bundle** uploaded as the Actions artifact `harness-state` — with a writer and a restorer every consumer shares.

**Depends on:** Task 3, whose `hr_registry_get` the status writer reads the job's record through.

**Why it exists.** A remote run's machine-local state — its clarification channel, its pause note, the planning walker's state, the park-loop and auto-resume counts — is gitignored by design and would be lost at every job boundary. The bundle carries it between jobs (Task 7 restores it in the next job) and to the user on demand (Task 6 syncs it into the local mirror). It is never committed.

**The format, stated once for every consumer** (Tasks 6, 7, 8, 9, 10 read or write it):

```
<bundle>/status.json
<bundle>/clarifications/<branch>/…     the whole branch directory, answered/ included
<bundle>/PAUSE_PROGRESS.md             when present
<bundle>/flow_walker_state             <state_dir>/.flow_walker_state, stored WITHOUT its dot
<bundle>/run.log                       the readable run log (<state_dir>/autonomous_logs/<branch>.log); never restored into a job
```

`status.json` (`HR_REMOTE_STATE_SCHEMA=1`; every value a JSON string, as the registry writes them):

| Key | Meaning |
|---|---|
| `schema` | `"1"`; a reader that does not recognise it treats the bundle as absent |
| `branch`, `engine` | the run's branch and engine kind (`task` \| `user_review` \| `docs`) |
| `status` | the registry vocabulary: `running` \| `parked` \| `park_loop` \| `paused` \| `completed` \| `failed` |
| `pause_reason` | `usage` \| `budget` \| `user` \| `overload` \| empty — why a `paused` run paused (Task 10 sets it). The registry's full vocabulary adds a fifth value, `killed`, which is **registry-only**: `remote-run.sh sync` (Task 6) derives it locally when a finished run's bundle still says `running`, and it never appears in `status.json` |
| `usage_resume_at` | the epoch second a usage pause may resume at, or empty |
| `park_loop_cycles`, `resume_max_question_index`, `auto_resumes`, `stall_restarts` | the counters that must survive a job boundary (`auto_resumes` is carried only into an automatic continuation; a user's dispatch resets it — Task 9) |
| `chain` | the writing job's **own input** `chain` (`HARNESS_INPUT_CHAIN`) — the automatic-dispatch count that job was started with, never a value carried from an earlier bundle; `remote-run.sh continue` / `poll` (Task 8) dispatch the next job with `chain + 1` |
| `control_polled_at` | the epoch second up to which the job has checked for a `harness pause <branch>` run — the lower bound the next job's remote-pause poll starts from (Task 10), or empty |
| `decision` | `continue` \| `wait-poller` \| `stop` — what the job's post-steps do (Task 8 acts on it) |
| `detail` | one human-readable line |
| `run_id`, `run_url`, `written_at` | provenance: `GITHUB_RUN_ID`, the run's URL, the epoch second written |

The functions:

- `hr_remote_status_write <registry_file> <branch> <out_json> <decision> <detail>` — reads the record through `hr_registry_get`, writes `status.json` atomically (temp file + rename) with `jq -n`, never `printf`-assembled JSON.
- `hr_remote_status_get <status_json> <key>` — prints one value; exit 1 when absent, 2 when the file is unreadable or its `schema` is not `1`.
- `hr_remote_bundle_write <root> <branch> <registry_file> <out_dir>` — assembles the layout above from `<root>`'s configured `stateDir` (resolved through `hr_state_dir`, never spelled), copying `status.json` from `<root>/<state_dir>/autonomous_logs/remote_status.json` when present.
- `hr_remote_bundle_restore <bundle_dir> <root> <branch> <mode>` — `<mode>` is `job` (restores the clarification directory, `PAUSE_PROGRESS.md`, the walker state back to `.flow_walker_state`, and `status.json` to `<root>/<state_dir>/autonomous_logs/remote_status.json`) or `mirror` (the same minus the walker state and minus `status.json`; the run log is never placed by a restore — Task 6's `sync` copies it to the main checkout's logs directory itself); it **replaces** the target clarification directory wholesale so a stale local pair cannot survive a sync (the superseded copy is moved aside, never deleted — see Work). Exit 2 on an unrecognised bundle, touching nothing.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — the new section; and the header paragraphs Task 3 amended: the opening scope sentence, `JURISDICTION.` (its enumerated environment reads) and `THE WRITE EXCEPTIONS TO "WRITES NOTHING", AND THEIR FENCES:` (the list Task 3 left with two entries, the lane and the run registry).
- `cli/test/outer-loop-scripts.test.mjs` — the accompanying cases.

**Work:**

- [ ] Add a library section `THE REMOTE STATE BUNDLE` whose header states the format above as the format of record, that the walker state is stored without its dot because `actions/upload-artifact` skips hidden files by default, that nothing in the bundle is ever committed, and who reads each file. Declare `HR_REMOTE_STATE_SCHEMA=1` and the bundle filenames as variables in that section, referenced by every function.
- [ ] Implement `hr_remote_status_write` and `hr_remote_status_get`. No value is echoed to stdout or a log by the writer. In the same edit, amend the library header (`.claude/context/cli.md` → `## What "done" means here`): the opening scope sentence gains the remote state bundle's format and its writer/restorer; the write-exceptions list gains a **third** entry, the remote state bundle, fenced to the files the bundle format lists (`autonomous_logs/remote_status.json`, `clarifications/<branch>/`, `PAUSE_PROGRESS.md`, `.flow_walker_state`) plus the move-aside directory `autonomous_logs/remote_superseded/`, all inside `<root>/<state_dir>/`, and to a caller-named `<out_dir>` for `hr_remote_bundle_write` — written only by `hr_remote_status_write`, `hr_remote_bundle_write` and `hr_remote_bundle_restore`; the closing guarantee names those three alongside `hr_lane_*` and `hr_registry_init` / `hr_registry_set`; and the header's enumerated environment reads gain `GITHUB_RUN_ID` (and the run-URL parts `GITHUB_SERVER_URL` / `GITHUB_REPOSITORY` if the URL is built from them), stated as **provenance values copied into `status.json`, never a configured value and never policy**.
- [ ] Implement `hr_remote_bundle_write` and `hr_remote_bundle_restore`, with the replace-wholesale rule for the clarification directory implemented **without any recursive removal** (`.claude/context/conventions.md` → `## Shell assets` → *"Never shell out to a recursive removal"*): the superseded directory is moved aside with one `mv` into `<root>/<state_dir>/autonomous_logs/remote_superseded/<epoch>/`, which the logs directory's existing ignore rule already keeps out of git, and the restore then copies the bundle's directory in. Nothing is deleted.
- [ ] Cases: a fixture with a registry record, a question/answer pair, a pause note and a walker state; write a bundle, restore it into a second fixture in `job` mode and in `mirror` mode, and assert each file lands where the format says (walker state back with its dot in `job` mode, absent in `mirror` mode; the run log placed in neither mode); a bundle whose `status.json` says `"schema":"9"` restores nothing and exits 2; a restore over a mirror carrying a stale `answer_9.md` leaves no `answer_9.md` in the clarification directory and the stale file under `autonomous_logs/remote_superseded/`.

**Verification:**

- `bash scripts/test.sh` exits 0.
- `jq -e '.schema == "1"'` passes on a written `status.json`, and the file is written by rename (no partial file under concurrent read in the case above).
- `grep -n "flow_walker_state" cli/templates/scripts/lib/harness-run-lib.sh` shows the dotless bundle name defined once.
- The header's write-exception list names every section that writes: `grep -n -E "THE WRITE EXCEPTIONS|THE RUN REGISTRY|THE REMOTE STATE BUNDLE|hr_lane_\*|hr_registry_(init|set)|hr_remote_(status_write|bundle_write|bundle_restore)|GITHUB_RUN_ID" cli/templates/scripts/lib/harness-run-lib.sh` — each of the three writing sections (the lane, `THE RUN REGISTRY`, `THE REMOTE STATE BUNDLE`) and each writing function appears in the `THE WRITE EXCEPTIONS …` paragraph with its fence, and `GITHUB_RUN_ID` appears in the header's environment-read enumeration as well as at its use.
