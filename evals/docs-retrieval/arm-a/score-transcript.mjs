/**
 * Turning an arm A hand-run transcript into the records the docs-retrieval eval scores every arm by.
 *
 * **The rule this module exists to enforce: its output is the runner's input, not a stand-alone
 * report.** The consumer is `evals/docs-retrieval/run.mjs`, which calls {@link scoreTranscript} when
 * it is given `--transcript <path>` and passes the records into the same rendering path as arms B–E,
 * so arm A's row in `docs/retrieval-eval-results.md` is generated like every other row and never
 * hand-written. Nothing here writes a results file, and nothing here renders a table.
 *
 * **The contract existed before this module did.** `evals/docs-retrieval/args.mjs` declared
 * `--transcript` and `evals/docs-retrieval/run.mjs` landed its reader one task earlier, refusing by
 * name while this file was absent — the same contract-before-consumer hand-off
 * `.claude/context/conventions.md` → `### The order files are created…` requires, and the one the
 * regression floor's pointer uses.
 *
 * **A ref is normalised, never repaired.** Leading and trailing whitespace goes, a leading `./` goes,
 * a trailing slash goes, and everything else is left exactly as the agent wrote it: a misspelled or
 * invented ref is a miss, which is the measurement. The single answer `none` — and an answer with no
 * refs at all, which is the same behaviour spelled differently — becomes zero hits and
 * `abstained: true`. A `none` sitting *among* other refs is left as a ref and misses, because an
 * answer that both abstains and does not is not an abstention to be inferred.
 *
 * **Arm A returns an order and no score, so `hits[].score` is the reciprocal of the hit's position.**
 * That is a rank-derived value of the same class as the RRF values arms B–D report, and it is not
 * comparable to arm E's calibrated cross-encoder score — the warning
 * `evals/docs-retrieval/results.mjs` prints under every table. The abstention threshold is
 * calibrated on arm E alone, and no arm A score enters it.
 */

import { readFileSync } from 'node:fs';

/** The arm letter these records carry. `evals/docs-retrieval/arms.mjs` owns the table; this is its one arm with no mode. */
const NAVIGATION_LETTER = 'A';

/** The answer that means "this catalog does not cover the question", per `agent-task.md`. */
const ABSTENTION_TOKEN = 'none';

/** Trim, drop a leading `./`, drop a trailing slash. Nothing else. */
function normalizeRef(raw) {
  return String(raw)
    .trim()
    .replace(/^\.\//u, '')
    .replace(/\/$/u, '');
}

/**
 * Every record of the transcript at `path`, in file order.
 *
 * Two shapes are read, because a run and a hand-written fixture are appended to differently:
 * `evals/docs-retrieval/arm-a/run-arm-a.sh` appends **one JSON object per line** as each query
 * finishes, so an interrupted run keeps the records it took; a hand-written transcript is a **JSON
 * array**, or an object carrying that array under `records` — which is the form
 * `evals/docs-retrieval/arm-a/sample-transcript.json` takes, because JSON has no comment syntax and
 * that file has to say in itself what it is for. Each record is identical in all three.
 */
function readTranscript(path) {
  const text = readFileSync(path, 'utf8');
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed !== null && typeof parsed === 'object') {
      return Array.isArray(parsed.records) ? parsed.records : [parsed];
    }
  } catch {
    // Not one JSON document, so it is the appended form: one object per line.
  }
  return text
    .split('\n')
    .map((line, index) => ({ line: index + 1, raw: line }))
    .filter(({ raw }) => raw.trim() !== '')
    .map(({ line, raw }) => {
      try {
        return JSON.parse(raw);
      } catch (error) {
        throw new Error(`eval: ${path}:${line} is neither a JSON array nor one JSON object per line: ${error.message}`);
      }
    });
}

/** Every numeric field of every record's usage block, summed by field name. */
function sumUsage(records) {
  const totals = new Map();
  for (const record of records) {
    const usage = record.usage;
    if (usage === null || typeof usage !== 'object') continue;
    for (const [key, value] of Object.entries(usage)) {
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;
      totals.set(key, (totals.get(key) ?? 0) + value);
    }
  }
  return totals;
}

/**
 * The `cost` cell `evals/docs-retrieval/results.mjs` prints for this arm, or `undefined` when the
 * transcript carried no usage figures at all — an absent total is never rendered as a zero one.
 */
function costCell(records) {
  const totals = sumUsage(records);
  if (totals.size === 0) return undefined;
  const parts = [...totals.keys()].sort().map((key) => `${key} ${totals.get(key)}`);
  return `agent hand run over ${records.length} queries — ${parts.join(', ')}`;
}

/**
 * The records and token cost of one arm A transcript.
 *
 * `transcript` is a path; `queries` is `evals/docs-retrieval/queries.mjs` → `loadQueries`'s return.
 * Returns `{ records, cost }`, where each record is
 * `{ id, arm: 'A', hits: [{ ref, score }], abstained, durationMs }` — the shape
 * `evals/docs-retrieval/arms.mjs` → `runArm` produces — and `cost` is the rendered token total.
 *
 * The records are handed back rather than scored here, and `evals/docs-retrieval/run.mjs` passes them
 * to `evals/docs-retrieval/metrics.mjs` → `scoreArm` with the same call it makes for every other arm.
 * That is the single scoring path: computing the metrics here as well would score the set twice and
 * hand the caller a shape its `--transcript` reader does not take.
 *
 * Refuses, naming the id, on a transcript record that answers no query in the set. A query with no
 * record is `scoreArm`'s own refusal, so a short transcript fails there rather than being padded here.
 */
export function scoreTranscript({ transcript, queries }) {
  const known = new Set(queries.map((query) => query.id));
  const parsed = readTranscript(transcript);

  const records = parsed.map((entry, index) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`eval: ${transcript} record ${index + 1} is not a JSON object`);
    }
    if (typeof entry.id !== 'string' || entry.id === '') {
      throw new Error(`eval: ${transcript} record ${index + 1} carries no id, so it cannot be matched to a query`);
    }
    if (!known.has(entry.id)) {
      throw new Error(
        `eval: ${transcript} record ${entry.id} answers no query in the set, so arm A cannot be scored from it`,
      );
    }
    if (!Array.isArray(entry.refs)) {
      throw new Error(`eval: ${transcript} record ${entry.id} carries no refs array`);
    }

    const refs = entry.refs.map(normalizeRef).filter((ref) => ref !== '');
    const abstention = refs.length === 0 || (refs.length === 1 && refs[0].toLowerCase() === ABSTENTION_TOKEN);
    const hits = abstention ? [] : refs.map((ref, position) => ({ ref, score: 1 / (position + 1) }));

    return {
      id: entry.id,
      arm: NAVIGATION_LETTER,
      hits,
      abstained: abstention,
      durationMs: typeof entry.durationMs === 'number' ? entry.durationMs : [],
    };
  });

  return { records, cost: costCell(parsed) };
}
