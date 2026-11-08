### Task 1 — Add the `sandbox.passEnv` model field, reader and check

**Goal:** Give `harness.config.json` an adopter-configurable pass-through list for the local session's environment allow-list (goal 5): `sandbox.passEnv`, an array of environment-variable names a local unattended session keeps beyond the harness's own base set. This task adds it to the TypeScript model and to the configuration check, so `config` and `doctor` accept a valid list and name an invalid one.

**The contract this task defines, which Tasks 2, 4 and 9 restate.**

- **Key:** `sandbox.passEnv`, optional. Absent means an empty list.
- **Value:** an array of strings. Each matches `^[A-Za-z_][A-Za-z0-9_]*$`: a bare environment-variable name, with no `=`, no wildcard and no `$`. Entries are unique.
- **Meaning:** names a **local** unattended session keeps in addition to the watcher's base set (Task 4 → `SESSION_ENV_BASE`). It has no effect in job mode. A name the watcher's strip set holds — every `sandbox.credentials.envVars[].name` of the session's profile except `ANTHROPIC_API_KEY` and `CLAUDE_CODE_OAUTH_TOKEN`, plus `HARNESS_PUSH_URL` and `HARNESS_GIT_TOKEN` — is removed whatever this list says. That rule is Task 4's to apply. This task only states it in the field's doc comment.

**Where this task stops.** It is the TypeScript half of a configuration key. The schema property, its negative fixture and the `docs/config.md` §5 row are **Task 9's**, in the catch-all layer, which ships last by the configured layer order. That reverses `.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent` for this one key, and the branch is merged as a whole. Write no branch-task reference into the source. The `model.ts` doc comment states the key as the schema will carry it. The shell reader is **Task 2's**: `lib/harness-run-lib.sh` → `hr_session_pass_env`. The consumer is **Task 4's**: `autonomous-watcher.sh` → `spawn_engine`. Declare that shell mirror in `model.ts` beside the new pattern constant, the way `sandboxOptedOut`'s doc comment declares `hr_sandbox_opted_out` — with one difference: that doc comment names `cli/test/sandbox-prerequisites-shell-mirror.test.mjs` as holding its pair equal, and no test holds this pair equal, so this doc comment names no test (as Task 2's library-side **MIRROR OF** paragraph also states).

### Targets

- `cli/src/config/model.ts` — the `passEnv` field on the sandbox interface, the name-pattern constant, and the reader.
- `cli/src/config/check.ts` — `checkSandbox`'s entry for `sandbox.passEnv`.
- `cli/test/config-sandbox.test.mjs` — cases for the new key, extending the suite that already grades `sandbox.allowedDomains` and `sandbox.optOut`.

**Work:**

- [ ] `model.ts`: add `passEnv?: readonly string[]` to the sandbox interface (the one whose doc comment reads *"The unattended run's Bash sandbox."*), with the meaning above condensed to one line. Add an exported `SANDBOX_PASS_ENV_PATTERN` holding `^[A-Za-z_][A-Za-z0-9_]*$`, with a doc comment saying the schema's `items.pattern` must match it (as `SANDBOX_DOMAIN_PATTERN`'s does) and naming the shell mirror `hr_session_pass_env`. Add `sandboxPassEnv(config): readonly string[]`, returning the configured names or `[]` when the key is absent. Leave `DEFAULTS.sandbox` as it is unless the existing default object's shape requires the key. If it does, add `passEnv: []`.
- [ ] `check.ts`: in `checkSandbox`, accept `passEnv` among the sandbox keys. Report `problems.error('sandbox.passEnv', …)` when the value is not an array. Report `sandbox.passEnv[<i>]` errors for an entry that is not a string matching `SANDBOX_PASS_ENV_PATTERN` (import it, never retype it) and for a duplicate. Each message names the offending value. Extend the module header's `sandbox` sentence to cover the new key. Respect the header's rule: *"This is not a schema validator, and it must never grow into one"*. The entry checks shape only, as the `allowedDomains` entry does.
- [ ] `config-sandbox.test.mjs`: add cases through the suite's existing fixture route. A valid two-name list passes. An absent key passes. A non-array, an entry carrying `=` (`"FOO=bar"`), a wildcard entry (`"AWS_*"`) and a duplicate are each reported, naming `sandbox.passEnv`. Assert on the reported line, the way the suite's existing cases do.

**Verification:**

- `cli/test/config-sandbox.test.mjs`, the one test file this task edits, passes.
- `commands.typecheck` passes over the whole tree.
- Grep `cli/src` for the literal `^[A-Za-z_][A-Za-z0-9_]*$`: it appears once, in `SANDBOX_PASS_ENV_PATTERN`.
