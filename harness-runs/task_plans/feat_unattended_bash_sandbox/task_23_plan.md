### Task 23 — Deny credential reads on both sides: `sandbox.credentials` and the file tools' `Read` rules

**Goal:** Implement goal 1's credential denial in the generated profile. There are two halves:

- **Sandboxed commands:** a `sandbox.credentials` block denies the files and unsets the variables. The shape is the user's, from the sandboxing page's *"Protect credentials"* section:

  ```json
  "sandbox": {
    "credentials": {
      "files":   [ { "path": "~/.aws/credentials", "mode": "deny" }, { "path": "~/.ssh", "mode": "deny" } ],
      "envVars": [ { "name": "GITHUB_TOKEN", "mode": "deny" }, { "name": "NPM_TOKEN", "mode": "deny" } ]
    }
  }
  ```

  Entries also accept `"mode": "mask"`. File paths follow the `sandbox.filesystem.*` prefix rules, so `~/` is the home directory. `deny` entries from every settings scope merge, and no scope can remove one another added. `sandbox.credentials` affects sandboxed Bash commands only.
- **The file tools:** `Read`, `Grep` and `Glob` run outside the sandbox. So the profile also carries `permissions.deny` `Read(...)` rules for every file path the block denies. That refuses those paths to the file tools in every permission mode, including the `acceptEdits` override (the user's ruling).

**Depends on:**

- Task 2, which creates `cli/src/generators/sandboxProfile.ts` with `applySandbox(profile, { repoRoot, config })`, called by `renderProfile` in `cli/src/generators/permissionProfile.ts`, and which extends `assertRunnable` to the sandbox lists. Task 2 adds the template's `sandbox` object and leaves `credentials` to this task.
- Task 15, which made `"defaultMode": "dontAsk"` in the same template.
- Not a dependency, a forward citation: Task 25, which ships later in this branch, adds roadmap item 21 (measuring what the sandbox breaks, including the three omitted files) to `docs/development.md` → `## 6. The roadmap this tree defers to`. The citation is text only, so this task ships independently, and the number resolves once Task 25 lands.

**Where this task stops.** `doctor` does not grade the credentials block in this branch. Task 6's `profile-sandbox` grades strict mode, the excluded commands, the domains and the opt-out, and Task 7's `profile-write-protection` grades write protection. `docs/cli.md` describes this block in **Task 13**.

### Targets

- `cli/templates/claude/settings.autonomous.json` — the `credentials` block and its `_README` line.
- `cli/src/generators/sandboxProfile.ts` — the `Read` deny derivation.
- `cli/src/generators/permissionProfile.ts` — `assertRunnable` covers the credential paths.
- `cli/test/profile.test.mjs` — the accompanying cases.

**Work:**

- [ ] Template: add `"credentials"` inside the `sandbox` object, in the user's shape, every entry `"mode": "deny"`.
  - **`files`**, each a `~/` path: `~/.ssh`, `~/.aws`, `~/.config/gh`, `~/.gnupg`, `~/.netrc`, `~/.git-credentials`, `~/.docker/config.json`, `~/.kube`, `~/.config/gcloud`, `~/.azure`, `~/.bashrc`, `~/.bash_profile`, `~/.profile`, `~/.zshrc`, `~/.zprofile`.
  - **`envVars`:** `GH_TOKEN`, `GITHUB_TOKEN`, `HARNESS_PR_TOKEN`, `NPM_TOKEN`, `ANTHROPIC_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`.

  Unsetting the token variables reaches sandboxed commands only. The two excluded wrappers run unsandboxed and keep the environment they need for an HTTPS push.
- [ ] Template `_README`: add one line, upper-case lead in the file's style, starting `CREDENTIALS ARE DENIED ON BOTH SIDES:`. Cover:
  - what the block does, and that it reaches sandboxed commands only;
  - the `Read` rules for the file tools, and that they hold in every permission mode;
  - that every `deny` merges across settings scopes and none can be removed by another scope;
  - the three deliberate omissions, each with its reason. `~/.npmrc` and `~/.gitconfig` are read by npm and git on every invocation, and `~/.zshenv` by zsh on every invocation, so whether denying them breaks a run is not yet measured. Cite that as roadmap item 21, by number, in the line's own words, for example *"left readable until measured (roadmap item 21)"*. The line names no branch, and none of this repository's run vocabulary: it is read by an adopter (`harness-runs/lessons.md` → `## Adopter-facing documentation`).

  Phrase no fact more firmly than the task prompt's `## Verified facts`.
- [ ] `sandboxProfile.ts`: export the following.

  ```ts
  export function credentialReadDenyRules(input: { readonly home: string; readonly files: readonly string[] }): readonly string[];
  ```

  - For each `~/<rest>` path, return `Read(/${join(home, rest)})` and `Read(/${join(home, rest)}/**)`. That is the `_README`'s *"EVERY FILE RULE MARKS AN ABSOLUTE PATH WITH A `//` PREFIX … THE PATH BRINGS ITS OWN LEADING SLASH"* form: two slashes, never three.
  - Do not emit a `Read(~/…)` rule. The profile's own note defines only `//` (filesystem root) and `/` (relative to the settings file), so a `~/` rule form is outside what this file states.
  - A path without a `~/` prefix is an internal error (`EXIT.INTERNAL`): the template is the only source.
  - `home` is `homeRoot()` from `cli/src/core/paths.ts`, the one producer of `<home_root>`.

  In `applySandbox`, read `sandbox.credentials.files[].path` from the profile, which is the template's one list. Append the rules to `permissions.deny` without duplicates. They are appended whether or not the opt-out is taken, because file-tool rules hold with the sandbox off. A remote job generates its own profile on the runner, so `home` is the runner's.
- [ ] `permissionProfile.ts` → `assertRunnable`: scan `sandbox.credentials.files[].path` and `envVars[].name` with the `FORBIDDEN_IN_ENTRY` table. If the table refuses `~`, exempt the leading `~/` only, and say why in a comment. Confirm the new `deny` entries pass `assertNoBrowserDeny`.
- [ ] `profile.test.mjs`: on an `init` fixture, assert:
  - `sandbox.credentials.files` and `envVars` equal the template's lists, read from the template;
  - for `~/.ssh`, `permissions.deny` holds `Read(/<home>/.ssh)` and `Read(/<home>/.ssh/**)`, with `<home>` from `os.homedir()` and no rule starting `Read(///` or `Read(~`;
  - every `files` path has its pair;
  - with `sandbox.optOut` set, the `Read` rules are still present.

**Verification:**

- `npm test --workspace cli -- test/profile.test.mjs` passes. Then run `commands.typecheck` as written.
- The file-tool half is exercised end to end only by the manual step in the story index, which reads `~/.ssh` with the `Read`, `Grep` and `Glob` tools in a session launched with the regenerated profile. The suite proves the rules are rendered, not that the host honours them.
- `grep -n "'~/" cli/src/generators/*.ts` finds no credential path literal. The list lives in the template only.
- `grep -n 'feat_' cli/templates/claude/settings.autonomous.json` prints nothing: the `_README` names no branch.

- **Deviations from plan:**
  - `FORBIDDEN_IN_ENTRY` does not refuse `~`, so `assertRunnable` scans `sandbox.credentials.files[].path` and `envVars[].name` with no exemption and no comment; the conditional exemption was not needed.
  - `applySandbox` screens `homeRoot()` with `assertUsableInEntry` (ordinary exit code) before building the `Read` rules: the home directory is a machine value, and without the screen a home path carrying a quote would reach `assertRunnable` and be reported as this CLI's fault (`.claude/context/cli.md` → "screen the adopter-fixable shape first").
  - The `~/` prefix is matched with a regex (`HOME_RELATIVE`) rather than a `'~/'` string literal, so the plan's `grep -n "'~/" cli/src/generators/*.ts` check holds.
