/**
 * Loading a labelled query set, and proving every label still names a real chunk.
 *
 * **The rule this module exists to enforce: a label that no longer resolves to a heading in the
 * corpus fails the run loudly, rather than quietly costing the arm a hit.** A heading renamed in
 * `docs/` moves the anchor a `ref` is written against, so an unchecked set silently reports every
 * arm as worse; {@link assertLabelsResolve} is what turns that into a refusal naming the label.
 *
 * The record format — `id`, `query`, `labels: [{ ref, grade }]`, an empty `labels` array meaning
 * a negative query, and the optional `situation`, `intent`, `origin` and `negativeKind` — is stated in `docs/retrieval-eval.md` → `## The query-set format`, and
 * checked here. A negative query is *skipped* by the label check rather than exempted from it by a
 * flag: it has no labels, so there is nothing to resolve.
 *
 * Each loaded record carries two fields the file does not: `line`, the 1-based line it was parsed
 * from, and `source`, the path it came from — both so a refusal can name them.
 */

import { readFileSync } from 'node:fs';

/** The inclusive grade range a label may carry. */
const GRADE_MIN = 1;
const GRADE_MAX = 3;

/** The one declaration of `negativeKind`'s closed value set; a consumer imports it, never retypes it. */
export const NEGATIVE_KINDS = Object.freeze({ far: 'far', near: 'near' });

const INTENTS = Object.freeze(['surroundings', 'convention', 'contract']);
const ORIGINS = Object.freeze(['written', 'harvested']);

function refuse(file, line, message) {
  throw new Error(`eval: ${file}:${line} ${message}`);
}

function refuseOutsideSet(file, line, record, field, legal) {
  const value = record[field];
  if (value === undefined || legal.includes(value)) return;
  refuse(file, line, `field ${field}: ${JSON.stringify(value)} is not one of ${legal.join(', ')} (id ${record.id})`);
}

/**
 * Every record of the JSONL query set at `path`, in file order.
 *
 * Refuses a malformed line, a duplicate `id`, a missing `query`, a malformed `labels` array, a
 * missing `ref`, a `grade` that is not an integer in `1`–`3`, an optional field outside its legal
 * values and a `negativeKind` on a positive, each naming the file, the line number and the field.
 * An absent optional field loads as `undefined`.
 */
export function loadQueries(path) {
  const text = readFileSync(path, 'utf8');
  const queries = [];
  const seen = new Map();

  text.split('\n').forEach((raw, index) => {
    const line = index + 1;
    if (raw.trim() === '') return;

    let record;
    try {
      record = JSON.parse(raw);
    } catch (error) {
      refuse(path, line, `is not one JSON object per line: ${error.message}`);
    }
    if (record === null || typeof record !== 'object' || Array.isArray(record)) {
      refuse(path, line, 'is not a JSON object');
    }
    if (typeof record.id !== 'string' || record.id === '') {
      refuse(path, line, 'field id: missing, or not a non-empty string');
    }
    if (seen.has(record.id)) {
      refuse(path, line, `field id: ${record.id} is already used on line ${seen.get(record.id)}`);
    }
    if (typeof record.query !== 'string' || record.query.trim() === '') {
      refuse(path, line, `field query: missing, or not a non-empty string (id ${record.id})`);
    }
    if (!Array.isArray(record.labels)) {
      refuse(path, line, `field labels: missing, or not an array (id ${record.id})`);
    }
    for (const label of record.labels) {
      if (label === null || typeof label !== 'object' || Array.isArray(label)) {
        refuse(path, line, `field labels: an entry is not an object (id ${record.id})`);
      }
      if (typeof label.ref !== 'string' || label.ref === '') {
        refuse(path, line, `field labels[].ref: missing, or not a non-empty string (id ${record.id})`);
      }
      if (!Number.isInteger(label.grade) || label.grade < GRADE_MIN || label.grade > GRADE_MAX) {
        refuse(
          path,
          line,
          `field labels[].grade: ${JSON.stringify(label.grade)} of ${label.ref} is not an integer ` +
            `${GRADE_MIN}-${GRADE_MAX} (id ${record.id})`,
        );
      }
    }

    if (
      record.situation !== undefined &&
      (typeof record.situation !== 'string' || record.situation.trim() === '')
    ) {
      refuse(path, line, `field situation: not a non-empty string (id ${record.id})`);
    }
    refuseOutsideSet(path, line, record, 'intent', INTENTS);
    refuseOutsideSet(path, line, record, 'origin', ORIGINS);
    refuseOutsideSet(path, line, record, 'negativeKind', Object.values(NEGATIVE_KINDS));
    if (record.negativeKind !== undefined && record.labels.length > 0) {
      refuse(path, line, `field negativeKind: set on a positive query (id ${record.id})`);
    }

    seen.set(record.id, line);
    queries.push({
      id: record.id,
      query: record.query,
      labels: record.labels,
      line,
      source: path,
      situation: record.situation,
      intent: record.intent,
      origin: record.origin,
      negativeKind: record.negativeKind,
    });
  });

  return queries;
}

/**
 * Refuses unless every `ref` of every label is a member of `chunkKeys` — the `key` set of the chunks
 * the index was just built from, which is `path#anchor` or `path` alone, the same string
 * `SearchHit.ref` renders (`cli/src/retrieval/search.ts`).
 *
 * `corpusId` is the id the miss is reported against; it is not derivable from the query set, whose
 * name binds it to a corpus only by convention (`evals/docs-retrieval/queries/README.md`).
 */
export function assertLabelsResolve(queries, chunkKeys, corpusId) {
  const keys = chunkKeys instanceof Set ? chunkKeys : new Set(chunkKeys);
  for (const query of queries) {
    for (const label of query.labels) {
      if (keys.has(label.ref)) continue;
      throw new Error(
        `eval: label ${label.ref} (query ${query.id}, ${query.source}) resolves to no chunk in corpus ${corpusId}`,
      );
    }
  }
}
