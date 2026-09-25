// Enkel lint-konfiguration: fångar odefinierade variabler och liknande fel.
module.exports = [
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        window: 'readonly', document: 'readonly', navigator: 'readonly', performance: 'readonly',
        requestAnimationFrame: 'readonly', setInterval: 'readonly', clearInterval: 'readonly', URLSearchParams: 'readonly',
        console: 'readonly', HK: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
      'no-unreachable': 'error',
      'no-dupe-keys': 'error',
      'no-self-assign': 'error',
      'no-cond-assign': 'error',
    },
  },
  {
    files: ['tools/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { require: 'readonly', module: 'writable', process: 'readonly', __dirname: 'readonly', console: 'readonly', window: 'readonly', HK: 'readonly', document: 'readonly', URLSearchParams: 'readonly', performance: 'readonly' },
    },
    rules: { 'no-undef': 'error' },
  },
];
