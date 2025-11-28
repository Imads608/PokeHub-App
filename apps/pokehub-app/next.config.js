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
    domains: ['play.pokemonshowdown.com', 'raw.githubusercontent.com'], // Add the external domain here
  },
  output: undefined,
  webpack: (config, { isServer }) => {
    // Add Statoscope plugin when ANALYZE is enabled
    if (process.env.ANALYZE === 'true') {
      config.plugins.push(
        new StatoscopeWebpackPlugin({
          saveReportTo: `./statoscope-report-${isServer ? 'server' : 'client'}.html`,
          saveStatsTo: `./statoscope-stats-${isServer ? 'server' : 'client'}.json`,
          open: 'file',
          // Optional: customize the report
          normalizeStats: true,
          // Additional options:
          // - `watchMode: false` - disable watch mode
          // - `compressor: 'gzip'` - show gzipped sizes (default)
        })
      );
    }
    return config;
  },
};

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withBundleAnalyzer,
];

module.exports = composePlugins(...plugins)(nextConfig);
