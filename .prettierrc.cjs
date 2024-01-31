module.exports = {
  arrowParens: 'avoid',
  printWidth: 96,
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',

  overrides: [
    {
      files: ['*.js', '*.cjs', '*.ts'],
      options: {
        parser: 'typescript',

        importOrder: ['node_modules', '^[./]'],
        importOrderSeparation: false,
        importOrderSortSpecifiers: true,

        plugins: ['@trivago/prettier-plugin-sort-imports'],
      },
    },
  ],
}
