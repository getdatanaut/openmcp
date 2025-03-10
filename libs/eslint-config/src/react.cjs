/** @type {import('eslint/lib/shared/types').ConfigData} */
const config = {
  root: true,

  extends: ['./base.cjs'],

  overrides: [
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      plugins: ['react', 'jsx-a11y'],

      extends: [
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
        'prettier',
      ],

      settings: {
        react: {
          version: 'detect',
        },
        formComponents: ['Form'],
        linkComponents: [
          { name: 'Link', linkAttribute: 'to' },
          { name: 'NavLink', linkAttribute: 'to' },
        ],
      },

      rules: {
        'react/prop-types': 'off',
        'jsx-a11y/no-autofocus': 'off',
        'jsx-a11y/anchor-has-content': 'off',
        'react/no-unknown-property': [
          2,
          {
            ignore: ['jsx', 'global'],
          },
        ],
      },
    },
  ],
};

module.exports = config;
