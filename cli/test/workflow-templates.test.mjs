/**
 * The `harness-run.yml` and `harness-resume.yml` workflow templates, read as text.
 *
 * **The contract these tests enforce.** The seven `workflow_dispatch` inputs `remote-run.sh`
 * sends, with `action`'s options exactly `run`, `pause`, `warm` and `stop`; a job only for `run`
 * and for `warm`, so `pause` and `stop` start none; the `collect` job after `run`, under `!cancelled()`,
 * in the `harness-review-<branch>` group with `cancel-in-progress: false`, checking out the default
 * branch rather than `inputs.branch`, reading no secret and running
 * `remote-run.sh collect` alone; the `run-name` title the pause poll and
 * `continue` / `poll` match runs by; the `runs-on` line and the permissions exactly `contents`,
 * `actions`, `issues` and `pull-requests`, each `write`; the `Open the pull request and report`
 * step running `remote-run.sh deliver` after `Upload the state bundle` and before `Continue, wait
 * or stop`, `continue-on-error: true`, with `HARNESS_PR_TOKEN` drawn from `secrets.HARNESS_GIT_TOKEN`
 * through `env:`; the cancelled-job step calling `remote-run.sh report failed`; every GitHub
 * expression spaced after its braces and `{{cliVersion}}` the only template token, so the CLI's
 * renderer (`cli/src/core/templating.ts`) sees nothing else; no input or secret expression inside a
 * `run:` block (script injection); `continue` under `!cancelled()` and the upload and final push
 * under `always()`; the upload step's artifact name and `remote-run.sh`'s `STATE_ARTIFACT_NAME` are
 * both `cli/src/remote/githubActions.ts` → `STATE_ARTIFACT_NAME`; no configured directory frozen
 * into the file; and the `Preflight with doctor` step runs `doctor --remote-job` after the step
 * generating the job's permission profile and before the harness runs — the option spelled as
 * `cli/src/commands/doctor.ts` → `REMOTE_JOB_FLAG` declares it, which that module does not export.
 *
 * For `harness-resume.yml`: the `schedule` and `workflow_dispatch` triggers; the permissions exactly
 * `contents: read`, `actions: write`, `issues: write` and `pull-requests: write`;`remote-run.sh poll` its only call into the script family;
 * `HARNESS_PUSH_URL` passed through `env:`; no template token at all; every GitHub expression spaced; none inside a `run:` block;
 * its state upload under `always()` named `POLL_STATE_ARTIFACT_NAME`, as `remote-run.sh` spells it.
 *
 * For `harness-trigger.yml`: the `issues` and `repository_dispatch` triggers, `labeled` the only
 * `issues` type so `opened` never starts a second run, and `TRIGGER_DISPATCH_EVENT_TYPE` the only
 * dispatch type; the permissions exactly `contents: write`, `actions: write` and `issues: write`; the
 * job's `if:` and its `TRIGGER_LABEL_VARIABLE` env line each naming `TRIGGER_LABEL_VARIABLE` with
 * `DEFAULT_TRIGGER_LABEL` as its fallback;
 * `remote-run.sh trigger` its only call into the script family; no `secrets.` reference, so the
 * credential secrets never reach the job reading issue text; no `concurrency:` key, which would drop a
 * pending trigger; no template token; every expression spaced, and none inside a `run:` block.
 *
 * For `harness-control.yml`: the `issue_comment` and `pull_request_review` triggers, `created` and
 * `submitted` their only types, and neither `pull_request_target` nor `pull_request_review_comment`
 * outside a comment line; the permissions exactly `contents`, `actions`, `issues` and `pull-requests`,
 * each `write`; the job's `if:` carrying `COMMAND_HANDLE`, `COMMENT_MARKER` and `REVIEW_ROUND_STATE`
 * and comparing the head repository with `github.repository`, so a fork's review is skipped; the
 * checkout's `ref` the default branch, never the pull request's merge commit; `remote-run.sh control`
 * its only call into the script family; no `secrets.` reference; one `concurrency:` group on the job,
 * `harness-review-` plus the head ref for a review and the run's own id for a comment, with
 * `cancel-in-progress: false`, so review jobs on one branch run one at a time and no comment job is
 * ever replaced; no template token; every expression spaced, and none inside a `run:` block.
 *
 * For all four: the `# ACTION PINS.` header names exactly the set of `uses:` values the file carries, so a
 * pin the file dropped or a bumped `uses:` the header forgot fails; and every `uses:` value is a major
 * tag of a GitHub `actions/` action, never a sha or a branch — the pinning decision that header states.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT } from './helpers/fixture.mjs';
import {
  COMMAND_HANDLE,
  COMMENT_MARKER,
  DEFAULT_TRIGGER_LABEL,
  POLL_STATE_ARTIFACT_NAME,
  REVIEW_ROUND_STATE,
  STATE_ARTIFACT_NAME,
  TRIGGER_DISPATCH_EVENT_TYPE,
  TRIGGER_LABEL_VARIABLE,
  WORKFLOW_CONTROL_FILE,
  WORKFLOW_RESUME_FILE,
  WORKFLOW_RUN_FILE,
  WORKFLOW_TEMPLATE_DIR,
  WORKFLOW_TRIGGER_FILE,
} from '../dist/remote/githubActions.js';

const TEXT = readFileSync(join(PACKAGE_ROOT, 'templates', WORKFLOW_TEMPLATE_DIR, WORKFLOW_RUN_FILE), 'utf8');
const LINES = TEXT.split('\n');
const RESUME_TEXT = readFileSync(join(PACKAGE_ROOT, 'templates', WORKFLOW_TEMPLATE_DIR, WORKFLOW_RESUME_FILE), 'utf8');
const RESUME_LINES = RESUME_TEXT.split('\n');
const TRIGGER_TEXT = readFileSync(join(PACKAGE_ROOT, 'templates', WORKFLOW_TEMPLATE_DIR, WORKFLOW_TRIGGER_FILE), 'utf8');
const TRIGGER_LINES = TRIGGER_TEXT.split('\n');
const CONTROL_TEXT = readFileSync(join(PACKAGE_ROOT, 'templates', WORKFLOW_TEMPLATE_DIR, WORKFLOW_CONTROL_FILE), 'utf8');
const CONTROL_LINES = CONTROL_TEXT.split('\n');

const indentOf = (line) => line.length - line.trimStart().length;

/** The lines under `LINES[start]` indented deeper than it, blank lines kept. */
function blockUnder(start, lines = LINES) {
  const base = indentOf(lines[start]);
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() !== '' && indentOf(lines[i]) <= base) break;
    out.push(lines[i]);
  }
  return out;
}

