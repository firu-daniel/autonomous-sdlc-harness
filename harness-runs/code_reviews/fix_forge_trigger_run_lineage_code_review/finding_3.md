### 3. `remote-run.sh discard` removes any non-symlink path inside scratch, including the committed `scratch/README.md`, although its header says scratch holds only throwaway files a session wrote

**File:** `cli/templates/scripts/remote-run.sh` (`verb_discard`). Anchor quote: `if ! rm -rf -- "$HR_SCRATCH_TARGET" || [ -e "$HR_SCRATCH_TARGET" ]; then`

**The problem.** The verb is documented as `remote-run.sh discard <dir>`. The exit map says "for discard: <dir> removed", and `docs/remote-execution.md` says "`discard` removes only a directory strictly inside `<stateDir>/scratch/`". The comment above `verb_discard` justifies the scope by the lessons-ledger rule "never removes one it did not create", on the grounds that "scratch holds only throwaway files a session itself wrote".

In practice `verb_discard` removes whatever `hr_scratch_path_var` accepts. That includes any regular file under scratch, and `<state_dir>/scratch/README.md` in particular. That README is the one committed file in the directory, written by `init` rather than by a session. It is also what keeps the directory, and its contents-only ignore rule, in a fresh clone (`cli/templates/state-dir/scratch/README.md` → "this README survives by an explicit negation, which makes it the only committed file here"). So `bash <scripts_dir>/remote-run.sh discard <state_dir>/scratch/README.md` exits 0 and deletes a tracked file, which contradicts the header's own justification.

**Fix.**

- [ ] In `verb_discard`, right after the `if [ ! -e "$HR_SCRATCH_TARGET" ]; then … return 0; fi` block and before the `rm -rf` line, refuse a target that exists but is not a directory:

  ```bash
  if [ ! -d "$HR_SCRATCH_TARGET" ]; then
    echo "remote-run.sh: discard refused, nothing removed: '$discard_dir' is not a directory" >&2
    exit "$EXIT_REFUSED"
  fi
  ```

- [ ] In the header's exit map, extend the code-2 `discard` sentence from "For discard, <dir> does not resolve strictly inside `<state_dir>/scratch/`, or is a symlink; nothing removed" to "For discard, <dir> does not resolve strictly inside `<state_dir>/scratch/`, is a symlink, or exists and is not a directory; nothing removed".
- [ ] In the header's `` `discard` REMOVES THE DIRECTORY A COMMAND FETCHED INTO `` paragraph, change "and not a symlink (2 otherwise)" to "not a symlink, and a directory when it exists (2 otherwise)".
- [ ] In `cli/test/remote-run.test.mjs`, in the case `discard refuses every path not strictly inside scratch, or a symlink, with exit 2 and every byte unchanged`, add `` `${SCRATCH}/README.md` `` to the `for (const target of [...])` list. The fixture's `init` writes that file, so the existing `fixtureBefore` snapshot assertion then proves it survives. Also add `, or a file` to that test's title after `or a symlink`, and to the file header's `discard` rule paragraph after "a symlink out of scratch".

This fix edits `cli/test/remote-run.test.mjs`, so it is the only test the fix runs: `npm test -- test/remote-run.test.mjs` from `cli/`.
