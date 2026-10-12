### Task 12 — Declare `sandbox` in the configuration schema, with its two negative fixtures

**Goal:** Make `sandbox` a legal key of `harness.config.json` in `schemas/harness.config.schema.json`, with the same shape Task 1 gave the model and the structural check. Prove its two load-bearing constraints with negative fixtures wired into `npm run validate:config:negative`. The constraints are: every allowed domain states its reason, and the opt-out is a reasoned object, never a bare switch.

**Depends on:** Task 1. This schema property must match `cli/src/config/model.ts` key for key:

```ts
interface HarnessSandboxDomain { readonly domain: string; readonly reason: string }
interface HarnessSandboxOptOut { readonly reason: string }
interface HarnessSandbox {
  readonly allowedDomains?: readonly HarnessSandboxDomain[];
  readonly optOut?: HarnessSandboxOptOut;
}
// HarnessConfig.sandbox?: HarnessSandbox
// SANDBOX_DOMAIN_PATTERN: a bare hostname or IPv4 literal — dot-separated labels of
// letters, digits and inner hyphens; no scheme, no port, no path, no wildcard
```

It also matches `cli/src/config/check.ts`'s sandbox key sets.

**Why this lands after the model.** The configured layer order puts the catch-all `general` layer last. Contract-before-consumer still holds within the branch: nothing validates a configuration against the schema except the `validate:config*` scripts, which read `examples/` and `schemas/negative/` only. The CLI's own check has accepted the key since Task 1. Nothing in this task changes the CLI.

### Targets

- `schemas/harness.config.schema.json` — the `sandbox` property.
- `schemas/negative/sandbox-domain-without-reason.json` (new).
- `schemas/negative/sandbox-opt-out-boolean.json` (new).
- `package.json` — two chained assertions in `validate:config:negative`.
- `schemas/negative/README.md` — one sentence per new fixture.

**Work:**

- [ ] Schema: add `sandbox` to the root `properties`. It is an object with `additionalProperties: false` and a `description` naming its readers: `init`, which renders it into the unattended profile, and `doctor`, which grades the profile against it.
  - `allowedDomains`: an array of objects, `additionalProperties: false`, `required: ["domain", "reason"]`.
    - `domain`: a string whose `pattern` is the same expression as `SANDBOX_DOMAIN_PATTERN`. Copy it from `model.ts` and say in the description that the two must match.
    - `reason`: a string, `minLength: 1`.
    - `default: []`.
  - `optOut`: an object, `additionalProperties: false`, `required: ["reason"]`, `reason` with `minLength: 1`. Its description says it runs every unattended command unsandboxed, that it is never a default, and that the profile shows it.

  Do not mark `sandbox` itself required.
- [ ] `sandbox-domain-without-reason.json`: a copy of `examples/harness.config.json`, with `$schema` re-based to `../harness.config.schema.json` per the directory README's caveat. Its one change is `"sandbox": { "allowedDomains": [ { "domain": "registry.npmjs.org" } ] }`.
- [ ] `sandbox-opt-out-boolean.json`: the same copy, with its one change `"sandbox": { "optOut": true }`.
- [ ] `package.json` → `validate:config:negative`: append one `&& node schemas/validate.mjs test -s schemas/harness.config.schema.json -d schemas/negative/<file> --invalid` per new fixture, in the existing chain's form. A fixture no assertion wires in is never run (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`).
- [ ] `schemas/negative/README.md`: add one sentence per fixture, in the existing pattern of *what it proves and why the constraint exists*:
  - The domain one exists because the profile repeats each allowed domain's reason, and an unexplained entry is a network grant nobody can audit.
  - The opt-out one exists because the opt-out must be explicit and named, and a bare `true` records no reason for turning off the sandbox.

**Verification:**

- `grep -o 'schemas/negative/sandbox-[a-z-]*\.json' package.json` prints exactly the set of `sandbox-*.json` files that `ls schemas/negative` lists, so no fixture is left unwired.
- Each fixture differs from `examples/harness.config.json` only in the `sandbox` key and the re-based `$schema`. Check it by reading the two documents side by side.
- The schema gate itself (`validate:config`, `validate:config:negative`) runs in the Run gates phase. This task does not run it.
