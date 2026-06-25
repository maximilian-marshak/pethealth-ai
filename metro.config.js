// ══════════════════════════════════════════════════════════════
// metro.config.js — расширяет дефолт Expo.
// design/ — справочный веб-прототип (React+Babel, .jsx/.html), из src/ не
// импортируется и НЕ является частью приложения. Исключаем его из Metro,
// чтобы воркер/резолвер не пытался бандлить веб-jsx.
// ══════════════════════════════════════════════════════════════
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [/[\\/]design[\\/].*/];

module.exports = config;
