module.exports = {
  root: true,
  overrides: [
    {
      rules: {
        eqeqeq: 'error',
        'newline-before-return': 'error',
        'no-debugger': 'error',
        // '@typescript-eslint/no-unused-vars': ['error', { vars: 'all', args: 'after-used' }],
        '@typescript-eslint/padding-line-between-statements': [
          'error',
          {
            blankLine: 'always',
            prev: '*',
            next: 'block',
          },
          {
            blankLine: 'always',
            prev: 'block',
            next: '*',
          },
          {
            blankLine: 'always',
            prev: '*',
            next: 'block-like',
          },
          {
            blankLine: 'always',
            prev: 'block-like',
            next: '*',
          },
        ],
        '@typescript-eslint/lines-between-class-members': [
          'error',
          {
            enforce: [
              // {
              //   blankLine: 'never',
              //   prev: 'field',
              //   next: 'field',
              // },
              {
                blankLine: 'always',
                prev: '*',
                next: 'method',
              },
              {
                blankLine: 'always',
                prev: 'method',
                next: '*',
              },
            ],
          },
        ],
      },
      files: ['*.js', '*.cjs', '*.ts'],
      plugins: ['@typescript-eslint'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022,
      },
    },
  ],
}
