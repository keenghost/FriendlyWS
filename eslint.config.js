import tsESLint from 'typescript-eslint'

export default tsESLint.config(...tsESLint.configs.recommended, {
  files: ['**/*.js', '**/*.ts'],
  rules: {
    eqeqeq: 'error',
    'newline-before-return': 'error',
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',

    '@typescript-eslint/no-empty-object-type': 'off',

    '@typescript-eslint/no-explicit-any': 'off',

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
