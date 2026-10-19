### 4. The read-once rule and `docs/cli.md` residual 1's item 3 omit sync-in's `git-upload-pack` re-read of the clone's `.git/config`, refs and alternates

**Files:**
- `cli/templates/scripts/lib/harness-run-lib.sh`, section THE WATCHER FAMILY'S GIT IN A RUN'S COPY, the second rule bullet: "For a clone the registry, `HEAD`, `alternates` and `.git/config` are read once, and only `<clone>/.git/index` is borrowed: objects and refs are read from the main checkout alone, never through the clone's own store."
- `docs/cli.md` §6, residual 1's item 3 (**The copy check reads the worktree record once**): the sentence "On a clone it reads the run registry, the clone's `HEAD`, `objects/info/alternates` and `.git/config` once each, and sync-out's `update-ref` reads the clone's `.git/config` again;".

**Problem.** On a clone, `hr_run_copy_check_var` calls `hr_copy_sync_in_var`. That runs `ls-remote` and `fetch` with `--upload-pack` against the clone, so `git-upload-pack` runs *in the clone*. It reads the clone's `.git/config`, its refs and its object store, borrowing through `objects/info/alternates`, after the trust check has judged them. `docs/cli.md`'s own **The measured fetch pins — the record.** paragraph says exactly this: it measures which of *"a clone's own configuration keys sync-in's local-transport fetch from the clone honours"*.

- The library bullet says the clone's records are read once, by the checks, and that refs and objects are never read through the clone's store.
- Residual 1's item 3 enumerates the re-reads that can race the check on Linux, and names only sync-out's.

A maintainer weighing that residual before the layout switch reads the list as complete. They would conclude that only sync-out's `update-ref` re-reads `.git/config`, and that the clone's `alternates` is never read again after the check.

**Fix.**

1. In the library bullet, replace the clone sentence with:

```text
#     `config.worktree`. For a clone the checks read the registry, `HEAD`,
#     `alternates` and `.git/config` once; the copy check's sync-in then runs
#     `git-upload-pack` in the clone, which reads the clone's `.git/config`,
#     refs and objects (through `alternates`) again under the measured fetch
#     pins (`docs/cli.md` §6), and after that only `<clone>/.git/index` is
#     borrowed: every runner reads objects and refs from the main checkout
#     alone, never through the clone's own store.
```

2. In `docs/cli.md`, residual 1's item 3, replace the clone sentence's opening with:

```text
On a clone it reads the run registry, the clone's `HEAD`, `objects/info/alternates` and `.git/config` once each; sync-in's fetch then runs `git-upload-pack` in the clone, which reads its `.git/config`, its refs and its `objects/info/alternates` again (which of its keys that fetch honours is *the measured fetch pins* above); and sync-out's `update-ref` reads the clone's `.git/config` again;
```

   Keep the rest of the sentence (`that file is on the allow-list, and the runtime refuses a sandboxed write to it on macOS (…, row CL5), while Linux is unmeasured.`) unchanged.

Comment and document edits only; no test runs.
