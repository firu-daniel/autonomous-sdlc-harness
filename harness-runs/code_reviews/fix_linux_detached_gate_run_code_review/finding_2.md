### 2. The gate worker can write the run copy's `.git` trio, a route the session's own sandbox did not open, and the branch relies on downstream checks instead of closing it

**Severity:** Must Fix. This breaks a binding lesson: `harness-runs/lessons.md` → `## Trust checks`, "**Never drop a protection because another route "can already" reach the same target until that route is measured, and close every route the drop opens, file tools included, before relying on downstream checks.**" _(taught by: fix_linux_sandbox_sibling_glob_trio)_. That lesson was taught by these same three files.

**Sites:**

- `cli/templates/scripts/launch-sandboxed-gates.sh` → `lsg_bwrap_args_var`, the line `--ro-bind / / --dev /dev --proc /proc --tmpfs /tmp --bind "$target" "$target")` and the denyWrite loop that ends at `done <<EOF` / `$list` / `EOF`, before the `.sandbox.credentials.files` read.
- `cli/templates/scripts/launch-sandboxed-gates.sh`, the header block `# THE BWRAP VECTOR`, the bullet `#   --ro-bind <p> <p>, or --ro-bind /dev/null <p> for an absent <p>`.
- `scripts/launch-sandboxed-gates.sh`: this checkout's byte-identical copy of both sites.
- `cli/test/launch-sandboxed-gates.test.mjs` → `expectedVector`, and the test cases that follow `(k) a registered clone takes its protected paths from the per-run profile, and refuses without one`.
- `docs/cli.md` → §6, residual 13, the bullets **What that sandbox holds** and **What it does not hold**.

**Problem.**

The launcher protects inside its worker only the `denyWrite` paths of the session's own profile (`lsg_bwrap_args_var`). On a bubblewrap host, the per-run profile deliberately leaves three paths of the run copy out of `denyWrite`: `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates`. These are the rows marked `omit` in `cli/templates/scripts/autonomous-watcher.sh` → `RUN_PROFILE_COPY_GIT_PATHS`, applied by `run_profile_entries`. They are left out because a placeholder mounted there breaks git (`docs/sandbox-verification.md` §5 F9).

The session's own sandbox nevertheless did not land a write to them. A sandboxed `dd if=/dev/null of=<clone>/.git/commondir conv=notrunc` reported success, and the file was not on disk (AP8, quoted in `docs/cli.md` §6 and in the `autonomous-watcher.sh` header above `RUN_PROFILE_COPY_GIT_PATHS`). The gate worker, by contrast, writes through a real `--bind <target> <target>`. Session-written test code running in the worker can therefore create or rewrite any of the three files in the clone. So this branch opens a write route to the trio that the session itself does not have.

The only thing that would stop a planted file is the downstream trust checks, which fail closed: `hr_clone_target_check_var` condition 3 in the wrappers, and `spawn_engine`'s launch check. The lesson forbids relying on them for a route the change opens: the route must be closed first. Closing it is not forced to fail. The worker's own state goes to the lane under `<state_dir>` (`hr_test_run_lane_dir` → `$state_dir/$HR_TEST_RUN_LOG_SUBDIR/<branch>`), not to `<target>/.git`. `run-test-suite.sh` runs git only through `hr_repo_root`, which is a read. Its two gates are `commands.typecheck` and `commands.test`. The story plan does not mention the trio, so no planning decision authorized leaving it open.

The documents also overstate the protection. The header claims "NO WRITE TO A PATH THE SESSION ITSELF CANNOT WRITE". Residual 13's **What it does not hold** does not mention the trio. GS2 measures only `<target>/.git/config`.

**Why the fix is a read-only bind of the whole `<target>/.git`, placed after the denyWrite loop.**

- A `/dev/null` placeholder at an absent trio path is the F9 breakage, so the trio cannot be pinned path by path. Two of the three (`commondir`, `config.worktree`) sit directly in `.git/`. The only way to stop their creation is to make `.git/` itself read-only.
- The bind must come **after** the denyWrite loop, not right after `--bind <target> <target>`. `bwrap` makes each `--ro-bind` read-only as it mounts it. The loop then mounts placeholders at absent paths under `.git` (for example `.git/objects/info/alternates`), and their mount points could not be created inside an already read-only `.git`. Placed last, the placeholders are created first in the writable target, and then `.git` is covered read-only. The supervisor's existing sweep (`hr_placeholder_sweep_paths_var`) still removes the placeholder files afterwards.
- In job mode the base profile already write-denies the main checkout's `.git`, so the loop may already have emitted the same bind. A second identical `--ro-bind` is harmless and keeps the code free of a special case.

**Fix.**

