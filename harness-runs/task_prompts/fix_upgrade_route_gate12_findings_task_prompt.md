`fix_upgrade_route_gate12_findings` fixes what Gate 12 round 4 (2026-09-30) found in the pinned plugin install and the
`init --upgrade-workflows` route that `fix_remote_plugin_version_pin` added. The round is recorded in
`docs/development.md` → `## 5.` → Gate 12 → **Round 4**. The core behaviour held. A job cloned the release tag its pin
names, passed the version check, and read every plugin file from
`/home/runner/work/_temp/harness-marketplace/plugin`, both when the pin matched `main` and when `main` had moved past
it. The findings below are what the round showed wrong around that core.

Workflows rendered before the pinned install (0.4.2 and earlier) are **not a concern**: remote execution has no
adopters, so no repository carries one. Nothing here needs to detect, warn about or rescue such a workflow.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** The fixes suggested
> below are **candidates, not instructions**: verify each against the real code and say so in the plan if a better
> one exists.

---

## 1. Document what an upgrade does to a run already in flight

`remote-run.sh` dispatches every `harness run <branch>` with `--ref <branch>`, and GitHub runs the workflow file **as
that ref carries it**. A run's branch is cut from the default branch when its task is dropped, so it keeps the
workflows, and therefore the pin, that were current then. Round 4 showed this: a resume dispatched after the upgrade
reached `main` still ran the workflow the run's branch carried (run `36671710773`). A task dropped after the upgrade ran
the upgraded one.

This is the intended behaviour, not a bug: a run keeps the version it started with. A self-pause continuation, a
`/autonomous-sdlc-harness:branch-resume` and an answered park all go on cloning that run's own tag, whatever `main`
carries. But nothing says so. Wanted, documentation only:

- `docs/remote-execution.md` → `### Upgrading` states that an upgrade applies to runs dropped after the push, and that
  a run in flight finishes on the version it started with.
- It gives the deliberate route for moving an in-flight run to the new version: check the two workflow files out from
  the default branch onto the run's branch (`git checkout origin/<default branch> -- .github/workflows/harness-run.yml
  .github/workflows/harness-resume.yml`), commit, and push the branch. Its next dispatch then runs the new version. It
  also warns that this switches the plugin version mid-run.
- `init --upgrade-workflows`'s printed report and `doctor`'s version warning each carry one sentence to the same
  effect, pointing at that section.

Rejected up front: dispatching every run from the default branch instead of its own branch, so that an upgrade would
reach runs in flight. That would silently switch running tasks to another plugin version mid-flight, which is exactly
what the pin exists to prevent.

## 2. A double full stop in `doctor`'s version warning

`… this push is yours to make on purpose, and the harness never makes it.. To stay on 0.4.1: …`
Find where the sentence is joined and fix it at the join, not in one caller.

## 3. `init --upgrade-workflows` leaves its `.bak` files committable

It writes `.github/workflows/harness-run.yml.bak` and `.github/workflows/harness-resume.yml.bak`. Both show as
untracked (`??`), not ignored, so a `git add -A` or `git add .github` commits them. The output only says "Do not
commit the .bak files". Candidate: the managed `.gitignore` block ignores `.github/workflows/*.yml.bak`. Check
whether the other `.bak` files that `init --force` writes have the same exposure, and treat them together.

## 4. `init --upgrade-workflows` reprints the whole first-setup block

After the upgrade it printed `== remote execution` with all five first-time steps. These include
`git commit -m "Add the harness workflows"`, setting the credential secret, the optional secrets and the runner
variable. For an upgrade, the relevant steps are: diff against the `.bak`, commit the two files with an upgrade
message, then push with `--no-verify`, plus finding 1's sentence about runs in flight. The rest is noise, and the
commit message is wrong.

## 5. Log noise in the install step

The `git clone --depth 1 --branch "$tag"` in `Install the pinned plugin` prints git's whole detached-HEAD advice
("Note: switching to '<sha>'. You are in 'detached HEAD' state …") into every job log, although the step passes
`--quiet`. Establish why, then silence it, for example with `-c advice.detachedHead=false`.

## 6. To investigate: the local marketplace reconcile error

A local Claude Code 2.1.284 session in this repository logged, at start:

    [ERROR] [reconcile] failed to update marketplace 'autonomous-sdlc-harness': Cannot add marketplace "autonomous-sdlc-harness": its network source differs from the one declared for it in settings (kind, target, or a fetch-shaping field such as headers / ref / path / sparsePaths); the source must match the one declared for this name in settings (or change the declaration).

The machine has the marketplace as a user-scope **directory** source (the main checkout), while the committed
`.claude/settings.json` declares a **github** source with the same name. On the runner the same pairing did **not**
cause trouble (Gate 12 round 4). Establish whether the error has any effect locally, for example on which plugin copy
a session loads or on `claude plugin update`. If it does, `docs/development.md` → `## 1. Source types and the plugin
root` says what a contributor should do about it. This is not a request to change what `init` writes for adopters.

## Evidence

- Run `36671710773`: the resume after the upgrade, which ran the workflow its branch carried (finding 1).
- Run `36671794632`: a task dropped after the upgrade. It cloned v0.4.2 and ran.
- Run `36672854611`: pinned to 0.4.1 while `main` carried 0.4.2. It cloned v0.4.1 and ran.
- The rendered workflows before and after the upgrade:
  `/Users/daniel/Work/harness-gate12-test-steps/round4-rendered-workflows/`.

## Acceptance criteria

- `### Upgrading`, the upgrade's printed report and `doctor`'s version warning all state that a run in flight keeps
  its version, and the section gives the route to move one on purpose.
- The warning has no `..`.
- The upgrade's `.bak` files are ignored by the managed `.gitignore` block.
- The upgrade's printed next steps are upgrade-specific, with an upgrade commit message.
- A job log's install step carries no detached-HEAD advice.
- Finding 6 is answered in the plan, with evidence either way.

## Out of scope

- Workflows rendered before the pinned install, for the reason above.
- Re-running Gate 12.
