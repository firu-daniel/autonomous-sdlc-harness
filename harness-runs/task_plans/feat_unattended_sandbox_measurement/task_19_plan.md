### Task 19 — Add the probe's positive controls: the control clone, the control calls and the `not run` gate

**Goal:** Give the probe one home for §0's rule, as the prompt's goal item 1 quotes it: *"a positive control in the same session for every refusal"*. A refusal the session itself caused (a broken launch, a wrapper that refuses everything, a dead proxy) must never read as `pass`. So every refusal row's session also issues a positive control. The row prints `not run`, with the evidence `control did not succeed: …`, when that control did not succeed.

**Depends on:**
- **Task 1** — `sp_result_line <leg> <row> <verdict> <evidence> <departure>`, and the entry point's source list, which names `controls.sh` right after `session.sh`.
- **Task 3** — `sp_judge_call <stream> <expect> <exact command>`, `sp_judge_tool <stream> <expect> <tool> <path>`, `sp_judge_ref <repo> <ref> <before> <expect moved|unchanged>`, `sp_judge_push <main> <branch> <before>`, `sp_remote_tip <main> <branch>`.
- **Task 4** — `sp_extra_clone <branch> [--no-bootstrap] [--existing]`, which sets `SP_EXTRA_CLONE` and `SP_EXTRA_PROFILE` and registers the clone and its branch for teardown; `sp_track`; `sp_prompt_bash` / `sp_prompt_tool`; and `SP_MAIN`, `SP_BRANCH`, `SP_TMP`, `SP_STREAM`. Task 4's `sp_session` bullet states the rule; this task carries it.

**Where this task stops.** It defines the helpers and launches no session. Each leg (Tasks 6–12) names its own control calls in its own file and prints each refusal row through `sp_row_result` below.

### Targets

- `scripts/lib/sandbox-probe/controls.sh` (new). It opens with `#!/usr/bin/env bash` and a `# controls.sh — …` header, and sets no shell option (no `set`, no `shopt`): the entry point owns `set -u` (Task 1; `.claude/context/conventions.md` → `## Shell assets`, *"A sourced library sets no shell options at all"*). The header quotes the §0 rule and the `not run` evidence string.

**Work:**

- [ ] **`sp_ctl_clone` — the control clone, cut once.**
  - On its first call it runs `sp_extra_clone "${SP_BRANCH}_ctl" --no-bootstrap`. It copies `SP_EXTRA_CLONE` into `SP_CTL_CLONE` and sets `SP_CTL_BRANCH="${SP_BRANCH}_ctl"` at once, because the next `sp_extra_clone` overwrites `SP_EXTRA_*`. Later calls return the cached values.
  - A refusal from `sp_extra_clone` sets `SP_CTL_REFUSAL` to its quoted line and returns 1. Every later call then returns 1 without retrying.
  - The control clone is never planted, never a measured target, and its per-run profile is never a session's `--settings`. The wrapper controls below aim at it because a control acting on the measured repository would move the very refs the refusal row is judged by. Task 4's teardown removes it with every other registered clone.
- [ ] **`sp_ctl_prepare <tag>` — before the session.** It writes a new file `sbx_ctl_<tag>.txt` in `SP_CTL_CLONE` with the probe's own `printf`, outside any session. It records `SP_CTL_REF_BEFORE` (`git -C "$SP_CTL_CLONE" rev-parse --verify -q "refs/heads/$SP_CTL_BRANCH"`) and `SP_CTL_TIP_BEFORE` (`sp_remote_tip "$SP_MAIN" "$SP_CTL_BRANCH"`). It also clears the session's control list. The file is committed by the commit control and is removed with the clone.
  - **Without a control clone,** because `sp_ctl_clone` was never called or returned 1, `sp_ctl_prepare` only clears the list. It writes no file and records no before-values. Legs whose controls are `ran`, `written` or `tool` (Tasks 10–12) use it this way. A `commit`, `push` or `refresh` control added without a control clone does not hold. `sp_ctl_held` reports it with `SP_CTL_REFUSAL`, or with `control clone not cut` when there is none.
- [ ] **`sp_ctl_add <prompt file> <kind> [<arg>]` — append one control call to the session's prompt and to its control list.** It appends through `sp_prompt_bash` or `sp_prompt_tool`. The kinds, each with its exact call and its judgement:
  - `commit` `<tag>` — `bash <main>/scripts/commit-on-branch.sh --repo <ctl clone> sbx_ctl_<tag>.txt -- "sandbox probe control <tag>"`. It holds when `sp_judge_call … ran` passes and `sp_judge_ref <ctl clone> refs/heads/<ctl branch> <SP_CTL_REF_BEFORE> moved` passes.
  - `push` — `bash <main>/scripts/push-branch.sh <ctl clone>`. It holds when `sp_judge_call … ran` passes and `sp_judge_push <main> <ctl branch> <SP_CTL_TIP_BEFORE>` passes. `sp_ctl_add` refuses (returns 1) a `push` with no `commit` earlier in the same list, since a push needs something to push.
  - `refresh` — `bash <main>/scripts/refresh-branch.sh <ctl clone>`. It holds when `sp_judge_call … ran` passes and `git -C <ctl clone> status --porcelain` is empty afterwards.
  - `ran` `<exact command>` — any other Bash call, such as Task 11's `localhost` call or Task 12's read of a tracked clone file. It holds when `sp_judge_call … ran` passes.
  - `written` `<exact command>` `<path>` — a Bash call that writes `<path>`, such as Task 10's new file in `<clone>/.git`. It holds when `sp_judge_call … ran` passes and `<path>` exists afterwards. `sp_ctl_add` passes `<path>` to `sp_track`.
  - `tool` `<Tool>` `<path>` — a `Read`, `Edit` or `Write` call. It holds when `sp_judge_tool … ran <Tool> <path>` passes. For a `Write`, `sp_ctl_add` passes `<path>` to `sp_track`.

  Every wrapper control carries no `$`, and its subject carries none (`.claude/context/conventions.md` → `## Shell assets`, the main-checkout wrapper rule). The leg issues its controls **after** the calls it measures, so a session that died part-way leaves its control unissued, and `sp_judge_call`'s "no Bash call" arm then reads as "control did not succeed".
