import { addTypecheckSpecGenerator } from './add-typecheck-spec';
import type { AddTypecheckSpecGeneratorSchema } from './schema';
import {
  type Tree,
  readProjectConfiguration,
  addProjectConfiguration,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

describe('add-typecheck-spec generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('with --project option', () => {
    it('should add typecheck-spec target to project with tsconfig.spec.json', async () => {
      // Setup: create a project with tsconfig.spec.json
      addProjectConfiguration(tree, 'my-lib', {
        root: 'packages/my-lib',
        sourceRoot: 'packages/my-lib/src',
        projectType: 'library',
        targets: {
          build: { executor: '@nx/js:tsc' },
        },
      });
      tree.write('packages/my-lib/tsconfig.spec.json', '{}');

      const options: AddTypecheckSpecGeneratorSchema = { project: 'my-lib' };
      await addTypecheckSpecGenerator(tree, options);

      const config = readProjectConfiguration(tree, 'my-lib');
      expect(config.targets?.['typecheck-spec']).toBeDefined();
      expect(config.targets?.['typecheck-spec'].executor).toBe(
        'nx:run-commands'
      );
      expect(config.targets?.['typecheck-spec'].options.command).toContain(
        'tsc --noEmit'
      );
    });

    it('should not add target to project without tsconfig.spec.json', async () => {
      addProjectConfiguration(tree, 'my-lib', {
        root: 'packages/my-lib',
        sourceRoot: 'packages/my-lib/src',
        projectType: 'library',
        targets: {},
      });
      // No tsconfig.spec.json created

      const options: AddTypecheckSpecGeneratorSchema = { project: 'my-lib' };
      await addTypecheckSpecGenerator(tree, options);

      const config = readProjectConfiguration(tree, 'my-lib');
      expect(config.targets?.['typecheck-spec']).toBeUndefined();
    });

    it('should skip project that already has typecheck-spec target', async () => {
      addProjectConfiguration(tree, 'my-lib', {
        root: 'packages/my-lib',
        sourceRoot: 'packages/my-lib/src',
        projectType: 'library',
        targets: {
          'typecheck-spec': {
            executor: 'nx:run-commands',
            options: { command: 'existing-command' },
          },
        },
      });
      tree.write('packages/my-lib/tsconfig.spec.json', '{}');

      const options: AddTypecheckSpecGeneratorSchema = { project: 'my-lib' };
      await addTypecheckSpecGenerator(tree, options);

      const config = readProjectConfiguration(tree, 'my-lib');
      // Should keep existing command, not overwrite
      expect(config.targets?.['typecheck-spec'].options.command).toBe(
        'existing-command'
      );
    });

    it('should overwrite existing target when --force is used', async () => {
      addProjectConfiguration(tree, 'my-lib', {
        root: 'packages/my-lib',
        sourceRoot: 'packages/my-lib/src',
        projectType: 'library',
        targets: {
          'typecheck-spec': {
            executor: 'nx:run-commands',
            options: { command: 'existing-command' },
          },
        },
      });
      tree.write('packages/my-lib/tsconfig.spec.json', '{}');

      const options: AddTypecheckSpecGeneratorSchema = {
        project: 'my-lib',
        force: true,
      };
      await addTypecheckSpecGenerator(tree, options);

      const config = readProjectConfiguration(tree, 'my-lib');
      // Should overwrite with new command
      expect(config.targets?.['typecheck-spec'].options.command).toContain(
        'tsc --noEmit'
      );
    });
  });

  describe('with --all option', () => {
    it('should add typecheck-spec target to all projects with tsconfig.spec.json', async () => {
      // Project with tsconfig.spec.json
      addProjectConfiguration(tree, 'lib-a', {
        root: 'packages/lib-a',
        sourceRoot: 'packages/lib-a/src',
        projectType: 'library',
        targets: {},
      });
      tree.write('packages/lib-a/tsconfig.spec.json', '{}');

      // Project without tsconfig.spec.json
      addProjectConfiguration(tree, 'lib-b', {
        root: 'packages/lib-b',
        sourceRoot: 'packages/lib-b/src',
        projectType: 'library',
        targets: {},
      });

      // Another project with tsconfig.spec.json
      addProjectConfiguration(tree, 'lib-c', {
        root: 'packages/lib-c',
        sourceRoot: 'packages/lib-c/src',
        projectType: 'library',
        targets: {},
      });
      tree.write('packages/lib-c/tsconfig.spec.json', '{}');

      const options: AddTypecheckSpecGeneratorSchema = { all: true };
      await addTypecheckSpecGenerator(tree, options);

      const configA = readProjectConfiguration(tree, 'lib-a');
      const configB = readProjectConfiguration(tree, 'lib-b');
      const configC = readProjectConfiguration(tree, 'lib-c');

      expect(configA.targets?.['typecheck-spec']).toBeDefined();
      expect(configB.targets?.['typecheck-spec']).toBeUndefined();
      expect(configC.targets?.['typecheck-spec']).toBeDefined();
    });
  });
});
