### 2. The probe's shell mirror is declared "held equal" by a suite that never runs it

**File:** `cli/test/sandbox-prerequisites-shell-mirror.test.mjs` (the suite header, "The judge is held to") — and the claims it is meant to back: `cli/src/doctor/checks.ts` (`probeSandboxHost` doc comment) — "held equal by `cli/test/sandbox-prerequisites-shell-mirror.test.mjs`"; `cli/templates/scripts/lib/harness-run-lib.sh` (header) — "All three are held equal to their owners by"

The run library declares three mirrors and says all three are held equal by `sandbox-prerequisites-shell-mirror.test.mjs`. The three are `hr_sandbox_prereq_judge_var`, `hr_sandbox_prereq_probe_var` and `hr_sandbox_opted_out`. `probeSandboxHost`'s doc comment makes the same claim for the probe. The suite exercises only two of them, `hr_sandbox_prereq_judge_var` and `hr_sandbox_opted_out`, and never calls `hr_sandbox_prereq_probe_var`. The watcher suites cannot cover it either: `cli/test/helpers/watcher.mjs` replaces the probe with `DEFAULT_SANDBOX_PROBE` on every `tick` (its choice 5). So the function that runs the real refusal is not run by any test. That function reads `uname -s` and `uname -r`, runs `command -v bwrap` and `command -v socat`, and has a failed-`uname` fallback. A slip such as swapping the two binary arguments or misspelling a binary name would pass every gate, and the declared guarantee would hide it. `cli.md` → `## What "done" means here` puts it this way: "a header a review reads as a guarantee is worth exactly what the code under it still does".

**Fix:** add a test to `cli/test/sandbox-prerequisites-shell-mirror.test.mjs` that runs the real probe against a stub `PATH` and holds its answer to the owner's assessment. Add `chmodSync` and `mkdirSync` to the file's `node:fs` import.

```js
/** A stub bin directory: `uname` answering `unameS` / `unameR` (or failing), plus `present` as executables. */
function stubBin(unameS, unameR, present, { unameFails = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'sandbox-probe-'));
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  const write = (name, body) => {
    writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`);
    chmodSync(join(bin, name), 0o755);
  };
  write('uname', unameFails ? 'exit 1' : `case "$1" in -s) echo '${unameS}' ;; -r) echo '${unameR}' ;; esac`);
  for (const binary of present) write(binary, 'exit 0');
  return { dir, bin };
}

test('hr_sandbox_prereq_probe_var reads uname and PATH and answers as assessSandboxHost does', async () => {
  for (const [platform, unameS] of [['linux', 'Linux'], ['darwin', 'Darwin']]) {
    for (const kernelRelease of ['6.8.0-45-generic', '4.4.0-19041-Microsoft']) {
      for (const present of PRESENCE) {
        const { dir, bin } = stubBin(unameS, kernelRelease, present);
        try {
          const result = await libCall(
            'PATH="$1"; hr_sandbox_prereq_probe_var; status=$?; printf "%s\\n" "$status" "$HR_SANDBOX_MISSING"',
            [bin],
          );
          const [status, missing] = result.stdout.split('\n');
          const owner = assessSandboxHost({
            platform,
            kernelRelease,
            resolvedBinaries: new Set(present),
            appArmorRestrict: { state: 'absent' },
            bwrapProfile: { state: 'absent' },
          });
          const label = `${unameS} ${kernelRelease} [${present.join(',')}]`;
          assert.equal(missing, owner.missing.join(' '), label);
          assert.equal(Number(status), owner.missing.length === 0 ? 0 : 1, label);
        } finally {
          rmSync(dir, { recursive: true, force: true });
        }
      }
    }
  }
});

test('hr_sandbox_prereq_probe_var leaves a host whose uname fails to failIfUnavailable', async () => {
  const { dir, bin } = stubBin('', '', [], { unameFails: true });
  try {
    const result = await libCall(
      'PATH="$1"; hr_sandbox_prereq_probe_var; status=$?; printf "%s|%s|%s\\n" "$status" "$HR_SANDBOX_MISSING" "$HR_SANDBOX_REFUSAL"',
      [bin],
    );
    assert.equal(result.stdout.trim(), '0||');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
```

`libCall` already sources the library and shifts, so `$1` is the stub directory. `PATH` is replaced only inside the `bash -c` script, after the library is sourced, so `bash` itself still resolves. Then widen the suite header's rule sentence so that it names the probe too: "…and the probe is held to the same assessment over a stubbed `uname` and `PATH`". The claims in `checks.ts` and the library header are then true as written, and neither needs an edit.

That test file is the one this fix edits, so it is the only one the fix runs: `npm test --workspace cli -- test/sandbox-prerequisites-shell-mirror.test.mjs`.
