const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin Expo pour corriger les erreurs de build iOS avec React Native Firebase
 * Fix pour: https://github.com/expo/expo/issues/39607
 *
 * Ajoute CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES pour les pods RNFB
 */
module.exports = function withRNFirebasePodfile(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

      // Skip if already patched
      if (podfileContent.includes('# RNFB Modular Headers Fix')) {
        return config;
      }

      // The fix code to add inside post_install
      const rnfbFix = `
    # RNFB Modular Headers Fix
    # See: https://github.com/expo/expo/issues/39607
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB') || target.name.include?('Firebase')
        target.build_configurations.each do |build_config|
          build_config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        end
      end
    end
`;

      // Find the line with react_native_post_install closing parenthesis
      // and insert our fix after it
      const lines = podfileContent.split('\n');
      let insertIndex = -1;
      let inPostInstall = false;
      let parenCount = 0;
      let foundReactNativePostInstall = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.includes('post_install do |installer|')) {
          inPostInstall = true;
        }

        if (inPostInstall && line.includes('react_native_post_install')) {
          foundReactNativePostInstall = true;
        }

        // Count parentheses to find where react_native_post_install ends
        if (foundReactNativePostInstall) {
          for (const char of line) {
            if (char === '(') parenCount++;
            if (char === ')') parenCount--;
          }
          // When we close all parens, the call is complete
          if (parenCount === 0 && line.includes(')')) {
            insertIndex = i + 1;
            break;
          }
        }
      }

      if (insertIndex > 0) {
        lines.splice(insertIndex, 0, rnfbFix);
        podfileContent = lines.join('\n');
        fs.writeFileSync(podfilePath, podfileContent);
      }

      return config;
    },
  ]);
};
