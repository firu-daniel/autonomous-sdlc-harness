### 3. The decision log line prints the agent's raw `action` and `verb` before validation, so a newline in either can inject a workflow command

**Severity:** Should Fix. **Layer:** cli.

**Site:** `cli/templates/scripts/remote-run.sh` → `control_mention`, these lines:

```bash
  action=$(printf '%s' "$decision" | jq -r '.d.action | if type == "string" then . else tojson end')
  verb=$(printf '%s' "$decision" | jq -r '.d.verb | strings')
  ...
  echo "remote-run.sh: control: mention on #$CONTROL_NUMBER by @$CONTROL_ACTOR read as $action${verb:+ $verb} from $from: $reason"
```

**Problem.** The `reason` printed on that line is cleaned with `gsub("[\r\n]+"; " ")`. `action` and `verb` are not: each is printed raw with `jq -r`, and the `echo` runs **before** the `rule=` validation. Hostile text can steer the agent's output, and a decision can be read from the `result` fallback, where the schema's `enum` constrains nothing. Either way an `action` or `verb` string such as `"x\n::error::…"` or `"x\n::stop-commands::t"` puts a line that opens with `::` on the step's stdout. The runner reads such a line as a workflow command: it can forge an annotation, mask values, or suspend the processing of later commands. That breaks the documented contract, *"Every decision is logged. The job's log carries one line per mention"* (`docs/github-run-control.md` → *Mentions read by an agent*). The later uses of `action` and `verb` are unaffected, because both are compared against the closed sets after validation.

**Fix.**

- [ ] Change the two reads so that neither can carry a line break, and a valid value is unchanged:

```bash
  action=$(printf '%s' "$decision" | jq -r '.d.action | if type == "string" then gsub("[\r\n]+"; " ") else tojson end')
  verb=$(printf '%s' "$decision" | jq -r '.d.verb | strings | gsub("[\r\n]+"; " ")')
```

- [ ] In `cli/test/remote-control-mention.test.mjs`, add a case beside the invalid-decision cases. Use a `STUB_AGENT_OUTPUT` whose `structured_output` is `{"action":"x\n::error::forged","reason":"r"}`. Assert that the run exits 2 with the invalid-decision refusal, and that no line of stdout starts with `::error::forged`.
