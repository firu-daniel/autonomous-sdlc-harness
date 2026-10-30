### Task 8 — Document job mode's `unfinished` arm in `docs/remote-execution.md`

**Goal:** The remote-execution design of record states the third failure shape a job now auto-resumes, and what the job sends once those resumes run out. That shape is a session that exits 0 before its ledger finished, recorded as `pause_reason` `unfinished`.

**Depends on:** Task 4, which adds `run_job`'s `unfinished)` arm. It restates the contract here so this task documents it without reading that file:
- a `paused` record with `pause_reason` `unfinished` takes `job_auto_resume`, the same bounded path as `failed` and `overload`: `REMOTE_AUTO_RESUME_DELAY_SECS`, at most `REMOTE_AUTO_RESUME_MAX` per run, only before the job's deadline, and never over a user's pause;
- past the cap the job ends `paused` with decision `stop`, and one `paused` notification reading *"the session ended before its ledger finished — run /autonomous-sdlc-harness:branch-resume <branch> to continue; or from GitHub: …"*;
- the bundle's `status.json` carries `pause_reason: unfinished` (Task 1), and `remote-run.sh sync` copies it into the local record.

Also Task 7, which documents the local half in `docs/watcher.md`. This task links to it and does not restate it.

### Targets

- `docs/remote-execution.md` — `## 3. A remote run supervises itself` → `### API errors` and `### Notifications`.

**Work:**

- [ ] `### API errors`: the **Decision** sentence names three failure shapes instead of two. The third is a session that exits 0 before its ledger finished (`unfinished`), most often because the CLI stopped its background sub-agents. Link [`watcher.md`](watcher.md) → `## 4.` for the ledger check and the wait-ceiling setting. *Past the cap the run stays `failed` or `paused` and notifies* stays true and is kept. **Local runs gain nothing** stays true for the auto-resume, so reword it only as far as needed: locally an `unfinished` run is classified the same way but waits for a person.
- [ ] `### Notifications`: in the list of messages naming `/autonomous-sdlc-harness:branch-resume <branch>`, add *an exhausted `unfinished` pause* beside *a user or exhausted overload pause*.

**Verification:**

- `git grep -n 'unfinished' -- docs/remote-execution.md` shows both sections, spelled exactly as the registry value.
- `git grep -n 'two failure shapes' -- docs/remote-execution.md` prints nothing.
- `git diff --stat -- docs/remote-execution.md` shows one file, and the diff touches no other section.
