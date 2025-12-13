/* eslint-disable */
export default {
  displayName: 'frontend-pokehub-team-builder',
  preset: '../../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory:
    '../../../coverage/packages/frontend/pokehub-team-builder',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  // Transform ESM packages that Jest can't handle natively
  // next-auth and its dependencies use ESM exports
  transformIgnorePatterns: [
    '/node_modules/(?!(next-auth|@auth/core|jose|oauth4webapi|@panva|preact)/)',
  ],
  coverageThreshold: {
    global: {
      branches: 49,
      functions: 58,
      lines: 61,
      statements: 61,
    },
  },
};
