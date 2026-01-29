import React from 'react';
import { View, ViewProps } from 'react-native';

import { useTheme } from '@/contexts';

interface ContainerProps extends ViewProps {
  children: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({ children, style, ...props }) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.container, style]} {...props}>
      {children}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) => ({
  container: {
    paddingHorizontal: theme.spacing(5),
  },
});

export default Container;
