/**
 * `init` and the two forge workflows: the issue trigger and the run-control workflow.
 *
 * **The rule this suite exists to enforce: the trigger and control workflows are written exactly when
 * `forge` is `github` and remote execution is on, each byte for byte from its template, never
 * upgraded, except that any `init` repairs a byte-identical 0.6.1 control workflow, and their presence changes nothing else `init` writes; the report then names every GitHub
 * step that coupling needs.** Every case drives the compiled CLI against a
 * throwaway fixture (`helpers/fixture.mjs`).
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

import { PACKAGE_ROOT, createFixture, readJson, runCli, snapshotTree } from './helpers/fixture.mjs';

const { UNPARSEABLE_CONTROL_RELEASES } = await import(
  pathToFileURL(join(PACKAGE_ROOT, 'dist', 'generators', 'githubWorkflows.js')).href
);
const CONTROL_0_6_1 = readFileSync(join(PACKAGE_ROOT, 'test', 'fixtures', 'harness-control-0.6.1.yml'), 'utf8');

const TRIGGER_FILE = '.github/workflows/harness-trigger.yml';
const RUN_FILE = '.github/workflows/harness-run.yml';
const RESUME_FILE = '.github/workflows/harness-resume.yml';
const CONTROL_FILE = '.github/workflows/harness-control.yml';
const TRIGGER_TEMPLATE = readFileSync(join(PACKAGE_ROOT, 'templates', 'github', 'workflows', 'harness-trigger.yml'), 'utf8');
const CONTROL_TEMPLATE = readFileSync(join(PACKAGE_ROOT, 'templates', 'github', 'workflows', 'harness-control.yml'), 'utf8');
const PR_SETTING = 'Allow GitHub Actions to create and approve pull requests';
const LABEL_COMMAND = 'gh label create sdlc-harness --description "Start a harness run from this issue"';

function nodeProjectFiles() {
  return {
    'package.json': {
      name: 'fixture-project',
      private: true,
      version: '0.0.0',
      scripts: { typecheck: 'echo typecheck', test: 'echo test', build: 'echo build', dev: 'echo dev' },
    },
    'README.md': '# fixture project\n',
  };
}

async function fixtureFor(t) {
  const fixture = await createFixture({ files: nodeProjectFiles() });
  t.after(fixture.cleanup);
  return fixture.dir;
}

async function initOk(dir, args = []) {
  const result = await runCli(dir, ['init', ...args]);
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return result;
}

function text(dir, relativePath) {
  return readFileSync(join(dir, relativePath), 'utf8');
}

/**
 * Wire the fixture with a first `init`, then set `forge` and `execution.target` in its config —
 * `undefined` leaves a key absent.
 */
async function wiredFixture(t, { forge, target }) {
  const dir = await fixtureFor(t);
  await initOk(dir);
  const path = join(dir, 'harness.config.json');
  const config = readJson(path);
  if (forge !== undefined) config.forge = forge;
  if (target !== undefined) config.execution = { target };
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return dir;
}

