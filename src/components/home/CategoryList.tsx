import { Image } from 'expo-image';
import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';

import { Typography } from '@/components';
import { useTheme } from '@/contexts';
import type { Category } from '@/types/database.types';

interface CategoryListProps {
  categories: Category[];
  onCategoryPress?: (category: Category) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({ categories, onCategoryPress }) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
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
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    contentContainer: {
      paddingHorizontal: 16,
      gap: 16,
    },
    categoryItem: {
      alignItems: 'center',
      width: 70,
    },
    imageContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.background.secondary,
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
