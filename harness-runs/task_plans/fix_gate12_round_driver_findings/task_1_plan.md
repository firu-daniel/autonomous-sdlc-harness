### Task 1 — Accept an SSH host alias that `ssh -G` resolves to github.com in the preflight's origin check

**Goal:** Let `g12_preflight`'s check 5 accept `remote.origin.url` = `git@<alias>:<owner>/<name>[.git]` when `ssh -G <alias>` resolves `hostname github.com`, so that the driver starts from round 13's checkout (`git@github-firu:firu-daniel/harness-gate12.git`). It must still refuse every origin that is not `--repo` on github.com.

**Where this task stops.** This task changes the driver only. The cases that prove it are **Task 3's**: an alias accepted, an alias resolving elsewhere refused, an alias naming another slug refused, and a leading-dash alias refused before `ssh` runs. Task 3 drives them through a stub `ssh` it writes into the fixture's `PATH` directory. That stub answers `-G <alias>` with `hostname <host>` lines in `ssh -G`'s own lower-case `key value` format. So this task reads the `hostname` line of that output, and nothing else in it.

### Targets

- `scripts/lib/gate12-sandbox-round/preflight.sh` — `g12_preflight`, check 5's `case "$url"`, and the header's **THE REFUSALS, IN ORDER.** item 5.

**Work:**

- [ ] `g12_preflight`, check 5: keep the `https://github.com/*` and `git@github.com:*` arms as they are. Add an arm after them for `git@*:*`:
  - Take `<alias>` as the text between `git@` and the first `:`.
  - **Before** any `ssh` call, refuse through `g12_preflight_refuse` unless `<alias>` is non-empty, does not begin with `-`, and holds only `[A-Za-z0-9._-]`. Say in the refusal that it is not a bare host name. A leading `-` would reach `ssh` as an option.
  - When `command -v ssh` fails, refuse naming that `ssh` is not on PATH, so the host alias cannot be resolved.
  - Run `ssh -G "$alias"`, discarding stderr. Take the value of its first `hostname` line, compared case-insensitively through `tr`, as the file already lowers the slug. A non-zero `ssh -G` status, or an empty `hostname`, is a refusal naming `ssh -G <alias>`. A `hostname` other than `github.com` is a refusal naming the URL, the alias and the host it resolved to: `remote.origin.url '<url>' names the host alias '<alias>', which ssh -G resolves to '<host>', not github.com`.
  - On `github.com`, set `slug` to the text after the first `:`. From there the existing `.git` strip, the `<owner>/<name>` shape check and the case-insensitive comparison with `G12_REPO` run unchanged. That comparison is what refuses an alias for github.com that names another repository.
  - Every one of these refusals is a refusal (exit 2, nothing created), not a failed call (exit 3): `ssh -G` reads configuration and opens no connection.
- [ ] Reword the catch-all arm's message so that it names the third form as well, for example `remote.origin.url '<url>' is not a github.com https URL, a git@github.com: URL, or git@<alias>: for an ssh host alias of github.com`. The refusal stays `g12_preflight_refuse`.
- [ ] Header, **THE REFUSALS, IN ORDER.** item 5: state the third accepted form, `git@<alias>:<o>/<n>[.git]`, accepted only when `ssh -G <alias>` resolves `hostname github.com`. State that the alias must be a bare host name, and is refused before `ssh` runs otherwise. State that `ssh` is needed only for that form, which is why check 1 does not list it. State that `ssh -G` evaluates the operator's own ssh configuration, so a `Match exec` there runs, and that it opens no connection. Keep the item's existing sentence that the raw value is read, not `git remote get-url`.

**Verification:**

- `bash scripts/typecheck.sh` passes. Its shell parse check covers `scripts/`.
- The file still sets no shell option and uses no Bash-4 construct. Grep it for `declare -A`, `,,}` and `^^}` and find none.
- Grep `preflight.sh` for `ssh -G`. Every hit sits after the alias is validated, and no hit sits on any path the `https://github.com/*` or `git@github.com:*` arms take, so an origin the preflight accepted before still reaches no `ssh`.
- Task 3's cases are the behavioural proof. This task writes no test file.
