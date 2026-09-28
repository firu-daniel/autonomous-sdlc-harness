### 3. Correct `remote/githubActions.ts`'s mirror list, which names the watcher

**Severity:** Should Fix · **Layer:** cli

**Site.** `cli/src/remote/githubActions.ts`: the module header's paragraph *"**Shell and YAML mirrors that must agree byte for byte.** The compiler cannot reach them, so each declares the mirror in its own header, and a rename here is an edit to each of them: `cli/templates/scripts/remote-run.sh`, `cli/templates/scripts/autonomous-watcher.sh`, `cli/templates/github/workflows/harness-run.yml` and `cli/templates/github/workflows/harness-resume.yml`."*

**Problem.** The header lists four mirrors and says each declares the mirror in its own header. Three of them do:
- `remote-run.sh` has the `MIRRORS OF \`cli/src/remote/githubActions.ts\`` block;
- both workflow templates have a `DECLARED MIRRORS` block.

`cli/templates/scripts/autonomous-watcher.sh` has no such declaration, and it spells none of this module's names in code. It reaches GitHub only through `REMOTE_RUN="$SCRIPT_DIR/remote-run.sh"`. `harness-run.yml` and `HARNESS_GH_CLI` appear in it only inside REPRO comment lines. The header therefore states a guarantee that is false for one of the files it names. `.claude/context/cli.md` → `## What "done" means here` says: *"Where the header states a rule, the change either satisfies it or amends the header in the same edit — a header a review reads as a guarantee is worth exactly what the code under it still does."*

**Fix.** Pick one of these. The first is smaller.
- Remove `cli/templates/scripts/autonomous-watcher.sh` from the mirror list in `cli/src/remote/githubActions.ts`'s header, leaving `remote-run.sh` and the two workflow templates. Optionally add one clause: the watcher reaches GitHub only through `remote-run.sh` and spells none of these names.
- Or, if the watcher is meant to be a mirror, add a `MIRRORS OF \`cli/src/remote/githubActions.ts\`` block to the watcher's header naming exactly the names it depends on. Then make sure `cli/test/remote-names.test.mjs`, if it sweeps the declared mirrors, covers it.
