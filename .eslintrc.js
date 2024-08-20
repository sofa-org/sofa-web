module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: ['pkg', 'dist', '!.stylelintrc.js', '**/*.html'],
  parser: '@typescript-eslint/parser',
  plugins: ['react', 'react-refresh', 'simple-import-sort', '@nrwl/nx'],
  rules: {
    'prettier/prettier': ['error', { endOfLine: 'auto', singleQuote: true }],
    'simple-import-sort/exports': 'error',
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          // Packages. `react` related packages come first.
          ['^react', '^@?\\w'],
          // Internal packages.
          ['^(@|@company|@ui|components|utils|config|vendored-lib)(/.*|$)'],
          // Side effect imports.
          ['^\\u0000'],
          // Parent imports. Put `..` last.
          ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
          // Other relative imports. Put same-folder imports and `.` last.
          ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
          // Style imports.
          ['^.+\\.s?css$'],
          ['^.+\\.less$'],
        ],
      },
    ],
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    semi: ['error', 'always'],
    'react/self-closing-comp': [
      'error',
      {
        component: true,
        html: true,
      },
    ],
    '@nrwl/nx/enforce-module-boundaries': [
      'error',
      {
        banTransitiveDependencies: true,
        allow: [],
        // update depConstraints based on your tags
        depConstraints: [
          {
            sourceTag: 'type:shared',
            onlyDependOnLibsWithTags: ['type:shared'],
          },
          {
            sourceTag: 'type:app',
            onlyDependOnLibsWithTags: ['type:shared'],
          },
        ],
      },
    ],
    '@typescript-eslint/no-unused-vars': 1,
  },
};
