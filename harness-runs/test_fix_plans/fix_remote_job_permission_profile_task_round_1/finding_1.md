### 1. Task prompt quotes this machine's home-directory path (gate 6a)

**File:** `harness-runs/task_prompts/fix_remote_job_permission_profile_task_prompt.md` — "with this Mac's absolute paths" (line 21, navigation hint only)

**Failing test:** none — gate 6a no machine paths

**Failure, quoted from the log** (home directory rewritten to `<home>`):

```
FAIL  6a no machine paths (printed output, which is the finding)
./harness-runs/task_prompts/fix_remote_job_permission_profile_task_prompt.md:21:`.claude/settings.autonomous.json`, with this Mac's absolute paths (`//<home>/Work/harness-gate12/**` and its
```

**Class:** new this round (no earlier round's log exists).

**Diagnosis.** Gate 6a (`scripts/run-gates.sh` → `machine_path_hits`) greps the whole tree for the running user's literal `$HOME` and fails on any hit outside `node_modules`, `dist`, `.git` and `test_run_logs`. The branch's committed task prompt, under the "Run 1 (`36425634480`) — the committed profile" paragraph, quotes the scratch repository's profile glob verbatim, and the glob begins with the maintainer's real home directory. This is the only hit in the tree. The prose makes its point without the literal path: the point is that the profile carried *this Mac's* absolute paths, so an adopter's clone on the runner did not match them.

**Fix.** In that one sentence, replace the literal home-directory prefix inside the backticked glob with the placeholder `<home>`. The glob then reads `` `//<home>/Work/harness-gate12/**` ``, and everything else on the line and in the file stays as it is. Do not touch any other quoted path in the file: the runner paths under `/home/runner/…` are not the running user's home and do not trip the gate.

- [ ] Replace the home-directory prefix in the backticked glob on the "with this Mac's absolute paths" line with `<home>`.
- [ ] Check that no other line of this file names the running user's home directory, using a plain text search of the file.
