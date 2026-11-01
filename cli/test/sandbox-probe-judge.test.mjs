/**
 * The sandbox probe's `judge` subcommand (`scripts/sandbox-probe.sh judge …`, its body in
 * `scripts/lib/sandbox-probe/judge.sh`), run over the recorded streams in `fixtures/sandbox-probe/`.
 *
 * **The rule these tests exist to enforce: the judge's verdict and quoted evidence are fixed by the
 * stream alone** — by the four refusal shapes of `judge.sh`'s layer table (permission, file-tool,
 * network, sandbox; anything else is `ran`), taken in that table's precedence — the file-tool text
 * outranks a `permission_denials` listing of the same call — and by the exact-match rule, under which
 * a command with anything appended is a different call. N5's three arms (`sp_judge_allowed_domains`)
 * are held here too: refused is `pass`, the Bash tool's own `allowed_domains cannot widen network
 * access` refusal included; answered is `fail` carrying the follow-up finding; a call with no
 * `allowed_domains` parameter is `not run`, and an error result carrying no refusal string is
 * `not run`. PD18: the `ran` arm quotes `Exit code <n>: <first later non-empty line>` when a message
 * follows the bare `Exit code` line. The Linux layers apply only under `SANDBOX_PROBE_UNAME=Linux`:
 * `Read-only file system` is a sandbox refusal, and an error result carrying no refusal string,
 * judged against an expected `sandbox` or `network`, is `not run` (layer `unrecognised`), never
 * `fail`; each Linux case has a twin with no platform holding the macOS verdict. No case launches
 * `claude`, loads a model or reaches the network: the subcommand reads a fixture file and prints one
 * result line, and every assertion compares that printed line verbatim.
 *
 * Left out deliberately: whether a real sandboxed session produces these shapes at all. Only a
 * hand-run `sandbox-probe.sh run` shows that; the fixtures are hand-written recordings of it.
 *
 * The fixtures hold no machine path: `@FIXTURE_ROOT@` stands in for every path and is passed to the
 * judge unsubstituted, since matching is byte-equal on the recorded string.
 */

import assert from 'node:assert/strict';
import { chmodSync, writeFileSync } from 'node:fs';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const PROBE = join(WORKSPACE_ROOT, 'scripts', 'sandbox-probe.sh');
const FIXTURES = join(PACKAGE_ROOT, 'test', 'fixtures', 'sandbox-probe');
const MCP_TOOL = 'mcp__harness-docs__search_docs';
const N5_COMMAND = 'curl -sS -o /dev/null https://n5.example.invalid/';
const N5_FINDING =
  'finding: allowed_domains widened a sandboxed call; this needs its own follow-up task prompt, not a doc edit';

/**
 * `SP_VERSION` is blanked so the line's `claude=` field reads `unknown` whatever the caller exported;
 * `SANDBOX_PROBE_UNAME` is blanked so a case is on macOS unless {@link judgeOnLinux} says otherwise.
 */
function judge(...args) {
  return runBash(WORKSPACE_ROOT, [PROBE, 'judge', ...args], { SP_VERSION: '', SANDBOX_PROBE_UNAME: '' });
}

function judgeOnLinux(...args) {
  return runBash(WORKSPACE_ROOT, [PROBE, 'judge', ...args], { SP_VERSION: '', SANDBOX_PROBE_UNAME: 'Linux' });
}

function fixture(name) {
  return join(FIXTURES, `${name}.jsonl`);
}

function line(result, evidence) {
  return `leg="judge" row="-" result="${result}" evidence="${evidence}" departure="none" claude="unknown"\n`;
}

/** A `fail` line raises the probe's exit to 4; `pass` and `not run` leave it 0. */
function assertJudged(run, result, evidence) {
  assert.equal(run.stdout, line(result, evidence), run.stderr);
  assert.equal(run.status, result === 'fail' ? 4 : 0, run.stderr);
}

/**
 * The refusal is matched as one whole stderr line rather than the whole stream: stderr also carries
 * whatever the entry point's library sourcing prints, which is not this suite's subject.
 */
function assertRefusal(stderr, refusal) {
  assert.ok(stderr.split('\n').includes(refusal), `no line ${JSON.stringify(refusal)} in stderr:\n${stderr}`);
}

