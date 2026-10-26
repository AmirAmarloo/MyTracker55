const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ۱. مطمئن شدن از اینکه پسوندهای فونت به عنوان Asset شناخته می‌شوند
if (!config.resolver.assetExts.includes('ttf')) {
  config.resolver.assetExts.push('ttf');
}

// ۲. مپ کردن دقیق مسیر asset-registry به مکان واقعی آن در ساختار ری‌اکت نیتیو
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native/asset-registry': path.resolve(
    __dirname,
    'node_modules/react-native/Libraries/Image/assetRegistry.js'
  ),
};

module.exports = config;