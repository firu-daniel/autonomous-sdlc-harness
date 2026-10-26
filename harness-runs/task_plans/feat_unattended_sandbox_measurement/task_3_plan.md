### Task 3 — Add the probe's judge: stream-json calls, the refusing layer, pushes by `ls-remote`, commits by ref

**Goal:** Turn one session's stream-json and git state into a verdict, with the evidence line it was judged by quoted. This follows `docs/sandbox-verification.md` → `## 0. Method`:
- one exact call per probe;
- a reading of which layer refused;
- every push judged by `ls-remote`, and every commit by the ref before and after, never by an exit status.

**Depends on:** Task 1, which dispatches `judge` to `sp_judge_cli` and defines `sp_result_line <leg> <row> <verdict> <evidence> <departure>`. Every leg task (5–12) consumes the functions this task defines; Task 11's N5 row consumes `sp_judge_allowed_domains` and defines no arm of its own. This task launches nothing and knows no leg.

### Targets

- `scripts/lib/sandbox-probe/judge.sh` (new). It opens with `#!/usr/bin/env bash` and a `# judge.sh — …` header, and sets no shell option (no `set`, no `shopt`): the entry point owns `set -u` (Task 1; `.claude/context/conventions.md` → `## Shell assets`, *"A sourced library sets no shell options at all"*).

**Work:**

- [ ] **`sp_judge_call <stream> <expect> <exact command>`** sets `SP_VERDICT`, `SP_LAYER` and `SP_EVIDENCE`. All parsing is `jq` over the JSONL, in the event shape `cli/test/fixtures/run-analytics-two-sessions.jsonl` shows.
  - **Matching.** It finds the `assistant` event's `tool_use` whose `name` is `Bash` and whose `input.command` is **byte-equal** to `<exact command>`. Then it finds the `tool_result` with that `tool_use_id`. A command with anything appended (a `; echo $?`) is a different string and does not match.
  - **No match** gives `not run`, with evidence `no Bash call "<command>" in the session`.
  - **Several matches:** judge the first and add `(issued <n> times)` to the evidence.
- [ ] **The layer table, `sp_layer_of <result text> <command> <stream>`**, in this precedence:
  1. `permission` — the text contains `Permission to use ` and `has been denied`, or the command appears in the `result` event's `permission_denials[].tool_input.command`;
  2. `file-tool` — `File is in a directory that is denied by your permission settings.`;
  3. `network` — `<sandbox_violations>`, `CONNECT tunnel failed`, or `host is not on the allow list`;
  4. `sandbox` — `Operation not permitted`;
  5. otherwise `ran`.

  `SP_VERDICT` is `pass` when the layer equals `<expect>`, else `fail`. `SP_EVIDENCE` is the first line of the result text carrying the decisive substring, or its first line when the layer is `ran`. The table's strings are the ones §0 → **Reading a refusal.** and §4 quote; the file header cites them.
- [ ] **`sp_judge_tool <stream> <expect> <tool> <path>`** handles `Edit`, `Write` and `Read`, matching `input.file_path` exactly. **`sp_judge_mcp <stream> <tool name>`** gives `pass` when a `tool_use` of that name has a `tool_result` with no `is_error: true`, `fail` when it has an error, and `not run` when no such call exists. The evidence quotes the result's first line. **`sp_call_input <stream> <exact command> <key>`** prints a matched call's `input.<key>` as JSON, or nothing. Task 11 reads `dangerouslyDisableSandbox` through it, and the N5 judge below reads `allowed_domains` through it.
  - **`sp_judge_allowed_domains <stream> <exact command>`** — N5's decision rule, owned here and nowhere else (the story index: `judge.sh` reads a stream into a verdict). It sets `SP_VERDICT`, `SP_LAYER` and `SP_EVIDENCE`, in this order of arms:
    1. **no `allowed_domains`** — `sp_call_input <stream> <command> allowed_domains` prints nothing (or `null`) for the matched call → `not run`, evidence `the call carried no allowed_domains parameter`. A command with no matching call at all is `not run` as `sp_judge_call` words it.
    2. **refused at any layer** — `sp_layer_of` gives `permission`, `file-tool`, `network` or `sandbox` → `pass`, evidence the refusal's first line.
    3. **the host answered** — layer `ran` → `fail`, evidence the response's first line followed by the sentence `finding: allowed_domains widened a sandboxed call; this needs its own follow-up task prompt, not a doc edit`.

    It never reads "not refused" as `pass`: `pass` requires a refusal layer, `fail` requires layer `ran`. This guards the story index's first top risk.
- [ ] **The git judges.**
  - **`sp_remote_tip <main> <branch>`** prints `git -C <main> ls-remote origin refs/heads/<branch>`'s sha, or nothing.
  - **`sp_judge_push <main> <branch> <before>`** gives `pass` when the tip moved off `<before>`, with evidence `ls-remote <old>..<new>`. It gives `fail` when the tip is unchanged.
  - **`sp_judge_ref <repo> <ref> <before> <expect moved|unchanged>`** is judged by `git -C <repo> rev-parse --verify -q <ref>` before and after.

  Callers read the before-value themselves before the session.
- [ ] **`sp_judge_cli`** is the `judge` subcommand the test suite drives, which needs no clone and no session:
  - `judge call <stream> <expect> <command>`
  - `judge tool <stream> <expect> <tool> <path>`
  - `judge mcp <stream> <tool>`
  - `judge allowed-domains <stream> <command>` — calls `sp_judge_allowed_domains`; Task 13 drives N5's three arms through it, and Task 11's N5 row calls the same function.

  Each prints one result line through `sp_result_line judge - …`. A missing or unreadable stream file is a usage refusal, exit 1.

**Verification:**

- Write a two-event stream under `harness-runs/scratch/`. It has one `tool_use` for `dd if=/dev/null of=/x conv=notrunc` and its `tool_result` text `dd: /x: Operation not permitted`. Then:
  - `bash scripts/sandbox-probe.sh judge call harness-runs/scratch/<file> sandbox "dd if=/dev/null of=/x conv=notrunc"` prints `result="pass"` with that evidence;
  - with `ran` it prints `result="fail"`;
  - with the command plus `; echo $?` it prints `result="not run"`.
- Grep `judge.sh`: `sp_judge_allowed_domains` has three arms — absent-parameter `not run`, refusal `pass`, host-answer `fail` with the follow-up-finding sentence — and never a bare "not refused → pass".
- `bash scripts/sandbox-probe.sh judge allowed-domains harness-runs/scratch/<file> "dd if=/dev/null of=/x conv=notrunc"` on the two-event stream above (no `allowed_domains` in its input) prints `result="not run"`.
- The full fixture-driven coverage is Task 13's, and the git judges' is Task 15's; this file names no test run.
