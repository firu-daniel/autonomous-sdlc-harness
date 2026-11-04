// test-timing-reporter.mjs — a custom `node:test` reporter that writes one tab-separated record of
// every test file's duration and result for the run.
// Hand-written for this repository; not an `init` output.
//
// WHAT IT OWNS. The record's bytes, and nothing else: it prints nothing to stdout (the `tap`
// reporter given beside it does), decides nothing about rounds and knows no lane path — its
// destination is whatever `--test-reporter-destination` names. `scripts/run-gates.sh` passes it;
// `scripts/lib/gate-round-lib.sh` reads the record; `cli/test/test-timing-reporter.test.mjs` tests it.
//
// THE RECORD — the contract those three share. First line `file\tstatus\tseconds\ttests\tfailed`.
// One row per test file, sorted by `seconds` descending then `file` ascending: `file` relative to
// the working directory with `/` separators, `status` `fail` when `failed > 0` else `pass`,
// `seconds` the sum of the file's top-level test durations in seconds with one decimal, `tests` the
// top-level tests counted, `failed` the failed ones. Last line `end`. Every row is kept: truncation
// belongs to a display, never to the record.
//
// The rule this module exists to enforce: every test file the run reported appears exactly once,
// with no absolute path. A file whose relative form is still absolute (another drive) is left out,
// because the reader refuses a record carrying one.
//
// WHAT COUNTS. A `test:pass` or `test:fail` event at `data.nesting === 0` whose `data.file` is a
// string. A file that fails to load is reported by Node as a nesting-0 `test:fail` for that file and
// is counted the same way. A missing `data.details.duration_ms` counts as 0. Every other event, and
// every event with no `data.file`, contributes nothing.
//
// THE FLOOR — `cli/package.json` → `engines` is `>=20.11.0`. The features this module relies on:
//   1. a custom reporter module passed to `--test-reporter`;
//   2. `--test-reporter` / `--test-reporter-destination` given more than once, pairwise;
//   3. `data.file` on `test:pass` / `test:fail`;
//   4. `data.nesting` on the same events;
//   5. `data.details.duration_ms` on the same events.
// Where that was read, on 2026-11-04:
//   - Node's own documentation history for `node:test` and its CLI flags was NOT read: fetching
//     `doc/api/test.md` and `doc/api/cli.md` at tag v20.11.0 was refused by the implementing
//     session's sandbox. No "added in" version is stated here for any of the five.
//   - `@types/node` 20.19.43 (`node_modules/@types/node/test.d.ts`) declares `TestPass` / `TestFail`
//     with `nesting: number` and `details.duration_ms: number`, and `file?: string` through
//     `LocationInfo`; none of the three carries a `@since` tag, so the declarations show presence on
//     the 20.x line those types track, not at 20.11.
//   - `node --help` on Node v20.19.5 lists `--test-reporter=...` and
//     `--test-reporter-destination=...`, and a `node --test` run on v20.19.5 with `tap` to stdout
//     and this module to a file, each flag given twice, wrote both outputs with rows built from
//     all three fields: all five present at 20.19.5, which `engines` admits.
// So none of the five is shown present at 20.11 by evidence read here. The degraded outcome is
// kept for 3–5: an event without `data.file` or with another `nesting` contributes no row, the
// reader then finds no failing file and runs the round in full. Features 1 and 2 have no degraded
// outcome inside this module: a Node without them rejects the flag before any test runs.
//
// Uses only `node:` builtins.
import path from 'node:path';

const HEADER = 'file\tstatus\tseconds\ttests\tfailed';

export default async function* testTimingReporter(source) {
  const files = new Map();
  for await (const event of source) {
    if (event.type !== 'test:pass' && event.type !== 'test:fail') continue;
    const data = event.data;
    if (data == null || data.nesting !== 0 || typeof data.file !== 'string') continue;
    // Keyed on the relative form so one file reported under two spellings is still one row.
    const file = path.relative(process.cwd(), data.file).split(path.sep).join('/');
    if (path.isAbsolute(file) || path.posix.isAbsolute(file)) continue;
    let entry = files.get(file);
    if (entry === undefined) {
      entry = { ms: 0, tests: 0, failed: 0 };
      files.set(file, entry);
    }
    const ms = data.details?.duration_ms;
    entry.ms += typeof ms === 'number' && Number.isFinite(ms) ? ms : 0;
    entry.tests += 1;
    if (event.type === 'test:fail') entry.failed += 1;
  }

  const rows = [...files].map(([file, { ms, tests, failed }]) => ({
    file,
    seconds: (ms / 1000).toFixed(1),
    tests,
    failed,
  }));
  // Sorted on the printed value, so equal printed seconds fall back to the file order.
  rows.sort((a, b) => Number(b.seconds) - Number(a.seconds) || (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));

  const lines = [HEADER];
  for (const { file, seconds, tests, failed } of rows) {
    lines.push(`${file}\t${failed > 0 ? 'fail' : 'pass'}\t${seconds}\t${tests}\t${failed}`);
  }
  lines.push('end');
  yield `${lines.join('\n')}\n`;
}
