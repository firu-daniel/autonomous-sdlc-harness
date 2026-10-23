### 2. An answer-authorised sandbox fix reaches a G.4 implementer whose own definition still forbids it outright

**File:** `plugin/agents/layer-implementer.md` (the **A sandbox refusal is the boundary working, in every mode.** paragraph) — "Never change code or a test to avoid the refused access;"

The branch lets a park's answer turn a `## Not fixable on this branch` entry into a fix. `plugin/agents/test-fix-plan-writer.md` → `## Process` step 7 has the converted finding carry `**Authorised by:** <answer_file> — "<the authorising sentence, quoted>"`, and says *"Only that line lifts the sandbox-refusal rule in `## What you must not do`, for its finding only."* The story index's third assumption names the headline case: the answer authorises changing a test so it holds under the sandbox, as in the observed run, where the fixes that passed (`a53c42ea`, `b3ed1a67`) were test changes.

That line lifts the rule for the **planner** only. The agent that implements the finding at G.4 is `layer-implementer` (`plugin/instructions/unit_loop_core.md` → `## Layer routing table`). Its definition still says, unconditionally and "in every mode": *"Never change code or a test to avoid the refused access"*. No file tells it that an `**Authorised by:**` line changes anything. A G.4 implementer holding an authorised finding therefore has its own definition telling it to refuse the very change the finding asks for. If it refuses, it returns a `blocker:` with no `prohibited — ` marker. The unit loop escalates (`unit_loop_core.md` → `## The unit loop` step 3), and the run parks again on the index that the answer just made fixable. On resume, G.0 sees a tracked index with a `[ ]` entry and resumes G.4, so the loop repeats until the watcher's park-loop guard holds the run. The answer route this branch builds stops at the last step for the very case it was built for.

**Fix:** add the exception to the implementer's sandbox paragraph, and keep the definition's word count from rising (`.claude/context/plugin.md` → `## Writing agent prose`: *"A change to an agent definition never raises its up-front word count"*). Make exactly these three edits inside that one paragraph of `plugin/agents/layer-implementer.md`:

1. Replace
   `A signature is not proof of its cause, so read the refused path or host before concluding.`
   with
   `A signature is not proof: read the refused path or host before concluding.`
2. Replace
   `Never change code or a test to avoid the refused access; never route the command around the refusal — through a probe, through `dangerouslyDisableSandbox` (a strict profile ignores it), or through a command the profile's `excludedCommands` names;`
   with
   `Never change code or a test to avoid the refused access unless your finding file's `**Authorised by:**` line quotes that change; never route the command around the refusal — through a probe, `dangerouslyDisableSandbox`, or a command the profile's `excludedCommands` names;`
3. Change nothing else in the paragraph.

Edit 2 adds 10 words. Edits 1 and 2 remove 11 (`of its cause, so`; `(a strict profile ignores it)`; two `through`). Confirm with `wc -w plugin/agents/layer-implementer.md` that the count is no higher than before the edit. Then grep `plugin/` for the exact string `Never change code or a test to avoid the refused access` and confirm that no other file quotes the old sentence byte-for-byte. Today only `plugin/agents/test-fix-plan-writer.md` cites the paragraph, and it cites it by its bold heading, which this fix leaves unchanged.
