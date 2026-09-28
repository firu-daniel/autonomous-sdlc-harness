`fix_remote_job_permission_profile` closes the defects the first hand-run of Gate 12 (`docs/development.md` →
`## 5. Verifying a change` → **Gate 12 — remote execution against a real GitHub repository**) found in 0.4.0's
remote execution. Every remote run on a GitHub-hosted runner parks within a minute of starting, because the session
cannot read the plugin's instruction files, and nothing in `init`, `doctor` or the job's preflight notices before it
launches. The fix ships as 0.4.1, after which Gate 12 is re-run from the start.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** The fixes below are
> **candidate approaches, not instructions** — verify each against the real code and the real contracts before
> planning it, and say so in the plan if a better one exists or if one of them is wrong.

---

## The gate run this comes from

Scratch repository `firu-daniel/harness-gate12` (private, a small TypeScript library, `phases.qa`, `docs` and
`parity` all off, `execution.target: github-actions`), adopted with `npx autonomous-sdlc-harness@0.4.0 init`,
2026-09-28. One task dropped as `feat_invoices_task_prompt.md`. The evidence lives outside this repository, so what
matters is quoted here.

**Run 1 (`36425634480`) — the committed profile.** `init` had written and the adoption commit had carried
`.claude/settings.autonomous.json`, with this Mac's absolute paths (`//Users/daniel/Work/harness-gate12/**` and its
`-*` siblings). In the job, the `Generate the job's permission profile` step ran `init --plugin-root-entries`, which
reported `Summary: 65 kept, 35 ensured` — the profile was kept, not generated. `Preflight with doctor` then printed:

    WARN  profile-paths  neither a path nor a pattern in .claude/settings.autonomous.json covers this repository root (/home/runner/work/harness-gate12/harness-gate12) …
    PASS  plugin-permissions  not graded at this machine's plugin root (/home/runner/.claude/plugins/cache/autonomous-sdlc-harness/autonomous-sdlc-harness/0.4.0), because phases.qa is off, and the helper scripts are that phase's alone.
    Summary: 31 pass, 7 warn, 0 fail — exit 0

The harness step launched and the session parked 54 s in. Its question: *"How should this run get read access to the
harness plugin's instruction canon?"* — every `Read` of
`/home/runner/.claude/plugins/cache/autonomous-sdlc-harness/autonomous-sdlc-harness/0.4.0/instructions/*.md` asked for
permission, and `cat`/`ls` were refused as outside "the allowed working directory
`/home/runner/work/harness-gate12/harness-gate12`".

**Run 2 (`36426447207`) — the profile untracked.** The profile was removed from the index and gitignored in the
scratch repository. The job's `init` now reported `+ created .claude/settings.autonomous.json`, doctor gave
`PASS profile-paths`, and the session parked again after 52 s with the same refusals. The generated profile named
the runner checkout correctly but carried **no plugin-root entry at all**; its `additionalDirectories` held only
`<root>/sdlc-harness`, while its `_comment` still claimed the plugin-root entries had been written by
`init --plugin-root-entries`.

**Run 3 (`36428382006`) — the grant in committed `settings.json`.** `Read(//home/runner/.claude/plugins/cache/autonomous-sdlc-harness/**)`
was added to `permissions.allow`, and `/home/runner/.claude/plugins/cache/autonomous-sdlc-harness` to
`permissions.additionalDirectories`, of the committed `.claude/settings.json`. The session confirmed both entries
were in the file at HEAD, and was refused the `Read` and a `head` of the plugin cache exactly as before. It re-parked
after 56 s and the park-loop guard stopped the run.

## What is wrong

1. **The job gets no grant over the plugin root.** On the runner the marketplace is a GitHub source, so the plugin's
   runtime root and its install root are the same directory
   (`~/.claude/plugins/cache/autonomous-sdlc-harness/autonomous-sdlc-harness/<version>`). `pluginRootEntries` in
   `cli/src/generators/permissionProfile.ts` omits the `Read` rule at the install root, on the stated premise that
   reads there "were measured to succeed ungranted" (the 2026-08-26 measurement cited from `doctor/checks.ts` →
   `PLUGIN_PERMISSIONS_CHECK`). With `phases.qa` off there are no helper entries either, so
   `generatedPluginRootEntries` returns an empty list and the profile grants nothing on the plugin root. The premise
   is false on the runner: both `Read` and shell reads were refused. Shell reads also need the root in
   `permissions.additionalDirectories` (or an `--add-dir` at launch), which nothing writes. On this development
   machine the gap is hidden, because a `directory` marketplace makes the runtime root this checkout's `plugin/`,
   which is not the install root and does get its `Read` rule.
