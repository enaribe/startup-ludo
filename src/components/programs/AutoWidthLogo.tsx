import { useEffect, useState } from 'react';
import { Image, type ImageStyle } from 'react-native';

/** Logo dont la box épouse exactement l'image : hauteur fixe, largeur calée sur le ratio réel. */
export function AutoWidthLogo({ uri, height, style }: { uri: string; height: number; style?: ImageStyle }) {
  const [ratio, setRatio] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    Image.getSize(
      uri,
      (w, h) => { if (active) setRatio(h > 0 ? w / h : null); },
      () => { if (active) setRatio(null); }
    );
    return () => { active = false; };
  }, [uri]);
  return (
    <Image
      source={{ uri }}
      style={[{ height, width: ratio ? height * ratio : height }, style]}
      resizeMode="contain"
    />
  );
}
