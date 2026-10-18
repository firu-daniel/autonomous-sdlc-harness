### 3. `profile-sandbox` still calls the excluded entries "wrapper rules"

**File:** `cli/src/doctor/checks.ts` (`PROFILE_SANDBOX_CHECK`): "expected wrapper rules"

**Severity:** Nice to Have.

This branch's point is that a `sandbox.excludedCommands` entry is a bare command pattern and **not** a `Bash(…)` rule. `docs/cli.md` §6 now says so explicitly ("An `excludedCommands` entry is a bare command pattern, not a `Bash(…)` rule"), and so does the profile `_README`. Two places in `PROFILE_SANDBOX_CHECK` still use the old wording:

- **The doc comment** above `PROFILE_SANDBOX_CHECK`: "excluding exactly / the expected wrapper rules".
- **The pass line `doctor` prints**: `` excludes exactly the ${expected.excludedCommands.length} expected wrapper rules and allows exactly ``.

This is a wording mismatch only. No test asserts on either string.

**Fix:** in `cli/src/doctor/checks.ts`, change "wrapper rules" to "wrapper entries" in both places:

- the doc comment: `on, strict, excluding exactly` / `the expected wrapper entries, allowing exactly the expected domains`;
- the pass line: `` excludes exactly the ${expected.excludedCommands.length} expected wrapper entries and allows exactly the ${expected.allowedDomains.length} expected domains ``.

Do not edit `docs/sandbox-verification.md` row D1, which quotes the old pass line. It is a dated record of what the CLI printed on 2026-10-14. No test file is edited by this fix. The suite runs in the Run gates phase.
