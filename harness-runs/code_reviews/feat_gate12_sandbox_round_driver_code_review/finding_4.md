### 4. Preflight check 2 claims to refuse "any copy carrying the script", but it only refuses the checkout the running script sits in

**File:** `scripts/lib/gate12-sandbox-round/preflight.sh` (`g12_preflight`): "if [ -n \"$root_canon\" ] && [ \"$root_canon\" = \"$script_canon\" ]; then"

The header's check 2 reads: *"that top level is this script's own (G12_SCRIPT_ROOT), compared canonically: this refuses this repository and any copy carrying the script."* The task prompt's goal 1 requires that the script *"refuses to run against this repository"*.

The code compares the working directory's top level with the top level of the checkout the **running** script sits in, and nothing else. Suppose the operator runs one checkout's copy, for example a worktree or run copy, from inside another checkout of this repository, for example the main checkout. The two top levels differ, so check 2 passes, even though the working checkout carries the driver. Today such a run is still stopped, but only by coincidence:
- check 5, because this repository's `remote.origin.url` is not a `github.com` URL in every clone;
- check 6, because this repository's default branch carries no `harness-run.yml`.

Check 6 also comes after a `git fetch origin` into this repository. Neither check exists to recognise this repository. The header promises a refusal the code does not make.

**Fix:**

1. In `g12_preflight`, directly after the canonical-compare `if … fi` block of check 2, add:

   ```bash
   if [ -e "$G12_ROOT/scripts/lib/gate12-sandbox-round/core.sh" ]; then
     g12_preflight_refuse "'$G12_ROOT' carries scripts/lib/gate12-sandbox-round/: it is a checkout of the repository that ships this driver; run it from the Gate 12 repository, never there"
     return
   fi
   ```

2. Change the header's check 2 text to say what both tests do:

   ```
   #   2. The working directory is not inside a git checkout (a bare `git rev-parse --show-toplevel`,
   #      held in G12_ROOT); or that top level is this script's own (G12_SCRIPT_ROOT), compared
   #      canonically; or it carries scripts/lib/gate12-sandbox-round/core.sh, so it is any checkout
   #      of the repository that ships this driver.
   ```

3. In `cli/test/gate12-sandbox-round-cli.test.mjs`, inside `each preflight refusal exits 2 and creates nothing`, add a subtest. It writes any file at `scripts/lib/gate12-sandbox-round/core.sh` inside a fresh fixture's checkout (`fixture.dir`) and runs the default `ROUND_SCRIPT` through `assertRefused(fixture, ['plant', '--repo', GATE12_SLUG], 2)`. It then asserts that stderr matches `/it is a checkout of the repository that ships this driver/`.

   The existing copied-script subtest still reaches the canonical-compare refusal first, so its assertion is unchanged. Finding 1 makes that subtest reach check 2 at all.

This fix edits `cli/test/gate12-sandbox-round-cli.test.mjs`, so that is the test file the fix runs.
