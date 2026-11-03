### Task 7 — F11's fixture: test `check-machine-paths.sh` against throwaway trees

**Goal:** Add the suite that holds gate 6a's new script to its contract: a real hit prints, the excluded places stay silent, and of `grep`'s own errors only `Permission denied` on a character device is dropped. Every other error still prints, so the gate still fails on an unreadable file that could hold a path.

**Depends on:** Task 3, which creates `scripts/check-machine-paths.sh` with this interface. `bash <checkout>/scripts/check-machine-paths.sh`, no arguments, searches **the working directory it is run from** recursively for `$HOME`. It uses gate 6a's exclusions (`node_modules`, `dist`, `.git`, `test_run_logs`, `scratch`, `__pycache__` as `--exclude-dir`; a `./.git:<n>:` line dropped; any file one or more directories below `./harness-runs/clarifications/` dropped). It prints each hit in `grep -rn` form, then every `grep` stderr line except one that is exactly `grep: <p>: Permission denied` with `[ -c <p> ]` true from that directory, and it exits 0. If it cannot make its temporary file it prints one line and exits 1. Task 3 owns the script, and this task only tests it.

### Targets

- `cli/test/check-machine-paths.test.mjs` (new)

**Work:**

- [ ] Header comment, opening with the rule: *gate 6a prints every `$HOME` hit and every `grep` error but one — `Permission denied` on a character device, the `/dev/null` placeholder the launcher's `bwrap` vector mounts `nodev` at an absent protected path, which holds no bytes* (docs/sandbox-verification.md §5 F11). Say what is deliberately not covered: a real `nodev` mount, which no suite can make without privilege. The `grep` stub below stands in for it.
- [ ] Each case builds a throwaway tree under `os.tmpdir()`, removed in `t.after`, and runs `runBash(<tree>, [join(WORKSPACE_ROOT, 'scripts', 'check-machine-paths.sh')], { HOME: <a fake home path string the case chooses> })`. No case aims the script at this checkout. Cases: **(a)** a file naming the fake home prints `./<file>:<line>:<text>`, and the status is 0. **(b)** The same text under each of `node_modules/`, `dist/`, `.git/`, `harness-runs/test_run_logs/`, `harness-runs/scratch/`, `__pycache__/` and `harness-runs/clarifications/<branch>/` prints nothing, while `harness-runs/clarifications/README.md` still prints. **(c)** A tree with no hit prints nothing.
- [ ] Case **(d)**, titled `F11: a Permission denied line on a character device is dropped, any other grep error is printed`. Put a `grep` stub first on the case's `PATH`. When its arguments include `-rn`, it writes `grep: ./.vscode: Permission denied`, `grep: ./secret.txt: Permission denied` and `grep: ./odd: Input/output error` to stderr and then execs the real `grep` (resolved before the stub was placed). Otherwise it execs the real `grep` unchanged. In the tree, `./.vscode` is a symbolic link to `/dev/null` (so `-c` holds without privilege), `./secret.txt` is a regular file, and `./odd` is absent. Assert the output carries the `secret.txt` and `odd` lines verbatim and not the `.vscode` line.
- [ ] Case **(e)**: with `TMPDIR` pointing at a path under a regular file, the script prints one non-empty line and exits 1. A gate that cannot run never reads as silent.

**Verification:**

- `npm test --workspace cli -- test/check-machine-paths.test.mjs` passes, and the case title `F11: a Permission denied line on a character device is dropped, any other grep error is printed` is present byte for byte, because Task 13 cites it in `docs/sandbox-verification.md` §5 F11.
- No case creates a file inside this checkout. Every tree is a `mkdtemp` under `os.tmpdir()`.
- This suite reads one fixed script by running it, not a tree of repository files, so it owes no `treeGuards` entry (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, point 8's boundary).