2. **`init` commits the permission profile, while the remote design assumes it is not committed.**
   `docs/remote-execution.md` → `## 4.` → **The permission profile** says the profile "is gitignored and carries one
   checkout's absolute paths, so the job has none until it makes one". `init`'s generated ignore block has no rule
   for it, and its own note says it "is committed, and it is machine-specific". A committed profile is then kept by
   the job's create-if-absent `init`, so the job runs with another machine's paths. The note also still says
   "is committed" in a repository where the file is gitignored.
3. **The job's preflight lets a run launch with a profile that cannot work.** `profile-paths` is a WARN, so doctor
   exits 0 while the profile covers no path on the runner, and the job spends a session to discover what doctor
   already knew.
4. **`doctor`'s `plugin-permissions` check cannot see finding 1.** It shares the builder with the generator, so an
   entry the generator wrongly omits is an entry the check never asks for; on the runner it printed
   `PASS … not graded … because phases.qa is off`, though the `Read` entry is outside the QA gate by the check's own
   description on this machine ("instruction files and samples are read by every run"). Gate 12 observation (ii)
   requires `PASS plugin-permissions`, which that reply can never satisfy.
5. **The committed `settings.json` does not reach the job's session.** `docs/remote-execution.md` → `## 7.` →
   **Your own allow entries** says an entry moved into the committed `.claude/settings.json` "applies on every
   machine and in every job". Run 3 shows neither `permissions.allow` nor `permissions.additionalDirectories` from
   that file took effect for a path outside the checkout under the watcher's
   `"$AGENT_CLI" -p … --settings "$SETTINGS_PROFILE" … --add-dir "$worktree" --add-dir "$main_state"` launch.
   Establish which part of that is true and correct the section, or make it true.
6. **The documented setup push is refused.** Gate 12 → *Setup* and `docs/remote-execution.md` → `## 7.` step 3 say
   `git push origin <default branch>`, but `init` wires `githooks/pre-push` (through `core.hooksPath`) to refuse any
   push to the default branch. Neither names the route that works (`--no-verify`, or whatever the plan judges right).
7. **The `workflow` token scope is not mentioned.** Pushing `.github/workflows/*.yml` over HTTPS with a `gh` OAuth
   token needs the `workflow` scope; a token with `repo` alone is refused. Neither §7 nor Gate 12 says so.
8. **This repository cannot host its own remote runs**, and nothing says so outside Gate 12's "never this
   repository": the job's `init` meets the self-adoption refusal, and `main` — GitHub's default branch, from which
   the poller and `warm` run — has the adoption removed by `scripts/publish-main.sh`. A short statement of the
   limitation where a contributor would look for it is enough.

## Candidate approaches

- **Finding 1:** always emit the `Read` rule for a root that is both runtime and install root, or drop the
  install-root exemption for the job (`--plugin-root-entries`) path; add the root to `additionalDirectories`, or have
  job mode pass `--add-dir <plugin root>` to the launch. Re-examine what the 2026-08-26 measurement actually measured
  and on which marketplace source, and record the correction where that measurement is cited.
- **Finding 2:** have `init` ignore the profile when `execution.target` is `github-actions` (and say so in the note),
  or have the job generate its profile regardless of a committed one (to a path the watcher is told to use, since the
  job's changed-tracked-files check forbids rewriting a tracked file). Decide whether the profile should be committed
  at all for a local-only adopter, and keep `init`'s note true either way.
- **Findings 3–4:** in job mode, make a profile that covers neither the checkout nor the plugin root a FAIL, and grade
  the plugin-root `Read` entry independently of `phases.qa`.

## Acceptance criteria

- A profile generated with `--plugin-root-entries` on a machine whose runtime root equals its install root carries a
  `Read` grant and a shell-readable grant over that root, whatever `phases.qa` says; a test drives that case with a
  GitHub-source marketplace record, not only the directory-source one.
- A job whose checkout carries a committed profile, or one generated elsewhere, either regenerates a working profile
  for the runner or stops at the preflight with a FAIL naming the fix — never launches a session that parks on it.
- `doctor`'s `plugin-permissions` reports the missing plugin-root `Read` entry on the runner-shaped case with
  `phases.qa` off.
- `init`'s notes, `docs/remote-execution.md` §4 and §7, `docs/cli.md` and Gate 12's *Setup* agree with what the code
  does about the profile, the committed `settings.json`, the default-branch push and the `workflow` scope.
- Gate 12's text records that its round-1 run found these, so the re-run on 0.4.1 starts from observation (i).

## Out of scope

- The version bump to 0.4.1 and its publication.
- Re-running Gate 12, which needs a real repository, a runner and billed minutes.
