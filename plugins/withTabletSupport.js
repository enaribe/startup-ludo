/**
 * Expo Config Plugin — Support des tablettes Android sur le Play Store
 *
 * Certaines permissions (caméra via expo-image-picker, etc.) font qu'Android
 * ajoute implicitement des <uses-feature ... required="true"> dans le manifest.
 * Le Play Store exclut alors les appareils dépourvus de ce matériel — typiquement
 * les tablettes sans caméra arrière / autofocus.
 *
 * Ce plugin déclare explicitement ces features comme NON requises, ce qui rend
 * l'app de nouveau visible et installable sur tablettes.
 */

const { withAndroidManifest } = require('@expo/config-plugins');

// Features matérielles à marquer comme optionnelles pour ne pas exclure de tablettes.
const OPTIONAL_FEATURES = [
  'android.hardware.camera',
  'android.hardware.camera.any',
  'android.hardware.camera.front',
  'android.hardware.camera.autofocus',
  'android.hardware.camera.flash',
  'android.hardware.location',
  'android.hardware.location.gps',
  'android.hardware.location.network',
  'android.hardware.telephony',
  'android.hardware.touchscreen',
  'android.hardware.touchscreen.multitouch',
  'android.hardware.microphone',
  'android.hardware.bluetooth',
  'android.hardware.wifi',
  'android.hardware.sensor.accelerometer',
  'android.hardware.sensor.compass',
  'android.hardware.sensor.gyroscope',
];

const withTabletSupport = (config) => {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;

    if (!Array.isArray(manifest['uses-feature'])) {
      manifest['uses-feature'] = [];
    }

    const usesFeature = manifest['uses-feature'];

    for (const featureName of OPTIONAL_FEATURES) {
      const existing = usesFeature.find(
        (f) => f.$ && f.$['android:name'] === featureName
      );

      if (existing) {
        // Force la feature existante en non-requise
        existing.$['android:required'] = 'false';
      } else {
        // Déclare explicitement la feature comme non-requise
        usesFeature.push({
          $: {
            'android:name': featureName,
            'android:required': 'false',
          },
        });
      }
    }

    console.log('✅ [withTabletSupport] uses-feature matérielles marquées required="false"');

    return modConfig;
  });
};

module.exports = withTabletSupport;
