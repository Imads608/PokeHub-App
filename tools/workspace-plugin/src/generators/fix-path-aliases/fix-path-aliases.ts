import { FixPathAliasesGeneratorSchema } from './schema';
import { formatFiles, logger, Tree, readJson, writeJson } from '@nx/devkit';

/**
 * Expected path alias format: @pokehub/<domain>/<package-name>
 * Where domain is: frontend, backend, or shared
 *
 * Incorrect format: @pokehub/<domain>-<package-name>
 * Correct format:   @pokehub/<domain>/<package-name>
 */

interface TsConfig {
  compilerOptions?: {
    paths?: Record<string, string[]>;
  };
}

/**
 * Converts incorrect alias format to correct format
 * @pokehub/frontend-my-package -> @pokehub/frontend/my-package
 * @pokehub/backend-my-package -> @pokehub/backend/my-package
 * @pokehub/shared-my-package -> @pokehub/shared/my-package
 */
function fixAliasName(alias: string): string | null {
  const domains = ['frontend', 'backend', 'shared'];

  for (const domain of domains) {
    const incorrectPrefix = `@pokehub/${domain}-`;
    if (alias.startsWith(incorrectPrefix)) {
      const packageName = alias.substring(incorrectPrefix.length);
      return `@pokehub/${domain}/${packageName}`;
    }
  }

  return null; // No fix needed
}

export async function fixPathAliasesGenerator(
  tree: Tree,
  options: FixPathAliasesGeneratorSchema
) {
  const tsconfigPath = 'tsconfig.base.json';

  if (!tree.exists(tsconfigPath)) {
    logger.error(`${tsconfigPath} not found`);
    return;
  }

  const tsconfig = readJson<TsConfig>(tree, tsconfigPath);
  const paths = tsconfig.compilerOptions?.paths;

  if (!paths) {
    logger.info('No paths found in tsconfig.base.json');
    return;
  }

  const fixes: Array<{ from: string; to: string }> = [];
  const duplicates: string[] = [];
  const newPaths: Record<string, string[]> = {};

  // Process all path aliases
  for (const [alias, value] of Object.entries(paths)) {
    const fixedAlias = fixAliasName(alias);

    if (fixedAlias) {
      // Check if the correct alias already exists
      if (paths[fixedAlias]) {
        duplicates.push(alias);
        logger.warn(
          `Removing duplicate: "${alias}" (correct version "${fixedAlias}" already exists)`
        );
      } else {
        fixes.push({ from: alias, to: fixedAlias });
        newPaths[fixedAlias] = value;
      }
    } else {
      // Keep the alias as-is
      newPaths[alias] = value;
    }
  }

  if (fixes.length === 0 && duplicates.length === 0) {
    logger.info('All path aliases are already in the correct format');
    return;
  }

  // Log fixes
  for (const fix of fixes) {
    logger.info(`Fix: "${fix.from}" -> "${fix.to}"`);
  }

  if (options.dryRun) {
    logger.info(`\nDry run: ${fixes.length} alias(es) would be fixed`);
    return;
  }

  // Sort paths alphabetically for consistency
  const sortedPaths: Record<string, string[]> = {};
  for (const key of Object.keys(newPaths).sort()) {
    sortedPaths[key] = newPaths[key];
  }

  // Update tsconfig
  tsconfig.compilerOptions = tsconfig.compilerOptions || {};
  tsconfig.compilerOptions.paths = sortedPaths;

  writeJson(tree, tsconfigPath, tsconfig);

  await formatFiles(tree);

  logger.info(
    `\nFixed ${fixes.length} path alias(es), removed ${duplicates.length} duplicate(s)`
  );
}

export default fixPathAliasesGenerator;
