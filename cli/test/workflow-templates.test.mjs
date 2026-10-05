/**
 * The `harness-run.yml` and `harness-resume.yml` workflow templates, read as text.
 *
 * **The contract these tests enforce.** The seven `workflow_dispatch` inputs `remote-run.sh`
 * sends, with `action`'s options exactly `run`, `pause`, `warm` and `stop`; a job only for `run`
 * and for `warm`, so `pause` and `stop` start none, except the `wrong-ref` job, which fails a `run`
 * or `pause` whose `github.ref_name` is not its `branch` input, reading both only through its step's
 * `env:`, while the `run` and `collect` jobs' `if:` require that ref and that input to agree;
 * the `collect` job after `run`, under `!cancelled()`,
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
 * The run-actor gate: the first step of `run` and of `collect`, its `run:` body identical in both and
 * no `secrets.` step of `run` before it, both jobs' `env:` passing `RUN_ACTORS_VARIABLE` from
 * `vars.`, each gate step's `env:` exactly `IN_TRIGGERING_ACTOR`, `IN_OWNER` and `IN_OWNER_TYPE`; and
 * the body, run under `bash -e -o pipefail`, passing `github-actions[bot]`, a listed login, `*` and the
 * owner of a user-owned repository under an empty list, and refusing every other actor with an
 * `::error::` line naming `RUN_ACTORS_VARIABLE`.
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
 * For `harness-control.yml`: the `issue_comment`, `pull_request_review`, `issues`, `pull_request` and
 * `delete` triggers, `created`, `submitted`, `closed` and `closed` their only types, and neither
 * `pull_request_target` nor `pull_request_review_comment` outside a comment line; the `run-name`
 * falling back to the deleted ref; the permissions exactly `contents`, `actions`, `issues` and
 * `pull-requests`, each `write`; the job's `if:` exactly `if: >-`, its condition on the one
 * continuation line beneath, because the condition carries `: ` and a plain scalar would read that
 * as a mapping indicator and leave the file unparseable; no plain-scalar mapping value carrying `: `
 * or ` #` (the header's third rule, checked in all four files below); the condition carrying
 * `COMMAND_HANDLE`, `COMMENT_MARKER`, `REVIEW_ROUND_STATE` and `STATE_LABEL_PREFIX`, comparing the head repository with
 * `github.repository` for a review and a closed pull request, so a fork's is skipped, and admitting a
 * deleted ref only when it is a branch; the checkout's `ref` the default branch, never the pull
 * request's merge commit; `remote-run.sh control` its only call into the script family, its step
 * ending `|| [ $? -eq 2 ]` so that, run under `bash -e -o pipefail`, a replied refusal (exit 2)
 * passes and 1, 3 and 4 fail; no `secrets.` reference; one `concurrency:` group on the job,
 * `harness-review-` plus the head ref for a review and the run's own id for a comment, with
 * `cancel-in-progress: false`, so review jobs on one branch run one at a time and no comment job is
 * ever replaced; no template token; every expression spaced, and none inside a `run:` block.
 *
 * For all four: the `# ACTION PINS.` header names exactly the set of `uses:` values the file carries, so a
 * pin the file dropped or a bumped `uses:` the header forgot fails; and every `uses:` value is a major
 * tag of a GitHub `actions/` action, never a sha or a branch — the pinning decision that header states.
 * And outside a `|` / `>` block body, no mapping value that opens as a plain scalar carries `: ` or
 * ` #`: the first breaks the parse, the second silently truncates the value as a comment. These are
 * text-level readings; no YAML parser is loaded.
 */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT } from './helpers/fixture.mjs';
