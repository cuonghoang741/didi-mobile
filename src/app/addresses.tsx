import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography, AuthProtect } from '@/components';
import { useTheme, useAuth, useLanguage } from '@/contexts';
import { supabase } from '@/services/supabase';

// Type assertion helper for tables not yet in generated types
const db = supabase as any;

interface Address {
    id: string;
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    ward?: string;
    district?: string;
    city: string;
    province?: string;
    postal_code?: string;
    is_default: boolean;
    type: string;
}

const AddressesScreen = () => {
    const router = useRouter();
    const theme = useTheme();
    const { user } = useAuth();
    const { t } = useLanguage();
    const styles = createStyles(theme);

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchAddresses = useCallback(async () => {
        if (!user?.id) return;

        try {
            const { data, error } = await db
                .from('customer_addresses')
                .select('*')
                .eq('customer_id', user.id)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAddresses(data || []);
        } catch (error) {
            console.error('[AddressesScreen] Error fetching addresses:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchAddresses();
    };

    const handleAddAddress = () => {
        router.push('/address-form' as any);
    };

    const handleEditAddress = (addressId: string) => {
        router.push(`/address-form?id=${addressId}` as any);
    };

    const handleSetDefault = async (addressId: string) => {
        if (!user?.id) return;

        try {
            // First, unset all defaults
            await db
                .from('customer_addresses')
                .update({ is_default: false })
                .eq('customer_id', user.id);

            // Then set the selected one as default
            await db
                .from('customer_addresses')
                .update({ is_default: true })
                .eq('id', addressId);

            fetchAddresses();
        } catch (error) {
            console.error('[AddressesScreen] Error setting default:', error);
            Alert.alert(t('common.error'), t('addresses.errors.setDefaultFailed'));
        }
    };

    const handleDeleteAddress = (addressId: string, addressName: string) => {
        Alert.alert(
            t('addresses.deleteTitle'),
            `${t('addresses.deleteConfirm')} "${addressName}"?`,
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await db
                                .from('customer_addresses')
                                .delete()
                                .eq('id', addressId);

                            if (error) throw error;
                            fetchAddresses();
                        } catch (error) {
                            console.error('[AddressesScreen] Error deleting address:', error);
                            Alert.alert(t('common.error'), t('addresses.errors.deleteFailed'));
                        }
                    },
                },
            ],
        );
    };

    const formatAddress = (address: Address) => {
        const parts = [
            address.address_line1,
            address.address_line2,
            address.ward,
            address.district,
            address.city,
            address.province,
        ].filter(Boolean);
        return parts.join(', ');
    };

    const renderAddressCard = (address: Address) => (
        <Pressable
            key={address.id}
            style={styles.addressCard}
            onPress={() => handleEditAddress(address.id)}
        >
            <View style={styles.addressHeader}>
                <View style={styles.addressInfo}>
                    <View style={styles.nameRow}>
                        <Typography variant='text' size='md' weight='bold'>
                            {address.full_name}
                        </Typography>
                        {address.is_default && (
                            <View style={styles.defaultBadge}>
                                <Typography variant='text' size='xs' style={styles.defaultBadgeText}>
                                    {t('addresses.default')}
                                </Typography>
                            </View>
                        )}
                    </View>
                    <Typography variant='text' size='sm' style={styles.phone}>
                        {address.phone}
                    </Typography>
                </View>
            </View>

            <Typography variant='text' size='sm' style={styles.addressText}>
                {formatAddress(address)}
            </Typography>

            <View style={styles.addressActions}>
                {!address.is_default && (
                    <Pressable
                        style={styles.actionButton}
                        onPress={() => handleSetDefault(address.id)}
                    >
                        <Feather name='check-circle' size={16} color={theme.colors.foreground.brand_primary} />
                        <Typography variant='text' size='sm' style={styles.actionButtonText}>
                            {t('addresses.setDefault')}
                        </Typography>
                    </Pressable>
                )}
                <Pressable
                    style={styles.actionButton}
                    onPress={() => handleEditAddress(address.id)}
                >
                    <Feather name='edit-2' size={16} color={theme.colors.text.secondary} />
                    <Typography variant='text' size='sm' style={styles.actionButtonTextSecondary}>
                        {t('common.edit')}
                    </Typography>
                </Pressable>
                <Pressable
                    style={styles.actionButton}
                    onPress={() => handleDeleteAddress(address.id, address.full_name)}
                >
                    <Feather name='trash-2' size={16} color='#EF4444' />
                    <Typography variant='text' size='sm' style={styles.actionButtonTextDanger}>
                        {t('common.delete')}
                    </Typography>
                </Pressable>
            </View>
        </Pressable>
    );

    return (
        <AuthProtect>
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Feather name='arrow-left' size={24} color={theme.colors.text.primary} />
                    </Pressable>
                    <Typography variant='text' size='lg' weight='bold'>
                        {t('addresses.title')}
                    </Typography>
                    <Pressable style={styles.addButton} onPress={handleAddAddress}>
                        <Feather name='plus' size={24} color={theme.colors.foreground.brand_primary} />
                    </Pressable>
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size='large' color={theme.colors.foreground.brand_primary} />
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                        }
                    >
                        {addresses.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIcon}>
                                    <Feather name='map-pin' size={48} color={theme.colors.text.tertiary} />
                                </View>
                                <Typography variant='text' size='lg' weight='medium' style={styles.emptyTitle}>
                                    {t('addresses.empty')}
                                </Typography>
                                <Typography variant='text' size='sm' style={styles.emptySubtitle}>
                                    {t('addresses.emptyDescription')}
                                </Typography>
                                <Pressable style={styles.emptyAddButton} onPress={handleAddAddress}>
                                    <Feather name='plus' size={20} color='#FFFFFF' />
                                    <Typography variant='text' size='md' weight='medium' style={styles.emptyAddButtonText}>
                                        {t('addresses.addNew')}
                                    </Typography>
                                </Pressable>
                            </View>
                        ) : (
                            <>
                                {addresses.map(renderAddressCard)}
                                <Pressable style={styles.addNewButton} onPress={handleAddAddress}>
                                    <Feather name='plus' size={20} color={theme.colors.foreground.brand_primary} />
                                    <Typography variant='text' size='md' weight='medium' style={styles.addNewButtonText}>
                                        {t('addresses.addNew')}
                                    </Typography>
                                </Pressable>
                            </>
                        )}
                    </ScrollView>
                )}
            </SafeAreaView>
        </AuthProtect>
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
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: theme.colors.background.primary,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border.tertiary,
        },
        backButton: {
            padding: 4,
        },
        addButton: {
            padding: 4,
        },
        scrollContent: {
            padding: 16,
            paddingBottom: 32,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        addressCard: {
            backgroundColor: theme.colors.background.primary,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: theme.colors.border.secondary,
        },
        addressHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 8,
        },
        addressInfo: {
            flex: 1,
        },
        nameRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        phone: {
            color: theme.colors.text.secondary,
            marginTop: 2,
        },
        defaultBadge: {
            backgroundColor: theme.colors.foreground.brand_primary,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
        },
        defaultBadgeText: {
            color: '#FFFFFF',
            fontWeight: '500',
        },
        addressText: {
            color: theme.colors.text.secondary,
            lineHeight: 20,
        },
        addressActions: {
            flexDirection: 'row',
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border.tertiary,
            gap: 16,
        },
        actionButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        actionButtonText: {
            color: theme.colors.foreground.brand_primary,
        },
        actionButtonTextSecondary: {
            color: theme.colors.text.secondary,
        },
        actionButtonTextDanger: {
            color: '#EF4444',
        },
        emptyState: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 60,
        },
        emptyIcon: {
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: theme.colors.background.tertiary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
        },
        emptyTitle: {
            color: theme.colors.text.primary,
            marginBottom: 8,
        },
        emptySubtitle: {
            color: theme.colors.text.tertiary,
            textAlign: 'center',
            paddingHorizontal: 32,
            marginBottom: 24,
        },
        emptyAddButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: theme.colors.foreground.brand_primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 24,
        },
        emptyAddButtonText: {
            color: '#FFFFFF',
        },
        addNewButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: theme.colors.background.primary,
            paddingVertical: 16,
            marginHorizontal: 48,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.foreground.brand_primary,
            borderStyle: 'dashed',
        },
        addNewButtonText: {
            color: theme.colors.foreground.brand_primary,
        },
    });

export default AddressesScreen;
