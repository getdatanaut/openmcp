import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import importPlugin from 'eslint-plugin-import';
import vitestPlugin from 'eslint-plugin-vitest';
import prettierConfig from 'eslint-config-prettier/flat';
import globals from 'globals';
import { globalIgnores } from 'eslint/config';

const ignores = [
  '.github',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.yalc',
  '.yarn',
  '.cache',
  '.storybook/*',
  'build',
  'dist',
  'node_modules',
  '*.mjs',
  'next.config.js',
  'tailwind-config.ts',
  'tailwind.config.js',
  'postcss.config.js',
  '*.d.ts',
];

export const baseConfig = tseslint.config(
  globalIgnores(ignores),

  {
    settings: {
      'import/resolver': {
        typescript: {
          // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
          alwaysTryTypes: true,
          project: ['tsconfig.json', 'apps/*/tsconfig.json', 'libs/*/tsconfig.json', 'packages/*/tsconfig.json'],
        },
      },
    },
  },

  eslint.configs.recommended,

  importPlugin.flatConfigs.recommended,

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'sort-imports': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/extensions': ['error', 'ignorePackages'],
      'no-return-await': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': 'warn',
    },
  },

  // TypeScript configuration (applies only to TS files)
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'dot-notation': 'off',
      '@typescript-eslint/dot-notation': 'off',
    },
  },

  // Test files configuration
  {
    files: ['**/*.(test|spec).{js,jsx,ts,tsx}'],
    plugins: {
      vitest: vitestPlugin,
    },
    rules: {
      ...vitestPlugin.configs.recommended.rules,
    },
  },

  // Node configuration (for eslint config files)
  {
    files: ['.eslintrc.{js,cjs}', 'eslint.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Apply prettier at the end to avoid conflicts
  prettierConfig,
);
