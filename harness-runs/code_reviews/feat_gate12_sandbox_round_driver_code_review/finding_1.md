### 1. The copied-script preflight case now refuses at the run-library check, so its stderr assertion fails

**File:** `cli/test/gate12-sandbox-round-cli.test.mjs` (`each preflight refusal exits 2 and creates nothing` → the subtest `"a copy run from inside the script's own repository"`): "assert.match(result.stderr, /is the checkout this script sits in/)"

This subtest copies `scripts/gate12-sandbox-round.sh` and `scripts/lib/gate12-sandbox-round/` into the fixture checkout and runs that copy. It expects the copy to be refused by preflight check 2. The commit `fix: Finding 1 — Gate 12 config read uses harness-run-lib.sh readers` then added a new check 1 to `scripts/lib/gate12-sandbox-round/preflight.sh` (`g12_preflight`), which runs before anything else:

```bash
lib="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)/lib/harness-run-lib.sh"
[ -r "$lib" ] || { g12_preflight_refuse "cannot read the run library at '$lib'"; return; }
```

For the copied driver, `BASH_SOURCE[0]` is `<fixture>/scripts/lib/gate12-sandbox-round/preflight.sh`, so `$lib` is `<fixture>/scripts/lib/harness-run-lib.sh`. The subtest never copies that file, and `makeGate12Fixture` (`cli/test/helpers/gate12-round.mjs`) writes only `scripts/remote-run.sh` under `scripts/`. The copy is therefore refused at check 1 with `refusing to start: cannot read the run library at '…'`. That still exits 2 and leaves the tree unchanged, so `assertRefused` passes. The next line's `/is the checkout this script sits in/` does not match, and the subtest fails. That commit changed only `preflight.sh` and the review file, so this case was not re-run against the new check order.

**Fix:** copy the run library the copied preflight reads into the fixture as well, so the copy gets past check 1 and reaches check 2, the refusal the subtest is about. In that subtest, after the two existing `cp` calls and before `assertRefused`, add:

```js
await cp(join(WORKSPACE_ROOT, 'scripts', 'lib', 'harness-run-lib.sh'), join(fixture.dir, 'scripts', 'lib', 'harness-run-lib.sh'));
```

Leave the assertion as it is. With the library present, check 1 passes, since `git`, `gh` (the stub on `PATH`) and `jq` are all present. Check 2 then finds `G12_ROOT` (the fixture checkout) equal to `G12_SCRIPT_ROOT` (the same checkout, the copy's own top level) and refuses with `… is the checkout this script sits in …`.

This fix edits `cli/test/gate12-sandbox-round-cli.test.mjs`, so that is the test file the fix runs.