test('init writes the trigger and control workflows only for forge github with remote execution on', async (t) => {
  await t.test('forge github + github-actions: written verbatim, listed on git add, with the label command', async (subtest) => {
    const dir = await wiredFixture(subtest, { forge: 'github', target: 'github-actions' });

    const { stdout } = await initOk(dir);

    assert.equal(text(dir, TRIGGER_FILE), TRIGGER_TEMPLATE, 'harness-trigger.yml is not a verbatim copy of its template');
    assert.equal(text(dir, CONTROL_FILE), CONTROL_TEMPLATE, 'harness-control.yml is not a verbatim copy of its template');
    const addLine = stdout.split('\n').find((line) => line.trim().startsWith('git add '));
    assert.ok(addLine !== undefined, `no git add line:\n${stdout}`);
    for (const path of [RUN_FILE, RESUME_FILE, TRIGGER_FILE, CONTROL_FILE]) {
      assert.ok(addLine.includes(path), `the git add line does not name ${path}: ${addLine}`);
    }
    assert.ok(stdout.includes(LABEL_COMMAND), `the report does not print the label command:\n${stdout}`);
    assert.ok(stdout.includes('HARNESS_TRIGGER_LABEL'), `the report does not name HARNESS_TRIGGER_LABEL:\n${stdout}`);
    assert.ok(stdout.includes('HARNESS_TRIGGER_ALLOWED_BOTS'), `the report does not name HARNESS_TRIGGER_ALLOWED_BOTS:\n${stdout}`);
    assert.ok(stdout.includes('`sdlc-harness: <state>`'), `the report does not tell the state labels apart:\n${stdout}`);
    assert.ok(stdout.includes(PR_SETTING), `the report does not name the pull-request setting:\n${stdout}`);
    assert.ok(stdout.includes('HARNESS_GIT_TOKEN, which opens the pull request'), `the report does not offer HARNESS_GIT_TOKEN for the pull request:\n${stdout}`);
    assert.ok(stdout.includes('machine account'), `the report does not carry the machine-account advice:\n${stdout}`);
    assert.ok(stdout.includes('@sdlc-harness followed by answer, pause, resume, stop, clear, status steers'), `the report does not name the comment commands:\n${stdout}`);
    assert.ok(stdout.includes('docs/github-run-control.md'), `the report does not point at docs/github-run-control.md:\n${stdout}`);

    const before = await snapshotTree(dir);
    await initOk(dir);
    assert.deepEqual(await snapshotTree(dir), before, 'a second init changed the tree');
  });

  await t.test('forge github with execution.target absent: not written', async (subtest) => {
    const dir = await wiredFixture(subtest, { forge: 'github' });
    const { stdout } = await initOk(dir);
    assert.ok(!existsSync(join(dir, TRIGGER_FILE)), 'the trigger was written with remote execution off');
    assert.ok(!existsSync(join(dir, CONTROL_FILE)), 'the control workflow was written with remote execution off');
    assert.ok(!stdout.includes('gh label create'), `the report prints the label step:\n${stdout}`);
  });

  await t.test('forge none with github-actions: not written', async (subtest) => {
    const dir = await wiredFixture(subtest, { forge: 'none', target: 'github-actions' });
    const { stdout } = await initOk(dir);
    assert.ok(!existsSync(join(dir, TRIGGER_FILE)), 'the trigger was written with forge none');
    assert.ok(!existsSync(join(dir, CONTROL_FILE)), 'the control workflow was written with forge none');
    assert.ok(!stdout.includes('gh label create'), `the report prints the label step:\n${stdout}`);
    assert.ok(!stdout.includes(PR_SETTING), `the report prints the pull-request step:\n${stdout}`);
  });

  await t.test('forge absent with github-actions: not written, and the other two workflows written as before', async (subtest) => {
    const dir = await wiredFixture(subtest, { target: 'github-actions' });
    const { stdout } = await initOk(dir);
    assert.ok(!existsSync(join(dir, TRIGGER_FILE)), 'the trigger was written with forge absent');
    assert.ok(!existsSync(join(dir, CONTROL_FILE)), 'the control workflow was written with forge absent');
    assert.ok(existsSync(join(dir, RUN_FILE)) && existsSync(join(dir, RESUME_FILE)), 'the two workflows were not written');
    assert.ok(!stdout.includes('gh label create'), `the report prints the label step:\n${stdout}`);
  });

  await t.test('an edited trigger survives --upgrade-workflows with no .bak; --force replaces it after a .bak', async (subtest) => {
    const dir = await wiredFixture(subtest, { forge: 'github', target: 'github-actions' });
    await initOk(dir);
    appendFileSync(join(dir, TRIGGER_FILE), '# tuned by hand\n', 'utf8');
    const edited = text(dir, TRIGGER_FILE);

    await initOk(dir, ['--upgrade-workflows']);
    assert.equal(text(dir, TRIGGER_FILE), edited, '--upgrade-workflows rewrote the edited trigger');
    assert.ok(!existsSync(join(dir, `${TRIGGER_FILE}.bak`)), '--upgrade-workflows left a trigger .bak');

    await initOk(dir, ['--force']);
    assert.equal(text(dir, `${TRIGGER_FILE}.bak`), edited, 'the .bak does not hold the edited trigger');
    assert.equal(text(dir, TRIGGER_FILE), TRIGGER_TEMPLATE, '--force did not restore the template');
  });

  await t.test('forge github with execution.target local: neither forge workflow written', async (subtest) => {
    const dir = await wiredFixture(subtest, { forge: 'github', target: 'local' });
    await initOk(dir);
    assert.ok(!existsSync(join(dir, TRIGGER_FILE)), 'the trigger was written with execution.target local');
    assert.ok(!existsSync(join(dir, CONTROL_FILE)), 'the control workflow was written with execution.target local');
  });

  await t.test('an edited control workflow survives --upgrade-workflows with no .bak; --force replaces it after a .bak', async (subtest) => {
    const dir = await wiredFixture(subtest, { forge: 'github', target: 'github-actions' });
    await initOk(dir);
    appendFileSync(join(dir, CONTROL_FILE), '# tuned by hand\n', 'utf8');
    const edited = text(dir, CONTROL_FILE);

    await initOk(dir, ['--upgrade-workflows']);
    assert.equal(text(dir, CONTROL_FILE), edited, '--upgrade-workflows rewrote the edited control workflow');
    assert.ok(!existsSync(join(dir, `${CONTROL_FILE}.bak`)), '--upgrade-workflows left a control-workflow .bak');

    await initOk(dir, ['--force']);
    assert.equal(text(dir, `${CONTROL_FILE}.bak`), edited, 'the .bak does not hold the edited control workflow');
    assert.equal(text(dir, CONTROL_FILE), CONTROL_TEMPLATE, '--force did not restore the template');
  });

  await t.test('.gitignore is the same with forge github as with forge absent', async (subtest) => {
    const withForge = await wiredFixture(subtest, { forge: 'github', target: 'github-actions' });
    const withoutForge = await wiredFixture(subtest, { target: 'github-actions' });
    await initOk(withForge);
    await initOk(withoutForge);
    assert.equal(text(withForge, '.gitignore'), text(withoutForge, '.gitignore'));
  });

  await t.test('--dry-run writes no workflow', async (subtest) => {
    const dir = await wiredFixture(subtest, { forge: 'github', target: 'github-actions' });
    const before = await snapshotTree(dir);
    await initOk(dir, ['--dry-run']);
    assert.deepEqual(await snapshotTree(dir), before, '--dry-run changed the tree');
    assert.ok(!existsSync(join(dir, '.github')), '--dry-run wrote a workflow');
  });
});