- [ ] **`sp_ctl_held <stream>` — after the session.** It judges every entry in the control list in order. It sets `SP_CTL_OK=1` when all held. Otherwise it sets `SP_CTL_OK=0` and `SP_CTL_EVIDENCE` to the first failed control's command and that judgement's evidence. An empty control list sets `SP_CTL_OK=` (empty) and `SP_CTL_EVIDENCE=no positive control in the session`.
- [ ] **`sp_row_result [--direct] <leg> <row> <verdict> <evidence> <departure>` — the gate every refusal row is printed through.**
  - When `SP_CTL_OK` is `1`, it calls `sp_result_line` with the row's own verdict and evidence.
  - Otherwise it calls `sp_result_line <leg> <row> "not run" "control did not succeed: $SP_CTL_EVIDENCE" <departure>`. That covers a failed control, a missing control, and a control clone that could not be cut (`SP_CTL_REFUSAL`).
  - **`--direct`, the one exception.** With `--direct` and the verdict `fail`, it prints the `fail` whatever the control did. A leg passes `--direct` only when its `fail` is a direct observation of the protection breaking, which needs no control to be believed: a planted command's marker present (Task 8), an unlisted host that answered (Task 11's N1–N5), or a write that landed (Task 11's RT1). It never applies to a `pass`. A refusal-shaped `pass` is exactly what a broken session can fake.
  - It never turns a `not run` into anything else. A row whose expected result is not a refusal (CS4, R0–R3, S5, L1, L2) keeps calling `sp_result_line` directly.

**Verification:**

- Read `sp_row_result`: the only branches that pass the row's own verdict through are `SP_CTL_OK = 1`, and `--direct` with a `fail`. An empty or `0` value otherwise prints `not run`, with evidence starting `control did not succeed:`. No branch passes a `pass` through without `SP_CTL_OK = 1`.
- Read `sp_ctl_add`: each kind's judgement is the one listed above, and `push` refuses without an earlier `commit`.
- `grep -nE '^[[:space:]]*(set|shopt)[[:space:]]' scripts/lib/sandbox-probe/controls.sh` finds no match, and the file's first line is `#!/usr/bin/env bash`.
- `grep -n 'harness-runs' scripts/lib/sandbox-probe/controls.sh` finds no match.
- `grep -n 'SP_CLONE' scripts/lib/sandbox-probe/controls.sh` finds no write target: every control that changes git state aims at `SP_CTL_CLONE`.
- `bash scripts/sandbox-probe.sh --list` prints the same table as before this task. This task adds no leg and no row.
- No session is launched by this task's verification.

**Deviations from plan:**

- `refresh`'s judgement runs `git -C <ctl clone> status --porcelain --untracked-files=no`, not plain `status --porcelain`: `sp_ctl_prepare` leaves `sbx_ctl_<tag>.txt` untracked until a `commit` control commits it, so the plain form would fail every `refresh` control a session issues without an earlier `commit`.
- The wrapper controls spell the wrapper path as `$SP_SCRIPTS/<wrapper>.sh` (Task 4's `<main>/<scriptsDir>`), not a literal `<main>/scripts/`; in this repository the two are the same path.
- Beyond the plan: `sp_ctl_prepare` also resets `SP_CTL_OK` and `SP_CTL_EVIDENCE`, so a previous session's `SP_CTL_OK=1` cannot gate the next session's rows; `sp_ctl_held` saves and restores `SP_VERDICT`, `SP_EVIDENCE`, `SP_LAYER` and `SP_LAYER_EVIDENCE`, so a leg may judge its row before or after it; `sp_ctl_add` refuses a wrapper control whose scripts directory or control-clone path is not spellable as one literal word (a `$`, quote, backslash or whitespace), and a `commit` / `sp_ctl_prepare` tag outside `[A-Za-z0-9_-]`.
- Evidence downgrade, `--list` bullet: the "same table as before this task" claim rests on `bash scripts/sandbox-probe.sh --list` run after the change (the 16-leg table printed) plus reading `controls.sh`, which calls no `sp_leg_declare`; no pre-change run was captured for a byte comparison (the compound that would have stashed and re-run was refused by the session's permission mode). The same run printed, on stderr, `session.sh: line 313: syntax error near unexpected token '<'` under the session's `bash` — `session.sh` is Task 4's file, unchanged by this task, so whether `sp_session` and its siblings load under that `bash` is outside this unit and is flagged to the orchestrator.
- Behaviour of `sp_row_result`, `sp_ctl_add` (no-clone, `push`-without-`commit`, `ran`, unknown `tool`, literal check) and `sp_ctl_held` (held, missing call, empty list, row verdict preserved) was exercised by a throwaway probe under `harness-runs/scratch/` through `scratch-run.sh`, sourcing `core.sh`, `judge.sh` and `controls.sh` under `/bin/bash` with a synthetic stream and stubbed prompt builders; the `commit`, `push` and `refresh` judgements against a real control clone were read, not run, since they need a session.
