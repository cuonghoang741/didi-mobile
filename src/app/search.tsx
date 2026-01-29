import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography, ProductCard, FilterModal } from '@/components';
import { useTheme, useLanguage } from '@/contexts';
import { searchProducts, SearchFilter } from '@/services/supabase';
import type { Product } from '@/types/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_count = 2;
const GAP = 12;
const ITEM_WIDTH = (SCREEN_WIDTH - 32 - GAP) / COLUMN_count;

const SearchScreen = () => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>({});
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Auto-focus on mount
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query, filter);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, filter]);

  const performSearch = async (text: string, currentFilter: SearchFilter) => {
    // If no text and no filter, clear results?
    // Or if filter is active, maybe show all products matching filter?
    // Let's decide: searchProducts handles empty text by returning empty if logic stays same.
    // Ideally if filter is applied, we might want to search even if text is empty?
    // Currently searchProducts returns [] if query is empty.
    // Let's modify logic: allow empty query if filter is present.
    // But `searchProducts` implementation requires `queryText` or returns [].
    // I should ideally update `searchProducts` to allow empty query if filter is set.
    // For now, I will keep requiring text OR update the logic here if text is present.

    if (!text.trim() && Object.keys(currentFilter).length === 0) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      // Pass filter to searchProducts
      const products = await searchProducts(text, currentFilter);
      setResults(products);
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    // Do NOT clear filter here? Usually clear search clears query.
    // If user wants to clear filter they use "Clear Filter" in modal.
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    router.back();
  };

  const handleApplyFilter = (newFilter: SearchFilter) => {
    setFilter(newFilter);
    // Effect will trigger search
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Feather name='search' size={20} color={theme.colors.text.tertiary} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={t('home.searchPlaceholder')}
            placeholderTextColor={theme.colors.text.tertiary}
            value={query}
            onChangeText={setQuery}
            returnKeyType='search'
            autoCapitalize='none'
          />
          {query.length > 0 && (
            <Pressable onPress={handleClear}>
              <Feather name='x-circle' size={18} color={theme.colors.text.tertiary} />
            </Pressable>
          )}
          <View style={styles.divider} />
          <Pressable onPress={() => setFilterVisible(true)}>
            <Feather name='filter' size={20} color={theme.colors.text.primary} />
          </Pressable>
        </View>
        <Pressable onPress={handleCancel} style={styles.cancelButton}>
          <Typography variant='text' size='md' style={{ color: theme.colors.text.primary }}>
            {t('common.cancel')}
          </Typography>
        </Pressable>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size='large' color={theme.colors.text.brand_primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          numColumns={COLUMN_count}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={{ width: ITEM_WIDTH }}>
              <ProductCard product={item} onPress={() => router.push(`/product/${item.id}`)} />
            </View>
          )}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            hasSearched ? (
              <View style={styles.emptyContainer}>
                <Feather name='search' size={48} color={theme.colors.text.tertiary} />
                <Typography variant='text' size='md' style={styles.emptyText}>
                  {t('search.noResults')}
                </Typography>
              </View>
            ) : null
          }
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={isFilterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleApplyFilter}
        initialFilter={filter}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 8,
      height: 40,
    },
    input: {
      flex: 1,
      fontFamily: 'Inter-Regular', // Assuming Inter font is used generally, fallback handled by system
      fontSize: 14,
      color: theme.colors.text.primary,
      padding: 0, // Remove default padding
    },
    cancelButton: {
      padding: 4,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      padding: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 100,
      gap: 16,
    },
    emptyText: {
      color: theme.colors.text.secondary,
    },
    divider: {
      width: 1,
      height: 24,
      backgroundColor: theme.colors.border.secondary || '#E5E7EB',
      marginHorizontal: 4,
    },
  });

export default SearchScreen;
