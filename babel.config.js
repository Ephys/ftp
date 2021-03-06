module.exports = {
  presets: [
    ['@reworkjs/core/babel-preset'],
    ['@babel/preset-typescript', {
      isTSX: true,
      allExtensions: true,
    }],
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
  ],
};
