/* eslint-disable */
export default {
  displayName: 'frontend-pokehub-dex-components',
  preset: '../../../jest.preset.js',
  transform: {
    '^(?!.*\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/packages/frontend/pokehub-dex-components',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
};
