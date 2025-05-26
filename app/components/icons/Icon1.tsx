// import React from 'react';
// import Svg, { Circle, Path } from 'react-native-svg';

// interface Icon1Props {
//   size?: number;
//   color?: string;
// }

// const Icon1: React.FC<Icon1Props> = ({ size = 20, color = '#EDA420' }) => {
//   return (
//     <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
//       <Circle cx="12" cy="12" r="10" fill={color}/>
//       <Path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//       <Path d="M12 6v2M12 16v2M6 12h2M16 12h2" stroke="white" strokeWidth="1" strokeLinecap="round"/>
//     </Svg>
//   );
// };

// export default Icon1; 

import React from 'react';
import Svg, { Defs, FeBlend, FeColorMatrix, FeComposite, FeFlood, FeGaussianBlur, FeOffset, Filter, G, Path } from 'react-native-svg';

interface Icon1Props {
  size?: number;
  color?: string;
}

const Icon1: React.FC<Icon1Props> = ({ size = 38, color = '#FFBC40' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 38 38" fill="none">
      <Defs>
        <Filter id="filter0_d_9_6697" x="0" y="0" width="38" height="38" filterUnits="userSpaceOnUse">
          <FeFlood floodOpacity="0" result="BackgroundImageFix"/>
          <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <FeOffset/>
          <FeGaussianBlur stdDeviation="5"/>
          <FeComposite in2="hardAlpha" operator="out"/>
          <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
          <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_9_6697"/>
          <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_9_6697" result="shape"/>
        </Filter>
      </Defs>
      
      <G filter="url(#filter0_d_9_6697)">
        <Path d="M28 19C28 14.0294 23.9706 10 19 10C14.0294 10 10 14.0294 10 19C10 23.9706 14.0294 28 19 28C23.9706 28 28 23.9706 28 19Z" fill={color}/>
      </G>
      
      <Path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M22.8462 17.8272C22.8462 15.6715 21.0488 13.9353 18.87 14.0353C16.9227 14.1247 15.3417 15.7105 15.2574 17.6579C15.1943 19.1164 15.9535 20.4028 17.1119 21.0918C17.3171 21.2127 17.4378 21.4321 17.4378 21.6642V23.2044H19.5846V23.9372H17.4053C17.0185 23.9372 16.705 23.6237 16.705 23.2369V21.7022C15.3431 20.8768 14.4505 19.3523 14.5252 17.6262C14.626 15.2999 16.5098 13.41 18.8363 13.3032M18.8363 13.3032C21.4345 13.1839 23.579 15.2553 23.579 17.8272C23.579 19.485 22.6885 20.9342 21.3609 21.7229L21.2744 21.7743H18.0264V21.0414H21.0706C22.1383 20.3691 22.8462 19.1808 22.8462 17.8272" 
        fill="white"
      />
      
      <Path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M21.3962 21.8921V23.2372C21.3962 23.6239 21.0827 23.9374 20.6959 23.9374H20.638V24.0797C20.638 24.4665 20.3245 24.78 19.9377 24.78H18.1635C17.7767 24.78 17.4632 24.4665 17.4632 24.0797V23.9049H18.1961V24.0471H19.9051V23.9049C19.9051 23.5181 20.2187 23.2046 20.6054 23.2046H20.6634V21.8921H21.3962Z" 
        fill="white"
      />
      
      <Path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M21.2301 16.6828L18.355 19.5572L16.8674 18.0704L17.3854 17.5521L18.3549 18.521L20.7119 16.1646L21.2301 16.6828Z" 
        fill="white"
      />
    </Svg>
  );
};

export default Icon1;