import React from 'react';
import Svg, { Defs, FeBlend, FeColorMatrix, FeComposite, FeFlood, FeGaussianBlur, FeOffset, Filter, G, Path } from 'react-native-svg';

interface Icon4Props {
  size?: number;
  color?: string;
}

const Icon4: React.FC<Icon4Props> = ({ size = 48, color = '#FFBC40' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 43" fill="none">
      <Defs>
        <Filter id="filter0_d_9_6726" x="0" y="0" width="48" height="48" filterUnits="userSpaceOnUse">
          <FeFlood floodOpacity="0" result="BackgroundImageFix"/>
          <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <FeOffset dy="4"/>
          <FeGaussianBlur stdDeviation="7.5"/>
          <FeComposite in2="hardAlpha" operator="out"/>
          <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
          <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_9_6726"/>
          <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_9_6726" result="shape"/>
        </Filter>
      </Defs>
      
      <G filter="url(#filter0_d_9_6726)">
        <Path d="M33 20C33 15.0294 28.9706 11 24 11C19.0294 11 15 15.0294 15 20C15 24.9706 19.0294 29 24 29C28.9706 29 33 24.9706 33 20Z" fill={color}/>
        
        <Path 
          fillRule="evenodd" 
          clipRule="evenodd" 
          d="M23.9717 14.2354L28.7086 17.1504V22.693L23.9717 25.4715L19.1909 22.6941V17.1494L23.9717 14.2354ZM19.9238 17.5609V22.2723L23.9699 24.6229L27.9758 22.2733V17.5599L23.9699 15.0947L19.9238 17.5609Z" 
          fill="white"
        />
        
        <Path 
          fillRule="evenodd" 
          clipRule="evenodd" 
          d="M19.4194 17.7149L19.783 17.0786L24.0138 19.4962L28.203 17.0794L28.5692 17.7142L24.0156 20.3413L19.4194 17.7149Z" 
          fill="white"
        />
        
        <Path 
          fillRule="evenodd" 
          clipRule="evenodd" 
          d="M23.6448 25.0059V19.9199H24.3776V25.0059H23.6448Z" 
          fill="white"
        />
        
        <Path 
          fillRule="evenodd" 
          clipRule="evenodd" 
          d="M22.4599 15.1626L27.2376 18.0292V20.7308L26.4159 20.5124L25.2858 22.1376V19.1991L20.5247 16.297L22.4599 15.1626ZM21.9529 16.3093L26.0186 18.7875V19.8L26.1075 19.6722L26.5047 19.7778V18.4442L22.4555 16.0146L21.9529 16.3093Z" 
          fill="white"
        />
      </G>
    </Svg>
  );
};

export default Icon4;