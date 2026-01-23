// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for lucide-react-native ESM import issue
// Force lucide-react-native to use CJS build instead of ESM
const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'lucide-react-native') {
    return {
      filePath: require.resolve('lucide-react-native/dist/cjs/lucide-react-native.js'),
      type: 'sourceFile',
    };
  }
  
  // Default resolution
  if (defaultResolver) {
    return defaultResolver(context, moduleName, platform);
  }
  
  // Fallback to default Metro resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

