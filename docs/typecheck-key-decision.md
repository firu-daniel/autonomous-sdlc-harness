# `commands.typecheck` as a required key — a decision record

**Who reads this:** whoever decides whether `commands.typecheck` stays a **required** configuration key. Read it beside the code it cites. §1 and §3 rest on `cli/src/config/check.ts`, `cli/src/config/model.ts`, `cli/src/detect/presets.ts` and `schemas/harness.config.schema.json`; §2 and the option sections add `cli/src/generators/scripts.ts`, `cli/src/generators/permissionProfile.ts`, `cli/src/generators/harnessConfig.ts` and `cli/src/doctor/checks.ts`. Every claim here is a statement about those files and is worth exactly what re-reading them says it is worth.

**What it settles.** One question, three answers, each of which binds **every** stack rather than the one that raised it: **(a)** make the key optional; **(b)** accept an explicit `none` sentinel that `doctor` grades as answered; **(c)** give the `php-composer` command family a typecheck fallback. That the cheapest-looking fix changes the contract for all stacks is why this is a decision record and not a patch.

**This is a record, and not a change.** It alters no behaviour. Nothing under `cli/src/`, `schemas/` or `plugin/` changes on the change that ships this file — the option §7 recommends is implemented by a later change, not by this one.

**It is ratified: option (b), the explicit `none` sentinel, on 2026-09-06.** §7 is the decision, not a recommendation. It has been implemented, by `feat_harness_typecheck_none_sentinel`; what that change settled is recorded in §7's `**Ratification.**`.

**What follows,** in order: `## 1. The bind` · `## 2. What depends on the key existing` · `## 3. Can another family reach this state?` · `## 4. Option (a) — make the key optional` · `## 5. Option (b) — an explicit "none" sentinel` · `## 6. Option (c) — a composer-family fallback` · `## 7. Recommendation`.

---

## 1. The bind

**The key is required twice, in two independent places.** `cli/src/config/check.ts` declares `COMMAND_REQUIRED = ['typecheck', 'test']`, and `schemas/harness.config.schema.json` lists the same two names in `properties.commands.required`. The schema states the intent in that object's `description`: "The shell commands the harness runs to verify a change. Only the two verification commands are required: a package with no development server or no separate build step is still a valid configuration." Neither place offers a third state; the key is present or the config is wrong.

**`checkCommands` gives an absent key an error and a placeholder one a warning.** Over `COMMAND_REQUIRED`, an `undefined` value produces the error `is required: the two verification commands are what "this change is done" means, so the flow cannot proceed without them`. Then, over every command key, a configured string that `isPlaceholder` accepts produces the warning `still holds the placeholder init wrote because it could not detect this command — replace it, or the run stops the first time it is invoked`.

**There is no way to spell "this stack has none."** `cli/src/config/model.ts` defines `COMMAND_PLACEHOLDER_MARKER`, written by `placeholderCommand` and read by `isPlaceholder` — and `isPlaceholder` is a **containment** test on that marker, not a comparison against `placeholderCommand`'s exact output, deliberately, so that a value an adopter half-edited still reads as unfinished. The consequence for this question is the one that matters: every value is either a real command line or an unfinished one. Absence is an error, the placeholder is a warning, and no third value carries the meaning "this repository has no type check" — so an adopter who has answered the question truthfully cannot say so.

**The state an ordinary PHP repository lands in.** Take a PHP repository whose `composer.json` declares no static analyser and whose suite is PHPUnit. `composerCommands` in `cli/src/detect/presets.ts` derives `typecheck` **only** from a configuration file the repository itself carries — `PHPSTAN_CONFIGS`, else `PSALM_CONFIGS` — and its own comment gives the sound reason: PHP has no analyser every project has, each is opt-in and each needs its own configuration file, "so naming one the repository does not configure would emit a line that fails on `vendor/bin` not existing rather than a check that verifies anything." `commands.test` resolves from `PHPUNIT_CONFIGS`; `commands.typecheck` does not resolve at all.

**So the repository is permanently warned, with a remedy it cannot perform.** `init` writes the placeholder into `commands.typecheck`; `selectWrapper` in `cli/src/generators/scripts.ts` returns `{ selected: false, placeholder: true }` for a placeholder value, so no typecheck wrapper is written; and `checkCommands`'s placeholder warning fires on every `doctor` run. The warning's instruction is "replace it" — but the only honest replacement is a static analyser the repository has chosen not to adopt. The adopter's choices are to install tooling to silence a warning, to write a command that is not a type check, or to run warned forever.

---

## 2. What depends on the key existing

Six sites are checked against `commands.typecheck` being absent, holding the placeholder, or filled — five of them turn on it and the sixth is a measured negative. Each entry states what the tree does today, with the anchor that shows it; §4, §5 and §6 argue their options against this list rather than re-deriving it.

**Wrapper generation — three arms, and they are not symmetric.** `selectWrapper` in `cli/src/generators/scripts.ts` is, in its own words, "The wrapper-selection rule, and the only place it is written down". It has exactly three returns:

- **unset, empty, or whitespace** (`configuredCommand` returns `undefined`) → `{ selected: ALWAYS_SELECTED.includes(key), placeholder: false }`. `ALWAYS_SELECTED` is `typecheck` and `test`, so an absent `typecheck` key is still **selected**: the wrapper file is written, and because no line resolved, `resolveBody`'s third arm gives it `unresolvedBody` — `harness_fail` naming `set commands.typecheck in harness.config.json` — a script that fails and says why.
- **the placeholder** (`isPlaceholder`) → `{ selected: false, placeholder: true, configured }`. No wrapper file is written at all.
- **a filled line** → `{ selected: true, placeholder: false, configured }`. The wrapper is written with that line inlined, under `resolveBody`'s precedence.

The asymmetry those arms create: **placeholder ⇒ no wrapper, no permission entry, and both `command-wrappers` and `command-permissions` silent about the key**, against **absent ⇒ a wrapper selected anyway with an unresolved body, and allow-listed**. Deleting the key and leaving it unanswered are therefore different states, and the one `doctor` says least about is the one that writes a script.

**A second placeholder-keyed predicate in the same module — a sub-entry of this site, not a seventh one.**
`wrappedKeyMismatch` in `cli/src/generators/scripts.ts` is that file's other reader of `isPlaceholder`, and
its doc comment names it "the one owner of" the defect it calls "a wrapped `commands.*` key holds a raw
command line rather than its wrapper invocation". It opens on the same early return `selectWrapper` keys its first two arms
on — `configured === undefined || isPlaceholder(configured)` — and its comment enumerates **three** states as
"deliberately not this defect": unset or empty, still the placeholder, holding the invocation. Every other
value is the defect. The same comment names three consumers — "`init` (through `resolveBody`), `doctor` and
`config set`" — and they are not gated alike. Two inherit whatever `selectWrapper` decides: `doctor`'s
`COMMAND_WRAPPERS_CHECK` skips a key that is `undefined` or `placeholder` before calling it, and
`resolveBody`'s arm, which reproduces the condition inline and prints the same `wrappedKeyMismatchMessage`, is
reached only through `writeWrapperScripts`, which skips an unselected key. The third does not:
**`config set` calls the predicate directly**. `wrapperKeysFor` in `cli/src/commands/config.ts` maps a `<key>` to
its wrapper keys by equality **and** by `${key}.` prefix, so `set commands.typecheck …` and
`set commands '<json>'` both reach the call, and the call is placed outside the dry-run and unchanged arms —
its own comment: "outside the arms above, so all three reach it". So a value `selectWrapper` is taught to
treat as unfilled is still warned on by `config set` unless this predicate is taught the same thing.

