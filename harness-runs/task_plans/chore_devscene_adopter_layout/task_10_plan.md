### Task 10 — Rename in the plugin's guards, shared library, QA helpers and hooks README

**Goal:** Make every shell asset in `plugin/` read `<root>/devscene.config.json`, default an absent `stateDir` to `devscene` and an absent `scriptsDir` to `devscene-scripts`, and say so in its headers, REPRO blocks, refusal messages and README.

**Depends on:** Task 1, which makes `devscene.config.json`, `devscene/` and `devscene-scripts` the names and defaults `init` writes. Jurisdiction is still "a repository with a config file at its resolved root". Only the file's name changes. No guard reads the old name as a fallback (`## Context`, first paragraph).

**Where this task stops.**
- The prose plugin assets are Tasks 11–14.
- The suites that run these scripts against fixtures (`qa-user-locks`, `path-anchored-arms`, `main-root-fallback`) are Task 26's.
- `docs/guard-verification.md` is Task 31's. The default-`scriptsDir` change moves a recorded decision: `#### The single-guard configuration gates`' schema-default row (*"`scriptsDir` absent | the same script under the schema default, `<repo>/scripts/typecheck.sh` | **allow**"*) is silent against this task's guard, because `<repo>/scripts/` is no longer the absent-key default. Task 31 re-drives that row and its two neighbours against the guard as this task leaves it and records the re-measurement (`.claude/context/plugin.md` → `## Guards, the shared library and the helper scripts`). This task edits no document of record.
- The plugin running this branch's own session is the installed one. These edits take effect only once the maintainer refreshes the plugin after merge (`## Context` → **Manual setup required**).

### Targets

- `plugin/hooks/lib/harness-config-lib.sh` (file name kept)
- `plugin/hooks/autonomous-script-allowlist-guard.sh`, `plugin/hooks/autonomous-protected-branch-guard.sh`
- `plugin/hooks/allow-qa-credentials-read.sh`, `plugin/hooks/allow-safe-compounds.sh`, `plugin/hooks/git-commit-branch-guard.sh`, `plugin/hooks/git-rewrite-branch-guard.sh`, `plugin/hooks/git-trust-file-guard.sh`
- `plugin/scripts/reserve-qa-user.sh`, `plugin/scripts/release-qa-user.sh`
- `plugin/hooks/README.md`

**Work:**

- [ ] `lib/harness-config-lib.sh`: apply row 1 of `## Context`'s spelling table to the config read (`f="$root/devscene.config.json"`), the `JURISDICTION` header and every other comment, the REPRO lines included (`printf 'x' > "$root/devscene.config.json"`, `mv "$root/devscene.config.json" …`). Change both `hc_config_dir … stateDir sdlc-harness) || state_rel="sdlc-harness"` defaults to `devscene` (row 2).
- [ ] `autonomous-script-allowlist-guard.sh`: `scripts_rel=$(hc_config_dir "$top" scriptsDir devscene-scripts) || exit 0` (row 14), and apply row 1 to its comments. `autonomous-protected-branch-guard.sh`: apply row 1 to both `deny "Blocked: the protected-branch configuration at $root/devscene.config.json …"` messages and its comments.
- [ ] The other five guards: apply row 1 to every comment and REPRO line. `git-trust-file-guard.sh`'s *"This guard reads no `devscene.config.json`"* included.
- [ ] `reserve-qa-user.sh`, `release-qa-user.sh`: apply row 1, and change each `stateDir sdlc-harness) || state_rel="sdlc-harness"` default and its comment to `devscene`.
- [ ] `hooks/README.md`: apply rows 1 and 2, the jurisdiction paragraph, the fail-closed table header and the `## Reproducing a decision by hand` fixture sentence included.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|scriptsDir scripts\)' -- plugin/hooks plugin/scripts` prints nothing.
- `bash -n` on each changed `.sh` file exits 0.
- Reproduce one decision by hand per `plugin/hooks/README.md` → `## Reproducing a decision by hand`, against a throwaway `git init` fixture under the system temp directory carrying a `devscene.config.json` with `defaultBranch` `trunk`. `git-commit-branch-guard.sh` judging a `git commit` on `trunk` asks. The same fixture with the file renamed away is silent.
  - **Deviations from plan:** The per-file `bash -n` calls and the by-hand guard run (`bash plugin/hooks/git-commit-branch-guard.sh < /dev/null`) were each refused by the session's permission layer ("Permission to use Bash has been denied because Claude Code is running in don't ask mode"). The `bash -n` claim rests instead on `bash scripts/typecheck.sh`, whose `scripts/check-shell-parse.sh` runs `bash -n` over every shell script git lists (output: "124 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed", then "PASS: typecheck"). The `trunk` fixture reproduction was not run; the claim that the guard asks on `trunk` and is silent with the file renamed away rests on reading the diff: the only behavioural change in `plugin/hooks/lib/harness-config-lib.sh` is `f="$root/devscene.config.json"` in the config read, and every other hunk in the eleven files is a comment, a refusal/`echo` string, or a default literal (`stateDir devscene`, `scriptsDir devscene-scripts`). The `git grep` verification bullet was run and printed nothing.
  - **Deviations from plan:** Beyond the three bullets' literal substitutions, row 14 was also applied to the two `autonomous-script-allowlist-guard.sh` header comments that named the old absent-key default as `` `scripts` `` (the "THE DEFAULT APPLIES ONLY TO A READABLE CONFIGURATION" paragraph and the "NEVER the … default" decision row), and three decision-table rows whose `->` column the one-character-longer file name had shifted were realigned.
