const fs = require('fs');
const path = require('path');

const IS_FORUM = process.env.EXPO_PUBLIC_APP_MODE === 'forum';

const DEFAULT_ICON = './assets/images/iconludo.png';
const FORUM_ICON_CANDIDATE = './assets/images/iconludo-forum.png';
const resolvedIcon =
  IS_FORUM &&
  fs.existsSync(path.join(__dirname, 'assets', 'images', 'iconludo-forum.png'))
    ? FORUM_ICON_CANDIDATE
    : DEFAULT_ICON;

module.exports = {
  expo: {
    name: IS_FORUM ? 'Startup Ludo — Forum' : 'Startup Ludo',
    slug: 'startup-ludo',
    version: '2.0.3',
    orientation: 'portrait',
    icon: resolvedIcon,
    scheme: 'startupludo',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.startupludo.app',
      buildNumber: '35',
      googleServicesFile: './GoogleService-Info.plist',
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ['remote-notification'],
      },
    },
    android: {
      package: 'com.startupludo.app',
      versionCode: 35,
      googleServicesFile: './google-services.json',
      adaptiveIcon: {
        backgroundColor: '#0C243E',
        foregroundImage: resolvedIcon,
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      [
        'expo-router',
        {
          root: './src/app',
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/ludol.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#0C243E',
        },
      ],
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
            deploymentTarget: '15.1',
            buildReactNativeFromSource: true,
          },
        },
      ],
      '@react-native-firebase/app',
      './plugins/withRNFirebasePodfile.js',
      '@react-native-firebase/auth',
      '@react-native-google-signin/google-signin',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      appMode: process.env.EXPO_PUBLIC_APP_MODE ?? 'normal',
      eventName: process.env.EXPO_PUBLIC_EVENT_NAME ?? '',
      storeUrl: process.env.EXPO_PUBLIC_STORE_URL ?? '',
      router: {},
      eas: {
        projectId: '85630621-2ecd-450e-a7ff-e3df54cc76f2',
      },
    },
  },
};
