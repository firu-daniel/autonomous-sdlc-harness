/**
 * `scripts/sandbox-probe-runner.yml`, held to the `harness-run.yml` job it reproduces and to the probe's guards.
 *
 * **The rules these tests exist to enforce:**
 * - **Same runner:** it runs where a job would run — the template `run` job's `runs-on`.
 * - **Same steps:** each step it copies carries the template step's `run:` body byte for byte, or, for an action step, its pin and `with:`.
 * - **Same pins:** every `uses:` value is one the template carries.
 * - **Nothing leaks:** it keeps no response body and prints no secret.
 * - **Only its evidence leaves:** it uploads exactly the probe's evidence, kept 3 days.
 * - **Never here:** it sits under `scripts/` and nothing under `.github/` names it.
 *
 * It reads two fixed files — the workflow and `cli/templates/` + `WORKFLOW_TEMPLATE_DIR` + `WORKFLOW_RUN_FILE`
 * — and no tree, so it is not a tree guard and owes no `treeGuards` entry. The canary name and the controls
 * keys are read back by sourcing `legs-runner-isolation.sh` and `legs-runner.sh`, never retyped.
 * It parses both files with js-yaml, a cli/package.json devDependency.
 *
 * Left out deliberately: no workflow step runs here. Gate 12's run is the evidence that the workflow works
 * on a runner.
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import test from 'node:test';

import { load } from 'js-yaml';

import { PACKAGE_ROOT, runBash, WORKSPACE_ROOT } from './helpers/fixture.mjs';
import { WORKFLOW_RUN_FILE, WORKFLOW_TEMPLATE_DIR } from '../dist/remote/githubActions.js';

const WORKFLOW_FILE = 'sandbox-probe-runner.yml';
const WORKFLOW_PATH = join(WORKSPACE_ROOT, 'scripts', WORKFLOW_FILE);
const TEMPLATE_PATH = join(PACKAGE_ROOT, 'templates', WORKFLOW_TEMPLATE_DIR, WORKFLOW_RUN_FILE);
const PROBE_LIB = join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe');

const WORKFLOW_TEXT = readFileSync(WORKFLOW_PATH, 'utf8');
const TEMPLATE_TEXT = readFileSync(TEMPLATE_PATH, 'utf8');
const WORKFLOW = load(WORKFLOW_TEXT);
const TEMPLATE = load(TEMPLATE_TEXT);
const WORKFLOW_LINES = WORKFLOW_TEXT.split('\n');
const TEMPLATE_LINES = TEMPLATE_TEXT.split('\n');

const COPIED = [
  'Check for jq and gh',
  'Set up Node',
  'Read the configuration',
  'Install the claude CLI when absent',
  'Set the git identity',
  'Install the pinned plugin',
  "Generate the job's permission profile",
  'Install the sandbox prerequisites',
  'Bootstrap the checkout',
];
const SWITCH = 'Switch to the configured default branch';
const OAUTH_CHECK = 'Check the OAuth credential';
const CONTROLS = 'Record the runner and the controls';
const AFTER_INSTALL = 'Record the readings after the install step';
const RUN = 'Run the probe in job mode';
const UPLOAD = 'Upload the evidence';
const OAUTH_SECRET = 'secrets.CLAUDE_CODE_OAUTH_TOKEN';
const EVIDENCE_PATHS = [
  '${{ runner.temp }}/sandbox-probe-out/',
  '${{ runner.temp }}/sandbox-probe-tmp/sandbox-probe-evidence.*',
];

const JOBS = Object.values(WORKFLOW.jobs);
const STEPS = JOBS[0].steps;
const STEP_NAMES = STEPS.map((s) => s.name);

/** The workflow step named `name`. */
function step(name) {
  const found = STEPS.find((s) => s.name === name);
  assert.ok(found, `the workflow carries the step ${name}`);
  return found;
}

/** The index of the workflow step named `name`. */
function at(name) {
  const i = STEP_NAMES.indexOf(name);
  assert.notEqual(i, -1, `the workflow carries the step ${name}`);
  return i;
}

const indentOf = (line) => line.length - line.trimStart().length;

/**
 * The `run:` body of the step named `name` in `lines`, de-indented, searched from line `from`; a local copy
 * of workflow-sandbox-install's, extended to a one-line `run: <command>`.
 */
