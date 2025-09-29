/* eslint-disable */
export default {
  displayName: 'frontend-shared-ui-components',
  preset: '../../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/packages/frontend/shared-ui-components',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
};
