/**
 * Gate 12's restatement, in `docs/development.md`, of `scripts/gate12-sandbox-round.sh`'s row table.
 *
 * **The rule this suite enforces: the round's restated table carries every `--list` row, in order,
 * with its round step and its route, and no other row; and the round names each subcommand's
 * command inside a fenced block.** A route maps to *Taken by* through {@link TAKEN_BY}; a route
 * outside it fails. Only a `hand` or `source` row's note is held to `--list`'s: a `hand` row's note
 * is the reason the row stays by hand, and a `source` row's is the source the row is read from.
 *
 * It reads two fixed files — the script's `--list` output and `docs/development.md` — and no tree,
 * so it owes no `treeGuards` entry.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { runBash, WORKSPACE_ROOT } from './helpers/fixture.mjs';
import { ROUND_SCRIPT } from './helpers/gate12-round.mjs';

/** The route → *Taken by* contract `--list` and the restated table share. */
const TAKEN_BY = {
  'full-run': 'grade --full-run',
  plant: 'plant',
  'reads-SB2': "grade (SB2's run)",
  'default-branch': 'default-branch',
  hand: 'hand',
  source: 'source',
};

const ROUND_HEADING = '**The sandbox series round (#170 step 4) — not yet run.**';
const TABLE_HEADER = '| Row | Round step | Taken by | Note |';

/** `--list`'s rows, each split into its five tab-separated fields. */
async function listedRows() {
  const run = await runBash(WORKSPACE_ROOT, [ROUND_SCRIPT, '--list']);
  assert.equal(run.status, 0, run.stderr);
  return run.stdout
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => {
      const [row, step, route, arms, note] = line.split('\t');
      return { row, step, route, arms, note };
    });
}

/**
 * The round section's lines, from its heading to the restated table's header, and the table's body
 * rows as `{ row, step, takenBy, note }`, read to the first non-table line.
 */
function roundDoc() {
  const doc = readFileSync(join(WORKSPACE_ROOT, 'docs', 'development.md'), 'utf8').split('\n');
  const start = doc.findIndex((line) => line.startsWith(ROUND_HEADING));
  assert.notEqual(start, -1, `${ROUND_HEADING} opens a paragraph in docs/development.md`);
  const header = doc.indexOf(TABLE_HEADER, start);
  assert.notEqual(header, -1, `${TABLE_HEADER} follows ${ROUND_HEADING}`);
  const body = [];
  for (const line of doc.slice(header + 2)) {
    if (!line.startsWith('|')) break;
    const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
    assert.equal(cells.length, 4, `not four cells: ${JSON.stringify(line)}`);
    const [row, step, takenBy, note] = cells;
    body.push({ row, step, takenBy, note });
  }
  return { section: doc.slice(start, header), table: body };
}

/** The lines inside fenced blocks among `lines`. */
function fencedLines(lines) {
  const inside = [];
  let open = false;
  for (const line of lines) {
    if (line.trim().startsWith('```')) open = !open;
    else if (open) inside.push(line);
  }
  return inside;
}

test("Gate 12's restated row table matches --list, row for row", async (t) => {
  const listed = await listedRows();
  const { table } = roundDoc();

  await t.test('the same row IDs, in the same order', () => {
    assert.deepEqual(table.map((r) => r.row), listed.map((r) => r.row));
  });

  await t.test('each round step is equal', () => {
    for (const [i, entry] of listed.entries()) assert.equal(table[i]?.step, entry.step, entry.row);
  });

  await t.test('each Taken by is the route mapped, SB4 included', () => {
    for (const [i, entry] of listed.entries()) {
      assert.ok(Object.hasOwn(TAKEN_BY, entry.route), `${entry.row}: route '${entry.route}' has no Taken by`);
      assert.equal(table[i]?.takenBy, TAKEN_BY[entry.route], entry.row);
    }
    const sb4 = listed.findIndex((r) => r.row === 'SB4');
    assert.notEqual(sb4, -1, 'SB4 is a --list row');
    assert.equal(table[sb4]?.takenBy, "grade (SB2's run)");
  });

  await t.test("each hand or source row's note carries --list's note verbatim", () => {
    for (const [i, entry] of listed.entries()) {
      if (entry.route !== 'hand' && entry.route !== 'source') continue;
      assert.ok(table[i]?.note.includes(entry.note), `${entry.row}: ${JSON.stringify(table[i]?.note)}`);
    }
  });
});

test('the round names each subcommand inside a fenced block', () => {
  const fenced = fencedLines(roundDoc().section);
  const named = (pattern) => fenced.some((line) => pattern.test(line));
  for (const sub of ['plant', 'grade', 'default-branch', 'teardown']) {
    assert.ok(named(new RegExp(`gate12-sandbox-round\\.sh ${sub} --repo `)), `${sub} --repo`);
  }
  assert.ok(
    named(/gate12-sandbox-round\.sh grade --repo .*--full-run/),
    'grade --repo with --full-run',
  );
});
