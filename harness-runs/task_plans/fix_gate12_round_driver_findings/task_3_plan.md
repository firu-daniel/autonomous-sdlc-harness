### Task 3 — Test the preflight's host-alias acceptance and its refusals

**Goal:** Pin finding 1 in `cli/test/gate12-sandbox-round-cli.test.mjs`. An origin given as an SSH host alias that resolves to github.com is accepted. The suite's existing rule still holds: the driver refuses to run anywhere but the named Gate 12 repository and creates nothing when it refuses. That covers an alias resolving to any other host, an alias for github.com naming another repository, and an alias that is not a bare host name.

**Depends on:** Task 1. It accepts `remote.origin.url` = `git@<alias>:<owner>/<name>[.git]` only when `ssh -G <alias>` prints a `hostname` line whose value is `github.com`, compared case-insensitively. It refuses (exit 2, nothing created) when:
- `<alias>` is empty, begins with `-`, or holds a character outside `[A-Za-z0-9._-]`, before any `ssh` call;
- `ssh` is not on PATH;
- `ssh -G` exits non-zero or prints no `hostname`;
- the `hostname` is not `github.com`, with stderr `remote.origin.url '<url>' names the host alias '<alias>', which ssh -G resolves to '<host>', not github.com`.

An accepted alias then goes through the unchanged slug comparison, whose refusal reads `origin is '<slug>', not --repo '<repo>'`. Task 1 owns the driver, and this task changes nothing under `scripts/`.

### Targets

- `cli/test/gate12-sandbox-round-cli.test.mjs` — new cases, and its header.

**Work:**

- [ ] Add a file-local `sshStub(fixture, hostname)`. It writes an executable `ssh` into `fixture.binDir`, the directory `runRound` puts first on `PATH`.
  - It appends its argv as one line to a log under `fixture.root`.
  - Called as `-G <alias>`, it prints `ssh -G`'s lower-case `key value` lines, including `user git`, `hostname <hostname>` and `port 22`, and exits 0.
  - Any other argv exits 1.
  - Add a file-local `aliasOrigin(fixture, alias, slug = GATE12_SLUG)`. It sets the checkout's `remote.origin.url` to `git@<alias>:<slug>.git` with `git config`. It also sets `url.<fixture.origin>.insteadOf` to that same URL, so that the preflight's `git fetch origin` reaches the bare origin, as the shared helper does for its https URL (`cli/test/helpers/gate12-round.mjs` → the header's `url.<bare>.insteadOf` sentence).
  - Both stay local to this file: no other suite needs them.
- [ ] An accepted case. `sshStub(fixture, 'github.com')` and `aliasOrigin(fixture, 'github-fixture')`, then `runRound(fixture, ['grade', '--repo', GATE12_SLUG, '--row', 'JS3N'])`.
  - Assert exit 0.
  - Assert stdout is one `row="JS3N" result="not run"` line, the hand row's.
  - Assert stderr carries no `refusing to start`.
  - Assert the stub's argv log holds `-G github-fixture`.
- [ ] Inside `each preflight refusal exits 2 and creates nothing`, add three `t.test` cases through the existing `assertRefused`:
  - **An alias resolving to another host.** `sshStub(fixture, 'gitlab.example.invalid')` and `aliasOrigin(fixture, 'github-fixture')`. Assert stderr names `github-fixture` and `gitlab.example.invalid`.
  - **An alias for github.com naming another repository.** `sshStub(fixture, 'github.com')` and `aliasOrigin(fixture, 'github-fixture', 'other/repo')`. Assert stderr matches `origin is 'other/repo', not --repo 'fixture/gate12'`.
  - **A leading-dash alias.** `aliasOrigin(fixture, '-oProxyCommand=true')`, with `sshStub` installed. Assert the stub's argv log is absent or empty, because the refusal came before any `ssh` call.

  Set the alias URL **before** `assertRefused` takes its snapshot, so that the unchanged-tree assertion covers only the run.
- [ ] Header: add to the rule that an origin given as an SSH host alias is accepted only when `ssh -G` resolves it to github.com. Add that the `ssh` the driver meets is this file's stub, so no case reads the machine's ssh configuration. Keep the line saying it owes no `treeGuards` entry: it still reads one fixed script.

**Verification:**

- `npm test --workspace cli -- test/gate12-sandbox-round-cli.test.mjs`, from the repository root, as one plain foreground command, exits 0, and its counts show the four new cases passing.
- Every case that runs the driver puts the stub `ssh` first on `PATH`, so no case resolves a real host alias. Grep the file for `binDir` beside `sshStub` to confirm it.
- The pre-existing cases are unchanged. The https-origin fixture never calls `ssh`, so their argv logs never exist.
