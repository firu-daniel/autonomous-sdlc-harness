/**
 * The change-request fence's allow rule in the committed `.claude/settings.json`, against
 * repositories the test builds and throws away.
 *
 * **The rule this file exists to enforce: the committed project settings allow-list exactly the
 * invocation the fence names, and the merge never disturbs an adopter's keys.** The fence in
 * `.claude/CLAUDE.md` item 4 tells every interactive session to run one bare command; a rule that
 * differs from it by one character leaves that session prompting mid-fence, and a merge that edits
 * an adopter's own `permissions` changes access they never asked this tool to touch.
 *
 * The rule is read off the rendered `.claude/CLAUDE.md` and the written `harness.config.json`, never
 * imported from the generator: the contract is that the two views agree, so the expected string is
 * built from what an adopter's files say.
 *
 * ## Each case, and the mutation that turned it red
 *
 * Each mutation was applied once as a throwaway edit to `cli/src/generators/projectSettings.ts`,
 * the case was run red against it, and the edit was reverted; none was committed.
 *
 * - (a) **The rule matches item 4, at the default and at a relocated `scriptsDir`.** Red under the
 *   rule built by hand in the generator as `Bash(bash {{scriptsDir}}/task-offer-check.sh)` rather
 *   than through `taskOfferCheckRule`.
 * - (b) **An existing `permissions.allow` list is kept as it stands, and `init` warns once.** Red
 *   under a generator that replaces an existing `permissions.allow` with `[rule]` through an
 *   overwriting write, and again under one that drops the warning.
 * - (c) **A `permissions` object with no `allow` gains `allow: [rule]`, its `deny` untouched.** Red
 *   under `permissions` omitted from the payload.
 * - (d) **A second `init` keeps the file byte for byte.** Red under the rule appended
 *   unconditionally to whatever `permissions.allow` already holds, through an overwriting write.
 *
 * These run against the **compiled** CLI at `dist/cli.js`, so `npm run build` precedes `npm test`.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, readJson, runCli } from './helpers/fixture.mjs';

const SETTINGS_FILE = '.claude/settings.json';
const CLAUDE_MD = '.claude/CLAUDE.md';
const CONFIG_FILE = 'harness.config.json';
const SCRIPT_FILE = 'task-offer-check.sh';

/** The fence's opt-out item, as the rendered project file opens it. */
const ITEM_4_OPENING = '4. **Opt-out.**';

/** The relocated `scriptsDir` case (a) runs a second time at. */
const RELOCATED_SCRIPTS_DIR = 'tools/harness';

/** Every action-log label, so a line's label is read rather than guessed at. */
const ACTION_LOG_LINE =
  /^[+~=] (created|merged|kept|ensured|replaced|would create|would merge|would keep|would ensure|would replace) +(\S+)/;

/** A minimal manifest, so detection settles on a stack and `init` has commands to write. */
const PACKAGE_JSON = {
  name: 'allow-rule-fixture',
  version: '0.0.0',
  scripts: { test: 'node --test', typecheck: 'tsc --noEmit' },
};

async function fixtureFor(t, files = {}) {
  const fixture = await createFixture({ files: { 'package.json': PACKAGE_JSON, ...files } });
  t.after(fixture.cleanup);
  return fixture.dir;
}

async function initOk(dir, args = []) {
  const result = await runCli(dir, ['init', ...args]);
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return result;
}

function actionFor(stdout, relativePath) {
  for (const line of stdout.split('\n')) {
    const match = ACTION_LOG_LINE.exec(line);
    if (match !== null && match[2] === relativePath) return match[1];
  }
  return undefined;
}

/** The invocation item 4 of the rendered project file names: its inline code span that starts `bash `. */
function fenceInvocation(dir) {
  const item = readFileSync(join(dir, CLAUDE_MD), 'utf8')
    .split('\n')
    .find((line) => line.startsWith(ITEM_4_OPENING));
  assert.ok(item !== undefined, `${CLAUDE_MD} carries no line opening ${ITEM_4_OPENING}`);
  const span = /`(bash [^`]+)`/.exec(item);
  assert.ok(span !== null, `${CLAUDE_MD} item 4 names no \`bash …\` invocation:\n${item}`);
  return span[1];
}

