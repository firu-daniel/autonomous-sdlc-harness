`fix_remote_plugin_version_pin` makes a remote job run the plugin version its workflow was rendered for, instead of
whatever the marketplace's default branch carries at the moment the job starts. As shipped through 0.4.2, **every
release of this repository breaks the remote runs of every adopter who has not re-rendered their workflows**, whether
or not they chose to upgrade — the 0.4.2 release itself did so for any workflow rendered for 0.4.1, a break the
operator accepted knowingly because remote execution has no adopters yet. The fix is what stops the next release from
doing the same, so each release until it lands repeats that break.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** The approaches below
> are **candidates, not instructions** — verify each against the real code, the real agent-runner CLI and GitHub's
> documentation before planning it, and say so in the plan if a better one exists or if one of them is wrong.

---

## What happens today

- `init` renders `.github/workflows/harness-run.yml` from `cli/templates/github/workflows/harness-run.yml`, replacing
  `{{cliVersion}}` with its own version, so an adopter who ran `init` 0.4.1 commits `HARNESS_CLI_VERSION: '0.4.1'`.
  The file is create-if-absent: "from then on it is yours to tune, and a re-run of `init` keeps your copy".
- The job runs the CLI pinned — `npx --yes "autonomous-sdlc-harness@$HARNESS_CLI_VERSION" …` — but installs the
  plugin **unpinned**, in the step `Install the pinned plugin`:

      claude plugin marketplace add "$source_repo"
      claude plugin install autonomous-sdlc-harness@autonomous-sdlc-harness

  which takes the marketplace's default branch as it stands. The template's header, `THE PLUGIN PIN`, records why:
  `claude plugin marketplace add --help` and `claude plugin install --help` (Claude Code 2.1.282) offered no ref or
  version. The step then **refuses** to run when the installed version differs:

      the installed plugin is version '<installed>', but this workflow was rendered for <pinned>. Publish the
      matching plugin, or re-run init with the installed version and commit the workflow.

- So the day a release reaches `main`, every job rendered for an earlier version installs the new plugin and stops at
  that check. "Re-run init" does not help on its own, because `init` keeps the existing workflow; the working route,
  documented in `docs/remote-execution.md` → `## 7.` for the 0.4.1 profile change, is to delete both workflows, run
  `init` at the new version, re-apply any timeout, runner or cron tuning from git history, then commit and push to the
  default branch with `--no-verify`.

A local adoption is not affected: its plugin changes only on `claude plugin update`, and the local watcher checks no
pin.

## The behaviour wanted

The operator's own model, and the one packages and tools usually follow: **the job runs exactly the version the
workflow names.** Upgrading is a deliberate act by the adopter — they move to a new version, accept that the workflows
are re-rendered, and commit and push them. A release of this repository changes nothing for a repository that has not
upgraded.

Rejected up front, with the reason: an **auto-update setting** that re-renders and commits the workflows for the
adopter. The harness does not commit on the user's behalf, and it cannot push the default branch anyway — every
protected-branch guard and the generated `pre-push` hook refuse it.

## Candidate approaches

1. **Install the plugin at the workflow's version.** Establish what the agent-runner CLI actually supports now: a ref
   or version in the marketplace source (a `ref` in `extraKnownMarketplaces`, a `#<ref>` or `@<ref>` suffix on
   `marketplace add`, a version on `plugin install`), and whether version resolution uses git tags. This repository
   already carries one tag in the shape `autonomous-sdlc-harness--v0.1.0`, which looks like a per-plugin version tag;
   establish what that shape is for and who created it. **0.2.0 through 0.4.2 were never tagged** (check again when planning), and
   `.claude-plugin/marketplace.json` → `metadata.version` still says `0.1.0`.
2. **Fetch the pinned plugin without the marketplace's ref support.** For example, the job clones this repository at
   the release's tag and adds that directory as a `directory`-sourced marketplace — the source this repository's own
   machine uses, whose runtime root and install root differ, which `doctor`'s `plugin-permissions` and
   `init --plugin-root-entries` already handle. Or ship `plugin/` inside the npm package, so the pinned
   `npx autonomous-sdlc-harness@<version>` carries the plugin of the same version and the job adds it from there — one
   artifact, one version.
3. **A thin caller workflow over a reusable workflow pinned by ref** — this answers the operator's question of whether
   the workflows could live somewhere they need not be re-committed in full. The adopter's committed file would
   shrink to its `on: workflow_dispatch` inputs plus `uses: firu-daniel/autonomous-sdlc-harness/.github/workflows/<file>@<release ref>`
   with `secrets: inherit`, and upgrading becomes a one-line ref bump — which Dependabot's `github-actions` ecosystem
   can propose as a pull request the adopter merges, the usual way to get updates without anyone committing on the
   user's behalf. Verify before relying on it: how `vars.*` repository variables, `runs-on` from a variable, the
   `run-name` title the job's pause poll and `remote-run.sh` match runs by, `concurrency`, `permissions` and
   `github.token` behave across `workflow_call`; whether the scheduled poller can be a caller too; and what it does to
   "yours to tune" (timeouts, runner, cron), which today are edits to the adopter's own copy.

Whatever is chosen, **the version check stays**, as the guard that the installed plugin is the one named, and its
message names the real upgrade route.

## Release process and upgrade route

- Every release creates whatever ref the chosen approach installs from (a tag per version at least), and a release
  can no longer change what an already-rendered workflow installs. Decide whether the missing tags for past releases
  are backfilled, and keep `marketplace.json` → `metadata.version` true or say why it is not a release number.
- Upgrading is one documented route, and ideally one command: an `init` option (or a `doctor` remedy) that re-renders
  only the two workflows at the current CLI version, keeping or pointing at the adopter's tuning, so the route is not
  delete, re-init and re-tune by hand. `doctor` should report a workflow rendered for a version other than the CLI
  running it, with that route.
- `docs/remote-execution.md` gains an *Upgrading* section, and `## 6.`'s row *The plugin cannot be pinned by a ref at
  install* is updated with what was established.

## Acceptance criteria

- A job rendered for version N installs plugin version N while this repository's `main` carries version N+1; a test
  drives that case (a stubbed marketplace or install carrying two versions), and the job runs rather than refusing.
- A job whose installed plugin still differs from its pin refuses with a message naming the upgrade route.
- The upgrade route is documented and, if a command was added, tested: after it, the workflows name the new version
  and nothing else the adopter tuned was lost silently.
- The release steps (in `docs/development.md` or wherever releases are documented) create the ref the job installs
  from.

## Out of scope

- The version bump and its publication.
- Re-running Gate 12; its re-run on the release that carries this fix should add an observation for a job rendered
  for the previous version.
