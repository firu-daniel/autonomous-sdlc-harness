import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { WORKSPACE_ROOT } from './helpers/fixture.mjs';

/**
 * The one property of `core/prompt.ts` no behavioural test in this suite can reach.
 *
 * Every other case here runs the CLI as a subprocess whose stdin is a pipe, which exercises the
 * side of each prompt that *cannot* be asked. The side that can is a real terminal, and the way
 * this module broke it was not a wrong answer but a wrong *probe*: reading `process.stdin.isTTY`
 * constructs a `tty.ReadStream` on fd 0 and leaves the descriptor non-blocking, so the module's
 * own `readSync` then throws `EAGAIN` and every question takes its default after a second of
 * retries. No pipe reproduces that and this package has no pseudo-terminal to test it with, so
 * the guard is on the source: the module asks `node:tty` about the descriptors and never opens
 * the stream.
 */
test('core/prompt.ts probes the terminal by descriptor and never touches process.stdin', () => {
  const source = readFileSync(join(WORKSPACE_ROOT, 'cli', 'src', 'core', 'prompt.ts'), 'utf8');
  const code = source.replace(/\/\*\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  assert.ok(
    !code.includes('process.stdin'),
    'core/prompt.ts reads fd 0 with readSync; touching process.stdin sets that descriptor non-blocking and every prompt then takes its default',
  );
  assert.match(code, /from 'node:tty'/);
  assert.match(code, /isatty\(STDIN_FD\)/);
});
