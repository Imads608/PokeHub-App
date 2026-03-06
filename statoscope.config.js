module.exports = {
  validate: {
    plugins: ['@statoscope/webpack'],
    reporters: ['@statoscope/console'],
    rules: {
      // Absolute per-route size limits are validated by tools/validate-bundle-size.ts
      // instead of Statoscope's entry-download-size-limits rule, which inflates sizes
      // for Next.js App Router (see https://github.com/statoscope/statoscope/issues/256).

      // Fail PR if initial size increases by more than 10KB vs main (directional guard)
      '@statoscope/webpack/diff-entry-download-size-limits': [
        'error',
        { global: { maxInitialSizeDiff: 10 * 1024 } },
      ],

      // Warn on duplicate packages
      '@statoscope/webpack/no-packages-dups': ['warn'],

      // Build time limit (5 minutes)
      '@statoscope/webpack/build-time-limits': ['error', 300000],
    },
  },
};
