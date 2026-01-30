import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Typography from '@/components/ui/Typography/Typography';
import Button from '@/components/ui/Button/Button';
import { useTheme, useLanguage } from '@/contexts';
import { Category } from '@/types/database.types';
import { fetchCategories } from '@/services/supabase/homeService';
import { fetchBrands, SearchFilter } from '@/services/supabase/productService';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Price range data (labels will be translated dynamically)
const PRICE_RANGE_DATA = [
  { key: 'under1m', min: 0, max: 1000000 },
  { key: 'from1mTo3m', min: 1000000, max: 3000000 },
  { key: 'from3mTo5m', min: 3000000, max: 5000000 },
  { key: 'from5mTo10m', min: 5000000, max: 10000000 },
  { key: 'from10mTo20m', min: 10000000, max: 20000000 },
  { key: 'over20m', min: 20000000, max: undefined },
] as const;

// Branch keys for translation
const BRANCH_KEYS = ['namba', 'otsuka', 'omiya'] as const;

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filter: SearchFilter) => void;
  initialFilter?: SearchFilter;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply, initialFilter }) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);

  // Create translated price ranges
  const PRICE_RANGES = useMemo(
    () =>
      PRICE_RANGE_DATA.map((range) => ({
        label: t(`filter.priceRanges.${range.key}`),
        min: range.min,
        max: range.max,
      })),
    [t],
  );

  // Create translated branches
  const BRANCHES = useMemo(
    () => BRANCH_KEYS.map((key) => t(`filter.branches.${key}`)),
    [t],
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Filter states
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined);
  const [selectedPriceRangeIndex, setSelectedPriceRangeIndex] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (visible && initialFilter) {
      setSelectedCategoryIds(initialFilter.categoryIds || []);
      setSelectedBrand(initialFilter.brand);
      // Determine price range index if possible, or reset
      // This logic is simple match, might need complex logic if manual slider logic was used.
      // For now, assuming user selects from chips.
      if (initialFilter.minPrice !== undefined) {
        const index = PRICE_RANGES.findIndex(
          (r) => r.min === initialFilter.minPrice && r.max === initialFilter.maxPrice,
        );
        setSelectedPriceRangeIndex(index !== -1 ? index : undefined);
      } else {
        setSelectedPriceRangeIndex(undefined);
      }
    }
  }, [visible, initialFilter]);

  const loadData = async () => {
    const [cats, brs] = await Promise.all([fetchCategories(), fetchBrands()]);
    setCategories(cats);
    setBrands(brs);
  };

  const handleApply = () => {
    const filter: SearchFilter = {
      categoryIds: selectedCategoryIds,
      brand: selectedBrand,
    };

    if (selectedPriceRangeIndex !== undefined) {
      filter.minPrice = PRICE_RANGES[selectedPriceRangeIndex].min;
      filter.maxPrice = PRICE_RANGES[selectedPriceRangeIndex].max;
    }

    onApply(filter);
    onClose();
  };

  const handleClear = () => {
    setSelectedCategoryIds([]);
    setSelectedBrand(undefined);
    setSelectedPriceRangeIndex(undefined);
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrand((prev) => (prev === brand ? undefined : brand));
  };

  const togglePrice = (index: number) => {
    setSelectedPriceRangeIndex((prev) => (prev === index ? undefined : index));
  };

  return (
    <Modal visible={visible} animationType='slide' transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ width: 24 }} />
            <Typography variant='text' size='lg' weight='bold'>
              {t('filter.title')}
            </Typography>
            <TouchableOpacity onPress={onClose}>
              <Feather name='x' size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Categories */}
            <View style={styles.section}>
              <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
                {t('filter.category')}
              </Typography>
              <View style={styles.grid}>
                {categories.map((category) => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[styles.categoryItem, isSelected && styles.categoryItemActive]}
                      onPress={() => toggleCategory(category.id)}
                    >
                      {category.image_url ? (
                        <Image
                          source={{ uri: category.image_url }}
                          style={styles.categoryImage}
                          resizeMode='contain'
                        />
                      ) : (
                        <View style={styles.categoryImagePlaceholder}>
                          <Feather name='image' size={24} color={theme.colors.text.tertiary} />
                        </View>
                      )}
                      <Typography
                        variant='text'
                        size='xs'
                        style={[styles.categoryText, isSelected && styles.textActive]}
                        numberOfLines={2}
                      >
                        {category.name}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Brands */}
            {brands.length > 0 && (
              <View style={styles.section}>
                <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
                  {t('filter.brand')}
                </Typography>
                <View style={styles.chipContainer}>
                  {brands.map((brand) => {
                    const isSelected = selectedBrand === brand;
                    return (
                      <TouchableOpacity
                        key={brand}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => toggleBrand(brand)}
                      >
                        <Typography
                          variant='text'
                          size='sm'
                          style={isSelected ? styles.textActive : styles.text}
                        >
                          {brand}
                        </Typography>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Price */}
            <View style={styles.section}>
              <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
                {t('filter.priceRange')}
              </Typography>
              <View style={styles.chipContainer}>
                {PRICE_RANGES.map((range, index) => {
                  const isSelected = selectedPriceRangeIndex === index;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => togglePrice(index)}
                    >
                      <Typography
                        variant='text'
                        size='sm'
                        style={isSelected ? styles.textActive : styles.text}
                      >
                        {range.label}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Branch (Static) */}
            <View style={styles.section}>
              <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
                {t('filter.branch')}
              </Typography>
              <View style={styles.chipContainer}>
                {BRANCHES.map((branch, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.chip}
                  // No functionality for now
                  >
                    <Typography variant='text' size='sm' style={styles.text}>
                      {branch}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Typography variant='text' size='md' weight='medium'>
                {t('filter.clearFilter')}
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Typography variant='text' size='md' weight='bold' style={{ color: '#FFF' }}>
                {t('filter.apply')}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>, insets: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      height: SCREEN_HEIGHT * 0.85,
      backgroundColor: theme.colors.background.primary,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      marginBottom: 12,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    categoryItem: {
      width: (Dimensions.get('window').width - 32 - 36) / 4, // 4 columns
      alignItems: 'center',
      padding: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: '#F9FAFB',
    },
    categoryItemActive: {
      borderColor: theme.colors.text.brand_primary,
      backgroundColor: '#EEF2FF',
    },
    categoryImage: {
      width: 40,
      height: 40,
      marginBottom: 4,
    },
    categoryImagePlaceholder: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
      backgroundColor: '#E5E7EB',
      borderRadius: 20,
    },
    categoryText: {
      textAlign: 'center',
      color: theme.colors.text.primary,
    },
    textActive: {
      color: theme.colors.text.brand_primary,
      fontWeight: '600',
    },
    text: {
      color: theme.colors.text.primary,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: theme.colors.background.secondary,
    },
    chipActive: {
      borderColor: theme.colors.text.brand_primary,
      backgroundColor: '#EEF2FF',
    },
    footer: {
      flexDirection: 'row',
      padding: 16,
      paddingBottom: Math.max(16, insets.bottom),
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      gap: 16,
      backgroundColor: theme.colors.background.primary,
    },
    clearButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    applyButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: '#0F172A', // Dark color as in screenshot
    },
  });

export default FilterModal;
