### Task 14 — Add `init --plugin-root-entries` for a freshly generated profile

**Goal:** Let a remote job get a permission profile its own plugin install can run under. The job's checkout path and its plugin install root exist only inside that job, the profile is gitignored and machine-specific, and `init` deliberately writes no plugin-root entry today; so `init` gains an opt-in switch that, when it generates the profile in this run, includes the `Read` and helper `Bash` entries for every plugin root this machine resolves — the same lines `doctor`'s `plugin-permissions` check tells a person to paste.

**Depends on:** nothing in this branch. Its consumer is Task 15's workflow, which runs `npx autonomous-sdlc-harness@<version> init --plugin-root-entries` after installing the plugin.

**Why a switch, and why off by default.** `docs/watcher.md` → `## 6.` step 3 records why `init` writes no such entry: `init` may run before the plugin is enabled, and a version-carrying path written once goes stale at the next upgrade. Both reasons still hold for a person's machine, so the default is unchanged. Neither holds inside a job: the plugin is installed immediately before, and the profile dies with the job. The switch is a run-shape row like `--git-init` — it writes no configuration key — so it carries no `configValue`. The task prompt authorises taking this decision (`### Running the harness in a job` → *"Decide how the job gets a profile … The profile also needs the `Read(//…/plugin/**)` entry"*); the module header that records it as open is amended in the same edit (below).

**The contract, stated once for every consumer** (Task 15 invokes it; Task 27 documents it):

- `init --plugin-root-entries`: the rendered profile's `permissions.allow` additionally carries, for each root the generator's existing `resolvedPluginRoots(repoRoot)` returns (runtime root first, de-duplicated — one when they collapse), exactly the entries `doctor`'s `plugin-permissions` check requires for that root. Whether that rendered profile reaches disk is the write engine's `create-if-absent` decision, unchanged: it is written when the engine's effect for `PROFILE_PATH` is `'created'` or `'backed-up-and-replaced'`, and has no effect when it is `'kept'`, in which case one note says the switch had no effect because the profile was kept. When no root resolves the run proceeds and says so in one warning, naming `claude plugin install` as the missing step.
- **Who decides what — route (a) of the review: the generator always appends, and "written or kept" is the write engine's own answer.** The generator makes **no** prediction of the `create-if-absent` outcome: it neither tests whether the profile exists nor reads `force` for this purpose, because that decision is owned by `cli/src/core/writer.ts` (`.claude/context/cli.md` → `## How a module in this layer is written`: *"`WritePolicy`'s values are the whole vocabulary"*; `.claude/context/conventions.md` → *"A responsibility that already has a home does not get a second one"*).
  - `init` decides nothing (`.claude/context/cli.md`: *"Commands order and report; they decide nothing"*). It passes only the boolean `pluginRootEntries: flags.pluginRootEntries === true` to `writePermissionProfile`, captures the `WriteResult[]` that its existing `plan.apply(…)` call already returns, takes the entry whose `path` equals the generator result's `path`, and passes that entry's `effect` (the `WriteEffect`, which is the same under `--dry-run`) to the generator-owned note function below, pushing any line it returns onto its `notes`. It builds no entry and composes no wording.
  - **The generator** resolves the roots through its existing `resolvedPluginRoots` (no second resolver anywhere — `init.ts` imports neither `pluginInstallRoot` nor `pluginRuntimeRoot`), builds the entries, and appends them to `allow` whenever the option is on. It returns on `PermissionProfileResult` the render-time fact `pluginRootEntries: 'off' | 'appended' | 'no-root'`, pushing the `no-root` warning onto the existing `warnings` array. It exports the one function that maps the write engine's answer to the report line:

    ```ts
    /** The note `init` reports for `--plugin-root-entries` once the plan is applied: the
     *  kept-profile line when `effect` is 'kept' and entries were appended; undefined otherwise. */
    export function pluginRootEntriesNote(
      outcome: PermissionProfileResult['pluginRootEntries'],
      effect: WriteEffect,
    ): string | undefined;
    ```

