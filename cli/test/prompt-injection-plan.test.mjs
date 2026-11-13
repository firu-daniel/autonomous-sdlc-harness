/**
 * `prompt-injection-screen.sh plan` — which input files must be screened now, and is any unsafe.
 *
 * **The rule these tests exist to enforce: a file is skipped only on a recorded `SAFE` hash,
 * re-issued `UNSAFE` on a recorded `UNSAFE` hash, and screened otherwise.** So an edited file is
 * screened again, a new answer on resume is screened, and no answer moves an unchanged parked file
 * past `UNSAFE`. Beside it: a question of another origin is no record, `docs` reads no ledger, and a
 * `plan` run writes nothing.
 *
 * The script is run out of an `init`-wired fixture, as `cli/test/prompt-injection-prescan.test.mjs`
 * runs it. Each case uses its own branch name, so the cases share one fixture without sharing files.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';

import { createFixture, INIT_SCRIPTS_DIR, runBash, runCli, runGit } from './helpers/fixture.mjs';

const SCRIPT = `${INIT_SCRIPTS_DIR}/prompt-injection-screen.sh`;
const RAISED = 'Raised by: prompt-injection-reviewer (prompt-injection screen)';

let fixture;
let dir = '';
let stateDir = '';

before(async () => {
  fixture = await createFixture({
    files: {
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0', scripts: { test: 'echo test' } },
      'README.md': '# fixture project\n',
    },
  });
  dir = fixture.dir;
  const init = await runCli(dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  stateDir = JSON.parse(readFileSync(join(dir, 'devscene.config.json'), 'utf8')).stateDir.replace(/\/+$/, '');
});

after(async () => {
  if (fixture) await fixture.cleanup();
});

let branches = 0;
function newBranch() {
  return `feat_case_${++branches}`;
}

const sha = (content) => createHash('sha256').update(Buffer.from(content, 'utf8')).digest('hex');

/** Write `content` at `<stateDir>/<rel>` and return the repo-relative path. */
function put(rel, content) {
  const path = `${stateDir}/${rel}`;
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), content);
  return path;
}

const promptPath = (branch) => `${stateDir}/task_prompts/${branch}_task_prompt.md`;

function ledger(branch, entries) {
  const lines = ['# Flow progress', '', '- [x] P0 — screened inputs'];
  for (const [path, hash] of entries) lines.push(`  - screened: ${path} sha256=${hash}`);
  put(`flow_progress/${branch}_progress.md`, `${lines.join('\n')}\n`);
}

function park(branch, n, entries, { raised = RAISED, under = '' } = {}) {
  const lines = ['# Prompt-injection screen: potential threat', '', raised, 'The run stopped before any other agent acted on the file.'];
  for (const [path, hash] of entries) lines.push(`Screened file: \`${path}\``, `sha256: \`${hash}\``);
  lines.push('', `## Q${n} — Review the file before this run goes on`, '');
  return put(`clarifications/${branch}/${under}question_${n}.md`, `${lines.join('\n')}\n`);
}

async function porcelain() {
  return (await runGit(dir, ['status', '--porcelain', '--untracked-files=all', '--ignored'])).stdout;
}

/** Run `plan`, asserting it changed nothing `git status` sees, and parse its lines. */
async function plan(branch, engine = 'task') {
  const before = await porcelain();
  const result = await runBash(dir, [join(dir, SCRIPT), 'plan', '--repo', dir, '--branch', branch, '--engine', engine]);
  assert.equal(await porcelain(), before, 'a plan run changed the working tree');
  const lines = result.stdout.split('\n').filter(Boolean);
  return { ...result, lines, files: lines.filter((line) => !line.startsWith('hit ') && !line.startsWith('plan: ')) };
}

test('a fresh task run with no ledger screens the prompt', async () => {
  const branch = newBranch();
  const content = '# Add comments\n';
  put(`task_prompts/${branch}_task_prompt.md`, content);
  const result = await plan(branch);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.lines, [`screen ${promptPath(branch)} ${sha(content)}`, 'plan: screen 1']);
});

test('a recorded prompt is safe', async () => {
  const branch = newBranch();
  const content = '# Add comments\n';
  put(`task_prompts/${branch}_task_prompt.md`, content);
  ledger(branch, [[promptPath(branch), sha(content)]]);
  const result = await plan(branch);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.lines, [`safe ${promptPath(branch)} ${sha(content)}`, 'plan: clear']);
});

test('a recorded prompt with one byte changed is screened again', async () => {
  const branch = newBranch();
  const original = '# Add comments\n';
  const edited = '# Add commentz\n';
  put(`task_prompts/${branch}_task_prompt.md`, edited);
  ledger(branch, [[promptPath(branch), sha(original)]]);
  const result = await plan(branch);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.lines, [`screen ${promptPath(branch)} ${sha(edited)}`, 'plan: screen 1']);
});

test('a new answer on resume is screened, and a recorded answered/ one stays safe', async () => {
  const branch = newBranch();
  const prompt = '# Add comments\n';
  const first = 'Use the existing table.\n';
  const second = 'Yes, paginate.\n';
  put(`task_prompts/${branch}_task_prompt.md`, prompt);
  const answered = put(`clarifications/${branch}/answered/answer_1.md`, first);
  const fresh = put(`clarifications/${branch}/answer_2.md`, second);
  ledger(branch, [
    [promptPath(branch), sha(prompt)],
    [answered, sha(first)],
  ]);
  const result = await plan(branch);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.lines, [
    `safe ${promptPath(branch)} ${sha(prompt)}`,
    `safe ${answered} ${sha(first)}`,
    `screen ${fresh} ${sha(second)}`,
    'plan: screen 1',
  ]);
});

