### 2. R4 is failed on its expected outcome when the SSH proxy refusal reads `This proxy requires authentication`

**File:** `scripts/lib/sandbox-probe/judge.sh` (`sp__layer`) — `"<sandbox_violations>" "CONNECT tunnel failed" "host is not on the allow list"`; consumed by `scripts/lib/sandbox-probe/legs-refresh.sh` (`sp__rf_r4`) — `sp_judge_call "$SP_STREAM" network "$call"`.

R4's row expects *"the fetch fails sandboxed over SSH"*. `sp__rf_r4` grades that by requiring the call's layer to be `network` or `sandbox`. Any other layer prints `fail` with *"the fetch was not refused sandboxed"*. `sp__layer`'s network arm recognises three strings: `<sandbox_violations>`, `CONNECT tunnel failed` and `host is not on the allow list`. `docs/sandbox-verification.md` shows that the sandboxed SSH call's proxy refusal has taken two shapes across versions, and the judge matches only one of them:

- row `OR2`, the most recent record: each push attempt failed on *"`sandbox proxy: github-firu:22: 403 host is not on the allow list`"*. The network arm's `host is not on the allow list` already matches this shape.
- row `OR2` itself adds that *"On 2.1.299 P3 quoted a different proxy refusal (`This proxy requires authentication`)"*. Row `P1` quotes it in full: *"three times `Received disconnect from UNKNOWN port 65535:1: This proxy requires authentication …`"*. Rows `P3` (*"the same proxy refusal"*) and `R4` (*"The fetch failed with the proxy refusal"*) were measured on that version.

Nothing in the network arm matches the `This proxy requires authentication` shape. That text quotes no `<sandbox_violations>` block. On the clone layout the clone's own `.git` is writable, so no `Operation not permitted` follows it either. When the agent CLI prints this shape, the text matches none of the arms and is read as `ran`. R4 then prints `fail` in exactly the case its row calls the expected result, and the person running Gate 15 would record a protection failure that did not happen. In that same case, the layer named in P3's, P1b's and P1c's evidence reads `ran` too. Those rows are graded by `ls-remote`, so for them only the evidence text is wrong.

**Fix.**

- In `sp__layer`, add the second SSH proxy string to the network arm:

```bash
  elif line="$(sp__line_with "$text" "<sandbox_violations>" "CONNECT tunnel failed" "host is not on the allow list" "This proxy requires authentication")"; then
    SP_LAYER=network
```

- Add the same string to the header's layer table: `network  <sandbox_violations>, CONNECT tunnel failed, host is not on the allow list, or This proxy requires authentication (an SSH call through the proxy, docs/sandbox-verification.md row P1)`.
- Add a fixture `cli/test/fixtures/sandbox-probe/network-ssh-proxy.jsonl`, shaped exactly like `network-connect.jsonl`:
  - its `session_id` is `sp-network-ssh-proxy`;
  - its `tool_use` command is `git -C @FIXTURE_ROOT@ fetch origin`;
  - its `tool_result` is `is_error: true` with content `Received disconnect from UNKNOWN port 65535:1: This proxy requires authentication\nfatal: Could not read from remote repository.`
- Add one entry to the `cases` array of `cli/test/sandbox-probe-judge.test.mjs`, beside `'network: CONNECT tunnel failed'`:

```js
    {
      name: 'network: an SSH call refused by the proxy (This proxy requires authentication)',
      stream: 'network-ssh-proxy',
      layer: 'network',
      command: 'git -C @FIXTURE_ROOT@ fetch origin',
      evidence: 'Received disconnect from UNKNOWN port 65535:1: This proxy requires authentication',
    },
```

That test file is the one this fix edits, so it is the only test file the fix runs.
