### Task 6 — Add the core-restricted container mode to `scripts/measure-suite.sh` (`--cpus <n>`)

**Goal:** Make `bash scripts/measure-suite.sh --cpus <n>` measure the same two commands on a Linux container pinned to exactly `n` CPUs, so the figures for a GitHub Actions standard runner are **measured** at its core count rather than extrapolated from a 10-core laptop.

**Depends on:** Task 5, which creates `scripts/measure-suite.sh` with the `--ref` / `--runs` parsing, the per-run output line `measure-suite: <mode> cpus=<n> ref=<12-char sha> <npm-test|run-gates> run <i>/<k>: <seconds> s, exit <status>`, the exit contract (`0` every timed run reported whatever it exited with · `1` setup failed · `2` bad usage), and a `--cpus` option that currently refuses with exit 2. This task replaces that refusal and adds exit `3`; it keeps every line format Task 5 defined, with `container` in the `<mode>` slot.

**Why a container, and why `--cpuset-cpus`.** macOS offers no way to confine a process tree to a subset of cores, so the restriction has to come from a Linux kernel: a container started with `--cpuset-cpus 0-<n-1>` is scheduled on exactly those CPUs, and Node reads that affinity — `os.availableParallelism()` inside it answers `n`, which is what sets `node --test`'s default file concurrency (`availableParallelism() - 1`). A CPU **quota** (`--cpus`) would throttle without telling Node, so Node would still plan for the host's count; that is not the runner being modelled. The planner could not find a container runtime on the planning machine, so provisioning one is a `Manual setup required` step in the story index; this task's own refusal (exit `3`) is what an unprovisioned machine sees.

**Where this task stops.** It measures; it does not choose the core count, run the before/after for the record, or edit any document — Task 7 does. Host mode is Task 5's and is not changed beyond sharing the output helpers.

### Targets

- `scripts/measure-suite.sh` — the container mode, and its rows in the header's contract, usage and exit blocks.

**Work:**

- [ ] Preconditions, checked before anything is created: `docker` resolves on `PATH` and `docker info` succeeds, else exit `3` with `measure-suite: --cpus needs a running container runtime (docker CLI; Docker Desktop, colima or OrbStack) — see docs/development.md §5 gate 4`; `<n>` is a positive integer no larger than `docker info --format '{{.NCPU}}'`, else exit `2` naming both numbers (a colima VM defaults to 2 CPUs, so asking for 4 there must be refused rather than silently measured on 2). Add exit `3` to the header's `Exit:` block.
- [ ] Ship the commit, not the working tree: `git archive --format=tar <sha>` into a file under a `mktemp -d` directory outside the checkout (removed on every exit path with `rm -f` on that one file and a non-recursive `rmdir` — never a recursive removal). No `.gitattributes` rule in this repository marks anything `export-ignore`, so the archive is the commit's full tracked tree.
- [ ] Start `docker run --rm --cpuset-cpus 0-<n-1> -v <archive dir>:/in:ro -v <this script>:/in-script/measure-suite.sh:ro node:20-bookworm bash /in-script/measure-suite.sh --in-container --runs <k> --ref <sha>`. `--in-container` is an internal mode, refused with exit 2 unless the file `/.dockerenv` exists. In it, as root and **untimed**: `apt-get update` and install `jq` (gate 4 needs `jq` 1.5+; the image ships `git`); then, as the image's non-root `node` user via `runuser -u node --` — **never as root**, because the suite's unreadable-file cases only hold for a user that permissions apply to — extract the archive into `/home/node/work`, `git init`, `git add` every file and commit once with an inline identity, and run `npm ci`.
- [ ] Inside the container, the same timed loop Task 5 runs — `npm test` `k` times, then `bash scripts/run-gates.sh` `k` times — printing the same per-run lines with `<mode>` = `container` and `cpus=` set to `node -p "require('os').availableParallelism()"` as the container itself reports it, preceded by a preamble of `uname -sm`, `nproc`, `node --version`, `git --version`. State in the header that inside the container gate 1 reports `BLOCKED` (no `claude` on `PATH`) and gate 11 reports its model-cache `BLOCKED` by design, so the container mode's `run-gates` figure is a **time** and never a verdict — the gate verdicts are read from host mode.
- [ ] The host side relays the container's output unchanged and exits with the container's status, mapped onto the same `0` / `1` / `2` contract.

**Verification:**

- On a machine with a running container runtime whose VM has at least 4 CPUs: `bash scripts/measure-suite.sh --cpus 4 --runs 1` prints `cpus=4` on every timed line (the container's own `availableParallelism()`), `nproc` `4` in its preamble, one `npm-test` and one `run-gates` line, and exits 0.
- `bash scripts/measure-suite.sh --cpus 2 --runs 1` prints `cpus=2`.
- With `docker` absent from `PATH`, `bash scripts/measure-suite.sh --cpus 4` exits 3 with the message above and creates nothing under the temp directory; `--cpus 0` and `--cpus` above the runtime's CPU count exit 2.
- `bash scripts/measure-suite.sh --in-container` on the host exits 2.
- `grep -n 'rm -rf\|rm -r ' scripts/measure-suite.sh` prints nothing, and `bash -n scripts/measure-suite.sh` exits 0.
- `bash scripts/run-gates.sh` prints no failure its run on Task 5's commit did not print.