function stepBody(lines, name, from = 0) {
  const start = lines.findIndex((l, i) => i >= from && l.trim() === `- name: ${name}`);
  assert.notEqual(start, -1, `the file carries the step ${name}`);
  const stepIndent = indentOf(lines[start]);
  let runAt = -1;
  for (let i = start + 1; i < lines.length && (lines[i].trim() === '' || indentOf(lines[i]) > stepIndent); i++) {
    if (lines[i].trim().startsWith('run:')) runAt = i;
  }
  assert.notEqual(runAt, -1, `the step ${name} has a run: body`);
  const inline = lines[runAt].trim().slice('run:'.length).trim();
  if (inline !== '|') return inline;
  const base = indentOf(lines[runAt]);
  const body = [];
  for (let i = runAt + 1; i < lines.length; i++) {
    if (lines[i].trim() !== '' && indentOf(lines[i]) <= base) break;
    body.push(lines[i]);
  }
  while (body.length > 0 && body[body.length - 1].trim() === '') body.pop();
  const cut = Math.min(...body.filter((l) => l.trim() !== '').map(indentOf));
  return body.map((l) => l.slice(cut)).join('\n');
}

/** The template's own `run` job begins here, so a same-named step of another job is never matched. */
const TEMPLATE_RUN_JOB = TEMPLATE_LINES.findIndex((l, i) => i > TEMPLATE_LINES.indexOf('jobs:') && l === '  run:');

/** A variable read back from a probe library by sourcing it. */
async function sourced(file, variable) {
  const r = await runBash(WORKSPACE_ROOT, ['-c', `source "$1"; printf '%s' "\${${variable}}"`, 'bash', join(PROBE_LIB, file)]);
  assert.equal(r.status, 0, r.stderr);
  assert.notEqual(r.stdout, '', `${file} sets ${variable}`);
  return r.stdout;
}

/** Every value the template carries under a `uses:` key, in any job. */
function templateUses() {
  return new Set(Object.values(TEMPLATE.jobs).flatMap((job) => (job.steps ?? []).map((s) => s.uses).filter(Boolean)));
}

test('it runs where a job runs, and only when dispatched', () => {
  assert.equal(WORKFLOW.name, 'sandbox-probe-runner');
  assert.deepEqual(Object.keys(WORKFLOW.on), ['workflow_dispatch']);
  const inputs = WORKFLOW.on.workflow_dispatch.inputs;
  assert.deepEqual(Object.keys(inputs).sort(), ['cli_version', 'probe_commit']);
  for (const [key, input] of Object.entries(inputs)) assert.equal(input.required, true, `${key} is required`);

  assert.equal(JOBS.length, 1, 'one job');
  assert.ok(TEMPLATE_RUN_JOB > 0, 'the template carries its run job');
  assert.equal(JOBS[0]['runs-on'], TEMPLATE.jobs.run['runs-on']);

  assert.ok(existsSync(WORKFLOW_PATH), `${WORKFLOW_FILE} sits under scripts/`);
  const github = join(WORKSPACE_ROOT, '.github');
  const named = existsSync(github)
    ? readdirSync(github, { recursive: true }).filter((p) => basename(String(p)) === WORKFLOW_FILE)
    : [];
  assert.deepEqual(named, [], `no path under .github/ names ${WORKFLOW_FILE}`);
});

test("the job's own steps are copied, byte for byte", () => {
  for (const name of COPIED) {
    const original = TEMPLATE.jobs.run.steps.find((s) => s.name === name);
    assert.ok(original, `the template's run job carries ${name}`);
    if (original.uses !== undefined) {
      assert.equal(step(name).uses, original.uses, `${name}'s pin`);
      assert.deepEqual(step(name).with, original.with, `${name}'s with:`);
      continue;
    }
    assert.equal(stepBody(WORKFLOW_LINES, name), stepBody(TEMPLATE_LINES, name, TEMPLATE_RUN_JOB), `${name}'s run: body`);
    assert.equal(step(name).run, original.run, `${name}'s parsed run:`);
  }

  const pins = templateUses();
  const uses = STEPS.map((s) => s.uses).filter(Boolean);
  assert.ok(uses.length > 0, 'the workflow uses an action');
  for (const value of uses) assert.ok(pins.has(value), `${value} is a pin the template carries`);

  assert.ok(at('Install the sandbox prerequisites') < at(RUN));
  assert.ok(at("Generate the job's permission profile") < at('Install the sandbox prerequisites'));
  assert.ok(at("Generate the job's permission profile") < at(RUN));

  assert.ok(at('Read the configuration') < at(SWITCH));
  assert.ok(at(SWITCH) < at('Install the claude CLI when absent'));
  assert.match(step(SWITCH).run, /jq -r '\.defaultBranch[^']*' harness\.config\.json/);
});

