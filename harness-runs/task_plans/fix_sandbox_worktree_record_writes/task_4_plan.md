### Task 4 — Mark `commit-on-branch.sh` `runsUnsandboxed`, and adjust `doctor`'s missing-entry message, the write-protection header and the profile tests

**Goal:** Make the generated unattended profile run the main checkout's commit wrapper outside the sandbox, and let every consumer of the excluded set follow from the one flag, as it already does for push and refresh. Then make `doctor` describe a missing entry correctly for any of the three.

**Depends on:** Task 1. A row may be marked `runsUnsandboxed` only once its script carries the excluded-wrapper checks (`cli/src/generators/sandboxProfile.ts` header: *"it names only a file the sandbox cannot write"*). Those checks are what make running it with full access safe. After this task the profile carries three `sandbox.excludedCommands` entries, in table order:

```
bash <repoRoot>/<scriptsDir>/commit-on-branch.sh:*
bash <repoRoot>/<scriptsDir>/push-branch.sh:*
bash <repoRoot>/<scriptsDir>/refresh-branch.sh:*
```

Each one is produced by `sandboxExcludedCommand` from `outerLoopScriptPath`. In `protectedPaths`, the main checkout's `commit-on-branch.sh` moves into the first, unsandboxed-wrapper group, with the reason ``the main checkout's commit-on-branch.sh runs outside the sandbox``. It has always been protected, so the denied path set is unchanged. Only its order and its reason move. **Task 5** restates the `_README` prose and **Task 11** re-renders the worked example, so both restate these strings.

### Targets

- `cli/src/generators/outerLoopScripts.ts`
- `cli/src/doctor/checks.ts`
- `cli/src/generators/writeProtection.ts`
- `cli/test/profile.test.mjs`
- `cli/test/doctor-profile-sandbox.test.mjs`

**Work:**

- [ ] `outerLoopScripts.ts`: add `runsUnsandboxed: true` to the `commit-on-branch.sh` row, and nothing else on it. Update the `runsUnsandboxed` doc comment so it says what the flag now covers: the main checkout's copies of the git wrappers an agent commits, pushes and refreshes through. Point it at the reasons in `docs/sandbox-verification.md`: G1/F1 for the commit, P1 and F3 for the network.
- [ ] `checks.ts` → `profile-sandbox`: the "lacks" finding reads *"that wrapper's SSH push or fetch fails inside the sandbox on macOS, and the push wrapper still exits 0"*, which is false for the commit wrapper. Reword it as one message true of all three: without the entry, that wrapper runs sandboxed, where a linked worktree's git record and an SSH remote are both out of reach on macOS. Cite `docs/sandbox-verification.md` F1 and F3. The grading stays `warn` by default and `fail` under `--remote-job`. Every value in the message is still taken from `expectedSandbox`, never retyped.
- [ ] `writeProtection.ts`: rewrite the `protectedPaths` doc paragraph that begins *"The worktree records are protected file by file, never as a directory"*. Keep the decision: no directory-wide `denyWrite` on a record, because the task prompt forbids changing a protection. Replace its stated reason, which G1/G2 falsified (*"a sandboxed git command in a worktree writes its record's HEAD, index, logs/…"*), with the measured one: on Claude Code 2.1.299, macOS, the runtime keeps a record outside the session's cwd closed to sandboxed git whatever the profile says. A run's commits therefore go through the excluded `commit-on-branch.sh`, which writes only the record's `index`. The per-file entries stay, because git and the excluded wrappers follow exactly those files. The header's own rule sentence is unchanged.
- [ ] `profile.test.mjs`: the excluded-commands assertion is already derived from `OUTER_LOOP_SCRIPTS.filter(runsUnsandboxed)`. Change only its failure message, *"…the main checkout's two wrapper spellings"*, so it does not name a count. Add one assertion that `excludedCommands` contains the `commit-on-branch.sh` main-checkout entry, and that no worktree-relative or sibling-glob spelling of it appears there.
- [ ] `doctor-profile-sandbox.test.mjs`: add a case that removes only the `commit-on-branch.sh` entry from a freshly wired profile. `profile-sandbox` warns naming that entry without `--remote-job`, and fails with it, and the message carries no "SSH push" claim. Keep every existing case green unchanged.

**Verification:**

- `npm test --workspace cli -- test/profile.test.mjs` and `npm test --workspace cli -- test/doctor-profile-sandbox.test.mjs`, from the repository root, each as one plain foreground command, each `# fail 0`.
- Build, then run `init` with the compiled CLI against a throwaway fixture repository under the temp directory, never this checkout. The fixture's `.claude/settings.autonomous.json` carries the three entries above in that order. `doctor` on the fixture passes `profile-sandbox` and `profile-write-protection` with and without `--remote-job`. This is the end-to-end consumer path for the flag.
- Grep `cli/src` for a second spelling of `commit-on-branch.sh` used as a path. There is none: the table row is its only declaration (`.claude/context/cli.md` → *"One string, one producer"*).

- **Deviations from plan:**
  - `profile.test.mjs`: beyond the failure message, the sandbox test asserted `UNSANDBOXED_ROWS.length === 2` and took the push wrapper as `mainForms[0]`; with the commit row now first in table order both broke. The count assertion became `UNSANDBOXED_ROWS.length > 0`, the push prefix is located by `file === 'push-branch.sh'`, and the test title and the `UNSANDBOXED_ROWS` doc comment drop "two".
  - `checks.ts`: the stale-`Bash(…)`-spelling finding in the same check carried the same false "SSH push or fetch fails" clause for the commit wrapper (which `staleExcludedCommands` now covers). Both findings now share one module-local clause, `SANDBOXED_WRAPPER_CONSEQUENCE`; existing case (g) asserts only "matches no command" and stays green.
  - End-to-end check: the throwaway fixture was left at `/var/folders/5t/ht_j4jgs5h51bf16nmfz885m0000gn/T/tmp.LLqkdYqHUN` because its `rm -rf` was refused by the permission layer; it is under the system temp directory only.