/** Every `run:` body: the inline value, or the block under a `run: |`. */
function runBodies(lines = LINES) {
  const bodies = [];
  lines.forEach((line, i) => {
    const m = /^\s*(?:- )?run:\s*(.*)$/.exec(line);
    if (m === null) return;
    bodies.push(m[1] === '|' ? blockUnder(i, lines).join('\n') : m[1]);
  });
  return bodies;
}

/** Every step, as the text from its `- name:` line to the next sibling. */
function steps() {
  const out = [];
  LINES.forEach((line, i) => {
    if (/^\s*- name: /.test(line)) out.push([line, ...blockUnder(i)].join('\n'));
  });
  return out;
}

function stepCarrying(fragment) {
  const found = steps().filter((s) => s.includes(fragment));
  assert.equal(found.length, 1, `exactly one step carries ${fragment}`);
  return found[0];
}

const ifOf = (step) => /^\s*if: (.*)$/m.exec(step)?.[1] ?? '';

/** The block of one `workflow_dispatch` input. */
function input(name) {
  const i = LINES.findIndex((l) => l === `      ${name}:`);
  assert.notEqual(i, -1, `input ${name} is declared`);
  return blockUnder(i).join('\n');
}

const optionsOf = (block) => [...block.matchAll(/^\s*- (\S+)$/gm)].map((m) => m[1]);