- **One producer per `allow` line on a forced run.** On `--force`, `carriedPluginRootEntries` still carries forward the old profile's plugin-root entries. With the option on, the generated entries and the carried ones can name the same roots. The generated set is the producer of every line it contains: the carried set is filtered to exclude any line the generated set carries before the two are concatenated, so each `allow` line has exactly one producer (the rule the module header's browser-fragment section states, *"one producer per entry"*). Carried lines the generator does not produce (a stale helper for an old root, an unverified absolute entry when no root resolves) are carried exactly as today.
- **One definition of those entries, with the inputs the doctor builder actually depends on.** Exported from `cli/src/generators/permissionProfile.ts`, stated once here for both callers:

  ```ts
  export interface PluginRootEntry { readonly kind: 'read' | 'helper'; readonly rule: string }
  /** The helper-script names graded at every root: the sorted, de-duplicated union of
   *  pluginHelperScripts(root) over `roots` while phases.qa is on; empty while it is off. */
  export function pluginRootHelpers(roots: readonly string[], qaOn: boolean): readonly string[];
  /** The entries one root requires: readRule(root) unless it is the install root, then
   *  bashScriptRule(pluginHelperPath(root, name)) for each of `helpers`, in that order. */
  export function pluginRootEntries(
    root: string,
    options: { readonly isInstallRoot: boolean; readonly helpers: readonly string[] },
  ): readonly PluginRootEntry[];
  ```

  `PLUGIN_PERMISSIONS_CHECK` computes `helpers = pluginRootHelpers(roots, qaOn)` and each group's `required` as `pluginRootEntries(root, { isInstallRoot: root === installRoot, helpers }).map(({ kind, rule }) => ({ rule, symptom: … }))`, the symptom chosen by `kind` from its two existing strings — so its output is byte-identical. The generator calls the same two functions over `resolvedPluginRoots(repoRoot)`, with `isInstallRoot` computed as `root === normalizedRoot(installRoot)` (its roots are normalized; the check's comparison is against the same install root) and `qaOn = config.phases?.qa === true`, and appends each entry's `rule`. The entries `init` writes and the entries `doctor` asks for therefore cannot differ.

### Targets

- `cli/src/generators/permissionProfile.ts` — `PluginRootEntry`, `pluginRootHelpers`, `pluginRootEntries`, `pluginRootEntriesNote`; the `pluginRootEntries?: boolean` option on `PermissionProfileOptions`; the unconditional append over `resolvedPluginRoots` when the option is on; the carry-forward de-duplication against the generated set; the `pluginRootEntries` render outcome on `PermissionProfileResult` with its no-root warning.
- `cli/src/generators/permissionProfile.ts` → the module header's `## What this module deliberately does not do` section, two bullets: **"It touches no filesystem beyond reading its two templates — and, on a forced run, the profile it is about to replace."** and **"It does not allow-list the interactive-test phase's own helper scripts."** (its closing sentence *"Whether `init` should also *write* those entries is an open owner decision rather than a closed one; nothing here takes it."*). Also the sentence at the end of the first bullet, *"Preserving an entry is not generating one — the open owner decision below is untouched by it."*, which must stay true of the amended wording.
- `cli/src/doctor/checks.ts` — `PLUGIN_PERMISSIONS_CHECK` calling `pluginRootHelpers` and `pluginRootEntries`.
- `cli/src/commands/init.ts` — the `InitFlags` key, the `INIT_OPTIONS` row, passing the boolean `pluginRootEntries: flags.pluginRootEntries === true` to `writePermissionProfile`, and capturing `plan.apply`'s returned `WriteResult[]` to pass the profile entry's `effect` to `pluginRootEntriesNote`; nothing else.
- `cli/test/init.test.mjs` — the accompanying cases.

**Work:**

