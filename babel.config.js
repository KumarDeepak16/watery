module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // worklets plugin MUST be last (reanimated 4 uses react-native-worklets)
    plugins: ['react-native-worklets/plugin'],
  };
};
