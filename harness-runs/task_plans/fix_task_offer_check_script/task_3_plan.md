### Task 3 — Merge the fence's `Bash(…)` allow rule into `.claude/settings.json`

**Goal:** The generated, committed `.claude/settings.json` gains exactly the `Bash(…)` rule the fence's bare invocation matches, merged without disturbing any key an adopter already has, so an interactive session runs the opt-out check without a permission prompt.

**Depends on:** Task 1, which exports from `cli/src/generators/outerLoopScripts.ts` `taskOfferCheckRule(config: HarnessConfig): string` — `` `Bash(${taskOfferCheckInvocation(config)})` ``, exact with no `:*` — and `taskOfferCheckInvocation(config)`, `bash <scriptsDir>/task-offer-check.sh`. Task 2, which renders that same invocation into `.claude/CLAUDE.md` item 4 as `{{taskOfferCheckCommand}}`. This task writes the rule and asserts the two views agree; it builds neither string itself.

**Where this task stops.** `doctor`'s grading of a missing rule is Task 4's. The unattended profile (`settings.autonomous*.json`) gains **no** allow entry from this task or any other (clause 1 already excludes unattended runs); the one deny entry it gains comes from Task 1's table row.

### Targets

- `cli/src/generators/projectSettings.ts`
- `cli/src/commands/init.ts` → the `writeProjectSettings({ repoRoot, plan, flags })` call
- `cli/test/task-offer-allow-rule.test.mjs` (new)

**Work:**

- [ ] **`projectSettings.ts`.** `buildProjectSettings` and `writeProjectSettings` take the config (`config: HarnessConfig`) beside `flags`. The payload gains `permissions: { allow: [taskOfferCheckRule(config)] }` after the two existing keys, so `mergeMissing` adds it where `permissions` or `permissions.allow` is absent and leaves everything already there. `merge-json` treats an array as a leaf, so an existing `permissions.allow` list is kept as it stands: `writeProjectSettings` reads the existing file (`readJsonFile`, a read a generator may make) and, when it holds a `permissions.allow` array lacking the rule — or a `permissions` / `permissions.allow` of another type — pushes one warning naming the file, the exact rule, and that `init` never edits an existing list, so the rule is added by hand. Export a constant for the key path (`PERMISSIONS_KEY = 'permissions'`, `ALLOW_KEY = 'allow'`) so Task 4 descends through it rather than through literals. **Amend the module header** in the same edit: it now owns a third thing, the fence's allow rule, which is independent of the two plugin keys' written-together rule; state why the rule lives in the committed project file (every teammate's interactive session runs the fence, the unattended profile is machine-local and excluded by clause 1) and choice 3's consequence for an existing `allow` list. **Also rewrite the header's closing sentence**, *"Nothing here touches the filesystem beyond reading this package's own manifest: the generator plans, and `init` applies the plan once."*, which this task's read makes false: the replacement states that the generator reads this package's own manifest **and** the adopter's existing `.claude/settings.json`, the latter only to decide whether to warn about an existing `permissions.allow` list, and that it still mutates nothing — the plan stays a `merge-json` request that `init` applies once.
- [ ] **`init.ts`.** Pass `config` to `writeProjectSettings`; nothing else changes — its warnings already reach the reporter.
- [ ] **`cli/test/task-offer-allow-rule.test.mjs`** (new). Header first: *the rule this file exists to enforce — the committed project settings allow-list exactly the invocation the fence names, and the merge never disturbs an adopter's keys*. Cases, each against a throwaway fixture driving the compiled CLI's `init`:
  - (a) A first `init` on the generated default `scriptsDir`, and again with `--scripts-dir tools/harness`: `.claude/settings.json` → `permissions.allow` is exactly `[rule]`; the rule equals `` `Bash(${x})` `` where `x` is the inline code span item 4 of the rendered `.claude/CLAUDE.md` names (found after the `{{taskOfferCheckCommand}}`-rendered position, i.e. the span that starts `bash `); and `x` is `bash <scriptsDir>/task-offer-check.sh` for that run's `scriptsDir`, read off the written `harness.config.json`.
  - (b) A fixture whose `.claude/settings.json` already holds `permissions.allow: ["Bash(npm test)"]`, a `permissions.deny` list and a `hooks` key: after `init` the file's `permissions` and `hooks` are byte-for-byte what they were (the rule is **not** added), and `init`'s output carries one warning naming `.claude/settings.json` and the exact rule.
  - (c) A fixture whose `.claude/settings.json` holds `permissions: { deny: [...] }` and no `allow`: after `init`, `permissions.allow` is `[rule]` and `deny` is unchanged.
  - (d) A second `init` over (a)'s result reports the file kept and leaves its bytes unchanged.
  - Record in the header, per case, the mutation that turns it red and that each was run red once (in memory or on a throwaway edit, never committed) — e.g. (a) the rule built from `bash {{scriptsDir}}/…` by hand in the generator; (b) a payload that replaces `permissions.allow`; (c) `permissions` omitted from the payload; (d) the rule appended unconditionally.

**Verification:**

- `npm test --workspace cli -- test/task-offer-allow-rule.test.mjs` passes, and its header records each case's red-turning mutation as run once.
- `bash scripts/typecheck.sh` passes.
- `git grep -n -F 'Bash(bash ' -- cli/src` names no literal rule: the only producer is `taskOfferCheckRule`.
