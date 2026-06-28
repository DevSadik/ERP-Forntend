import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sugarstock.erp',
  appName: 'SugarStock ERP',
  webDir: 'build',
  bundledWebRuntime: false,
  server: {
    // For development: point to your backend IP on your local network
    // Change this to your computer's local IP address (e.g. 192.168.1.10)
    // For production build: remove the androidScheme and url lines below
    androidScheme: 'http',
  },
  android: {
    buildOptions: {
      releaseType: 'APK',
    },
    backgroundColor: '#0b121e',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0b121e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#10b981',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#111827',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#10b981',
    },
  },
};

export default config;
