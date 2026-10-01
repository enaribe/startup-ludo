/**
 * IdeationPopup — idéation COMPLÈTE dans un popup, sans changer d'écran.
 *
 * Affiché depuis la configuration de partie locale quand le joueur n'a
 * aucune startup compatible avec l'édition choisie. Cinq étapes dans le
 * même GamePopup :
 *   1. intro    — « tu n'as pas d'entreprise pour jouer ici »
 *   2. secteur  — parmi les secteurs de l'ÉDITION uniquement
 *   3. cible    — carte existante OU texte libre
 *   4. mission  — carte existante OU texte libre
 *   5. projet   — généré par l'IA (3 idées) OU écrit à la main
 * puis création (valorisation IA + portfolio + Firestore + XP, même recette
 * que l'écran de confirmation) et bouton JOUER — le parent lance la partie.
 */

import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { GameButton, GamePopup } from '@/components/ui';
import { TARGET_CARDS, MISSION_CARDS, SECTOR_CARDS } from '@/constants';
import { getEditionSectors, type DefaultProject } from '@/data/defaultProjects';
import { useTranslation } from '@/i18n';
import { generateStartupIdeas, generateValuation, type GeneratedIdea } from '@/services/ai';
import { addStartup as firestoreAddStartup, updateUserStats } from '@/services/firebase/firestore';
import { useAuthStore, useSettingsStore, useUserStore } from '@/stores';
import { XP_REWARDS } from '@/config/progression';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { formatFCFARaw } from '@/utils/currency';
import type { MissionCard, SectorCard, Startup, TargetCard } from '@/types';

const BASE_VALUATION = 10_000;

type Step = 'intro' | 'defaults' | 'sector' | 'target' | 'mission' | 'project' | 'launch';

interface IdeationPopupProps {
  visible: boolean;
  editionId: string;
  /** Nom localisé de l'édition (affiché dans les textes). */
  editionName: string;
  /** Projets par défaut de l'édition (choix rapide sans idéation complète). */
  defaultProjects: DefaultProject[];
  /** Fermeture sans créer (retour au choix d'édition). */
  onClose: () => void;
  /** Startup créée, prête à jouer — au parent de lancer la partie. */
  onComplete: (startup: Startup) => void;
  /** Projet par défaut choisi à la place de l'idéation — au parent de lancer la partie. */
  onPickDefault: (project: DefaultProject) => void;
}

/** Idées de secours si l'IA est indisponible (jamais bloquer le joueur). */
function fallbackIdeas(sectorTitle: string): GeneratedIdea[] {
  return [1, 2, 3].map((n) => ({
    id: `fallback_${n}`,
    title: `${sectorTitle} Express ${n}`,
    description: `Une startup ${sectorTitle.toLowerCase()} qui simplifie la vie de ses clients.`,
  }));
}

