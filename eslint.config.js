import js from '@eslint/js';
import globals from 'globals';
import eslintReact from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
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
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
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
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...eslintReact.configs['recommended-typescript'].rules,
      ...reactHooks.configs.recommended.rules,
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
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Disable React Compiler rules - not using React Compiler yet
      'react-hooks/purity': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      // Disable strict naming conventions
      '@eslint-react/naming-convention/ref-name': 'off',
      // Disable hooks-extra rules that are too strict for existing code
      '@eslint-react/hooks-extra/no-direct-set-state-in-use-effect': 'off',
      // Disable web-api rules that are too strict
      '@eslint-react/web-api/no-leaked-event-listener': 'off',
      // Disable lazy initialization suggestion
      '@eslint-react/prefer-use-state-lazy-initialization': 'off',
      // Disable useContext deprecation warning - React 19 migration concern
      '@eslint-react/no-use-context': 'off',
      // Disable forwardRef deprecation warning - React 19 migration concern
      '@eslint-react/no-forward-ref': 'off',
      // Disable use-state naming convention - too strict for existing code
      '@eslint-react/naming-convention/use-state': 'off',
      // Disable array index key warning - sometimes unavoidable
      '@eslint-react/no-array-index-key': 'off',
      // Disable leaked timeout warning - handled in existing cleanup patterns
      '@eslint-react/web-api/no-leaked-timeout': 'off',
      // Disable iframe sandbox warning - needed for embeds
      '@eslint-react/dom/no-unsafe-iframe-sandbox': 'off',
      // Disable Context.Provider deprecation warning - React 19 migration concern
      '@eslint-react/no-context-provider': 'off',
      // Disable unnecessary use prefix warning - naming convention preference
      '@eslint-react/no-unnecessary-use-prefix': 'off',
      // Disable set-state-in-effect - valid pattern in many cases
      'react-hooks/set-state-in-effect': 'off',
      // Disable flushSync warning - sometimes necessary
      '@eslint-react/dom/no-flush-sync': 'off',
      // Disable createRef warning in tests
      '@eslint-react/no-create-ref': 'off',
      // Disable no-useless-assignment - sometimes used for debugging
      'no-useless-assignment': 'off',
      // Disable preserve-caught-error - would require large refactoring
      'preserve-caught-error': 'off',
      // Disable immutability check for event.target.value - valid DOM pattern
      'react-hooks/immutability': 'off',
    },
  },
  eslintConfigPrettier,
];
