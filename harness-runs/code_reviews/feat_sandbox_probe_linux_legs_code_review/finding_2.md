### 2. `sp__lb5_grade` still retypes `127.0.0.1` in its pass evidence instead of reading `SP__NET_LOOPBACK_HOST`

**File:** `scripts/lib/sandbox-probe/legs-loopback.sh` (`sp__lb5_grade`), "the token came back on 127.0.0.1:$port"

**Severity:** Should Fix. **Layer:** general.

The architecture review's Finding 1 (`harness-runs/architecture_branch_reviews/feat_sandbox_probe_linux_legs_arch_review/finding_1.md`) moved every loopback-host literal in this file onto its owner, `SP__NET_LOOPBACK_HOST` in `scripts/lib/sandbox-probe/legs-network.sh`, with one exception. Its **Deviations from plan** left the literal in `sp__lb5_grade`'s pass evidence. The reason given was that the suite pins that function's output byte for byte.

That reason does not hold. `cli/test/sandbox-probe-detached-loopback-legs.test.mjs` sources `legs-network.sh` among its `LIBS`, so `SP__NET_LOOPBACK_HOST` is `127.0.0.1` when the suite calls `sp__lb5_grade`. Its `REACHABLE` assertion (`'reachable from outside the sandbox: the token came back on 127.0.0.1:9876'`) is therefore unchanged by the fix.

As it stands, the file keeps a second spelling of a constant that has an owner. `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time` says *"The shared constants have owners, and a value is imported from its owner rather than retyped"*. If the host changes, LB5's listener (`sp__lb5_helper`) and its outside request (`sp__lb5`) follow the constant, but this evidence keeps naming the old host.

**Fix.** In `scripts/lib/sandbox-probe/legs-loopback.sh`:

- [ ] In `sp__lb5_grade`, replace

  ```bash
  SP_EVIDENCE="reachable from outside the sandbox: the token came back on 127.0.0.1:$port"
  ```

  with

  ```bash
  SP_EVIDENCE="reachable from outside the sandbox: the token came back on $SP__NET_LOOPBACK_HOST:$port"
  ```

- [ ] Keep the header true. Today it says the grading functions *"read only their arguments and the stream"*, and `sp__lb5_grade` now also reads a global. Replace the line

  ```
  # THE GRADING FUNCTIONS read only their arguments and the stream, and set SP_VERDICT and SP_EVIDENCE:
  ```

  with

  ```
  # THE GRADING FUNCTIONS read only their arguments, the stream and (sp__lb5_grade) legs-network.sh's
  # SP__NET_LOOPBACK_HOST, and set SP_VERDICT and SP_EVIDENCE:
  ```

The `127.0.0.1` in the header's row descriptions (LB1, LB3) and in the `THE TWO PROFILES` paragraph is prose naming the measured shape. It stays, as the architecture finding's **What stays** bullet decided.

The fix edits no test file, so it runs no test. The suite above runs in the Run gates phase.
