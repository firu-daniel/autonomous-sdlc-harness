### 1. The gate worker can write Claude Code's built-in protected paths in the target, which the session's own sandbox refuses

**Severity:** Must Fix. The change opens a write route the session's own sandbox does not have. That breaks `harness-runs/lessons.md` → `## Trust checks`: *"close every route the drop opens … before relying on downstream checks"*. It also realises the story plan's first top risk, `## Context` → **Top risks:**: *"a worker sandbox wider than the session's: … with write access … to a protected path inside it"*. The launcher's own header says otherwise, with the claim *"NO WRITE TO A PATH THE SESSION ITSELF CANNOT WRITE"*.

**Sites:**

- `cli/templates/scripts/launch-sandboxed-gates.sh` → `lsg_bwrap_args_var`, the block that opens with `# The run copy's \`.git\`, read-only and last among the target's binds` and ends with `LSG_ARGS+=(--ro-bind "$target/.git" "$target/.git")`.
- The same file, header block `# THE BWRAP VECTOR`, the bullet `#   --ro-bind <p> <p>, or --ro-bind /dev/null <p> for an absent <p>`, and its line `NO WRITE TO A PATH THE SESSION ITSELF CANNOT WRITE`.
- `scripts/launch-sandboxed-gates.sh`, this checkout's byte-identical copy of both sites.
- `cli/test/launch-sandboxed-gates.test.mjs` → `expectedVector`.
- `docs/cli.md` → §6, residual 13, the bullets **What that sandbox holds** and **What it does not hold**.

**Problem.**

