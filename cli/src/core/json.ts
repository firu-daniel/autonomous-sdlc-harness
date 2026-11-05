/**
 * Reading, parsing, serializing and merging JSON, for every JSON file the CLI touches.
 *
 * **The rule this module exists to enforce: {@link mergeMissing} is the CLI's only JSON-merge
 * primitive, and it is non-destructive by construction.** `init` writes into files the adopter
 * shares with other tooling — `.claude/settings.json`, `.mcp.json` — where an overwrite would
 * destroy settings the harness knows nothing about. Rather than asking each generator to be
 * careful, the one merge available adds absent keys and can do nothing else: it cannot
 * overwrite a value, cannot delete a key, and cannot reorder the keys already there. A
 * generator that wants different behaviour is asking for a different re-run contract and
 * belongs in the write engine's `--force` path, which writes a `.bak` sibling first.
 *
 * Nothing here writes a file. Every byte this module formats **into an adopter's repository**
 * reaches the filesystem through `core/writer.ts`, which is what keeps `--dry-run`, the re-run
 * policy and the repo-confinement check ahead of every such write rather than beside some of
 * them. The machine-scoped registry `machine/registry.ts` owns is the single exception: it
 * writes {@link formatJson} output itself, outside any plan and outside `--dry-run`, and states
 * why in its own header.
 *
 * {@link parseJsonText} is the CLI's one parse of an adopter's JSON, whoever read the bytes — a file
 * {@link readJsonFile} read from disk or a blob `core/git.ts` read from a ref — so the failure
 * sentence a caller reports has one wording.
 *
 * It also owns the walk by key path — {@link valueAt}, its throwing forms {@link objectAt} and
 * {@link listAt}, {@link stringsAt} and {@link appendUnique} — so the generators and `doctor` share
 * one body rather than private copies. A throwing form takes its error from the caller: the fault's
 * wording, and whether it is this CLI's fault, belong to the call site.
 */

import { readFileSync } from 'node:fs';

import { HarnessError } from './errors.js';

/** Any value `JSON.parse` can produce. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** A JSON object — the shape every JSON file the CLI reads or merges has at its top level. */
export type JsonObject = { [key: string]: JsonValue };

/**
 * True for a plain JSON object, i.e. not `null` and not an array.
 *
 * The parameter is `unknown` rather than `JsonValue | undefined` so the one predicate serves both
 * kinds of caller — a `JSON.parse` result whose shape is not yet known, and a `JsonValue` being
 * descended through — without either of them casting. It is exported because six modules had
 * written it out for themselves, which is six chances for one of them to drop the `Array.isArray`
 * half and start treating a list as an object.
 */
export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The CLI's single JSON serialization: two-space indent and a trailing newline, so re-writing
 * unchanged content is byte-identical and an idempotent second `init` produces an empty diff.
 *
 * Exported so a caller that needs the text without writing it — a `--dry-run` preview, a
 * comparison against what is already on disk — produces the same bytes the write engine commits,
 * instead of re-deriving the format and drifting from it.
 */
export function formatJson(value: JsonValue): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Parse `text` as JSON, or throw a `HarnessError` reading `<label> is not valid JSON: <detail>`.
 *
 * Unparsable is not absent: text that exists but does not parse throws rather than answering
 * `undefined`, because treating unreadable JSON as absent would let a later write clobber a file
 * the adopter merely mistyped. `label` names where the text came from — a disk path, or a
 * `<ref>:<file>` name.
 *
 * The type parameter is an assertion about the text's shape, not a validation of it; a caller
 * that needs the shape guaranteed validates the parsed value itself.
 */
export function parseJsonText<T extends JsonValue = JsonValue>(text: string, label: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new HarnessError(`${label} is not valid JSON: ${detail}`);
  }
}

/**
 * Read and parse a JSON file.
 *
 * Returns `undefined` when the file does not exist — absence is an ordinary answer here, since
 * the create-if-absent contract asks "is it there?" before every write. A file that exists but
 * does not parse throws {@link parseJsonText}'s `HarnessError` naming the file, for the reason
 * stated there.
 */
export function readJsonFile<T extends JsonValue = JsonValue>(path: string): T | undefined {
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException | null)?.code === 'ENOENT') return undefined;
    throw error;
  }
  return parseJsonText<T>(text, path);
}

/**
 * Add to `target` every key `source` has and `target` lacks, recursively, and return the dotted
 * paths of what was added.
 *
 * What it does **not** do, by construction:
 *
 * - **Never overwrites.** A key present in `target` keeps its value, including when that value
 *   is `null` or an empty string. Present means present, not truthy.
 * - **Never deletes**, and never reorders the keys already in `target` — additions land after
 *   the existing keys, so a merged file's diff is an append.
 * - **Never merges arrays element-wise.** An array is a leaf: added wholesale when absent, left
 *   untouched when present. Appending into an adopter's array would duplicate entries on a
 *   re-run and reorder a list whose order may matter; a generator that must extend a list — the
 *   permission profile's allow entries, say — owns that decision explicitly rather than
 *   inheriting it from a merge helper.
 * - **Never changes a type.** Where `target` holds a scalar or an array and `source` holds an
 *   object (or the reverse), `target` wins and the subtree is skipped; nothing is recorded,
 *   because nothing was added.
 *
 * `target` is mutated in place. Added subtrees are deep-copied out of `source`, so the caller's
 * source object and the merged result never share a reference.
 *
 * The returned paths are the **topmost** key added at each point: a whole subtree absent from
 * `target` is reported once by its root (`permissions`), not leaf by leaf. Segments are joined
 * with `.` for the action log — a key that itself contains a dot is rendered as-is and is
 * therefore ambiguous, which is acceptable for a log line and is not parsed anywhere.
 */
export function mergeMissing(target: JsonObject, source: JsonObject): string[] {
  return mergeMissingInto(target, source, '');
}

function mergeMissingInto(target: JsonObject, source: JsonObject, prefix: string): string[] {
  const added: string[] = [];
  for (const key of Object.keys(source)) {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    const incoming = source[key];
    if (incoming === undefined) continue;

    if (!Object.hasOwn(target, key)) {
      target[key] = structuredClone(incoming);
      added.push(path);
      continue;
    }

    const existing = target[key];
    if (isJsonObject(existing) && isJsonObject(incoming)) {
      added.push(...mergeMissingInto(existing, incoming, path));
    }
    // Anything else: `target` already has a value here and keeps it.
  }
  return added;
}

/** The value at `path` under `root`, or `undefined` where any segment is missing or not an object. */
export function valueAt(root: JsonObject, path: readonly string[]): JsonValue | undefined {
  let current: JsonValue | undefined = root;
  for (const key of path) current = isJsonObject(current) ? current[key] : undefined;
  return current;
}

/** The object at `path` under `root`; otherwise throws what `fault` returns. */
export function objectAt(root: JsonObject, path: readonly string[], fault: () => Error): JsonObject {
  const value = valueAt(root, path);
  if (!isJsonObject(value)) throw fault();
  return value;
}

/** The list at `path` under `root`, mutable in place; otherwise throws what `fault` returns. */
export function listAt(root: JsonObject, path: readonly string[], fault: () => Error): JsonValue[] {
  const value = valueAt(root, path);
  if (!Array.isArray(value)) throw fault();
  return value;
}

/** The string members of `value` when it is a list, or none when it is not. */
export function stringsAt(value: JsonValue | undefined): readonly string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

/** Append `values` to `list`, adding none twice and leaving existing members where they are. */
export function appendUnique(list: JsonValue[], values: readonly string[]): void {
  for (const value of values) if (!list.includes(value)) list.push(value);
}
