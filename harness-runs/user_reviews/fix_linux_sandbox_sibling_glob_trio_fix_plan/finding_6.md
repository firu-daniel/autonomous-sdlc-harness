### 6. Record both 2026-10-30 sessions, the re-take and the control, and bring every record that depends on them into line

**File:** `docs/sandbox-verification.md` → §5, the paragraph opening "**The route's re-take (owed).**", its AP1–AP6 table, "**The decision rule.**", and the F9 row's follow-up cell ("| F9 |"); §0 → "**Why `config.worktree` differed: unknown.**"; and `## 6. The unresolved points, settled or not`
**Also:** `docs/sandbox-placeholder-upstream-report.md` → `### Environment`, `### A glob entry does the same` and `### Asks`; `docs/development.md` → "**The absent-path check, by hand.**"

**What is missing.** This was checked against the current tree. The AP1–AP5 table holds the readings from before this branch (stamp `main head: 1a41540c…`). AP6 is `not run — owed`. *The decision rule* still lists the `Edit` deny rules as a candidate source of placeholders. Nothing records the user's two sessions of 2026-10-30 on this branch's head. The source of every reading below is the user's review, quoted in the fix-plan index's `## Source observations`.

**Rules for every edit:**
- Write in the record's own style.
- Use `<main>`, `<clone>` and `<sibling>` placeholders and **no machine path**. Do not copy `/home/probe/…`: the self-containment gate binds every commit.
- **No measured result is invented.** A Linux claim the two sessions did not measure is labelled *derived* or *owed*.
- Commit this as a research record (prefix `research`), or with the prefix the severity mapping names.

1. **§5, *The route's re-take (owed)*.**
   - **Keep the 2026-10-30 AP1–AP5 record of the route before this branch exactly as it stands**: its stamp, table and closing paragraph.
   - **Add the branch's re-take (session 1)** as a new dated block below it, with its own stamp. The stamp lines are verbatim from the report, ellipses included:
     ```
     date: 2026-10-30T16:13:56+00:00
     main head: b15f8de0ce66dd7833e07eee4857cfbc5110f143
     git: git version 2.39.5
     claude: 2.1.314 (Claude Code)
     bwrap: bubblewrap 0.8.0
     uname: Linux … 6.8.0-117-generic #117-Ubuntu SMP PREEMPT_DYNAMIC … aarch64 GNU/Linux
     apparmor_restrict_unprivileged_userns: 0
     ```
     - Record the container: Docker `node:22-bookworm` on colima, an Ubuntu 24.04 VM, aarch64, kernel 6.8.0-117, `kernel.apparmor_restrict_unprivileged_userns` 0.
     - Record the checkout departure and why. The container's main checkout was cloned from this branch, and a local `dev` was pointed at it (`git checkout -B dev`) so that preflight refusal 3 passed. The `main head` stamp is therefore this branch's head `b15f8de0`. The probe clone was still cut from `origin/dev`, as `create-worktree.sh` always does.
     - Record the sibling: `git clone --shared . ../<sibling>`, made before the probe started.
     - Record the procedure: `run`, `sweep`, `report`, `after-teardown`, `report`.
     - Record the profile: no `denyWrite` entry names the clone's three trio paths, exact or glob, and the sibling's three are named exactly. `permissions.deny` holds 18 trio `Edit` rules: the clone's exact paths, the `<work_root>/<project>-*/.git/…` globs and the sibling's exact paths, each in the `<p>` and `<p>/**` forms.
   - **The session-1 table.** Fill AP1–AP6 with the user's readings and verdicts, quoting the observed text:

     | Row | Verdict | Reading |
     |---|---|---|
     | AP1 | `fail` | Sandboxed `git status` in the clone exits 128 in A and B: `fatal: failed to read <clone>/.git/commondir: Permission denied`. In the main checkout it exits 0 and lists `?? .mcp.json ?? harness-runs/.mcp.json`. The excluded call exits 0 in the clone. |
     | AP2 | `fail` | Inside A and B, `commondir` and `http-alternates` read `character special file, 0 B, crw-rw-rw-, nobody; mount: /null (tmpfs, ro,nosuid,nodev)`. Outside, they are absent after A, B and C, and after D they are `regular empty file, 0 B, -r--r--r--, probe`, mtime 16:15:03.203. `config.worktree` is a real `regular empty file, 0 B, -rw-r--r--, probe`, mtime 16:13:57.196, present from after-A on, and mounted `overlay, ro,nosuid,nodev,relatime` over itself inside. |
     | AP3 | `fail` | The sweep exits 0 and removed the seven manifest paths, named. `hr_wrapper_main_of` exits 0. `hr_run_copy_check_var` exits 1: `'<clone>' is a clone, but <clone>/.git/commondir exists, and a clone the harness made has none`. `git status (clone)` exits 128 and `git status (sibling)` exits 0. The `commondir` and `http-alternates` leftovers were in no manifest. |
     | AP4 | `pass` | `<main>/harness-runs/.mcp.json` was left after D and removed by the sweep. |
     | AP5 | `pass` | All seven other absent entries read as the `/null` placeholder in A and B, sandboxed. |
     | AP6 | `differs from its expectation` | No placeholder at any of the sibling's paths: neither at its absent trio, despite the exact `denyWrite` entries, nor at its `.mcp.json` and `.claude/settings.local.json`. Each read `absent` inside A and B and outside after every phase, the sweep and the teardown included. `git status (sibling)` exits 0 throughout. |

     For AP6, add the derivation, marked *derived*: the sibling sits outside every write root (the cwd and `allowWrite`, which holds `<main>/harness-runs` only), so on Linux a deny entry outside every write root gets no placeholder, because the path is read-only in the sandbox anyway.
