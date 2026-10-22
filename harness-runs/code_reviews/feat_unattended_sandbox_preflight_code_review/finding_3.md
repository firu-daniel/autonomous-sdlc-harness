### 3. `SandboxBinary.binary` is a bare `string`, so the table is cast to `SandboxPiece` at both read sites

**File:** `cli/src/doctor/sandboxPrerequisites.ts` (`SandboxBinary`, `assessSandboxHost`, `missingBinaries`) — "entry.binary as SandboxPiece"

`SandboxBinary.binary` is typed `string`. `assessSandboxHost` and `missingBinaries` each cast it to `SandboxPiece`. So if a row is added to `SANDBOX_HOST_BINARIES` with a binary that is not a `SandboxPiece` id, it compiles. `assessSandboxHost` then returns a "missing piece" id that no mirror knows. The module's header calls the missing-piece ids "the wire every mirror agrees on". The compiler can hold that rule, but only if the type carries it (`.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`, the total-record paragraph).

**Fix:** narrow the field and drop both casts.

```ts
/** One missing prerequisite, as an id the shell mirror reports in the same order. */
export type SandboxPiece = 'bwrap' | 'socat' | 'wsl1' | 'unsupported-platform';

/** The pieces that are binaries on `PATH`. */
export type SandboxBinaryName = Extract<SandboxPiece, 'bwrap' | 'socat'>;

/** One binary the sandbox needs on `PATH`, the package that installs it, and what it is for. */
export interface SandboxBinary {
  readonly binary: SandboxBinaryName;
  readonly package: string;
  readonly purpose: string;
}
```

Move the `SandboxPiece` declaration above `SandboxBinary`. Then write `.map((entry) => entry.binary)` in `assessSandboxHost` and `missing.includes(entry.binary)` in `missingBinaries`, with no `as`. `checks.ts` reads `entry.binary` only as a string (`resolvesOnPath`, `locateOnPath`, `ReadonlySet<string>.has`), so it needs no change. No test file changes. The gate for this fix is `commands.typecheck` (`bash scripts/typecheck.sh`), which runs no test.
