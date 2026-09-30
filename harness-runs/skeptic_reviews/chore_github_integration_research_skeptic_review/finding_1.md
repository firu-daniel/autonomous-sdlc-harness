### 1. S5 says `remote-run.sh`'s payload check "matches" GitHub's count, but no measurement covered the escaped characters every `answers` payload carries

**File:** `docs/github-integration-research.md` → `### S5. \`workflow_dispatch\`: the limit on the number of inputs, …` → `**Answer:**`, last sentence — "`remote-run.sh` → `dispatch` already measures `${#payload}` of that same compact object, so its check matches."

**Problem.** S5 is graded `verified`, and the document's opening paragraph says a `verified` answer *"is to be cited rather than re-verified"*. S5's consequence then tells `feat_forge_run_control` that *"The existing check in `remote-run.sh` is the one to reuse."* But the "its check matches" part rests on no measurement. Every payload measured in S5's evidence is built from `a` or `é` repeated, and neither character needs escaping in JSON. So the evidence shows GitHub counts compact-JSON characters for unescaped content. It says nothing about content JSON escapes.

The unmeasured case is the only one where the check matters. `cli/templates/scripts/remote-run.sh` → `verb_dispatch` builds `answers` as a JSON object string (`jq -n -c … '$acc + {($k): $v}'`) and then embeds it as a string value in `payload` (`--arg answers "$answers"`). Every quote inside it therefore reaches the measured payload as `\"`, and every newline in an answer file as `\n`. Checked in this worktree:

```
$ jq -n -c --arg a '{"1":"x<y"}' '{answers:$a}'
{"answers":"{\"1\":\"x<y\"}"}
```

Whether GitHub's 65,535-character count includes those backslashes was not measured. A second condition was not measured either: `${#payload}` counts characters only under a UTF-8 locale, and `remote-run.sh` sets no `LC_ALL` or `LANG` (a grep finds neither). Checked in this worktree: `LC_ALL=C bash -c 'p=é; echo ${#p}'` prints `2`, and under `en_US.UTF-8` it prints `1`. So the S5 measurement that a limit is "characters, not bytes" does not carry over to the script in every locale.

A `feat_forge_run_control` planner who reads S5 as written will reuse the check as verified and will not measure a real `answers` payload, although that is the case the document never measured. The plan's own rule, *"Nothing is inferred to fill a gap"*, is broken by this one sentence. No measured value is wrong, and the dispatch fails loudly rather than silently if the counts differ. So this is Should Fix, the same grade as the code review's Finding 1 for the same kind of verified-over-unmeasured claim.

**Fix.** In `docs/github-integration-research.md`, S5 `**Answer:**`, replace

`` `remote-run.sh` → `dispatch` already measures `${#payload}` of that same compact object, so its check matches. ``

with

`` `remote-run.sh` → `dispatch` measures `${#payload}` of that same compact object, which matches GitHub's count for the values measured here. Not measured: whether GitHub counts the backslash escapes that JSON adds (every `answers` value is itself a JSON string, so its quotes reach the payload as `\"`), and `${#payload}` counts characters only under a UTF-8 locale, bytes otherwise. ``

Then, in S5's `**Consequence:**`, in the `feat_forge_run_control` bullet, replace

`The existing check in `remote-run.sh` is the one to reuse.`

with

`The existing check in `remote-run.sh` is the one to reuse, once a payload carrying escaped characters has been measured against it (see the Answer).`

Leave the `**Verdict:**` line, every evidence line and every quote unchanged. The verdict grades the lead, *"the code assumes 65,535 characters"*, and the evidence verifies that lead. This is a prose-only change, so no test runs.