test('judge call: the exact-match rule', async (t) => {
  await t.test('the recorded command is matched', async () => {
    assertJudged(await judge('call', fixture('ran'), 'ran', 'ls @FIXTURE_ROOT@'), 'pass', 'README.md');
  });

  await t.test('the same command with `; echo $?` appended is a different call, and not run', async () => {
    assertJudged(
      await judge('call', fixture('ran'), 'ran', 'ls @FIXTURE_ROOT@; echo $?'),
      'not run',
      "no Bash call 'ls @FIXTURE_ROOT@; echo $?' in the session",
    );
  });

  await t.test('a command issued twice is judged once, on its first result', async () => {
    assertJudged(
      await judge('call', fixture('twice'), 'sandbox', 'touch @FIXTURE_ROOT@/outside/twice'),
      'pass',
      'touch: @FIXTURE_ROOT@/outside/twice: Operation not permitted (issued 2 times)',
    );
  });
});

test('judge call: each refusal layer maps to its verdict', async (t) => {
  const cases = [
    {
      name: 'sandbox: dd … Operation not permitted',
      stream: 'sandbox-dd',
      layer: 'sandbox',
      command: 'dd if=/dev/zero of=@FIXTURE_ROOT@/outside/probe bs=1 count=1',
      evidence: 'dd: @FIXTURE_ROOT@/outside/probe: Operation not permitted',
    },
    {
      name: 'permission: Permission to use Bash … has been denied',
      stream: 'permission-text',
      layer: 'permission',
      command: 'git -C @FIXTURE_ROOT@ push origin HEAD',
      evidence: 'Permission to use Bash with command git -C @FIXTURE_ROOT@ push origin HEAD has been denied.',
    },
    {
      name: 'permission: the call named in the result event’s permission_denials',
      stream: 'permission-denials',
      layer: 'permission',
      command: 'rm -rf @FIXTURE_ROOT@/outside',
      evidence: 'This command requires approval (in permission_denials)',
    },
    {
      name: 'permission outranks sandbox: a denial that also carries Operation not permitted',
      stream: 'permission-precedence',
      layer: 'permission',
      command: 'touch @FIXTURE_ROOT@/outside/marker',
      evidence: 'Permission to use Bash with command touch @FIXTURE_ROOT@/outside/marker has been denied.',
    },
    {
      name: 'network: <sandbox_violations> … host is not on the allow list',
      stream: 'network-violations',
      layer: 'network',
      command: 'curl -sS -o /dev/null https://blocked.example.invalid/',
      evidence:
        '<sandbox_violations>blocked.example.invalid:443 refused: host is not on the allow list</sandbox_violations>',
    },
    {
      name: 'network: CONNECT tunnel failed',
      stream: 'network-connect',
      layer: 'network',
      command: 'curl -sS -o /dev/null https://proxied.example.invalid/',
      evidence: 'curl: (56) CONNECT tunnel failed, response 403',
    },
    {
      name: 'network: an SSH call refused by the proxy (This proxy requires authentication)',
      stream: 'network-ssh-proxy',
      layer: 'network',
      command: 'git -C @FIXTURE_ROOT@ fetch origin',
      evidence: 'Received disconnect from UNKNOWN port 65535:1: This proxy requires authentication',
    },
    {
      name: 'ran: none of the refusal shapes',
      stream: 'ran',
      layer: 'ran',
      command: 'ls @FIXTURE_ROOT@',
      evidence: 'README.md',
    },
  ];
  for (const c of cases) {
    await t.test(`${c.name} — expected layer passes`, async () => {
      assertJudged(await judge('call', fixture(c.stream), c.layer, c.command), 'pass', c.evidence);
    });
  }

  await t.test('a layer other than the expected one fails, quoting the same evidence', async () => {
    assertJudged(
      await judge('call', fixture('permission-precedence'), 'sandbox', 'touch @FIXTURE_ROOT@/outside/marker'),
      'fail',
      'Permission to use Bash with command touch @FIXTURE_ROOT@/outside/marker has been denied.',
    );
    assertJudged(
      await judge('call', fixture('sandbox-dd'), 'ran', 'dd if=/dev/zero of=@FIXTURE_ROOT@/outside/probe bs=1 count=1'),
      'fail',
      'dd: @FIXTURE_ROOT@/outside/probe: Operation not permitted',
    );
  });
});

