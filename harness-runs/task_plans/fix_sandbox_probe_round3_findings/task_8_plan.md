### Task 8 — Test N4's grading against its unsandboxed control

**Goal:** Extend the existing N4 cases in `cli/test/sandbox-probe-remote-legs.test.mjs` to drive Task 5's comparison against the unsandboxed control. The case that passes no control must still print today's text byte for byte.

**Depends on:** Task 5, which produces this in `scripts/lib/sandbox-probe/legs-network.sh`. Its contract is restated here:

- **`sp__net_n4_grade <stream> <command> [<control exit> <control line>]`** → `SP_VERDICT|SP_EVIDENCE`. In the `ran`-with-an-error arm, `<line>` is the session's `curl: (` line:
  - **No control arguments:** `not run|curl's error line cannot tell a refused connect from an unreachable host: <line>`, today's text, unchanged.
  - **Control exit `0`:** `pass|refused in the session while the same call, unsandboxed from the probe's own shell, got a response: session: <line>; unsandboxed control: <control line>`.
  - **Control exit differs from the session's `curl: (<n>)` code:** `pass|the session's connect ended differently from the same call issued unsandboxed from the probe's own shell: session: <line>; unsandboxed control: <control line>`.
  - **Same code:** `not run|curl's error line cannot tell a refused connect from an unreachable host, and the same call issued unsandboxed from the probe's own shell ended the same way: session: <line>; unsandboxed control: <control line>`.
  - **The other arms** (sandbox / network refusal `pass`, permission `not run`, a response `fail`) are unchanged.

### Targets

- `cli/test/sandbox-probe-remote-legs.test.mjs`

**Work:**

- [ ] Widen the `n4` helper inside `test('sp__net_n4_grade: …')` to take optional control arguments, appended to the argument list only when given. Keep the two existing subtests as they are. *"a curl error is not run, carrying the whole curl line"* is now the no-control case, and its expected string is unchanged.
- [ ] Add three subtests over the existing `n4-curl-error` fixture, whose session line is `curl: (7) Failed to connect to 169.254.169.254 port 80 after 2 ms: Couldn't connect to server`:
  - control `28` / `curl: (28) Connection timed out after 5001 milliseconds` → the "ended differently" `pass`;
  - control `7` / `curl: (7) Failed to connect to 169.254.169.254 port 80 after 0 ms: Couldn't connect to server` → the "ended the same way" `not run`;
  - control `0` / `a response (12 bytes)` → the "got a response" `pass`.
  
  Assert each full `SP_VERDICT|SP_EVIDENCE` string with `assert.equal`.
- [ ] The file header's rule sentence gains: *N4 passes only where its curl error differs from the same call issued unsandboxed from the probe's own shell.* The test name becomes `sp__net_n4_grade: N4 never fails on an error line that cannot tell, and passes only on a difference from its unsandboxed control`.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-remote-legs.test.mjs`, from the repository root as one plain foreground command, exits 0, and its TAP counts show no failure.
- The pre-existing N4 subtests' expected strings are byte-identical in `git diff`.
