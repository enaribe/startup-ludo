/**
 * useTutorialTarget — permet à un composant de s'enregistrer comme cible
 * pointable par le tutoriel interactif.
 *
 * Usage : attacher la `ref` retournée à un View et appeler `measure` dans son
 * `onLayout`. La position de l'élément est mesurée en coordonnées fenêtre puis
 * stockée dans le tutorialStore.
 *
 *   const { ref, measure } = useTutorialTarget('dice');
 *   <View ref={ref} onLayout={measure}>…</View>
 */
import { useCallback, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { useTutorialStore, type TutorialTargetId } from '@/stores/useTutorialStore';

export function useTutorialTarget(id: TutorialTargetId) {
  const ref = useRef<View>(null);
  const registerTarget = useTutorialStore((s) => s.registerTarget);

  const measure = useCallback(() => {
    // measureInWindow donne les coordonnées absolues à l'écran
    ref.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        registerTarget(id, { x, y, width, height });
      }
    });
  }, [id, registerTarget]);

  // Objet stable : évite de redéclencher les effets qui en dépendent
  return useMemo(() => ({ ref, measure }), [measure]);
}