test('it keeps no body and prints no secret', async () => {
  const controls = step(CONTROLS).run;
  const curl = controls.split('\n').filter((l) => /\bcurl -/.test(l));
  assert.equal(curl.length, 1, 'one curl line');
  assert.ok(curl[0].includes('-o /dev/null'), curl[0]);
  assert.ok(curl[0].includes("-w '%{http_code}'"), curl[0]);
  assert.doesNotMatch(controls, /Metadata/i);

  const secretRef = /\$\{?(IN_OAUTH|CLAUDE_CODE_OAUTH_TOKEN)\b/;
  for (const s of STEPS.filter((x) => typeof x.run === 'string')) {
    assert.ok(!s.run.includes('secrets.'), `${s.name}'s run: names no secret expression`);
    assert.doesNotMatch(s.run, /\bset\s+-[a-zA-Z]*x|set\s+-o\s+xtrace/, `${s.name} sets no -x`);
    for (const line of s.run.split('\n')) {
      if (/\b(echo|printf|cat|tee|printenv)\b/.test(line)) {
        assert.doesNotMatch(line, secretRef, `${s.name} prints no secret: ${line}`);
      }
      assert.notEqual(line.trim(), 'env', `${s.name} dumps no environment`);
      assert.notEqual(line.trim(), 'printenv', `${s.name} dumps no environment`);
    }
  }
  assert.ok(!/\bbash\s+-[a-z]*x/.test(JSON.stringify(WORKFLOW.defaults ?? {})), 'the default shell sets no -x');

  assert.ok(!JSON.stringify(WORKFLOW.env ?? {}).includes(OAUTH_SECRET), 'no workflow-level env carries the secret');
  assert.ok(!JSON.stringify(JOBS[0].env ?? {}).includes(OAUTH_SECRET), 'no job-level env carries the secret');
  const carriers = STEPS.filter((s) => JSON.stringify(s).includes(OAUTH_SECRET)).map((s) => s.name);
  assert.deepEqual(carriers, [OAUTH_CHECK, RUN]);
  for (const name of carriers) {
    const { env, ...rest } = step(name);
    assert.ok(JSON.stringify(env ?? {}).includes(OAUTH_SECRET), `${name} takes the secret through env:`);
    assert.ok(!JSON.stringify(rest).includes(OAUTH_SECRET), `${name} takes the secret only through env:`);
  }

  const canaryName = await sourced('legs-runner-isolation.sh', 'SP_RUNNER_CANARY_NAME');
  const canary = step(RUN).env[canaryName];
  assert.equal(typeof canary, 'string', `the run step sets ${canaryName}`);
  assert.match(canary, /\$\{\{\s*github\.run_id\s*\}\}/);
  assert.ok(!canary.includes('secrets.'), `${canaryName} is built from no secret`);
  assert.equal(canary.match(/\$\{\{/g).length, 1, `${canaryName} carries github.run_id alone`);

  const keys = (await sourced('legs-runner.sh', 'SP__RUNNER_KEYS')).split(' ').filter(Boolean);
  const after = step(AFTER_INSTALL).run;
  const written = [...`${controls}\n${after}`.matchAll(/^\s*record ([a-z-]+)\b/gm)].map((m) => m[1]);
  assert.deepEqual([...new Set(written)].sort(), [...keys].sort(), 'every controls key is written, and no other');

  const bodies = STEPS.filter((s) => typeof s.run === 'string').map((s) => s.run).join('\n');
  assert.equal(bodies.match(/^\s*record\(\)/gm)?.length, 1, 'one record function');
  assert.ok(controls.includes(`value="\${value//$'\\t'/ }"`), 'record replaces a tab with a space');
  assert.ok(controls.includes(`value="\${value//$'\\n'/ }"`), 'record replaces a newline with a space');
  const appends = bodies.split('\n').filter((l) => /controls\.tsv/.test(l) && />>/.test(l));
  assert.equal(appends.length, 1, 'only record appends to controls.tsv');
  assert.match(appends[0], /^\s*printf '%s\\t%s\\n' "\$1" "\$value" >>/);
  assert.match(after, /^source "\$RUNNER_TEMP\/sandbox-probe-record\.sh"$/m, 'the after step sources the same record');
});

test('only the evidence leaves the runner', () => {
  const upload = step(UPLOAD);
  assert.equal(upload.if, 'always()');
  assert.equal(upload.with.name, 'sandbox-probe-evidence');
  assert.equal(upload.with['retention-days'], 3);
  const paths = upload.with.path.split('\n').map((l) => l.trim()).filter(Boolean);
  assert.deepEqual(paths, EVIDENCE_PATHS);
  assert.equal(STEPS.filter((s) => typeof s.uses === 'string' && s.uses.startsWith('actions/upload-artifact@')).length, 1, 'one upload');

  const run = step(RUN).run;
  assert.ok(
    run.includes('bash "$RUNNER_TEMP/sandbox-probe-src/scripts/sandbox-probe.sh" run --job "$GITHUB_WORKSPACE" --runner-controls '),
    'the run step invokes the probe from $RUNNER_TEMP/sandbox-probe-src in job mode',
  );
  assert.match(run, /^export TMPDIR="\$RUNNER_TEMP\/[^"]+"$/m, 'TMPDIR sits under $RUNNER_TEMP');
});
