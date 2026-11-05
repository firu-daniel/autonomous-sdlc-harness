### Task 5 — Keep the launcher suite's `.git`-leaf placeholder in place, and show a job-mode gate run reaching its verdict past it

**Goal:** The task prompt's acceptance asks for "the launcher's argument vector for the same case" and requires `launch-sandboxed-gates.sh` to "start its worker and reach a verdict, with the sandbox on and every `<scriptsDir>/.git` level still write-protected". The launcher suite's `bwrap` stub has been hiding F15: it removes a `.git`-leaf placeholder instead of leaving it as bubblewrap does. This task makes the stub honest, adds the job-mode case, and records in the launcher's header and the write-protection module's doc comment that the `.git` levels stay pinned and the worker places its root past them.

**Depends on:** Task 2. It switches `cli/templates/scripts/run-test-suite.sh`'s placement to the library's `hr_script_root`, which takes the nearest ancestor holding `harness.config.json` that `git -C` confirms as its own top. So the worker's `run-test-suite.sh --no-detach`, and the unsandboxed `--wait` collector, place the root with a placeholder or a 0-byte leftover at `scripts/.git`. This task also imports Task 1's `cli/test/helpers/runner-git-shim.mjs` (`installRunnerGitShim(binDir)`), whose `git` dies with `fatal: not a regular file` or `fatal: invalid gitfile format` (exit 128) on `-C <d> rev-parse --show-toplevel` when the first `.git` above `<d>` is a device or an empty file.

### Targets

- `cli/test/launch-sandboxed-gates.test.mjs`: `BWRAP_STUB`, its doc comment, the suite header's `.git`-leaf sentences, and a new job-mode case.
- `cli/templates/scripts/launch-sandboxed-gates.sh`: one header sentence under **THE BWRAP VECTOR**. No code change.
- `cli/src/generators/writeProtection.ts`: one sentence in `protectedPaths`' doc comment. No code change, and the `reason` string stays byte-identical.

**Work:**

- [ ] `launch-sandboxed-gates.test.mjs` → `BWRAP_STUB`:
  - Drop the `.git)` arm that removes a `.git`-leaf placeholder. Every placeholder is now a link to `/dev/null` while the command runs, then the 0-byte `0444` file bubblewrap leaves.
  - Rewrite the stub's doc comment and the suite header's sentences that justified the removal (*"A `.git`-leaf placeholder is removed instead …"*, *"Nor is the host-side leftover at a `.git` leaf, which the stub removes …"*). They now say that the leftover stays until the supervisor's sweep, and that the collector places its root past it (F15, `hr_script_root`).
  - Correct the claim that the device is something *"git's discovery passes over"*: the runner's git dies on it (round 14).
- [ ] `launch-sandboxed-gates.test.mjs`: install the runner-git shim first on `PATH` for every case that launches a worker, so the worker meets the runner's git. Add case **(t)**, job mode with the base profile's `denyWrite` carrying `<main>/scripts/.git`, absent on disk:
  - The recorded vector carries `--ro-bind /dev/null <main>/scripts/.git`, element by element against the profile, as `(g)(h)` builds it.
  - The vector's command is `bash <main>/scripts/run-test-suite.sh --no-detach <label>`.
  - The launcher answers `pending`, and `--wait` collects `pass`.
  - The gate stub recorded one run inside `bwrap`.
  - After the run the placeholder path is swept, and nothing under the fixture changed but the lane files.
- [ ] `launch-sandboxed-gates.sh`: under **THE BWRAP VECTOR**, the `--ro-bind /dev/null <p>` item gains one sentence. A `<target>/<scriptsDir>/.git` entry is pinned like every other absent entry, and the worker's scripts place their root past it from the nearest confirmed `harness.config.json` (`lib/harness-run-lib.sh` → `hr_script_root`), never by git's discovery from the scripts directory (F15).
- [ ] `writeProtection.ts` → `protectedPaths`' doc comment: after the sentence on why the `.git` levels are protected, add one sentence. On a bubblewrap host each absent level is a placeholder inside the sandbox, which is why the sandboxed scripts place their root through `hr_script_root` rather than by git's discovery from their own directory (F15).

**Verification:**

- `cli/test/launch-sandboxed-gates.test.mjs` passes. Case (t) fails with the round-14 refusal (`… did not start: run-test-suite.sh: '<main>/scripts' is not inside a git repository`) when Task 2's line is reverted in the fixture's installed `run-test-suite.sh`. Check this once with a throwaway edit, then restore.
- `git diff` of `launch-sandboxed-gates.sh` and `writeProtection.ts` changes comment lines only.
- `BWRAP_STUB` no longer carries a `.git)` case.
