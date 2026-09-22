### 1. `docs/retrieval.md` records the `.mcp.json` working-directory question as settled on a leg that could not distinguish it

**Site.** Two places in `docs/retrieval.md`, both changed by this branch (Task 2):

1. `## Retrieval` → the **Query log.** block → the sub-bullet beginning *"**How the variable reaches the
   server, since an export does not.**"*, its closing sentence quoted *"Gate 10's leg (v) settled that the agent
   runner starts this server with the checkout root as its working directory"*.
2. `## Still open` → the **deleted** entry quoted *"**Whether the agent runner starts the `.mcp.json` server
   with the checkout root as its working directory.** The launcher path in `.mcp.json` is relative and relies on
   it. Settled by Gate 10's unattended-session leg."*

## The problem

The branch closes an open question about the shipped product by citing a measurement that cannot answer it, and
the contradiction is inside the same document.

**What the cited leg actually establishes.** `docs/retrieval.md` → `## Measured, and how` → item (d) →
**(v) The unattended session through `.mcp.json`.** — written by this same branch, fourteen lines further down —
records the conclusion in the leg's own terms:

> The returned results are what prove that **the relative launcher path in `.mcp.json` resolved from the
> session's working directory**.

`docs/development.md` → §5 gate 10 → leg **(v)**, which this branch left unchanged on this point, defines the
leg the same way: *"A call that returned results is the evidence that the relative launcher path in `.mcp.json`
resolved from the session's working directory."*

**Why "the session's working directory" and "the checkout root" are not the same claim, and why this run could
not tell them apart.** The recorded leg (v) command (task prompt → `## The figures block` → `### Leg (v) --
Unattended`) passes `--settings .claude/settings.autonomous.json` — a **relative** settings path — so the
session was started from the target repository's root. In that run the session's working directory **was** the
checkout root, so a runner that resolves `.mcp.json`'s relative `args` against the session's cwd and a runner
that resolves them against the checkout root produce byte-identical behaviour. One observation, two hypotheses,
no discrimination. The deleted `## Still open` entry named the second hypothesis specifically, and the run does
not reach it.

**Why the difference is not academic, and why it is reachable.** The committed launcher entry is relative by
design — `cli/templates/repo/mcp.retrieval.json` carries `"args": ["scripts/docs-search-server.sh"]`, and
`docs/retrieval.md`'s own **Why the committed `.mcp.json` names a repository script, not a machine path.**
bullet explains why it must stay relative. Whoever resolves that string decides whether the server starts at
all. If it is the session's cwd, then an agent session launched from a subdirectory of the checkout — which the
runner permits — resolves `scripts/docs-search-server.sh` against that subdirectory, finds nothing, and the
`harness-docs` server does not start; the failure is silent in the sense that matters, because the session
simply has no `search_docs` tool. Note that `cli/templates/scripts/docs-search-server.sh` itself is immune to
this: it derives `root` from `hr_repo_root "$script_dir"` and passes `docs serve --cwd "$root"`, so the *only*
cwd-sensitive step in the whole chain is the one step leg (v) did not vary. That is exactly the step the deleted
entry was standing over.

**The grade.** This is check 3's class — an omission (the deleted `## Still open` entry) justified by a cited
source that does not support the claim made of it, with the document's own record of that source stating the
narrower fact. It is not a wording nit: the effect of the edit is that a live, adopter-facing behavioural
question about the shipped `.mcp.json` is now recorded as answered, so nobody re-tests it. The paragraph's
trailing hedge — *"but the working directory is the starting client's choice and only that one has been
measured"* — covers a **different** residual risk (another MCP client) and does not cover the untested case
inside this client.

## The fix

Two edits, both in `docs/retrieval.md`. Neither re-runs anything and neither touches a figure.

- [x] In the **How the variable reaches the server, since an export does not.** sub-bullet, replace the
  sentence

  > Gate 10's leg (v) settled that the agent runner starts this server with the checkout root as its working
  > directory (`## Measured, and how`, item (d)), so a relative path resolves there under that client — but the
  > working directory is the starting client's choice and only that one has been measured, so an absolute path
  > is the one form correct whichever client starts it.

  with

  > Gate 10's leg (v) (`## Measured, and how`, item (d)) started a session **at the checkout root** and the
  > relative launcher path resolved from that session's working directory, so the launch path works when the
  > session starts there. What it does not show is which of the two the runner uses — the session's working
  > directory or the checkout root — because in that run they were the same directory (`## Still open`). An
  > absolute path is the one form correct either way, and whichever client starts the server.

- [x] In `## Still open`, restore the entry the branch deleted, narrowed to what leg (v) left open, as the
  **second** bullet (after the Linux one):

  > - **Whether the agent runner resolves `.mcp.json`'s relative launcher path against the checkout root or
  >   against the session's own working directory.** Narrowed, not closed. Gate 10's leg (v) started its session
  >   at the checkout root, where the two are the same directory, and the server started and answered; a session
  >   started from a subdirectory has not been run, and under the second reading it would find no
  >   `scripts/docs-search-server.sh` and get no `harness-docs` server at all. Settled by one leg (v) repeated
  >   from a subdirectory of the same checkout.

Change nothing else. In particular leave item (d)'s leg (v) write-up and the
*"leg (v) above is what settles that path"* bullet as they are — both are accurate: the `.mcp.json` launch path
**was** exercised end to end, which is a different claim from where its relative path is resolved against.
