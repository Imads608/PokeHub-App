module.exports = {
  validate: {
    plugins: ['@statoscope/webpack'],
    reporters: ['@statoscope/console'],
    rules: {
      // First Load JS limits (gzipped, initial chunks only)
      // maxInitialSize = initial chunks only (what Next.js reports as "First Load JS")
      '@statoscope/webpack/entry-download-size-limits': [
        'error',
        { global: { maxInitialSize: 550 * 1024 } }, // 550KB limit
      ],

      // Fail PR if First Load JS increases by more than 10KB vs main
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