test('any init repairs a byte-identical 0.6.1 harness-control.yml and keeps every other copy', async (t) => {
  /** A wired forge fixture whose control workflow is replaced by `content`. */
  async function controlFixture(subtest, content) {
    const dir = await wiredFixture(subtest, { forge: 'github', target: 'github-actions' });
    await initOk(dir);
    writeFileSync(join(dir, CONTROL_FILE), content, 'utf8');
    return dir;
  }

  await t.test('the fixture is the 0.6.1 copy the generator recognises', () => {
    const digest = createHash('sha256').update(CONTROL_0_6_1.replace(/\r\n/g, '\n'), 'utf8').digest('hex');
    assert.equal(digest, UNPARSEABLE_CONTROL_RELEASES['0.6.1']);
  });

  await t.test('a plain init replaces the 0.6.1 copy after a .bak, and a second init changes nothing', async (subtest) => {
    const dir = await controlFixture(subtest, CONTROL_0_6_1);
    await initOk(dir);
    assert.equal(text(dir, CONTROL_FILE), CONTROL_TEMPLATE, 'the 0.6.1 copy was not replaced by the template');
    assert.equal(text(dir, `${CONTROL_FILE}.bak`), CONTROL_0_6_1, 'the .bak does not hold the 0.6.1 copy');

    const before = await snapshotTree(dir);
    await initOk(dir);
    assert.deepEqual(await snapshotTree(dir), before, 'a second init changed the tree');
  });

  await t.test('a CRLF 0.6.1 copy is replaced too', async (subtest) => {
    const crlf = CONTROL_0_6_1.replace(/\n/g, '\r\n');
    const dir = await controlFixture(subtest, crlf);
    await initOk(dir);
    assert.equal(text(dir, CONTROL_FILE), CONTROL_TEMPLATE, 'the CRLF 0.6.1 copy was not replaced');
    assert.equal(text(dir, `${CONTROL_FILE}.bak`), crlf, 'the .bak does not hold the CRLF copy');
  });

  await t.test('an edited 0.6.1 copy is kept with no .bak', async (subtest) => {
    const edited = `${CONTROL_0_6_1}# tuned by hand\n`;
    const dir = await controlFixture(subtest, edited);
    await initOk(dir);
    assert.equal(text(dir, CONTROL_FILE), edited, 'the edited 0.6.1 copy was rewritten');
    assert.ok(!existsSync(join(dir, `${CONTROL_FILE}.bak`)), 'an edited copy left a .bak');
  });

  await t.test('a copy of the current template is kept with no .bak', async (subtest) => {
    const dir = await controlFixture(subtest, CONTROL_TEMPLATE);
    await initOk(dir);
    assert.equal(text(dir, CONTROL_FILE), CONTROL_TEMPLATE);
    assert.ok(!existsSync(join(dir, `${CONTROL_FILE}.bak`)), 'the current template left a .bak');
  });

  await t.test('--dry-run over the 0.6.1 copy leaves the tree byte-identical', async (subtest) => {
    const dir = await controlFixture(subtest, CONTROL_0_6_1);
    const before = await snapshotTree(dir);
    await initOk(dir, ['--dry-run']);
    assert.deepEqual(await snapshotTree(dir), before, '--dry-run changed the tree');
  });
});

