//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');
const StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default;

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'play.pokemonshowdown.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
    ],
  },
  output: 'standalone',
  webpack: (config, { isServer }) => {
    // Add Statoscope plugin when ANALYZE is enabled
    if (process.env.ANALYZE === 'true') {
      config.plugins.push(
        new StatoscopeWebpackPlugin({
          saveReportTo: `./statoscope-report-${
            isServer ? 'server' : 'client'
          }.html`,
          saveStatsTo: `./statoscope-stats-${
            isServer ? 'server' : 'client'
          }.json`,
          open: process.env.CI ? false : 'file',
          normalizeStats: true,
          // Collect gzipped sizes for accurate First Load JS validation
          compressor: 'gzip',
        })
      );
    }
    return config;
  },
};

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: !process.env.CI,
});

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withBundleAnalyzer,
];

module.exports = composePlugins(...plugins)(nextConfig);
