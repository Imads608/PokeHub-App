import { fixPathAliasesGenerator } from './fix-path-aliases';
import type { FixPathAliasesGeneratorSchema } from './schema';
import { type Tree, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

describe('fix-path-aliases generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should fix incorrect frontend path alias', async () => {
    tree.write(
      'tsconfig.base.json',
      JSON.stringify({
        compilerOptions: {
          paths: {
            '@pokehub/frontend-my-package': [
              'packages/frontend/my-package/src/index.ts',
            ],
          },
        },
      })
    );

    const options: FixPathAliasesGeneratorSchema = {};
    await fixPathAliasesGenerator(tree, options);

    const tsconfig = readJson(tree, 'tsconfig.base.json');
    expect(
      tsconfig.compilerOptions.paths['@pokehub/frontend/my-package']
    ).toEqual(['packages/frontend/my-package/src/index.ts']);
    expect(
      tsconfig.compilerOptions.paths['@pokehub/frontend-my-package']
    ).toBeUndefined();
  });

  it('should fix incorrect backend path alias', async () => {
    tree.write(
      'tsconfig.base.json',
      JSON.stringify({
        compilerOptions: {
          paths: {
            '@pokehub/backend-my-service': [
              'packages/backend/my-service/src/index.ts',
            ],
          },
        },
      })
    );

    const options: FixPathAliasesGeneratorSchema = {};
    await fixPathAliasesGenerator(tree, options);

    const tsconfig = readJson(tree, 'tsconfig.base.json');
    expect(
      tsconfig.compilerOptions.paths['@pokehub/backend/my-service']
    ).toEqual(['packages/backend/my-service/src/index.ts']);
  });

  it('should fix incorrect shared path alias', async () => {
    tree.write(
      'tsconfig.base.json',
      JSON.stringify({
        compilerOptions: {
          paths: {
            '@pokehub/shared-my-types': [
              'packages/shared/my-types/src/index.ts',
            ],
          },
        },
      })
    );

    const options: FixPathAliasesGeneratorSchema = {};
    await fixPathAliasesGenerator(tree, options);

    const tsconfig = readJson(tree, 'tsconfig.base.json');
    expect(tsconfig.compilerOptions.paths['@pokehub/shared/my-types']).toEqual([
      'packages/shared/my-types/src/index.ts',
    ]);
  });

  it('should not modify correct path aliases', async () => {
    tree.write(
      'tsconfig.base.json',
      JSON.stringify({
        compilerOptions: {
          paths: {
            '@pokehub/frontend/my-package': [
              'packages/frontend/my-package/src/index.ts',
            ],
            '@pokehub/backend/my-service': [
              'packages/backend/my-service/src/index.ts',
            ],
          },
        },
      })
    );

    const options: FixPathAliasesGeneratorSchema = {};
    await fixPathAliasesGenerator(tree, options);

    const tsconfig = readJson(tree, 'tsconfig.base.json');
    expect(
      tsconfig.compilerOptions.paths['@pokehub/frontend/my-package']
    ).toEqual(['packages/frontend/my-package/src/index.ts']);
    expect(
      tsconfig.compilerOptions.paths['@pokehub/backend/my-service']
    ).toEqual(['packages/backend/my-service/src/index.ts']);
  });

  it('should remove duplicate when correct version already exists', async () => {
    tree.write(
      'tsconfig.base.json',
      JSON.stringify({
        compilerOptions: {
          paths: {
            '@pokehub/frontend/my-package': [
              'packages/frontend/my-package/src/index.ts',
            ],
            '@pokehub/frontend-my-package': [
              'packages/frontend/my-package/src/index.ts',
            ],
          },
        },
      })
    );

    const options: FixPathAliasesGeneratorSchema = {};
    await fixPathAliasesGenerator(tree, options);

    const tsconfig = readJson(tree, 'tsconfig.base.json');
    expect(
      tsconfig.compilerOptions.paths['@pokehub/frontend/my-package']
    ).toEqual(['packages/frontend/my-package/src/index.ts']);
    expect(
      tsconfig.compilerOptions.paths['@pokehub/frontend-my-package']
    ).toBeUndefined();
  });

  it('should not modify in dry run mode', async () => {
    tree.write(
      'tsconfig.base.json',
      JSON.stringify({
        compilerOptions: {
          paths: {
            '@pokehub/frontend-my-package': [
              'packages/frontend/my-package/src/index.ts',
            ],
          },
        },
      })
    );

    const options: FixPathAliasesGeneratorSchema = { dryRun: true };
    await fixPathAliasesGenerator(tree, options);

    const tsconfig = readJson(tree, 'tsconfig.base.json');
    // Should still have the incorrect format because of dry run
    expect(
      tsconfig.compilerOptions.paths['@pokehub/frontend-my-package']
    ).toBeDefined();
  });

  it('should preserve tool plugin aliases', async () => {
    tree.write(
      'tsconfig.base.json',
      JSON.stringify({
        compilerOptions: {
          paths: {
            '@pokehub/workspace-plugin': [
              'tools/workspace-plugin/src/index.ts',
            ],
            '@pokehub/nest-custom-plugin': [
              'tools/nest-custom-plugin/src/index.ts',
            ],
          },
        },
      })
    );

    const options: FixPathAliasesGeneratorSchema = {};
    await fixPathAliasesGenerator(tree, options);

    const tsconfig = readJson(tree, 'tsconfig.base.json');
    expect(tsconfig.compilerOptions.paths['@pokehub/workspace-plugin']).toEqual(
      ['tools/workspace-plugin/src/index.ts']
    );
    expect(
      tsconfig.compilerOptions.paths['@pokehub/nest-custom-plugin']
    ).toEqual(['tools/nest-custom-plugin/src/index.ts']);
  });
});
