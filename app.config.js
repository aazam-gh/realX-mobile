const baseConfig = require('./app.json');

const variant = process.env.APP_VARIANT === 'production' ? 'production' : 'development';
const isDev = variant === 'development';

const devIosServicesFile = './firebase/dev/GoogleService-Info.plist';
const devAndroidServicesFile = './firebase/dev/google-services.json';

module.exports = () => {
  const expo = baseConfig.expo;

  return {
    expo: {
      ...expo,
      name: isDev ? 'realX Dev' : expo.name,
      scheme: isDev ? 'reelx-dev' : expo.scheme,
      ios: {
        ...expo.ios,
        bundleIdentifier: isDev ? 'com.reelx.app.dev' : 'com.reelx.app',
        googleServicesFile: isDev ? devIosServicesFile : './GoogleService-Info.plist',
      },
      android: {
        ...expo.android,
        package: isDev ? 'com.reelx.app.dev' : 'com.reelx.app',
        googleServicesFile: isDev ? devAndroidServicesFile : './google-services.json',
      },
      extra: {
        ...expo.extra,
        appVariant: variant,
      },
    },
  };
};