test('PD18: the ran arm quotes the message under the Exit code line', async (t) => {
  await t.test('Exit code 2, a blank line, then the message', async () => {
    assertJudged(
      await judge('call', fixture('exit-code-message'), 'ran', 'git status'),
      'pass',
      'Exit code 2: sbx: a message after a blank line',
    );
  });

  await t.test('a result with no Exit code line keeps its first line', async () => {
    assertJudged(await judge('call', fixture('ran'), 'ran', 'ls @FIXTURE_ROOT@'), 'pass', 'README.md');
  });
});

test('the Linux refusal string and the unrecognised layer, on Linux only', async (t) => {
  const dd = 'dd if=/dev/null of=@FIXTURE_ROOT@/clone/.mcp.json conv=notrunc';
  const erofs = "dd: failed to open '@FIXTURE_ROOT@/clone/.mcp.json': Read-only file system";
  const busy = "Exit code 1: dd: failed to open '@FIXTURE_ROOT@/clone/.mcp.json': Device or resource busy";

  await t.test('Linux: Read-only file system is a sandbox refusal', async () => {
    assertJudged(await judgeOnLinux('call', fixture('linux-erofs'), 'sandbox', dd), 'pass', erofs);
  });

  await t.test('no platform: Read-only file system is ran, so an expected sandbox fails', async () => {
    assertJudged(await judge('call', fixture('linux-erofs'), 'sandbox', dd), 'fail', `Exit code 1: ${erofs}`);
  });

  await t.test('Linux: an error carrying no known refusal string is not run, never fail', async () => {
    assertJudged(
      await judgeOnLinux('call', fixture('linux-unrecognised'), 'sandbox', dd),
      'not run',
      `no refusal string this judge knows on Linux, so not graded: ${busy}`,
    );
  });

  await t.test('no platform: the same error fails an expected sandbox', async () => {
    assertJudged(await judge('call', fixture('linux-unrecognised'), 'sandbox', dd), 'fail', busy);
  });

  await t.test('Linux: an expected ran is never re-graded', async () => {
    assertJudged(await judgeOnLinux('call', fixture('linux-unrecognised'), 'ran', dd), 'pass', busy);
  });

  await t.test('Linux: a non-error result judged against sandbox still fails', async () => {
    assertJudged(await judgeOnLinux('call', fixture('ran'), 'sandbox', 'ls @FIXTURE_ROOT@'), 'fail', 'README.md');
  });
});

test('judge tool: Edit, Write and Read are matched by file_path', async (t) => {
  const denied = 'File is in a directory that is denied by your permission settings.';

  await t.test('Edit refused by the file tool', async () => {
    assertJudged(
      await judge('tool', fixture('file-tool'), 'file-tool', 'Edit', '@FIXTURE_ROOT@/.claude/settings.json'),
      'pass',
      denied,
    );
  });

  await t.test('Write refused by the file tool', async () => {
    assertJudged(
      await judge('tool', fixture('file-tool'), 'file-tool', 'Write', '@FIXTURE_ROOT@/.claude/hooks/probe.sh'),
      'pass',
      denied,
    );
  });

  await t.test('Read that ran fails an expected file-tool refusal', async () => {
    assertJudged(
      await judge('tool', fixture('file-tool'), 'file-tool', 'Read', '@FIXTURE_ROOT@/README.md'),
      'fail',
      '     1\t# fixture readme',
    );
  });

  await t.test('a tool name recorded on another path is not run', async () => {
    assertJudged(
      await judge('tool', fixture('file-tool'), 'file-tool', 'Edit', '@FIXTURE_ROOT@/.claude/hooks/probe.sh'),
      'not run',
      "no Edit call on '@FIXTURE_ROOT@/.claude/hooks/probe.sh' in the session",
    );
  });

  const deniedWrapped = `<tool_use_error>${denied}</tool_use_error>`;
  const listed = [
    { tool: 'Edit', path: '@FIXTURE_ROOT@/scripts/push-branch.sh' },
    { tool: 'Write', path: '@FIXTURE_ROOT@/.git/sbx_w6_new' },
  ];
  for (const { tool, path } of listed) {
    await t.test(`${tool} refused by the file tool and listed in permission_denials reads file-tool`, async () => {
      assertJudged(
        await judge('tool', fixture('file-tool-in-denials'), 'file-tool', tool, path),
        'pass',
        deniedWrapped,
      );
    });

    await t.test(`${tool} refused by the file tool and listed in permission_denials fails an expected permission`, async () => {
      assertJudged(
        await judge('tool', fixture('file-tool-in-denials'), 'permission', tool, path),
        'fail',
        deniedWrapped,
      );
    });
  }
});

