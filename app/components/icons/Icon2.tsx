// import React from 'react';
// import Svg, { Circle, Path } from 'react-native-svg';

// interface Icon2Props {
//   size?: number;
//   color?: string;
// }

// const Icon2: React.FC<Icon2Props> = ({ size = 20, color = '#1C82BB' }) => {
//   return (
//     <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
//       <Circle cx="12" cy="12" r="10" fill={color}/>
//       <Path d="M12 6v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//     </Svg>
//   );
// };

// export default Icon2; 


import React from 'react';
import Svg, { Defs, FeBlend, FeColorMatrix, FeComposite, FeFlood, FeGaussianBlur, FeOffset, Filter, G, Path } from 'react-native-svg';

interface Icon2Props {
  size?: number;
  color?: string;
}

const Icon2: React.FC<Icon2Props> = ({ size = 38, color = '#FFBC40' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 38 38" fill="none">
      <Defs>
        <Filter id="filter0_d_9_6706" x="0" y="0" width="38" height="38" filterUnits="userSpaceOnUse">
          <FeFlood floodOpacity="0" result="BackgroundImageFix"/>
          <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <FeOffset dy="4"/>
          <FeGaussianBlur stdDeviation="5"/>
          <FeComposite in2="hardAlpha" operator="out"/>
          <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
          <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_9_6706"/>
          <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_9_6706" result="shape"/>
        </Filter>
      </Defs>
      
      <G filter="url(#filter0_d_9_6706)">
        <Path d="M28 15C28 10.0294 23.9706 6 19 6C14.0294 6 10 10.0294 10 15C10 19.9706 14.0294 24 19 24C23.9706 24 28 19.9706 28 15Z" fill={color}/>
        
        <Path 
          fillRule="evenodd" 
          clipRule="evenodd" 
          d="M19.0533 19.3134C21.5492 19.3134 23.5726 17.2901 23.5726 14.7941C23.5726 12.2982 21.5492 10.2748 19.0533 10.2748C16.5574 10.2748 14.534 12.2982 14.534 14.7941C14.534 17.2901 16.5574 19.3134 19.0533 19.3134ZM19.0533 20.0463C21.954 20.0463 24.3054 17.6948 24.3054 14.7941C24.3054 11.8935 21.954 9.54199 19.0533 9.54199C16.1526 9.54199 13.8011 11.8935 13.8011 14.7941C13.8011 17.6948 16.1526 20.0463 19.0533 20.0463Z" 
          fill="white"
        />
        
        <Path 
          fillRule="evenodd" 
          clipRule="evenodd" 
          d="M21.7728 10.5122L22.3614 10.9489L19.6347 14.624L24.1287 14.7029L24.1159 15.4356L18.197 15.3318L21.7728 10.5122Z" 
          fill="white"
        />
      </G>
    </Svg>
  );
};

export default Icon2;