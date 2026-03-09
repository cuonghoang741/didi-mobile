import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Pressable, TextInput } from 'react-native';

import { Typography } from '@/components';
import { CartIcon } from '@/components/common/CartIcon';
import { useLanguage, useTheme } from '@/contexts';

interface HeaderProps {
  onSearchPress?: () => void;
  showCart?: boolean;
  showLanguageSwitcher?: boolean;
  searchPlaceholder?: string;
  isSearchInput?: boolean;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  onSearchPress,
  showCart = true,
  showLanguageSwitcher = true,
  searchPlaceholder,
  isSearchInput = false,
  searchValue,
  onSearchChange,
}) => {
  const router = useRouter();
  const theme = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const styles = createStyles(theme);
  const [dropdownVisible, setDropdownVisible] = React.useState(false);

  const getFlag = (lang: string) => {
    switch (lang) {
      case 'vi':
        return '🇻🇳';
      case 'jp':
        return '🇯🇵';
      case 'en':
      default:
        return '🇺🇸';
    }
  };

  const handleLanguageSelect = (lang: any) => {
    setLanguage(lang);
    setDropdownVisible(false);
  };

  return (
    <View style={[styles.header, { zIndex: 10 }]}>
      {isSearchInput ? (
        <View style={styles.searchContainer}>
          <Feather name='search' size={20} color={theme.colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder || t('home.searchPlaceholder')}
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchValue}
            onChangeText={onSearchChange}
          />
        </View>
      ) : (
        <Pressable
          style={styles.searchContainer}
          onPress={onSearchPress || (() => router.push('/search'))}
        >
          <Feather name='search' size={20} color={theme.colors.text.secondary} />
          <Typography variant='text' size='md' style={styles.searchText}>
            {searchPlaceholder || t('home.searchPlaceholder')}
          </Typography>
        </Pressable>
      )}

      {showLanguageSwitcher && (
        <View style={{ position: 'relative', zIndex: 20 }}>
          <Pressable
            style={styles.languageButton}
            onPress={() => setDropdownVisible(!dropdownVisible)}
          >
            <Typography variant='text' size='lg'>
              {getFlag(language)}
            </Typography>
          </Pressable>

          {dropdownVisible && (
            <View style={styles.dropdown}>
              {[
                { code: 'en', label: 'English', flag: '🇺🇸' },
                { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
                { code: 'jp', label: '日本語', flag: '🇯🇵' },
              ].map((item) => (
                <Pressable
                  key={item.code}
                  style={[styles.dropdownItem, language === item.code && styles.dropdownItemActive]}
                  onPress={() => handleLanguageSelect(item.code)}
                >
                  <Typography variant='text' size='md'>
                    {item.flag}
                  </Typography>
                  <Typography
                    variant='text'
                    size='sm'
                    style={[
                      styles.dropdownItemText,
                      language === item.code && styles.dropdownItemTextActive,
                    ]}
                  >
                    {item.label}
                  </Typography>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {showCart && <CartIcon />}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
      backgroundColor: theme.colors.background.primary,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      gap: 8,
    },
    searchText: {
      color: theme.colors.text.tertiary,
    },
    searchInput: {
      flex: 1,
      color: theme.colors.text.primary,
      fontFamily: 'Inter_400Regular',
      padding: 0,
      ...theme.typography.text.sm,
    },
    iconButton: {
      padding: 4,
      position: 'relative',
    },
    languageButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.background.secondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdown: {
      position: 'absolute',
      top: 45,
      right: 0,
      backgroundColor: theme.colors.background.primary,
      borderRadius: 8,
      padding: 4,
      width: 150,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 6,
      gap: 8,
    },
    dropdownItemActive: {
      backgroundColor: theme.colors.background.secondary,
    },
    dropdownItemText: {
      color: theme.colors.text.primary,
    },
    dropdownItemTextActive: {
      color: theme.colors.text.brand_primary,
      fontWeight: '600',
    },
  });

export default Header;
