### 4. §5's subscription detour lists six steps and says "5 more actions" without saying the figure is net

**File:** `docs/github-integration-research.md` → `## 5. Adoption routes compared`, counting-rule paragraph — "That is 5 more actions, or 2 on R2, where the codespace is already open."

**Problem.** The paragraph lists the subscription detour as *"create the codespace, install, `claude setup-token`, paste the URL, paste the code, then delete it"*. That is six actions, but the text says *"5 more"*. On R2 the codespace is already open, so the detour is three actions (setup-token, URL, code), but the text says *"2"*. Both figures are right only as net figures: the detour replaces the route's existing **API key** action, and the paragraph never says so. A reader who checks the figures against the list, as the table's own counts invite, gets +6 and +3. That reader would put R3 with a subscription at 16 actions instead of 15 and conclude the paragraph is wrong. No routing decision depends on this, because the branch was dropped either way, so this is Should Fix.

The Task 5 per-unit review (`review_0.md`, Should Fix 1) raised the same issue. This finding covers it.

**Fix.** In the counting-rule paragraph, replace

`then delete it. That is 5 more actions, or 2 on R2, where the codespace is already open.`

with

`then delete it. The detour replaces the route's *API key* action, so it adds 5 actions net, or 2 on R2, where the codespace is already open and the detour is only \`claude setup-token\`, the URL and the code.`

Do not change the table's counts: they assume an API key and stay correct. This is a prose-only change, so no test runs.
