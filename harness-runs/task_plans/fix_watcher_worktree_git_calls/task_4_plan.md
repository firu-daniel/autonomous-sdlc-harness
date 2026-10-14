### Task 4 — `doctor --job-surfaces=<branch>`: refuse a branch whose own commits changed the job's surfaces

**Goal:** Give `doctor` an option the remote job runs, from the **pinned** CLI, before it trusts anything the run's branch carries: `--job-surfaces=<github-default-branch>`.

- With it, `doctor` runs exactly one check, `job-surfaces`, and exits by that check's grade.
- It fails when the branch's **own** commits changed any path in `jobSurfacePaths`. Those are the commits between `merge-base(HEAD, origin/<defaultBranch>)` and `HEAD`.
- `defaultBranch` and every other configured value come from **`<github-default-branch>`'s tree**, never the branch's.
- **A second form, `--job-surfaces=<github-default-branch>@<commit>`**, for a caller running after a sandboxed session has had the checkout. That session can write the checkout's `.git/refs` and `packed-refs`, so `refs/remotes/origin/<branch>` there could point at its own tip and make the merge base the tip. With `@<commit>`, the trusted configuration is `<commit>:harness.config.json` and the base is `merge-base(HEAD, <commit>)`; no `refs/remotes/origin/*` ref is read, and `<branch>` only labels the messages. The job-mode watchdog (Task 6) passes the commit `harness-run.yml` recorded before any session ran (Task 9).

**Depends on:** Task 3, which exports:

- `cli/src/generators/writeProtection.ts` → `jobSurfacePaths(config: HarnessConfig): readonly string[]`: the repo-relative paths a remote job runs or loads from its checkout. These are the outer-loop scripts and `<scriptsDir>/lib`, `<githooksDir>`, `.mcp.json`, `.claude/settings.autonomous.json`, `.claude/settings.json`, `.claude/settings.local.json` and `harness.config.json`, plus `<scriptsDir>/docs-search-server.sh` where retrieval applies.
- `cli/src/core/git.ts` → `mergeBase(repoRoot, a, b): string | undefined`, `fileAtRef(repoRoot, ref, path): string | undefined` and `changedPathsBetween(repoRoot, base, tip, pathspecs): readonly string[] | undefined`.

**Where this task stops.** The workflow step that runs this option is **Task 9's**, and spells it `--job-surfaces=<branch>`: it runs on a fresh checkout before any session. The watcher's job-mode watchdog call of it is **Task 6's**, and spells it `--job-surfaces=<branch>@<commit>`.

### Targets

- `cli/src/core/json.ts`
- `cli/src/config/io.ts`
- `cli/src/doctor/checks.ts`
- `cli/src/commands/doctor.ts`
- `cli/test/doctor-job-surfaces.test.mjs` (new)

**Work:**

