### 1. *The decision rule* calls the owed re-take "the control run AP2 lacked", but the per-run profile still names the clone's trio in `Edit` deny rules

**File:** `docs/sandbox-verification.md` (§5, **The decision rule.**): "The re-take owed on `fix_linux_sandbox_sibling_glob_trio`'s head is the control run AP2 lacked"

**Problem.** This branch added two sentences to *The decision rule*:

> The re-take owed on `fix_linux_sandbox_sibling_glob_trio`'s head is the control run AP2 lacked: no `denyWrite` entry of that per-run profile names the clone's trio. If `config.worktree` still appears there, its source is not the profile, and AP2's row says so; …

The rule's first sentence, unchanged, also allows only two sources: "the base profile's sibling-glob `denyWrite` entry for that path, or Claude Code's own."

That is not a control. After this branch, the per-run profile still names all three of the clone's trio paths, in `permissions.deny`:

- **Exact `Edit` rules for the run copy itself.** `cli/templates/scripts/autonomous-watcher.sh` → `run_profile_render` appends `rules` for **every** `run_profile_entries` line, the `omit` rows included: `.permissions.deny |= add_absent([$e[] | rules[]])`. Only the `denyWrite` append filters on `select(.action != "omit")`. So the clone's `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` each get `Edit(/<clone>/…)` and `Edit(/<clone>/…/**)`. `cli/src/generators/writeProtection.ts` → `CopyGitPath.bubblewrapDenyWrite` states it: "its `Edit` rules stay".
- **The base's glob `Edit` rules.** The story index states it: "Every `Edit` rule stays: the base's glob `Edit` rules are not touched". `run_profile_glob_drops` removes strings only from `.sandbox.filesystem.denyWrite`.

This repository has already measured that an `Edit` deny rule alone acts on sandboxed commands. The record is `docs/sandbox-verification.md` §2, *The per-run clone (2026-10-19)*:

- CL2 removed only the `denyWrite` entry for `<work_root>/autonomous-sdlc-harness-*/.git`, and the clone's `.git` stayed closed.
- CL4 also removed the `Edit` pair, and the `.git` opened.
- *What the rows settle* concludes: "An `Edit(…)` permission deny rule alone closes that path to sandboxed commands, not only to the file tools."

So Claude Code applies `Edit` deny rules to the sandbox's write restrictions. On a bubblewrap host, an exact `Edit` deny for an absent path is a third candidate source of the trio's placeholders. The AP1–AP3 failure on 2026-10-30 fits that source as well as it fits the glob `denyWrite` entry, because both were present in that profile. AP2's own verdict already says the evidence did not separate the sources: "Claude Code's own is not ruled out by a control run … no run without the glob entries was taken".

**Why it matters.** The re-take is owed before merge, and the maintainer grades it by this rule. If AP1 or AP2 still fails on this branch's head, the rule as written forces one of two conclusions: the source is "Claude Code's own", or, for `config.worktree`, "its source is not the profile". Both are false while the profile carries the trio's `Edit` deny rules. The next fix would then go upstream or to the wrong mechanism, while the one profile change that might clear it, the trio's `Edit` rules, stays untested. The upstream report's third ask states the real control correctly: "A control run whose profile names that path by **no entry** is owed on our side". The re-take does not meet it.

**Fix.** Edit only `docs/sandbox-verification.md` → §5 → **The decision rule.**:

1. Replace "the base profile's sibling-glob `denyWrite` entry for that path, or Claude Code's own." with "the base profile's sibling-glob `denyWrite` entry for that path, the run copy's exact or the base's glob `Edit` deny rules for it (§2 CL2–CL4: an `Edit` deny rule alone closes a path to sandboxed commands, measured on macOS), or Claude Code's own."
2. Replace the sentence "The re-take owed on `fix_linux_sandbox_sibling_glob_trio`'s head is the control run AP2 lacked: no `denyWrite` entry of that per-run profile names the clone's trio." with "The re-take owed on `fix_linux_sandbox_sibling_glob_trio`'s head is a control for the sibling-glob `denyWrite` entries only: no `denyWrite` entry of that per-run profile names the clone's trio, but its `permissions.deny` still carries the trio's exact `Edit` rules for the run copy (`autonomous-watcher.sh` → `run_profile_render`) and the base's glob `Edit` rules for them."
3. Replace "If `config.worktree` still appears there, its source is not the profile, and AP2's row says so;" with "If any of the trio still appears there, the sibling-glob `denyWrite` entry is ruled out as its source, and AP2's row records that its `Edit` deny rules and Claude Code's own are not separated, since no run whose profile names the path by no entry has been taken;"
4. Leave the rest of the paragraph as it is, the clause beginning "that verdict is a proposal to the maintainer too" included. Leave AP2's row unchanged: it is a dated record.

No test covers this paragraph. Run no suite.
