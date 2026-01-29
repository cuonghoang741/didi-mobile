import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

export interface RootBackgroundGradientProps {
  /** Pastel blobs alpha, default 0.6 for soft look */
  opacity?: number;
}

/**
 * Background made of multiple overlapping radial gradients to mimic soft pastel blobs.
 * Note: Sized to parent via absolute fill; place inside a wrapper with flex:1.
 */
const RootBackgroundGradient: React.FC<RootBackgroundGradientProps> = ({ opacity = 0.8 }) => {
  return (
    <View pointerEvents='none' style={styles.container}>
      <Svg width='100%' height='100%' viewBox='0 0 100 100' preserveAspectRatio='none'>
        <Defs>
          {/* Pink - moved to previous blue position */}
          <RadialGradient id='gradPink' cx='40%' cy='48%' r='58%'>
            <Stop
              offset='0%'
              stopColor='rgba(255, 142, 166, 1)'
              stopOpacity={Math.min(1, opacity + 0.25)}
            />
            <Stop offset='25%' stopColor='rgba(255, 142, 166, 1)' stopOpacity={opacity} />
            <Stop offset='80%' stopColor='rgba(255, 142, 166, 1)' stopOpacity={opacity * 0.2} />
            <Stop offset='100%' stopColor='rgba(255, 142, 166, 0)' stopOpacity={0} />
          </RadialGradient>

          {/* Light blue - moved to top-right to avoid pink */}
          <RadialGradient id='gradBlue' cx='72%' cy='28%' r='55%'>
            <Stop
              offset='0%'
              stopColor='rgba(153, 189, 255, 1)'
              stopOpacity={Math.min(1, opacity + 0.25)}
            />
            <Stop offset='28%' stopColor='rgba(153, 189, 255, 1)' stopOpacity={opacity} />
            <Stop offset='80%' stopColor='rgba(153, 189, 255, 1)' stopOpacity={opacity * 0.2} />
            <Stop offset='100%' stopColor='rgba(153, 189, 255, 0)' stopOpacity={0} />
          </RadialGradient>

          {/* Mint - moved to top area */}
          <RadialGradient id='gradMint' cx='55%' cy='22%' r='45%'>
            <Stop
              offset='0%'
              stopColor='rgba(178, 234, 205, 1)'
              stopOpacity={Math.min(1, opacity + 0.2)}
            />
            <Stop offset='28%' stopColor='rgba(178, 234, 205, 1)' stopOpacity={opacity} />
            <Stop offset='80%' stopColor='rgba(178, 234, 205, 1)' stopOpacity={opacity * 0.15} />
            <Stop offset='100%' stopColor='rgba(178, 234, 205, 0)' stopOpacity={0} />
          </RadialGradient>

          {/* Soft yellow - broader right-mid fill */}
          <RadialGradient id='gradYellow' cx='70%' cy='55%' r='55%'>
            <Stop
              offset='0%'
              stopColor='rgba(255, 230, 150, 1)'
              stopOpacity={Math.min(1, opacity + 0.2)}
            />
            <Stop offset='30%' stopColor='rgba(255, 230, 150, 1)' stopOpacity={opacity} />
            <Stop offset='85%' stopColor='rgba(255, 230, 150, 1)' stopOpacity={opacity * 0.2} />
            <Stop offset='100%' stopColor='rgba(255, 230, 150, 0)' stopOpacity={0} />
          </RadialGradient>

          {/* Subtle global white wash to keep edges bright */}
          <RadialGradient id='gradWhite' cx='50%' cy='50%' r='85%'>
            <Stop offset='0%' stopColor='rgba(255,255,255,0.04)' />
            <Stop offset='100%' stopColor='rgba(255,255,255,1)' />
          </RadialGradient>
        </Defs>

        {/* base white wash */}
        <Rect x='0' y='0' width='100' height='100' fill='url(#gradWhite)' />

        {/* blobs overlays */}
        <Rect x='0' y='0' width='100' height='100' fill='url(#gradPink)' />
        <Rect x='0' y='0' width='100' height='100' fill='url(#gradBlue)' />
        <Rect x='0' y='0' width='100' height='100' fill='url(#gradMint)' />
        <Rect x='0' y='0' width='100' height='100' fill='url(#gradYellow)' />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default RootBackgroundGradient;
