/**
 * The CLI's single output surface.
 *
 * Every command writes through a `Reporter` rather than calling `console` directly, so
 * three properties hold in one place: `--quiet` behaves the same everywhere, the write
 * engine's action log and the human-readable log are the same log, and the output is
 * **plain ASCII** — no colour escapes and no emoji — so a test can diff it verbatim.
 *
 * Markers: `+` something was written (or would be), `~` an existing file was merged into,
 * `=` an existing file was left as it stood, `!` needs attention (a warning or a failure).
 *
 * Streams: `info` / `step` / `ok` / action lines and `summary()` go to stdout and are what
 * `--quiet` suppresses; `warn` and `fail` go to stderr and print whatever the flags are; `result()`
 * goes to stdout and prints whatever the flags are. So `--quiet` suppresses **narration**, not
 * output: a quiet run still prints every command answer its command routed through `result()`.
 */

/**
 * What the write engine (roadmap item 13's re-run contract, `core/writer.ts`) did to one path.
 *
 * - `created` — the file did not exist and was written.
 * - `merged` — the file existed and was updated key-wise or line-wise, never overwritten.
 * - `kept` — the file existed and was left exactly as it was.
 * - `ensured` — a directory exists, having been created or already been there.
 * - `replaced` — `--force` on a create-if-absent artifact: a `.bak` sibling was written and the
 *   file was then overwritten. The `.bak` name goes in the record's `detail`.
 *
 * Each has a `would-` twin recorded under `--dry-run`, where the outcome is computed against
 * the real filesystem and nothing is written.
 */
export type ActionKind =
  | 'created'
  | 'merged'
  | 'kept'
  | 'ensured'
  | 'replaced'
  | 'would-create'
  | 'would-merge'
  | 'would-keep'
  | 'would-ensure'
  | 'would-replace';

/** One entry in the action log. `path` is repo-relative wherever the caller can make it so. */
export interface ActionRecord {
  readonly kind: ActionKind;
  readonly path: string;
  /** Optional short qualifier rendered in parentheses, e.g. `2 keys added`. */
  readonly detail?: string;
}

export interface ReporterOptions {
  /**
   * Suppress the stdout narration (info, step, ok, action lines, summary). Warnings, failures and
   * {@link Reporter.result} lines still print.
   */
  readonly quiet?: boolean;
  /** Sink for stdout lines. Injectable so a test can capture output without a subprocess. */
  readonly out?: (line: string) => void;
  /** Sink for stderr lines. */
  readonly err?: (line: string) => void;
}

const ACTION_MARKER: Readonly<Record<ActionKind, string>> = {
  created: '+',
  merged: '~',
  kept: '=',
  ensured: '+',
  replaced: '+',
  'would-create': '+',
  'would-merge': '~',
  'would-keep': '=',
  'would-ensure': '+',
  'would-replace': '+',
};

const ACTION_LABEL: Readonly<Record<ActionKind, string>> = {
  created: 'created',
  merged: 'merged',
  kept: 'kept',
  ensured: 'ensured',
  replaced: 'replaced',
  'would-create': 'would create',
  'would-merge': 'would merge',
  'would-keep': 'would keep',
  'would-ensure': 'would ensure',
  'would-replace': 'would replace',
};

/** Fixed order for the summary counts, so two runs of the same shape render identically. */
const ACTION_ORDER: readonly ActionKind[] = [
  'created',
  'merged',
  'kept',
  'ensured',
  'replaced',
  'would-create',
  'would-merge',
  'would-keep',
  'would-ensure',
  'would-replace',
];

/** Width of the widest label in {@link ACTION_LABEL}, so action lines column-align. */
const LABEL_WIDTH = Math.max(...Object.values(ACTION_LABEL).map((label) => label.length));

export class Reporter {
  readonly #quiet: boolean;
  readonly #out: (line: string) => void;
  readonly #err: (line: string) => void;
  readonly #actions: ActionRecord[] = [];

  constructor(options: ReporterOptions = {}) {
    this.#quiet = options.quiet ?? false;
    this.#out = options.out ?? ((line) => console.log(line));
    this.#err = options.err ?? ((line) => console.error(line));
  }

  get quiet(): boolean {
    return this.#quiet;
  }

  /** The action log, in the order it was recorded. */
  get actions(): readonly ActionRecord[] {
    return this.#actions;
  }

  /** A plain line of narration. */
  info(message: string): void {
    if (!this.#quiet) this.#out(message);
  }

  /** A section heading — one per generator, so a long `init` run reads as a list of stages. */
  step(message: string): void {
    if (!this.#quiet) this.#out(`== ${message}`);
  }

  /** Something succeeded. */
  ok(message: string): void {
    if (!this.#quiet) this.#out(`+ ${message}`);
  }

  /** Something needs attention but does not stop the command. Always printed, even under `--quiet`. */
  warn(message: string): void {
    this.#err(`! ${message}`);
  }

  /** Something failed. Always printed, even under `--quiet`. Does not set an exit code — see `core/errors.ts`. */
  fail(message: string): void {
    this.#err(`!! ${message}`);
  }

  /**
   * A line that is the command's **answer** rather than its narration: printed on stdout even under
   * `--quiet`.
   *
   * `doctor`'s counts summary is what this exists for. Its `--quiet` means "print what needs
   * attention, and the verdict" — and since warnings and failures go to stderr, routing the verdict
   * through {@link info} would leave a quiet run with nothing on stdout to read the result from,
   * while routing it to stderr would put one line on two different streams depending on a flag.
   * Narration stays on {@link info}; this is for the one line a caller came for.
   */
  result(line: string): void {
    this.#out(line);
  }

  /** Record what happened to one path, and narrate it unless quiet. */
  action(record: ActionRecord): void {
    this.#actions.push(record);
    if (this.#quiet) return;
    const suffix = record.detail === undefined ? '' : ` (${record.detail})`;
    const label = ACTION_LABEL[record.kind].padEnd(LABEL_WIDTH);
    this.#out(`${ACTION_MARKER[record.kind]} ${label}  ${record.path}${suffix}`);
  }

  /** How many actions of each kind were recorded. */
  counts(): Readonly<Record<ActionKind, number>> {
    // Typed as a total record, so adding a kind above is a compile error here until it is
    // seeded — the counts cannot silently omit one.
    const counts: Record<ActionKind, number> = {
      created: 0,
      merged: 0,
      kept: 0,
      ensured: 0,
      replaced: 0,
      'would-create': 0,
      'would-merge': 0,
      'would-keep': 0,
      'would-ensure': 0,
      'would-replace': 0,
    };
    for (const record of this.#actions) counts[record.kind] += 1;
    return counts;
  }

  /**
   * Render the action counts as one line, print it unless quiet, and return it so a caller
   * or a test can assert on it without capturing the stream.
   */
  summary(): string {
    const counts = this.counts();
    const parts = ACTION_ORDER.filter((kind) => counts[kind] > 0).map(
      (kind) => `${counts[kind]} ${ACTION_LABEL[kind]}`,
    );
    const line = parts.length === 0 ? 'Summary: no changes' : `Summary: ${parts.join(', ')}`;
    this.info(line);
    return line;
  }
}