- [ ] **`core/json.ts` + `config/io.ts`: one parse path for a configuration's text, whoever read the bytes.** `config/io.ts`'s header says it is *"the only place the CLI reads or writes that file"*, and no export today takes a configuration's text: `loadConfig(repoRoot)` reads from disk through `readJsonFile`. So `checks.ts` must not `JSON.parse` the ref's text or call `checkConfigShape` itself. And `config/io.ts` must not grow a second copy of `readJsonFile`'s parse and its failure sentence either (`.claude/context/conventions.md` → `## Shared code, and where it lives`; `### Where a new responsibility goes` → **Before adding a copy of anything, grep for it**): today `cli/src/core/json.ts` → `readJsonFile` is the one place that parses an adopter's JSON file and words its failure, inline — `JSON.parse(text)`, then `throw new HarnessError(\`${path} is not valid JSON: ${detail}\`)`.
  - **`core/json.ts`, first.** Factor that parse-and-throw into a new export, `export function parseJsonText<T extends JsonValue = JsonValue>(text: string, label: string): T`. It `JSON.parse`s `text` and, on failure, throws the same `HarnessError`, `${label} is not valid JSON: ${detail}`, with `detail` derived exactly as now. `readJsonFile` keeps its signature, its `ENOENT`-gives-`undefined` behaviour and its rethrow of any other read error, and calls `parseJsonText(text, path)`, so its message stays byte-identical. Give `parseJsonText` a doc comment carrying the "unparsable is not absent" reasoning `readJsonFile`'s comment states today, with `readJsonFile`'s comment pointing to it, and amend the module header's account of what the module owns to name the text-level parse as the CLI's one parse of an adopter's JSON, whoever read the bytes.
  - **`config/io.ts`.** Add `export function loadConfigText(text: string | undefined, origin: string): LoadedConfig`. It holds `loadConfig`'s parse-and-check body:
    - `undefined` text gives the same *not found* `error` problem `loadConfig` reports today, naming `origin` where the disk path stood.
    - The parse is `parseJsonText(text, origin)` from `core/json.ts`. A thrown `HarnessError` becomes the *unparsable* `error` problem carrying that error's message, exactly the way `loadConfig` turns `readJsonFile`'s throw into one today. `io.ts` restates no part of the `is not valid JSON` wording and calls no `JSON.parse` of its own.
    - Otherwise `checkConfigShape(parsed)`, and `config` is set only for a JSON object, exactly as now.
    - The returned `path` is `origin`. Amend `LoadedConfig.path`'s doc comment to say it is the disk path for `loadConfig` and the `<ref>:<file>` label for a configuration read from a git ref.
  - `loadConfig` keeps its signature and its behaviour, by either route: stay on `readJsonFile` for the disk read and share only the post-parse body with `loadConfigText`, or read the file's text (absent gives `undefined`; any other read error keeps today's `error` problem carrying that error's message) and return `loadConfigText(text, configPath(repoRoot))`. Either way every existing message stays byte-identical for a disk read, so `doctor`, `init` and `config` callers see no change.
  - Amend `config/io.ts`'s module header in the same edit: the module also parses a configuration read from a git ref, `fileAtRef` in `core/git.ts` supplies those bytes and `parseJsonText` in `core/json.ts` parses them. This module is still the only place that checks `harness.config.json`, whatever read it.
- [ ] **`checks.ts`:** add `JOB_SURFACES_CHECK`, named `job-surfaces`. The order of the procedure matters:
  1. Read `harness.config.json` from the **trusted ref**, with `fileAtRef`: `<commit>` when the option carries `@<commit>`, else `refs/remotes/origin/<branch>`. Pass the result to `loadConfigText(text, '<trusted ref>:harness.config.json')`. Grade `fail` on any `error`-severity problem it returns (`hasErrors` from `config/check.ts`), naming the problems. The `<branch>` is the value the option carries, through a new `CheckContext` field. `checks.ts` adds no `JSON.parse` and no `checkConfigShape` call of its own.
  2. Take its `defaultBranch`.
  3. Compute `mergeBase(root, 'HEAD', <base ref>)`, where `<base ref>` is `<commit>` when the option carries one, and `refs/remotes/origin/<defaultBranch>` otherwise. With `@<commit>`, `fail` also when `<commit>^{commit}` does not resolve, naming it.
  4. Run `changedPathsBetween(root, base, 'HEAD', jobSurfacePaths(trustedConfig))`.

  Grading:
  - `pass` when the list is empty.
  - `fail` naming every changed path, with the remedy: land that change on the default branch through a supervised route, then re-dispatch.
  - `fail` when the default branch's ref or its configuration is missing or unreadable, or when no merge base exists. Each of those messages names what was looked for.

  **Declare it beside `CHECKS`, not in it.** It needs a ref only the job has, and it runs before the plugin and the profile exist, so it is not part of a plain `doctor` run. Argue that in `checks.ts`'s header, where `CHECKS` is introduced.
- [ ] **`doctor.ts`:**
  - Recognise `--job-surfaces=<branch>` in `parseOptions`, as a token beginning `--job-surfaces=`, and add it to `OWN_FLAGS`. Split the value at its **last** `@`: when the part after it is 40 or 64 lower-case hex characters, that is the `<commit>` and the part before is `<branch>`; otherwise the whole value is `<branch>` (a branch name may hold `@`, never `@{`). Carry both through the `CheckContext` field.
  - Refuse an empty value, an empty `<branch>`, and a value starting with `-`, as a `HarnessError` that names the option.
  - When it is given, run `[JOB_SURFACES_CHECK]` instead of `CHECKS`, with the same report and the same exit contract.
  - `--job-surfaces=` combined with any other `doctor` option is a usage refusal.
  - Document the option in the command's `--help` text and in the module header beside `--remote-job`. State the reason it is a flag value rather than an environment probe, using the header's own *"A flag rather than a probe of the job's environment"* reasoning.
