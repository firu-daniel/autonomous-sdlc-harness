/**
 * The `harness-run.yml` workflow template, read as text.
 *
 * **The contract these tests enforce.** The seven `workflow_dispatch` inputs `remote-run.sh`
 * sends, with `action`'s options exactly `run`, `pause`, `warm` and `stop`; a job only for `run`
 * and for `warm`, so `pause` and `stop` start none; the `run-name` title the pause poll and
 * `continue` / `poll` match runs by; the `runs-on` line and the two permissions; every GitHub
 * expression spaced after its braces and `{{cliVersion}}` the only template token, so the CLI's
 * renderer (`cli/src/core/templating.ts`) sees nothing else; no input or secret expression inside a
 * `run:` block (script injection); `continue` under `!cancelled()` and the upload and final push
 * under `always()`; and no configured directory frozen into the file.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT } from './helpers/fixture.mjs';
import { WORKFLOW_RUN_FILE, WORKFLOW_TEMPLATE_DIR } from '../dist/remote/githubActions.js';

const TEXT = readFileSync(join(PACKAGE_ROOT, 'templates', WORKFLOW_TEMPLATE_DIR, WORKFLOW_RUN_FILE), 'utf8');
const LINES = TEXT.split('\n');

const indentOf = (line) => line.length - line.trimStart().length;

/** The lines under `LINES[start]` indented deeper than it, blank lines kept. */
function blockUnder(start) {
  const base = indentOf(LINES[start]);
  const out = [];
  for (let i = start + 1; i < LINES.length; i++) {
    if (LINES[i].trim() !== '' && indentOf(LINES[i]) <= base) break;
    out.push(LINES[i]);
  }
  return out;
}

/** Every `run:` body: the inline value, or the block under a `run: |`. */
function runBodies() {
  const bodies = [];
  LINES.forEach((line, i) => {
    const m = /^\s*(?:- )?run:\s*(.*)$/.exec(line);
    if (m === null) return;
    bodies.push(m[1] === '|' ? blockUnder(i).join('\n') : m[1]);
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
  assert.deepEqual(jobIfs, ["if: inputs.action == 'run'", "if: inputs.action == 'warm'"]);
});

test('the run-name title, the runner line and the permissions', () => {
  assert.ok(LINES.includes('run-name: harness ${{ inputs.action }} ${{ inputs.branch }}'));
  for (const line of LINES.filter((l) => /^\s*runs-on:/.test(l))) {
    assert.equal(line.trim(), "runs-on: ${{ vars.HARNESS_RUNNER || 'ubuntu-latest' }}");
  }
  const i = LINES.indexOf('permissions:');
  assert.deepEqual(blockUnder(i).filter((l) => l.trim() !== '').map((l) => l.trim()), ['contents: write', 'actions: write']);
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

test('no configured directory is frozen into the file', () => {
  assert.doesNotMatch(TEXT, /(^|[^A-Za-z0-9_])scripts\//m);
  // A segment of its own: the machine cache path's `autonomous-sdlc-harness/` is not the state dir.
  assert.doesNotMatch(TEXT, /(^|[^A-Za-z0-9_-])sdlc-harness\//m);
});
