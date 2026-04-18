import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "MotoControle",
  slug: "motocontrole",
  version: "1.9.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "motocontrole",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.motocontrole.app",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    package: "com.motocontrole.app",
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "motocontrole",
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 24,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  owner: "weesleymtesu2",
  extra: {
    eas: {
      projectId: "dcb46acf-ca5a-4497-a7df-bb1fe0724bf5",
    },
  },
};

export default config;