test('init reports the control-workflow repair, and warns on an edited 0.6.1 copy', async (t) => {
  const REPAIR_TEXT = 'which GitHub cannot parse, so no comment, review, close or deletion reached the harness';
  const DIFF_LINE = `git diff --no-index ${CONTROL_FILE}.bak ${CONTROL_FILE}`;
  const CONTROL_ADD = `git add ${CONTROL_FILE}`;

  async function controlFixture(subtest, content) {
    const dir = await wiredFixture(subtest, { forge: 'github', target: 'github-actions' });
    await initOk(dir);
    writeFileSync(join(dir, CONTROL_FILE), content, 'utf8');
    return dir;
  }

  /** Every trimmed stdout line that starts `git add `. */
  function addLines(stdout) {
    return stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('git add '));
  }

  await t.test('plain init over the 0.6.1 copy: explanation, diff line and its own git add; no first-setup block', async (subtest) => {
    const dir = await controlFixture(subtest, CONTROL_0_6_1);
    const { stdout } = await initOk(dir);
    assert.ok(stdout.includes(REPAIR_TEXT), `no repair explanation:\n${stdout}`);
    assert.ok(stdout.includes('re-rendered it'), `the repair is not worded as done:\n${stdout}`);
    assert.ok(stdout.split('\n').some((line) => line.trim() === DIFF_LINE), `no diff line of its own:\n${stdout}`);
    assert.deepEqual(addLines(stdout), [CONTROL_ADD], `the commit route does not name the control file alone:\n${stdout}`);
    assert.ok(stdout.includes('git commit -m "Repair the harness control workflow"'), `no repair commit:\n${stdout}`);
    assert.ok(!stdout.includes('gh secret set'), `a repair alone printed the first-setup block:\n${stdout}`);
  });

  await t.test("--upgrade-workflows with an older pin: the upgrade block's git add names the control file, the repair prints none", async (subtest) => {
    const dir = await controlFixture(subtest, CONTROL_0_6_1);
    writeFileSync(
      join(dir, RUN_FILE),
      text(dir, RUN_FILE).replace(/HARNESS_CLI_VERSION: '[^']*'/g, "HARNESS_CLI_VERSION: '0.0.1'"),
      'utf8',
    );
    const { stdout } = await initOk(dir, ['--upgrade-workflows']);
    assert.ok(stdout.includes('== workflow upgrade'), `the upgrade did not run:\n${stdout}`);
    assert.ok(stdout.includes(REPAIR_TEXT), `no repair explanation:\n${stdout}`);
    const adds = addLines(stdout);
    assert.equal(adds.length, 1, `expected one git add line:\n${stdout}`);
    assert.ok(adds[0].split(' ').includes(CONTROL_FILE), `the upgrade's git add does not name ${CONTROL_FILE}: ${adds[0]}`);
    assert.ok(!stdout.includes('Repair the harness control workflow'), `the repair printed its own commit:\n${stdout}`);
    assert.equal(
      stdout.split('\n').filter((line) => line.trim() === DIFF_LINE).length,
      1,
      `the control workflow's diff line is not printed exactly once:\n${stdout}`,
    );
  });

  await t.test('--upgrade-workflows with the pin current: the repair block prints its own git add', async (subtest) => {
    const dir = await controlFixture(subtest, CONTROL_0_6_1);
    const { stdout } = await initOk(dir, ['--upgrade-workflows']);
    assert.ok(stdout.includes('nothing was upgraded'), `the upgrade was not a no-op:\n${stdout}`);
    assert.deepEqual(addLines(stdout), [CONTROL_ADD], `the repair's git add is missing:\n${stdout}`);
  });

  await t.test('--dry-run: worded as would, and the tree is unchanged', async (subtest) => {
    const dir = await controlFixture(subtest, CONTROL_0_6_1);
    const before = await snapshotTree(dir);
    const { stdout } = await initOk(dir, ['--dry-run']);
    assert.ok(stdout.includes('would re-render it'), `the dry run does not say would:\n${stdout}`);
    assert.ok(stdout.includes('would be kept beside it as a .bak'), `the dry run does not say would:\n${stdout}`);
    assert.deepEqual(await snapshotTree(dir), before, '--dry-run changed the tree');
  });

  await t.test('an edited 0.6.1 copy: exit 0, one warning naming the file and the route, nothing replaced', async (subtest) => {
    const edited = `${CONTROL_0_6_1}# tuned by hand\n`;
    const dir = await controlFixture(subtest, edited);
    const { stdout, stderr } = await initOk(dir);
    const warnings = stderr.split('\n').filter((line) => line.includes(CONTROL_FILE));
    assert.equal(warnings.length, 1, `expected one warning naming ${CONTROL_FILE}:\n${stderr}`);
    assert.ok(warnings[0].includes('if: >-'), `the warning does not name if: >-: ${warnings[0]}`);
    assert.ok(warnings[0].includes('init --force'), `the warning does not name init --force: ${warnings[0]}`);
    assert.ok(!stdout.includes(REPAIR_TEXT), `an edited copy printed the repair block:\n${stdout}`);
    assert.equal(text(dir, CONTROL_FILE), edited, 'the edited copy was rewritten');
    assert.ok(!existsSync(join(dir, `${CONTROL_FILE}.bak`)), 'an edited copy left a .bak');
  });

  await t.test('the current template on disk: no repair or warning text', async (subtest) => {
    const dir = await controlFixture(subtest, CONTROL_TEMPLATE);
    const { stdout, stderr } = await initOk(dir);
    assert.ok(!stdout.includes('workflow repair'), `the current template printed a repair:\n${stdout}`);
    assert.ok(!stdout.includes(DIFF_LINE), `the current template printed a diff line:\n${stdout}`);
    assert.ok(!stderr.includes(CONTROL_FILE), `the current template printed a warning:\n${stderr}`);
  });
});
