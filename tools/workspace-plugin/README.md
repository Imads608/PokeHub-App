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
