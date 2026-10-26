import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ventra.app',
  appName: 'Ventra',
  webDir: '../web/out',
  backgroundColor: '#050914',
  server: {
    androidScheme: 'http',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    webContentsDebuggingEnabled: true,
    preferredContentMode: 'mobile',
  },
};

export default config;

