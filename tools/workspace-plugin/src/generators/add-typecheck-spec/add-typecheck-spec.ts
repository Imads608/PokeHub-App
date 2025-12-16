import type { AddTypecheckSpecGeneratorSchema } from './schema';
import {
  formatFiles,
  getProjects,
  logger,
  type Tree,
  updateProjectConfiguration,
  readProjectConfiguration,
  joinPathFragments,
} from '@nx/devkit';

/**
 * Generator to add typecheck-spec target to projects with tsconfig.spec.json
 *
 * Usage:
 *   nx g @pokehub/workspace-plugin:add-typecheck-spec --project=my-project
 *   nx g @pokehub/workspace-plugin:add-typecheck-spec --all
 */
export async function addTypecheckSpecGenerator(
  tree: Tree,
  options: AddTypecheckSpecGeneratorSchema
) {
  const projects = getProjects(tree);
  let updatedCount = 0;

  for (const [projectName, projectConfig] of projects) {
    // Skip if specific project requested and this isn't it
    if (options.project && projectName !== options.project) {
      continue;
    }

    // Skip if not --all and no specific project
    if (!options.all && !options.project) {
      logger.error(
        'Please specify either --project=<name> or --all to add typecheck-spec target'
      );
      return;
    }

    const tsconfigSpecPath = joinPathFragments(
      projectConfig.root,
      'tsconfig.spec.json'
    );

    // Only add to projects with tsconfig.spec.json
    if (!tree.exists(tsconfigSpecPath)) {
      if (options.project) {
        logger.warn(
          `Project "${projectName}" does not have a tsconfig.spec.json file`
        );
      }
      continue;
    }

    // Skip if target already exists (unless --force)
    if (projectConfig.targets?.['typecheck-spec'] && !options.force) {
      logger.info(
        `Project "${projectName}" already has typecheck-spec target, skipping (use --force to overwrite)`
      );
      continue;
    }

    // Read current config and add the target
    const currentConfig = readProjectConfiguration(tree, projectName);

    currentConfig.targets = currentConfig.targets || {};
    currentConfig.targets['typecheck-spec'] = {
      executor: 'nx:run-commands',
      options: {
        // Check if spec files exist before running tsc to avoid "No inputs found" error
        command: `if ls ${projectConfig.root}/src/**/*.spec.ts ${projectConfig.root}/src/**/*.spec.tsx 1> /dev/null 2>&1; then tsc --noEmit -p ${tsconfigSpecPath}; else echo "No spec files found, skipping typecheck"; fi`,
        cwd: '{workspaceRoot}',
      },
      cache: true,
      inputs: [
        '{projectRoot}/tsconfig.spec.json',
        '{projectRoot}/src/**/*.ts',
        '{projectRoot}/src/**/*.tsx',
        '{projectRoot}/src/**/*.spec.ts',
        '{projectRoot}/src/**/*.spec.tsx',
        '{workspaceRoot}/tsconfig.base.json',
      ],
    };

    updateProjectConfiguration(tree, projectName, currentConfig);
    logger.info(`Added typecheck-spec target to "${projectName}"`);
    updatedCount++;
  }

  await formatFiles(tree);
  logger.info(`Updated ${updatedCount} project(s)`);
}

export default addTypecheckSpecGenerator;
