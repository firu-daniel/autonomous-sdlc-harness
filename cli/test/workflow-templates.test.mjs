/**
 * The `devscene-run.yml` and `devscene-resume.yml` workflow templates, read as text.
 *
 * **The contract these tests enforce.** The seven `workflow_dispatch` inputs `remote-run.sh`
 * sends, with `action`'s options exactly `run`, `pause`, `warm` and `stop`; a job only for `run`
 * and for `warm`, so `pause` and `stop` start none, except the `wrong-ref` job, which fails a `run`
 * or `pause` whose `github.ref_name` is not its `branch` input, reading both only through its step's
 * `env:`, while the `open`, `run`, `deliver` and `collect` jobs' `if:` require that ref and that input
 * to agree; `open` only when `chain` is 0, `run` `needs: open`, `deliver` `needs: run` and `collect`
 * `needs: [run, deliver]`, the last three under `!cancelled()`;
 * the `collect` job,
 * in the `harness-review-<branch>` group with `cancel-in-progress: false`, checking out the default
 * branch rather than `inputs.branch`, reading no secret and running
 * `remote-run.sh collect` alone; the `run-name` title the pause poll and
 * `continue` / `poll` match runs by; the `runs-on` line; `permissions: {}` at workflow level and
 * each job's own grants exactly — `wrong-ref` none, `open` `contents: read`, `issues` and
 * `pull-requests` `write`, `run` and `collect` `contents`, `actions`, `issues` and `pull-requests`,
 * each `write`, `deliver` `contents: read`, `actions: read`, `issues` and `pull-requests` `write`,
 * and `warm` `contents: read`; the `deliver` job's last step, `Open the pull request and report`,
 * running `remote-run.sh deliver` after `Download the state bundle`, which downloads
 * `STATE_ARTIFACT_NAME` and exits 0 with one `::notice::` line when it cannot,
 * `continue-on-error: true`, with `HARNESS_PR_TOKEN` drawn from `secrets.DEVSCENE_GIT_TOKEN`
 * through `env:`; the `open` job's last step, `Open the draft pull request`, running
 * `remote-run.sh open`, its `if:` exactly `env.HARNESS_STOPPED != '1'`, `continue-on-error: true`,
 * the same `HARNESS_PR_TOKEN` through `env:` and no expression in its `run:` line; no line of the
 * `run` job naming `DEVSCENE_GIT_TOKEN` or `HARNESS_PR_TOKEN`; the `run` job's `Store the push
 * credential outside the checkout` step right after `Set the git identity`, before `Bootstrap the
 * checkout` and `Restore the previous job's state`, and `Erase the push credential` its last step,
 * under `always()` and `continue-on-error: true`; the `open` and `deliver` checkouts the default
 * branch; the cancelled-job step calling `remote-run.sh report failed`; every GitHub
 * expression spaced after its braces and `{{cliVersion}}` the only template token, so the CLI's
 * renderer (`cli/src/core/templating.ts`) sees nothing else; no input or secret expression inside a
 * `run:` block (script injection); `continue` under `!cancelled()` and the upload and final push
 * under `always()`; the upload step's artifact name and `remote-run.sh`'s `STATE_ARTIFACT_NAME` are
 * both `cli/src/remote/githubActions.ts` → `STATE_ARTIFACT_NAME`; no configured directory frozen
 * into the file; and the `Preflight with doctor` step runs `doctor --remote-job` after the step
 * generating the job's permission profile and before the harness runs — the option spelled as
 * `cli/src/commands/doctor.ts` → `REMOTE_JOB_FLAG` declares it, which that module does not export.
 * `Push the branch` keeps its `always()` condition and turns each refusing or given-up push line into
 * an `::error::` annotation and a job-summary line, exiting 0.
 * The run-actor gate: the first step of `open`, `run`, `deliver` and `collect`, its `run:` body
 * identical in all four and no `secrets.` step of any of them before it, each job's `env:` passing `RUN_ACTORS_VARIABLE` from
 * `vars.`, each gate step's `env:` exactly `IN_TRIGGERING_ACTOR`, `IN_OWNER` and `IN_OWNER_TYPE`; and
 * the body, run under `bash -e -o pipefail`, passing `github-actions[bot]`, a listed login, `*` and the
 * owner of a user-owned repository under an empty list, and refusing every other actor with an
 * `::error::` line naming `RUN_ACTORS_VARIABLE`.
 * The job's own files: the `run` job's `Refuse a branch that changed the job's own files` step runs
 * the pinned `doctor --job-surfaces=` against the default branch, from `${{ runner.temp }}`, with no
 * `continue-on-error`, after `Set up Node` and before `Read the configuration` and every step running
 * a `$SCRIPTS_DIR` script; `Record the default branch's commit` right after it; `Read the
 * configuration` the only step writing `SCRIPTS_DIR=` to `$GITHUB_ENV`, and every `always()` /
 * `cancelled()` step gated on `env.SCRIPTS_DIR != ''`, so a refusal runs nothing from the refused
 * tree; and every step invoking `npm` or `npx` run from `${{ runner.temp }}`, each `npx` naming
 * `--cwd "$GITHUB_WORKSPACE"`.
 * No run copy: over the rendered file, no `run:` body of the `run` job names `create-worktree.sh` or
 * runs `git worktree add`, the only `git clone` is `Install the pinned plugin`'s, and `Run the
 * harness` alone runs `autonomous-watcher.sh job`, in the checkout.
 *
 * For `devscene-resume.yml`: the `schedule` and `workflow_dispatch` triggers; `permissions: {}` at workflow
 * level and the `poll` job's grants exactly `contents: read`, `actions: write`, `issues: write` and
 * `pull-requests: write`; `remote-run.sh poll` its only call into the script family;
 * `DEVSCENE_PUSH_URL` passed through `env:`; no template token at all; every GitHub expression spaced; none inside a `run:` block;
 * its state upload under `always()` named `POLL_STATE_ARTIFACT_NAME`, as `remote-run.sh` spells it.
 *
 * For `devscene-trigger.yml`: the `issues` and `repository_dispatch` triggers, `labeled` the only
 * `issues` type so `opened` never starts a second run, and `TRIGGER_DISPATCH_EVENT_TYPE` the only
 * dispatch type; `permissions: {}` at workflow level and the `trigger` job's grants exactly
 * `contents: write`, `actions: write` and `issues: write`; the
 * job's `if:` and its `TRIGGER_LABEL_VARIABLE` env line each naming `TRIGGER_LABEL_VARIABLE` with
 * `DEFAULT_TRIGGER_LABEL` as its fallback;
 * `remote-run.sh trigger` its only call into the script family; no `secrets.` reference, so the
 * credential secrets never reach the job reading issue text; no `concurrency:` key, which would drop a
 * pending trigger; no template token; every expression spaced, and none inside a `run:` block; the
 * job's `env:` passing `RUN_ACTORS_VARIABLE` from `vars.` on the line after
 * `DEVSCENE_TRIGGER_ALLOWED_BOTS`, and the `# DECLARED MIRRORS` block naming it.
 *
 * For `devscene-control.yml`: the `issue_comment`, `pull_request_review`, `issues`, `pull_request` and
 * `delete` triggers, `created`, `submitted`, `closed` and `closed` their only types, and neither
 * `pull_request_target` nor `pull_request_review_comment` outside a comment line; the `run-name`
 * falling back to the deleted ref; `permissions: {}` at workflow level and the `control` job's grants
 * exactly `contents`, `actions`, `issues` and `pull-requests`, each `write`; the job's `if:` exactly `if: >-`, its condition on the one
 * continuation line beneath, because the condition carries `: ` and a plain scalar would read that
 * as a mapping indicator and leave the file unparseable; no plain-scalar mapping value carrying `: `
 * or ` #` (the header's third rule, checked in all four files below); the condition carrying
 * `COMMAND_HANDLE`, `COMMENT_MARKER`, `REVIEW_ROUND_STATE` and `STATE_LABEL_PREFIX`, comparing the head repository with
 * `github.repository` for a review and a closed pull request, so a fork's is skipped, and admitting a
 * deleted ref only when it is a branch; the checkout's `ref` the default branch, never the pull
 * request's merge commit; `remote-run.sh control` its only call into the script family, made twice:
 * once as `control --needs-agent` by the `needs` step, whose body, run under `bash -e -o pipefail`,
 * passes on every exit and writes `agent=no` to `$GITHUB_OUTPUT` for exit 2 alone, and once by the
 * act step, ending `|| [ $? -eq 2 ]` so that, run under `bash -e -o pipefail`, a replied refusal (exit 2)
 * passes and 1, 3 and 4 fail; `secrets.` on exactly two lines, the act step's `IN_OAUTH` and
 * `IN_API`, each the empty string unless the event is `issue_comment` and neither at job level;
 * the `needs` step, `if: github.event_name == 'issue_comment'` and `continue-on-error: true`, before
 * `Set up Node`, `Install the claude CLI when absent` and `Fetch the pinned plugin`, which come before
 * the act step, each `if: github.event_name == 'issue_comment' && steps.needs.outputs.agent != 'no'`
 * and `continue-on-error: true`, the last
 * reading `CLI_VERSION_VARIABLE` from `devscene-run.yml`, cloning the release-tag prefix that file's
 * `Install the pinned plugin` step clones, and writing `HARNESS_MENTION_PLUGIN_DIR` to
 * `$GITHUB_ENV`; one `concurrency:` group on the job,
 * `harness-review-` plus the head ref for a review and the run's own id for a comment, with
 * `cancel-in-progress: false`, so review jobs on one branch run one at a time and no comment job is
 * ever replaced; no template token; every expression spaced, and none inside a `run:` block; the
 * job's `env:` passing `RUN_ACTORS_VARIABLE` from `vars.` on the line after
 * `DEVSCENE_TRIGGER_ALLOWED_BOTS`, and the `# DECLARED MIRRORS` block naming it.
 *
 * For all four: every `uses:` value names `<owner>/<repo>[/<path>]@` a 40-hex commit, never a tag or a
 * branch, with `# <action> v<major>.<minor>.<patch>` on the line directly above it, naming the same
 * action; the `# ACTION PINS.` header names exactly the set of those action-and-version pairs, so a pin
 * the file dropped or a bump the header forgot fails. The checkout credential: `persist-credentials:
 * false` on exactly the checkouts `CREDENTIAL_SHAPES` lists unpersisted — `devscene-run.yml`'s `run`
 * and `warm` — every other checkout keeping it because its job pushes or fetches with it or, for
 * `poll`, runs `git ls-remote` against origin, and a `# THE CHECKOUT CREDENTIAL.` block
 * (`# THE CHECKOUT.` in `devscene-trigger.yml`) naming why; and no `actions/upload-artifact` step
 * carrying `.git/config` off the runner — `devscene-run.yml`'s path under `${{ runner.temp }}`,
 * `devscene-resume.yml`'s exactly `POLL_STATE_DIR`, a state-directory subpath, and none in the other two.
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

import { MAIN_REPO_ANCHOR_VARIABLE } from '../dist/core/mainRepoAnchor.js';
import { renderTemplate } from '../dist/core/templating.js';
import { PACKAGE_ROOT } from './helpers/fixture.mjs';
import {
  API_KEY_SECRET,
  CLI_VERSION_VARIABLE,
  COMMAND_HANDLE,
  COMMENT_MARKER,
  DEFAULT_TRIGGER_LABEL,
  OAUTH_TOKEN_SECRET,
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
    "if: inputs.action == 'run' && github.ref_name == inputs.branch && inputs.chain == 0",
    "if: ${{ !cancelled() && inputs.action == 'run' && github.ref_name == inputs.branch }}",
    "if: ${{ inputs.action == 'run' && !cancelled() && github.ref_name == inputs.branch }}",
    "if: ${{ inputs.action == 'run' && !cancelled() && github.ref_name == inputs.branch }}",
    "if: inputs.action == 'warm'",
  ]);
});

test('the wrong-ref job reads the ref and the branch through env and fails, naming the ref to use', () => {
  const start = LINES.indexOf('  wrong-ref:');
  assert.notEqual(start, -1, 'devscene-run.yml carries a wrong-ref job');
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
  assert.notEqual(start, -1, 'devscene-run.yml carries a collect job');
  const block = blockUnder(start);
  const text = block.join('\n');
  assert.ok(block.includes('    needs: [run, deliver]'), text);
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
function jobStart(job, lines = LINES) {
  const start = lines.indexOf(`  ${job}:`, lines.indexOf('jobs:'));
  assert.notEqual(start, -1, `the workflow carries a ${job} job`);
  return start;
}

/** The job names under `jobs:`, in file order. */
function jobNames(lines) {
  return lines
    .slice(lines.indexOf('jobs:') + 1)
    .flatMap((l) => /^ {2}([a-z][a-z0-9_-]*):$/.exec(l)?.slice(1) ?? []);
}

