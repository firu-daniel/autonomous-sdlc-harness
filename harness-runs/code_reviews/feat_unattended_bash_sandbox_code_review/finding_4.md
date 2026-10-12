### 4. The opt-out keeps `failIfUnavailable: true`, which may stop the session on the platform the opt-out exists for

**File:** `cli/src/generators/sandboxProfile.ts` (`applySandbox`): "if (expected.optedOut) {" … "sandbox['enabled'] = false;"

**The problem.** The task prompt gives the opt-out one purpose: "An explicit, named opt-out for an adopter on a platform with no supported sandbox (WSL1, for example)". The docs repeat it (`docs/config.md` §5, the `sandbox.optOut` row: "for a platform with no supported sandbox, such as WSL1"). Under the opt-out, `applySandbox` sets `enabled: false` and leaves the template's `"failIfUnavailable": true` in place.

The verified fact about that key is: "When `true`, Claude Code exits at startup if the sandbox cannot start; on an unsupported platform it does not start at all." It does not say whether `failIfUnavailable` is ignored while `enabled` is `false`. If it is not ignored, every unattended session on WSL1 exits at startup, the opt-out included, and the adopter has no working route. The generator settles that open point in the favourable direction without saying so. The prompt requires an unresolved point to be planned around rather than picked. With the sandbox off, `failIfUnavailable: false` costs nothing, so setting it removes the dependency.

**Fix.**

- [ ] In `applySandbox`, inside `if (expected.optedOut) {`, after `sandbox['enabled'] = false;` add `sandbox['failIfUnavailable'] = false;`.
- [ ] In the same branch's `appendReadme` text, after "Every Bash command an unattended run issues runs unsandboxed;", add " `failIfUnavailable` is false with it, so a platform with no supported sandbox still starts;".
- [ ] Update the `applySandbox` doc comment's "— when the configuration takes the opt-out — `enabled: false` with a marker line" to "— when the configuration takes the opt-out — `enabled: false` and `failIfUnavailable: false` with a marker line".
- [ ] In `cli/test/profile.test.mjs`, case "the opt-out shows in the profile, and keeps every deny entry", add `assert.equal(profile.sandbox.failIfUnavailable, false);` after the `enabled` assertion. That is the test file this fix edits, so it is the one the fix runs. `doctor`'s `profile-sandbox` opt-out branch grades only `enabled` and the marker, so it needs no change.
- [ ] In `docs/config.md` §5, `sandbox.optOut` row, replace "the profile renders `sandbox.enabled: false` and a `_README` line" with "the profile renders `sandbox.enabled: false`, `sandbox.failIfUnavailable: false` and a `_README` line". In `docs/cli.md` → `### The sandbox block and the permission mode`, replace "renders `sandbox.enabled: false` and a marker line in `_README`" with "renders `sandbox.enabled: false`, `failIfUnavailable: false` and a marker line in `_README`".
