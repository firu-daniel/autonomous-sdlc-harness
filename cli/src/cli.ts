#!/usr/bin/env node
/**
 * autonomous-sdlc-harness — CLI entry point.
 *
 * Scope of this file: argv handling and dispatch, and nothing else. It parses the global
 * flags into a `CommandContext`, resolves the command against `commands/registry.ts`, and
 * hands off. Command behaviour lives behind `Subcommand.run`; this file detects no stack,
 * reads no config and touches no filesystem — it only resolves `--cwd` to an absolute path.
 *
 * **This is the only place an error becomes an exit code.** A `HarnessError` thrown
 * anywhere below prints `autonomous-sdlc-harness: <message>` on stderr and yields its own
 * `exitCode`; any other thrown value prints with an `(unexpected)` suffix and yields
 * `EXIT.INTERNAL`. No other module inspects or assigns exit codes, and nothing in the CLI
 * calls `process.exit()` — the contract lives in `core/errors.ts`.
 *
 * One constraint every command inherits: **never shell out to `rm -rf`.** A user-level
 * `permissions.deny` rule on it is realistic, deny is evaluated before any allow and cannot
 * be overridden, so a teardown implemented as a shelled-out `rm -rf` is silently blocked
 * with no useful error. Use Node's in-process `fs.rm` instead.
 */

import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import {
  commandListLines,
  commandSynopsis,
  findSubcommand,
  type CommandContext,
  type GlobalFlags,
  type Subcommand,
} from './commands/registry.js';
import { EXIT, HarnessError } from './core/errors.js';
import { Reporter } from './core/report.js';

// Read the version from the manifest so `--version` cannot drift from package.json.
// From dist/cli.js this resolves to cli/package.json. Deliberately not a static JSON
// import: `resolveJsonModule` under `rootDir: "src"` would drag the manifest into dist/.
const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

type MutableGlobalFlags = { -readonly [K in keyof GlobalFlags]: GlobalFlags[K] };

/**
 * The global flag table: the single source for both the parser below and the `Options:`
 * block of the usage text, so the two cannot disagree. `value` present means the option
 * consumes the next argument (or an inline `--name=value`).
 *
 * Deliberately hand-rolled: the CLI package declares no runtime dependencies and a flag
 * parser is not worth the first one.
 */
const GLOBAL_OPTIONS: ReadonlyArray<{
  readonly key: keyof MutableGlobalFlags | 'cwd';
  readonly aliases: readonly string[];
  readonly value?: string;
  readonly summary: string;
}> = [
  { key: 'help', aliases: ['-h', '--help'], summary: 'Print usage — for the harness, or for <command> — and exit 0' },
  { key: 'version', aliases: ['-v', '--version'], summary: 'Print the version and exit 0' },
  { key: 'dryRun', aliases: ['--dry-run'], summary: 'Print what would be written and write nothing' },
  {
    key: 'force',
    aliases: ['--force'],
    summary:
      'Overwrite an existing generated file, after a .bak; never harness.config.json, which init reads (--reset-config rebuilds it)',
  },
  {
    key: 'quiet',
    aliases: ['--quiet'],
    summary: 'Suppress progress narration; results, warnings and failures still print',
  },
  {
    key: 'nonInteractive',
    aliases: ['--non-interactive'],
    summary: "Never prompt: take each prompt's documented default",
  },
  { key: 'cwd', aliases: ['--cwd'], value: '<path>', summary: 'Act on this directory instead of the current one' },
];

interface ParsedArgv {
  /** The first non-flag argument, or `undefined` when only global flags were given. */
  readonly command: string | undefined;
  /** Everything the parser did not recognise, in argv order, left for the subcommand. */
  readonly argv: string[];
  readonly flags: GlobalFlags;
  /** `--cwd` resolved to an absolute path, defaulting to the process cwd. */
  readonly cwd: string;
}

/**
 * Consume the recognised global flags wherever they appear and leave everything else —
 * unknown flags included — for the subcommand. `--` stops parsing: every argument after it
 * is passed through untouched.
 */