/** One job's `permissions:` grants, trimmed; an inline value, `{}`, as its one entry. */
function jobPermissions(job, lines) {
  const block = blockUnder(jobStart(job, lines), lines);
  const at = block.findIndex((l) => /^ {4}permissions:/.test(l));
  assert.notEqual(at, -1, `the ${job} job declares permissions:`);
  const inline = /^ {4}permissions: (.+)$/.exec(block[at]);
  if (inline !== null) return [inline[1]];
  return blockUnder(at, block).filter((l) => l.trim() !== '').map((l) => l.trim());
}

/**
 * Asserts `permissions: {}` is the file's only workflow-level permissions line, that `expected`
 * names every job in file order, and that each job's grants are exactly its entry.
 */
function assertPermissions(lines, expected) {
  assert.deepEqual(lines.filter((l) => /^permissions:/.test(l)), ['permissions: {}']);
  assert.deepEqual(jobNames(lines), Object.keys(expected));
  for (const [job, grants] of Object.entries(expected)) {
    assert.deepEqual(jobPermissions(job, lines), grants, `the ${job} job's permissions`);
  }
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
  open: `Refuse an actor not on ${RUN_ACTORS_VARIABLE} before opening`,
  run: `Refuse an actor not on ${RUN_ACTORS_VARIABLE}`,
  deliver: `Refuse an actor not on ${RUN_ACTORS_VARIABLE} before delivering`,
  collect: `Refuse an actor not on ${RUN_ACTORS_VARIABLE} before collecting`,
};
const GATED_JOBS = Object.keys(GATE_STEPS);

function gateBody(job) {
  const [first] = jobSteps(job);
  assert.equal(first[0].trim(), `- name: ${GATE_STEPS[job]}`, `the gate is the ${job} job's first step`);
  const bodies = runBodies(first);
  assert.equal(bodies.length, 1);
  return bodies[0];
}