/** The exact rule this run should have written, built from the adopter's own files. */
function expectedRule(dir) {
  const invocation = fenceInvocation(dir);
  const { scriptsDir } = readJson(join(dir, CONFIG_FILE));
  assert.equal(
    invocation,
    `bash ${scriptsDir}/${SCRIPT_FILE}`,
    `item 4 names ${invocation}, not the check under the configured scriptsDir ${scriptsDir}`,
  );
  return `Bash(${invocation})`;
}

/** The warning lines `init` printed that name the settings file and the rule. */
function ruleWarnings(stderr, rule) {
  return stderr.split('\n').filter((line) => line.startsWith('! ') && line.includes(SETTINGS_FILE) && line.includes(rule));
}

for (const [label, args] of [
  ['the default scriptsDir', []],
  [`--scripts-dir ${RELOCATED_SCRIPTS_DIR}`, ['--scripts-dir', RELOCATED_SCRIPTS_DIR]],
]) {
  test(`(a) a first init at ${label} allows exactly the invocation item 4 names`, async (t) => {
    const dir = await fixtureFor(t);
    await initOk(dir, args);

    const rule = expectedRule(dir);
    if (args.length > 0) {
      assert.equal(rule, `Bash(bash ${RELOCATED_SCRIPTS_DIR}/${SCRIPT_FILE})`, 'the relocated scriptsDir did not reach the rule');
    }
    assert.deepEqual(readJson(join(dir, SETTINGS_FILE)).permissions?.allow, [rule]);
  });
}

test('(b) an existing permissions.allow list is kept as it stands, and init warns once', async (t) => {
  const existing = {
    permissions: { allow: ['Bash(npm test)'], deny: ['Bash(git push --force)'] },
    hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'true' }] }] },
  };
  const dir = await fixtureFor(t, { [SETTINGS_FILE]: existing });

  const { stderr } = await initOk(dir);

  const settings = readJson(join(dir, SETTINGS_FILE));
  assert.equal(JSON.stringify(settings.permissions), JSON.stringify(existing.permissions), 'permissions was changed');
  assert.equal(JSON.stringify(settings.hooks), JSON.stringify(existing.hooks), 'hooks was changed');

  const rule = expectedRule(dir);
  assert.ok(!settings.permissions.allow.includes(rule), 'the rule was added into an existing allow list');
  assert.equal(ruleWarnings(stderr, rule).length, 1, `expected one warning naming ${SETTINGS_FILE} and ${rule}:\n${stderr}`);
});

test('(c) a permissions object with no allow gains allow: [rule], deny unchanged', async (t) => {
  const deny = ['Bash(git push --force)'];
  const dir = await fixtureFor(t, { [SETTINGS_FILE]: { permissions: { deny } } });

  const { stderr } = await initOk(dir);

  const rule = expectedRule(dir);
  const { permissions } = readJson(join(dir, SETTINGS_FILE));
  assert.deepEqual(permissions.allow, [rule]);
  assert.deepEqual(permissions.deny, deny);
  assert.equal(ruleWarnings(stderr, rule).length, 0, `a merge that added the rule still warned:\n${stderr}`);
});

test('(d) a second init keeps the settings file byte for byte', async (t) => {
  const dir = await fixtureFor(t);
  await initOk(dir);
  const before = readFileSync(join(dir, SETTINGS_FILE));

  const { stdout } = await initOk(dir);

  assert.equal(actionFor(stdout, SETTINGS_FILE), 'kept', `the second init did not report ${SETTINGS_FILE} kept:\n${stdout}`);
  assert.ok(readFileSync(join(dir, SETTINGS_FILE)).equals(before), `${SETTINGS_FILE} changed on a second init`);
});
