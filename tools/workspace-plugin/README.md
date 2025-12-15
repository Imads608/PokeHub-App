# Workspace Plugin

Custom Nx generators for workspace-wide tooling and automation.

## Generators

### add-typecheck-spec

Adds a `typecheck-spec` target to projects, enabling TypeScript type checking for spec/test files.

#### Why?

By default, `nx build` only type-checks production code (via `tsconfig.lib.json`), not test files (via `tsconfig.spec.json`). This means TypeScript errors in test files can go unnoticed until tests actually run.

The `typecheck-spec` target runs `tsc --noEmit` against `tsconfig.spec.json` to catch type errors in test files early.

#### Usage

Add to a specific project:

```bash
npx nx g @pokehub/workspace-plugin:add-typecheck-spec --project=my-lib
```

Add to all projects with `tsconfig.spec.json`:

```bash
npx nx g @pokehub/workspace-plugin:add-typecheck-spec --all
```

Overwrite existing targets (useful when updating the command format):

```bash
npx nx g @pokehub/workspace-plugin:add-typecheck-spec --all --force
```

#### Options

| Option      | Type    | Description                                          |
| ----------- | ------- | ---------------------------------------------------- |
| `--project` | string  | Target a specific project by name                    |
| `--all`     | boolean | Add target to all projects with `tsconfig.spec.json` |
| `--force`   | boolean | Overwrite existing `typecheck-spec` targets          |

#### Running the target

After adding the target, you can run it:

```bash
# Single project
npx nx typecheck-spec my-lib

# All projects
npx nx run-many -t typecheck-spec

# Affected projects only
npx nx affected -t typecheck-spec
```

#### CI Integration

The CI workflow automatically:

1. **Checks for missing targets** - Fails if any project with `tsconfig.spec.json` is missing the `typecheck-spec` target
2. **Runs type checking** - Executes `typecheck-spec` on affected projects

If CI fails with "Missing typecheck-spec targets detected!", run:

```bash
npx nx g @pokehub/workspace-plugin:add-typecheck-spec --project=<project-name>
# or
npx nx g @pokehub/workspace-plugin:add-typecheck-spec --all
```

Then commit the changes.

#### Behavior

- **Projects without spec files**: The target passes with "No spec files found, skipping typecheck"
- **Projects without `tsconfig.spec.json`**: The generator skips these projects
- **Existing targets**: Skipped unless `--force` is used

---

### fix-path-aliases

Fixes path aliases in `tsconfig.base.json` to follow the correct naming convention.

#### Why?

When Nx generates a new package, it may create path aliases in the wrong format:

```
@pokehub/frontend-my-package  ❌ Wrong
@pokehub/frontend/my-package  ✅ Correct
```

This generator automatically fixes these aliases to use the correct format with a slash separator between the domain and package name.

#### Usage

Fix all incorrect path aliases:

```bash
npx nx g @pokehub/workspace-plugin:fix-path-aliases
```

Preview changes without modifying files:

```bash
npx nx g @pokehub/workspace-plugin:fix-path-aliases --dry-run
```

#### Options

| Option     | Type    | Description                             |
| ---------- | ------- | --------------------------------------- |
| `--dryRun` | boolean | Preview changes without modifying files |

#### What it fixes

| Incorrect                      | Correct                        |
| ------------------------------ | ------------------------------ |
| `@pokehub/frontend-my-package` | `@pokehub/frontend/my-package` |
| `@pokehub/backend-my-service`  | `@pokehub/backend/my-service`  |
| `@pokehub/shared-my-types`     | `@pokehub/shared/my-types`     |

#### CI Integration

The CI workflow automatically runs this generator and fails if any path aliases need fixing. If CI fails, run:

```bash
npx nx g @pokehub/workspace-plugin:fix-path-aliases
```

Then commit the changes.

#### Behavior

- **Duplicates**: If both incorrect and correct versions exist, the incorrect one is removed
- **Tool plugins**: Aliases like `@pokehub/workspace-plugin` are preserved (no domain prefix)
- **Sorting**: Path aliases are sorted alphabetically after fixing

---

## CI Integration

The CI workflow runs both generators to ensure workspace consistency:

1. **check-typecheck-targets** job:
   - Runs `add-typecheck-spec --all`
   - Runs `fix-path-aliases`
   - Fails if any changes are detected

If CI fails with "Workspace configuration issues detected!", run:

```bash
npx nx g @pokehub/workspace-plugin:add-typecheck-spec --all
npx nx g @pokehub/workspace-plugin:fix-path-aliases
```

Then commit the changes.

## Development

### Building the plugin

```bash
npx nx build workspace-plugin
```

### Running tests

```bash
npx nx test workspace-plugin
```

### Adding new generators

```bash
npx nx g @nx/plugin:generator <generator-name> --path=tools/workspace-plugin/src/generators/<generator-name>
```
