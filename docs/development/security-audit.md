# Security Audit Documentation

This document tracks npm security vulnerabilities, their risk assessments, and mitigation decisions.

## Last Audit Date

**January 2026**

## Overview

The project uses `npm audit` to identify security vulnerabilities in dependencies. Some vulnerabilities require immediate fixes, while others are accepted risks due to being unexploitable in our use case.

## npm Overrides

We use npm overrides in `package.json` to force secure versions of transitive dependencies:

```json
{
  "overrides": {
    "@radix-ui/react-dismissable-layer": "^1.1.11",
    "@radix-ui/react-focus-scope": "^1.1.7",
    "nodemailer": "^6.10.1",
    "minimist": "^1.2.8"
  }
}
```

### Override Explanations

| Package                             | Override Version | Reason                                                                                                                                |
| ----------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `minimist`                          | ^1.2.8           | Fixes critical prototype pollution vulnerability (GHSA-xvch-5gv4-984h) inherited from `pokemon-showdown` → `node-static` → `optimist` |
| `nodemailer`                        | ^6.10.1          | Fixes moderate DoS and interpretation conflict vulnerabilities in `next-auth` and `@auth/core`                                        |
| `@radix-ui/react-dismissable-layer` | ^1.1.11          | Compatibility fix for Radix UI components                                                                                             |
| `@radix-ui/react-focus-scope`       | ^1.1.7           | Compatibility fix for Radix UI components                                                                                             |

## Accepted Vulnerabilities

### node-static (High Severity)

**Vulnerabilities:**

- Directory Traversal (GHSA-5g97-whc9-8g7j)
- Denial of Service (GHSA-8r4g-cg4m-x23c)

**Source:** `pokemon-showdown` → `node-static@0.7.11`

**Risk Assessment: LOW (Accepted)**

**Rationale:**

- `node-static` is only used by pokemon-showdown's built-in HTTP server functionality
- We do NOT use pokemon-showdown's HTTP server
- We only use `@pkmn/sim` (which depends on pokemon-showdown) for team validation logic in `packages/shared/pokemon-showdown-validation/`
- The directory traversal vulnerability requires serving files via node-static's HTTP server, which we never do
- The package is unmaintained with no fixed version available

**Usage in codebase:**

```
packages/shared/pokemon-showdown-validation/src/lib/team-validator-showdown.ts
├── Uses: Dex, TeamValidator from @pkmn/sim
├── Purpose: Validate Pokemon teams against format rules
└── Does NOT use: HTTP server, static file serving
```

### pokemon-showdown (High Severity - Inherited)

**Source:** Direct dependency, inherits severity from `node-static`

**Risk Assessment: LOW (Accepted)**

**Rationale:** Same as node-static - the vulnerable code paths are not executed in our application.

## Moderate Vulnerabilities (Informational)

These are lower priority but tracked for future updates:

| Package        | Vulnerability                 | Source                             | Notes                                   |
| -------------- | ----------------------------- | ---------------------------------- | --------------------------------------- |
| `esbuild`      | Dev server request forwarding | `drizzle-kit`, `pokemon-showdown`  | Dev-only, not exploitable in production |
| `koa`          | Open redirect                 | `@nx/react` → `@module-federation` | Dev tooling only                        |
| `tar`          | DoS via folder count          | `sqlite` → `node-pre-gyp`          | Transitive dep of pokemon-showdown      |
| `tough-cookie` | Prototype pollution           | `pokemon-showdown` → `request`     | Transitive dep, unused code path        |
| `qs`           | DoS via memory exhaustion     | `pokemon-showdown` → `request`     | Transitive dep, unused code path        |
| `form-data`    | Weak random boundary          | `pokemon-showdown` → `request`     | Transitive dep, unused code path        |

## Running Security Audits

```bash
# Check for vulnerabilities
npm audit

# Get JSON output for CI/CD
npm audit --json

# Auto-fix where possible (non-breaking)
npm audit fix

# View high/critical only
npm audit | grep -E "Severity: (high|critical)" -A5 -B5
```

## Updating This Document

When addressing security vulnerabilities:

1. Run `npm audit` to identify current issues
2. Assess each vulnerability for exploitability in our use case
3. Apply fixes via:
   - Direct package updates
   - npm overrides for transitive dependencies
   - Accepting risk for unexploitable vulnerabilities
4. Update this document with decisions and rationale
5. Update the "Last Audit Date" at the top

## CI/CD Integration

Consider adding `npm audit --audit-level=critical` to CI pipelines to fail builds on critical vulnerabilities while allowing accepted moderate/high risks.