test('judge mcp: pass, fail and not run', async (t) => {
  await t.test('a tool_result without is_error passes', async () => {
    assertJudged(await judge('mcp', fixture('mcp-ok'), MCP_TOOL), 'pass', '1 result: docs/sandbox-verification.md');
  });

  await t.test('a tool_result with is_error: true fails', async () => {
    assertJudged(await judge('mcp', fixture('mcp-error'), MCP_TOOL), 'fail', 'MCP error -32000: Connection closed');
  });

  await t.test('a session with no such call is not run', async () => {
    assertJudged(await judge('mcp', fixture('ran'), MCP_TOOL), 'not run', `no ${MCP_TOOL} call in the session`);
  });
});

test('judge allowed-domains: N5’s three arms', async (t) => {
  await t.test('a call carrying allowed_domains that was refused passes', async () => {
    assertJudged(
      await judge('allowed-domains', fixture('n5-refused'), N5_COMMAND),
      'pass',
      '<sandbox_violations>n5.example.invalid:443 refused: host is not on the allow list</sandbox_violations>',
    );
  });

  await t.test('a call whose allowed_domains the Bash tool refused as cannot widen passes', async () => {
    assertJudged(
      await judge('allowed-domains', fixture('n5-cannot-widen'), N5_COMMAND),
      'pass',
      '<tool_use_error>allowed_domains cannot widen network access in this session: the configured sandbox allowlist is the whole allowlist here (a managed-domains-only or strictAllowlist policy, or a confined evaluation run). Remove allowed_domains and use a host the configured allowlist already covers.</tool_use_error>',
    );
  });

  await t.test('a call carrying allowed_domains whose host answered fails, with the finding', async () => {
    assertJudged(
      await judge('allowed-domains', fixture('n5-answered'), N5_COMMAND),
      'fail',
      `HTTP/2 200 — ${N5_FINDING}`,
    );
  });

  await t.test('a call carrying allowed_domains that errored with no refusal string is not run, never a fail', async () => {
    assertJudged(
      await judge('allowed-domains', fixture('n5-tool-error'), N5_COMMAND),
      'not run',
      'the call returned an error carrying no refusal string, so neither a refusal nor an answer from the host: <tool_use_error>allowed_domains applies only to a command that runs in the sandbox, and this one would not (dangerouslyDisableSandbox, an excluded command, or no sandbox for this shell): remove it, or run the command sandboxed.</tool_use_error>',
    );
  });

  await t.test('a call with allowed_domains absent is not run, even though it was refused', async () => {
    assertJudged(
      await judge('allowed-domains', fixture('n5-absent'), N5_COMMAND),
      'not run',
      'the call carried no allowed_domains parameter',
    );
  });
});

test('judge refuses a missing or unreadable stream with exit 1 and writes nothing', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'harness-sp-judge-'));
  t.after(() => rm(dir, { recursive: true, force: true }));

  await t.test('a missing stream', async () => {
    const missing = join(dir, 'missing.jsonl');
    const run = await runBash(dir, [PROBE, 'judge', 'call', missing, 'ran', 'ls'], { SP_VERSION: '' });
    assert.equal(run.status, 1, run.stderr);
    assert.equal(run.stdout, '');
    assertRefusal(run.stderr, `sandbox-probe: judge: stream file '${missing}' is missing or unreadable`);
    assert.deepEqual(await readdir(dir), []);
  });

  await t.test('an unreadable stream', { skip: process.getuid?.() === 0 && 'root reads a mode-000 file' }, async () => {
    const unreadable = join(dir, 'unreadable.jsonl');
    writeFileSync(unreadable, '');
    chmodSync(unreadable, 0o000);
    const run = await runBash(dir, [PROBE, 'judge', 'mcp', unreadable, MCP_TOOL], { SP_VERSION: '' });
    assert.equal(run.status, 1, run.stderr);
    assert.equal(run.stdout, '');
    assertRefusal(run.stderr, `sandbox-probe: judge: stream file '${unreadable}' is missing or unreadable`);
    assert.deepEqual(await readdir(dir), ['unreadable.jsonl']);
  });
});
