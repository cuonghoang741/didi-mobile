import { ConfigContext, ExpoConfig } from 'expo/config';
import { version } from './package.json';

// EAS config
const EAS_PROJECT_ID = '576fee91-3850-4230-a524-ba3d556f8fda';
const PROJECT_SLUG = 'basecode';

// App production config
const APP_NAME = 'Base Code';
const BUNDLE_IDENTIFIER = 'com.basecode.app';
const PACKAGE_NAME = 'com.basecode.app';
const ICON = './src/assets/images/icon.png';
const ANDROID_ICON_FOREGROUND = './src/assets/images/icon.png';
const ANDROID_ICON_BACKGROUND = './src/assets/images/icon.png';
const ANDROID_ICON_MONOCHROME = './src/assets/images/icon.png';
const SCHEME = 'basecode';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: APP_NAME,
  icon: ICON,
  scheme: [SCHEME],
  version,
  slug: PROJECT_SLUG,
  orientation: 'portrait',
  userInterfaceStyle: 'dark', // Force dark theme
  newArchEnabled: true,
  extra: {
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: BUNDLE_IDENTIFIER,
    appleTeamId: '6BZ59393SB',
    buildNumber: '1', // Increment this number for each new build
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSPhotoLibraryUsageDescription:
        'We need access to your Photo Library to save generated logos to your Photos.',
      NSPhotoLibraryAddUsageDescription:
        'We need permission to add logos to your Photo Library when you download them.',
    },
    // iPhone 17 Pro Max specific settings
    requireFullScreen: false,
    // supportsTablet: false, // Disable tablet support for phone-only app
    googleServicesFile: './GoogleService-Info.plist',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: ANDROID_ICON_FOREGROUND,
      backgroundImage: ANDROID_ICON_BACKGROUND,
      monochromeImage: ANDROID_ICON_MONOCHROME,
    },
    package: PACKAGE_NAME,
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_IMAGES',
    ],
    versionCode: 3,
    googleServicesFile: './google-services.json',
  },
  web: {
    output: 'static',
    favicon: './src/assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    '@react-native-firebase/app',
    './withCustomPodfile',
    [
      'expo-splash-screen',
      {
        image: './src/assets/images/logo-with-text.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#000000',
        color: '#ffffff',
      },
    ],
    'expo-updates',
    'expo-web-browser',
    [
      'expo-media-library',
      {
        photosPermission:
          'We need access to your Photo Library to save generated logos to your Photos.',
        savePhotosPermission:
          'We need permission to add logos to your Photo Library when you download them.',
        isAccessMediaLocationEnabled: true,
      },
    ],
    [
      'onesignal-expo-plugin',
      {
        mode: 'production',
      },
    ],
  ],
  updates: {
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
