import js from '@eslint/js';
import globals from 'globals';
import eslintReact from '@eslint-react/eslint-plugin';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  { ignores: ['dist', 'vite.config.ts', 'vitest.config.ts', 'functions/lib/**'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      semi: ['error', 'always'],
      'no-multi-spaces': ['error'],
      'linebreak-style': 0,
      'no-unused-expressions': ['error', { allowTernary: true }],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    ...eslintReact.configs['recommended-typescript'],
    languageOptions: {
      ...eslintReact.configs['recommended-typescript'].languageOptions,
      parser: tsparser,
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
        JSX: 'readonly',
        NodeJS: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      ...eslintReact.configs['recommended-typescript'].plugins,
      '@typescript-eslint': tseslint,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...eslintReact.configs['recommended-typescript'].rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      semi: ['error', 'always'],
      'no-multi-spaces': ['error'],
      'linebreak-style': 0,
      'no-unused-expressions': ['error', { allowTernary: true }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        { 'ts-expect-error': 'allow-with-description' },
      ],
      'no-undef': 'off',
      'no-bitwise': 'off',
      // Warn on ref naming convention - refs should end with "Ref"
      '@eslint-react/naming-convention/ref-name': 'warn',
      // Disable hooks-extra rules that are too strict for existing code
      '@eslint-react/hooks-extra/no-direct-set-state-in-use-effect': 'off',
      // Warn on leaked event listeners - should have cleanup
      '@eslint-react/web-api/no-leaked-event-listener': 'warn',
      // Disable lazy initialization suggestion
      '@eslint-react/prefer-use-state-lazy-initialization': 'off',
      // Disable useContext deprecation warning - React 19 migration concern
      '@eslint-react/no-use-context': 'off',
      // Disable forwardRef deprecation warning - React 19 migration concern
      '@eslint-react/no-forward-ref': 'off',
      // Warn on useState naming convention - setters should be named setX
      '@eslint-react/naming-convention/use-state': 'warn',
      // Disable array index key warning - sometimes unavoidable
      '@eslint-react/no-array-index-key': 'off',
      // Warn on leaked timeouts - should have cleanup
      '@eslint-react/web-api/no-leaked-timeout': 'warn',
      // Disable iframe sandbox warning - needed for embeds
      '@eslint-react/dom/no-unsafe-iframe-sandbox': 'off',
      // Disable Context.Provider deprecation warning - React 19 migration concern
      '@eslint-react/no-context-provider': 'off',
      // Warn on unnecessary use prefix - functions without hooks shouldn't use "use" prefix
      '@eslint-react/no-unnecessary-use-prefix': 'warn',
      // Warn on flushSync usage - should be rare
      '@eslint-react/dom/no-flush-sync': 'warn',
      // Enable createRef warning (except in tests where it's appropriate)
      '@eslint-react/no-create-ref': 'warn',
      // Warn on useless assignments
      'no-useless-assignment': 'warn',
      // Warn on errors without cause chain
      'preserve-caught-error': 'warn',
    },
  },
  // Test file overrides
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      // createRef is appropriate in test files for testing refs
      '@eslint-react/no-create-ref': 'off',
    },
  },
  eslintConfigPrettier,
];
