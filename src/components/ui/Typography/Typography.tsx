import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { useTheme } from '@/contexts';

type DisplayVariantSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type TextVariantSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type TypographyProps = TextProps & {
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold';
} & (
    | {
        variant?: 'display';
        size?: DisplayVariantSize;
      }
    | {
        variant?: 'text';
        size?: TextVariantSize;
      }
  );

const displaySizeMap: Record<DisplayVariantSize, { fontSize: number; lineHeight: number }> = {
  xs: { fontSize: 18, lineHeight: 22 },
  sm: { fontSize: 20, lineHeight: 24 },
  md: { fontSize: 24, lineHeight: 28 },
  lg: { fontSize: 28, lineHeight: 34 },
  xl: { fontSize: 32, lineHeight: 38 },
  '2xl': { fontSize: 36, lineHeight: 44 },
};

const textSizeMap: Record<TextVariantSize, { fontSize: number; lineHeight: number }> = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 18 },
  md: { fontSize: 16, lineHeight: 22 },
  lg: { fontSize: 18, lineHeight: 24 },
  xl: { fontSize: 20, lineHeight: 26 },
};

const weightMap: Record<
  NonNullable<TypographyProps['weight']>,
  { fontWeight: '400' | '500' | '600' | '700' }
> = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semiBold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
};

const baseStyles = StyleSheet.create({
  text: {},
});

const Typography: React.FC<TypographyProps> = ({
  children,
  style,
  variant = 'text',
  size = 'md',
  weight = 'regular',
  ...others
}) => {
  const theme = useTheme();
  const sizeStyle =
    variant === 'display'
      ? displaySizeMap[size as DisplayVariantSize]
      : textSizeMap[size as TextVariantSize];

  return (
    <Text
      style={[
        baseStyles.text,
        { color: theme.colors.text.primary, fontFamily: theme.fontFamily.regular },
        sizeStyle,
        weightMap[weight],
        style,
      ]}
      {...others}
    >
      {children}
    </Text>
  );
};

export default Typography;
