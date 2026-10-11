#!/usr/bin/env node
// validate.mjs — validate JSON data files against a JSON Schema for the `validate:*` npm scripts.
// Hand-written for this repository; not an `init` output.
//
// THE RULE. Each subcommand's outcome, message and exit code are the ones `ajv-cli` 5.0.0 gave these
// scripts, so `npm run validate:*` and the gate text in `docs/development.md` that reads them keep
// their meaning:
//   validate, valid        stdout `<file> valid`                                       exit 0
//   validate, invalid      stderr `<file> invalid`, then the ajv errors array          exit 1
//   test --invalid, rejected  stdout `<file> passed test`, then the errors array       exit 0
//   test --invalid, accepted  stderr `<file> failed test`, no errors array             exit 1
//   unreadable file        stderr `error: Cannot find data file <file>` (or schema)    exit 2
//   bad usage              stderr a usage line                                         exit 2
// The errors array is printed as `ajv-cli`'s default `--errors=js` printed it: the array itself,
// through console.log / console.error. Ajv is the `ajv` default export (draft-07) with no options
// argument, so strict mode stays on; no ajv-formats and no extra schema is loaded, because neither
// schema uses `format` or an external `$ref`.
//
// Why not `ajv-cli`: 5.0.0 is its latest release and pins fast-json-patch ^2 (GHSA-8gh8-hqwg-xf34),
// js-yaml ^3 -> argparse 1 -> sprintf-js (GHSA-hp3w-g68c-fv3c) and glob 7 -> minimatch 3 ->
// brace-expansion; no 5.x release fixes them.
// Why under `schemas/`: the root `package.json` travels to `main`, and `scripts/` does not
// (`scripts/publish-main.sh` -> `removed_paths`), so a validator there would fail on `main`.
//
// Usage: node schemas/validate.mjs validate -s <schema> -d <file> [-d <file> ...]
//        node schemas/validate.mjs test -s <schema> -d <file> [-d <file> ...] --invalid
// Exit: 0 every -d file met its expectation · 1 one or more did not, or the schema does not compile
//       · 2 bad usage, or a data or schema file that cannot be read or parsed
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const USAGE =
  'usage: node schemas/validate.mjs validate -s <schema> -d <file>... | test -s <schema> -d <file>... --invalid';

function parseArgs(argv) {
  const positionals = [];
  const schemas = [];
  const data = [];
  let invalid = 0;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-s' || arg === '-d') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('-')) return null;
      (arg === '-s' ? schemas : data).push(value);
      i += 1;
    } else if (arg === '--invalid') {
      invalid += 1;
    } else if (arg.startsWith('-')) {
      return null;
    } else {
      positionals.push(arg);
    }
  }
  if (positionals.length !== 1 || schemas.length !== 1 || data.length < 1 || invalid > 1) return null;
  const [command] = positionals;
  if (command === 'validate' && invalid === 0) return { command, schema: schemas[0], data };
  if (command === 'test' && invalid === 1) return { command, schema: schemas[0], data };
  return null;
}

/** Returns the parsed JSON, or `undefined` after printing the unreadable-file line. */
function openFile(file, kind) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    console.error(`error: Cannot find ${kind} file ${file}`);
    return undefined;
  }
}

function main(argv) {
  const args = parseArgs(argv);
  if (args === null) {
    console.error(USAGE);
    return 2;
  }

  const schema = openFile(args.schema, 'schema');
  if (schema === undefined) return 2;

  const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: dirname(fileURLToPath(import.meta.url)),
    encoding: 'utf8',
  }).trim();
  // Resolved from the workspace root, where `package.json` declares it as a devDependency.
  const Ajv = createRequire(join(repoRoot, 'package.json'))('ajv').default;
  const ajv = new Ajv();

  let validate;
  try {
    validate = ajv.compile(schema);
  } catch (err) {
    console.error(`schema ${args.schema} is invalid`);
    console.error(`error: ${err.message}`);
    return 1;
  }

  let allMet = true;
  for (const file of args.data) {
    const data = openFile(file, 'data');
    if (data === undefined) return 2;
    const valid = validate(data);
    if (args.command === 'validate') {
      if (valid) {
        console.log(`${file} valid`);
      } else {
        console.error(`${file} invalid`);
        console.error(validate.errors);
        allMet = false;
      }
    } else if (!valid) {
      console.log(`${file} passed test`);
      console.log(validate.errors);
    } else {
      console.error(`${file} failed test`);
      allMet = false;
    }
  }
  return allMet ? 0 : 1;
}

process.exitCode = main(process.argv.slice(2));