- [ ] **`cli/test/doctor-job-surfaces.test.mjs`:** opens with the rule it enforces, *a branch whose own commits changed a path the job runs or loads is refused before the job trusts it, and the trusted configuration is the default branch's*. Each case builds a fixture with a bare origin, a default branch carrying `harness.config.json`, a run branch pushed, and the clone checked out on the run branch with `refs/remotes/origin/*` fetched. The cases:
  - **Honest branch:** only `src/` changed. It passes.
  - **One case each** for a branch commit changing `<scriptsDir>/autonomous-watcher.sh`, `<scriptsDir>/lib/harness-run-lib.sh`, `.claude/settings.json`, `.mcp.json`, `githooks/pre-push`, `.claude/settings.autonomous.json` and `harness.config.json`. Each fails naming that path.
  - **Merged default:** a branch that merged a newer default branch which itself changed `.mcp.json`. It passes: only the branch's own commits count.
  - **The branch rewrote its config:** the branch's `harness.config.json` sets `defaultBranch` to the branch itself. It still fails, because the trusted configuration is read from the option's branch.
  - **The adopter's own script:** a file under `scripts/` that is not an outer-loop script, changed. It passes.
  - **No configuration on the option's branch.** It fails.
  - **An unparsable configuration on the option's branch.** It fails, and the message names `refs/remotes/origin/<branch>:harness.config.json`, the `origin` label `loadConfigText` was given.
  - **A forged base, `@<commit>` form.** The run branch commits `.claude/settings.json`; then the clone's `refs/remotes/origin/<default>` is pointed at the run branch's tip with `update-ref`. `--job-surfaces=<default>@<the default branch's real commit>` fails naming `.claude/settings.json`; the honest branch passes in the same form.
  - **An unknown `@<commit>`.** A well-formed hex id the clone does not hold fails, naming it.
- [ ] **A `RED ONCE` block in the test file's header**, one line per case:
  - make the check read `harness.config.json` from `HEAD` instead of the option's branch → *the branch rewrote its config* passes wrongly;
  - drop `harness.config.json` from `jobSurfacePaths` → its case passes wrongly;
  - compare from `refs/remotes/origin/<defaultBranch>` instead of the merge base → *merged default* fails wrongly;
  - use the local `refs/remotes/origin/<defaultBranch>` as the base, and read the configuration from `refs/remotes/origin/<branch>`, even when the option carries `@<commit>` → *a forged base* passes wrongly.

  Apply each mutation once, run the file, record the observed failing assertion, and revert.

**Verification:**

- `npm test --workspace cli -- test/doctor-job-surfaces.test.mjs` passes, and each `RED ONCE` mutation was run and observed failing as recorded.
- `bash scripts/typecheck.sh` exits 0.
- `git diff main -- cli/src/doctor/checks.ts` adds no line matching `JSON\.parse|checkConfigShape`: the task adds no second parser of `harness.config.json`.
- `git grep -nE "function loadConfigText" -- cli/src` is non-empty, and every hit is in `cli/src/config/io.ts`. `config/io.ts`'s module header names the git-ref read and `fileAtRef`.
- `git grep -n "JSON.parse\|is not valid JSON" -- cli/src/core/json.ts cli/src/config/io.ts` shows the parse and the sentence only in `cli/src/core/json.ts`: no hit is in `cli/src/config/io.ts`.
- `git grep -n "export function parseJsonText" -- cli/src` is non-empty, every hit is in `cli/src/core/json.ts`, and `readJsonFile`'s body calls it.
- `node cli/dist/cli.js doctor --job-surfaces=` exits non-zero with a message naming the option, and so do `doctor --job-surfaces=-x` and `doctor --job-surfaces=@0123456789abcdef0123456789abcdef01234567`.
