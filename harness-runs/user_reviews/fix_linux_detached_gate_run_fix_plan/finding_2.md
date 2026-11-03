### 2. The per-run profile the launcher reads is chosen by `XDG_STATE_HOME` / `HOME`

**Severity:** Must Fix (user observation 2)

**File:** `cli/templates/scripts/launch-sandboxed-gates.sh`, at check 8, `profile="$(hr_run_profile_file "$(hr_repo_slug "$main")" "$branch")" || profile=""`, and the header bullet `` - `XDG_STATE_HOME` / `HOME` place the per-run profile (`hr_run_profile_file` ``. Also:

- `cli/templates/scripts/autonomous-watcher.sh`, in `spawn_engine`: `settings_file="$RUN_PROFILE_FILE"` and `if ! run_profile_check "$settings_file" "$check_copy"; then`;
- the watcher header's registry field list, after `#   log_path            the central log this run appends to`;
- `cli/test/launch-sandboxed-gates.test.mjs`, the case `'(k) a registered clone takes its protected paths from the per-run profile, and refuses without one'`;
- `cli/test/watcher-run-profile.test.mjs`;
- `docs/cli.md` §6, residual 13, the bullet *"every exact `sandbox.filesystem.denyWrite` path of the session's own profile that lies under the target read-only — the per-run copy for a run copy"*;
- `docs/watcher.md` §2, *The per-run profile*, the paragraph **Where it is.**;
- the root copies `scripts/launch-sandboxed-gates.sh` and `scripts/autonomous-watcher.sh`, which are byte-identical to their templates today.

**The problem, verified.** For a run copy, check 8 derives the profile path through `hr_run_profile_file`, which places it under `${XDG_STATE_HOME:-$HOME/.local/state}` (`docs/cli.md` §6, *"It lives at `${XDG_STATE_HOME:-$HOME/.local/state}/autonomous-sdlc-harness/run-profiles/…`"*). The launcher's own header states the consequence as a residual: *"Redirected, they can drop protected paths inside <target> from the vector"*. A crafted profile there passes the regular, non-link, single-JSON-object checks. Its `denyWrite` then decides which paths under the run copy the worker gets read-only, so the run copy's protected surface is lost inside the worker. The registry already holds absolute paths (`worktree`, `log_path`), is write-protected by exact path, and is read from the main checkout. Today it records nothing about the profile.

**Fix.** This changes a watcher function. The story index's *"No watcher function changes"* no longer holds for `spawn_engine`.

- [ ] **1. The watcher records the path (`cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine`).** Outside job mode, after `run_profile_check "$settings_file" "$check_copy"` succeeds and before the session is spawned, write the rendered copy's absolute path into the run's record: `registry_set "$branch" run_profile "$settings_file"`.
  - A failed write is `spawn_refuse "$branch" "cannot record the per-run profile's path in the run registry"; return 1`. A session whose gate launcher could not find its profile would park at Phase G anyway, so it is not started.
  - Job mode writes nothing: there the launcher's target is the main checkout and its profile is the base (Finding 1).
  - Add a `run_profile` row to the header's registry field list after `log_path`: *"the absolute path of the per-run profile this run's latest spawn was launched on, written by `spawn_engine` after its launch check, outside job mode; read by `launch-sandboxed-gates.sh` for the worker's protected paths"*.
- [ ] **2. The launcher reads it (`cli/templates/scripts/launch-sandboxed-gates.sh`, check 8).** Replace the `hr_run_profile_file` line with a read of the record:
  - resolve `registry="$(hr_state_path "$main" autonomous_logs/registry.json)"`, as the clone arm does;
  - read `profile="$(hr_registry_peek "$registry" "$branch" run_profile)"`;
  - refuse, with `the run registry records no per-run profile for '$branch': the gate sandbox takes its protected paths from the session's own profile`, when the read fails, the value is empty, it carries a newline, or it is not absolute (`/*`);
  - keep the existing checks (regular file, not a link, readable, `hr_json_single_object`), with their refusal unchanged.

  No environment variable enters the choice. `hr_repo_slug` is no longer called there, so drop it if nothing else in the file uses it. In the header:
  - **delete** the residual bullet `` - `XDG_STATE_HOME` / `HOME` place the per-run profile (`hr_run_profile_file` → `hr_lane_dir`) … cannot add the network or a writable root outside <target>. ``;
  - change check 8's text from *"else the per-run copy `hr_run_profile_file`"* to *"else the per-run copy whose absolute path the watcher recorded in the branch's run-registry record (`run_profile`)"*.
- [ ] **3. Fixtures, in `cli/test/launch-sandboxed-gates.test.mjs`.** Every path sits under `f.root`, the case's `mkdtemp` directory, or the fixture, so that no real home-directory path appears and gate 6a stays clean.
  - **Update case (k).** After writing `profileFile`, record it with the library: `hr_registry_set "<f.dir>/sdlc-harness/autonomous_logs/registry.json" feat_clone run_profile <profileFile>`, through `f.lib` or `runBash`. Its refusal leg then has two parts:
    - clear the field (`run_profile ""`) and assert `assertRefusal(…, "the run registry records no per-run profile for 'feat_clone'")`;
    - restore the field, `rm` the file, and assert the existing `no per-run profile for 'feat_clone' at <profileFile>` refusal, which stays as it is.
  - **New case: a redirected `XDG_STATE_HOME` or `HOME` has no effect.** Use the same clone set-up as (k), with the recorded profile protecting `protected.txt`.
    - Create `f.root/alt-state` and `f.root/alt-home`.
    - Write a crafted profile, `{"sandbox":{"filesystem":{"denyWrite":[]}}}`, at the path `hr_run_profile_file` derives under `XDG_STATE_HOME=<f.root>/alt-state`. Write the same crafted profile again under `HOME=<f.root>/alt-home` with `XDG_STATE_HOME` empty.
    - Launch once with `{ XDG_STATE_HOME: <alt-state> }` and once with `{ HOME: <alt-home>, XDG_STATE_HOME: '' }`.
    - Each launch is `pending`, and its recorded vector holds `['--ro-bind', protectedPath, protectedPath]`, as in (k). Compare it with `expectedVector` built from the **recorded** profile. Give `expectedVector` an optional home argument so the `HOME` leg's credential masks are computed under `alt-home`.
  - **New case: an unusable field is a refusal.** A `run_profile` that is relative (`profile.json`), or that names a symbolic link to the real profile, is refused with no `bwrap` call past the preflight.
  - In `cli/test/watcher-run-profile.test.mjs`, add one case in the suite's existing launch shape. After a launch outside job mode, the branch's registry record holds `run_profile` equal to the rendered copy's absolute path, and that file exists.
  - Run only these two test files.
- [ ] **4. Docs.**
  - **`docs/cli.md` residual 13.** Change *"the per-run copy for a run copy"* to *"for a run copy, the per-run copy whose absolute path the watcher recorded in the run's registry record (`run_profile`), never one an environment variable places"*.
  - **`docs/watcher.md` → **Where it is.**** Add one sentence: at every spawn the watcher also records the copy's absolute path in the run's registry record as `run_profile`, which the gate launcher reads.
- [ ] **5. Root copies.** Apply the same edits to `scripts/launch-sandboxed-gates.sh` and `scripts/autonomous-watcher.sh`, and confirm `cmp` is silent against both templates.
  - **Deviations from plan:** (cli layer) Steps 1–3 implemented; steps 4 and 5 lie outside `cli/` and are left to this finding's `general` dispatch. The two new launcher cases are `(n)` (redirect) and `(o)` (unusable field); `(o)` also refuses a value carrying a newline, a refusal branch step 2 names that the plan's fixture list did not. To support them the fixture's `collect` takes an optional label, `lib` gained `libWith(extra, …)` and `recordProfile(branch, value)`, and `expectedVector`'s optional fourth argument is `{ home, label }` rather than a bare home, since the second redirect leg runs under its own label. The clone set-up of `(k)` moved into `registeredClone`, shared by `(k)`, `(n)` and `(o)`.