1. In `cli/templates/scripts/launch-sandboxed-gates.sh` → `lsg_bwrap_args_var`, insert the following directly after the denyWrite loop's closing `EOF` line and before `  if ! list="$(jq -r '(.sandbox.credentials.files // [])`:
   ```bash

     # The run copy's `.git`, read-only and last among the target's binds: it
     # closes the `omit` trio (`autonomous-watcher.sh` → RUN_PROFILE_COPY_GIT_PATHS),
     # which no placeholder may pin (F9), and comes after the loop so bwrap can
     # still create the loop's placeholder mount points under it.
     if [ -e "$target/.git" ] || [ -L "$target/.git" ]; then
       LSG_ARGS+=(--ro-bind "$target/.git" "$target/.git")
     fi
   ```
2. In the same file, in the header block `# THE BWRAP VECTOR`, insert this bullet directly after the bullet whose last line is `#       a refusal. The supervisor sweeps its placeholders after \`bwrap\` exits.` and before `#   --tmpfs <dir> / --ro-bind /dev/null <file>, --unsetenv <name>`:
   ```
   #   --ro-bind <target>/.git <target>/.git, after the entries above
   #       NO WRITE TO THE RUN COPY'S GIT RECORDS: it closes `.git/commondir`,
   #       `.git/config.worktree` and `.git/objects/info/http-alternates`, which a
   #       per-run profile leaves out of `denyWrite` on a bubblewrap host and no
   #       placeholder may pin (§5 F9). It comes last so the placeholders above
   #       are created before `.git` turns read-only.
   ```
3. Make both edits in `scripts/launch-sandboxed-gates.sh` as well, so that `cmp cli/templates/scripts/launch-sandboxed-gates.sh scripts/launch-sandboxed-gates.sh` still prints nothing.
4. In `cli/test/launch-sandboxed-gates.test.mjs` → `expectedVector`, insert after the denyWrite `for` loop's closing `}` and before `const homes = [f.home];`:
   ```js
     if (present(join(target, '.git'))) v.push('--ro-bind', join(target, '.git'), join(target, '.git'));
   ```
   Cases `(g)(h)` and `(k)` then compare against a vector that carries the bind.
5. In the same file, add this case directly after case `(k)`'s closing `});`:
   ```js
   test('(l) the vector binds the target\'s .git read-only after every denyWrite entry, closing the omit trio', async (t) => {
     const f = await launcherFixture(t);
     const r = await f.launch([f.dir, LABEL]);
     assert.deepEqual([r.status, r.stdout], [3, 'pending\n'], output(r));
     const verdict = await f.collect(f.dir);
     assert.deepEqual([verdict.status, verdict.stdout], [0, 'pass\n'], output(verdict));
     const argv = lines(f.record);
     const git = join(f.dir, '.git');
     const at = argv.lastIndexOf(git);
     assert.deepEqual(argv.slice(at - 2, at + 1), ['--ro-bind', git, git], argv.join('\n'));
     const after = argv.slice(at + 1);
     const pinnedAfter = after.filter((a, i) => after[i - 1] === '/dev/null' && a.startsWith(`${f.dir}/`));
     assert.deepEqual(pinnedAfter, [], `a denyWrite placeholder follows the .git bind:\n${argv.join('\n')}`);
     for (const p of ['commondir', 'config.worktree', 'objects/info/http-alternates']) {
       assert.ok(!argv.includes(join(git, p)), `${p} is pinned path by path, which F9 forbids:\n${argv.join('\n')}`);
     }
     await f.until(() => existsSync(join(f.out, 'bwrap-exited')), 'the bwrap stub to exit');
   });
   ```
6. In `docs/cli.md` → §6, residual 13, **What that sandbox holds**, add this bullet after the bullet beginning `every exact \`sandbox.filesystem.denyWrite\` path of the session's own profile`:
   ```
     - the target's `.git` read-only, bound after those paths, which closes the run copy's `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates`: a per-run profile leaves them out of `denyWrite` on a bubblewrap host (`autonomous-watcher.sh` → `RUN_PROFILE_COPY_GIT_PATHS`, the `omit` rows), no placeholder may pin them (`docs/sandbox-verification.md` §5 F9), and the worker's real `--bind` of the target would otherwise let it write what the session's own sandbox did not land (AP8). The gate run's own records go to the lane under `<state_dir>`, not to `.git`;
   ```
7. In the same residual, **What it does not hold**, add this bullet after the bullet beginning `a \`denyWrite\` entry carrying \`*\` is not applied`:
   ```
     - a gate whose command writes the target's own `.git` (a commit, an index refresh it does not tolerate failing) fails inside the worker, because `.git` is read-only there, which is stricter than the session's sandbox; GS2 measures `.git/config` alone, and the `.git` bind is derived from the code, not measured;
   ```

The suite runs in the Run gates phase. This fix asks for no test run of its own. `bash scripts/typecheck.sh`'s shell-parse check covers both launcher copies.

**If the implementer finds evidence that no closing route works under `bwrap`** (for example, a measured `bwrap` failure with the `.git` bind in this position), do not record a residual. Stop and raise it as a question to the user before the fix ships, quoting that evidence (`harness-runs/lessons.md` → `## Unattended control loops`).
