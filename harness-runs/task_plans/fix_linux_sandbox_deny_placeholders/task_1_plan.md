### Task 1 — Mark the three run-copy `.git` trust files `bubblewrapDenyWrite: false` and state the Linux placeholder finding in the profile's `_README` and `doctor`'s note

**Goal:** Make `COPY_GIT_PATHS` the one statement of which run-copy `.git` rows take no `sandbox.filesystem.denyWrite` entry on a host sandboxed by bubblewrap (Linux, WSL2). Then bring the generated profile's `_README` and `doctor`'s `profile-write-protection` note into line with the 2026-10-29 Linux measurement. The base profile's entries and `doctor`'s grading do not change on any host.

**Where this task stops.** It adds the flag and the prose that names it. The watcher's per-run render reads the flag through its declared mirror, but that mirror's third column and the omission itself are **Task 4's**. This task changes no shell file.

### Targets

- `cli/src/generators/writeProtection.ts`
- `cli/src/doctor/checks.ts` → `PROFILE_WRITE_PROTECTION_CHECK`
- `cli/test/profile.test.mjs`
- `cli/test/doctor.test.mjs`

**Work:**

- [ ] `writeProtection.ts` → `CopyGitPath`:
  - Add `readonly bubblewrapDenyWrite: boolean`. Its doc comment states the measured reason. On a bubblewrap host, Claude Code enforces an exact `denyWrite` entry for an absent path by mounting a placeholder at that path, and the file can outlive the call (`docs/sandbox-verification.md` → §5 F9; 2026-10-29, Claude Code 2.1.312, bubblewrap 0.8.0). A row marked `false` is a file a clone the harness made never has, and the wrappers' clone check refuses it (`cli/templates/scripts/lib/harness-run-lib.sh` → `hr_clone_target_check_var`, condition 3). So the per-run copy there carries no `denyWrite` entry for it. Its `Edit` rules stay, and the watcher's launch check refuses a run copy that carries one.
  - Set the field to `true` for `.git/config`, `.git/hooks` and `.git/objects/info/alternates`, and to `false` for `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates`.
  - `protectedPaths` and `applyWriteProtection`'s `denyWrite` set are unchanged on every host: the base still writes all six rows under the sibling glob.
- [ ] `writeProtection.ts`, the module header's mirror bullet for `cli/templates/scripts/autonomous-watcher.sh`: it now holds *each row's relative path, kind and `bubblewrapDenyWrite`*, spelled as a third column `deny` (true) or `omit` (false). Task 4 writes that column. Until then the existing mirror test still compares path and kind only, and stays green.
- [ ] `writeProtection.ts` → `applyWriteProtection`'s `_README` line. Rewrite its Linux sentences. Keep the glob clause as it stands: how the Linux sandbox treats a `denyWrite` entry containing `*` is still unverified, because the 2026-10-29 check left the globs out. Replace *"by exact path, which holds on Linux too"* with a host-neutral statement:
  - On a host sandboxed by bubblewrap, Claude Code enforces an exact entry for an absent path by mounting a placeholder at that path, which breaks git in the run copy and can be left on disk.
  - So the per-run copy there leaves out the rows whose `bubblewrapDenyWrite` is `false`. Name them from `COPY_GIT_PATHS` filtered on the flag, never retyped.
  - Their `Edit` rules stay, and the watcher refuses to launch or resume a run copy carrying one.
  - The text must not depend on the host that renders it. `examples/notes-app/.claude/settings.autonomous.json` carries this line (Task 10).
- [ ] `checks.ts` → `PROFILE_WRITE_PROTECTION_CHECK`, the passing message's Linux sentence:
  - Keep the glob clause.
  - Add that on Linux an exact entry for a path that does not exist is enforced by a placeholder at that path, measured 2026-10-29 on Claude Code 2.1.312 with bubblewrap 0.8.0. Name the three paths from `COPY_GIT_PATHS` filtered on `bubblewrapDenyWrite === false`.
  - Add that the watcher's per-run copy leaves those three out of `denyWrite` there and refuses a run copy carrying one.
  - The grading, the findings and the stale-entry arm are untouched. Add one sentence to the check's doc comment stating that the base it grades is the same on every host.
- [ ] Tests:
  - `profile.test.mjs`: assert that the `WHAT RUNS OUTSIDE THE SANDBOX` `_README` line names each `bubblewrapDenyWrite: false` row and the placeholder clause. Keep the existing assertion that all six `COPY_GIT_PATHS` rows are protected under the glob, so the base is unchanged.
  - `doctor.test.mjs`: on a fixture whose profile `init` wrote, assert that a passing `profile-write-protection` line carries the placeholder clause and each of the three paths.

**Verification:**

- `npm test --workspace cli -- test/profile.test.mjs` and `npm test --workspace cli -- test/doctor.test.mjs` pass.
- `git grep -n 'bubblewrapDenyWrite' -- cli/src` names the field's declaration, its six values and its readers in `applyWriteProtection` and `PROFILE_WRITE_PROTECTION_CHECK`, and nothing else.
- No path string for the three rows is retyped in `checks.ts`. Both messages read them off `COPY_GIT_PATHS`.
