import { Image } from 'expo-image';
import React from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';

import { Typography } from '@/components';
import { useTheme } from '@/contexts';
import type { Category } from '@/types/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_PADDING = 16;
const GAP = 12;
// Calculate item width for 4 columns per row
const ITEM_WIDTH = (SCREEN_WIDTH - CONTAINER_PADDING * 2 - GAP * 3) / 4;

interface CategoryListProps {
  categories: Category[];
  onCategoryPress?: (category: Category) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({ categories, onCategoryPress }) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.gridContainer}>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            style={styles.categoryItem}
            onPress={() => onCategoryPress?.(category)}
          >
            <View style={styles.imageContainer}>
              {category.image_url ? (
                <Image
                  source={{ uri: category.image_url }}
                  style={styles.image}
                  contentFit='cover'
                />
              ) : (
                <View style={[styles.image, styles.placeholder]}>
                  <Typography variant='text' size='lg' weight='bold' style={{ color: '#9CA3AF' }}>
                    {category.name.charAt(0).toUpperCase()}
                  </Typography>
                </View>
              )}
            </View>
            <Typography
              variant='text'
              size='xs'
              weight='medium'
              style={styles.categoryName}
              numberOfLines={2}
            >
              {category.name}
            </Typography>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      marginBottom: 24,
      paddingHorizontal: CONTAINER_PADDING,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GAP,
    },
    categoryItem: {
      alignItems: 'center',
      width: ITEM_WIDTH,
    },
    imageContainer: {
      width: ITEM_WIDTH - 10,
      height: ITEM_WIDTH - 10,
      borderRadius: (ITEM_WIDTH - 10) / 2,
      marginBottom: 8,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryName: {
      textAlign: 'center',
      color: theme.colors.text.secondary,
    },
  });

export default CategoryList;
