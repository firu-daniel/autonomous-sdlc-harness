/**
 * The remote branch-protection grading — `cli/src/doctor/branchProtection.ts` → the endpoint
 * builders, `rulesetBlocksOf`, `classicProtectionOf`, `assessBranch` and `describeCoverage`.
 *
 * **The rule this suite enforces: a protected branch is reported covered only when GitHub's answers
 * prove direct pushes, force pushes and deletion all blocked, and an answer that could not be read is
 * graded neither covered nor missing.**
 *
 * The module is imported compiled from `../dist/doctor/branchProtection.js`, so `npm run build`
 * precedes `npm test`. Every GitHub answer is an argument: no case reaches the network.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CLASSIC_UNPROTECTED_PATTERN,
  PROTECTION_NEEDS,
  PROTECTION_NEED_LABEL,
  assessBranch,
  branchRulesEndpoint,
  classicProtectionEndpoint,
  classicProtectionOf,
  describeCoverage,
  rulesetBlocksOf,
} from '../dist/doctor/branchProtection.js';

const ALL = new Set(['push', 'force-push', 'deletion']);
const rulesRead = (needs) => ({ kind: 'read', blocks: new Set(needs) });
const classicRead = (needs, adminsExempt = false) => ({
  kind: 'read',
  protection: { blocks: new Set(needs), adminsExempt },
});

test('the needs and their labels', () => {
  assert.deepEqual([...PROTECTION_NEEDS], ['push', 'force-push', 'deletion']);
  assert.deepEqual(PROTECTION_NEED_LABEL, {
    push: 'direct pushes',
    'force-push': 'force pushes',
    deletion: 'deletion',
  });
});

test('the endpoints encode a branch carrying `/`', () => {
  assert.equal(branchRulesEndpoint('release/1.0'), 'repos/{owner}/{repo}/rules/branches/release%2F1.0?per_page=100');
  assert.equal(classicProtectionEndpoint('release/1.0'), 'repos/{owner}/{repo}/branches/release%2F1.0/protection');
});

test('the classic refusal text that means no protection', () => {
  assert.match('gh: Branch not protected (HTTP 404)', CLASSIC_UNPROTECTED_PATTERN);
  assert.match('gh: Branch not found (HTTP 404)', CLASSIC_UNPROTECTED_PATTERN);
  assert.doesNotMatch('gh: Resource not accessible by integration (HTTP 403)', CLASSIC_UNPROTECTED_PATTERN);
});

test('rulesetBlocksOf', async (t) => {
  await t.test('credits every mapped rule type', () => {
    const answer = JSON.stringify([
      { type: 'pull_request', ruleset_id: 1 },
      { type: 'non_fast_forward' },
      { type: 'deletion' },
    ]);
    assert.deepEqual(rulesetBlocksOf(answer), ALL);
    assert.deepEqual(rulesetBlocksOf(JSON.stringify([{ type: 'update' }])), new Set(['push']));
    assert.deepEqual(rulesetBlocksOf('[]'), new Set());
  });
  await t.test('ignores an unknown rule type', () => {
    const answer = JSON.stringify([{ type: 'required_signatures' }, { type: 'constructor' }, { type: 'deletion' }]);
    assert.deepEqual(rulesetBlocksOf(answer), new Set(['deletion']));
  });
  await t.test('returns undefined for a malformed answer', () => {
    assert.equal(rulesetBlocksOf('not json'), undefined);
    assert.equal(rulesetBlocksOf('{"type":"deletion"}'), undefined);
    assert.equal(rulesetBlocksOf('[{"type":1}]'), undefined);
    assert.equal(rulesetBlocksOf('[null]'), undefined);
    assert.equal(rulesetBlocksOf('[{"type":"deletion"},"x"]'), undefined);
  });
});

test('classicProtectionOf', async (t) => {
  await t.test('credits every need from a well-formed answer', () => {
    const answer = JSON.stringify({
      required_pull_request_reviews: { required_approving_review_count: 1 },
      allow_force_pushes: { enabled: false },
      allow_deletions: { enabled: false },
      enforce_admins: { enabled: true },
    });
    const parsed = classicProtectionOf(answer);
    assert.deepEqual(parsed, { blocks: ALL, adminsExempt: false });
  });
  await t.test('credits push from a locked branch', () => {
    const parsed = classicProtectionOf(JSON.stringify({ lock_branch: { enabled: true } }));
    assert.deepEqual(parsed.blocks, new Set(['push']));
  });
  await t.test('credits nothing from an absent, malformed or permissive field', () => {
    const answer = JSON.stringify({
      required_pull_request_reviews: null,
      lock_branch: { enabled: 'true' },
      allow_force_pushes: { enabled: true },
      allow_deletions: false,
      required_signatures: { enabled: true },
    });
    assert.deepEqual(classicProtectionOf(answer), { blocks: new Set(), adminsExempt: true });
  });
  await t.test('returns undefined for a malformed answer', () => {
    assert.equal(classicProtectionOf('not json'), undefined);
    assert.equal(classicProtectionOf('[]'), undefined);
    assert.equal(classicProtectionOf('null'), undefined);
  });
});

test('assessBranch', async (t) => {
  await t.test('covered by rulesets alone, classic not asked', () => {
    const coverage = assessBranch('main', rulesRead(ALL), { kind: 'not-asked' });
    assert.equal(coverage.state, 'covered');
    assert.deepEqual(coverage.missing, []);
    assert.deepEqual(coverage.undetermined, []);
    assert.equal(coverage.why, '');
  });
  await t.test('covered by rulesets and classic together', () => {
    const coverage = assessBranch('main', rulesRead(['deletion']), classicRead(['push', 'force-push']));
    assert.equal(coverage.state, 'covered');
  });
  await t.test('partial: a ruleset blocking only deletion and no classic protection', () => {
    const coverage = assessBranch('main', rulesRead(['deletion']), { kind: 'none' });
    assert.equal(coverage.state, 'partial');
    assert.deepEqual(coverage.missing, ['push', 'force-push']);
    assert.deepEqual(coverage.undetermined, []);
  });
  await t.test('uncovered: nothing blocks anything', () => {
    const coverage = assessBranch('main', rulesRead([]), { kind: 'none' });
    assert.equal(coverage.state, 'uncovered');
    assert.deepEqual(coverage.missing, ['push', 'force-push', 'deletion']);
  });
  await t.test('unknown, never missing: rulesets read and classic unreadable', () => {
    const coverage = assessBranch('main', rulesRead(['deletion']), { kind: 'unreadable', why: 'HTTP 403' });
    assert.equal(coverage.state, 'unknown');
    assert.deepEqual(coverage.missing, []);
    assert.deepEqual(coverage.undetermined, ['push', 'force-push']);
    assert.equal(coverage.why, 'HTTP 403');
  });
  await t.test('unknown: rulesets unreadable', () => {
    const coverage = assessBranch('main', { kind: 'unreadable', why: 'rate limited' }, { kind: 'none' });
    assert.equal(coverage.state, 'unknown');
    assert.deepEqual(coverage.undetermined, ['push', 'force-push', 'deletion']);
    assert.equal(coverage.why, 'rate limited');
  });
  await t.test('an unreadable source still lets a readable one prove covered', () => {
    const coverage = assessBranch('main', { kind: 'unreadable', why: 'x' }, classicRead(ALL));
    assert.equal(coverage.state, 'covered');
  });
  await t.test('not-asked counts as read only when the rulesets block all three', () => {
    const coverage = assessBranch('main', rulesRead(['push']), { kind: 'not-asked' });
    assert.equal(coverage.state, 'unknown');
    assert.deepEqual(coverage.missing, []);
    assert.deepEqual(coverage.undetermined, ['force-push', 'deletion']);
  });
  await t.test('notes classic push protection that exempts administrators', () => {
    const exempt = assessBranch('dev', rulesRead([]), classicRead(['push'], true));
    assert.equal(exempt.notes.length, 1);
    assert.match(exempt.notes[0], /`dev`/);
    assert.match(exempt.notes[0], /administrator/);
    assert.deepEqual(assessBranch('dev', rulesRead([]), classicRead(['push'], false)).notes, []);
    assert.deepEqual(assessBranch('dev', rulesRead([]), classicRead(['deletion'], true)).notes, []);
  });
});

test('describeCoverage', async (t) => {
  const covered = assessBranch('main', rulesRead(ALL), { kind: 'not-asked' });
  const coveredDev = assessBranch('dev', rulesRead(['deletion']), classicRead(['push', 'force-push']));
  const partial = assessBranch('dev', rulesRead(['deletion']), { kind: 'none' });
  const unknown = assessBranch('publish', rulesRead([]), { kind: 'unreadable', why: 'gh: HTTP 403\nforbidden' });
  const exempt = assessBranch('main', rulesRead(['force-push', 'deletion']), classicRead(['push'], true));

  await t.test('passes only when every branch is covered and there are no globs, naming each', () => {
    const result = describeCoverage([covered, coveredDev], []);
    assert.equal(result.grade, 'pass');
    assert.match(result.detail, /`main`/);
    assert.match(result.detail, /`dev`/);
  });
  await t.test('warns on a glob alone', () => {
    const result = describeCoverage([covered], ['release/*']);
    assert.equal(result.grade, 'warn');
    assert.match(result.detail, /`release\/\*` names a namespace rather than one branch; confirm a ruleset targets it/);
  });
  await t.test('warns naming missing needs, undetermined needs and their why, reason and remedy once', () => {
    const result = describeCoverage([covered, partial, unknown], []);
    assert.equal(result.grade, 'warn');
    assert.match(result.detail, /`dev`: no ruleset or branch protection blocks direct pushes and force pushes/);
    assert.match(
      result.detail,
      /`publish`: cannot tell whether direct pushes, force pushes and deletion are blocked: gh: HTTP 403 forbidden/,
    );
    assert.doesNotMatch(result.detail, /`main`: /);
    assert.equal(result.detail.split('outside the sandbox from the main checkout').length, 2);
    assert.equal(result.detail.split('Settings → Rules → Rulesets').length, 2);
    assert.match(result.detail, /Restrict deletions, Block force pushes and Require a pull request before merging/);
  });
  await t.test('appends the notes', () => {
    const result = describeCoverage([exempt], []);
    assert.equal(result.grade, 'pass');
    assert.match(result.detail, /administrator/);
  });
  await t.test('every detail is one line', () => {
    const cases = [
      describeCoverage([covered], []),
      describeCoverage([], []),
      describeCoverage([covered], ['feat/*']),
      describeCoverage([partial, unknown, exempt], ['x/*']),
    ];
    for (const { detail } of cases) assert.ok(!detail.includes('\n'), detail);
  });
});
