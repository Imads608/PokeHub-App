import { defaultGeneratorGenerator } from './generator';
import type { DefaultGeneratorGeneratorSchema } from './schema';
import { type Tree, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

describe('default-generator generator', () => {
  let tree: Tree;
  const options: DefaultGeneratorGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await defaultGeneratorGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});