- [ ] Extract `pluginRootHelpers` and `pluginRootEntries` (signatures above) from the `plugin-permissions` check into `permissionProfile.ts`, with doc comments naming both callers, and switch the check to them with no change to its output (its existing `doctor.test.mjs` cases are the evidence).
- [ ] Add the `pluginRootEntries?: boolean` key to `InitFlags` and a switch row `--plugin-root-entries` (summary: *Include this machine's plugin-root permission entries when the profile is generated (for a remote job)*), placed among the run-shape rows, with a constant for the flag spelling like its neighbours. In `init`, pass only the boolean to `writePermissionProfile`, keep `plan.apply`'s return value, and push `pluginRootEntriesNote(profile.pluginRootEntries, <the PROFILE_PATH entry's effect>)` onto `notes` when it returns a line.
- [ ] In the generator, when the option is true: resolve roots through `resolvedPluginRoots(repoRoot)`, build the entries, filter the forced run's carried-forward lines against them, append them to `allow` unconditionally, and set `pluginRootEntries` (`appended` / `no-root`; `off` when the option is false) with the no-root warning; add `pluginRootEntriesNote`. No existence test of the profile and no reading of `force` for this purpose.
- [ ] **Amend the module header in the same edit** (`.claude/context/cli.md` → `## What "done" means here`): the filesystem bullet gains that under `--plugin-root-entries` the generator also reads the agent runner's plugin records (through `resolvedPluginRoots`) on every run, forced or not, and still never tests the profile's existence — whether the render lands is the write engine's `create-if-absent` answer; the helper-scripts bullet's closing sentence is rewritten to record that the owner decision is **taken for the opt-in `init --plugin-root-entries` only**, with the reason (inside a job the plugin is installed immediately before, and the profile dies with the job), and that the default stays unchanged for the reasons the bullet already gives; the first bullet's "open owner decision below is untouched" sentence is reworded to match (preserving is still not generating by default); and the browser-fragment section's *"one producer per entry"* is satisfied by the de-duplication above, which the filesystem bullet names.
- [ ] Cases, with a planted `installed_plugins.json` under a temp Claude home (the variable `CLAUDE_HOME_VARIABLE` names, `cli/src/machine/paths.ts`): a first `init --plugin-root-entries` writes a profile carrying the planted root's entries and `doctor`'s `plugin-permissions` then passes; the same `init` without the flag writes none (today's behaviour); a second `init --plugin-root-entries` over the kept profile changes nothing and prints the kept note (idempotence), and the same under `--dry-run` prints the same note; no planted root → the warning, and the profile is otherwise identical to one written without the flag; `init --force --plugin-root-entries` over a profile already carrying the planted root's pasted entries → each of those `allow` lines appears exactly once.

**Verification:**

- `bash scripts/typecheck.sh` and `bash scripts/test.sh` exit 0; every existing `plugin-permissions` case in `cli/test/doctor.test.mjs` passes unchanged.
- `init --help` lists the switch with its summary.
- `grep -n "pluginHelperScripts" cli/src/doctor/checks.ts` no longer finds a second per-root entry builder there.
- `grep -n -E "pluginInstallRoot|pluginRuntimeRoot|resolvedPluginRoots|readRule|bashScriptRule" cli/src/commands/init.ts` has no hit: `init` resolves no root and builds no entry.
- `grep -n -E "existsSync|PROFILE_PATH" cli/src/generators/permissionProfile.ts` shows no new existence test of the profile added by this task: the generator does not predict the `create-if-absent` outcome.
- `grep -n "open owner decision" cli/src/generators/permissionProfile.ts` shows the amended wording: each hit states the decision is taken for `--plugin-root-entries` only and the default is unchanged.
- A `phases.qa: true` case: the entries `init --plugin-root-entries` writes equal, as a set, the rules `doctor`'s `plugin-permissions` check requires for the same planted roots (the check passes with no stray and no missing line).