test('the run-actor gate is the first step of open, run, deliver and collect, identical in all four, before any secret', () => {
  for (const job of GATED_JOBS) assert.equal(gateBody(job), gateBody('run'), `the ${job} job's gate is run's, byte for byte`);
  assert.ok(!gateBody('run').includes('${{'), 'no expression inside the gate body');
  assert.ok(
    gateBody('run').includes('docs/remote-execution.md, section 7 step 4, and section 11'),
    'the refusal points at the allow-list setup and the security section',
  );
  assert.ok(!gateBody('run').includes('section 9'), 'the refusal no longer points at section 9');
  for (const job of ['open', 'run', 'deliver']) {
    const firstSecret = jobSteps(job).findIndex((s) => s.join('\n').includes('secrets.'));
    assert.ok(firstSecret > 0, `no step of ${job} reading a secret comes before the gate`);
  }
});

test('the run-actor gate reads the list from vars and the actor and owner through its own env', () => {
  for (const job of GATED_JOBS) {
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
        [MAIN_REPO_ANCHOR_VARIABLE]: '',
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

/**
 * Asserts a workflow's job passes `RUN_ACTORS_VARIABLE` from `vars.` on the line right after its
 * `DEVSCENE_TRIGGER_ALLOWED_BOTS` env line, and that its `# DECLARED MIRRORS` block names it.
 */
function assertPassesRunActors(file, lines) {
  const bots = lines.findIndex((l) => /^ {6}DEVSCENE_TRIGGER_ALLOWED_BOTS: /.test(l));
  assert.notEqual(bots, -1, `${file} passes DEVSCENE_TRIGGER_ALLOWED_BOTS`);
  assert.equal(lines[bots + 1], `      ${RUN_ACTORS_VARIABLE}: \${{ vars.${RUN_ACTORS_VARIABLE} }}`, file);
  const start = lines.findIndex((l) => l.startsWith('# DECLARED MIRRORS'));
  assert.notEqual(start, -1, `${file} carries a DECLARED MIRRORS block`);
  const end = lines.findIndex((l, i) => i > start && l.trim() === '#');
  assert.ok(end > start, `${file}'s DECLARED MIRRORS block ends`);
  assert.ok(
    lines.slice(start, end).some((l) => new RegExp(`\\b${RUN_ACTORS_VARIABLE}\\b`).test(l)),
    `${file}'s DECLARED MIRRORS block names ${RUN_ACTORS_VARIABLE}`,
  );
}

test('the trigger job passes the run-actor allow-list from vars, and declares it a mirror', () => {
  assertPassesRunActors(WORKFLOW_TRIGGER_FILE, TRIGGER_LINES);
});

test('the control job passes the run-actor allow-list from vars, and declares it a mirror', () => {
  assertPassesRunActors(WORKFLOW_CONTROL_FILE, CONTROL_LINES);
});

test('the run-name title, the runner line and the permissions', () => {
  assert.ok(LINES.includes('run-name: devscene ${{ inputs.action }} ${{ inputs.branch }}'));
  for (const line of LINES.filter((l) => /^\s*runs-on:/.test(l))) {
    assert.equal(line.trim(), "runs-on: ${{ vars.DEVSCENE_RUNNER || 'ubuntu-latest' }}");
  }
  const pushing = ['contents: write', 'actions: write', 'issues: write', 'pull-requests: write'];
  assertPermissions(LINES, {
    'wrong-ref': ['{}'],
    open: ['contents: read', 'issues: write', 'pull-requests: write'],
    run: pushing,
    deliver: ['contents: read', 'actions: read', 'issues: write', 'pull-requests: write'],
    collect: pushing,
    warm: ['contents: read'],
  });
});

/** One job's steps with their names, and a lookup that fails on a missing name. */
function namedJobSteps(job) {
  const list = jobSteps(job);
  const names = list.map((s) => /- name: (.*)$/.exec(s[0])[1]);
  const at = (name) => {
    const i = names.indexOf(name);
    assert.notEqual(i, -1, `the ${job} job has a step named ${name}`);
    return i;
  };
  return { list, names, at };
}

/** One job's own top-level `<key>:` value, or `undefined` when the job does not set it. */
function jobKey(job, key) {
  const line = blockUnder(jobStart(job)).find((l) => indentOf(l) === 4 && l.trim().startsWith(`${key}:`));
  return line === undefined ? undefined : line.trim().slice(key.length + 1).trim();
}

test('the deliver job opens the pull request and reports as its last step, after the bundle download, never failing the job', () => {
  const { list, names, at } = namedJobSteps('deliver');
  const deliver = at('Open the pull request and report');
  assert.equal(deliver, list.length - 1, 'the report is the deliver job\'s last step');
  assert.equal(at('Download the state bundle') + 1, deliver, 'the bundle is downloaded right before the report');
  assert.ok(!jobSteps('run').some((s) => s[0].includes('Open the pull request and report')), 'the run job no longer reports');
  const step = list[deliver].join('\n');
  assert.equal(ifOf(step), "env.HARNESS_STOPPED != '1'");
  assert.match(step, /^\s*continue-on-error: true$/m);
  assert.match(step, /^\s*HARNESS_PR_TOKEN: \$\{\{ secrets\.DEVSCENE_GIT_TOKEN \}\}$/m);
  const [body] = runBodies(list[deliver]);
  assert.equal(body, 'bash "$SCRIPTS_DIR/remote-run.sh" deliver "$HARNESS_INPUT_BRANCH" "$RUNNER_TEMP/harness-state"');
  assert.deepEqual(names.slice(0, 2), [GATE_STEPS.deliver, 'Stop when DEVSCENE_REMOTE_STOP is set before delivering']);
});

test('the deliver job downloads STATE_ARTIFACT_NAME, and a missing bundle is one notice and exit 0', () => {
  const { list, at } = namedJobSteps('deliver');
  const step = list[at('Download the state bundle')];
  const body = dedent(runBodies(step)[0]);
  assert.ok(
    body.includes(`gh run download "$GITHUB_RUN_ID" --name ${STATE_ARTIFACT_NAME} --dir "$RUNNER_TEMP/harness-state"`),
    body,
  );
  for (const [code, notices] of [[0, 0], [1, 1]]) {
    const dir = mkdtempSync(join(tmpdir(), 'deliver-download-'));
    try {
      const bin = join(dir, 'bin');
      mkdirSync(bin);
      writeFileSync(join(bin, 'gh'), `#!/bin/sh\nexit ${code}\n`, { mode: 0o755 });
      const r = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', body], {
        env: { ...process.env, [MAIN_REPO_ANCHOR_VARIABLE]: '', PATH: `${bin}:${process.env.PATH}`, RUNNER_TEMP: dir, GITHUB_RUN_ID: '1' },
        encoding: 'utf8',
      });
      assert.equal(r.error, undefined);
      assert.equal(r.status, 0, `gh exiting ${code}: ${r.stdout}${r.stderr}`);
      assert.equal(r.stdout.split('\n').filter((l) => l.startsWith('::notice::')).length, notices, r.stdout);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

test('the open job opens the draft pull request only in a person-started job, before run, never failing the job', () => {
  const { list, names, at } = namedJobSteps('open');
  const open = at('Open the draft pull request');
  assert.equal(open, list.length - 1, 'the open step is the open job\'s last step');
  assert.ok(!jobSteps('run').some((s) => s[0].includes('Open the draft pull request')), 'the run job no longer opens');
  assert.equal(jobKey('open', 'if'), "inputs.action == 'run' && github.ref_name == inputs.branch && inputs.chain == 0");
  const step = list[open].join('\n');
  assert.equal(ifOf(step), "env.HARNESS_STOPPED != '1'");
  assert.match(step, /^\s*continue-on-error: true$/m);
  assert.match(step, /^\s*HARNESS_PR_TOKEN: \$\{\{ secrets\.DEVSCENE_GIT_TOKEN \}\}$/m);
  const [body] = runBodies(list[open]);
  assert.equal(body, 'bash "$SCRIPTS_DIR/remote-run.sh" open "$HARNESS_INPUT_BRANCH"');
  assert.deepEqual(names.slice(0, 2), [GATE_STEPS.open, 'Stop when DEVSCENE_REMOTE_STOP is set before opening']);
});

test('open and deliver gate every step after the stop check on it, and share one job-level env', () => {
  for (const job of ['open', 'deliver']) {
    const { list, names } = namedJobSteps(job);
    list.slice(2).forEach((s, i) => assert.equal(ifOf(s.join('\n')), "env.HARNESS_STOPPED != '1'", `${job}: ${names[i + 2]}`));
  }
  assert.deepEqual(jobEnv('deliver'), jobEnv('open'));
  assert.deepEqual(jobEnv('open'), [
    'GH_TOKEN: ${{ github.token }}',
    'HARNESS_REMOTE_SLUG: ${{ github.repository }}',
    'HARNESS_INPUT_BRANCH: ${{ inputs.branch }}',
    'DEVSCENE_REMOTE_STOP: ${{ vars.DEVSCENE_REMOTE_STOP }}',
    `${RUN_ACTORS_VARIABLE}: \${{ vars.${RUN_ACTORS_VARIABLE} }}`,
  ]);
});

// The rule: the job that runs the agent never references DEVSCENE_GIT_TOKEN, so no step of it can
// hand that token to the session or write it into the checkout.
test('no line of the run job names DEVSCENE_GIT_TOKEN or HARNESS_PR_TOKEN', () => {
  const block = blockUnder(jobStart('run'));
  assert.ok(block.length > 0);
  for (const line of block) assert.doesNotMatch(line, /DEVSCENE_GIT_TOKEN|HARNESS_PR_TOKEN/, line);
});

test('the run job stores its push credential before anything reaches origin and erases it last', () => {
  const { list, at } = namedJobSteps('run');
  const store = at('Store the push credential outside the checkout');
  assert.equal(store, at('Set the git identity') + 1, 'the credential is stored right after the git identity');
  for (const later of ["Restore the previous job's state", 'Bootstrap the checkout', 'Run DevScene', 'Push the branch']) {
    assert.ok(store < at(later), `the store precedes ${later}`);
  }
  assert.equal(ifOf(list[store].join('\n')), "env.HARNESS_STOPPED != '1'");
  assert.deepEqual(runBodies(list[store]), ['bash "$SCRIPTS_DIR/remote-run.sh" push-credential store']);

  const erase = at('Erase the push credential');
  assert.equal(erase, list.length - 1, 'the erase is the run job\'s last step');
  for (const earlier of ['Push the branch', 'Save the state bundle', 'Upload the state bundle', 'Continue, wait or stop', 'Notify a cancelled job']) {
    assert.ok(at(earlier) < erase, `${earlier} precedes the erase`);
  }
  assert.equal(ifOf(list[erase].join('\n')), "always() && env.SCRIPTS_DIR != ''");
  assert.equal(stepKey(list[erase], 'continue-on-error'), 'true');
  assert.deepEqual(runBodies(list[erase]), ['bash "$SCRIPTS_DIR/remote-run.sh" push-credential erase']);
});

test('run needs open, deliver needs run, and collect needs run and deliver', () => {
  assert.equal(jobKey('run', 'needs'), 'open');
  assert.match(jobKey('run', 'if'), /!cancelled\(\)/, 'a skipped open does not skip run');
  assert.equal(jobKey('deliver', 'needs'), 'run');
  assert.match(jobKey('deliver', 'if'), /!cancelled\(\)/);
  assert.equal(jobKey('collect', 'needs'), '[run, deliver]');
});

test('the open and deliver jobs check out the default branch with the job token', () => {
  for (const job of ['open', 'deliver']) {
    const block = blockUnder(jobStart(job));
    assert.deepEqual(
      block.filter((l) => /^\s+(ref|token): /.test(l)).map((l) => l.trim()),
      ['ref: ${{ github.event.repository.default_branch }}', 'token: ${{ github.token }}'],
      `the ${job} checkout`,
    );
  }
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

// The rule: a job whose watcher was killed with its session still hands `Push the branch` a
// checkout with no recorded placeholder leftover, and the sweep never fails the job.
test('the placeholder sweep runs under always(), never failing the job, directly before Push the branch', () => {
  const { list, at } = runJobSteps();
  const sweep = at('Sweep the sandbox placeholders');
  assert.equal(sweep + 1, at('Push the branch'), 'the sweep is the step immediately before the push');
  const step = list[sweep];
  const cond = ifOf(step.join('\n'));
  assert.ok(cond.includes('always()'), cond);
  assert.ok(cond.includes("env.SCRIPTS_DIR != ''"), cond);
  assert.equal(stepKey(step, 'continue-on-error'), 'true');
  assert.deepEqual(runBodies(step), [
    'HARNESS_JOB_MODE=1 bash "$SCRIPTS_DIR/autonomous-watcher.sh" job-sweep "$HARNESS_INPUT_BRANCH"',
  ]);
});

// The rule: push-branch.sh exits 0 on every path, so a refused or given-up push reaches the run
// page only as an annotation, and the step never fails the job.
test('Push the branch annotates a refusal or a given-up push, and never fails the job', () => {
  const body = dedent(runBodies(stepCarrying('push-branch.sh').split('\n'))[0]);
  const refusal = 'push-branch.sh: refusing to push: /w/.git/config.worktree sets core.sparsecheckout, which a sandboxed command can write';
  // [stub line, annotated]
  const cases = [
    [refusal, true],
    ['push-branch.sh: push failed for feat_x after 3 attempts (see output above)', true],
    ['push-branch.sh: pushed feat_x to origin', false],
    ['push-branch.sh: push failed for feat_x (attempt 1 of 3); retrying in 5s', false],
    ['push-branch.sh: refusing to push: 100% of /w/.git/config', true],
  ];
  for (const [line, annotated] of cases) {
    const dir = mkdtempSync(join(tmpdir(), 'push-step-'));
    try {
      const scripts = join(dir, 'scripts');
      const temp = join(dir, 'temp');
      mkdirSync(scripts);
      mkdirSync(temp);
      writeFileSync(join(scripts, 'push-branch.sh'), `printf '%s\\n' '${line}'\nexit 0\n`);
      const summary = join(dir, 'summary.md');
      const r = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', body], {
        env: {
          ...process.env,
          [MAIN_REPO_ANCHOR_VARIABLE]: '',
          SCRIPTS_DIR: scripts,
          RUNNER_TEMP: temp,
          GITHUB_STEP_SUMMARY: summary,
        },
        encoding: 'utf8',
      });
      assert.equal(r.error, undefined);
      assert.equal(r.status, 0, `${line}: ${r.stdout}${r.stderr}`);
      assert.ok(r.stdout.split('\n').includes(line), `the wrapper's line is printed: ${line}`);
      const errors = r.stdout.split('\n').filter((l) => l.startsWith('::error'));
      if (annotated) {
        assert.deepEqual(errors, [`::error title=Push the branch::${line.replaceAll('%', '%25')}`]);
        const written = readFileSync(summary, 'utf8');
        assert.ok(written.includes('### Push the branch'), written);
        assert.ok(written.includes(line), written);
      } else {
        assert.deepEqual(errors, [], line);
        assert.throws(() => readFileSync(summary, 'utf8'), { code: 'ENOENT' }, `no summary for ${line}`);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
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
  assert.ok(preflight < at('Run DevScene'));
  const [body] = runBodies(steps()[preflight].split('\n'));
  assert.equal(body, 'npx --yes "devscene@$DEVSCENE_CLI_VERSION" doctor --cwd "$GITHUB_WORKSPACE" --remote-job');
});

/** A step's own top-level `<key>:` value, or `undefined` when the step does not set it. */
function stepKey(step, key) {
  const indent = step[1] === undefined ? 0 : indentOf(step[1]);
  const line = step.slice(1).find((l) => indentOf(l) === indent && l.trim().startsWith(`${key}:`));
  return line === undefined ? undefined : line.trim().slice(key.length + 1).trim();
}

/** A `run:` body with its common leading indentation removed. */
function dedent(body) {
  const lines = body.split('\n').filter((l) => l.trim() !== '');
  const base = Math.min(...lines.map(indentOf));
  return lines.map((l) => l.slice(base)).join('\n');
}

const REFUSAL_STEP = "Refuse a branch that changed the job's own files";
const RECORD_STEP = "Record the default branch's commit";
const REFUSAL_BODY = [
  'npx --yes "devscene@$DEVSCENE_CLI_VERSION" doctor --cwd "$GITHUB_WORKSPACE" --job-surfaces="$HARNESS_GITHUB_DEFAULT_BRANCH" \\',
  '  || { echo "::error::this branch\'s own commits changed files the job runs or loads, named in this step\'s doctor report; nothing from it runs in this job."; exit 1; }',
].join('\n');
const RECORD_BODY = [
  'sha=$(git -C "$GITHUB_WORKSPACE" rev-parse --verify --quiet "refs/remotes/origin/$HARNESS_GITHUB_DEFAULT_BRANCH^{commit}") || { echo "::error::cannot read the default branch\'s commit from the job\'s fresh checkout; nothing from this branch runs in this job."; exit 1; }',
  'echo "HARNESS_GITHUB_DEFAULT_COMMIT=$sha" >> "$GITHUB_ENV"',
  'default_branch=$(git -C "$GITHUB_WORKSPACE" show "$sha:devscene.config.json" | jq -r \'.defaultBranch // empty\') && [ -n "$default_branch" ] || { echo "::error::cannot read defaultBranch from the default branch\'s devscene.config.json; nothing from this branch runs in this job."; exit 1; }',
  'base=$(git -C "$GITHUB_WORKSPACE" rev-parse --verify --quiet "refs/remotes/origin/$default_branch^{commit}") || { echo "::error::cannot read origin/$default_branch\'s commit from the job\'s fresh checkout; nothing from this branch runs in this job."; exit 1; }',
  'echo "HARNESS_DEFAULT_BRANCH_COMMIT=$base" >> "$GITHUB_ENV"',
].join('\n');

/** The `run` job's steps with their names, and a lookup that fails on a missing name. */
function runJobSteps() {
  const list = jobSteps('run');
  const names = list.map((s) => /- name: (.*)$/.exec(s[0])[1]);
  const at = (name) => {
    const i = names.indexOf(name);
    assert.notEqual(i, -1, `the run job has a step named ${name}`);
    return i;
  };
  return { list, names, at };
}

test("the job's own files: the pinned doctor --job-surfaces refuses the branch from $RUNNER_TEMP before anything runs from it", () => {
  const { list, at } = runJobSteps();
  const refusal = at(REFUSAL_STEP);
  const step = list[refusal];
  assert.deepEqual(runBodies(step).map(dedent), [REFUSAL_BODY]);
  assert.equal(ifOf(step.join('\n')), "env.HARNESS_STOPPED != '1'");
  assert.equal(stepKey(step, 'working-directory'), '${{ runner.temp }}');
  assert.equal(stepKey(step, 'continue-on-error'), undefined, 'the refusal never lets the job go on');

  assert.ok(at('Set up Node') < refusal, 'npx exists by the time the refusal runs');
  for (const later of ['Read the configuration', 'Install the pinned plugin', "Generate the job's permission profile", 'Bootstrap the checkout']) {
    assert.ok(refusal < at(later), `the refusal precedes ${later}`);
  }
  list.forEach((s, i) => {
    if (runBodies(s).some((b) => b.includes('$SCRIPTS_DIR'))) assert.ok(refusal < i, `the refusal precedes ${s[0].trim()}`);
  });

  assert.ok(
    jobEnv('run').includes('HARNESS_GITHUB_DEFAULT_BRANCH: ${{ github.event.repository.default_branch }}'),
    'the run job passes the default branch through env',
  );

  const record = at(RECORD_STEP);
  assert.deepEqual(runBodies(list[record]).map(dedent), [RECORD_BODY]);
  assert.equal(ifOf(list[record].join('\n')), "env.HARNESS_STOPPED != '1'");
  assert.equal(stepKey(list[record], 'continue-on-error'), undefined);
  assert.equal(record, refusal + 1, 'the commit is recorded right after the refusal');
  assert.ok(record < at('Read the configuration'), 'the commit is recorded before SCRIPTS_DIR is set');
  const baseWriters = list.flatMap((s, i) =>
    runBodies(s).some((b) => b.includes('HARNESS_DEFAULT_BRANCH_COMMIT=')) ? [i] : [],
  );
  assert.deepEqual(baseWriters, [record], 'only the record step writes HARNESS_DEFAULT_BRANCH_COMMIT');

  for (const body of runBodies(blockUnder(jobStart('run')))) assert.ok(!body.includes('${{'), `expression in run: ${body}`);
});

test('on the refusal path no post-session step runs a $SCRIPTS_DIR script: only Read the configuration sets it, after the refusal', () => {
  const { list, names, at } = runJobSteps();
  const refusal = at(REFUSAL_STEP);
  const writers = list.flatMap((s, i) =>
    runBodies(s).some((b) => b.includes('SCRIPTS_DIR=') && b.includes('$GITHUB_ENV')) ? [names[i]] : [],
  );
  assert.deepEqual(writers, ['Read the configuration']);
  const config = at('Read the configuration');
  assert.equal(ifOf(list[config].join('\n')), "env.HARNESS_STOPPED != '1'", 'implicit success(): skipped after a failed step');
  assert.ok(refusal < config, 'SCRIPTS_DIR is set only after the refusal passed');
  list.forEach((s, i) => {
    const cond = ifOf(s.join('\n'));
    const unconditional = /always\(\)|cancelled\(\)/.test(cond);
    if (unconditional) assert.ok(cond.includes("env.SCRIPTS_DIR != ''"), `${names[i]} runs after a failure only when SCRIPTS_DIR is set`);
    const code = s.slice(1).filter((l) => !/^\s*#/.test(l)).join('\n');
    if (!unconditional && code.includes('SCRIPTS_DIR')) assert.ok(refusal < i, `${names[i]} names SCRIPTS_DIR and runs after the refusal`);
  });
});

test('no run-job step runs npm or npx in the checkout: each runs from $RUNNER_TEMP and names it with --cwd', () => {
  const { list, names } = runJobSteps();
  let invoking = 0;
  list.forEach((s, i) => {
    // An invocation opens its line; an `npx …` quoted inside a message is a remedy for a person.
    const calls = runBodies(s).flatMap((b) => b.split('\n')).filter((l) => /^\s*(?:npx|npm) /.test(l));
    if (calls.length === 0) return;
    invoking++;
    assert.equal(stepKey(s, 'working-directory'), '${{ runner.temp }}', `${names[i]} runs npm or npx outside the checkout`);
    for (const line of calls.filter((l) => /^\s*npx /.test(l))) {
      assert.ok(line.includes('--cwd "$GITHUB_WORKSPACE"'), `${names[i]} names the checkout: ${line.trim()}`);
    }
  });
  assert.equal(invoking, 4, 'the refusal, the claude CLI install, the profile and the preflight');
});

// RED ONCE, each mutation of devscene-run.yml run once, observed failing as recorded, and reverted:
//   the refusal step moved below `Install the pinned plugin`  -> the first case's order assertion fails (and the second case's)
//   the refusal step moved to right after `Read the configuration` -> the second case's "after the refusal" fails (and the first case's order)
//   `&& env.SCRIPTS_DIR != ''` dropped from `Push the branch`'s if: -> the second case's always() assertion fails
//   `continue-on-error: true` added to the refusal step       -> the first case's continue-on-error assertion fails
//   `echo "SCRIPTS_DIR=scripts" >> "$GITHUB_ENV"` added to `Check for jq and gh` -> the second case's one-writer assertion fails
//   `working-directory` dropped from the refusal step          -> the first case's working-directory assertion and the third case fail
//   `working-directory` dropped from `Preflight with doctor`  -> the third case fails
//   `--cwd "$GITHUB_WORKSPACE"` dropped from `Generate the job's permission profile` -> the third case's --cwd assertion fails
//   `Record the default branch's commit` moved below `Read the configuration` -> the first case's record-step order assertion fails

const PLUGIN_STEP = 'Install the pinned plugin';
const WATCHER_JOB_CALL = /autonomous-watcher\.sh" job /;
const GIT_CLONE = /\bgit(?:\s+-[cC]\s+\S+)*\s+clone\b/;
const GIT_WORKTREE_ADD = /\bgit(?:\s+-[cC]\s+\S+)*\s+worktree\s+add\b/;

/** Throws unless every `run:` body of `text`'s `run` job leaves the job's checkout the only working copy. */
function assertRunJobCutsNoCopy(text) {
  const lines = text.split('\n');
  const job = blockUnder(jobStart('run', lines), lines);
  assert.ok(!job.some((l) => /^ {4}defaults:/.test(l)), 'the run job sets no default working directory');
  const list = job.flatMap((line, i) => (/^\s*- name: /.test(line) ? [[line, ...blockUnder(i, job)]] : []));
  const cloning = [];
  const watching = [];
  for (const step of list) {
    const name = /- name: (.*)$/.exec(step[0])[1];
    const body = runBodies(step).flatMap((b) => b.split('\n'));
    for (const line of body) {
      assert.ok(!line.includes('create-worktree.sh'), `${name} names create-worktree.sh: ${line.trim()}`);
      assert.doesNotMatch(line, GIT_WORKTREE_ADD, `${name} runs git worktree add`);
    }
    const code = body.filter((l) => !/^\s*#/.test(l));
    if (code.some((l) => GIT_CLONE.test(l))) cloning.push(name);
    const calls = code.filter((l) => WATCHER_JOB_CALL.test(l));
    if (calls.length === 0) continue;
    watching.push(name);
    assert.equal(stepKey(step, 'working-directory'), undefined, `${name} runs the watcher in the step's default directory, the checkout`);
    assert.ok(!code.some((l) => /(^|[;&|]\s*)cd\s/.test(l.trim())), `${name} changes no directory before the watcher`);
    for (const call of calls) {
      if (call.includes('--cwd')) assert.ok(call.includes('--cwd "$GITHUB_WORKSPACE"'), `${name} names the checkout: ${call.trim()}`);
    }
  }
  assert.deepEqual(cloning, [PLUGIN_STEP], 'the only git clone is the marketplace checkout');
  assert.deepEqual(watching, ['Run DevScene'], 'one step runs the watcher in job mode');
}

const RENDERED = renderTemplate(
  TEXT,
  { cliVersion: '0.0.0-test' },
  { describe: `the workflow template ${WORKFLOW_RUN_FILE}`, assertNoneSurvive: true },
);

// The rule: job mode treats the job's own checkout as the main checkout and the run's working
// copy, so the `run` job cuts no run copy. Fails when a `run` job step creates a worktree or a
// clone other than the marketplace one, or runs the watcher anywhere but the checkout.
test('the run job cuts no run copy: the watcher runs in job mode in the checkout, and the only clone is the plugin\'s', () => {
  assertRunJobCutsNoCopy(RENDERED);
});

test('the no-copy assertion fails on a rendered file whose run job calls create-worktree.sh', () => {
  const mutated = RENDERED.replace(
    /^( *)(bash "\$SCRIPTS_DIR\/autonomous-watcher\.sh" job )/m,
    (_, indent, call) => `${indent}bash "$SCRIPTS_DIR/create-worktree.sh"\n${indent}${call}`,
  );
  assert.notEqual(mutated, RENDERED, 'the perturbation landed');
  assert.throws(() => assertRunJobCutsNoCopy(mutated), /Run DevScene names create-worktree\.sh/);
});

test('no configured directory is frozen into the file', () => {
  assert.doesNotMatch(TEXT, /(^|[^A-Za-z0-9_])scripts\//m);
  // A segment of its own, and not the machine cache path's `$HOME/.cache}/devscene/`, which shares
  // the state dir's default spelling without being it.
  assert.doesNotMatch(TEXT, /(?<!\.cache\}\/)(?<![A-Za-z0-9_-])devscene\//m);
});

test('the poller: a schedule, a hand trigger, and exactly its four permissions', () => {
  const on = RESUME_LINES.indexOf('on:');
  assert.notEqual(on, -1);
  const under = blockUnder(on, RESUME_LINES);
  const triggers = under.filter((l) => /^ {2}[a-z_]+:/.test(l)).map((l) => l.trim().replace(/:.*$/, ''));
  assert.deepEqual(triggers, ['schedule', 'workflow_dispatch']);
  assert.match(under.join('\n'), /^\s*- cron: '[^']+'$/m);
  assertPermissions(RESUME_LINES, {
    poll: ['contents: read', 'actions: write', 'issues: write', 'pull-requests: write'],
  });
});

test('the poller runs remote-run.sh poll and nothing else of the family', () => {
  const calls = runBodies(RESUME_LINES).flatMap((body) =>
    [...body.matchAll(/([A-Za-z0-9_-]+\.sh)"?\s+(\S*)/g)].map((m) => `${m[1]} ${m[2]}`),
  );
  assert.deepEqual(calls, ['remote-run.sh poll']);
});

test('the poller passes the push secret through env, so its failed notice can be delivered', () => {
  assert.match(RESUME_TEXT, /^ {6}DEVSCENE_PUSH_URL: \$\{\{ secrets\.DEVSCENE_PUSH_URL \}\}$/m);
});

/** The `#   <action>   v<x.y.z>` lines under `# ACTION PINS.`, as `<action> v<x.y.z>`, up to a bare `#` or a line of prose. */
function actionPins(lines) {
  const start = lines.indexOf('# ACTION PINS.');
  assert.notEqual(start, -1, 'the header carries an ACTION PINS block');
  const pins = [];
  for (let i = start + 1; i < lines.length; i++) {
    const m = /^# {3}(\S+) +(v\d+\.\d+\.\d+)$/.exec(lines[i]);
    if (m === null) break;
    pins.push(`${m[1]} ${m[2]}`);
  }
  return pins;
}

/** Every `uses:` line, as `{ at, value, above }`: its index, its value and the line directly above it. */
const usesLines = (lines) =>
  lines.flatMap((l, at) => {
    const m = /^\s*(?:- )?uses:\s*(\S+)\s*$/.exec(l);
    return m === null ? [] : [{ at, value: m[1], above: lines[at - 1] }];
  });

const VERSION_COMMENT = /^\s*# (\S+) (v\d+\.\d+\.\d+)$/;

for (const [file, lines] of [
  [WORKFLOW_RUN_FILE, LINES],
  [WORKFLOW_RESUME_FILE, RESUME_LINES],
  [WORKFLOW_TRIGGER_FILE, TRIGGER_LINES],
  [WORKFLOW_CONTROL_FILE, CONTROL_LINES],
]) {
  test(`${file}: every action is pinned to a commit, its release version on the line above`, () => {
    const uses = usesLines(lines);
    assert.ok(uses.length > 0, 'the file carries a uses: line');
    for (const { at, value, above } of uses) {
      assert.match(value, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_./-]+)?@[0-9a-f]{40}$/, `line ${at + 1}`);
      const m = VERSION_COMMENT.exec(above);
      assert.ok(m !== null, `line ${at} is not a "# <action> v<x.y.z>" comment: ${above}`);
      assert.equal(m[1], value.slice(0, value.indexOf('@')), `line ${at} names the action line ${at + 1} pins`);
    }
  });

  test(`${file}: the ACTION PINS header names exactly the pinned actions and their versions`, () => {
    const pinned = usesLines(lines).map(({ above }) => VERSION_COMMENT.exec(above)?.slice(1).join(' '));
    assert.ok(pinned.length > 0, 'the file carries a uses: line');
    assert.deepEqual(new Set(actionPins(lines)), new Set(pinned));
  });
}

/** The job a line sits in: the nearest `  <job>:` key above it, under `jobs:`. */
function jobOf(at, lines) {
  const jobs = lines.indexOf('jobs:');
  for (let i = at; i > jobs; i--) {
    const m = /^ {2}([a-z][a-z0-9_-]*):$/.exec(lines[i]);
    if (m !== null) return m[1];
  }
  assert.fail(`line ${at + 1} sits under no job`);
}

/** The step a line sits in, as lines from its `- name:` line. */
function stepAt(at, lines) {
  let start = at;
  while (start >= 0 && !/^\s*- name:/.test(lines[start])) start--;
  assert.ok(start >= 0, `line ${at + 1} sits inside a named step`);
  return [lines[start], ...blockUnder(start, lines)];
}

/** The index of every `uses:` line naming `action`. */
const usesOf = (action, lines) => usesLines(lines).filter(({ value }) => value.startsWith(`${action}@`)).map(({ at }) => at);

/** The `# <heading> …` comment block, up to a bare `#` or the header's end. */
function headerBlock(heading, lines) {
  const start = lines.findIndex((l) => l.startsWith(`# ${heading} `));
  assert.notEqual(start, -1, `the header carries a ${heading} block`);
  const end = lines.findIndex((l, i) => i > start && (l === '#' || !l.startsWith('#')));
  return lines.slice(start, end).join('\n');
}

/**
 * Per file: each checkout's job and whether it keeps its credential; the header block naming why and
 * what it must name; and which upload shape keeps `.git/config` off every artifact.
 */
const CREDENTIAL_SHAPES = [
  {
    file: WORKFLOW_RUN_FILE,
    lines: LINES,
    persists: { open: true, run: false, deliver: true, collect: true, warm: false },
    heading: 'THE CHECKOUT CREDENTIAL.',
    names: [
      '`open`',
      '`run`',
      '`deliver`',
      '`collect`',
      '`warm`',
      'push-branch.sh',
      'persist-credentials: false',
      '~/.git-credentials',
      '`store --file <path>`',
      'sandbox.credentials.files',
      'S1 (runner)',
      'S2 (runner)',
    ],
    uploads: 'runner-temp',
  },
  {
    file: WORKFLOW_RESUME_FILE,
    lines: RESUME_LINES,
    persists: { poll: true },
    heading: 'THE CHECKOUT CREDENTIAL.',
    names: ['`poll`', 'git ls-remote'],
    uploads: 'poll-state',
  },
  {
    file: WORKFLOW_TRIGGER_FILE,
    lines: TRIGGER_LINES,
    persists: { trigger: true },
    heading: 'THE CHECKOUT.',
    names: ['push-branch.sh'],
    uploads: 'none',
  },
  {
    file: WORKFLOW_CONTROL_FILE,
    lines: CONTROL_LINES,
    persists: { control: true },
    heading: 'THE CHECKOUT CREDENTIAL.',
    names: ['push-branch.sh'],
    uploads: 'none',
  },
];

for (const { file, lines, persists, heading, names, uploads } of CREDENTIAL_SHAPES) {
  test(`${file}: persist-credentials: false on exactly the listed checkouts, each persisted one argued, no upload carrying .git/config`, () => {
    const checkouts = usesOf('actions/checkout', lines);
    assert.deepEqual(checkouts.map((at) => jobOf(at, lines)), Object.keys(persists), 'one checkout per listed job');
    for (const at of checkouts) {
      const job = jobOf(at, lines);
      const settings = stepAt(at, lines).filter((l) => /^\s*persist-credentials:/.test(l)).map((l) => l.trim());
      assert.deepEqual(settings, persists[job] ? [] : ['persist-credentials: false'], `the ${job} checkout`);
    }
    const code = lines.filter((l) => !/^\s*#/.test(l));
    const unpersisted = Object.values(persists).filter((p) => !p).length;
    assert.equal(code.filter((l) => l.includes('persist-credentials')).length, unpersisted, 'no persist-credentials outside a listed checkout');

    const block = headerBlock(heading, lines);
    for (const name of names) assert.ok(block.includes(name), `the ${heading} block names ${name}`);

    const paths = usesOf('actions/upload-artifact', lines).map((at) =>
      stepAt(at, lines).filter((l) => /^\s*path:/.test(l)).map((l) => l.trim()),
    );
    if (uploads === 'none') {
      assert.deepEqual(paths, [], 'no actions/upload-artifact step');
    } else if (uploads === 'runner-temp') {
      assert.ok(paths.length > 0, 'an actions/upload-artifact step');
      for (const p of paths) {
        assert.ok(p.length > 0 && p.every((l) => l.startsWith('path: ${{ runner.temp }}')), `an upload outside the workspace: ${p}`);
      }
    } else {
      // POLL_STATE_DIR is inside the workspace, but a state-directory subpath, which holds no .git/.
      assert.deepEqual(paths, [['path: ${{ env.POLL_STATE_DIR }}']]);
      const setters = code.filter((l) => l.includes('POLL_STATE_DIR='));
      assert.equal(setters.length, 1, 'one line sets POLL_STATE_DIR');
      assert.match(setters[0], /\/autonomous_logs\/poll_state\/current"$/, 'POLL_STATE_DIR is a state-directory subpath, never one reaching .git/');
    }
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
  assertPermissions(TRIGGER_LINES, { trigger: ['contents: write', 'actions: write', 'issues: write'] });
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
  assertPermissions(CONTROL_LINES, {
    control: ['contents: write', 'actions: write', 'issues: write', 'pull-requests: write'],
  });
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

test('control: the run-name never matches a devscene <action> <branch> title', () => {
  assert.ok(
    CONTROL_LINES.includes(
      'run-name: devscene control ${{ github.event.issue.number || github.event.pull_request.number || github.event.ref }}',
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

/** Every step of the control job, as `{ name, text }` in file order. */
function controlSteps() {
  const out = [];
  CONTROL_LINES.forEach((line, i) => {
    const m = /^\s*- name: (.*)$/.exec(line);
    if (m !== null) out.push({ name: m[1], text: [line, ...blockUnder(i, CONTROL_LINES)].join('\n') });
  });
  return out;
}

const NEEDS_STEP = 'Decide whether the comment needs the agent';
const ACT_STEP = 'Act on the comment, review, close or deletion';
const COMMENT_STEPS = ['Set up Node', 'Install the claude CLI when absent', 'Fetch the pinned plugin'];

test('control runs remote-run.sh control and nothing else of the family', () => {
  const bodies = runBodies(CONTROL_LINES);
  const calls = bodies.flatMap((body) =>
    [...body.matchAll(/([A-Za-z0-9_-]+\.sh)"?\s+(\S*)/g)].map((m) => `${m[1]} ${m[2]}`),
  );
  assert.deepEqual(calls, ['remote-run.sh control', 'remote-run.sh control']);
  assert.equal(bodies.filter((b) => b.includes('remote-run.sh" control --needs-agent')).length, 1);
});

/** The `run:` body of one control step, selected by its name. */
function controlStepBody(name) {
  const step = controlSteps().find((s) => s.name === name);
  assert.ok(step !== undefined, `a control step is named ${name}`);
  const bodies = runBodies(step.text.split('\n'));
  assert.equal(bodies.length, 1);
  return bodies[0];
}

/** The act step's inline `run:` value. */
const controlStepRun = () => controlStepBody(ACT_STEP);

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
        env: { ...process.env, [MAIN_REPO_ANCHOR_VARIABLE]: '', SCRIPTS_DIR: dir },
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

test('control: under bash -e -o pipefail the agent check passes on every exit and answers no on exit 2 alone', () => {
  const body = controlStepBody(NEEDS_STEP);
  const root = mkdtempSync(join(tmpdir(), 'harness-control-needs-'));
  try {
    for (const [code, agent] of [[0, 'yes'], [1, 'yes'], [2, 'no'], [3, 'yes']]) {
      const dir = join(root, String(code));
      mkdirSync(dir);
      writeFileSync(
        join(dir, 'remote-run.sh'),
        `[ "$#" -eq 2 ] && [ "$1" = control ] && [ "$2" = --needs-agent ] || exit 99\nexit ${code}\n`,
      );
      const output = join(dir, 'github-output');
      writeFileSync(output, '');
      const r = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', body], {
        env: { ...process.env, [MAIN_REPO_ANCHOR_VARIABLE]: '', SCRIPTS_DIR: dir, GITHUB_OUTPUT: output },
        encoding: 'utf8',
      });
      assert.equal(r.error, undefined);
      assert.equal(r.status, 0, `exit ${code} passes the step: ${r.stdout}${r.stderr}`);
      assert.equal(readFileSync(output, 'utf8'), `agent=${agent}\n`, `exit ${code} writes agent=${agent}`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/** The release-tag prefix a step's `tag=` line clones, the version variable stripped. */
function tagPrefix(stepText) {
  const m = /^\s*tag="([^"$]+)\$/m.exec(stepText);
  assert.ok(m !== null, `a tag= line in ${stepText.split('\n')[0]}`);
  return m[1];
}

test('control passes the credential to the act step of a comment job alone, and serializes review jobs per head branch but never comment jobs', () => {
  const secretLines = CONTROL_LINES.filter((l) => !/^\s*#/.test(l) && l.includes('secrets.'));
  assert.deepEqual(
    secretLines.map((l) => l.trim()),
    [
      `IN_OAUTH: \${{ github.event_name == 'issue_comment' && secrets.${OAUTH_TOKEN_SECRET} || '' }}`,
      `IN_API: \${{ github.event_name == 'issue_comment' && secrets.${API_KEY_SECRET} || '' }}`,
    ],
  );
  assert.ok(!CONTROL_LINES.some((l) => /^ {6}IN_(OAUTH|API):/.test(l)), 'a credential at job level');
  const act = controlSteps().find((s) => s.name === ACT_STEP);
  assert.ok(act !== undefined);
  const actEnv = blockUnder(
    act.text.split('\n').findIndex((l) => /^\s*env:$/.test(l)),
    act.text.split('\n'),
  ).map((l) => l.trim());
  assert.deepEqual(actEnv, secretLines.map((l) => l.trim()));

  const at = CONTROL_LINES.findIndex((l) => /^ {4}concurrency:$/.test(l));
  assert.notEqual(at, -1, 'the control job declares a concurrency group');
  assert.equal(CONTROL_LINES.filter((l) => /^\s*concurrency:/.test(l)).length, 1);
  const block = blockUnder(at, CONTROL_LINES).map((l) => l.trim());
  assert.deepEqual(block, [
    "group: ${{ github.event_name == 'pull_request_review' && format('harness-review-{0}', github.event.pull_request.head.ref) || format('harness-control-{0}', github.run_id) }}",
    'cancel-in-progress: false',
  ]);
});

test('control: the comment-only steps run after the agent check and before the act step, on a comment the check did not answer no, never failing the job', () => {
  const names = controlSteps().map((s) => s.name);
  const act = names.indexOf(ACT_STEP);
  assert.notEqual(act, -1);
  const needs = names.indexOf(NEEDS_STEP);
  assert.ok(needs !== -1 && needs < names.indexOf('Set up Node'), `${NEEDS_STEP} comes before Set up Node`);
  const needsText = controlSteps()[needs].text;
  assert.match(needsText, /^\s*id: needs$/m);
  assert.match(needsText, /^\s*if: github\.event_name == 'issue_comment'$/m, `${NEEDS_STEP}'s if:`);
  assert.match(needsText, /^\s*continue-on-error: true$/m, `${NEEDS_STEP} is continue-on-error`);
  for (const name of COMMENT_STEPS) {
    const i = names.indexOf(name);
    assert.ok(i !== -1 && i < act, `${name} comes before the act step`);
    const { text } = controlSteps()[i];
    assert.match(
      text,
      /^\s*if: github\.event_name == 'issue_comment' && steps\.needs\.outputs\.agent != 'no'$/m,
      `${name}'s if:`,
    );
    assert.match(text, /^\s*continue-on-error: true$/m, `${name} is continue-on-error`);
  }
  assert.ok(names.indexOf('Fetch the pinned plugin') > names.indexOf('Install the claude CLI when absent'));
});

test("control: Fetch the pinned plugin reads devscene-run.yml's pin, clones its release tag and hands the directory on", () => {
  const fetch = controlSteps().find((s) => s.name === 'Fetch the pinned plugin').text;
  const [body] = runBodies(fetch.split('\n'));
  assert.ok(body.includes(`${CLI_VERSION_VARIABLE}:`), 'reads the pin variable');
  assert.ok(body.includes(`.github/workflows/${WORKFLOW_RUN_FILE}`), 'reads it from devscene-run.yml');
  assert.ok(body.includes('devscene--v'), 'clones the release tag');
  assert.match(body, /^\s*echo "HARNESS_MENTION_PLUGIN_DIR=\$plugin_dir" >> "\$GITHUB_ENV"$/m);
  assert.ok(!body.includes('claude plugin install'), 'installs nothing');
  const install = stepCarrying('claude plugin install');
  assert.equal(tagPrefix(fetch), tagPrefix(install));
});

test('control: the claude CLI install mirrors devscene-run.yml', () => {
  const body = (lines, name) => {
    const at = lines.findIndex((l) => l.trim() === `- name: ${name}`);
    assert.notEqual(at, -1);
    return runBodies([lines[at], ...blockUnder(at, lines)]).join('\n').trim().split('\n').map((l) => l.trim());
  };
  const name = 'Install the claude CLI when absent';
  assert.deepEqual(body(CONTROL_LINES, name), body(LINES, name));
});

test('control carries no template token, and every expression is spaced and outside run blocks', () => {
  assert.doesNotMatch(CONTROL_TEXT, /\{\{[A-Za-z]/);
  assert.doesNotMatch(CONTROL_TEXT, /\$\{\{[^ ]/);
  const bodies = runBodies(CONTROL_LINES);
  assert.ok(bodies.length > 0);
  for (const body of bodies) assert.ok(!body.includes('${{'), `expression in run: ${body}`);
});
