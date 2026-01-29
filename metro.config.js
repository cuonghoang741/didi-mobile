// Metro configuration for Expo with react-native-svg-transformer
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Use SVG transformer
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

// Ensure SVGs are treated as source files, not assets
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;


