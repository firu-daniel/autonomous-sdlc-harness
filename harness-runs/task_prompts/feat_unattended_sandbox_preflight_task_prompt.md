`feat_unattended_sandbox_preflight` makes an unattended run refuse, before it starts, on a machine that cannot sandbox it, with a message naming what is missing. It also has `doctor` and `doctor --remote-job` report the sandbox's prerequisites ahead of time.

This is the second of three branches, and it starts from a `dev` that already carries `feat_unattended_bash_sandbox`. That branch turned on the sandbox in the unattended profile with `failIfUnavailable: true`. It also added the configuration for the adopter's domains and for the named opt-out on platforms with no supported sandbox. `failIfUnavailable` already stops an unsandboxable session, but only after the watcher has launched it, and only with Claude Code's own exit. This branch moves the refusal ahead of the launch and makes the message actionable.

**The GitHub part needs a release, not `dev`.** A `harness-run.yml` job installs the plugin by cloning the marketplace repository at the release tag `autonomous-sdlc-harness--v<version>`, where `<version>` is the workflow's `HARNESS_CLI_VERSION` (the `Install the pinned plugin` step), and runs its `init` and `doctor` steps as `npx --yes "autonomous-sdlc-harness@$HARNESS_CLI_VERSION"` from npm (`docs/remote-execution.md` → `### Upgrading`). So anything checked on GitHub needs a version released from a `dev` that carries `feat_unattended_bash_sandbox`, through `bash scripts/release.sh <version>` (`docs/development.md` → `## 7. Releasing`: the bump pull request, the publication to `main`, `tag-release.sh`, then `release-npm.yml`'s npm publish). The repository the job runs against then needs its workflows re-rendered at that version with `npx autonomous-sdlc-harness@<version> init --upgrade-workflows`, and every path the upgrade's report prints committed and pushed to its default branch. Local runs read `plugin/` in place from the main checkout and use the checkout's own CLI, so they need no release. Goal 5's install step runs only in a job whose workflow a CLI carrying this branch rendered, so it cannot run on GitHub before this branch's own release. **Verify it here locally and by test**: the install step and its `# DECLARED MIRRORS` entry pinned by a test over the rendered template, `node scripts/check-rendered-workflows.mjs` passing on the render, and `doctor --remote-job`'s `sandbox-prerequisites` check run on a Linux host or container without `bubblewrap`/`socat` if one is available. **The real GitHub job is a post-release follow-up**: `docs/remote-execution.md` §8 records that the install step has not yet run on GitHub, and `feat_unattended_sandbox_measurement`'s full-run leg runs it against the release that carries this branch.

## What is there after `feat_unattended_bash_sandbox`

- **The opt-out is an object, not a boolean.** `sandbox.optOut` is `{ "reason": "<non-blank>" }` (`cli/src/config/model.ts`, `cli/src/config/check.ts`, `schemas/harness.config.schema.json`; the negative fixture `schemas/negative/sandbox-opt-out-boolean.json` rejects a boolean). Whether it is taken is decided in one place, `sandboxOptedOut` in `cli/src/config/model.ts` ("an `optOut` whose `reason` is non-blank"), which the profile generator, the write-protection rules and `doctor`'s `profile-sandbox` all import. A taken opt-out renders `enabled: false`, `failIfUnavailable: false` and the marker `THE SANDBOX IS OFF BY THIS REPOSITORY'S OWN CHOICE` into the profile.
- **`doctor`** has `profile-sandbox` and `profile-write-protection` (warn normally, fail under `--remote-job`, a taken opt-out stays a warning) and its `git` check warns below 2.38. There is no prerequisite check yet.
- **The prerequisites are already documented, as a gap.** `docs/cli.md` §6 → "**What a host needs.**" and `docs/remote-execution.md` §8 ("The workflows do not install them yet") both state the Linux/WSL2 needs and point at roadmap item 20 for the check and the refusal. `harness-run.yml` is unchanged: today a GitHub-hosted run's session exits at startup because nothing installs `bubblewrap`/`socat`.
- **The shell side reads configuration from the main checkout.** The three unsandboxed wrappers (`commit-on-branch.sh`, `push-branch.sh`, `refresh-branch.sh`, the `runsUnsandboxed` rows of `OUTER_LOOP_SCRIPTS` in `cli/src/generators/outerLoopScripts.ts`) read `harness.config.json` from the main checkout. They never read a run copy's sandbox-writable one: since clone-per-run, a run copy is a clone the watcher cuts, not a linked worktree (`cli/templates/scripts/lib/harness-run-lib.sh` → `hr_wrapper_main_of`, the clone arm, and the wrapper config reads). The watcher runs from the main checkout too.
- **The watcher already gates each local launch on a per-run profile.** Before each launch it renders a per-run copy of the profile and checks it (`cli/templates/scripts/autonomous-watcher.sh` → `run_profile_render`, `run_profile_check`, `launch_run`, `fail_before_launch`). The local refusal belongs on that path.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Re-verify the facts above in the merged code before planning on them.

> **The sandbox facts below were checked against the official docs on 2026-10-12, in a supervised session.** Sources: `https://code.claude.com/docs/en/sandboxing` (S) and `https://code.claude.com/docs/en/settings-reference` → `### sandbox` (R). Unattended runs have no web access. Rely on these as stated, and treat the points marked **unresolved** as unresolved.

