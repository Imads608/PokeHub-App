import cssplugin from './cssplugin';

const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join, resolve } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    '../../packages/frontend/**/*.{ts,tsx,html,css}',
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {},
  },
  plugins: [cssplugin(resolve(__dirname, './app/global.css'))],
  presets: [require('../../tailwind.config')],
};
