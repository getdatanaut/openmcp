module.exports = {
  root: true,
  extends: ['plugin:tailwindcss/recommended', '@libs/eslint-config/react'],

  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },

  // settings: {
  //   tailwindcss: {
  //     config: require.resolve('./tailwind.config.ts'),
  //   },
  // },
};
