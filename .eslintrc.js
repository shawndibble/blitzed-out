module.exports = {
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['react', 'react-hooks'],
  settings: {
    'import/resolver': {
      node: {
        paths: ['src'],
        extensions: ['.js', '.jsx', '.json'],
      },
    },
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: ['build/*', 'node_modules/*', '.eslintrc.js'],
  rules: {
    // we want to force semicolons
    semi: ['error', 'always'],
    // we want to avoid extraneous spaces
    'no-multi-spaces': ['error'],
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'error',
    'react/jsx-props-no-spreading': 'off',
    'react/jsx-filename-extension': 'off',
    'react/prop-types': 'off',
    'linebreak-style': 0,
    'no-unused-expressions': ['error', { allowTernary: true }],
    'react/display-name': 'off',
  },
};