**The permission entries.** `selectWrapperScripts` in `cli/src/generators/permissionProfile.ts` reaches its answer by calling that same function — "The rule is not restated here: `selectWrapper` *is* the rule" — deliberately, so a profile cannot allow-list a wrapper that was never written. The profile inherits whichever arm applies rather than deciding for itself, and each selected wrapper contributes **three** allow entries (that module's choice 1: the repo-relative invocation, its repo-root-absolute twin, and its sibling-worktree twin). So the absent arm allow-lists a wrapper whose body only fails, and the placeholder arm allow-lists nothing. On the `doctor` side, `COMMAND_PERMISSIONS_CHECK` in `cli/src/doctor/checks.ts` filters `WRAPPER_SCRIPTS` down to the keys for which `selectWrapper` reports `configured !== undefined && !placeholder` — the **filled** ones — and when that filter is empty it passes with `not graded, because no wrapped key holds a command line …`, deferring to the config check. `COMMAND_WRAPPERS_CHECK` skips the same two states (`configured === undefined || placeholder`) key by key before grading anything.

**`setup-worktree.sh` does not depend on the key.** `grep -n 'typecheck' cli/templates/scripts/setup-worktree.sh` prints nothing: the script reads `commands.typecheck` nowhere. What it does read it reads through `run_configured`, which it calls exactly twice — `run_configured depInstall "dependency install"` and, when that succeeded, `run_configured build "build"`. None of the three options in §4–§6 reaches this script.

**The unit loop's gate is unconditional.** The `` `<test_cmd>` / `<typecheck_cmd>` `` resolved-value row in `plugin/agents/layer-implementer.md` tells an implementer that the token *is* the string `commands.typecheck` holds and to **run the configured string as-is**; the same file's `## Return format` requires "the results of running the configured `<test_cmd>` and `<typecheck_cmd>` strings **as written**". `plugin/instructions/plan_orchestration_instructions_core.md` carries the same row and, in its *Working directory* setup step, the same instruction; `plugin/instructions/user_review_fixes_instructions_core.md` carries it too. **No copy has an arm for a key that is absent or answered "none"** — the only alternative any of them names is a *refused* call, whose remedy is to run the wrapper directly. The row is also not written once, and not in one spelling. `grep -rlE 'typecheck_cmd|commands\.typecheck' plugin/agents/ plugin/instructions/` reaches both and returns six files: five carry the parameterization token — the agent, the two cores, `plan_orchestration_instructions_autonomous.md` which restates the row, and `user_review_fixes_instructions_semi_autonomous.md` which refers back to its core's — and `user_review_fixes_instructions_autonomous.md` carries the same instruction by key name, in its `` `<app_root>` `` row (*"the configured `commands.typecheck` string from `$REPO_ROOT`"*, and *"Run each configured string exactly as written"*). Changing what the gate says is a change across that whole set, which is why §4 and §5 treat it as parity-governed work rather than a free edit. (The grep is scoped to the two instruction/agent directories on purpose: widened to `plugin/`, the same pattern also reaches the two configuration-reader sites covered next, which read the key rather than instruct on it.)

**The configuration readers know the key and not the placeholder.** In `plugin/hooks/lib/harness-config-lib.sh`, `HC_CFG_KEYS` lists `.commands["typecheck"]` among the filters the cached-config reader will answer, and `hc_command_keys_var` sets `HC_CFG_COMMAND_KEYS` to the five command keys that `hc_command_strings` and `hc_runner_words` iterate — the latter deriving the leading word of each configured string, which is what lets the script-allowlist guard recognise the adopter's runner. `cli/templates/scripts/lib/harness-run-lib.sh` mirrors the shape: `hr_command_keys_var` sets `HR_CFG_COMMAND_KEYS`, which `hr_command` uses as a membership test (a key outside it returns 1), and the config-read `jq` program carries a `commands.typecheck` entry of its own. Both treat an unset key as ordinary — nothing printed, a non-zero return the caller is expected to handle — and neither tests for the placeholder: `grep -n 'configure this'` over those two files prints nothing, so a key still holding the marker reads to them as a configured command line.

**`init`'s generator, and `doctor`'s configuration check.** `COMMAND_PLAN` in `cli/src/generators/harnessConfig.ts` carries the entry `{ key: 'typecheck', wrapped: true }`, and `buildCommands` writes a wrapped key as the wrapper invocation **unless** the detected line is the placeholder, in which case the placeholder itself is written — its own comment gives the reason: no wrapper is written for a placeholder key, so pointing `commands.typecheck` at one would replace a visible "you still have to set this" with "a command that fails on a missing file". The same function then refuses when detection produced neither verifier: `the detected command set is missing typecheck or test, which the config schema requires` — raised as an internal error, because the preset builder fills a verifier it could not detect with a placeholder and so cannot leave the key unset. **`init` therefore never writes a config without `commands.typecheck`**; the absent arm of `selectWrapper` is reachable only by a hand edit or a hand-written config. On the reporting side, `CONFIG_CHECK` in `cli/src/doctor/checks.ts` is where `config/check.ts`'s problems surface — errors fail the check, warnings warn it — so the permanent placeholder warning §1 describes is what an adopter sees every run. `requiredBinaries` in the same file skips a command that is empty or `isPlaceholder` when deriving the binaries a daemon-launched run needs, so an unfilled `typecheck` contributes nothing to that grading either.

---

## 3. Can another family reach this state?

Before any option is argued: is a permanently-unfilled `commands.typecheck` the `php-composer` family's
problem, or the contract's? One row per command family below, in the order `COMMAND_FAMILIES` in
`cli/src/detect/presets.ts` tries them.

| Family | How it derives `typecheck` | Can it leave `typecheck` unfilled? | Anchor in `cli/src/detect/presets.ts` |
|---|---|---|---|
| `python` | `mypy .`, or `mypy <dir>` below the root | No — the line follows from the packaging manifest alone | `pythonCommands` |
| `go` | `go vet ./...`, anchored as `go -C <dir> vet ./...` | No — `go vet` ships with the toolchain every `go.mod` repository builds with | `goCommands` |
| `dart` | `flutter analyze` or `dart analyze`, the tool chosen by `FLUTTER_APP_MARKERS` | No — `analyze` is the SDK's own command; only *which* SDK runs it is decided | `dartCommands` |
| `android-gradle` | `<runner> --console=plain --quiet compileDebugSources` | No — AGP registers that task for every application and library module | `androidGradleCommands` |
| `maven` | `<runner> -q -B compile` | No — `compile` is a lifecycle phase present in every POM without a plugin declaration | `mavenCommands` |
| `gradle-jvm` | `<runner> --console=plain --quiet classes` | No — `classes` is registered by the `java` plugin every JVM Gradle build applies | `gradleJvmCommands` |
| `dotnet` | `dotnet build --nologo` | No — the compile is the toolchain's, and every solution or project has one | `dotnetCommands` |
| `apple-native` | SwiftPM arm: `swift build`, beside a `swift package resolve` `depInstall`. Xcode arm: `xcodebuild -project\|-workspace <container> -scheme <name> build` | **Yes**, on the Xcode arm — a container sharing other than exactly one scheme | `appleCommands`, `findSharedSchemes`, `appleXcodeNote` |
| `cargo` | `cargo fmt --check && cargo clippy --all-targets -- -D warnings` | No — both halves ship with the toolchain, for every `Cargo.toml` | `cargoCommands`, `cargoLintNote` |
| `bundler` | `bundle exec rubocop`, and only that | **Yes** — no RuboCop configuration beside the manifest | `bundlerCommands`, `RUBOCOP_CONFIGS` |
| `composer` | `vendor/bin/phpstan analyse`, else `vendor/bin/psalm`, each on its own configuration file | **Yes** — the repository configures neither analyser | `composerCommands`, `PHPSTAN_CONFIGS`, `PSALM_CONFIGS` |
| `npm` | `npm run <script>`, from the first of `NODE_SCRIPT_CANDIDATES.typecheck` the **root** manifest declares | **Yes** — the root manifest declares none of `typecheck`, `check-types`, `tsc`, `lint` | `nodeCommands`, `NODE_SCRIPT_CANDIDATES` |
| `cmake` | `cmake -S <dir> -B <build> && cmake --build <build>` | No — the compile is the only static check C++ has, and every `CMakeLists.txt` configures | `cmakeCommands` |

**Four arms reach the state, and each has its own condition.**

- **The Apple-native Xcode arm.** `appleCommands` reaches the Xcode arm only when there is no `Package.swift`
  but a project or workspace, and sets `typecheck` **only where `findSharedSchemes` returns exactly one
  scheme**: `-scheme` takes one name, so zero or several leave the key unresolved, in `appleXcodeNote`'s own
  words, because "picking among several — or inventing one where none is shared — is a judgement rather than
  something file existence answers". That arm also **never supplies `test`** — `xcodebuild test` requires a
  `-destination` naming a machine's simulator or device, which no file in the repository states — which is why
  `docs/cli.md` already calls this "the one family on this matrix that cannot serve both required keys". And
  the arm **stops the family search even where it resolved nothing**, so no family below it fills what it left.
- **The Bundler family.** `bundlerCommands` sets `typecheck` only where one of `RUBOCOP_CONFIGS` sits beside
  the manifest; Ruby has no type checker in the general case, so without that file the key is left unresolved
  while `depInstall` — and `test`, where a `spec/` directory or a `Rakefile` beside `test/` exists — still
  answers, and the search still stops. The one exception is not a fill: where **both** verifiers are unresolved
  *and* `declaresNodeScript` is true, the family returns `undefined` and hands the search on rather than
  answering with an install alone.
- **The npm family.** `nodeCommands` resolves each key from a recognised script name, so a root
  `package.json` declaring `test` but none of the four `typecheck` candidates answers the search — the family
  stops it — with `typecheck` unresolved. Where the manifest declares no recognised script at all the function
  returns `undefined` instead ("Nothing script-derived resolved, so this family has nothing to supply: hand
  the search on"), and the key stays unfilled unless `cmake`, the one family below it, answers. The family's
  own `WEAK_TYPECHECK_SCRIPTS` records the adjacent case: `lint` is accepted as a last candidate and
  **reported**, because it "may not type-check at all" — so even a *filled* key here is not always an honest
  type check.
- **The composer family.** `composerCommands` sets `typecheck` from `PHPSTAN_CONFIGS`, else `PSALM_CONFIGS`,
  and from nothing else; a repository configuring neither gets `depInstall` and, on a PHPUnit configuration,
  `test` — and an unresolved `typecheck`. This is the arm §1 walks.

The other nine rows cannot reach it for one reason, stated once: each derives `typecheck` from a **toolchain
lifecycle command present in every repository of that shape** — an analyser, a compile or a build step the
manifest's own toolchain ships — so the key resolves whenever the family answers at all.

**What turns an unresolved key into a permanent warning is the same code in all four cases.** `buildPreset`
walks `REQUIRED_COMMAND_KEYS` after the family search, fills every key still unresolved with
`placeholderCommand` from `cli/src/config/model.ts`, and raises `undetectedCommandWarning`. The four arms
differ in what they could not derive; they do not differ in what happens next.

**Verdict.** The "no honest typecheck" state is **not family-specific**. It is a property of the configuration
contract: `REQUIRED_COMMAND_KEYS` and the schema require the key of *every* configuration, while four
derivation arms make it conditional on evidence the repository itself carries — and three of those four
(Bundler, composer, and npm on a plain-JS repository) fail for the identical reason, that the language has no
static analyser every project has. The Apple-native Xcode arm fails for a different reason — the command
exists but names a choice no file states — and so is fillable by hand where the other three are not; that
narrows the class of adopters with nothing honest to write, it does not empty it.

The consequence for option (c): a composer-family fallback would remove the most visible instance of the
state and leave the identical placeholder and the identical warning reachable through the Bundler family, the
npm family and the Apple-native Xcode arm, none of which it touches. **(c) cannot settle the bind** — at best
it settles one family's share of it. Whether that is still worth doing is a separate question, assessed on
the same five dimensions as (a) and (b) in §6; nothing here recommends an option, which is §7's.

**This section describes the composer family; it changes nothing in it.** Fixing that family is option (c),
which this record recommends or declines — a fix made here as a side effect would settle by patch the
question the record exists to put to the reader.

---

## 4. Option (a) — make the key optional

**What (a) is.** Drop `typecheck` from the two places §1 measured it as required, so a repository with no
honest type check leaves the key out and validates. Assessed below on the five dimensions §5 and §6 repeat in
the same order. **No verdict here** — §7 chooses.

**1 — What changes in the contract.** Two edits, and only two: `COMMAND_REQUIRED` in
`cli/src/config/check.ts` drops the name, and `properties.commands.required` in
`schemas/harness.config.schema.json` drops it too. That object's `description` — "Only the two verification
commands are required" — becomes false with the edit and is rewritten with it. Nothing else in
`checkCommands` moves: its placeholder loop runs over `COMMAND_KEYS`, not `COMMAND_REQUIRED`, so a key still
holding the marker is warned exactly as before; only *absent* stops being an error.

Two type-level facts follow rather than being separate choices. `HarnessCommands` in
`cli/src/config/model.ts` declares `typecheck: string` non-optionally, and `buildPreset` in
`cli/src/detect/presets.ts` assembles `RawCommands` with `typecheck` named unconditionally after walking
`REQUIRED_COMMAND_KEYS`. Left alone, the types keep asserting a requiredness the contract has dropped.

**2 — What each §2 dependent does.** Six sites, in §2's order.

- **Wrapper generation — the consequence (a) has to answer.** With the key **absent**, `configuredCommand`
  returns `undefined`, so `selectWrapper` in `cli/src/generators/scripts.ts` takes its **first** return and
  `ALWAYS_SELECTED.includes('typecheck')` is true: the wrapper is **selected**. No line resolved, so
  `resolveBody`'s third arm gives it `unresolvedBody` — `harness_fail` naming `set commands.typecheck in
  harness.config.json`. `init` therefore writes a `typecheck.sh` that runs nothing, fails, and tells the
  adopter to fill a key the contract no longer requires; and the profile allow-lists it. So option (a) owes
  one of two changes here: either **`ALWAYS_SELECTED` stops meaning "always"** for `typecheck`, or the absent
  case is **folded into the arm the placeholder already takes** — `{ selected: false }`, no file written. Not
  making that change is not a neutral omission: it ships an allow-listed wrapper that runs nothing.
- **The permission entries.** `selectWrapperScripts` in `cli/src/generators/permissionProfile.ts` reaches its
  answer by calling `selectWrapper`, so it inherits whichever arm the bullet above settles — today's absent
  arm contributes the three allow entries for a wrapper whose body only fails; the folded arm contributes
  none. `doctor` needs no edit either way: `COMMAND_PERMISSIONS_CHECK` in `cli/src/doctor/checks.ts` grades
  only keys for which `selectWrapper` reports `configured !== undefined && !placeholder`, and
  `COMMAND_WRAPPERS_CHECK` skips `configured === undefined` key by key, so both are already silent about an
  absent key.
- **`setup-worktree.sh` — untouched.** It reads `commands.typecheck` nowhere, and calls `run_configured` only
  for `depInstall` and `build`. (a) does not reach it.
- **The unit loop's gate — corpus work (a) owes.** `<typecheck_cmd>` is defined as the string
  `commands.typecheck` holds; with the key absent it resolves to nothing, and no copy of the row has an arm
  for that. `plugin/agents/layer-implementer.md` still says to run the configured string **as-is** and its
  `## Return format` still requires the result of running it; `plan_orchestration_instructions_core.md` and
  `user_review_fixes_instructions_core.md` carry the same row. Those files are **mirrored copies**, so adding
  the absent arm is parity-governed work that lands on every copy in one change — the two cores together, and
  the two files that restate or refer back to the row
  (`plan_orchestration_instructions_autonomous.md`, `user_review_fixes_instructions_semi_autonomous.md`).
  This is work option (a) owes; this branch does none of it.
- **The configuration readers — already written for (a).** `HC_CFG_KEYS` and `hc_command_keys_var` in
  `plugin/hooks/lib/harness-config-lib.sh`, and `hr_command_keys_var` / `hr_command` in
  `cli/templates/scripts/lib/harness-run-lib.sh`, treat an unset key as ordinary: nothing printed, a non-zero
  return the caller handles. Nothing changes. The one downstream effect is intended: `hc_runner_words` derives
  one fewer leading word, so the script-allowlist guard recognises one fewer runner — correct for a repository
  that runs no type check.
- **`init`'s generator, and `doctor`'s configuration check.** The two contract edits alone do **not** let
  `init` produce a config without the key: `buildPreset` still fills every unresolved `REQUIRED_COMMAND_KEYS`
  entry with `placeholderCommand`, and `buildCommands` in `cli/src/generators/harnessConfig.ts` still refuses
  with `the detected command set is missing typecheck or test, which the config schema requires`. The absent
  state stays reachable only by a hand edit unless (a) also changes those two. On the reporting side,
  `CONFIG_CHECK` stops surfacing the absent-key error and keeps surfacing the placeholder warning unchanged;
  `requiredBinaries` already skips a command that is empty or `isPlaceholder`, so it grades identically.

**3 — What an adopter with a filled config pays.** Nothing. Removing a name from a required list only widens
what validates: a config carrying a real `commands.typecheck` line takes the same `selectWrapper` arm, the
same `resolveBody` precedence, the same three profile entries and the same `doctor` grades. No migration step
and no `version` change — for a filled config (a) is a strict relaxation.

**4 — What `doctor` says afterwards.** For a repository that has no type check and has deleted the key:
`CONFIG_CHECK` no longer errors on it, and both command checks skip it silently, so the run is clean. That is
the gain, and it is real.

The cost is what (a) **cannot** say. An absent key is indistinguishable from an adopter who never reached the
question — a hand-written config, an interrupted `init`, and a key deleted by mistake all read the same — so
`doctor` can report neither "answered: none" nor "not yet answered". No state survives that records the
adopter considered the question, which is the distinction §5's sentinel exists to keep; §7 weighs that against
(a)'s other properties.

For the repository that has **not yet** answered, (a) changes nothing: that adopter still holds the
placeholder and still gets §1's permanent warning with a remedy it cannot perform. (a) removes an error from a
state reached only by hand and leaves the warned state §1 measured exactly where it is — and nothing in
`doctor`'s output tells an adopter that deleting the key is now allowed.

**5 — Whether generated artifacts change.** Stated as a property of `init`'s output. The two contract edits
alone change none of it: `init` writes `commands.typecheck` as the placeholder or as the wrapper invocation
exactly as today, so the generated config, the wrapper set and the permission profile are unchanged. They
change only with the consequential edits dimension 2 names — `REQUIRED_COMMAND_KEYS` and `buildCommands`'s
refusal (a generated config can then omit the key) and `ALWAYS_SELECTED` (`typecheck.sh` is then not written,
and the profile loses its three entries for it). So (a) taken whole changes all three generated artifacts for
a repository that answers "none", and none of them for every other repository.

---

## 5. Option (b) — an explicit "none" sentinel

**What (b) is.** Keep the key required, and give it a third meaning: one agreed string an adopter writes into
`commands.typecheck` to say *this repository has no type check*, which the config check grades as **answered**
rather than unfinished. Assessed below on the five dimensions §4 walks, in the same order. **No verdict here**
— §7 chooses.

**1 — What changes in the contract.** Not the schema. `properties.commands.typecheck` in
`schemas/harness.config.schema.json` declares `"type": "string"` with `"minLength": 1` and neither an `enum`
nor a `pattern`, and `properties.commands.required` keeps both names — so a sentinel is **already a legal
value of the existing type**, and (a)'s two edits have no counterpart here. That is the dimension-1 difference
between the options: (a) widens what validates, (b) widens what a value means.

What (b) adds is a **reader**. `cli/src/config/model.ts` defines `COMMAND_PLACEHOLDER_MARKER` with one writer
(`placeholderCommand`) and one reader (`isPlaceholder`), and its doc comment says why the constant lives
there: "several sides must agree on one string" — and that none of those sides ever "matches the string
itself". A sentinel is a second such string and inherits that constraint: it belongs in the same module,
recognised by one exported function beside `isPlaceholder`, with no call site anywhere comparing against the
literal.

Two of the marker's properties do **not** carry over, and each is a choice (b) has to make.

- **The test is exact, not containment.** `isPlaceholder` is deliberately a containment test, so a value an
  adopter half-edited still reads as unfinished. Containment is the wrong rule for a sentinel: a real command
  line that happened to contain the sentinel's text would read as *answered: none* and silently disable the
  key. The sentinel's reader compares the trimmed value whole.
- **It has no writer in the codebase, so it has to be published.** The marker needs no documentation — an
  adopter meets it already written in their own generated config. A sentinel works only if the adopter can
  spell it exactly, which puts the literal into the schema's `description`, into `HarnessCommands`'s field
  comment in `model.ts`, and into `docs/config.md` §5's `commands.typecheck` row. `model.ts`'s own header
  names that set as one obligation: the schema, this model, `config/check.ts` and `docs/config.md` §5's key
  reference are "one contract in four places".

**2 — What each §2 dependent does.** Six sites, in §2's order.

- **Wrapper generation — one arm, and it is the placeholder's.** Left alone, the sentinel is a *filled* line:
  `configuredCommand` returns it, `isPlaceholder` rejects it, and `selectWrapper` in
  `cli/src/generators/scripts.ts` takes its **third** return — `{ selected: true, placeholder: false }` — so
  `init` writes a `typecheck.sh` with the sentinel inlined as its command and the profile allow-lists it. (b)
  therefore owes an arm ahead of that one, and it is the **placeholder's** arm, not the absent one:
  `{ selected: false }`, no file written, so the key implies no wrapper and no permission entry. The shape of
  that arm is where the cost sits. `WrapperSelection.placeholder` is documented as "True when the key still
  holds the marker `init` writes", so the new state either sets a flag whose documentation it contradicts, or
  the interface grows a third case — and that flag has three readers: the two `doctor` checks named next,
  and `writeWrapperScripts` in the same module, whose `placeholder` branch is tested **ahead of** `selected`
  and warns `<key> still holds the placeholder init wrote … set it in harness.config.json and re-run init`.
  Reported through the flag, a sentinel takes that branch on every `init` re-run and inherits a sentence that
  is false of an answered key and tells the adopter to undo the answer; reported through a third case, it
  inherits silence about a key that yields no wrapper and no permission entry, where every other such key says
  why. Either shape owes a message of its own.
- **The permission entries.** `selectWrapperScripts` in `cli/src/generators/permissionProfile.ts` calls
  `selectWrapper`, so it inherits the new arm and contributes none of its three entries. On the `doctor` side
  the inheritance is conditional: `COMMAND_PERMISSIONS_CHECK` in `cli/src/doctor/checks.ts` filters down to
  the keys for which `selectWrapper` reports `configured !== undefined && !placeholder`, and
  `COMMAND_WRAPPERS_CHECK` skips `configured === undefined || placeholder` — both keyed on that same boolean.
  So both checks stay silent about a sentinel **exactly when** the new arm reports `placeholder: true`; under
  any other shape each check needs the third state added by hand, or `command-wrappers` reports a key holding
  a line that is not the invocation of a wrapper that was never written.
- **`setup-worktree.sh` — untouched.** It reads `commands.typecheck` nowhere and calls `run_configured` only
  for `depInstall` and `build` (§2's measured negative). (b) does not reach it.
- **The unit loop's gate — corpus work, and a sharper obligation than (a)'s.** `<typecheck_cmd>` is defined
  as the string the key holds, and `plugin/agents/layer-implementer.md` says to **run the configured string
  as-is** while its `## Return format` requires the result of having run it. Under (a) the token resolves to
  nothing; under (b) it resolves to a string that *looks* runnable, so an implementer following the row
  literally runs the sentinel. The gate needs an arm for "the key says there is none" — the type-check gate is
  not run, and the return says that rather than reporting a pass — across the six mirrored `plugin/` copies
  §2's scoped `grep -rlE 'typecheck_cmd|commands\.typecheck' plugin/agents/ plugin/instructions/` returns:
  the agent, `plan_orchestration_instructions_core.md` and `user_review_fixes_instructions_core.md`, the two
  files that restate or refer back to the row, and `user_review_fixes_instructions_autonomous.md`, which
  carries the same instruction by key name. That is parity-governed work landing on every copy in one change;
  this branch does none of it.
- **The configuration readers — they read the sentinel as a command line.** `hc_command_strings` in
  `plugin/hooks/lib/harness-config-lib.sh` prints it and `hr_command` in
  `cli/templates/scripts/lib/harness-run-lib.sh` returns it, because neither tests for the marker either
  (§2: `grep -n 'configure this'` over the two prints nothing). The one consequence to weigh is
  `hc_runner_words`, which takes the **leading word** of every configured string to tell the script-allowlist
  guard what the adopter's runner is: a sentinel contributes a word that is not a runner. This is what the
  placeholder already does today and the opposite of (a), where an unset key contributes nothing — and it is
  the one place the sentinel's spelling has a mechanical consequence, since that function already skips a
  leading word that is empty or contains `/`.
- **`init`'s generator, and `doctor`'s configuration check.** `checkCommands` in `cli/src/config/check.ts` is
  the required edit and the option's whole point: the sentinel satisfies `COMMAND_REQUIRED`, and because it
  does not match `isPlaceholder` the warning loop over `COMMAND_KEYS` passes it silently — so the key reads as
  a filled command line, which is the state the wrapper bullet above describes. (b) replaces that accidental
  silence with a deliberate one: the sentinel is recognised, graded as answered, and reported as *none*
  rather than warned. `buildCommands` in `cli/src/generators/harnessConfig.ts` needs no change (dimension 5
  answers whether it should get one). `requiredBinaries` in `cli/src/doctor/checks.ts` does: it skips a
  command that is empty or `isPlaceholder` and grades every other one, so an unedited sentinel is either
  demanded as a binary on the unit's `PATH` or reported as a line that would not reduce.

**3 — What an adopter with a filled config pays.** Nothing mechanical. A config carrying a real
`commands.typecheck` line takes the same `selectWrapper` arm, the same three profile entries and the same
`doctor` grades; `HarnessCommands.typecheck` stays `string`, so unlike (a) not even the types move, and there
is no migration and no `version` change. The one cost is permanent and shared by every stack: one string
becomes **reserved** in that key's value space, unusable as a real command line by any adopter thereafter.
Cheaply paid on a well-chosen literal, but it is a narrowing of the contract for all stacks, which is what
makes (b) — like (a) — a decision about the contract rather than about one family.

**4 — What `doctor` says afterwards.** For a repository that has no type check and has written the sentinel:
`CONFIG_CHECK` reports the key as answered instead of warning it, both command checks skip it as they skip a
placeholder, and the run is clean. What (b) buys that (a) cannot is that the placeholder and the sentinel are
**different values**, so `doctor` distinguishes **answered: none** from **not yet answered** — the state §4's
dimension 4 records (a) as unable to keep. And the warning §1 measured as having no remedy gains one the
adopter can actually perform: replacing the placeholder with the sentinel is an act the repository's own state
permits, where "install a static analyser" is not — provided `wrappedKeyMismatch` is taught the sentinel with
the rest of dimension 2's edits, since `config set`, the supported way to perform that remedy, asks that
predicate directly and otherwise answers it with a warning to reverse it.

The cost is that the answer is **self-reported**. Nothing verifies that a repository writing the sentinel has
no type check; `doctor` reports what the config asserts, and an adopter who writes it to silence a warning has
turned the flow's type-check gate off. Whether that is visible depends entirely on the gate arm dimension 2
names: without it the run reports a pass it never ran.

**5 — Whether generated artifacts change.** Not at all, for any repository, and the reason is the boundary
that keeps (b) accept-only. `init` **never** writes the sentinel, and should not: reaching the unresolved
arm of `composerCommands` establishes that the repository configures no analyser file, which is not the same
claim as "this repository has no type check" — writing "none" would assert on the adopter's behalf something detection
did not establish — where the placeholder asserts only that detection failed. So `buildPreset` keeps filling
the unresolved key with `placeholderCommand`, `buildCommands` keeps writing that placeholder, and the
generated config, wrapper set and permission profile are byte-identical to today's for every repository.

The artifacts change only afterwards, in the adopter's own tree, and only by not being produced: with the
sentinel in place no `typecheck.sh` is generated and the profile carries no entries for it. One residue is
worth stating: an adopter who *replaces a filled line* with the sentinel keeps the `typecheck.sh` already on
disk and the entries already rendered into the profile, because `writeWrapperScripts` enqueues
`create-if-absent` writes and no generator deletes.

---

## 6. Option (c) — a composer-family fallback

**What (c) is.** Give `composerCommands` in `cli/src/detect/presets.ts` a last arm, so a PHP repository
configuring neither PHPStan nor Psalm gets a `commands.typecheck` line instead of the placeholder. Assessed
below on the five dimensions §4 and §5 walk, in the same order. **No verdict here** — §7 chooses.

**The two candidate lines, and what each actually verifies.**

- **`composer validate --strict`** — a **manifest** check. It grades `composer.json` against Composer's own
  schema and reports its disagreements with the lockfile; it says nothing whatever about the code. Its binary
  is present wherever this family answers at all, since the family is gated on a `composer.json` and its own
  `depInstall` line is `composer install --no-interaction`.
- **`php -l` over the conventional source roots** `PHP_SOURCE_DIRS` names (`app` first, else `src`) — a
  **syntax** check. The parser accepts or rejects each file, which catches a parse error before a run does and
  catches nothing else: no undefined symbol, no arity mismatch, no type. `php -l` takes one file, so the line
  is a traversal over the root rather than a single invocation — a compound, which inside `typecheck.sh` is an
  ordinary command line (`cmakeCommands`' shape).

Both **run without `vendor/bin`**, and that is the whole of why they are candidates. The doc comment's
objection to naming an unconfigured analyser is not that such a line checks little; it is that "naming one the
repository does not configure would emit a line that fails on `vendor/bin` not existing rather than a check
that verifies anything." A line headed by `composer` or `php` fails on neither. It escapes the stated
objection; whether it is an honest occupant of the key is the closing question below.

**1 — What changes in the contract. Nothing — and that is (c)'s dimension-1 difference from both.** Checked
rather than assumed: `COMMAND_REQUIRED` in `cli/src/config/check.ts` keeps both names, and
`properties.commands.required` in `schemas/harness.config.schema.json` keeps both. `checkCommands` is
untouched, so an absent key still errors and a value `isPlaceholder` accepts is still warned; `HarnessCommands`
in `cli/src/config/model.ts` keeps `typecheck: string`; `REQUIRED_COMMAND_KEYS` and `buildPreset` are
unchanged. The diff is **one arm of one function**: an `else` after `composerCommands`' PHPStan and Psalm arms,
anchored with the helpers that function already carries — `at()` for a path below the manifest root, while
`bin()` and `config()` do not apply, since the fallback names neither a `vendor/bin` binary nor a
configuration file. So (a) and (b) are **contract** changes binding every stack, and (c) is a **detection**
change binding one family. Every consequence below follows from that confinement.

The corpus work that confinement still implies, stated once here so dimension 2 need not: the rule the new arm
overturns is written down twice outside the code — `docs/cli.md`'s Composer-family paragraph ("The Composer
family sits below the Bundler one") and that document's per-family matrix `composer` row ("`depInstall`
always; `typecheck` on a PHPStan or Psalm config; `test` on a PHPUnit one"), each stating `typecheck` as
unresolved without an analyser configuration. Both become false with the arm and are rewritten with it. That
is one document, where the corpus work §4 and §5 each owe lands on the mirrored `plugin/` set.

**2 — What each §2 dependent does.** Six sites, in §2's order. The subject throughout is the repository §1
walks: a PHP repository with a PHPUnit configuration and no analyser configuration.

- **Wrapper generation — the filled arm instead of the placeholder one.** `commands.typecheck` now holds a
  real line, so `selectWrapper` in `cli/src/generators/scripts.ts` takes its **third** return —
  `{ selected: true, placeholder: false, configured }` — where today it takes the second and writes no file.
  `init` writes a `typecheck.sh` with that line inlined, under `resolveBody`'s precedence. `ALWAYS_SELECTED`
  needs no edit and no arm changes meaning: (c) *reaches* the filled arm, where (a) had to change what the
  absent arm does and (b) had to add an arm ahead of the filled one.
- **The permission entries.** `selectWrapperScripts` in `cli/src/generators/permissionProfile.ts` calls
  `selectWrapper`, so it inherits the filled arm and contributes its three allow entries for `typecheck.sh`
  where today it contributes none. Both `doctor` checks stop skipping: `COMMAND_PERMISSIONS_CHECK` in
  `cli/src/doctor/checks.ts` filters to the keys reporting `configured !== undefined && !placeholder` and the
  key now passes that filter, so where a composer-family repository was the whole of the config the check
  passed with `not graded, because no wrapped key holds a command line …` and now grades entries;
  `COMMAND_WRAPPERS_CHECK` skips `configured === undefined || placeholder` key by key and no longer skips this
  one. Neither check is edited — they grade a wrapper that now exists.
- **`setup-worktree.sh` — untouched**, §2's measured negative: it reads `commands.typecheck` nowhere, and
  calls `run_configured` only for `depInstall` and `build`. (c) does not reach it, as neither (a) nor (b) does.
- **The unit loop's gate — no corpus work at all, and this is where (c) is cheapest.** `<typecheck_cmd>`
  resolves to a runnable string, which is the state every copy of the row is already written for:
  `plugin/agents/layer-implementer.md` says to run the configured string **as-is** and its `## Return format`
  requires the result of having run it, and `plan_orchestration_instructions_core.md` and
  `user_review_fixes_instructions_core.md` carry the same row. No arm is missing, so the mirrored set
  `grep -rln 'typecheck_cmd' plugin/` returns needs no edit — the parity-governed work §4 and §5 each owe.
  What (c) does instead is make the gate **run** on a repository where it previously ran nothing.
- **The configuration readers — one fewer anomaly, and no edit.** `hc_command_strings` in
  `plugin/hooks/lib/harness-config-lib.sh` and `hr_command` in
  `cli/templates/scripts/lib/harness-run-lib.sh` hand out the configured value without testing for the marker
  (§2's measured negative), so today they hand out the placeholder as though it were a command line; under (c)
  the value they hand out is one. `hc_runner_words` then derives a leading word that is a real runner —
  `composer` or `php` — so the script-allowlist guard recognises the runner the wrapper actually invokes.
- **`init`'s generator, and `doctor`'s configuration check.** `buildPreset` fills with `placeholderCommand`
  only the `REQUIRED_COMMAND_KEYS` entries still unresolved after the family search, so for this repository it
  now fills none and raises no `undetectedCommandWarning`; below the root it also reaches
  `noteAnchoredFamily`, which fires only where **both** verifiers resolved, so a nested repository of this
  shape gains that note. `buildCommands` in `cli/src/generators/harnessConfig.ts` takes its wrapped-key path
  and writes the wrapper invocation rather than the placeholder — its refusal (`the detected command set is
  missing typecheck or test, which the config schema requires`) was already unreachable here, since the
  placeholder satisfied it. `CONFIG_CHECK` in `cli/src/doctor/checks.ts` stops surfacing the placeholder
  warning, because the value no longer carries `COMMAND_PLACEHOLDER_MARKER` for `isPlaceholder` to find. And
  `requiredBinaries` in the same file changes grading: it skips a command that is empty or `isPlaceholder`, so
  today this key contributes nothing, while under (c) it reads the line's leading word — `composer` or `php` —
  and demands it on the daemon-launched unit's `PATH`. Worth stating because the analyser lines the fallback
  stands in for would not have been graded either: those are headed by `vendor/bin/phpstan` or
  `vendor/bin/psalm`, and that function's collector drops any name containing `/`. The fallback would be the
  first composer-family `typecheck` line to enter the binary comparison at all.

**3 — What an adopter with a filled config pays.** Nothing, and for a narrower reason than (a)'s or (b)'s:
detection never runs over a configured repository. `buildPreset` is called on the `init` path only —
`cli/src/commands/init.ts` and `buildConfig` in `cli/src/generators/harnessConfig.ts` — and no check in
`cli/src/doctor/checks.ts` calls it (its two mentions there are comments), so a config whose
`commands.typecheck` is already filled does not meet the new arm at all. That differs from the "nothing" (a) and
(b) each report here: (a) widens what validates and (b) reserves one string in the key's value space, so both
change the contract every existing config is read against even though neither changes how a filled one is
handled, while (c) changes only what a *future* `init` over one family's shape writes. No migration, no
`version` change, and unlike (a) no type moves. Stated as a difference in what is at stake, not as an argument
about it.

**4 — What `doctor` says afterwards.** For the PHP repository §1 walks, the placeholder warning is gone from
`CONFIG_CHECK`, and in its place `command-wrappers` and `command-permissions` grade a `typecheck.sh` they
previously skipped — clean where the wrapper and its three entries are as `init` wrote them, reported where
they are not. The warning §1 measured as having a remedy the adopter cannot perform is removed for this
population **without the adopter doing anything**, which is what neither (a) (delete the key) nor (b) (write
the sentinel) offers.

For every other arm §3 names as reaching the same state, `doctor` says exactly what it says today, because (c)
touches none of them. §3 records four; (c) fills one and leaves these three:

- **the Apple-native Xcode arm** — a container sharing zero or several schemes, where the arm stops the family
  search having resolved neither verifier;
- **the Bundler family** — no RuboCop configuration beside the manifest; and
- **the npm family** — a root manifest declaring none of `NODE_SCRIPT_CANDIDATES.typecheck`.

That set is taken from §3 rather than re-derived, and §3's consequence stands unchanged: (c) removes the most
visible instance of the state and leaves the identical placeholder and the identical warning reachable through
those three.

**5 — Whether generated artifacts change.** Yes, for the population (c) reaches — the one dimension where (c)
is the expensive option, and where only (a) taken whole keeps it company. Stated as a property of what `init`
writes over a PHP repository with a PHPUnit configuration and no analyser configuration, all three artifacts
differ from today's:

- the **configuration** — `commands.typecheck` holds the wrapper invocation `buildCommands` writes for a
  wrapped key, where it held `placeholderCommand`'s output;
- the **wrapper set** — a `typecheck.sh` exists, carrying the fallback line as its body, where no file was
  written at all; and
- the **permission profile** — three allow entries for that wrapper, where there were none.

The same run's reported output moves with them: no `undetectedCommandWarning` for the key, and below the root
the `noteAnchoredFamily` note instead. The consequence to carry: a capture of `init`'s output taken over a
repository of that shape before the change is stale after it, and is re-taken from the changed generator. That
is a property of the artifacts and not a claim about any particular one. For **every other** repository — a
PHP repository that does configure PHPStan or Psalm included — the three artifacts are byte-identical to
today's, since the new arm runs only where both existing arms did not.

**What (c) costs, in terms this record can check.** Two things, neither of them a verdict.

**The first is what the key would then hold.** `docs/cli.md` gives the reason `typecheck.sh` and `test.sh`
are written always: those two are what "this change is done" means. Neither candidate line means that.
`composer validate --strict` verifies the manifest and not one line of the code; `php -l` verifies that the
code parses, which is a property every file that has ever run already has, and reports nothing about the
key's own subject. So (c) fills the key by lowering what occupying it asserts, for one family, while `doctor`
afterwards reports a graded wrapper and records nowhere that the line inside it checks less than the key's
other occupants. Detection has a precedent for saying so rather than staying silent: `nodeCommands`'
`WEAK_TYPECHECK_SCRIPTS` accepts `lint` as a last candidate and **reports** it, because it "may not type-check
at all" (§3). A fallback arm raising no such note would be the first weak `typecheck` line detection emits
unannounced.

**The second is whether the requiredness question survives (c).** §3 answers it directly: the state is a
property of the contract rather than of one family, and three arms reach it that (c) does not touch — so §1's
question stays open for the Bundler family, the npm family and the Apple-native Xcode arm, and this record
would still owe them an answer. What (c) is assessable as, then, is a fix to one family's share of the bind,
paid for in a weaker occupant of the key and in changed `init` output; whether that is worth doing beside (a)
and (b) is §7's.

**This section describes an arm `composerCommands` does not have; it does not add one.** Nothing under
`cli/src/` changes here, for §3's reason: a fix made as a side effect would settle by patch the question this
record exists to put to the reader.

---

## 7. Recommendation

**The criteria, stated before the option, so the choice is checkable.** Five, applied to (a), (b) and (c)
alike, each answered from the section that establishes it rather than re-derived here:

1. **Does a configuration end up able to distinguish "answered: none" from "not yet answered"?** This is the
   distinction §1 measured as missing — "no third value carries the meaning *this repository has no type
   check*".
2. **Does it avoid asking an adopter to name a command the repository does not configure?** §1's remedy
   problem: the placeholder warning says "replace it", and the only honest replacement is an analyser the
   repository has chosen not to adopt.
3. **Does it settle the state wherever §3 found it reachable**, rather than in one family?
4. **What does it cost an adopter whose configuration is already filled?** Dimension 3 of §4, §5 and §6.
5. **Does it change what `init` generates?** Dimension 5 of §4, §5 and §6.

**The three options against them.** Each cell is the verdict and the section that establishes it.

| | (a) optional key (§4) | (b) `none` sentinel (§5) | (c) composer fallback (§6) |
|---|---|---|---|
| **1 — answered: none vs unanswered** | **No.** An absent key reads the same as a hand-written config, an interrupted `init` and a key deleted by mistake (§4 dim 4) | **Yes.** The placeholder and the sentinel are different values, so `CONFIG_CHECK` reports answered instead of warning (§5 dim 4) | **No.** No state is added; the key holds a line asserting a check, and for §3's other three arms placeholder-versus-unanswered is exactly as today (§6 dim 4) |
| **2 — no unconfigured command named** | **Yes**, for the adopter who deletes the key: nothing is named. The adopter who has not yet answered still holds the placeholder and still meets §1's warning — booked under criterion 3 rather than here (§4 dim 4) | **Yes**, and the warning gains a remedy the repository's own state permits, where "install a static analyser" is not (§5 dim 4) | **Yes for one family**, by naming the line for the adopter — but the line is `composer validate --strict` or `php -l`, which §6 grades as lowering what occupying the key asserts, unannounced where `WEAK_TYPECHECK_SCRIPTS` reports its weak candidate (§6, *What (c) costs*). The other three arms are unchanged (§6 dim 4) |
| **3 — settles it wherever reachable** | **Partly.** A contract change binding every stack, so all four §3 arms can use it — but only by the adopter deleting the key, and the repository that has not yet answered keeps §1's warning with nothing in `doctor` saying deletion is now allowed (§4 dim 4) | **Yes.** One reserved literal, spelled identically in every stack, available to all four arms §3 names (§5 dim 1) | **No.** §3's verdict: the state is a property of the contract, and the Bundler family, the npm family and the Apple-native Xcode arm are untouched (§3; §6 dim 4) |
| **4 — cost to a filled config** | Nothing mechanical; a strict relaxation. `HarnessCommands.typecheck` and `buildPreset`'s `RawCommands` move with it (§4 dims 1, 3) | Nothing mechanical, no type moves, no migration and no `version` change — one string becomes permanently **reserved** in the key's value space for every stack (§5 dim 3) | Nothing, for the narrowest reason: detection runs on the `init` path only, so a filled config never meets the new arm (§6 dim 3) |
| **5 — generated output** | **Changes**, taken whole: the config may omit the key, `typecheck.sh` is not written and the profile loses its three entries for it (§4 dim 5) | **Unchanged**, for every repository: `init` never writes the sentinel, so config, wrapper set and profile are byte-identical (§5 dim 5) | **Changes** all three artifacts for the population it reaches, and the reported output with them (§6 dim 5) |

**Recommended: (b), the explicit `none` sentinel.** It is the only option that answers criterion 1 at all —
and criterion 1 is the question §1 poses, not a side property, because an adopter who has answered truthfully
still has no way to say so under (a) or (c). It answers criterion 3 with one literal every stack spells the
same, which matters given §3's verdict that the state belongs to the contract and not to `php-composer`. Its
criterion-4 cost is the smallest permanent one on the table — a single reserved string — and it is the only
option scoring **unchanged** on criterion 5, so no adopter's generated tree moves on its account. Its
weakness is real and is dimension 4's: the answer is self-reported, and nothing verifies it. That is priced,
not ignored — the gate arm below is what keeps a self-reported *none* from being reported as a type check
that passed.

**Why not (a).** Rejected on **criterion 1** (§4 dim 4): absence cannot carry an answer, so the state (b)
exists to record is exactly the state (a) destroys. Criterion 3 compounds it — the adopter who has not yet
answered keeps §1's unremediable warning, and `doctor` never tells them the key may now be deleted — and
criterion 5 shows (a) taken whole is not the cheap edit its two-line dimension 1 suggests: `ALWAYS_SELECTED`,
`REQUIRED_COMMAND_KEYS` and `buildCommands`'s refusal all move, and all three generated artifacts change for
the answering repository. (a) scores worse than (b) on 1, 3 and 5, and no better on 2 or 4.

**Why not (c).** Rejected on **criterion 3** — §3's verdict, that three arms reach the identical placeholder
and identical warning it does not touch — and, independently, on **criterion 1**: (c) adds no state, so even
for the family it fills, "this repository has no type check" remains unsayable, and §1's question would still
be open for the other three (§6, *whether the requiredness question survives (c)*). On **criterion 2** it
passes only by substituting a manifest check or a syntax check for the key's subject, which §6 records as the
first weak `typecheck` line detection would emit without the note `WEAK_TYPECHECK_SCRIPTS` sets the precedent
for. On **criterion 5** it is the most expensive of the three: all three artifacts change for the population
it reaches. Its one clear win is criterion 4's — the affected adopter does nothing and the warning is gone —
which does not offset a failure on the criterion the record was opened to answer.

**What the implementing change owes.** The §2 sites, in §2's order, with the shape §5 dimension 2 establishes
for each:

- **Wrapper generation** — `selectWrapper` in `cli/src/generators/scripts.ts` gains an arm **ahead of** the
  filled one, shaped as the placeholder's: `{ selected: false }`, no file written. Whether it reports through
  `WrapperSelection.placeholder` or a third case is the choice §5 flags, and it is not free either way:
  `writeWrapperScripts` in the same file owes an arm too, emitting a sentinel-specific warning or a deliberate
  silence, because its `placeholder` branch is tested before `selected` and its existing sentence is false of
  an answered key.
  Beside it, in the same file: `wrappedKeyMismatch` gains the sentinel in the early-return clause that already
  exempts an undefined and a placeholder value, and its doc comment's three-state "deliberately not this
  defect" list gains a fourth entry. **This edit is not reachable through the `selectWrapper` arm above** —
  `config set` calls `wrappedKeyMismatch` directly, outside the dry-run and unchanged arms (§2's sub-entry) —
  and without it `harness config set commands.typecheck "<sentinel>"`, the supported route to the answer,
  prints `wrappedKeyMismatchMessage`: that the key "holds a raw command line", that `init` should be re-run so
  the wrapper holds it, and that the key should then be set to the wrapper invocation — an instruction to undo
  the answer. The other two consumers need no edit of their own, for the same reason
  `COMMAND_WRAPPERS_CHECK` needs none: they are gated on `selectWrapper`'s new arm.
- **The permission entries** — `selectWrapperScripts` in `cli/src/generators/permissionProfile.ts` inherits
  that arm and needs no edit of its own. `COMMAND_PERMISSIONS_CHECK` and `COMMAND_WRAPPERS_CHECK` in
  `cli/src/doctor/checks.ts` need none **exactly when** the new arm reports `placeholder: true`; under any
  other shape each grades the third state by hand.
- **`setup-worktree.sh`** — nothing, §2's measured negative.
- **The unit loop's gate** — the parity-governed work, and the one item that cannot be skipped: an arm for
  "the key says there is none", so the gate is not run and the return says so rather than reporting a pass.
  It lands on every copy in one change — `plugin/agents/layer-implementer.md` (the resolved-value row and its
  `## Return format`), `plan_orchestration_instructions_core.md` and `user_review_fixes_instructions_core.md`,
  the two files that restate or refer back to the row, `plan_orchestration_instructions_autonomous.md`
  and `user_review_fixes_instructions_semi_autonomous.md`, and
  `user_review_fixes_instructions_autonomous.md`, which carries the same instruction by key name (§2).
  Outside that set, the nine `plugin/commands/*.md` files carrying the generic *"invoke its wrapper through
  the configured `commands.*` string … exactly as written"* instruction state no `typecheck` arm of their
  own; whether the sentinel arm is owed there is the implementing change's to decide, and it is named here so
  the set is bounded rather than assumed closed.
- **The configuration readers** — no edit, one property to check: `hc_runner_words` in
  `plugin/hooks/lib/harness-config-lib.sh` takes the leading word of every configured string, so the
  sentinel's spelling decides what the script-allowlist guard is handed. `hr_command` in
  `cli/templates/scripts/lib/harness-run-lib.sh` returns it unchanged.
- **`init`'s generator, and `doctor`'s configuration check** — two edits here. `checkCommands` in
  `cli/src/config/check.ts` is the option's point: the sentinel satisfies `COMMAND_REQUIRED`, is graded as
  answered and is reported as *none* rather than warned. And `requiredBinaries` in
  `cli/src/doctor/checks.ts` gains the sentinel in the clause that already skips an empty or placeholder
  command — without it the sentinel's leading word is demanded on the daemon-launched unit's `PATH` or
  reported as a line that would not reduce (§5 dimension 2). That clause is the whole of the edit: the same
  function's second loop reads a wrapper body only for a key whose value *is* the wrapper's invocation, which
  a sentinel is not, so it skips the key already. `buildCommands` in
  `cli/src/generators/harnessConfig.ts` is unchanged.

Plus the publication set §5 dimension 1 fixes, which is not optional because the adopter must spell the
literal exactly: one constant beside `COMMAND_PLACEHOLDER_MARKER` in `cli/src/config/model.ts`, read by one
exported function beside `isPlaceholder` that compares the **trimmed value whole** rather than by
containment, with no call site matching the literal — and the literal itself in the schema's `description`,
in `HarnessCommands`'s field comment and in `docs/config.md` §5's `commands.typecheck` row, the "one contract
in four places" `model.ts` names.

**What it must not touch.** No widening beyond (b): `COMMAND_REQUIRED` in `cli/src/config/check.ts` keeps
both names and `properties.commands.required` in `schemas/harness.config.schema.json` keeps both — dropping
either is option (a), which this section rejects. And no family-level patch: `composerCommands` in
`cli/src/detect/presets.ts` gains no arm, and `buildPreset` keeps filling an unresolved required key with
`placeholderCommand`, because `init` must not assert on the adopter's behalf a claim detection did not
establish (§5 dim 5).

**Whether `init`'s output changes: no.** Under (b) the generated configuration, the generated wrapper set and
the generated permission profile are byte-identical to today's for every repository, because `init` never
writes the sentinel. Nothing generated by a previous `init` is staled by this recommendation, and no refresh
of any such output is owed. The artifacts move only afterwards, in an adopter's own tree, and only by not
being produced — with one residue §5 records: an adopter who replaces an already-filled line with the
sentinel keeps the `typecheck.sh` on disk and the profile entries already rendered, since
`writeWrapperScripts` enqueues `create-if-absent` writes and no generator deletes.

**Ratification.** **Ratified 2026-09-06 — option (b), the explicit `none` sentinel.** §7 is settled: its
*What the implementing change owes*, its publication set and its *What it must not touch* are the
implementing change's scope, and *Whether `init`'s output changes: no* stands, so no capture refresh is
owed. The record itself still changes no behaviour.

**Implemented by `feat_harness_typecheck_none_sentinel`**, which settled the following. Each is a
fact about the tree, not a re-opening of the option.

- **The literal is `<none>`**, recognised by an exact comparison on the trimmed value:
  `COMMAND_NONE_SENTINEL` and `isNoneSentinel` in `cli/src/config/model.ts`, published in the
  schema's `commands.typecheck` `description`, in `HarnessCommands`'s field comment and in
  `docs/config.md` §5's row — the publication set §5 dimension 1 fixes.
- **`WrapperSelection` took the third case**, the shape §5 dimension 2 flagged as a choice: a new
  `answeredNone` flag in `cli/src/generators/scripts.ts` rather than a second meaning for
  `placeholder`, with a message of its own in `writeWrapperScripts`, `COMMAND_WRAPPERS_CHECK` and
  `COMMAND_PERMISSIONS_CHECK`. `selectWrapperScripts` inherits it unedited, as §7 states.
- **Recognition is `typecheck`-only, and carried by every consumer.** `answersNone(key, value)` in
  `cli/src/config/model.ts` gates on `NONE_SENTINEL_KEY`, and `selectWrapper`,
  `wrappedKeyMismatch`, `commandHeads` and `commandReportLines` each call it with the key they
  hold, so `commands.test` holding the same string keeps its wrapper, its allow entries and its
  mismatch report; `checkCommands` warns there that the value is stored as a literal command line
  and will be run. This record assesses no key but `typecheck`.
- **Two sites §2 did not name were edited.** The empty-or-`isPlaceholder` skip §7 assigns to
  `requiredBinaries` lives in `commandHeads`, the helper `requiredBinaries` and
  `COMMAND_RESOLVES_CHECK` share, so the sentinel arm landed there and both inherit it. And
  `commandReportLines` in `cli/src/commands/init.ts` gained a row of its own; without it an
  answered key printed `run as configured; this key is not wrapped and is not allow-listed`.
- **The bounded set is closed.** The nine `plugin/commands/*.md` files are owed no arm — they carry
  the generic *"invoke its wrapper through the configured `commands.*` string"* instruction and
  name no `typecheck` arm, the gate semantics living in the agent and instruction files the arm did
  land on — and none of them is edited.
- **_Whether `init`'s output changes: no_ held.** `buildPreset`, `buildCommands` and
  `REQUIRED_COMMAND_KEYS` are unchanged and no generator writes the sentinel, so no fixture capture
  moved and none was re-taken.
