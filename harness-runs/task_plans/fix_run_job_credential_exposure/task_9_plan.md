### Task 9 — Add `sandbox.passEnv` to the schema, with its negative fixture and its `docs/config.md` row

**Goal:** Complete the configuration-key contract Task 1 started: the schema property, the negative fixture that proves a malformed value is refused, the fixture's chained assertion, and the `docs/config.md` §5 row. Then the key is legal in every adopter's `harness.config.json` (goal 5: *"which is a schema change. Make it with its negative fixture"*).

**Depends on:**

- **Task 1**, which added these to `cli/src/config/model.ts` and `cli/src/config/check.ts`:
  - `sandbox.passEnv?: readonly string[]`;
  - `SANDBOX_PASS_ENV_PATTERN` = `^[A-Za-z_][A-Za-z0-9_]*$`, whose doc comment says the schema's `items.pattern` must match it;
  - `sandboxPassEnv(config)`;
  - the check that reports a non-array, a non-matching entry and a duplicate.
- **Task 8**, which adds `docs/watcher.md` → `### The session's environment`, the owner of the base set this row points at.

The meaning, restated: the names a **local** unattended session keeps beyond the watcher's base set (`autonomous-watcher.sh` → `SESSION_ENV_BASE`, Task 4), with no effect in job mode. A name the watcher strips is removed whatever the list says: every `sandbox.credentials.envVars[].name` of the profile except `ANTHROPIC_API_KEY` and `CLAUDE_CODE_OAUTH_TOKEN`, plus `HARNESS_PUSH_URL` and `HARNESS_GIT_TOKEN`.

**This is the catch-all task of a key whose model landed first.** The configured layer order puts `general` last, and the story index's `## Context` records that this one key's four places therefore land in the order model, check, schema, docs. Once this task lands, the merged tree carries all four.

### Targets

- `schemas/harness.config.schema.json` — `properties.sandbox.properties.passEnv`.
- `schemas/negative/sandbox-pass-env-not-a-name.json` (new) — a configuration whose `sandbox.passEnv` holds `"FOO=bar"`.
- `schemas/negative/README.md` — its fixture line, if that file lists the fixtures.
- `package.json` (repository root) — one chained assertion in `validate:config:negative`.
- `docs/config.md` — the `sandbox.passEnv` row in §5.

**Work:**

- [ ] **The schema property.** Under `sandbox.properties`, add `passEnv`:
  - `type: array`, `default: []`, `uniqueItems: true`;
  - `items: { type: string, pattern: "^[A-Za-z_][A-Za-z0-9_]*$", description: … }`, the item description saying the pattern must match `SANDBOX_PASS_ENV_PATTERN` in `cli/src/config/model.ts`, as `allowedDomains`' domain description does;
  - a `description` stating the meaning above in one or two sentences.

  Extend `sandbox`'s own `description` to say the block also carries this list. Keep `additionalProperties: false`.
- [ ] **The negative fixture** `schemas/negative/sandbox-pass-env-not-a-name.json`: a minimal valid configuration, shaped like `schemas/negative/sandbox-domain-without-reason.json`, whose only defect is `"sandbox": { "passEnv": ["FOO=bar"] }`. Add its line to `schemas/negative/README.md` where that file lists the fixtures.
- [ ] **`package.json` → `validate:config:negative`.** Append `&& node schemas/validate.mjs test -s schemas/harness.config.schema.json -d schemas/negative/sandbox-pass-env-not-a-name.json --invalid`, in the chain's existing form. A fixture no assertion wires in is never run (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`).
- [ ] **`docs/config.md` §5.** Add a `sandbox.passEnv` row in that table's shape, beside the other `sandbox.*` rows. It gives:
  - the type, the default and the pattern;
  - that only local runs read it, through the watcher's launch;
  - that the strip set wins;
  - what breaks without it: a variable a gate, a docs-retrieval server, a Bedrock/Vertex setup or an API gateway's own credential (such as `ANTHROPIC_AUTH_TOKEN`) needs, and any value set in `watcher.env`, no longer reaches the session. The gateway's URL itself is kept by the base set; name only the credential case here and point at `docs/watcher.md` for the rest;
  - a pointer to `docs/watcher.md` → `### The session's environment` for the base set, rather than restating that set.

**Verification:**

- The schema's `items.pattern` string is byte-identical to `SANDBOX_PASS_ENV_PATTERN`'s.
- The new fixture differs from a valid configuration only in `sandbox.passEnv`, and `package.json`'s chain names it once.
- The §5 row names `docs/watcher.md` as the owner of the base set and lists no base-set names itself.
