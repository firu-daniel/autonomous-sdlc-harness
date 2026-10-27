### 1. N5 prints `fail` and files the "allowed_domains widened a sandboxed call" finding for any error result that carries no refusal string, though the host never answered

**File:** `scripts/lib/sandbox-probe/judge.sh` (`sp_judge_allowed_domains`) — "# Arm 3: the host answered."; consumed by `scripts/lib/sandbox-probe/legs-network.sh` (`sp_leg_network`) — `sp_row_result --direct network N5 "$SP_VERDICT"`; row `N5` in `docs/sandbox-verification.md` (Expected cell, "A call that reaches the host is a `fail`").

**The problem.** The story index names N5 as the leg that matters most and gives its rule as *"`fail` exactly when the host answered"* (`## Context` → **Top risks**). The judge's header says the same thing: *"`fail` needs layer `ran`: a call that was merely not refused is never a pass"*. But `ran` is not "the host answered". In `sp__layer`, `ran` is the fall-through: *"none of the above"*, that is, the result text carries none of `Permission to use … has been denied`, the denied-directory message, `<sandbox_violations>`, `CONNECT tunnel failed`, `host is not on the allow list`, `This proxy requires authentication` or `Operation not permitted`. `sp_judge_allowed_domains` reads `SP__STATUS` only to catch a missing `tool_result`. It never checks whether the result was an error. So any `is_error: true` result with none of those strings goes to Arm 3 and prints:

`result="fail" evidence="<first line> — finding: allowed_domains widened a sandboxed call; this needs its own follow-up task prompt, not a doc edit"`

`sp_leg_network` prints it with `sp_row_result --direct`. Under `--direct` a `fail` is printed whether or not the control held, because a direct fail is meant to be *"direct evidence of a protection breaking: … a host that answered"* (story index `## Context`). An error result with no refusal string is not that evidence.

**Why it is reachable.** The record already holds this exact shape for this exact parameter. `docs/sandbox-verification.md` §6, the bullet **A per-call `allowed_domains` on the Bash tool:**, and §7 row `OR4` record that the Bash tool rejected `allowed_domains` four times *"before running"*, as a `tool_use_error`: *"allowed_domains applies only to a command that runs in the sandbox, and this one would not (dangerouslyDisableSandbox, an excluded command, or no sandbox for this shell): remove it, or run the command sandboxed."* That text contains none of the network-arm strings. If the tool rejects N5's call the same way, or with any other validation error, the call never runs. That can happen on the session's sandbox state, on a version where the parameter is unsupported, or under `strictAllowlist`. `curl` exits non-zero on any transport error that is not one of the matched strings, which is a second route to the same result. In each case the probe prints `fail` with the follow-up-finding sentence. The person running Gate 15 is told to treat that as *"a finding with its own follow-up prompt, not a doc edit"* (task prompt, goal item 2, **network**), so they would write a follow-up prompt for a widening that did not happen. That is a decision made on a wrong verdict.

**Proof.**
- `sp__layer` → `else SP_LAYER=ran; line="$(sp__first_line "$text")"` is the arm for "none of the strings".
- `sp_judge_allowed_domains` → `case "$SP_LAYER" in … ran) SP_VERDICT=fail` has no `SP__STATUS` test. `sp__match` sets `SP__STATUS` to `error` exactly when `is_error == true`.
- `cli/test/fixtures/sandbox-probe/n5-answered.jsonl`, the only `fail` fixture, has no `is_error` (a `HTTP/2 200` answer). No case pins an error result without a refusal string.

**Fix.**

1. In `scripts/lib/sandbox-probe/judge.sh` → `sp_judge_allowed_domains`, split Arm 3 on the result status:

```bash
    # Arm 3: the host answered — a result that is not an error and carries no refusal string.
    ran)
      if [ "$SP__STATUS" = error ]; then
        SP_VERDICT="not run"
        SP_EVIDENCE="the call returned an error carrying no refusal string, so neither a refusal nor an answer from the host: $SP_LAYER_EVIDENCE"
      else
        SP_VERDICT=fail
        SP_EVIDENCE="$SP_LAYER_EVIDENCE — finding: allowed_domains widened a sandboxed call; this needs its own follow-up task prompt, not a doc edit"
      fi
      ;;
```

   Then change the function's header comment to: *"`pass` needs a refusal layer, and `fail` needs layer `ran` on a result that is not an error: a call that was merely not refused is never a pass, and one that errored without a refusal is never a fail."*

2. Add a fixture `cli/test/fixtures/sandbox-probe/n5-tool-error.jsonl`. Shape it exactly like `n5-refused.jsonl`, with these differences:
   - its `session_id` is `sp-n5-tool-error`;
   - its `tool_use` input is the same `{"command":"curl -sS -o /dev/null https://n5.example.invalid/","allowed_domains":["n5.example.invalid"]}`;
   - its `tool_result` is `"is_error":true` with the string content `<tool_use_error>allowed_domains applies only to a command that runs in the sandbox, and this one would not (dangerouslyDisableSandbox, an excluded command, or no sandbox for this shell): remove it, or run the command sandboxed.</tool_use_error>`.

3. In `cli/test/sandbox-probe-judge.test.mjs` → `test('judge allowed-domains: N5’s three arms', …)`, add a fourth subtest after the `n5-answered` one:

```js
  await t.test('a call carrying allowed_domains that errored with no refusal string is not run, never a fail', async () => {
    assertJudged(
      await judge('allowed-domains', fixture('n5-tool-error'), N5_COMMAND),
      'not run',
      'the call returned an error carrying no refusal string, so neither a refusal nor an answer from the host: <tool_use_error>allowed_domains applies only to a command that runs in the sandbox, and this one would not (dangerouslyDisableSandbox, an excluded command, or no sandbox for this shell): remove it, or run the command sandboxed.</tool_use_error>',
    );
  });
```

   Also change the header sentence *"N5's three arms (`sp_judge_allowed_domains`) are held here too: refused is `pass`, answered is `fail` carrying the follow-up finding, and a call with no `allowed_domains` parameter is `not run`"* to add *", and an error result carrying no refusal string is `not run`"* before the full stop.

4. In `docs/sandbox-verification.md`, row `N5`, Expected cell: after *"A call that carried no `allowed_domains` parameter is `not run`."* insert *"A call whose result is an error carrying none of those refusal strings did not reach the host and is `not run`, its first line quoted."*

The judge test file is the one test file this fix edits, so it is the only test run: `npm test --workspace cli -- test/sandbox-probe-judge.test.mjs`.
