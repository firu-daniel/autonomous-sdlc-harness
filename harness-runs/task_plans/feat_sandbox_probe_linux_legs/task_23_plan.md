### Task 23 — Test N3's and N4's grading on Linux against their macOS twins

**Goal:** `cli/test/sandbox-probe-remote-legs.test.mjs` is the existing suite that owns `legs-network.sh`'s N3 and N4 grading. It gains cases proving two things:

- on Linux, an `unrecognised` curl error still grades N3 on the body and N4 by comparison with the unsandboxed control;
- each Linux case prints exactly what its macOS twin prints.

**Depends on:**

- **Task 22** (`scripts/lib/sandbox-probe/legs-network.sh`). The signatures are unchanged:
  - **`sp__net_n3_grade <stream> <command> <token> <listener answered: 1|0>`.** On an `unrecognised` judge result it runs its normal steps:
    - `fail` on the token in the result;
    - `not run` when answered is not `1`;
    - else `pass`, `no body came back while the listener answered the probe: <curl line>`.
  - **`sp__net_n4_grade <stream> <command> [<control exit> <control line>]`.** On an `unrecognised` judge result it takes its `*)` arm, `SP__STATUS = error`:
    - no control → `not run`, `curl's error line cannot tell …`;
    - control `0` → `pass`, `refused in the session while the same call … got a response …`;
    - a control code different from the session's → `pass`, `the session's connect ended differently …`;
    - the same code → `not run`, `… ended the same way …`.
- **Task 3** (`judge.sh`). With `SP_PLATFORM=linux`, `sp_judge_call <stream> network <command>` on a `ran`-layer error carrying no known refusal string sets `SP_LAYER=unrecognised` and `SP_VERDICT="not run"`. With `SP_PLATFORM` empty, the same call is layer `ran`, verdict `fail`.

**Where this task stops.** It adds cases to the one existing suite and needs no new fixture. The recorded `n3-no-body` and `n4-curl-error` streams already hold a plain `curl: (7)` error with no refusal string, which is the Linux shape, so each file is driven once as Linux and once as macOS. No case launches a session, a listener or a network call. The suite's other cases are untouched.

### Targets

- `cli/test/sandbox-probe-remote-legs.test.mjs`

**Work:**

- [ ] **The header and the helper.** The header's rule gains: *on Linux an `unrecognised` curl error is N3's and N4's data, graded exactly as on macOS*. `sourced` gains an optional platform. When one is given, the `bash -c` body sets `SP_PLATFORM=<platform>` after sourcing the libraries and before the function call. No existing case passes one, so each runs as today.
- [ ] **The precondition case.** It shows that the Linux cases below exercise the `unrecognised` path rather than passing by accident:
  - with `SP_PLATFORM=linux`, `sp_judge_call <n3-no-body> network <N3_CMD>` leaves `SP_LAYER` `unrecognised`;
  - the same holds on `n4-curl-error` with `N4_CMD`;
  - without a platform, both leave `ran`.
- [ ] **N3 on Linux, beside its macOS twin.** It drives `n3-no-body` with answered `1`, then with answered `0`. In both, the output with `linux` equals the output with no platform.
  - Answered `1` gives the exact string the existing case asserts: `pass|no body came back while the listener answered the probe: curl: (7) Failed to connect to 127.0.0.1 port 8765 after 0 ms: Couldn't connect to server`.
  - Answered `0` matches `/^not run\|/`.
- [ ] **N4 on Linux, beside its macOS twin.** It drives `n4-curl-error` under four controls:
  - no control;
  - control `28`, with `curl: (28) Connection timed out after 5001 milliseconds`;
  - control `7`, with the same-code line;
  - control `0`, with `a response (12 bytes)`.

  Under each, the output with `linux` equals the output with no platform, and both equal the exact string the existing macOS case for that control asserts.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-remote-legs.test.mjs` passes, run from the repository root as one plain foreground command.
- The suite reads fixed fixture files and its own temporary files, never a tree of repository files, so it owes no `treeGuards` entry (`unit_loop_core.md` → `## The test-run rule` point 8's boundary).
</content>
</invoke>
