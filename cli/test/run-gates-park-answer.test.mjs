import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { WORKSPACE_ROOT } from './helpers/fixture.mjs';

/**
 * The rule this suite enforces: an answered `fixable: 0` park's route — the G.2 clause, the
 * consumed marker, the park's origin and the fork-stated lookup — is spelled identically by every
 * file that writes it and every file that reads it, and the mode-free core names no clarification
 * path.
 *
 * This is a source guard, the last resort `.claude/context/conventions.md` → `## The testing bar`
 * permits. The route is instruction prose an orchestrator session reads, so no behavioural test
 * reaches it: no flow-graph fixture covers Phase G (`scripts/check-flow-graph.sh` checks the task
 * plan-writing graph only), and no other suite quotes G.0 or G.2. A drift between producer and
 * consumer here is silent until a parked run resumes and its answer is never read.
 *
 * Deliberately not covered: whether an orchestrator session actually follows G.0's pending-answer
 * arm. That needs a live session, which no test in this package starts.
 *
 * Each assertion reads one section, sliced from its heading to the next heading of the same or a
 * higher level, so a match elsewhere in the file cannot satisfy it; a heading that is not found
 * fails its case by name.
 */

const read = (rel) => ({ rel, text: readFileSync(join(WORKSPACE_ROOT, rel), 'utf8') });

const CORE = read('plugin/instructions/plan_orchestration_instructions_core.md');
const AGENT = read('plugin/agents/test-fix-plan-writer.md');
const TASK_FORK = read('plugin/instructions/plan_orchestration_instructions_autonomous.md');
const REVIEW_FORK = read('plugin/instructions/user_review_fixes_instructions_autonomous.md');
const PLANNING_FORK = read('plugin/instructions/task_plan_writing_instructions_autonomous.md');

const CLAUSE = 'Park answer: <question_file> + <answer_file>.';
const MARKER = 'Park answer consumed:';
const ORIGIN = 'Phase G test-fix-plan-writer';
const LOOKUP =
  "grep -rlF --include='question_*.md' '<test_fix_plan_path>' <state_dir>/clarifications/<branch>/";

function section(file, heading) {
  const lines = file.text.split('\n');
  const start = lines.findIndex((line) => line === heading);
  assert.notEqual(start, -1, `${file.rel}: heading not found: ${heading}`);
  const level = heading.match(/^#+/)[0].length;
  const end = lines.findIndex(
    (line, i) => i > start && /^#+ /.test(line) && line.match(/^#+/)[0].length <= level,
  );
  return { where: `${file.rel} → ${heading}`, text: lines.slice(start, end === -1 ? undefined : end).join('\n') };
}

function lineStarting(sec, prefix) {
  const line = sec.text.split('\n').find((l) => l.startsWith(prefix));
  assert.ok(line, `${sec.where}: no line starting "${prefix}"`);
  return line;
}

test('(a) the Park answer clause closes both prompt forms in the core G.2 and the agent contract', () => {
  const g2 = section(CORE, '### G.2 Write and review the test fix plan');
  assert.ok(
    g2.text.includes(
      `Write the test fix plan. Branch: <branch>. Test log: <log>. Earlier logs: <paths or none>. Output: <test_fix_plan_path>. ${CLAUSE}`,
    ),
    `${g2.where}: the initial-write prompt does not end with "${CLAUSE}"`,
  );
  assert.ok(
    g2.text.includes(
      `Revise the test fix plan at <test_fix_plan_path> per architecture findings: <findings_file>. ${CLAUSE}`,
    ),
    `${g2.where}: the revision prompt does not end with "${CLAUSE}"`,
  );

  const contract = section(AGENT, '## Invocation contract');
  for (const prefix of ['Write the test fix plan.', 'Revise the test fix plan at']) {
    assert.ok(
      lineStarting(contract, prefix).endsWith(` ${CLAUSE}`),
      `${contract.where}: the form starting "${prefix}" does not end with "${CLAUSE}"`,
    );
  }
});

test('(b) the consumed marker is written by the agent and tested by the core G.0', () => {
  const steps = section(AGENT, '## Process');
  assert.ok(steps.text.includes(MARKER), `${steps.where}: "${MARKER}" not found`);

  const g0 = section(CORE, '### G.0 Resolve the round');
  assert.ok(g0.text.includes(`grep -c '^${MARKER}'`), `${g0.where}: "grep -c '^${MARKER}'" not found`);
});

test('(c) the test-fix-plan-writer origin is named by the core G.2 and by all three forks', () => {
  const sites = [
    section(CORE, '### G.2 Write and review the test fix plan'),
    section(TASK_FORK, '### `<escalate>` — the clarification reroute'),
    section(REVIEW_FORK, '### `<escalate>` / `<ask>` — the park-and-yield clarification reroute'),
    section(PLANNING_FORK, '## Override 2 — resumability'),
  ];
  for (const sec of sites) {
    assert.ok(sec.text.includes(ORIGIN), `${sec.where}: "${ORIGIN}" not found`);
  }
});

test('(d) both implementation forks bind the same lookup, and the core names no clarification path', () => {
  for (const fork of [TASK_FORK, REVIEW_FORK]) {
    const bindings = section(fork, '## Mode contract — bindings');
    assert.ok(bindings.text.includes(LOOKUP), `${bindings.where}: the <park_answer_lookup> command differs from "${LOOKUP}"`);
  }
  assert.ok(!CORE.text.includes('clarifications/'), `${CORE.rel}: the mode-free core names "clarifications/"`);
});

test('(e) the G.5 cap paragraph still covers the answered fixable: 0 park', () => {
  const g5 = section(CORE, '### G.5 Re-run, and the round cap');
  const lead = '**An answered park never buys a fresh cap.**';
  const paragraph = g5.text.split('\n\n').find((p) => p.startsWith(lead));
  assert.ok(paragraph, `${g5.where}: no paragraph opening "${lead}"`);
  assert.ok(paragraph.includes('fixable: 0'), `${g5.where}: the "${lead}" paragraph does not mention "fixable: 0"`);
  assert.ok(paragraph.includes('G.2'), `${g5.where}: the "${lead}" paragraph does not mention "G.2"`);
});