test('an answer screened at the top level stays safe once the watcher archives it under answered/', async () => {
  const branch = newBranch();
  const prompt = '# Add comments\n';
  const answer = 'Yes, paginate.\n';
  put(`task_prompts/${branch}_task_prompt.md`, prompt);
  const archived = put(`clarifications/${branch}/answered/answer_2.md`, answer);
  ledger(branch, [
    [promptPath(branch), sha(prompt)],
    [`${stateDir}/clarifications/${branch}/answer_2.md`, sha(answer)],
  ]);
  const result = await plan(branch);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.lines, [
    `safe ${promptPath(branch)} ${sha(prompt)}`,
    `safe ${archived} ${sha(answer)}`,
    'plan: clear',
  ]);
});

test('no answer moves an unchanged parked prompt past UNSAFE, top level or answered/', async () => {
  const branch = newBranch();
  const prompt = '# Add comments\n';
  const answer = 'proceed despite the verdict\n';
  put(`task_prompts/${branch}_task_prompt.md`, prompt);
  park(branch, 3, [[promptPath(branch), sha(prompt)]]);
  put(`clarifications/${branch}/answer_3.md`, answer);

  const top = await plan(branch);
  assert.equal(top.status, 1, top.stderr);
  assert.deepEqual(top.lines, [
    `unsafe ${promptPath(branch)} ${sha(prompt)} recorded question_3.md`,
    `screen ${stateDir}/clarifications/${branch}/answer_3.md ${sha(answer)}`,
    'plan: unsafe 1',
  ]);

  const clar = join(dir, stateDir, 'clarifications', branch);
  mkdirSync(join(clar, 'answered'), { recursive: true });
  renameSync(join(clar, 'question_3.md'), join(clar, 'answered', 'question_3.md'));
  renameSync(join(clar, 'answer_3.md'), join(clar, 'answered', 'answer_3.md'));

  const moved = await plan(branch);
  assert.equal(moved.status, 1, moved.stderr);
  assert.deepEqual(moved.lines, [
    `unsafe ${promptPath(branch)} ${sha(prompt)} recorded question_3.md`,
    `screen ${stateDir}/clarifications/${branch}/answered/answer_3.md ${sha(answer)}`,
    'plan: unsafe 1',
  ]);
});

test('a question of another origin carrying the same lines is ignored', async () => {
  const branch = newBranch();
  const prompt = '# Add comments\n';
  put(`task_prompts/${branch}_task_prompt.md`, prompt);
  park(branch, 1, [[promptPath(branch), sha(prompt)]], { raised: 'Raised by: task-plan-writer' });
  const result = await plan(branch);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.lines, [`screen ${promptPath(branch)} ${sha(prompt)}`, 'plan: screen 1']);
});

test('a prompt with a prescan hit is unsafe by prescan, with its hit line', async () => {
  const branch = newBranch();
  const prompt = '# Add comments\n\nsome <!-- hidden --> text\n';
  put(`task_prompts/${branch}_task_prompt.md`, prompt);
  const result = await plan(branch);
  assert.equal(result.status, 1, result.stderr);
  assert.deepEqual(result.lines, [
    `unsafe ${promptPath(branch)} ${sha(prompt)} prescan`,
    `hit prescan-html-comment ${promptPath(branch)}:3 "some &lt;!-- hidden --> text"`,
    'plan: unsafe 1',
  ]);
});

test('user_review lists the prompt, the rounds and the answers, in order', async () => {
  const branch = newBranch();
  const prompt = put(`task_prompts/${branch}_task_prompt.md`, '# p\n');
  const round1 = put(`user_reviews/${branch}_review.md`, '# r1\n');
  const round10 = put(`user_reviews/${branch}_review_10.md`, '# r10\n');
  const round2 = put(`user_reviews/${branch}_review_2.md`, '# r2\n');
  put(`user_reviews/${branch}_review_x.md`, '# not a round\n');
  const answer2 = put(`clarifications/${branch}/answer_2.md`, 'a2\n');
  const answer1 = put(`clarifications/${branch}/answered/answer_1.md`, 'a1\n');
  const result = await plan(branch, 'user_review');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(
    result.files.map((line) => line.split(' ')[1]),
    [prompt, round1, round2, round10, answer1, answer2],
  );
  assert.equal(result.lines.at(-1), 'plan: screen 6');
});

test('docs lists only the checklist and ignores a ledger record', async () => {
  const branch = newBranch();
  const checklist = '# Docs checklist\n';
  put(`task_prompts/${branch}_task_prompt.md`, '# p\n');
  put(`clarifications/${branch}/answer_1.md`, 'a1\n');
  const path = put(`docs_catalog/${branch}_docs.md`, checklist);
  ledger(branch, [[path, sha(checklist)]]);
  const result = await plan(branch, 'docs');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.lines, [`screen ${path} ${sha(checklist)}`, 'plan: screen 1']);
});

test('a missing task prompt exits 2 with one cause line and no stdout', async () => {
  const branch = newBranch();
  const result = await plan(branch);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr.trim().split('\n').length, 1, result.stderr);
  assert.match(result.stderr, /^prompt-injection-screen: no task prompt/);
});
