### 3. A11's consequence cites `### Every secret and variable` for `claude setup-token`, which that section does not mention

**File:** `docs/github-integration-research.md` → `### A11. A subscription token without running the \`claude\` CLI anywhere.` → `**Consequence:**` — "`### Every secret and variable` already asks for `claude setup-token`"

**Problem.** The consequence says that `docs/remote-execution.md` → `### Every secret and variable` *"already asks for `claude setup-token`"*. The heading exists, but its table only lists `CLAUDE_CODE_OAUTH_TOKEN` as a secret and never names `claude setup-token`. The command appears earlier in the same document, under `## 7. Turning it on`, in the step headed **4. Set a credential secret.**, which says *"For a Claude subscription, make a long-lived token, then store it"* and then gives the fenced `claude setup-token` command. A reader who follows the pointer finds a table that does not support the claim. The pointer resolves and no decision depends on it, so this is Should Fix.

**Fix.** In A11's `**Consequence:**`, replace

`` `docs/remote-execution.md` → `### Every secret and variable` already asks for `claude setup-token`. ``

with

`` `docs/remote-execution.md` → `## 7. Turning it on`, step **4. Set a credential secret.**, already asks for `claude setup-token`. ``

Leave the rest of the line (*"none now."*) unchanged. This is a prose-only change, so no test runs.
