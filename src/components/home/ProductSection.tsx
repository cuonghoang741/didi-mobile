import React from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Typography } from '@/components';
import { useTheme, useLanguage } from '@/contexts';
import type { Product, ProductWithFlashSale } from '@/types/database.types';

import ProductCard from './ProductCard';

interface ProductSectionProps {
  title: string;
  products: Product[] | ProductWithFlashSale[];
  onViewAll?: () => void;
  onProductPress?: (product: Product) => void;
  showFlashSalePrice?: boolean;
  showHotBadge?: boolean;
}

const ProductSection: React.FC<ProductSectionProps> = ({
  title,
  products,
  onViewAll,
  onProductPress,
  showFlashSalePrice,
  showHotBadge,
}) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  if (products.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant='text' size='lg' weight='bold' style={styles.title}>
          {title}
        </Typography>
        {onViewAll ? (
          <Pressable onPress={onViewAll} style={styles.viewAllButton}>
            <Typography variant='text' size='sm' weight='medium' style={styles.viewAllText}>
              {t('common.seeMore')}
            </Typography>
            <Feather name='chevron-right' size={16} color='#0088FF' />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={products}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={onProductPress}
            showFlashSalePrice={showFlashSalePrice}
            showHotBadge={showHotBadge}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    title: {
      color: theme.colors.text.primary,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    viewAllText: {
      color: '#0088FF',
    },
    listContent: {
      paddingHorizontal: 16,
    },
  });

export default ProductSection;
