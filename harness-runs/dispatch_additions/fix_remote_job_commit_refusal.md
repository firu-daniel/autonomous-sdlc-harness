# Dispatch additions — fix_remote_job_commit_refusal

## [C · Item 1 · commit] → committer  (#36)
- **added:** `context_notes:`
- **verbatim:** The previous committer dispatch's wrapper call (subject "fix: Add the missing space in const job3 =await for Finding 5") was refused by the permission layer before running; an orchestrator probe of the same wrapper with an exit-3 path and subject "chore: Flow progress probe job3 =await" was refused identically, while every earlier wrapper call this run whose subject carried no word beginning with "=" ran (source: this session's Bash refusals; commit 1ff3b536 is the last wrapper call that ran).
- **why the agent could not derive it:** the refusal of the previous committer dispatch (#35) and the orchestrator's probe exist only in this session's transcript; no committed artifact records either.
