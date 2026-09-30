### 2. Refuted lead 7 states two corrections that A7's evidence does not carry

**File:** `docs/github-integration-research.md` → `## 6. Leads this research refutes`, item 7 — "is now named the Copilot cloud agent, and it is billed in AI credits plus Actions minutes"

**Problem.** The section opens with its own rule: *"A lead is listed here when its entry's evidence shows it wrong, wholly or in part."* Item 7 makes three corrections to the `feat_github_native_adoption` lead:

1. Copilot Extensions are already retired, disabled on 2025-11-10.
2. The "Copilot coding agent" is now named the Copilot cloud agent.
3. It is billed in AI credits plus Actions minutes.

The A7 entry's `**Evidence:**` holds two quotes. One says the Anthropic Claude agent *"uses the Claude Agent SDK"*. The other is the changelog line *"November 10, 2025: Full sunset—all Copilot Extensions disabled"*. Only the first correction has evidence. The rename appears only in A7's heading, and the billing appears only in A7's unquoted Answer. A reader who corrects `feat_github_native_adoption` from this list would treat unsourced claims as refutations. The implementer has already dropped *"not premium requests"* for the same reason (Task 6, Deviations from plan, third bullet). The rename and billing claims have the same gap. The run has no web access and the per-task file holds no quote for either claim, so the only fix available here is to trim the item.

This was carried over from the Task 6 per-unit review (`review_0.md`, Should Fix 1), which listed this trim as option (b). Option (a), adding quotes to A7, needs a web fetch and cannot be done in this loop.

**Fix.** In item 7 of `## 6. Leads this research refutes`, replace

`They are already retired: disabled on 2025-11-10. The *"Copilot coding agent"* is now named the Copilot cloud agent, and it is billed in AI credits plus Actions minutes ([A7](#a7-copilot-cloud-agent-third-party-coding-agents-on-github-copilot-extensions)).`

with

`They are already retired: disabled on 2025-11-10 ([A7](#a7-copilot-cloud-agent-third-party-coding-agents-on-github-copilot-extensions)).`

Leave the item's lead quote and its prompt and heading attribution unchanged. Do not edit the A7 entry. This is a prose-only change, so no test runs.
