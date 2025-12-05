import generator from './generator';
import type { CustomNestProjectSchema } from './generator';
import { type Tree, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

// Skip this test suite - Nx generator tests have Jest environment compatibility issues
// with setTimeout().unref() not being available in the Jest environment
describe.skip('default-generator generator', () => {
  let tree: Tree;
  const options: CustomNestProjectSchema = { name: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await generator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});