2. **New row: the control (AP7, or the record's own next name).**
   - Stamp: the same lines, with `date: 2026-10-30T16:29:59+00:00` and `profile: <the copy>`.
   - Probe clone: `chore_sbx_probe_20261030162536`.
   - Profile change: a copy of that session's per-run profile with every `permissions.deny` entry matching `\.git/(commondir|config\.worktree|objects/info/http-alternates)` removed, 18 entries. Nothing else changed, and the sibling's three exact `denyWrite` entries stayed.
   - How it was run: `SBX_ABSENT_OUT=<out> P=<copy> bash scripts/sandbox-absent-path-check.sh run`, then `report`, with no `sweep`.
   - Readings:
     - the clone's `commondir` and `http-alternates` were absent in every reading, after D's kill included;
     - sandboxed `git status` in the clone exits 0 in A and B, and 0 outside after every phase;
     - `config.worktree` again appeared at A's start as a real `-rw-r--r--` empty file (mtime 16:30:00.698), mounted read-only over itself;
     - the other entries read as before;
     - the 21 built-in paths appear, listed verbatim, together with the truncated post-kill reading and the note that the rest is unmeasured.
   - Conclusions, **measured**:
     - On Linux, Claude Code also enforces `Edit(...)` deny rules in the bubblewrap sandbox. An `Edit` rule naming an absent path inside a write root mounts the same `/null` placeholder a `denyWrite` entry does, globs included.
     - `config.worktree` is created at session start whether or not any rule names it.
3. **What is owed after this round.** Say it in the lead paragraph and in a closing line. AP1–AP7 plus the `dd` row (Finding 1, taken by Finding 5's script) are re-taken by hand, on the head this round produces, before merge. Rewrite the expectations of the owed rows where the route changed:
   - **AP1:** exits 0 in A and B.
   - **AP2:** `commondir` and `http-alternates` are absent inside and outside throughout. `config.worktree` may be present only as an empty regular file, accepted by the trust check.
   - **AP3:** `hr_run_copy_check_var` exits 0 after `sweep`, and `git status (clone)` exits 0.
   - **AP6:** no placeholder outside the write roots; absent outside throughout; `git status (sibling)` exits 0.
   - **The `dd` row:** a verdict of *written* or *refused*. Both are possible, so the row's expectation names the two outcomes and what each means for Finding 1's claim that dropping the rules costs nothing.
   - **The built-in paths:** read in every phase, untruncated.
4. **Updates elsewhere in the file.**
   - **The decision rule.** The `Edit` rules are now **measured** as a source of placeholders on Linux (the control), no longer a candidate. Remove the sentence calling the re-take "a control for the sibling-glob `denyWrite` entries only".
   - **§5 F9's follow-up cell.** Add this round's change: on a bubblewrap host the per-run copy also leaves out the run copy's trio `Edit` rules, exact and glob, keeps them at each other sibling by exact path, and the trust check accepts an empty regular `config.worktree` (with `extensions.worktreeConfig` off) and `http-alternates`.
   - **§0 *Why `config.worktree` differed: unknown*.** Add one sentence: the control shows it appears with no rule naming it (2026-10-30, 16:29:59 session). Replace the paragraph's last sentence, which calls the owed re-take the control, accordingly.
   - **§6.** Add a point on the built-in leftovers: measured as listed in the control, accepted rather than swept, and why. Cite `docs/cli.md` §6 residual 12, which Finding 4 writes.
5. **`docs/sandbox-placeholder-upstream-report.md`.** Add two observations, each with versions (Claude Code 2.1.314, bubblewrap 0.8.0, 2026-10-30), in the report's own style:
   - `Edit(...)` deny rules are enforced in the sandbox and mount a placeholder at an absent path inside a write root, globs included (the control);
   - Claude Code's built-in protected paths get placeholders in the cwd, and a killed session leaves some of them on disk.

   Update `### Environment` if it lists versions, and add to `### Asks` only what follows from these two observations. Keep the `config.worktree` ask open, and add that it appears with no rule naming it.
6. **`docs/development.md` → *The absent-path check, by hand*.** Write the procedure used:
   - Clone the checkout from the branch, then point a local `dev` at it (`git checkout -B dev`) so preflight refusal 3 passes, and say why.
   - Make the sibling with `git clone --shared` before the probe.
   - Run `run`, `sweep`, `report`, `after-teardown`, `report`.
   - Run the `dd` row (Finding 5's subcommand).
   - Run the control (Finding 5's `control-profile`, then `run` and `report` with `SBX_ABSENT_OUT=` and `P=`).
   - `docker cp` the output directories to the host **before** leaving the container.
   - Use subcommand names that match what Finding 5 ships.
7. **The generated `_README` and `doctor`'s note** are Finding 1's (`cli/src/generators/writeProtection.ts`, `cli/src/doctor/checks.ts`). Do not edit them here.

This finding depends on Findings 1–5 having landed, because it records their names and the owed rows' expectations.
