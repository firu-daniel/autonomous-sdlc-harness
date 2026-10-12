### Task 1 — Add the `sandbox` configuration key to the config model and its structural check

**Goal:** Give `harness.config.json` an optional `sandbox` object. It carries two keys: `allowedDomains`, the adopter's own part of the sandbox's network allowlist, where each entry gives its reason and the default is none; and `optOut`, the explicit, named opt-out with a required reason. Both are declared in `cli/src/config/model.ts`, checked by `cli/src/config/check.ts`, and exposed through two predicates that every later reader imports rather than re-deriving.

**Where this layer's task stops.** This task owns the in-language shape and the hand-written structural check only:

- The JSON Schema property and its negative fixtures are **Task 12's** (`general`).
- The `docs/config.md` §5 rows are **Task 14's**.
- What the profile does with the values is **Task 2's**.
- Grading the profile against them is **Task 6's**.

The four places are one contract (`.claude/context/conventions.md` → `### The order files are created…`, item 1). The story index's `## Context` → **Order** states why the schema lands after this task, and Task 12 restates it.

### Targets

- `cli/src/config/model.ts` — the interfaces, the pattern constant and the two predicates.
- `cli/src/config/check.ts` — the key set, the types, the non-empty strings and the domain pattern, plus a line in the module header's `## What it checks` list.
- `cli/test/config-sandbox.test.mjs` (new) — the accompanying suite.

**Work:**

- [ ] `model.ts`: declare the interfaces and the `HarnessConfig` field, each with a one-line condensed description:

  ```ts
  export interface HarnessSandboxDomain { readonly domain: string; readonly reason: string }
  export interface HarnessSandboxOptOut { readonly reason: string }
  export interface HarnessSandbox {
    readonly allowedDomains?: readonly HarnessSandboxDomain[];
    readonly optOut?: HarnessSandboxOptOut;
  }
  ```

  Add `sandbox?: HarnessSandbox` to `HarnessConfig`. Property names equal the JSON keys, with no mapping layer.

- [ ] `model.ts`: export `SANDBOX_DOMAIN_PATTERN: RegExp`. It matches a bare hostname or an IPv4 literal: dot-separated labels of letters, digits and inner hyphens, with no scheme, no port, no path and no wildcard. Task 12 writes the same pattern into the schema. A wildcard is excluded because the verified facts do not state that one is honoured. Also export:

  ```ts
  sandboxOptedOut(config: HarnessConfig): boolean
  sandboxAllowedDomains(config: HarnessConfig): readonly HarnessSandboxDomain[]
  ```

  - `sandboxOptedOut` is true exactly when `config.sandbox?.optOut?.reason` is a non-empty string after `trim()`.
  - `sandboxAllowedDomains` returns the configured list, or `[]` when it is absent.

  Write both in `retrievalApplies`' style, with a doc comment naming their readers: Tasks 2, 3 and 6.

- [ ] `check.ts`: add `sandbox` to the top-level key set, and add the section's own key sets: `allowedDomains` and `optOut` at the section level, `domain` and `reason` for an entry, `reason` for `optOut`. An unknown key at any of those levels is an error, mirroring `additionalProperties: false`. `allowedDomains` must be an array of objects. `domain` must be a non-empty string matching `SANDBOX_DOMAIN_PATTERN`. `reason` must be a non-empty string in both places. Each problem's message names the dotted key: `sandbox.allowedDomains[<i>].domain`, `sandbox.optOut.reason`, and so on. Update the module header's `## What it checks` paragraph in the same edit (`.claude/context/cli.md` → `## What "done" means here`, the module-header rule).
- [ ] `cli/test/config-sandbox.test.mjs`: open with the rule the suite exists to enforce. Drive the compiled CLI's `doctor` against throwaway fixtures (`cli/test/helpers/fixture.mjs`) and assert the `config` check's line for each case:
  - a valid `sandbox` with one domain and its reason passes;
  - an absent `sandbox` passes;
  - each of these is reported as an error naming the key: an entry missing `reason`, an empty `reason`, a `domain` carrying a scheme (`https://…`), a port or a `*`, an unknown key inside an entry, `optOut: true` instead of an object, and `optOut` without `reason`.

**Verification:**

- `npm test --workspace cli -- test/config-sandbox.test.mjs`, run from the repository root as one plain foreground command, passes. Then run `commands.typecheck` as written.
- `sandboxOptedOut({ sandbox: { optOut: { reason: '  ' } } } as HarnessConfig)` is `false`, because a blank reason is not a taken opt-out. A case in the suite asserts the `config` check's error for it rather than calling the function directly.
- Grep `cli/src` for a second hostname pattern or a second spelling of `optOut`, and find none outside `model.ts` and `check.ts`.
