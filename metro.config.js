const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// expo-sqlite's browser worker loads SQLite from this WebAssembly asset.
if (!config.resolver.assetExts.includes('wasm')) config.resolver.assetExts.push('wasm');
const existingEnhancer = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const enhanced = existingEnhancer ? existingEnhancer(middleware, server) : middleware;
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return enhanced(req, res, next);
  };
};
module.exports = config;