export function IdeationPopup({
  visible,
  editionId,
  editionName,
  defaultProjects,
  onClose,
  onComplete,
  onPickDefault,
}: IdeationPopupProps) {
  const { t } = useTranslation();
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const addStartup = useUserStore((s) => s.addStartup);
  const addXP = useUserStore((s) => s.addXP);
  const userId = useAuthStore((s) => s.user?.id);
  const userName = useAuthStore((s) => s.user?.displayName);

  const [step, setStep] = useState<Step>('intro');
  const [defaultChoice, setDefaultChoice] = useState<DefaultProject | null>(null);
  const [sectorCard, setSectorCard] = useState<SectorCard | null>(null);
  // Cible / mission : une carte du catalogue OU un texte libre
  const [targetCard, setTargetCard] = useState<TargetCard | null>(null);
  const [targetCustom, setTargetCustom] = useState('');
  const [missionCard, setMissionCard] = useState<MissionCard | null>(null);
  const [missionCustom, setMissionCustom] = useState('');
  // Projet : idées générées ou saisie manuelle
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<number | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  // Création finale
  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState<{ startup: Startup; xp: number } | null>(null);
  const creatingRef = useRef(false);

  // Secteurs de l'édition uniquement (fallback : tous, ne jamais bloquer)
  const editionSectorCards = useMemo(() => {
    const allowed = new Set(getEditionSectors(editionId).map((s) => s.toLowerCase()));
    const filtered = SECTOR_CARDS.filter((c) => allowed.has(c.id.toLowerCase()));
    return filtered.length > 0 ? filtered : SECTOR_CARDS;
  }, [editionId]);

  const haptic = () => {
    if (hapticsEnabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const reset = () => {
    setStep('intro');
    setDefaultChoice(null);
    setSectorCard(null);
    setTargetCard(null);
    setTargetCustom('');
    setMissionCard(null);
    setMissionCustom('');
    setIdeas([]);
    setSelectedIdea(null);
    setManualMode(false);
    setManualName('');
    setManualDesc('');
    setIsGenerating(false);
    setIsCreating(false);
    setCreated(null);
    creatingRef.current = false;
  };

  const fermer = () => {
    // Pas de fermeture pendant la création (écriture en cours)
    if (isCreating) return;
    reset();
    onClose();
  };

  const targetTitle = targetCard?.title ?? targetCustom.trim();
  const missionTitle = missionCard?.title ?? missionCustom.trim();
  const targetOk = !!targetCard || targetCustom.trim().length >= 3;
  const missionOk = !!missionCard || missionCustom.trim().length >= 3;

  const projet = manualMode
    ? { name: manualName.trim(), description: manualDesc.trim() }
    : selectedIdea != null && ideas[selectedIdea]
      ? { name: ideas[selectedIdea]!.title, description: ideas[selectedIdea]!.description }
      : null;
  const projetOk = manualMode
    ? manualName.trim().length >= 2 && manualDesc.trim().length >= 2
    : selectedIdea != null;

  const genererIdees = async () => {
    setIsGenerating(true);
    setIdeas([]);
    setSelectedIdea(null);
    try {
      const result = await generateStartupIdeas(targetTitle, missionTitle, sectorCard?.title);
      setIdeas(result ?? fallbackIdeas(sectorCard?.title ?? editionName));
    } catch {
      setIdeas(fallbackIdeas(sectorCard?.title ?? editionName));
    } finally {
      setIsGenerating(false);
      if (hapticsEnabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  /**
   * Création finale — même recette que l'écran de confirmation : valorisation
   * IA (fallback multiplicateurs), portfolio local, Firestore, XP. Le
   * tracking Amplitude (startup_created) part via addStartup du store.
   */
  const creer = async () => {
    if (!projet || !sectorCard || creatingRef.current) return;
    creatingRef.current = true;
    setStep('launch');
    setIsCreating(true);

    const targetMult = targetCard?.xpMultiplier ?? 1.0;
    const missionMult = missionCard?.xpMultiplier ?? 1.0;
    const sectorMult = sectorCard.xpMultiplier ?? 1.0;

    let valorisation = Math.round(BASE_VALUATION * targetMult * missionMult * sectorMult);
    try {
      const ai = await generateValuation({
        target: targetTitle,
        mission: missionTitle,
        sector: sectorCard.title,
        startupName: projet.name,
        startupDescription: projet.description,
      });
      if (ai) valorisation = ai.valorisation;
    } catch {
      // fallback multiplicateurs
    }

    const baseXP = XP_REWARDS.STARTUP_CREATED?.amount ?? 25;
    const xpReward = Math.round(baseXP * ((targetMult + missionMult + sectorMult) / 3));

    const startup: Startup = {
      id: `startup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: projet.name,
      sector: sectorCard.id,
      description: projet.description,
      targetCard: targetCard ?? {
        id: 'custom_target',
        category: 'demographic',
        title: targetTitle,
        description: '',
        rarity: 'common',
        xpMultiplier: 1,
      },
      missionCard: missionCard ?? {
        id: 'custom_mission',
        category: 'efficiency',
        title: missionTitle,
        description: '',
        rarity: 'common',
        xpMultiplier: 1,
      },
      createdAt: Date.now(),
      tokensInvested: valorisation,
      valorisation,
      level: 1,
      creatorId: userId ?? undefined,
      creatorName: userName ?? undefined,
    };

    addStartup(startup);
    if (userId) {
      firestoreAddStartup(userId, startup).catch((err) =>
        console.error('[IdeationPopup] Firestore save failed:', err)
      );
      updateUserStats(userId, { xpGained: xpReward }).catch((err) =>
        console.error('[IdeationPopup] XP sync failed:', err)
      );
    }
    addXP(xpReward);

    if (hapticsEnabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsCreating(false);
    setCreated({ startup, xp: xpReward });
  };

  // ── Contenus par étape ──

  const titles: Record<Step, string> = {
    intro: t('inlineIdeation.introTitle'),
    defaults: t('inlineIdeation.defaultsTitle'),
    sector: t('inlineIdeation.sectorTitle'),
    target: t('inlineIdeation.targetTitle'),
    mission: t('inlineIdeation.missionTitle'),
    project: t('inlineIdeation.projectTitle'),
    launch: created ? t('inlineIdeation.readyTitle') : t('inlineIdeation.creatingTitle'),
  };

  const stepIndex = ['sector', 'target', 'mission', 'project'].indexOf(step);

  const renderOptionRow = (
    key: string,
    label: string,
    actif: boolean,
    onPress: () => void,
    sub?: string
  ) => (
    <Pressable key={key} onPress={onPress} style={[styles.row, actif && styles.rowActive]}>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowLabel, actif && styles.rowLabelActive]} numberOfLines={2}>
          {label}
        </Text>
        {sub ? (
          <Text style={styles.rowSub} numberOfLines={2}>
            {sub}
          </Text>
        ) : null}
      </View>
      {actif && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
    </Pressable>
  );

  return (
    <GamePopup
      visible={visible}
      onRequestClose={fermer}
      showCloseButton
      closeOnBackdrop={!isCreating}
      header={editionName}
      title={titles[step]}
      icon={
        step === 'intro' ? (
          <View style={styles.iconCircle}>
            <Ionicons name="bulb" size={34} color="#FFBC40" />
          </View>
        ) : undefined
      }
      footer={
        <>
          {step === 'intro' && (
            <>
              <GameButton
                variant="yellow"
                fullWidth
                title={t('inlineIdeation.startCta')}
                onPress={() => {
                  haptic();
                  setStep('sector');
                }}
                style={styles.footerBtn}
              />
              {defaultProjects.length > 0 && (
                <GameButton
                  variant="blue"
                  fullWidth
                  title={t('inlineIdeation.pickDefaultCta')}
                  onPress={() => {
                    haptic();
                    setStep('defaults');
                  }}
                  style={styles.footerBtn}
                />
              )}
            </>
          )}
          {step === 'defaults' && (
            <GameButton
              variant="yellow"
              fullWidth
              title={t('inlineIdeation.playCta')}
              disabled={!defaultChoice}
              onPress={() => {
                if (!defaultChoice) return;
                haptic();
                const projet = defaultChoice;
                reset();
                onPickDefault(projet);
              }}
              style={styles.footerBtn}
            />
          )}
          {step === 'sector' && (
            <GameButton
              variant="yellow"
              fullWidth
              title={t('common.next')}
              disabled={!sectorCard}
              onPress={() => {
                haptic();
                setStep('target');
              }}
              style={styles.footerBtn}
            />
          )}
          {step === 'target' && (
            <GameButton
              variant="yellow"
              fullWidth
              title={t('common.next')}
              disabled={!targetOk}
              onPress={() => {
                haptic();
                setStep('mission');
              }}
              style={styles.footerBtn}
            />
          )}
          {step === 'mission' && (
            <GameButton
              variant="yellow"
              fullWidth
              title={t('common.next')}
              disabled={!missionOk}
              onPress={() => {
                haptic();
                setStep('project');
              }}
              style={styles.footerBtn}
            />
          )}
          {step === 'project' && (
            <GameButton
              variant="yellow"
              fullWidth
              title={t('inlineIdeation.createCta')}
              disabled={!projetOk || isGenerating}
              onPress={() => void creer()}
              style={styles.footerBtn}
            />
          )}
          {step === 'launch' && created && (
            <GameButton
              variant="yellow"
              fullWidth
              title={t('inlineIdeation.playCta')}
              onPress={() => {
                const startup = created.startup;
                reset();
                onComplete(startup);
              }}
              style={styles.footerBtn}
            />
          )}
        </>
      }
    >
      {/* Progression (étapes 2→5) */}
      {stepIndex >= 0 && (
        <View style={styles.progressRow}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]} />
          ))}
        </View>
      )}

      {step === 'intro' && (
        <Text style={styles.body}>
          {t('inlineIdeation.introBody', { edition: editionName })}
        </Text>
      )}

      {step === 'defaults' && (
        <>
          <Text style={styles.body}>{t('inlineIdeation.defaultsBody')}</Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {defaultProjects.map((p) =>
              renderOptionRow(
                p.id,
                p.name,
                defaultChoice?.id === p.id,
                () => {
                  haptic();
                  setDefaultChoice(p);
                },
                p.sector
              )
            )}
          </ScrollView>
          <Pressable
            onPress={() => {
              haptic();
              setStep('sector');
            }}
            hitSlop={8}
          >
            <Text style={styles.switchModeText}>{t('inlineIdeation.startCta')}</Text>
          </Pressable>
        </>
      )}

      {step === 'sector' && (
        <>
          <Text style={styles.body}>{t('inlineIdeation.sectorBody')}</Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {editionSectorCards.map((c) =>
              renderOptionRow(c.id, c.title, sectorCard?.id === c.id, () => {
                haptic();
                setSectorCard(c);
              })
            )}
          </ScrollView>
        </>
      )}

      {step === 'target' && (
        <>
          <Text style={styles.body}>{t('inlineIdeation.targetBody')}</Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {TARGET_CARDS.map((c) =>
              renderOptionRow(
                c.id,
                c.title,
                targetCard?.id === c.id,
                () => {
                  haptic();
                  setTargetCard(c);
                  setTargetCustom('');
                },
                c.description
              )
            )}
          </ScrollView>
          <Text style={styles.orLabel}>{t('inlineIdeation.orWrite')}</Text>
          <TextInput
            style={styles.input}
            value={targetCustom}
            onChangeText={(v) => {
              setTargetCustom(v);
              if (v.trim()) setTargetCard(null);
            }}
            placeholder={t('inlineIdeation.targetPlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.35)"
            maxLength={60}
          />
        </>
      )}

      {step === 'mission' && (
        <>
          <Text style={styles.body}>{t('inlineIdeation.missionBody')}</Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {MISSION_CARDS.map((c) =>
              renderOptionRow(
                c.id,
                c.title,
                missionCard?.id === c.id,
                () => {
                  haptic();
                  setMissionCard(c);
                  setMissionCustom('');
                },
                c.description
              )
            )}
          </ScrollView>
          <Text style={styles.orLabel}>{t('inlineIdeation.orWrite')}</Text>
          <TextInput
            style={styles.input}
            value={missionCustom}
            onChangeText={(v) => {
              setMissionCustom(v);
              if (v.trim()) setMissionCard(null);
            }}
            placeholder={t('inlineIdeation.missionPlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.35)"
            maxLength={60}
          />
        </>
      )}

      {step === 'project' && (
        <>
          {/* Récap des 3 ingrédients */}
          <View style={styles.recapCard}>
            <Text style={styles.recapLine} numberOfLines={1}>
              <Text style={styles.recapLabel}>{t('startup.labelSector')} </Text>
              {sectorCard?.title}
            </Text>
            <Text style={styles.recapLine} numberOfLines={1}>
              <Text style={styles.recapLabel}>{t('startup.labelTarget')} </Text>
              {targetTitle}
            </Text>
            <Text style={styles.recapLine} numberOfLines={1}>
              <Text style={styles.recapLabel}>{t('startup.labelMission')} </Text>
              {missionTitle}
            </Text>
          </View>

          {!manualMode && (
            <>
              {isGenerating ? (
                <View style={styles.generatingWrap}>
                  <ActivityIndicator color="#FFBC40" />
                  <Text style={styles.generatingText}>{t('inlineIdeation.generating')}</Text>
                </View>
              ) : ideas.length > 0 ? (
                <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                  {ideas.map((idea, index) =>
                    renderOptionRow(
                      idea.id,
                      idea.title,
                      selectedIdea === index,
                      () => {
                        haptic();
                        setSelectedIdea(index);
                      },
                      idea.description
                    )
                  )}
                </ScrollView>
              ) : (
                <GameButton
                  variant="blue"
                  fullWidth
                  title={t('startup.generateWithAI')}
                  onPress={() => void genererIdees()}
                  style={styles.generateBtn}
                />
              )}
              {!isGenerating && (
                <Pressable
                  onPress={() => {
                    haptic();
                    setManualMode(true);
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.switchModeText}>{t('inlineIdeation.writeMyself')}</Text>
                </Pressable>
              )}
            </>
          )}

          {manualMode && (
            <>
              <TextInput
                style={styles.input}
                value={manualName}
                onChangeText={setManualName}
                placeholder={t('inlineIdeation.namePlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.35)"
                maxLength={40}
              />
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={manualDesc}
                onChangeText={setManualDesc}
                placeholder={t('inlineIdeation.descPlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.35)"
                maxLength={160}
                multiline
              />
              <Pressable
                onPress={() => {
                  haptic();
                  setManualMode(false);
                }}
                hitSlop={8}
              >
                <Text style={styles.switchModeText}>{t('inlineIdeation.backToAI')}</Text>
              </Pressable>
            </>
          )}
        </>
      )}

      {step === 'launch' &&
        (created ? (
          <View style={styles.launchWrap}>
            <Ionicons name="checkmark-circle" size={44} color="#4CAF50" />
            <Text style={styles.createdName}>{created.startup.name.toUpperCase()}</Text>
            <View style={styles.rewardsRow}>
              <View style={styles.rewardPill}>
                <Ionicons name="diamond" size={14} color="#FFBC40" />
                <Text style={styles.rewardText}>{formatFCFARaw(created.startup.valorisation)}</Text>
              </View>
              <View style={styles.rewardPill}>
                <Text style={styles.rewardText}>⭐ +{created.xp} XP</Text>
              </View>
            </View>
            <Text style={styles.launchHint}>{t('inlineIdeation.readyBody')}</Text>
          </View>
        ) : (
          <View style={styles.launchWrap}>
            <ActivityIndicator color="#FFBC40" size="large" />
            <Text style={styles.generatingText}>{t('inlineIdeation.creatingBody')}</Text>
          </View>
        ))}
    </GamePopup>
  );
}

const styles = StyleSheet.create({
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: SPACING[3],
  },
  progressDot: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressDotActive: {
    backgroundColor: '#FFBC40',
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING[3],
    paddingHorizontal: SPACING[2],
  },
  list: {
    maxHeight: 250,
    marginBottom: SPACING[2],
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rowActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderColor: 'rgba(76, 175, 80, 0.4)',
  },
  rowTextWrap: {
    flex: 1,
    marginRight: SPACING[2],
  },
  rowLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.9)',
  },
  rowLabelActive: {
    color: '#FFFFFF',
  },
  rowSub: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  orLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginVertical: SPACING[2],
  },
  input: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    alignSelf: 'stretch',
    marginBottom: SPACING[2],
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  recapCard: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    marginBottom: SPACING[3],
    gap: 4,
  },
  recapLine: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: '#FFFFFF',
  },
  recapLabel: {
    fontFamily: FONTS.body,
    color: 'rgba(255,255,255,0.55)',
  },
  generatingWrap: {
    alignItems: 'center',
    gap: SPACING[3],
    paddingVertical: SPACING[5],
  },
  generatingText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  generateBtn: {
    marginBottom: SPACING[2],
  },
  switchModeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#3498DB',
    textAlign: 'center',
    paddingVertical: SPACING[2],
  },
  launchWrap: {
    alignItems: 'center',
    gap: SPACING[3],
    paddingVertical: SPACING[4],
  },
  createdName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: SPACING[3],
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 188, 64, 0.12)',
    borderRadius: 14,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
  },
  rewardText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#FFBC40',
  },
  launchHint: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  laterText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    paddingVertical: SPACING[1],
  },
  footerBtn: {
    marginBottom: SPACING[2],
  },
});
