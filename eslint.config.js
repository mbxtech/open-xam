// ESLint flat config for Angular + Jest + Tailwind
import angular from '@angular-eslint/eslint-plugin';
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
// Template and Jest linting can be enabled later as needed

export default defineConfig([
  // Global ignores
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'src-tauri/**', '.angular/**', 'e2e/**', '*.conf.js']
  },
  // Base JS config
  {
    name: 'base-js',
    files: ['**/*.{js,mjs,cjs}'],
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'src-tauri/**'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser
    },
    ...js.configs.recommended
  },

  // TypeScript for Angular
  ...tseslint.config({
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended
    ],
    files: ['**/*.ts'],
    ignores: ['**/*.spec.ts', 'src/**/*.html', '**/*.config.*', 'setup-jest.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json']
      }
    },
    plugins: {
      '@angular-eslint': angular
    },
    rules: {
      // Angular recommended
      ...angular.configs['recommended'].rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],
      // General TS
      '@typescript-eslint/no-empty-interface': ['error', { allowSingleExtends: true }],
      '@typescript-eslint/no-explicit-any': 'off',
      // Import sorting placeholder (add your preferred plugin if needed)
      'sort-imports': ['off']
    }
  }),

  // Note: Template (.html) and test files are currently ignored in ESLint.
]);
