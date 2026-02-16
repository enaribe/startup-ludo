/**
 * Expo Config Plugin for Google Sign-In
 * Adds the REVERSED_CLIENT_ID URL Scheme to iOS Info.plist
 */

const { withInfoPlist } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Extract REVERSED_CLIENT_ID from GoogleService-Info.plist
 */
function getReversedClientId(projectRoot) {
  const plistPath = path.join(projectRoot, 'GoogleService-Info.plist');

  if (!fs.existsSync(plistPath)) {
    console.warn('⚠️  GoogleService-Info.plist not found, skipping Google Sign-In URL Scheme');
    return null;
  }

  try {
    const plistContent = fs.readFileSync(plistPath, 'utf8');
    const match = plistContent.match(/<key>REVERSED_CLIENT_ID<\/key>\s*<string>([^<]+)<\/string>/);

    if (match && match[1]) {
      console.log('✅ Found REVERSED_CLIENT_ID:', match[1]);
      return match[1];
    }
  } catch (error) {
    console.error('❌ Error reading GoogleService-Info.plist:', error);
  }

  return null;
}

/**
 * Add Google Sign-In URL Scheme to iOS Info.plist
 */
const withGoogleSignIn = (config) => {
  return withInfoPlist(config, (modConfig) => {
    const reversedClientId = getReversedClientId(modConfig.modRequest.projectRoot);

    if (!reversedClientId) {
      return modConfig;
    }

    // Ensure CFBundleURLTypes exists
    if (!modConfig.modResults.CFBundleURLTypes) {
      modConfig.modResults.CFBundleURLTypes = [];
    }

    // Check if Google URL Scheme already exists
    const existingScheme = modConfig.modResults.CFBundleURLTypes.find((urlType) =>
      urlType.CFBundleURLSchemes?.includes(reversedClientId)
    );

    if (!existingScheme) {
      // Add Google Sign-In URL Scheme
      modConfig.modResults.CFBundleURLTypes.push({
        CFBundleTypeRole: 'Editor',
        CFBundleURLSchemes: [reversedClientId],
      });
      console.log('✅ Added Google Sign-In URL Scheme to Info.plist');
    } else {
      console.log('ℹ️  Google Sign-In URL Scheme already exists');
    }

    return modConfig;
  });
};

module.exports = withGoogleSignIn;
