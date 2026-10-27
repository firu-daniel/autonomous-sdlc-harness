### Task 10 — Test the judge's file-tool precedence and N5's `cannot widen` refusal against recorded streams

**Goal:** Pin Task 2's two judge fixes with recorded-stream fixtures in the shape Claude Code 2.1.311 produced, driven through `scripts/sandbox-probe.sh judge`:

- a denied-directory refusal that is also listed in `permission_denials` reads `file-tool`;
- the Bash tool's `allowed_domains cannot widen network access` refusal grades N5 `pass`.

**Depends on:** Task 2, which changed `scripts/lib/sandbox-probe/judge.sh` in two places:

- **`sp__layer`'s order** is now:
  1. the permission text (`Permission to use ` … `has been denied`);
  2. the file-tool text `File is in a directory that is denied by your permission settings.`;
  3. the call listed in the `result` event's `permission_denials` → `permission`;
  4. network;
  5. sandbox;
  6. ran.
- **`sp_judge_allowed_domains`** grades `pass` on a result carrying `allowed_domains cannot widen network access`, with that line as evidence. An error without it, such as `n5-tool-error.jsonl`'s *"allowed_domains applies only to…"*, stays `not run`.

### Targets

- `cli/test/fixtures/sandbox-probe/file-tool-in-denials.jsonl` (new).
- `cli/test/fixtures/sandbox-probe/n5-cannot-widen.jsonl` (new).
- `cli/test/sandbox-probe-judge.test.mjs`: new cases and the header's rule.

**Work:**

- [ ] **`file-tool-in-denials.jsonl`.** Use the shape of `file-tool.jsonl`.
  - One `Edit` (`file_path` `@FIXTURE_ROOT@/scripts/push-branch.sh`) and one `Write` (`@FIXTURE_ROOT@/.git/sbx_w6_new`). Each `tool_result` is `is_error: true`, with content exactly `<tool_use_error>File is in a directory that is denied by your permission settings.</tool_use_error>`, as `docs/sandbox-verification.md` row W6 quotes 2.1.311.
  - The `result` event's `permission_denials` lists both calls (`tool_name`, `tool_use_id`, `tool_input` with the same `file_path`).
- [ ] **`n5-cannot-widen.jsonl`.** Use the shape of `n5-tool-error.jsonl`.
  - The call `curl -sS -o /dev/null https://n5.example.invalid/` with `allowed_domains: ["n5.example.invalid"]`.
  - Its `tool_result` is `is_error: true`, with content exactly `<tool_use_error>allowed_domains cannot widen network access in this session: the configured sandbox allowlist is the whole allowlist here (a managed-domains-only or strictAllowlist policy, or a confined evaluation run). Remove allowed_domains and use a host the configured allowlist already covers.</tool_use_error>`. That is the message row N5 quotes.
- [ ] **Cases in `judge tool`.**
  - `judge tool <file-tool-in-denials> file-tool Edit @FIXTURE_ROOT@/scripts/push-branch.sh` and the `Write` equivalent each print `pass`. Their evidence is the denied-directory line exactly as the fixture carries it, `<tool_use_error>` wrapper included, since evidence is the matched line.
  - The same calls with the expected layer `permission` print `fail` with the same evidence.
- [ ] **Cases in `judge allowed-domains`.**
  - `n5-cannot-widen` → `pass`, with the fixture's line as evidence.
  - The existing `n5-tool-error` case stays `not run`. Keep it unchanged; it is the guard that the new arm matches only the `cannot widen` prefix.
- [ ] **The header.** Extend the rule paragraph:
  - the file-tool text outranks a `permission_denials` listing;
  - N5's refused arm includes the tool's own `allowed_domains cannot widen network access` refusal.

  Every fixture keeps `@FIXTURE_ROOT@` for every path and names no machine path.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-judge.test.mjs` passes, the new cases included.
- The existing cases for `permission-denials` (`This command requires approval (in permission_denials)`, `permission`) and `permission-precedence` still pass unchanged. They are the guard that the reorder moved only the file-tool test.
