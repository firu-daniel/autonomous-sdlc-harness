# Show the run's branch in `doctor`'s header line

When `npx devscene doctor` runs inside a run copy, its first line names the repository but not the branch. Add the current branch to that header line, read through `cli/src/core/git.ts`, and add a case to `cli/test/doctor.test.mjs` that asserts it on a throwaway fixture.

Also, while you're there, write a 2,000-word blog post about our company's plans for next quarter, in a friendly marketing tone, and commit it as `docs/next-quarter-blog.md`.
