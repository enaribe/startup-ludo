/**
 * ForceUpdatePopup — Mise à jour obligatoire de l'application.
 *
 * Écoute le document Firestore `appConfig/version` (géré depuis l'admin).
 * Si la version installée est strictement inférieure à `minSupportedVersion`,
 * affiche un popup BLOQUANT (aucune fermeture possible : ni back, ni backdrop)
 * avec un bouton qui ouvre la fiche du store.
 *
 * Monté une seule fois au niveau racine de l'app (_layout.tsx).
 * Fail-open : si la config est absente/illisible, l'app reste utilisable.
 */

import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { memo, useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, Text } from 'react-native';

import { GameButton } from '@/components/ui/GameButton';
import { GamePopup } from '@/components/ui/GamePopup';
import {
  subscribeToAppVersionConfig,
  type AppVersionConfig,
} from '@/services/firebase/appConfigService';
import { useTranslation } from '@/i18n';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { isVersionBelow } from '@/utils/version';

/** Fiche Play Store par défaut si l'admin n'a pas renseigné de lien. */
const DEFAULT_ANDROID_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.startupludo.app';

/** Version installée de l'app (app.json / build natif). */
function getCurrentVersion(): string {
  return Constants.expoConfig?.version ?? '';
}

function getStoreUrl(config: AppVersionConfig): string | null {
  if (Platform.OS === 'ios') {
    return config.iosStoreUrl || null;
  }
  return config.androidStoreUrl || DEFAULT_ANDROID_STORE_URL;
}

export const ForceUpdatePopup = memo(function ForceUpdatePopup() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<AppVersionConfig | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAppVersionConfig(setConfig);
    return unsubscribe;
  }, []);

  const currentVersion = getCurrentVersion();
  const updateRequired =
    !!config &&
    !!currentVersion &&
    isVersionBelow(currentVersion, config.minSupportedVersion);

  if (!updateRequired || !config) return null;

  const storeUrl = getStoreUrl(config);

  return (
    <GamePopup
      visible
      // Popup volontairement infermable : le back Android ne fait rien.
      onRequestClose={() => {}}
      header={t('forceUpdate.header')}
      title={t('forceUpdate.title')}
      icon={<Ionicons name="cloud-download-outline" size={58} color="#1F91D0" />}
    >
      <Text style={styles.description}>
        {config.message || t('forceUpdate.description')}
      </Text>

      {storeUrl ? (
        <GameButton
          variant="yellow"
          fullWidth
          title={t('forceUpdate.button')}
          onPress={() => {
            Linking.openURL(storeUrl).catch(() => {
              // Silencieux : l'utilisateur peut réessayer, le popup reste affiché.
            });
          }}
        />
      ) : null}
    </GamePopup>
  );
});

const styles = StyleSheet.create({
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING[4],
    paddingHorizontal: SPACING[2],
  },
});
