### 5. A linked status source prints two skip lines when the bundle is still written

**File:** `cli/templates/scripts/remote-run.sh` (`verb_save`) — "save_link_free \"$HR_REMOTE_STATUS_SOURCE\" || status_source=\"\""; and `docs/cli.md` → `## 6. The failure modes the permission profile encodes` → `**Residuals, stated rather than hidden:**`, residual 1, item 5 — "(`remote-run.sh` → `save_link_free`)"

Goal 1 of the task prompt says that for each skipped path `save` *"prints one line on stderr naming the path and that it was a link"*. Here is what happens when `autonomous_logs/remote_status.json` is a link and the registry is not. `verb_save`'s `save_link_free "$HR_REMOTE_STATUS_SOURCE"` prints `remote-run.sh: save: skipped <path>: <linked> is a symbolic link` and clears `status_source`. The save then takes the `else` arm and calls `hr_remote_bundle_write`, which runs `hr_remote_bundle_source_ok` on the same source and prints `remote state bundle: skipped <path>: <linked> is a symbolic link`. That makes two lines for one path. Case `(F)`'s `autonomous_logs/remote_status.json` subtest produces exactly this, but its assertion checks only that a line is present, not how many. A reader of the job log sees one planted link reported twice, in two different forms. The registry has no such duplicate, because the library never tests it.

**Fix:** have `verb_save` print its own status-source line only on the arm where the library is not called.

In `verb_save`, add `status_linked=''` to the `local` line, so that it reads `local registry_file status_source status decision detail registry_absent=0 status_linked=''`. Then replace

```bash
  save_link_free "$HR_REMOTE_STATUS_SOURCE" || status_source=""
```

with

```bash
  # Its skip line is printed below only when no bundle is written; otherwise
  # `hr_remote_bundle_write` tests the same source and prints its own.
  if ! hr_remote_link_free_var "$root" "$HR_REMOTE_STATE_DIR/$HR_REMOTE_STATUS_SOURCE"; then
    status_linked=$HR_REMOTE_LINKED
    status_source=""
  fi
```

and in the never-started arm, insert as the arm's first line, before `mkdir -p "$out_dir"`:

```bash
    [ -z "$status_linked" ] \
      || echo "remote-run.sh: save: skipped $root/$HR_REMOTE_STATE_DIR/$HR_REMOTE_STATUS_SOURCE: $status_linked is a symbolic link" >&2
```

In `docs/cli.md` residual 1 item 5, replace the sentence

> `save` applies the same test to the status source and `autonomous_logs/registry.json` before reading either and treats a linked one as absent, printing `remote-run.sh: save: skipped <path>: <linked> is a symbolic link` (`remote-run.sh` → `save_link_free`).

with

> `save` applies the same test to the status source and `autonomous_logs/registry.json` before reading either and treats a linked one as absent, printing `remote-run.sh: save: skipped <path>: <linked> is a symbolic link` for a linked registry, and for a linked status source when no bundle is written; when one is, the library's own line names it (`remote-run.sh` → `verb_save`).

In `cli/test/remote-save-links.test.mjs`, case `(F)`'s `STATUS_SOURCE` subtest, after `assertSkipped(result.stderr, path);` add:

```js
    assert.equal(result.stderr.split(`skipped ${path}: `).length - 1, 1, `the skip line for ${path} is not printed exactly once\n${result.stderr}`);
```

That test file is the only one this fix edits, so run it alone: `npm test --workspace cli -- test/remote-save-links.test.mjs`.
