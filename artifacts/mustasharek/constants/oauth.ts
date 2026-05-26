/**
 * OAuth credentials — fill in your client IDs to enable social login.
 *
 * Google  → https://console.cloud.google.com  (OAuth 2.0 Client ID, application type: Android / iOS / Web)
 * Facebook → https://developers.facebook.com  (App ID)
 * Microsoft → https://portal.azure.com        (App Registration → Application Client ID)
 */
const OAUTH = {
  google: {
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "",
    // Android: also add androidClientId + iosClientId from Google Console
  },
  facebook: {
    appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? "",
  },
  microsoft: {
    clientId: process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID ?? "",
    tenantId: "common", // or your tenant id
  },
};

export default OAUTH;
