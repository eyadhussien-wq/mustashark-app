/**
 * OAuth credentials — fill in your client IDs to enable social login.
 *
 * Google  → https://console.cloud.google.com
 *           OAuth 2.0 Client ID (application type: Android / iOS / Web)
 *           Required scopes: openid, profile, email
 *
 * Facebook → https://developers.facebook.com
 *            App ID (Consumer app with Facebook Login product)
 *            Required permissions: email, public_profile
 *
 * Apple   → No client ID needed for native iOS Sign In with Apple.
 *           Requires Apple Developer account + "Sign In with Apple" capability.
 */
const OAUTH = {
  google: {
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "",
  },
  facebook: {
    appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? "",
  },
  apple: {
    // Native iOS — no client ID required; handled by the OS.
  },
};

export default OAUTH;
