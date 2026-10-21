### Task 2 — Bump the three PGlite packages in `cli/package.json` to the 1.5.1 set

**Goal:** Move the three PGlite packages, together, to the versions whose declared `@electric-sql/pglite` agrees: `@electric-sql/pglite` `0.5.10`, `@electric-sql/pglite-pg_textsearch` `^0.0.12` and `@electric-sql/pglite-pgvector` `^0.0.11`. Each is listed in two blocks of `cli/package.json`, `peerDependencies` and `devDependencies`, and both blocks move.

**Depends on:** Task 1, which built the old-store fixture while the old packages were installed. After this commit nothing may rebuild that fixture.

**Where this task stops.** It edits `cli/package.json` and nothing else. **The lockfile is not this task's.** `package-lock.json` sits at the workspace root, in the `general` layer, and **Task 3** refreshes it and installs the new packages. Until Task 3 lands, `npm ci` disagrees with this manifest by design. This task does not touch `engines` (`>=20.11.0` stays), `peerDependenciesMeta`, or any other dependency.

### Targets

- `cli/package.json`

**Work:**

- [ ] **Re-check the versions before writing them.** Run `npm view @electric-sql/pglite-pg_textsearch@0.0.12 peerDependencies engines`, `npm view @electric-sql/pglite-pgvector@0.0.11 peerDependencies engines` and `npm view @electric-sql/pglite dist-tags`. Both extension packages must peer `@electric-sql/pglite` `0.5.10` and declare no `engines`, and `latest` must still be `0.5.10`. If a newer pair has been published since planning, take the newest trio whose peers agree with each other, and record which trio you took and why.
- [ ] **`peerDependencies`:** `"@electric-sql/pglite": "0.5.10"` (exact, as before), `"@electric-sql/pglite-pg_textsearch": "^0.0.12"`, `"@electric-sql/pglite-pgvector": "^0.0.11"`.
- [ ] **`devDependencies`:** the same three values, so the workspace's own install builds and tests against the version adopters get.

**Verification:**

- `grep -n "electric-sql" cli/package.json` lists each of the three names three times, once each in `peerDependencies`, `peerDependenciesMeta` and `devDependencies`. The two version-carrying blocks read identically.
- `git diff cli/package.json` touches only the six version strings.
- `bash scripts/typecheck.sh` passes. It is not a test run, and the store's `import type` lines must still resolve against the old installed packages.
