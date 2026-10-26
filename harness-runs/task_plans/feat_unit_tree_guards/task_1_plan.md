### Task 1 — Add the `treeGuards` key to the config model and the shape check

**Goal:** Give the CLI the in-memory shape of the new optional `treeGuards` key and make its hand-written shape check accept a well-formed list and report a malformed one, so `config set`, the write guard and `doctor`'s `config` check all agree on what a legal entry is.

**Where this layer stops.** This task owns the model and the check only. The `doctor` check that grades whether each `test` names a real file is **Task 2's**, and it consumes the accessor this task adds. The schema property is **Task 6's** and the `docs/config.md` rows are **Task 7's**; both restate the shape below. No filesystem access happens here — `cli/src/config/check.ts`'s header forbids it (*"Anything about the filesystem … is `doctor`'s job"*).

**The contract this task defines** (the story index `## Context` states it once; restated so no implementer guesses):

- `HarnessTreeGuard` — `{ readonly test: string; readonly covers: string }`, both required.
- `HarnessConfig.treeGuards?: readonly HarnessTreeGuard[]`, placed **after `sandbox`**, the order the schema will declare it in (Task 6 appends the property after `sandbox`).
- `DEFAULTS.treeGuards: []` — the schema gives the key `default: []`.
- `configuredTreeGuards(config: HarnessConfig): readonly HarnessTreeGuard[]` — returns `config.treeGuards ?? DEFAULTS.treeGuards`. Task 2 imports exactly this name.
- `test` is the argument the single-file test command takes, verbatim, and is **not necessarily repo-relative**; `covers` is a repo-relative glob (`**` zero or more whole segments, `*` within one segment, `?` one character within one segment).

### Targets

- `cli/src/config/model.ts` — the interface, the `HarnessConfig` field, the `DEFAULTS` entry, the accessor, and the module header's path sentence.
- `cli/src/config/check.ts` — the key set, the per-entry check, and the module header's *What it checks* paragraph.
- `cli/test/config-tree-guards.test.mjs` (new) — the accompanying suite.

**Work:**

- [ ] `model.ts`: add `HarnessTreeGuard` (each field's doc comment is the schema description condensed to one line, per the header's rule), the `treeGuards` field on `HarnessConfig` after `sandbox`, `treeGuards: []` in `DEFAULTS`, and `configuredTreeGuards` beside `sandboxAllowedDomains`. Extend the `DEFAULTS` doc comment's *"`sandbox` is the same: no generator seeds it"* sentence to name `treeGuards` too. Amend the module header's **Paths** paragraph, which today names only `$schema` and `parity.referenceImplPath` as exceptions to *"every string path in this model is repo-relative"*: add `treeGuards[].test`, the argument the single-file test command takes.
- [ ] `check.ts`: add `'treeGuards'` to `TOP_LEVEL_KEYS` after `'sandbox'`, a `TREE_GUARD_KEYS = ['test', 'covers'] as const`, and a `checkTreeGuards(value, problems)` called from `checkConfigShape` after the `sandbox` block. It reports, at the paths an adopter edits (`treeGuards`, `treeGuards[<i>]`, `treeGuards[<i>].test`): not an array → error; an entry that is not an object → error; an unknown key in an entry → error through `checkUnknownKeys`; `test` or `covers` absent → `is required`; either not a non-empty string → error through `checkString`. Follow `checkSandbox`'s shape for the array walk.
- [ ] `check.ts` header: add `treeGuards` to the *What it checks* paragraph in one clause (each entry carries exactly a non-empty `test` and `covers`), and nothing to *What it deliberately does not re-implement* except, if you judge it needed, that whether a `test` names a real file is `doctor`'s question.
- [ ] `config-tree-guards.test.mjs`: open with the rule it enforces (`.claude/context/conventions.md` → `## The testing bar`, header-first). Drive the **compiled CLI** against a throwaway fixture from `cli/test/helpers/fixture.mjs`: `config set treeGuards '<json>'` with a well-formed two-entry list succeeds and `config get treeGuards` reads it back; each malformed shape above (a non-array, an entry missing `covers`, an entry with an extra key, an empty `test`) is refused, and the refusal leaves `harness.config.json` byte-identical (`.claude/context/cli.md` → *"A refusal is asserted on the bytes on disk"*). Build any child environment through the fixture helpers' runners rather than a hand-written `process.env` spread.

**Verification:**

- `npm test --workspace cli -- test/config-tree-guards.test.mjs`, from the repository root, passes.
- `bash scripts/typecheck.sh` passes — the new field is optional, so no existing reader of `HarnessConfig` changes.
- `git grep -n "configuredTreeGuards" -- cli/src` names its declaration in `model.ts`; its consumer lands in Task 2.
