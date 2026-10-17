import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: { globals: globals.node },
    rules: {
      // A leading underscore marks an argument that is required but intentionally unused.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'error',
    },
  },
  {
    // The logger is the one place allowed to write to the console.
    files: ['utils/logger.js'],
    rules: { 'no-console': 'off' },
  },
];