test('the seven inputs, with their types and options', () => {
  const start = LINES.findIndex((l) => l === '    inputs:');
  const names = blockUnder(start)
    .filter((l) => /^ {6}[a-z_]+:$/.test(l))
    .map((l) => l.trim().slice(0, -1));
  assert.deepEqual(names, ['action', 'branch', 'engine', 'resume', 'answers', 'park_loop_clear', 'chain']);
  assert.deepEqual(optionsOf(input('action')), ['run', 'pause', 'warm', 'stop']);
  assert.deepEqual(optionsOf(input('engine')), ['task', 'user_review', 'docs']);
  assert.deepEqual(optionsOf(input('resume')), ['none', 'answer', 'pause']);
  assert.match(input('branch'), /type: string/);
  assert.match(input('answers'), /type: string/);
  assert.match(input('park_loop_clear'), /type: boolean/);
  assert.match(input('chain'), /type: number/);
});

test('only run and warm start a job, so pause and stop start none', () => {
  const jobIfs = LINES.filter((l) => /^ {4}if: /.test(l)).map((l) => l.trim());
  assert.deepEqual(jobIfs, [
    "if: inputs.action == 'run'",
    "if: ${{ inputs.action == 'run' && !cancelled() }}",
    "if: inputs.action == 'warm'",
  ]);
});

