/**
 * OpportunityHeader — header vert commun (ampoule + label + déco dés).
 * Utilisé par EventPopup (opportunités) et SponsorEventPopup (cartes sponsor
 * opportunité/financement, qui partagent le même habillage vert).
 */

import { Path, G, Text as SvgText } from 'react-native-svg';

import { PopupHeader } from './PopupHeader';

// Icône ampoule (SVG fourni, centré verticalement dans le viewBox 83px de haut)
// L'icône fait 22×35 → on la translate pour la centrer à x≈18, y≈(83-35)/2=24
const OPP_ICON = (
  <G translateX={18} translateY={24}>
    <Path
      d="M10.7069 1C16.0652 1 20.4139 5.34871 20.4139 10.7069C20.4139 16.4017 15.2369 19.5338 15.2369 24.9438H6.17704C6.17704 19.5338 1 16.4017 1 10.7069C1 5.34871 5.34871 1 10.7069 1Z"
      fill="#4CAF50"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.82422 29.3203H14.5898"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.41211 33.6094H12.0006"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </G>
);

const makeOppLabel = (text: string) => (
  <SvgText
    x="52"
    y="50"
    fill="white"
    fontSize="17"
    fontFamily="LuckiestGuy_400Regular"
    letterSpacing="1"
  >
    {text}
  </SvgText>
);

// Déco droite — identique au Quiz (losange + dés)
export const SHARED_DECOR_RIGHT = (
  <>
    <Path fillRule="evenodd" clipRule="evenodd" d="M298.767 19.2242L292.25 25.668C289.25 28.6336 289.25 33.4419 292.25 36.4075L298.767 42.8513C301.767 45.8169 306.63 45.8169 309.629 42.8513L316.147 36.4075C319.146 33.4419 319.146 28.6336 316.147 25.668L309.629 19.2242C306.63 16.2586 301.767 16.2586 298.767 19.2242ZM301.928 21.6475C300.679 22.8832 300.679 24.8866 301.928 26.1223C303.178 27.358 305.205 27.358 306.454 26.1223L306.467 26.1094C307.717 24.8737 307.717 22.8703 306.467 21.6346C305.218 20.3989 303.191 20.3989 301.941 21.6346L301.928 21.6475ZM294.687 33.2815C293.437 32.0459 293.437 30.0424 294.687 28.8067L294.7 28.7938C295.95 27.5582 297.976 27.5582 299.226 28.7938C300.476 30.0295 300.476 32.033 299.226 33.2687L299.213 33.2815C297.963 34.5172 295.937 34.5172 294.687 33.2815ZM301.928 35.9668C300.679 37.2024 300.679 39.2059 301.928 40.4416C303.178 41.6773 305.205 41.6773 306.454 40.4416L306.467 40.4287C307.717 39.193 307.717 37.1896 306.467 35.9539C305.218 34.7182 303.191 34.7182 301.941 35.9539L301.928 35.9668ZM309.17 33.2815C307.92 32.0459 307.92 30.0424 309.17 28.8067L309.183 28.7939C310.433 27.5582 312.459 27.5582 313.709 28.7939C314.959 30.0295 314.959 32.033 313.709 33.2687L313.696 33.2815C312.446 34.5172 310.42 34.5172 309.17 33.2815Z" fill="black" fillOpacity="0.1" />
    <Path fillRule="evenodd" clipRule="evenodd" d="M312.421 49.2932V58.406C312.421 62.6 315.86 66 320.102 66H329.319C333.561 66 337 62.6 337 58.406V49.2932C337 45.0991 333.561 41.6992 329.319 41.6992H320.102C315.86 41.6992 312.421 45.0991 312.421 49.2932ZM316.39 48.7961C316.39 50.5436 317.823 51.9602 319.59 51.9602C321.358 51.9602 322.791 50.5436 322.791 48.7961V48.7778C322.791 47.0303 321.358 45.6137 319.59 45.6137C317.823 45.6137 316.39 47.0303 316.39 48.7778V48.7961ZM329.831 62.086C328.064 62.086 326.631 60.6694 326.631 58.9219V58.9036C326.631 57.1561 328.064 55.7395 329.831 55.7395C331.599 55.7395 333.032 57.1561 333.032 58.9036V58.9219C333.032 60.6694 331.599 62.086 329.831 62.086Z" fill="black" fillOpacity="0.1" />
  </>
);

export function OpportunityHeader({ label }: { label: string }) {
  return (
    <PopupHeader
      color="#4CAF50"
      icon={OPP_ICON}
      label={makeOppLabel(label)}
      decorRight={SHARED_DECOR_RIGHT}
    />
  );
}
