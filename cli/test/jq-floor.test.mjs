import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

/**
 * The rule this suite exists to enforce: no shipped `.jq` program uses the syntax jq 1.7 relaxed
 * and jq 1.5 and 1.6 reject — a jq keyword as a `$` variable, a `.` field or an object key, or an
 * `if` with no `else`. It reads the source; it does not show that a program parses on any jq.
 *
 * jq 1.7 relaxed both, so a 1.7+ host runs a program that Debian 12's jq 1.6 rejects whole. The
 * guard is on the source because no jq older than the host's is reachable from this suite:
 * fetching one needs the network, and vendoring a binary breaks the no-runtime-dependency rule.
 *
 * Not covered here, and left to `docs/development.md` → Gate 4 → **The suite under jq 1.6, by
 * hand.**:
 *
 * - Builtins newer than jq 1.5. Each program's own `# Floor:` header line lists the ones it avoids.
 * - The jq programs embedded in shell assets: `plugin/hooks/git-trust-file-guard.sh`, the
 *   watcher's profile render in `cli/templates/scripts/autonomous-watcher.sh`, and
 *   `cli/templates/scripts/lib/harness-run-lib.sh`.
 *
 * Only the template tree is scanned, never `scripts/` at the repository root: no test is aimed at
 * this repository.
 */
const SCRIPTS_ROOT = fileURLToPath(new URL('../templates/scripts/', import.meta.url));
const REQUIRED_PROGRAMS = ['lib/run-analytics.jq', 'lib/run-analytics-report.jq'];

const KEYWORDS = new Set([
  'as', 'def', 'module', 'import', 'include', 'if', 'then', 'elif', 'else', 'end',
  'and', 'or', 'reduce', 'foreach', 'try', 'catch', 'label', '__loc__',
]);
const IDENT = /[A-Za-z_][A-Za-z0-9_]*(?:::[A-Za-z_][A-Za-z0-9_]*)*/y;

/**
 * Code tokens with line numbers and source offsets. Comments and string text are dropped; the
 * code inside each `\( … )` interpolation is lexed as code, nested strings and parentheses included.
 */
function lex(source) {
  const tokens = [];
  let i = 0;
  let line = 1;

  function push(text, start) {
    tokens.push({ text, line, start, end: start + text.length });
  }

  function code(insideInterpolation) {
    let depth = 0;
    while (i < source.length) {
      const c = source[i];
      if (c === '\n') { line += 1; i += 1; continue; }
      if (/\s/.test(c)) { i += 1; continue; }
      if (c === '#') {
        while (i < source.length && source[i] !== '\n') i += 1;
        continue;
      }
      if (c === '"') { i += 1; string(); continue; }
      if (c === '(') { depth += 1; push(c, i); i += 1; continue; }
      if (c === ')') {
        if (insideInterpolation && depth === 0) { i += 1; return; }
        depth -= 1;
        push(c, i);
        i += 1;
        continue;
      }
      IDENT.lastIndex = i;
      const ident = IDENT.exec(source);
      if (ident) { push(ident[0], i); i += ident[0].length; continue; }
      push(c, i);
      i += 1;
    }
  }

  function string() {
    while (i < source.length) {
      const c = source[i];
      if (c === '\\') {
        if (source[i + 1] === '(') { i += 2; code(true); continue; }
        if (source[i + 1] === '\n') line += 1;
        i += 2;
        continue;
      }
      if (c === '\n') line += 1;
      i += 1;
      if (c === '"') return;
    }
  }

  code(false);
  return tokens;
}

/** Every construct jq 1.6 rejects, as `{ line, construct }`. */
function scan(source) {
  const tokens = lex(source);
  const findings = [];
  const ifs = [];

  tokens.forEach((token, index) => {
    if (!KEYWORDS.has(token.text)) return;
    const prev = tokens[index - 1];
    const next = tokens[index + 1];
    if (prev?.text === '$' && token.text !== '__loc__') {
      findings.push({ line: token.line, construct: `keyword \`${token.text}\` used as a variable (\`$${token.text}\`)` });
    } else if (prev?.text === '.' && prev.end === token.start) {
      findings.push({ line: token.line, construct: `keyword \`${token.text}\` used as a field (\`.${token.text}\`)` });
    } else if (next?.text === ':') {
      findings.push({ line: token.line, construct: `keyword \`${token.text}\` used as an object key (\`${token.text}:\`)` });
    } else if (token.text === 'if') {
      ifs.push({ line: token.line, sawElse: false });
    } else if (token.text === 'else' && ifs.length > 0) {
      ifs[ifs.length - 1].sawElse = true;
    } else if (token.text === 'end' && ifs.length > 0) {
      const closed = ifs.pop();
      if (!closed.sawElse) findings.push({ line: closed.line, construct: '`if` with no `else`' });
    }
  });

  return findings;
}

function describe(name, findings) {
  return findings.map(({ line, construct }) => `${name}:${line}: ${construct} — jq 1.6 rejects it`);
}

function jqPrograms(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return jqPrograms(path);
    return entry.isFile() && entry.name.endsWith('.jq') ? [path] : [];
  });
}

const MUST_FLAG = [
  'def f($label): $label;',
  '{if: 1}',
  '.end',
  'if . then 1 end',
  'if . then 1 elif . then 2 end',
];

const MUST_PASS = [
  '"\\(if . then 1 else 2 end)"',
  '"label: \\(.a | join(", "))"',
  '# if x then y end',
  '$__loc__',
  'if . then (if . then 1 else 2 end) else 3 end',
];

for (const program of MUST_FLAG) {
  test(`self-check: the scanner flags ${program}`, () => {
    assert.ok(scan(program).length > 0, `the scanner passed ${program}, which jq 1.6 rejects`);
  });
}

for (const program of MUST_PASS) {
  test(`self-check: the scanner passes ${program}`, () => {
    assert.deepEqual(describe('<inline>', scan(program)), []);
  });
}

test('self-check: a keyword parameter is reported with its line and its name', () => {
  const messages = describe('<inline>', scan('def f($label): $label;'));
  assert.ok(messages.length > 0);
  for (const message of messages) {
    assert.match(message, /^<inline>:1: /);
    assert.match(message, /`label`/);
    assert.match(message, /jq 1\.6 rejects it$/);
  }
});

test('no shipped .jq program uses the syntax jq 1.7 relaxed and jq 1.5/1.6 reject', () => {
  const programs = jqPrograms(SCRIPTS_ROOT);
  const found = programs.map((file) => relative(SCRIPTS_ROOT, file).split('\\').join('/'));
  for (const required of REQUIRED_PROGRAMS) {
    assert.ok(found.includes(required), `${required} not found under cli/templates/scripts/; the enumeration has stopped matching`);
  }

  const offending = programs.flatMap((file) =>
    describe(`cli/templates/scripts/${relative(SCRIPTS_ROOT, file).split('\\').join('/')}`, scan(readFileSync(file, 'utf8'))),
  );
  assert.deepEqual(offending, [], `jq syntax jq 1.6 rejects:\n${offending.join('\n')}`);
});
