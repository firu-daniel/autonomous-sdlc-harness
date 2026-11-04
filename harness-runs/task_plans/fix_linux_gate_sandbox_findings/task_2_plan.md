### Task 2 — F12: make launcher case `(c)` hide only `bwrap`, and pin the shared-directory layout

**Goal:** Make `cli/test/launch-sandboxed-gates.test.mjs` → `(c) no bwrap on PATH: the refusal, nothing recorded` hide `bwrap` alone. It must keep every other tool the launcher and `runBash` need, `bash` first among them, so the case passes on a host where `bwrap` and `bash` share a `PATH` directory. Debian 12 is such a host (both in `/usr/bin`), and a GitHub-hosted Ubuntu runner is expected to be one.

**The finding (docs/sandbox-verification.md §5 F12).** `pathWithoutBwrap()` drops every `PATH` directory that holds an executable `bwrap`. On Debian 12 that drops `/usr/bin`, so `runBash`'s `execFile('bash', …)`, which resolves `bash` on the child env's `PATH`, fails with `spawn bash ENOENT`. This is the test's own assumption, not a sandbox effect. The launcher is not changed, and neither is anything the case asserts.

### Targets

- `cli/test/launch-sandboxed-gates.test.mjs`

**Work:**

- [ ] Replace `pathWithoutBwrap()` with a helper that takes the `PATH` string and a case-owned scratch directory. For each `PATH` directory holding an executable `bwrap`, it creates a shadow directory under the scratch root. The shadow holds a symbolic link to every entry of the original directory except `bwrap`, and it takes that directory's place in the returned `PATH`, at the same position. Every other directory stays as it was. A `PATH` with no `bwrap`, as on macOS, comes back unchanged and creates nothing. Create the shadows under the fixture's case root (`launcherFixture`'s `root`, removed in `t.after`), never inside this checkout.
- [ ] Have `launcherFixture(t, { bwrap: false })` build its `env().PATH` from that helper, still with the fixture's `bin/` first. Case `(c)`'s assertions stay as they are: `assertRefusal(r, 'bwrap is not on PATH')`, no `bwrap-argv.txt`, no gate run.
- [ ] Add a case titled `(c2) F12: the no-bwrap PATH hides only bwrap where bwrap and bash share a directory`. It builds a scratch directory holding an executable `bwrap` stub and a link to the `bash` the test process resolves, puts that directory first in a synthetic `PATH`, passes it through the helper, and asserts with `bash -c 'command -v bwrap'` (expect non-zero) and `command -v bash` (expect zero) under the result. That is the Debian layout reproduced on any host.
- [ ] Amend the file's header comment by one sentence: case `(c)` hides `bwrap` by shadowing its directory, never by dropping it, because `bash` may share it (F12).

**Verification:**

- `npm test --workspace cli -- test/launch-sandboxed-gates.test.mjs` passes, case `(c)` and the new case `(c2)` included.
- Case `(c)`'s title is unchanged byte for byte, `(c) no bwrap on PATH: the refusal, nothing recorded`, because `docs/sandbox-verification.md` §5 F12 cites it. The case still asserts the same refusal fragment and the same two absences.
- Neither `scripts/launch-sandboxed-gates.sh` nor `cli/templates/scripts/launch-sandboxed-gates.sh` appears in this task's diff.
