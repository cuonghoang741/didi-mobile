import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/contexts';

export interface CardBubbleProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  padding?: number;
}

const CardBubble: React.FC<CardBubbleProps> = ({
  children,
  style,
  contentStyle,
  radius,
  padding,
}) => {
  const theme = useTheme();
  const r = radius ?? theme.radius['3xl'];
  const p = padding ?? theme.spacing(4);

  return (
    <View style={[styles.container, { borderRadius: r }, style]}>
      {/* Background gradient: 180deg per design */}
      <LinearGradient
        colors={['rgba(245,246,255,0.5)', 'rgba(193,194,201,0.5)', 'rgba(255,255,255,0.5)']}
        locations={[0, 0.5288, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: r }]}
      />

      {/* Inset-like glow (RN doesn't support inset shadow; emulate with inner gradient) */}
      <LinearGradient
        pointerEvents='none'
        colors={['rgba(255,255,255,0.65)', 'rgba(255,255,255,0.25)', 'rgba(255,255,255,0)']}
        locations={[0, 0.35, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: r, opacity: 1 }]}
      />

      <View style={[{ padding: p }, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default CardBubble;


