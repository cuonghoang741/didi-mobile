import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography } from '@/components';
import { useTheme, useLanguage } from '@/contexts';
import { supabase } from '@/services/supabase';
import type { Category } from '@/types/database.types';

const Categories = () => {
  const theme = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (category: Category) => {
    console.log('Navigate to category:', category.id);
    // TODO: Navigate to category products
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size='large' color={theme.colors.text.brand_primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Typography variant='display' size='sm' weight='bold'>
          {t('tabs.categories')}
        </Typography>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name='folder' size={64} color={theme.colors.text.tertiary} />
            <Typography variant='text' size='md' style={styles.emptyText}>
              {t('categories.empty')}
            </Typography>
          </View>
        ) : (
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <Pressable
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
              >
                <View style={styles.categoryIcon}>
                  <Feather name='grid' size={24} color={theme.colors.text.brand_primary} />
                </View>
                <Typography variant='text' size='sm' weight='medium' numberOfLines={2}>
                  {category.name}
                </Typography>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.tertiary,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 100,
    },
    emptyText: {
      color: theme.colors.text.tertiary,
      marginTop: 16,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    categoryCard: {
      width: '47%',
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      gap: 12,
    },
    categoryIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.background.brand_primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default Categories;