import {
  COMMAND_HANDLE,
  COMMENT_MARKER,
  DEFAULT_TRIGGER_LABEL,
  POLL_STATE_ARTIFACT_NAME,
  REVIEW_ROUND_STATE,
  RUN_ACTORS_VARIABLE,
  STATE_ARTIFACT_NAME,
  STATE_LABEL_PREFIX,
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

test('only run and warm start a job, and pause only a failing one from the wrong ref; stop starts none', () => {
  const jobIfs = LINES.filter((l) => /^ {4}if: /.test(l)).map((l) => l.trim());
  assert.deepEqual(jobIfs, [
    "if: (inputs.action == 'run' || inputs.action == 'pause') && github.ref_name != inputs.branch",
    "if: inputs.action == 'run' && github.ref_name == inputs.branch",
    "if: ${{ inputs.action == 'run' && !cancelled() && github.ref_name == inputs.branch }}",
    "if: inputs.action == 'warm'",
  ]);
});

test('the wrong-ref job reads the ref and the branch through env and fails, naming the ref to use', () => {
  const start = LINES.indexOf('  wrong-ref:');
  assert.notEqual(start, -1, 'harness-run.yml carries a wrong-ref job');
  const block = blockUnder(start);
  const text = block.join('\n');
  assert.match(text, /^ {10}IN_REF: \$\{\{ github\.ref_name \}\}$/m);
  assert.match(text, /^ {10}IN_BRANCH: \$\{\{ inputs\.branch \}\}$/m);
  const bodies = runBodies(block);
  assert.equal(bodies.length, 1);
  const [body] = bodies;
  assert.ok(!body.includes('${{'), `expression in run: ${body}`);
  assert.match(body, /::error::this run was dispatched from '\$IN_REF', but its branch input is '\$IN_BRANCH'/);
  assert.match(body, /Use workflow from set to '\$IN_BRANCH'/);
  assert.match(body, /^\s*exit 1$/m);
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

/** The line of one job's key under `jobs:`; `defaults:` carries a `  run:` key of its own above it. */
function jobStart(job) {
  const start = LINES.indexOf(`  ${job}:`, LINES.indexOf('jobs:'));
  assert.notEqual(start, -1, `harness-run.yml carries a ${job} job`);
  return start;
}

/** The `- name:` steps of one job, as line blocks, in order. */
function jobSteps(job) {
  const block = blockUnder(jobStart(job));
  return block.flatMap((line, i) => (/^\s*- name: /.test(line) ? [[line, ...blockUnder(i, block)]] : []));
}

/** The job-level `env:` lines of one job, trimmed. */
function jobEnv(job) {
  const block = blockUnder(jobStart(job));
  const at = block.findIndex((l) => /^ {4}env:$/.test(l));
  assert.notEqual(at, -1, `the ${job} job declares env:`);
  return blockUnder(at, block).map((l) => l.trim());
}

const GATE_STEPS = {
  run: `Refuse an actor not on ${RUN_ACTORS_VARIABLE}`,
  collect: `Refuse an actor not on ${RUN_ACTORS_VARIABLE} before collecting`,
};

function gateBody(job) {
  const [first] = jobSteps(job);
  assert.equal(first[0].trim(), `- name: ${GATE_STEPS[job]}`, `the gate is the ${job} job's first step`);
  const bodies = runBodies(first);
  assert.equal(bodies.length, 1);
  return bodies[0];
}

test('the run-actor gate is the first step of run and collect, identical in both, before any secret', () => {
  assert.equal(gateBody('run'), gateBody('collect'));
  assert.ok(!gateBody('run').includes('${{'), 'no expression inside the gate body');
  const runSteps = jobSteps('run');
  const firstSecret = runSteps.findIndex((s) => s.join('\n').includes('secrets.'));
  assert.ok(firstSecret > 0, 'no step of run reading a secret comes before the gate');
});

test('the run-actor gate reads the list from vars and the actor and owner through its own env', () => {
  for (const job of ['run', 'collect']) {
    assert.ok(
      jobEnv(job).includes(`${RUN_ACTORS_VARIABLE}: \${{ vars.${RUN_ACTORS_VARIABLE} }}`),
      `the ${job} job passes ${RUN_ACTORS_VARIABLE}`,
    );
    const [first] = jobSteps(job);
    const at = first.findIndex((l) => /^\s*env:$/.test(l));
    assert.notEqual(at, -1);
    assert.deepEqual(
      blockUnder(at, first).filter((l) => l.trim() !== '').map((l) => l.trim()),
      [
        'IN_TRIGGERING_ACTOR: ${{ github.triggering_actor }}',
        'IN_OWNER: ${{ github.repository_owner }}',
        'IN_OWNER_TYPE: ${{ github.event.repository.owner.type }}',
      ],
    );
  }
});

test('the run-actor gate, under bash -e -o pipefail, passes the bot and admitted actors and refuses the rest', () => {
  const body = gateBody('run');
  // [actor, list, owner, owner type, passes]
  const cases = [
    ['github-actions[bot]', '', 'org', 'Organization', true],
    ['Alice', ' alice , bob,', 'owner', 'User', true],
    ['carol', 'alice, *', 'org', 'Organization', true],
    ['OWNER', '', 'owner', 'User', true],
    ['carol', 'alice,bob', 'owner', 'User', false],
    ['carol', '', 'owner', 'User', false],
    ['carol', '', 'org', 'Organization', false],
    ['owner', '', 'owner', '', false],
    ['', 'alice', 'owner', 'User', false],
  ];
  for (const [actor, list, owner, type, passes] of cases) {
    const r = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', body], {
      env: {
        ...process.env,
        [RUN_ACTORS_VARIABLE]: list,
        IN_TRIGGERING_ACTOR: actor,
        IN_OWNER: owner,
        IN_OWNER_TYPE: type,
      },
      encoding: 'utf8',
    });
    assert.equal(r.error, undefined);
    const label = `actor '${actor}', list '${list}', owner '${owner}' (${type || 'no type'})`;
    if (passes) {
      assert.equal(r.status, 0, `${label} passes: ${r.stdout}${r.stderr}`);
      assert.doesNotMatch(r.stdout, /::error::/);
    } else {
      assert.notEqual(r.status, 0, `${label} is refused`);
      assert.match(r.stdout, new RegExp(`^::error::.*${RUN_ACTORS_VARIABLE}`, 'm'), label);
    }
  }
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

/**
 * Every mapping value that opens as a plain scalar, outside a `|` / `>` block body, as
 * `{ line, value }`. A block body is every later line indented deeper than the key that opened it.
 */
function plainScalarValues(lines) {
  const out = [];
  let blockIndent = -1;
  lines.forEach((line, i) => {
    if (line.trim() === '') return;
    if (blockIndent >= 0) {
      if (indentOf(line) > blockIndent) return;
      blockIndent = -1;
    }
    if (/^\s*#/.test(line)) return;
    const m = /^\s*(?:- )*[A-Za-z0-9_.-]+:(?: +(.*))?$/.exec(line);
    if (m === null || m[1] === undefined || m[1] === '') return;
    const value = m[1];
    if (/^[|>][0-9+-]*$/.test(value)) {
      blockIndent = indentOf(line);
      return;
    }
    if (/^['"[{]/.test(value)) return;
    out.push({ line: i + 1, value });
  });
  return out;
}

for (const [file, lines] of [
  [WORKFLOW_RUN_FILE, LINES],
  [WORKFLOW_RESUME_FILE, RESUME_LINES],
  [WORKFLOW_TRIGGER_FILE, TRIGGER_LINES],
  [WORKFLOW_CONTROL_FILE, CONTROL_LINES],
]) {
  test(`${file}: no plain-scalar mapping value carries ': ' or ' #'`, () => {
    const values = plainScalarValues(lines);
    assert.ok(values.length > 0, 'the reader found plain-scalar values');
    for (const { line, value } of values) {
      assert.ok(!value.includes(': ') && !value.includes(' #'), `line ${line} is a plain scalar carrying ': ' or ' #': ${value}`);
    }
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

test('control: a created comment, a submitted review, a close or a deletion, never pull_request_target or review comments', () => {
  const on = CONTROL_LINES.indexOf('on:');
  assert.notEqual(on, -1);
  const under = blockUnder(on, CONTROL_LINES);
  const triggers = under.filter((l) => /^ {2}[a-z_]+:/.test(l)).map((l) => l.trim().replace(/:.*$/, ''));
  assert.deepEqual(triggers, ['issue_comment', 'pull_request_review', 'issues', 'pull_request', 'delete']);
  assert.deepEqual(blockUnder(CONTROL_LINES.indexOf('  delete:'), CONTROL_LINES).filter((l) => l.trim() !== ''), []);
  const typesOf = (event) => {
    const i = CONTROL_LINES.indexOf(`  ${event}:`);
    const line = blockUnder(i, CONTROL_LINES).find((l) => /^\s*types:/.test(l));
    return /types: \[(.*)\]$/.exec(line)[1].split(',').map((t) => t.trim());
  };
  assert.deepEqual(typesOf('issue_comment'), ['created']);
  assert.deepEqual(typesOf('pull_request_review'), ['submitted']);
  assert.deepEqual(typesOf('issues'), ['closed']);
  assert.deepEqual(typesOf('pull_request'), ['closed']);
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
  const at = CONTROL_LINES.flatMap((l, i) => (/^ {4}if: /.test(l) ? [i] : []));
  assert.equal(at.length, 1);
  assert.equal(CONTROL_LINES[at[0]], '    if: >-');
  assert.equal(blockUnder(at[0], CONTROL_LINES).filter((l) => l.trim() !== '').length, 1, 'one continuation line');
  const cond = CONTROL_LINES[at[0] + 1];
  assert.match(cond, /^ {6}\(/);
  assert.ok(cond.includes(`contains(github.event.comment.body, '${COMMAND_HANDLE}')`));
  assert.ok(cond.includes(`!contains(github.event.comment.body, '${COMMENT_MARKER}')`));
  assert.ok(cond.includes(`github.event.review.state == '${REVIEW_ROUND_STATE}'`));
  assert.ok(cond.includes('github.event.pull_request.head.repo.full_name == github.repository'));
  assert.ok(
    cond.includes(
      `(github.event_name == 'issues' && contains(join(github.event.issue.labels.*.name, ','), '${STATE_LABEL_PREFIX}'))`,
    ),
  );
  assert.ok(
    cond.includes(
      "(github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name == github.repository)",
    ),
  );
  assert.ok(cond.includes("(github.event_name == 'delete' && github.event.ref_type == 'branch')"));
});

test('control: the run-name never matches a harness <action> <branch> title', () => {
  assert.ok(
    CONTROL_LINES.includes(
      'run-name: harness control ${{ github.event.issue.number || github.event.pull_request.number || github.event.ref }}',
    ),
  );
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

/** The control step's inline `run:` value. */
function controlStepRun() {
  const bodies = runBodies(CONTROL_LINES).filter((b) => b.includes('remote-run.sh" control'));
  assert.equal(bodies.length, 1);
  return bodies[0];
}

test('control: the step maps a replied refusal to success and nothing else', () => {
  assert.equal(controlStepRun(), 'bash "$SCRIPTS_DIR/remote-run.sh" control || [ $? -eq 2 ]');
});

test('control: under bash -e -o pipefail the step passes on exit 0 and 2 and fails on 1, 3 and 4', () => {
  const line = controlStepRun();
  const root = mkdtempSync(join(tmpdir(), 'harness-control-step-'));
  try {
    for (const [code, passes] of [[0, true], [2, true], [1, false], [3, false], [4, false]]) {
      const dir = join(root, String(code));
      mkdirSync(dir);
      writeFileSync(join(dir, 'remote-run.sh'), `[ "$1" = control ] || exit 99\nexit ${code}\n`);
      const r = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', line], {
        env: { ...process.env, SCRIPTS_DIR: dir },
        encoding: 'utf8',
      });
      assert.equal(r.error, undefined);
      if (passes) assert.equal(r.status, 0, `exit ${code} passes the step`);
      else assert.notEqual(r.status, 0, `exit ${code} fails the step`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
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
