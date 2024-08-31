import tsESLint from 'typescript-eslint'

export default tsESLint.config({
  files: ['**/*.js', '**/*.cjs', '**/*.ts', '**/*.tsx'],
  extends: [tsESLint.configs.base],
  rules: {
    eqeqeq: 'error',
    'newline-before-return': 'error',
    'no-debugger': 'error',

    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
      },
    ],

    'padding-line-between-statements': [
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

    'lines-between-class-members': [
      'error',
      {
        enforce: [
          //   {
          //     blankLine: 'never',
          //     prev: 'field',
          //     next: 'field',
          //   },
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
})