function parseArgv(argv: readonly string[]): ParsedArgv {
  const flags: MutableGlobalFlags = {
    help: false,
    version: false,
    dryRun: false,
    force: false,
    quiet: false,
    nonInteractive: false,
  };
  let cwdOption: string | undefined;
  let command: string | undefined;
  const rest: string[] = [];
  let passthrough = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index] as string;

    if (passthrough) {
      rest.push(token);
      continue;
    }
    if (token === '--') {
      passthrough = true;
      continue;
    }

    const separator = token.startsWith('--') ? token.indexOf('=') : -1;
    const name = separator > 0 ? token.slice(0, separator) : token;
    const inlineValue = separator > 0 ? token.slice(separator + 1) : undefined;
    const option = GLOBAL_OPTIONS.find((candidate) => candidate.aliases.includes(name));

    if (option === undefined) {
      if (command === undefined && !token.startsWith('-')) command = token;
      else rest.push(token);
      continue;
    }

    if (option.value === undefined) {
      if (inlineValue !== undefined) throw new HarnessError(`${name} does not take a value`);
      flags[option.key as keyof MutableGlobalFlags] = true;
      continue;
    }

    let value = inlineValue;
    if (value === undefined) {
      index += 1;
      value = argv[index];
    }
    if (value === undefined || value === '') throw new HarnessError(`${name} requires ${option.value}`);
    cwdOption = value;
  }

  return { command, argv: rest, flags, cwd: resolve(cwdOption ?? '.') };
}

/** The `Options:` rows, invocation-aligned, derived from {@link GLOBAL_OPTIONS}. */
function optionLines(): readonly string[] {
  const invocations = GLOBAL_OPTIONS.map(
    (option) => `${option.aliases.join(', ')}${option.value === undefined ? '' : ` ${option.value}`}`,
  );
  const width = Math.max(...invocations.map((invocation) => invocation.length));
  return GLOBAL_OPTIONS.map((option, index) => `  ${(invocations[index] as string).padEnd(width)}  ${option.summary}`);
}

function usage(): string {
  return [
    `autonomous-sdlc-harness ${version}`,
    '',
    'Usage: npx autonomous-sdlc-harness <command> [options]',
    '',
    'Commands:',
    ...commandListLines(),
    '',
    'Options:',
    ...optionLines(),
    '',
    "Run `npx autonomous-sdlc-harness <command> --help` for a command's own usage.",
  ].join('\n');
}

function commandUsage(command: Subcommand): string {
  return [...commandSynopsis(command), '', 'Options:', ...optionLines()].join('\n');
}

/** Parse, resolve and dispatch. Returns the exit code; throws for every failure path. */
async function dispatch(rawArgv: readonly string[]): Promise<number> {
  const parsed = parseArgv(rawArgv);

  if (parsed.command === undefined) {
    if (parsed.flags.version) {
      // Bare semver, no prefix, so a script can consume it directly.
      console.log(version);
      return EXIT.OK;
    }
    // No command at all is the same request as `--help`.
    console.log(usage());
    return EXIT.OK;
  }

  const command = findSubcommand(parsed.command);
  if (command === undefined) {
    console.error(`autonomous-sdlc-harness: unknown command '${parsed.command}'`);
    console.error(usage());
    return EXIT.FAILURE;
  }

  // `<command> --help` and `<command> --version` answer for themselves and exit 0 — they
  // never reach `run`, so they stay safe to invoke against a command that writes files.
  if (parsed.flags.help) {
    console.log(commandUsage(command));
    return EXIT.OK;
  }
  if (parsed.flags.version) {
    console.log(version);
    return EXIT.OK;
  }

  const context: CommandContext = {
    argv: parsed.argv,
    flags: parsed.flags,
    cwd: parsed.cwd,
    report: new Reporter({ quiet: parsed.flags.quiet }),
  };
  return command.run(context);
}

async function main(rawArgv: readonly string[]): Promise<number> {
  try {
    return await dispatch(rawArgv);
  } catch (error) {
    if (error instanceof HarnessError) {
      console.error(`autonomous-sdlc-harness: ${error.message}`);
      return error.exitCode;
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`autonomous-sdlc-harness: ${message} (unexpected)`);
    return EXIT.INTERNAL;
  }
}

// Set `exitCode` rather than calling `process.exit()`: on POSIX, stdout to a pipe is
// asynchronous, and exiting outright can truncate the usage block mid-write.
process.exitCode = await main(process.argv.slice(2));
