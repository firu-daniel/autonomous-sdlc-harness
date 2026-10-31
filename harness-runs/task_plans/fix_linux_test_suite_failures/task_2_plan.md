### Task 2 — Pass the two group-1 tests' oversized values through a file, not an argument or environment string

**Goal:** Fix both `spawn E2BIG` failures (group 1). Each test hands its oversized value to its stub or to git through a file, the way the code under test really does. Neither test passes a single argument or environment string over 131072 bytes.

**Depends on:** Task 1, which adds the single-string bound to `cli/test/helpers/fixture.mjs` → `run` / `runBounded`. Both spawners this task's tests use go through it:

- `runBash(cwd, args, env, bound?)`;
- this file's `sh()` and `git()` wrappers, which call `runBash`.

The contract this task relies on: a call with any `args` element, or any `env` override's `NAME=value`, whose byte length plus one exceeds 131072 **rejects without spawning**. The rejection message names the argument's index, or the variable, and the bound. So on this macOS host, the unfixed tests are rejected exactly as Linux rejects them, and the edited tests passing is the proof of this task. This task does not edit `fixture.mjs`; Task 1 owns it.

**Verdict to record (group 1): a test assumption in both tests. The code is not at fault.** Write it into each changed comment.

- The real mention path, `cli/templates/scripts/remote-run.sh` → `control_mention_context_extra`, keeps the diff in the unexported shell variable `GH_OUT`. It writes the diff with the builtin `printf '%s\n' "$GH_OUT" >"$dir/diff.patch"`, and `mention_cap` cuts it with file operations. No argument and no environment value carries the diff.
- Nothing in `remote-run.sh` changes in this branch.

### Targets

- `cli/test/remote-control-mention.test.mjs`: the `GH_STUB` `pr diff` arm, the default env of `controlFixture` → `control`, the file header, and the case *"an oversized diff is cut at a whole line with the cut note"*.
- `cli/test/watcher-stall-reset-payloads.test.mjs`: `createStallFixture` → `commitInCopy`.

**Work:**

- [ ] **`remote-control-mention.test.mjs`.**
  - The stub's `pr diff` arm gains a `STUB_PR_DIFF_FILE` input. When it is set, the arm writes that file's bytes to stdout with `readFileSync`. The existing `STUB_PR_DIFF` and its `FAIL` value keep working for every other case.
  - Add `STUB_PR_DIFF_FILE: ''` beside `STUB_PR_DIFF: ''` in `control`'s default environment, so a host value cannot leak in.
  - The oversized-diff case writes its `` `+${'x'.repeat(98)}\n`.repeat(2100) `` diff to a file under the fixture's `stub` directory and passes only the path.
  - In the header paragraph that names `STUB_PR_DIFF`, say that a diff over the per-string bound travels as `STUB_PR_DIFF_FILE`, and give the reason: Linux's per-string `MAX_ARG_STRLEN`, measured as `spawn E2BIG` on 2026-10-30.
  - Every assertion of the case stays as it is: the `(cut at 200000 bytes)` note, the byte cap, and the whole-line cut.
- [ ] **`watcher-stall-reset-payloads.test.mjs` → `commitInCopy`.**
  - Hash a `content` entry from a file, not from a `bash -c` argument. Write the content to a file **outside the copy**, in a directory the fixture already creates and tears down, such as the one `payload()` writes to. Then run `git hash-object -w --no-filters -- <that file>` through the existing `git()` wrapper, so it keeps the `PIN` settings.
  - Keep the method's documented property: it writes no working-tree file in the copy.
  - Extend its doc comment to say why the content does not go through an argument: J6 commits the whole `remote-run.sh` (about 400 KB), and Linux refused it with `spawn E2BIG`.
  - The `oid` entry path is unchanged.

**Verification:**

- `remote-control-mention.test.mjs` passes. Its oversized-diff case still asserts the whole-line cut and the `(cut at 200000 bytes)` note, and the case's `f.control` call now carries no environment value over the bound.
- `watcher-stall-reset-payloads.test.mjs` passes, with *"(J6) a forged base in the job checkout: the real doctor judges from the recorded commit and refuses"* among the passing cases. The *"generated asynchronous activity after the test ended"* warning is absent from the run. That warning came from J6's setup step failing inside `jobStall`, so it is gone once that step succeeds.
- Neither file still spells a `.repeat(` result into an `env` override or an `args` element of a spawning call. Check with `grep -nE 'STUB_PR_DIFF:|hash-object' cli/test/remote-control-mention.test.mjs cli/test/watcher-stall-reset-payloads.test.mjs`. The only `STUB_PR_DIFF:` hits left are the empty default and the `'FAIL'` value, and the only `hash-object` hit is the file form.
