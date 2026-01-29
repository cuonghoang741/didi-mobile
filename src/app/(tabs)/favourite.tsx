import { StyleSheet, View } from 'react-native';

import { Button, Typography } from '@/components';
import { useTheme } from '@/contexts';

const Favourite = () => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Button colorScheme='brand' size='lg' variant='link'>
        My favourite recipes
      </Button>
      <Typography variant='display' size='lg' weight='bold'>
        Favourite
      </Typography>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
    },
  });

export default Favourite;