---

## The goal

1. **One owner for the prerequisite table.** A single CLI module declares what the sandbox needs on each platform and how each requirement is answered:
   - on Linux and WSL2, the binaries `bwrap` and `socat` and the packages that provide them (`bubblewrap`, `socat`);
   - on Ubuntu 24.04 and later, whether AppArmor blocks unprivileged user namespaces (`kernel.apparmor_restrict_unprivileged_userns`) and whether a `bwrap` profile already allows them;
   - WSL1, detected from the kernel's release string, as unsupported;
   - on macOS, nothing to install.

   The module's own logic is pure and touches no host. The live probe that feeds it lives with the `doctor` checks that already own `PATH` lookup and the agent binary's name, so there is no import cycle and no second copy of those helpers.
2. **`doctor` gains a `sandbox-prerequisites` check**, and `doctor --remote-job` runs it against the runner it describes. The check names each missing piece and the command that installs it. It reports an AppArmor answer it cannot determine as uncertain, never as a pass.
3. **The run library mirrors the table** for the shell side. The mirror is declared in both headers, the owner's and the mirror's: a rename on either side is an edit to both. The library also reads the opt-out from the **main checkout's** `harness.config.json`, mirroring `sandboxOptedOut` exactly (declared as a mirror of it): the opt-out is taken only when `sandbox.optOut.reason` is a non-blank string. A missing `optOut`, a blank or non-string `reason`, a boolean, or an unreadable file counts as **not opted out**, so the refusal stands.
4. **Refuse a fresh local launch, and a remote job, on a machine that cannot sandbox**, unless the opt-out was taken. The refusal names what is missing, for example `bubblewrap`/`socat` on Linux or WSL1. It never runs silently unsandboxed. A launch is never refused on an *uncertain* AppArmor answer: only a definite missing piece refuses. Any other answer is left to `failIfUnavailable`.
5. **The remote job installs what it needs.** The `harness-run.yml` job installs `bubblewrap` and `socat` on the GitHub-hosted Linux runner before the agent starts. Where AppArmor would block user namespaces, it writes the `bwrap` profile rather than refusing. This step is a third copy of the prerequisite list, so it is declared as a mirror in the workflow header's existing `# DECLARED MIRRORS` block.
6. **Close roadmap item 20 in the docs that point at it.** `docs/cli.md` §6 → "**What a host needs.**", `docs/remote-execution.md` §8's runner paragraph, every other "roadmap item 20" reference (search for it), `ROADMAP.md`'s "`doctor` sandbox checks" row, and `doctor`'s rows in `docs/cli.md` §7 describe the check, the refusal and the install step as they now are. Item 20 itself is defined by its row in `docs/development.md` → `## 6. The roadmap this tree defers to` (`| 20 |`). That row does not carry the words "roadmap item 20", so a search misses it. Mark the item shipped there: either the row says so in its own text, or it is added to the section's "**Items 3, 4, 13 and 14 have shipped**" paragraph.

## Constraints

- The guards, the deny floor and the `pre-push` hook all stay, and so does everything `feat_unattended_bash_sandbox` added.
- The supervised profile and supervised sessions are out of scope.
- The opt-out is never the default, and a refusal never offers it as the first fix.
- `scripts/run-gates.sh` passes.

## Not in this branch

Measuring what breaks, recording the Linux runner's PID-namespace and no-new-privileges results, and rewriting the honesty paragraphs all go to `feat_unattended_sandbox_measurement`.

## Verified facts (2026-10-12)

- `sandbox.failIfUnavailable`: default `false`. When `true`, Claude Code exits at startup if the sandbox cannot start; on an unsupported platform it does not start at all. (R)
- Platforms: macOS uses Seatbelt and needs nothing installed. Linux and WSL2 need `bubblewrap` (for filesystem isolation) and `socat` (to relay network traffic to the proxy). The seccomp filter that blocks Unix sockets is optional (`npm install -g @anthropic-ai/sandbox-runtime`). WSL1 is unsupported, with the message "Sandboxing requires WSL2". Native Windows runs unsandboxed. (S → "Get started", "Set up Linux and WSL2")
- Install: `sudo apt-get install bubblewrap socat` (Ubuntu/Debian), `sudo dnf install bubblewrap socat` (Fedora). The dependency check runs at Claude Code startup. (S → "Set up Linux and WSL2")
- On Ubuntu 24.04 and later, the default AppArmor policy stops `bwrap` creating user namespaces. Check with `sysctl kernel.apparmor_restrict_unprivileged_userns`:
  - `0`, or a missing key, means nothing needs doing;
  - `1` means a profile is needed. The fix is a profile at `/etc/apparmor.d/bwrap` granting `userns` to `/usr/bin/bwrap`, then `sudo systemctl reload apparmor`. (S → "Ubuntu 24.04 and later" accordion)
- `sandbox.bwrapPath` and `sandbox.socatPath` exist as settings for non-standard binary locations. (R → index)
- A root caller needs `CAP_SETFCAP` in its bounding set, or every sandboxed command fails with `Operation not permitted`; a non-root caller needs nothing. (sandbox-runtime README → "Running as root")
