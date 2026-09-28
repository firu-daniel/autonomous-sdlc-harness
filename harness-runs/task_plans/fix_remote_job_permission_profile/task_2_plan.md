### Task 2 — Require the plugin-root `Read` grant at the runtime root, including a root that is both

**Goal:** Change the one per-root builder that `init --plugin-root-entries` and `doctor`'s `plugin-permissions` check both call, so a `Read` grant is required at the **runtime root** whatever `phases.qa` says — including the ordinary git-sourced machine where the runtime root and the install root are one directory — and is exempt only at an install root that is *not* also the runtime root (task prompt → `## What is wrong`, findings 1 and 4).

**Depends on:** Task 1 — for the shared file `cli/test/init.test.mjs` only; nothing in this task uses what Task 1 built.

**Why this rule and not "drop the exemption in the job".** The exemption rests on one measurement (`cli/src/doctor/checks.ts` → `PLUGIN_PERMISSIONS_CHECK`'s header, *"Measured 2026-08-26, under a generated profile naming no rule over either root: sixteen `Read` calls under the install root succeeded … while ten under the runtime root were refused"*). That run was on a `directory`-sourced marketplace (`cli/src/machine/plugins.ts` → the module header's *"On a `directory`-sourced marketplace those two were measured to differ (2026-08-26)"*), where the install root is a cache snapshot the runtime does not substitute. Gate 12 round 1 (2026-09-28, scratch repository `firu-daniel/harness-gate12`, GitHub-hosted runner, GitHub-sourced marketplace, `phases.qa` off) had one root that is both, and every `Read` of `<root>/instructions/*.md` asked for permission while `cat`/`ls` were refused as outside "the allowed working directory". So the only root shape ever measured to read ungranted is a non-runtime install root, and that is the only one this task leaves exempt. A job-only switch would leave a git-sourced adopter's own machine in the shape the runner just refused.

**The builder's new contract — stated here and restated in Tasks 3 and 4, which call it.** In `cli/src/generators/permissionProfile.ts`:

```ts
export function pluginRootEntries(
  root: string,
  options: { readonly isRuntimeRoot: boolean; readonly helpers: readonly string[] },
): readonly PluginRootEntry[]
```

It returns `{ kind: 'read', rule: readRule(root) }` first **iff** `options.isRuntimeRoot`, then one `{ kind: 'helper', rule: bashScriptRule(pluginHelperPath(root, name)) }` per `helpers` entry, in that order. The runtime root is `pluginRuntimeRoot(repoRoot)` from `cli/src/machine/plugins.ts`, which falls back to the install root wherever the marketplace is not `directory`-sourced — so on every git-sourced machine the single root is the runtime root and carries the `Read`. The `isInstallRoot` option is removed, not kept beside the new one.

**Where this task stops.** It changes *which* entries are required and how the check explains them. It does **not** add `permissions.additionalDirectories` to the generated profile, touch `init`'s notes or the `--plugin-root-entries` `_README` line (all **Task 3**), add any job-mode grading or `fail` (**Task 4**), or touch any document (**Task 9** carries the `docs/cli.md` side of this change). In `permissionProfile.ts` it edits only `pluginRootEntries`, its doc comment, and the one call inside `generatedPluginRootEntries`; in `checks.ts` only `PLUGIN_PERMISSIONS_CHECK` and its header.

### Targets

- `cli/src/generators/permissionProfile.ts` → `pluginRootEntries`, and the call inside `generatedPluginRootEntries`. **Shared file:** Task 3 edits other parts later.
- `cli/src/doctor/checks.ts` → `PLUGIN_PERMISSIONS_CHECK` and the doc comment above it. **Shared file:** Task 12 edited `buildCheckContext` before (the profile is read from the main checkout in a linked worktree); Tasks 4 and 5 edit it later.
- `cli/test/doctor.test.mjs` — the `plugin-permissions` cases. **Shared file:** Task 12 rewrote the sibling-worktree case before; Tasks 4 and 5 add cases later.
- `cli/test/init.test.mjs` — the `--plugin-root-entries` case that pins the old exemption. **Shared file** with Tasks 1 and 3.

**Work:**

- [ ] `permissionProfile.ts`: replace `pluginRootEntries`' `isInstallRoot` option with `isRuntimeRoot` per the contract above, and rewrite its doc comment to state the rule and the two measurements it rests on. In `generatedPluginRootEntries`, pass `isRuntimeRoot: root === <the normalized pluginRuntimeRoot(repoRoot)>`, using the same `normalizedRoot` the roots were normalized with; drop the `install` binding if nothing else reads it (`noUnusedLocals`).
- [ ] `checks.ts` → `PLUGIN_PERMISSIONS_CHECK.run`: pass `isRuntimeRoot: root === runtimeRoot`. A resolved root now always carries a `Read` requirement, so the `required.length === 0` *not graded* disposition becomes unreachable once any root resolves — remove it rather than leave dead text, and keep what it reported that still matters (an unreadable config leaving the helper entries ungraded, and the `stray` clause) on the surviving warn and pass dispositions. Rewrite the `why` clause and delete the `coincide` tail (*"is deliberately not one of them — measured 2026-08-26 …"*): the report now says the `Read` is required at the runtime root, including where it is also the install root, and is not required at an install root distinct from it, citing both measurements in one sentence each.
- [ ] `checks.ts` → the doc comment above `PLUGIN_PERMISSIONS_CHECK`: replace the bullets *"A `Read` rule at a runtime root that differs from the install root"* and *"No `Read` rule over the install root"* with the new rule, keep the 2026-08-26 measurement stated as what it measured and on which marketplace source, add the 2026-09-28 Gate 12 round-1 observation with its exact refusal wording, and drop the now-false *"With nothing left to grade … it reports **not graded**"* paragraph. This is the correction the prompt asks to be recorded where the measurement is cited (`.claude/context/conventions.md` → `## Documents of record`: a measured fact states what was measured and the exact message).
- [ ] `cli/test/doctor.test.mjs`: the cases whose comment reads *"The seven cases above write no `known_marketplaces.json`, so the runtime root falls back to the install root and the two coincide"* now expect a `Read` line at that root — update them, including the *not graded* case, whose stray-entry assertion moves to the disposition that now carries it. Add one case with a **GitHub-sourced** marketplace record — extend `claudeConfigHome` (or add a sibling helper) so it can write `known_marketplaces.json` as `{ "<marketplace>": { "source": { "source": "github", "repo": "<owner>/<repo>" }, "installLocation": <dir> } }` — with `phases.qa` off and a profile lacking the `Read`: `plugin-permissions` warns and prints `Read(/<root>/**)` for that root. Keep the directory-sourced case asserting no `Read` at the separate install root.
- [ ] `cli/test/init.test.mjs`: the `init --plugin-root-entries` case whose comment reads *"The planted root is the install root, where doctor requires no read rule"* now asserts the `Read` entry **is** written at that root (it is the runtime root by fallback), and that `doctor` still grades the result with no missing line.

**Verification:**

- The edited cases in `cli/test/doctor.test.mjs` and `cli/test/init.test.mjs` pass, the new GitHub-sourced case among them.
- `commands.typecheck` passes — the removed `isInstallRoot` option leaves no caller behind (`grep -rn "isInstallRoot" cli/src` returns nothing).
- The `plugin-permissions` report on a GitHub-sourced record with `phases.qa` off names the missing `Read` line and says why the rule changed; on a directory-sourced record it still requires no `Read` at the install snapshot.
