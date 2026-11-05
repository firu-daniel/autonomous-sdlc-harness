/**
 * `hc_main_root` / `hc_main_root_var` from `plugin/hooks/lib/harness-config-lib.sh`, in every
 * run-copy layout, with and without the `HARNESS_MAIN_REPO` anchor.
 *
 * **The rule these tests exist to enforce: with no anchor, the main checkout, a linked worktree of
 * it and a registered run clone of it all resolve to the main checkout, an unrelated repository
 * resolves to itself, and a clone the run registry does not record, or whose `alternates` file is
 * not one line naming another main checkout, is refused — nothing printed, exit 1, and
 * `HC_MAIN_ROOT_REFUSAL` naming what could not be established — never answered with the clone
 * itself. An absolute anchor naming a main checkout wins in every layout.** The layouts are
 * `cli/test/helpers/run-copy-layouts.mjs`'s, each one condition away from a registered clone.
 *
 * Not covered: the prose form of the same rule (`plugin/instructions/main_repo_resolution.md` →
 * `## The fallback`), which an agent applies in a session rather than a process runs, so no
 * subprocess here can exercise it; `docs/sandbox-verification.md` rows AN5–AN6 measure it by hand.
 *
 * RED ONCE — 2026-10-29, `hc_main_root_var`'s clone arm made to skip the registry check (the
 * `"$kind" != clone || "$wt_c" != "$root_c"` test replaced by `false`) in the working tree only,
 * then reverted: `unregisteredClone, no anchor` failed, `hc_main_root` exiting 0 where 1 was expected.
 */

import assert from 'node:assert/strict';
import { join } from 'node:path';
import test from 'node:test';

import { MAIN_REPO_ANCHOR_VARIABLE } from '../dist/core/mainRepoAnchor.js';
import { WORKSPACE_ROOT, runBash } from './helpers/fixture.mjs';
import { buildRunCopyLayouts } from './helpers/run-copy-layouts.mjs';

const LIB = join(WORKSPACE_ROOT, 'plugin', 'hooks', 'lib', 'harness-config-lib.sh');

const RESOLVED = ['main', 'worktree', 'registeredClone'];
/** Each refused layout, and a stable fragment of the check its refusal sentence names. */
const REFUSED = {
  unregisteredClone: /autonomous_logs\/registry\.json/,
  twoLineClone: /objects\/info\/alternates/,
  selfClone: /objects\/info\/alternates/,
};
const LAYOUTS = [...RESOLVED, 'plain', ...Object.keys(REFUSED)];

const output = (result) => `${result.stdout}\n${result.stderr}`;

test('hc_main_root in every run-copy layout', async (t) => {
  const l = await buildRunCopyLayouts(t);
  const mainRoot = (dir, anchor) =>
    runBash(l.root, ['-c', '. "$1"; hc_main_root "$2"', '_', LIB, dir], { [MAIN_REPO_ANCHOR_VARIABLE]: anchor });
  const mainRootVar = (dir, anchor) =>
    runBash(
      l.root,
      ['-c', '. "$1"; hc_main_root_var "$2"; s=$?; printf "%s\\n%s\\n%s\\n" "$s" "$HC_MAIN_ROOT" "$HC_MAIN_ROOT_REFUSAL"', '_', LIB, dir],
      { [MAIN_REPO_ANCHOR_VARIABLE]: anchor },
    );

  for (const name of LAYOUTS) {
    await t.test(`${name}, no anchor`, async () => {
      const result = await mainRoot(l[name], '');
      if (name in REFUSED) {
        assert.equal(result.status, 1, output(result));
        assert.equal(result.stdout, '', output(result));
        const vars = await mainRootVar(l[name], '');
        const [status, resolved, refusal] = vars.stdout.split('\n');
        assert.equal(status, '1', output(vars));
        assert.equal(resolved, '', output(vars));
        assert.match(refusal, REFUSED[name], output(vars));
      } else {
        assert.equal(result.status, 0, output(result));
        assert.equal(result.stdout, `${RESOLVED.includes(name) ? l.main : l.plain}\n`, output(result));
      }
    });

    await t.test(`${name}, anchor naming the main checkout`, async () => {
      const result = await mainRoot(l[name], l.main);
      assert.equal(result.status, 0, output(result));
      assert.equal(result.stdout, `${l.main}\n`, output(result));
    });
  }
});
