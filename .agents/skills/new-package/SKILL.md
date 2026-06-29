---
name: new-package
description: Scaffold a new shared Nx library under packages/{frontend,backend,shared} following PokeHub conventions (project.json, tsconfig trio, jest/eslint configs, barrel export, path alias). Use when the user asks to create a new package, library, or shared module.
---

# Create a new PokeHub shared library

PokeHub libraries live under `packages/<category>/<dir-name>/` where `<category>` is
`frontend`, `backend`, or `shared`. Every package follows a strict, minimal shape.

## Naming convention (memorize this)

| Aspect | Format | Example |
|--------|--------|---------|
| Directory | kebab-case | `packages/frontend/team-export` |
| `name` in project.json | `<category>-<dir-name>` | `frontend-team-export` |
| Import / path alias | `@pokehub/<category>/<dir-name>` | `@pokehub/frontend/team-export` |
| Jest `displayName` | same as project name | `frontend-team-export` |

## Steps

1. **Confirm the category, name, and whether it is React** (frontend libs that export
   `.tsx`/components are React; backend & most `shared` libs are plain Node/TS).

2. **Find the closest existing sibling and copy its structure** — do NOT hand-invent configs.
   Query **graphify** for the most similar existing package to your use case (same category, similar
   role) and mirror it; if graphify is unavailable, fall back to a known-good template
   (frontend/React → `shared-ui-icons`, backend/Node → `shared-logger`, shared/TS → `pokemon-types`).

   Whichever you copy, the package **must** contain exactly these files (this contract is stable):
   ```
   packages/<category>/<dir-name>/
   ├── project.json
   ├── tsconfig.json          # references lib + spec; frontend adds "jsx": "react-jsx"
   ├── tsconfig.lib.json
   ├── tsconfig.spec.json
   ├── jest.config.ts         # frontend: babel-jest; backend/shared: ts-jest + testEnvironment:'node'
   ├── .eslintrc.json         # frontend extends plugin:@nx/react; others extend root only
   ├── .babelrc               # FRONTEND/REACT ONLY
   ├── README.md
   └── src/
       ├── index.ts           # barrel: re-export public API from ./lib/*
       └── lib/
   ```

3. **project.json** must be minimal — only `lint` and `test` targets, `projectType: "library"`,
   `tags: []`. Example:
   ```json
   {
     "name": "frontend-team-export",
     "$schema": "../../../node_modules/nx/schemas/project-schema.json",
     "sourceRoot": "packages/frontend/team-export/src",
     "projectType": "library",
     "tags": [],
     "targets": {
       "lint": { "executor": "@nx/eslint:lint" },
       "test": {
         "executor": "@nx/jest:jest",
         "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
         "options": { "jestConfig": "packages/frontend/team-export/jest.config.ts" }
       }
     }
   }
   ```
   `typecheck` / `typecheck-spec` targets are **inferred** by `@pokehub/workspace-plugin` — do
   not add them manually.

4. **Register the path alias.** Add to `tsconfig.base.json` `compilerOptions.paths`:
   ```json
   "@pokehub/<category>/<dir-name>": ["packages/<category>/<dir-name>/src/index.ts"]
   ```
   Then run the workspace generator to normalize all aliases (this is part of the CI gate):
   ```bash
   npx nx g @pokehub/workspace-plugin:fix-path-aliases
   ```

5. **Verify** before declaring done:
   ```bash
   npx nx test <category>-<dir-name>
   npx nx lint <category>-<dir-name>
   npx nx typecheck <category>-<dir-name>
   ```

6. **Document it.** Update the relevant docs so the package is discoverable:
   - `CLAUDE.md` → "Key Shared Libraries" (and the package map in `docs/ARCHITECTURE.md`) if broadly reusable.
   - Any `docs/development/*.md` or `docs/features/<feature>.md` whose guidance the package affects.

## Notes
- Frontend packages with server-only entry points may add a `src/server.ts` and a
  `"@pokehub/<category>/<dir-name>/server"` alias — see `frontend/shared-utils` for the pattern.
