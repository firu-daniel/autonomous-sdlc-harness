### 1. Stop the quiet pass-start sweep from logging every kept path on every poll

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `placeholder_sweep_pass`, the loop `[ -n "$line" ] && log "placeholder sweep: kept $line"`. The same function is in its byte-identical self-adopted copy, `scripts/autonomous-watcher.sh`. The documenting sentence is `docs/watcher.md` → *"It logs `placeholder sweep: removed <path>`, `placeholder sweep: kept <path>: <reason>` and … the last not at a pass start."*

**Problem.** `tick` calls `placeholder_sweep_pass "" 1` at the start of every pass, every `POLL_INTERVAL_SECS` (15 s by default). `<quiet>` silences only the `skipped` line. The `kept` loop logs whatever the quiet setting.

A kept path never leaves its manifest. Nothing removes it, and the manifest is rewritten only when that branch spawns again, or deleted by `cleanup-merged-worktrees.sh` once the branch's copy goes. So every pass-start sweep finds the same path again and logs it again. Two ordinary cases make this happen:

- A file a person creates after a spawn, at a path the spawn recorded as absent. For example, `<main>/.claude/settings.local.json`, which an interactive Claude Code session writes when someone approves a rule, or a `<main>/.mcp.json` that a later `init` adds. The file has content, so it is kept with `has content` on every pass.
- A run the launch check refused for a planted file with content (the case `cli/test/watcher-placeholder-host.test.mjs` case (5) covers). The refusal returns before the manifest write, and the record goes to `failed`, so nothing ever rewrites or deletes its manifest. The planted path is logged on every pass until someone deletes the manifest by hand.

On a bubblewrap host either case adds one `watcher.log` line per kept path every 15 s (about 5,760 a day) for as long as the manifest stays. No decision depends on those lines: the spawn-time and inbox sweeps (`<quiet>` `0`) still log each kept path at the point where it matters, and the launch check names a planted file in its own refusal.

**Fix.** Make `<quiet>` silence the kept lines as well as the skip line, and say so wherever the behaviour is stated. Apply every code edit identically to `cli/templates/scripts/autonomous-watcher.sh` and `scripts/autonomous-watcher.sh`, so the two stay byte-identical.

1. In `placeholder_sweep_pass`, replace

   ```bash
     while IFS= read -r line; do
       [ -n "$line" ] && log "placeholder sweep: kept $line"
     done <<EOF
   $HR_PLACEHOLDER_KEPT
   EOF
   ```

   with

   ```bash
     if [ "$quiet" != "1" ]; then
       while IFS= read -r line; do
         [ -n "$line" ] && log "placeholder sweep: kept $line"
       done <<EOF
   $HR_PLACEHOLDER_KEPT
   EOF
     fi
   ```

2. In that function's header comment, replace

   ```
   # (lib/harness-run-lib.sh, PLACEHOLDER LEFTOVERS), one log line per removed and
   # per kept path. A live session's placeholders are its own mounts, so a live
   # run skips the sweep, logged unless <quiet> is 1. Returns 0.
   ```

   with

   ```
   # (lib/harness-run-lib.sh, PLACEHOLDER LEFTOVERS), one log line per removed
   # path, and per kept path unless <quiet> is 1: a kept path stays in its
   # manifest, so a pass-start sweep would log it again on every poll. A live
   # session's placeholders are its own mounts, so a live run skips the sweep,
   # logged unless <quiet> is 1. Returns 0.
   ```

3. In `tick`, replace the comment line `# live run would otherwise log its skip on every poll.` (the second line of the comment above `placeholder_sweep_pass "" 1`) with `# live run's skip, and every kept path, would otherwise be logged on every poll.`

4. In `docs/watcher.md`, in the sentence quoted under **Site**, replace `, the last not at a pass start.` with `, the last two not at a pass start.`

5. Add a case to `cli/test/watcher-placeholder-host.test.mjs`, after case (6), using that suite's existing helpers:

   ```js
   test('(7) a kept path is not logged by the quiet pass-start sweep', async (t) => {
     const f = await adoptedFixture(t);
     if (f === null) return;
     const path = join(f.dir, '.mcp.json');
     await f.recordAbsent(path);
     await writeFile(path, '{}\n', 'utf8');

     await f.tick({}, { placeholderHost: true });
     await f.tick({}, { placeholderHost: true });

     const log = f.watcherLog();
     assert.ok(!log.includes(`placeholder sweep: kept ${path}`), log);
     assert.equal(readFileSync(path, 'utf8'), '{}\n');
   });
   ```

   Case (5)'s assertion `placeholder sweep: kept ${path}: has content` still holds, because that line comes from `spawn_engine`'s sweep, which is not quiet. The suite's header names the rule it enforces. If that header lists its cases, add (7) to the list.

6. Run that one edited test file as the unit's own verification.