Claude Code's sandbox write-protects a set of paths at the root of the directory a session runs in, whatever the profile says. Claude Code's own list is not readable from a run. This repository recorded one session's reading of it in a run copy: `docs/sandbox-verification.md` → the paragraph **Claude Code's built-in protected paths, new in this session.** (AP7's session, 2026-10-30, Claude Code 2.1.314), where sandboxed `git status` listed these 21 paths as untracked. The record calls this *"one session's reading, not Claude Code's definition of the list"*.

The read-only placeholder reading comes from a later re-measure: `docs/sandbox-verification.md` §6, the bullet **Claude Code's built-in protected paths in a run copy:** (2026-10-31, Claude Code 2.1.316). There, each of the same 21 paths read as a character special file mounted from `/null` (`tmpfs, ro`) inside the sandbox at the clone's root:

```
.bash_profile .bashrc .claude/agents .claude/commands .claude/hooks .claude/launch.json .claude/loop.md .claude/output-styles .claude/routines .claude/scheduled_tasks.json .claude/skills .claude/workflows .gitconfig .gitmodules .idea .mcp.json .profile .ripgreprc .vscode .zprofile .zshrc
```

`scripts/sandbox-absent-path-check.sh` → `BUILTIN_PATHS` carries the same list, and the comment above it gives the same hedge. On that reading, a session cannot create or rewrite `<clone>/.claude/agents/…`, `<clone>/.claude/commands/…`, `<clone>/.claude/skills/…`, `<clone>/.claude/hooks/…`, `<clone>/.gitmodules` and the rest.

The launcher's worker gets no such protection. Its vector is `--bind <target> <target>` (writable). After that it carries only:

- the exact `denyWrite` entries of the session's profile;
- the target's `.git`;
- the credential masks.

For a run copy, the per-run profile's exact entries under the target come from `hr_run_protected_rel_paths` (`githooks`, `.mcp.json`, `.claude/settings.json`, `.claude/settings.local.json`, and the docs-search pair) and `RUN_PROFILE_COPY_GIT_PATHS`. Neither names any of the twenty built-ins other than `.mcp.json`.

So inside the worker, `bash <target>/<scripts_dir>/run-test-suite.sh --no-detach <label>` runs the session-written build and tests, and that code can write all twenty built-ins in the run copy. Those are the files Claude Code loads as its own project configuration. The next session the watcher launches in that run copy, after a pause or a stall-watchdog restart, picks up whatever the gate run planted, and nothing checks them:

- `hr_clone_target_check_var` and `spawn_engine`'s launch check read `.git` records, not `.claude/`.
- The PreToolUse guards see tool calls, not files a gate process wrote.

**Why it is reachable.** On every bubblewrap host where `bwrap` starts, the launcher answers `pending` and runs the gate under this vector. That is the branch's whole Linux path, autonomous forks and remote jobs alike. No measurement is needed to see the route: it follows from the vector the code builds, compared with the record above.

**Proof.**

- `lsg_bwrap_args_var` adds read-only binds from exactly three sources: the denyWrite loop (`jq -r '.sandbox.filesystem.denyWrite …'`), the `.git` bind, and `lsg_mask_credential` for `.sandbox.credentials.files`, which covers home-directory credentials, not the target.
- `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_run_protected_rel_paths` prints `"$hooks" .mcp.json .claude/settings.json .claude/settings.local.json` and, when docs retrieval applies, `$scripts/docs-search-server.sh` and `$scripts/lib`. No `.claude/agents`, `.claude/commands`, `.claude/skills`, `.claude/hooks` or `.gitmodules`.
- `docs/cli.md` §6 residual 13 → **What it does not hold** names neither the built-ins nor this route.

**Fix.** Pin the built-ins in the worker. Treat `.claude` as the `.git` bind already treats `.git`: one read-only bind of the whole directory, placed after the denyWrite loop so the loop's placeholders under it (such as `.claude/settings.local.json`) are still created first. Pin the root-level built-ins path by path. Leave out `.mcp.json`, which every profile's exact list already carries.

1. In `cli/templates/scripts/launch-sandboxed-gates.sh` → `lsg_bwrap_args_var`, insert the following directly **before** the comment line `  # The run copy's \`.git\`, read-only and last among the target's binds: it`, so these binds sit between the denyWrite loop and the `.git` bind:
   ```bash
     # Claude Code's own protected paths at the target's root, which its sandbox
     # write-protects whatever the profile says (`docs/sandbox-verification.md`,
     # the paragraph "Claude Code's built-in protected paths, new in this
     # session."): `.claude` whole, read-only after the loop so the loop's
     # placeholders under it are created first, and each root-level one by path.
     # `.mcp.json` is left out: every profile's exact list carries it.
     for rel in .bash_profile .bashrc .gitconfig .gitmodules .idea .profile .ripgreprc .vscode .zprofile .zshrc; do
       c="$target/$rel"
       if [ -e "$c" ] || [ -L "$c" ]; then
         LSG_ARGS+=(--ro-bind "$c" "$c")
       else
         LSG_ARGS+=(--ro-bind /dev/null "$c")
         LSG_PLACEHOLDERS="$LSG_PLACEHOLDERS$c$nl"
       fi
     done
     if [ -e "$target/.claude" ] || [ -L "$target/.claude" ]; then
       LSG_ARGS+=(--ro-bind "$target/.claude" "$target/.claude")
     else
       LSG_ARGS+=(--ro-bind /dev/null "$target/.claude")
       LSG_PLACEHOLDERS="$LSG_PLACEHOLDERS$target/.claude$nl"
     fi

   ```
   `rel` and `c` are already declared on that function's `local` line (`local list p c leaf home homes h rel name script nl='`), so add no declaration.
2. In the same file, header block `# THE BWRAP VECTOR`, insert this bullet directly before the bullet that opens `#   --ro-bind <target>/.git <target>/.git, after the entries above`:
   ```
   #   --ro-bind <target>/.claude <target>/.claude, and --ro-bind <p> <p> or
   #   --ro-bind /dev/null <p> for each root-level built-in <p>
   #       NO WRITE TO CLAUDE CODE'S OWN PROTECTED PATHS: the session's sandbox
   #       write-protects them at its root whatever the profile says
   #       (`docs/sandbox-verification.md`, "Claude Code's built-in protected
   #       paths"); `.claude` whole, after the entries above, and `.bash_profile`,
   #       `.bashrc`, `.gitconfig`, `.gitmodules`, `.idea`, `.profile`,
   #       `.ripgreprc`, `.vscode`, `.zprofile`, `.zshrc` by path.
   ```
3. Make edits 1 and 2 in `scripts/launch-sandboxed-gates.sh` as well, so `cmp cli/templates/scripts/launch-sandboxed-gates.sh scripts/launch-sandboxed-gates.sh` still prints nothing.
4. In `cli/test/launch-sandboxed-gates.test.mjs` → `expectedVector`, insert directly before the line `  if (present(join(target, '.git'))) v.push('--ro-bind', join(target, '.git'), join(target, '.git'));`:
   ```js
     for (const rel of ['.bash_profile', '.bashrc', '.gitconfig', '.gitmodules', '.idea', '.profile', '.ripgreprc', '.vscode', '.zprofile', '.zshrc']) {
       const p = join(target, rel);
       if (present(p)) v.push('--ro-bind', p, p);
       else v.push('--ro-bind', '/dev/null', p);
     }
     const claude = join(target, '.claude');
     if (present(claude)) v.push('--ro-bind', claude, claude);
     else v.push('--ro-bind', '/dev/null', claude);
   ```
   Cases `(g)(h)`, `(k)` and `(l)` then compare against a vector that carries these binds. `(l)`'s *no placeholder after the `.git` bind* assertion still holds, because they all come before it. `(h)`'s sweep and unchanged-tree assertions cover the new root-level placeholders.
5. In the same file, add this case directly after case `(l)`'s closing `});`:
   ```js
   test('(m) the vector pins Claude Code\'s built-in protected paths at the target\'s root, .claude read-only after every denyWrite entry', async (t) => {
     const f = await launcherFixture(t);
     const r = await f.launch([f.dir, LABEL]);
     assert.deepEqual([r.status, r.stdout], [3, 'pending\n'], output(r));
     const verdict = await f.collect(f.dir);
     assert.deepEqual([verdict.status, verdict.stdout], [0, 'pass\n'], output(verdict));
     const argv = lines(f.record);
     const claude = join(f.dir, '.claude');
     const at = argv.lastIndexOf(claude);
     assert.deepEqual(argv.slice(at - 2, at + 1), ['--ro-bind', claude, claude], argv.join('\n'));
     const after = argv.slice(at + 1, argv.indexOf('--'));
     const underClaude = after.filter((a) => a.startsWith(`${claude}/`));
     assert.deepEqual(underClaude, [], `a bind under .claude follows the .claude bind:\n${argv.join('\n')}`);
     for (const rel of ['.bashrc', '.gitmodules', '.vscode']) {
       const p = join(f.dir, rel);
       const i = argv.indexOf(p);
       const pinned = (i > 0 && argv[i - 1] === '--ro-bind' && argv[i + 1] === p)
         || (i > 1 && argv[i - 2] === '--ro-bind' && argv[i - 1] === '/dev/null');
       assert.ok(pinned, `${rel} is not pinned:\n${argv.join('\n')}`);
     }
     await f.until(() => existsSync(join(f.out, 'bwrap-exited')), 'the bwrap stub to exit');
   });
   ```
   The pinning check accepts both shapes the vector can carry:
   - `--ro-bind <p> <p>` for a present path, where `argv.indexOf(p)` finds the source position and `--ro-bind` sits at `i - 1`;
   - `--ro-bind /dev/null <p>` for an absent path, where `--ro-bind` sits at `i - 2`.

   So the case still passes if the `init` fixture later gains `.bashrc`, `.gitmodules` or `.vscode`.
6. In `docs/cli.md` → §6, residual 13, **What that sandbox holds**, add this bullet directly after the bullet that opens `` - the target's `.git` read-only, bound after those paths``:
   ```
     - Claude Code's own protected paths at the target's root, which the session's sandbox write-protects whatever the profile says (`docs/sandbox-verification.md`, the paragraph *"Claude Code's built-in protected paths, new in this session."*): the target's `.claude` read-only as a whole, bound after the profile's paths, and `.bash_profile`, `.bashrc`, `.gitconfig`, `.gitmodules`, `.idea`, `.profile`, `.ripgreprc`, `.vscode`, `.zprofile` and `.zshrc` each read-only, an absent one through a swept `/dev/null` placeholder. Without them, session-written gate code could plant project agents, commands, skills or hooks that the next session in the run copy loads;
   ```
7. In the same residual, **What it does not hold**, add this bullet directly after the bullet that opens `` - a gate whose command writes the target's own `.git` ``:
   ```
     - a gate whose command writes under the target's `.claude` fails inside the worker, because `.claude` is read-only there as a whole, which is stricter than the session's sandbox; the built-in list is the one session's reading `docs/sandbox-verification.md` records, derived into the code and not measured in the worker;
   ```

The suite runs in the Run gates phase. This fix asks for no test run of its own. `bash scripts/typecheck.sh`'s shell-parse check covers both launcher copies.
