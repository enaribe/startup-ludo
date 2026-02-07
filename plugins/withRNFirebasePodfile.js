const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin Expo pour corriger les erreurs de build iOS avec React Native Firebase
 * Basé sur: https://github.com/expo/expo/issues/39607
 */
module.exports = function withRNFirebasePodfile(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

      // Vérifier si la modification n'a pas déjà été appliquée
      if (podfileContent.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
        return config;
      }

      // Ajouter le post_install hook pour corriger les erreurs non-modular
      const postInstallHook = `
  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
      :ccache_enabled => ccache_enabled?(podfile_properties),
    )

    # Fix pour React Native Firebase - permet les includes non-modulaires
    # Voir: https://github.com/expo/expo/issues/39607
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB')
        target.build_configurations.each do |config|
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
          config.build_settings['OTHER_CFLAGS'] ||= ['$(inherited)']
          config.build_settings['OTHER_CFLAGS'] << '-Wno-non-modular-include-in-framework-module'
        end
      end
    end
  end`;

      // Remplacer le post_install existant
      podfileContent = podfileContent.replace(
        /post_install do \|installer\|[\s\S]*?end\s*end/,
        postInstallHook + '\nend'
      );

      fs.writeFileSync(podfilePath, podfileContent);

      return config;
    },
  ]);
};
