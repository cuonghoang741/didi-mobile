import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Pressable, TextInput } from 'react-native';

import { Typography } from '@/components';
import { useCart, useLanguage, useTheme } from '@/contexts';

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
    const { getItemCount } = useCart();
    const styles = createStyles(theme);

    const handleLanguageToggle = () => {
        const nextLanguage =
            language === 'en' ? 'vi' : language === 'vi' ? 'jp' : 'en';
        setLanguage(nextLanguage);
    };

    return (
        <View style={styles.header}>
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
                <Pressable style={styles.languageButton} onPress={handleLanguageToggle}>
                    <Typography variant='text' size='sm' weight='bold' style={styles.languageText}>
                        {language.toUpperCase()}
                    </Typography>
                </Pressable>
            )}

            {showCart && (
                <Pressable style={styles.iconButton} onPress={() => router.push('/cart')}>
                    <Feather name='shopping-cart' size={24} color={theme.colors.text.primary} />
                    {getItemCount() > 0 && (
                        <View style={styles.badge}>
                            <Typography variant='text' size='xs' style={styles.badgeText}>
                                {getItemCount() > 9 ? '9+' : getItemCount()}
                            </Typography>
                        </View>
                    )}
                </Pressable>
            )}
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
            fontSize: 14,
            fontFamily: 'Inter_400Regular', // Assuming Inter font is available or fallback
            padding: 0,
        },
        iconButton: {
            padding: 4,
            position: 'relative',
        },
        languageButton: {
            paddingHorizontal: 8,
            paddingVertical: 6,
            backgroundColor: theme.colors.background.secondary,
            borderRadius: 6,
            justifyContent: 'center',
            alignItems: 'center',
            minWidth: 36,
        },
        languageText: {
            color: theme.colors.text.primary,
        },
        badge: {
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: '#EF4444',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
        },
        badgeText: {
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: '700',
        },
    });

export default Header;
