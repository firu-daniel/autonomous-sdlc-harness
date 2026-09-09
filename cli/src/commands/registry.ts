/**
 * The command table: the single source for both the usage text and the dispatch check,
 * so the two cannot disagree. Adding a command means adding one row here — the usage
 * block, the per-command `--help` and the dispatch lookup all read this array.
 *
 * A command is a module under `commands/` exporting its own {@link Subcommand}, added to
 * {@link SUBCOMMANDS}. Nothing else has to change for the new behaviour to appear in usage,
 * in the command's own `--help` and in dispatch.
 *
 * Such a module imports its `CommandContext` and `Subcommand` types from here, so the import
 * back is **type-only** and erased at compile time — the table can list a real command's row
 * without a runtime import cycle.
 */

import type { Reporter } from '../core/report.js';
import { CONFIG_COMMAND } from './config.js';
import { DAEMON_COMMAND } from './daemon.js';
import { DOCTOR_COMMAND } from './doctor.js';
import { INIT_COMMAND } from './init.js';

/** The global flags `cli.ts` parses out of argv before a command sees it. */
export interface GlobalFlags {
  readonly help: boolean;
  readonly version: boolean;
  /** Print what would be written and write nothing. */
  readonly dryRun: boolean;
  /**
   * Overwrite a create-if-absent artifact, after a `.bak` sibling has been written — never
   * `harness.config.json`, which `init` reads whenever it is there and which `init --reset-config`
   * alone rebuilds, so the values a `--force` run regenerates from are still the adopter's.
   */
  readonly force: boolean;
  /** Suppress the stdout side of the reporter. */
  readonly quiet: boolean;
  /**
   * Never prompt: take each prompt's documented default, which is this release's
   * non-interactive behaviour. See `core/prompt.ts` for the rule this flag forces.
   */
  readonly nonInteractive: boolean;
}

/** Everything a command is handed. It never reads `process.argv` or `process.cwd()` itself. */
export interface CommandContext {
  /** The arguments left after the command name and the recognised global flags were removed. */
  readonly argv: string[];
  readonly flags: GlobalFlags;
  /** Absolute path of the directory the command acts on: `--cwd` if given, else the process cwd. */
  readonly cwd: string;
  readonly report: Reporter;
}

export interface Subcommand {
  readonly name: string;
  /** One line, used in the usage block and as the header of the command's own `--help`. */
  readonly summary: string;
  /**
   * The roadmap item that implemented this command, as numbered by `docs/development.md`'s
   * legend. Provenance for the reader: no usage or help output renders it.
   */
  readonly roadmapItem?: number;
  /** Command-specific usage lines rendered under the synopsis. Filled in as commands gain flags. */
  readonly usage?: readonly string[];
  /** Returns the exit code. Throw a `HarnessError` to refuse; see `core/errors.ts`. */
  run(ctx: CommandContext): Promise<number>;
}

export const SUBCOMMANDS: ReadonlyArray<Subcommand> = [
  INIT_COMMAND,
  DOCTOR_COMMAND,
  CONFIG_COMMAND,
  DAEMON_COMMAND,
];

/** The dispatch check. Returns `undefined` for an unknown command. */
export function findSubcommand(name: string): Subcommand | undefined {
  return SUBCOMMANDS.find((command) => command.name === name);
}

/** The `Commands:` rows of the usage block, name-aligned. */
export function commandListLines(): readonly string[] {
  const width = Math.max(...SUBCOMMANDS.map((command) => command.name.length));
  return SUBCOMMANDS.map((command) => `  ${command.name.padEnd(width)}  ${command.summary}`);
}

/** One command's own usage, without the global options block the entry point appends. */
export function commandSynopsis(command: Subcommand): readonly string[] {
  return [
    `npx autonomous-sdlc-harness ${command.name} — ${command.summary}`,
    '',
    `Usage: npx autonomous-sdlc-harness ${command.name} [options]`,
    ...(command.usage === undefined ? [] : ['', ...command.usage]),
  ];
}
