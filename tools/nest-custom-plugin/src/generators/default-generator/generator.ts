/* eslint-disable @typescript-eslint/consistent-type-imports */

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Tree,
  formatFiles,
  joinPathFragments,
  updateJson,
  logger,
  runTasksInSerial,
} from '@nx/devkit';
import { applicationGenerator as nestApplicationGenerator } from '@nx/nest';
import { libraryGenerator as nestLibraryGenerator } from '@nx/nest';

export interface CustomNestProjectSchema {
  name: string;
  projectType?: 'application' | 'library';
  directory?: string;
}

export default async function (tree: Tree, schema: CustomNestProjectSchema) {
  let generatorTask;
  let projectRoot: string;

  if (schema.projectType === 'library') {
    // Use the provided directory for libraries, or default to 'packages/backend'
    const targetDirectory = schema.directory
      ? schema.directory
      : 'packages/backend';
    generatorTask = await nestLibraryGenerator(tree, {
      name: schema.name,
      directory: targetDirectory,
    });
    projectRoot = joinPathFragments(targetDirectory, schema.name);
  } else {
    // For applications, use provided directory or default to 'apps'
    const targetDirectory = schema.directory ? schema.directory : 'apps';
    generatorTask = await nestApplicationGenerator(tree, {
      name: schema.name,
      directory: targetDirectory,
    });
    projectRoot = joinPathFragments(targetDirectory, schema.name);
  }

  // Locate and patch the ESLint configuration
  const eslintPath = joinPathFragments(projectRoot, '.eslintrc.json');
  if (tree.exists(eslintPath)) {
    updateJson(tree, eslintPath, (eslintConfig) => {
      eslintConfig.overrides = eslintConfig.overrides || [];
      const tsOverride = eslintConfig.overrides.find(
        (override: any) =>
          Array.isArray(override.files) &&
          override.files.some(
            (file: string) => file === '*.ts' || file === '*.tsx'
          )
      );
      if (tsOverride) {
        tsOverride.rules = {
          ...tsOverride.rules,
          '@typescript-eslint/consistent-type-imports': 'off',
        };
      } else {
        eslintConfig.overrides.push({
          files: ['*.ts', '*.tsx'],
          rules: {
            '@typescript-eslint/consistent-type-imports': 'off',
          },
        });
      }
      return eslintConfig;
    });
    logger.info(`Patched ESLint configuration in ${eslintPath}`);
  } else {
    logger.error(`Could not locate ESLint config at ${eslintPath}`);
  }

  await formatFiles(tree);
  return runTasksInSerial(generatorTask);
}
