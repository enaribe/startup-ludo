# Fix: Problème de Build Expo avec React Native Firebase

## Problème rencontré

Lors du déploiement d'une application Expo utilisant `@react-native-firebase`, des erreurs de build apparaissent, notamment sur iOS. Le problème est lié à la gestion des headers modulaires par Firebase dans un contexte Expo.

**Erreur typique:**
```
Module 'Firebase' not found
CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES
```

**Issue de référence:** https://github.com/expo/expo/issues/39607

## Solution

La solution nécessite 3 étapes principales:

### 1. Créer un plugin Expo personnalisé pour le Podfile

Créez le fichier `plugins/withRNFirebasePodfile.js` à la racine de votre projet:

```javascript
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
```

### 2. Configurer app.json correctement

Dans votre `app.json`, ajoutez les configurations suivantes:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static",
            "deploymentTarget": "15.1",
            "buildReactNativeFromSource": true
          }
        }
      ],
      "@react-native-firebase/app",
      "./plugins/withRNFirebasePodfile.js",
      "@react-native-firebase/auth"
    ],
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

**Points importants:**
- Le plugin `expo-build-properties` DOIT être déclaré AVANT les plugins Firebase
- `useFrameworks: "static"` est essentiel pour la compatibilité
- Le plugin personnalisé `./plugins/withRNFirebasePodfile.js` doit être ajouté APRÈS `@react-native-firebase/app`

### 3. Installer les dépendances

```bash
npm install @react-native-firebase/app @react-native-firebase/auth
npm install expo-build-properties
```

### 4. Ajouter vos fichiers de configuration Firebase

Placez vos fichiers de configuration Firebase à la racine du projet:
- `GoogleService-Info.plist` (iOS)
- `google-services.json` (Android)

### 5. Prébuild et test

```bash
# Nettoyer les builds précédents
rm -rf ios android

# Générer les dossiers natifs
npx expo prebuild

# Pour iOS
npx expo run:ios

# Pour Android
npx expo run:android
```

## Bonus: Plugin Google Sign-In (optionnel)

Si vous utilisez Google Sign-In, créez également `plugins/withGoogleSignIn.js`:

```javascript
const { withInfoPlist } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Extract REVERSED_CLIENT_ID from GoogleService-Info.plist
 */
function getReversedClientId(projectRoot) {
  const plistPath = path.join(projectRoot, 'GoogleService-Info.plist');

  if (!fs.existsSync(plistPath)) {
    console.warn('⚠️  GoogleService-Info.plist not found');
    return null;
  }

  try {
    const plistContent = fs.readFileSync(plistPath, 'utf8');
    const match = plistContent.match(/<key>REVERSED_CLIENT_ID<\/key>\s*<string>([^<]+)<\/string>/);

    if (match && match[1]) {
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

    if (!modConfig.modResults.CFBundleURLTypes) {
      modConfig.modResults.CFBundleURLTypes = [];
    }

    const existingScheme = modConfig.modResults.CFBundleURLTypes.find((urlType) =>
      urlType.CFBundleURLSchemes?.includes(reversedClientId)
    );

    if (!existingScheme) {
      modConfig.modResults.CFBundleURLTypes.push({
        CFBundleTypeRole: 'Editor',
        CFBundleURLSchemes: [reversedClientId],
      });
      console.log('✅ Added Google Sign-In URL Scheme');
    }

    return modConfig;
  });
};

module.exports = withGoogleSignIn;
```

Puis ajoutez dans `app.json`:

```json
{
  "expo": {
    "plugins": [
      "@react-native-google-signin/google-signin",
      "./plugins/withGoogleSignIn.js"
    ]
  }
}
```

## Package.json - Dépendances recommandées

```json
{
  "dependencies": {
    "@react-native-firebase/app": "^23.8.6",
    "@react-native-firebase/auth": "^23.8.6",
    "@react-native-firebase/firestore": "^23.8.6",
    "@react-native-google-signin/google-signin": "^16.1.1",
    "expo-build-properties": "^1.0.10"
  }
}
```

## Ordre d'exécution recommandé

1. Créer le dossier `plugins/` à la racine
2. Créer les fichiers de plugin
3. Modifier `app.json` avec les plugins dans le bon ordre
4. Installer les dépendances
5. Ajouter les fichiers Firebase
6. Supprimer les dossiers `ios/` et `android/` existants
7. Exécuter `npx expo prebuild`
8. Tester le build

## Troubleshooting

### Erreur "Module Firebase not found"
- Vérifiez que `useFrameworks: "static"` est bien configuré
- Supprimez `ios/` et relancez `npx expo prebuild`

### Erreur lors du prebuild
- Assurez-vous que les plugins sont dans le bon ordre dans `app.json`
- Le plugin personnalisé doit être APRÈS `@react-native-firebase/app`

### Les pods ne s'installent pas
```bash
cd ios
pod install --repo-update
cd ..
```

### Build EAS
Si vous utilisez EAS Build, ajoutez dans `eas.json`:

```json
{
  "build": {
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

## Ressources

- [Issue GitHub Expo #39607](https://github.com/expo/expo/issues/39607)
- [React Native Firebase Docs](https://rnfirebase.io/)
- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)

## Conclusion

Cette solution a été testée et fonctionne avec:
- Expo SDK 54
- React Native Firebase v23.8.6
- iOS 15.1+
- Android API 24+

La clé du succès est l'ordre des plugins et la configuration `expo-build-properties` avec `useFrameworks: "static"`.
