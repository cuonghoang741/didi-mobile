import { ConfigContext, ExpoConfig } from 'expo/config';
import { version } from './package.json';

// EAS config
const EAS_PROJECT_ID = '37b8fd77-a4c4-4e56-bdba-7d53472c2c65';
const PROJECT_SLUG = 'didi';

// App production config
const APP_NAME = 'DiDi Moibile';
const BUNDLE_IDENTIFIER = 'com.didimobile';
const PACKAGE_NAME = 'didi.mobile.app';
const ICON = './src/assets/images/logo.png';
const ANDROID_ICON_FOREGROUND = './src/assets/images/logo.png';
const ANDROID_ICON_BACKGROUND = './src/assets/images/logo.png';
const ANDROID_ICON_MONOCHROME = './src/assets/images/logo.png';
const SCHEME = 'didi';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: APP_NAME,
  icon: ICON,
  scheme: [SCHEME],
  version,
  slug: PROJECT_SLUG,
  orientation: 'portrait',
  userInterfaceStyle: 'light', // Force light theme
  newArchEnabled: true,
  extra: {
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: BUNDLE_IDENTIFIER,
    // appleTeamId: '20174103150',
    buildNumber: '1', // Increment this number for each new build
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSPhotoLibraryUsageDescription:
        '支払証明書のアップロードなどのために、写真ライブラリへのアクセスが必要です。',
      NSCameraUsageDescription:
        '支払証明書の撮影、住所確認、またはプロフィール写真の設定のためにカメラへのアクセスが必要です。例：銀行振込明細書の撮影。',
    },
    // iPhone 17 Pro Max specific settings
    requireFullScreen: false,
    // supportsTablet: false, // Disable tablet support for phone-only app
  },
  android: {
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: ANDROID_ICON_FOREGROUND,
      backgroundImage: ANDROID_ICON_BACKGROUND,
      monochromeImage: ANDROID_ICON_MONOCHROME,
    },
    package: PACKAGE_NAME,
    edgeToEdgeEnabled: true, // Only this line remains in Android general config
    predictiveBackGestureEnabled: false,
    permissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_IMAGES',
    ],
    versionCode: 3,
  },
  plugins: [
    'expo-router',
    './withCustomPodfile',
    './withEntitlementsModification',
    [
      'expo-splash-screen',
      {
        image: './src/assets/images/logo.png',
        imageWidth: 300,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        color: '#ffffff',
      },
    ],
    'expo-updates',
    'expo-web-browser',
    [
      'expo-media-library',
      {
        photosPermission:
          'Ứng dụng cần quyền truy cập thư viện ảnh để bạn có thể chọn ảnh bằng chứng thanh toán.',
        savePhotosPermission: false,
        isAccessMediaLocationEnabled: false,
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