test('the collect job follows run unless cancelled, shares the review group, reads no secret and runs collect', () => {
  const start = LINES.indexOf('  collect:');
  assert.notEqual(start, -1, 'harness-run.yml carries a collect job');
  const block = blockUnder(start);
  const text = block.join('\n');
  assert.ok(block.includes('    needs: run'), text);
  assert.match(text, /^ {4}if: .*!cancelled\(\)/m);
  const at = block.findIndex((l) => /^ {4}concurrency:$/.test(l));
  assert.notEqual(at, -1, 'the collect job declares a concurrency group');
  assert.deepEqual(blockUnder(at, block).map((l) => l.trim()), [
    'group: harness-review-${{ inputs.branch }}',
    'cancel-in-progress: false',
  ]);
  assert.doesNotMatch(text, /secrets\./);
  const refs = block.filter((l) => /^\s+ref: /.test(l)).map((l) => l.trim());
  assert.deepEqual(refs, ['ref: ${{ github.event.repository.default_branch }}'], 'review cannot cut a branch the job checked out');
  const calls = runBodies(block).flatMap((body) =>
    [...body.matchAll(/([A-Za-z0-9_-]+\.sh)"?\s+(\S*)/g)].map((m) => `${m[1]} ${m[2]}`),
  );
  assert.deepEqual(calls, ['remote-run.sh collect']);
  assert.match(text, /remote-run\.sh" collect "\$HARNESS_INPUT_BRANCH"/);
});

test('the run-name title, the runner line and the permissions', () => {
  assert.ok(LINES.includes('run-name: harness ${{ inputs.action }} ${{ inputs.branch }}'));
  for (const line of LINES.filter((l) => /^\s*runs-on:/.test(l))) {
    assert.equal(line.trim(), "runs-on: ${{ vars.HARNESS_RUNNER || 'ubuntu-latest' }}");
  }
  const i = LINES.indexOf('permissions:');
  assert.deepEqual(blockUnder(i).filter((l) => l.trim() !== '').map((l) => l.trim()), [
    'contents: write',
    'actions: write',
    'issues: write',
    'pull-requests: write',
  ]);
});

test('deliver opens the pull request and reports, after the upload and before continue, never failing the job', () => {
  const names = steps().map((s) => /- name: (.*)$/m.exec(s)[1]);
  const at = (name) => {
    const i = names.indexOf(name);
    assert.notEqual(i, -1, `a step is named ${name}`);
    return i;
  };
  const deliver = at('Open the pull request and report');
  assert.ok(at('Upload the state bundle') < deliver);
  assert.ok(deliver < at('Continue, wait or stop'));
  const step = steps()[deliver];
  assert.match(ifOf(step), /!cancelled\(\)/);
  assert.match(step, /^\s*continue-on-error: true$/m);
  assert.match(step, /^\s*HARNESS_PR_TOKEN: \$\{\{ secrets\.HARNESS_GIT_TOKEN \}\}$/m);
  const [body] = runBodies(step.split('\n'));
  assert.equal(body, 'bash "$SCRIPTS_DIR/remote-run.sh" deliver "$HARNESS_INPUT_BRANCH" "$RUNNER_TEMP/harness-state"');
});

test('a cancelled job reports failed through remote-run.sh report', () => {
  const step = stepCarrying('autonomous-notify.sh" failed');
  assert.match(ifOf(step), /^cancelled\(\)/);
  assert.match(runBodies(step.split('\n')).join('\n'), /remote-run\.sh" report failed "\$HARNESS_INPUT_BRANCH" --note /);
});

test('every expression is spaced, and {{cliVersion}} is the only token', () => {
  assert.doesNotMatch(TEXT, /\$\{\{[^ ]/);
  const tokens = new Set([...TEXT.matchAll(/\{\{([A-Za-z][A-Za-z0-9_]*)/g)].map((m) => m[1]));
  assert.deepEqual([...tokens], ['cliVersion']);
  assert.ok(TEXT.includes('{{cliVersion}}'));
});

test('no input or secret expression reaches a run block', () => {
  const bodies = runBodies();
  assert.ok(bodies.length > 0);
  for (const body of bodies) {
    assert.ok(!body.includes('${{ inputs.'), `input expression in run: ${body}`);
    assert.ok(!body.includes('${{ secrets.'), `secret expression in run: ${body}`);
  }
});

test('continue runs unless cancelled; the upload and the final push always run', () => {
  assert.match(ifOf(stepCarrying('remote-run.sh" continue')), /!cancelled\(\)/);
  assert.match(ifOf(stepCarrying('actions/upload-artifact')), /always\(\)/);
  assert.match(ifOf(stepCarrying('push-branch.sh')), /always\(\)/);
});

test('the uploaded artifact is the one remote-run.sh downloads: STATE_ARTIFACT_NAME in both mirrors', () => {
  const upload = stepCarrying('actions/upload-artifact');
  assert.match(upload, new RegExp(`^\\s*name: ${STATE_ARTIFACT_NAME}$`, 'm'));
  const script = readFileSync(join(PACKAGE_ROOT, 'templates', 'scripts', 'remote-run.sh'), 'utf8');
  assert.match(script, new RegExp(`^STATE_ARTIFACT_NAME='${STATE_ARTIFACT_NAME}'$`, 'm'));
});

test('the poller uploads its state under POLL_STATE_ARTIFACT_NAME, the name remote-run.sh downloads, always', () => {
  const at = RESUME_LINES.findIndex((line) => /^\s*(?:- )?uses:\s*actions\/upload-artifact@/.test(line));
  assert.notEqual(at, -1);
  let start = at;
  while (start >= 0 && !/^\s*- name:/.test(RESUME_LINES[start])) start--;
  assert.ok(start >= 0, 'the upload-artifact uses: line sits inside a named step');
  const step = [RESUME_LINES[start], ...blockUnder(start, RESUME_LINES)].join('\n');
  assert.match(step, new RegExp(`^\\s*name: ${POLL_STATE_ARTIFACT_NAME}$`, 'm'));
  assert.match(step, /^\s*if: always\(\)/m);
  const script = readFileSync(join(PACKAGE_ROOT, 'templates', 'scripts', 'remote-run.sh'), 'utf8');
  assert.match(script, new RegExp(`^POLL_STATE_ARTIFACT_NAME='${POLL_STATE_ARTIFACT_NAME}'$`, 'm'));
});

test('the preflight runs doctor --remote-job, after the profile is generated and before the harness runs', () => {
  const names = steps().map((s) => /- name: (.*)$/m.exec(s)[1]);
  const at = (name) => {
    const i = names.indexOf(name);
    assert.notEqual(i, -1, `a step is named ${name}`);
    return i;
  };
  const preflight = at('Preflight with doctor');
  assert.ok(at("Generate the job's permission profile") < preflight);
  assert.ok(preflight < at('Run the harness'));
  const [body] = runBodies(steps()[preflight].split('\n'));
  assert.equal(body, 'npx --yes "autonomous-sdlc-harness@$HARNESS_CLI_VERSION" doctor --remote-job');
});

test('no configured directory is frozen into the file', () => {
  assert.doesNotMatch(TEXT, /(^|[^A-Za-z0-9_])scripts\//m);
  // A segment of its own: the machine cache path's `autonomous-sdlc-harness/` is not the state dir.
  assert.doesNotMatch(TEXT, /(^|[^A-Za-z0-9_-])sdlc-harness\//m);
});

test('the poller: a schedule, a hand trigger, and exactly its four permissions', () => {
  const on = RESUME_LINES.indexOf('on:');
  assert.notEqual(on, -1);
  const under = blockUnder(on, RESUME_LINES);
  const triggers = under.filter((l) => /^ {2}[a-z_]+:/.test(l)).map((l) => l.trim().replace(/:.*$/, ''));
  assert.deepEqual(triggers, ['schedule', 'workflow_dispatch']);
  assert.match(under.join('\n'), /^\s*- cron: '[^']+'$/m);
  const perms = RESUME_LINES.indexOf('permissions:');
  assert.deepEqual(
    blockUnder(perms, RESUME_LINES).filter((l) => l.trim() !== '').map((l) => l.trim()),
    ['contents: read', 'actions: write', 'issues: write', 'pull-requests: write'],
  );
});

test('the poller runs remote-run.sh poll and nothing else of the family', () => {
  const calls = runBodies(RESUME_LINES).flatMap((body) =>
    [...body.matchAll(/([A-Za-z0-9_-]+\.sh)"?\s+(\S*)/g)].map((m) => `${m[1]} ${m[2]}`),
  );
  assert.deepEqual(calls, ['remote-run.sh poll']);
});

test('the poller passes the push secret through env, so its failed notice can be delivered', () => {
  assert.match(RESUME_TEXT, /^ {6}HARNESS_PUSH_URL: \$\{\{ secrets\.HARNESS_PUSH_URL \}\}$/m);
});

/** The `#   actions/…@…` lines under `# ACTION PINS.`, up to a bare `#` or the next upper-case heading. */
function actionPins(lines) {
  const start = lines.indexOf('# ACTION PINS.');
  assert.notEqual(start, -1, 'the header carries an ACTION PINS block');
  const pins = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i] === '#' || /^# [A-Z][A-Z_]+[ .]/.test(lines[i])) break;
    const m = /^# {3}(actions\/\S+@\S+)$/.exec(lines[i]);
    if (m !== null) pins.push(m[1]);
  }
  return pins;
}

const usesValues = (lines) =>
  lines.map((l) => /^\s*(?:- )?uses:\s*(\S+)\s*$/.exec(l)?.[1]).filter((v) => v !== undefined);

for (const [file, lines] of [
  [WORKFLOW_RUN_FILE, LINES],
  [WORKFLOW_RESUME_FILE, RESUME_LINES],
  [WORKFLOW_TRIGGER_FILE, TRIGGER_LINES],
  [WORKFLOW_CONTROL_FILE, CONTROL_LINES],
]) {
  test(`${file}: the ACTION PINS header names exactly the uses: values, each a major tag of an actions/ action`, () => {
    const uses = usesValues(lines);
    assert.ok(uses.length > 0, 'the file carries a uses: line');
    assert.deepEqual(new Set(actionPins(lines)), new Set(uses));
    for (const value of uses) assert.match(value, /^actions\/[a-z-]+(\/[a-z-]+)?@v[0-9]+$/);
  });
}

test('the poller carries no template token, and every expression is spaced and outside run blocks', () => {
  assert.doesNotMatch(RESUME_TEXT, /\{\{[A-Za-z]/);
  assert.doesNotMatch(RESUME_TEXT, /\$\{\{[^ ]/);
  const bodies = runBodies(RESUME_LINES);
  assert.ok(bodies.length > 0);
  for (const body of bodies) assert.ok(!body.includes('${{'), `expression in run: ${body}`);
});

test('the trigger: a labelled issue or a harness-task dispatch, and never opened', () => {
  const on = TRIGGER_LINES.indexOf('on:');
  assert.notEqual(on, -1);
  const under = blockUnder(on, TRIGGER_LINES);
  const triggers = under.filter((l) => /^ {2}[a-z_]+:/.test(l)).map((l) => l.trim().replace(/:.*$/, ''));
  assert.deepEqual(triggers, ['issues', 'repository_dispatch']);
  const typesOf = (event) => {
    const i = TRIGGER_LINES.indexOf(`  ${event}:`);
    const line = blockUnder(i, TRIGGER_LINES).find((l) => /^\s*types:/.test(l));
    return /types: \[(.*)\]$/.exec(line)[1].split(',').map((t) => t.trim());
  };
  assert.deepEqual(typesOf('issues'), ['labeled']);
  assert.deepEqual(typesOf('repository_dispatch'), [TRIGGER_DISPATCH_EVENT_TYPE]);
  assert.ok(!under.join('\n').includes('opened'));
});

test('the trigger: exactly its three permissions', () => {
  const i = TRIGGER_LINES.indexOf('permissions:');
  assert.deepEqual(
    blockUnder(i, TRIGGER_LINES).filter((l) => l.trim() !== '').map((l) => l.trim()),
    ['contents: write', 'actions: write', 'issues: write'],
  );
});

test('the trigger job runs for a dispatch or the configured label, defaulting to DEFAULT_TRIGGER_LABEL', () => {
  const jobIfs = TRIGGER_LINES.filter((l) => /^ {4}if: /.test(l)).map((l) => l.trim());
  assert.deepEqual(jobIfs, [
    `if: github.event_name == 'repository_dispatch' || github.event.label.name == (vars.${TRIGGER_LABEL_VARIABLE} || '${DEFAULT_TRIGGER_LABEL}')`,
  ]);
});

test('the trigger job passes the label its if: matched, never an empty one', () => {
  const envLines = TRIGGER_LINES.filter((l) => l.trim().startsWith(`${TRIGGER_LABEL_VARIABLE}:`)).map((l) => l.trim());
  assert.deepEqual(envLines, [
    `${TRIGGER_LABEL_VARIABLE}: \${{ vars.${TRIGGER_LABEL_VARIABLE} || '${DEFAULT_TRIGGER_LABEL}' }}`,
  ]);
});

test('the trigger runs remote-run.sh trigger and nothing else of the family', () => {
  const calls = runBodies(TRIGGER_LINES).flatMap((body) =>
    [...body.matchAll(/([A-Za-z0-9_-]+\.sh)"?\s+(\S*)/g)].map((m) => `${m[1]} ${m[2]}`),
  );
  assert.deepEqual(calls, ['remote-run.sh trigger']);
});

test('the trigger references no secret and declares no concurrency group', () => {
  assert.doesNotMatch(TRIGGER_TEXT, /secrets\./);
  assert.doesNotMatch(TRIGGER_TEXT, /^\s*concurrency:/m);
});

test('the trigger carries no template token, and every expression is spaced and outside run blocks', () => {
  assert.doesNotMatch(TRIGGER_TEXT, /\{\{[A-Za-z]/);
  assert.doesNotMatch(TRIGGER_TEXT, /\$\{\{[^ ]/);
  const bodies = runBodies(TRIGGER_LINES);
  assert.ok(bodies.length > 0);
  for (const body of bodies) assert.ok(!body.includes('${{'), `expression in run: ${body}`);
});

test('control: a created comment or a submitted review, never pull_request_target or review comments', () => {
  const on = CONTROL_LINES.indexOf('on:');
  assert.notEqual(on, -1);
  const under = blockUnder(on, CONTROL_LINES);
  const triggers = under.filter((l) => /^ {2}[a-z_]+:/.test(l)).map((l) => l.trim().replace(/:.*$/, ''));
  assert.deepEqual(triggers, ['issue_comment', 'pull_request_review']);
  const typesOf = (event) => {
    const i = CONTROL_LINES.indexOf(`  ${event}:`);
    const line = blockUnder(i, CONTROL_LINES).find((l) => /^\s*types:/.test(l));
    return /types: \[(.*)\]$/.exec(line)[1].split(',').map((t) => t.trim());
  };
  assert.deepEqual(typesOf('issue_comment'), ['created']);
  assert.deepEqual(typesOf('pull_request_review'), ['submitted']);
  const code = CONTROL_LINES.filter((l) => !/^\s*#/.test(l)).join('\n');
  assert.ok(!code.includes('pull_request_target'));
  assert.ok(!code.includes('pull_request_review_comment'));
});

test('control: exactly its four permissions', () => {
  const i = CONTROL_LINES.indexOf('permissions:');
  assert.deepEqual(
    blockUnder(i, CONTROL_LINES).filter((l) => l.trim() !== '').map((l) => l.trim()),
    ['contents: write', 'actions: write', 'issues: write', 'pull-requests: write'],
  );
});

test("control: the job's if: prefilters on the handle, the marker and the review state, and skips a fork's review", () => {
  const jobIfs = CONTROL_LINES.filter((l) => /^ {4}if: /.test(l)).map((l) => l.trim());
  assert.equal(jobIfs.length, 1);
  const [cond] = jobIfs;
  assert.ok(cond.includes(`contains(github.event.comment.body, '${COMMAND_HANDLE}')`));
  assert.ok(cond.includes(`!contains(github.event.comment.body, '${COMMENT_MARKER}')`));
  assert.ok(cond.includes(`github.event.review.state == '${REVIEW_ROUND_STATE}'`));
  assert.ok(cond.includes('github.event.pull_request.head.repo.full_name == github.repository'));
});

test('control: the checkout is the default branch', () => {
  const at = CONTROL_LINES.findIndex((l) => /^\s*(?:- )?uses:\s*actions\/checkout@/.test(l));
  assert.notEqual(at, -1);
  const withAt = CONTROL_LINES.findIndex((l, i) => i > at && /^\s*with:$/.test(l));
  const refs = blockUnder(withAt, CONTROL_LINES).filter((l) => /^\s*ref:/.test(l)).map((l) => l.trim());
  assert.deepEqual(refs, ['ref: ${{ github.event.repository.default_branch }}']);
});

test('control runs remote-run.sh control and nothing else of the family', () => {
  const calls = runBodies(CONTROL_LINES).flatMap((body) =>
    [...body.matchAll(/([A-Za-z0-9_-]+\.sh)"?\s+(\S*)/g)].map((m) => `${m[1]} ${m[2]}`),
  );
  assert.deepEqual(calls, ['remote-run.sh control']);
});

test('control references no secret, and serializes review jobs per head branch but never comment jobs', () => {
  assert.doesNotMatch(CONTROL_TEXT, /secrets\./);
  const at = CONTROL_LINES.findIndex((l) => /^ {4}concurrency:$/.test(l));
  assert.notEqual(at, -1, 'the control job declares a concurrency group');
  assert.equal(CONTROL_LINES.filter((l) => /^\s*concurrency:/.test(l)).length, 1);
  const block = blockUnder(at, CONTROL_LINES).map((l) => l.trim());
  assert.deepEqual(block, [
    "group: ${{ github.event_name == 'pull_request_review' && format('harness-review-{0}', github.event.pull_request.head.ref) || format('harness-control-{0}', github.run_id) }}",
    'cancel-in-progress: false',
  ]);
});

test('control carries no template token, and every expression is spaced and outside run blocks', () => {
  assert.doesNotMatch(CONTROL_TEXT, /\{\{[A-Za-z]/);
  assert.doesNotMatch(CONTROL_TEXT, /\$\{\{[^ ]/);
  const bodies = runBodies(CONTROL_LINES);
  assert.ok(bodies.length > 0);
  for (const body of bodies) assert.ok(!body.includes('${{'), `expression in run: ${body}`);
});
