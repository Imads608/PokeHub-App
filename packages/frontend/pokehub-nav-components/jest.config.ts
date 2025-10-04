/* eslint-disable */
export default {
  displayName: 'frontend-pokehub-nav-components',
  preset: '../../../jest.preset.js',
  transform: {
    '^(?!.*\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\.[tj]sx?': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/packages/frontend/pokehub-nav-components',
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(next-auth|@auth/core)/)',
  ],
  moduleNameMapper: {
    '^next-auth$': '<rootDir>/src/__mocks__/next-auth.ts',
    '^next-auth/react$': '<rootDir>/src/__mocks__/next-auth-react.ts',
  },
};

