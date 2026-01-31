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
    nickname?: string;
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

    // Get location label from province or city
    const getLocationLabel = (address: Address) => {
        if (address.province) return address.province;
        if (address.city) return address.city;
        return t('addresses.locationDefault');
    };

    const renderAddressCard = (address: Address) => (
        <Pressable
            key={address.id}
            style={styles.addressCard}
            onPress={() => handleEditAddress(address.id)}
        >
            <View style={styles.cardContent}>
                {/* Location Icon */}
                <View style={styles.locationIconContainer}>
                    <Feather name='map-pin' size={20} color={theme.colors.text.secondary} />
                </View>

                {/* Address Info */}
                <View style={styles.addressInfo}>
                    {/* Nickname + Phone */}
                    <View style={styles.mainInfo}>
                        <Typography variant='text' size='md' weight='bold'>
                            {address.nickname || address.full_name}
                        </Typography>
                        <Typography variant='text' size='md' style={styles.phoneText}>
                            {address.phone}
                        </Typography>
                    </View>

                    {/* Location Badge */}
                    <View style={styles.locationBadge}>
                        <Typography variant='text' size='xs' style={styles.locationBadgeText}>
                            {getLocationLabel(address)}
                        </Typography>
                    </View>
                </View>

                {/* Delete Button */}
                <Pressable
                    style={styles.deleteButton}
                    onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteAddress(address.id, address.nickname || address.full_name);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Feather name='trash-2' size={20} color={theme.colors.text.tertiary} />
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
                        {t('addresses.titleShort')}
                    </Typography>
                    <View style={{ width: 32 }} />
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
                        {/* Address List */}
                        {addresses.map(renderAddressCard)}

                        {/* Add New Address Button */}
                        <Pressable style={styles.addNewButton} onPress={handleAddAddress}>
                            <Feather name='plus' size={20} color={theme.colors.text.primary} />
                            <Typography variant='text' size='md' style={styles.addNewButtonText}>
                                {t('addresses.addNewSaved')}
                            </Typography>
                        </Pressable>
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
            backgroundColor: theme.colors.background.secondary,
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
        scrollContent: {
            padding: 16,
            paddingBottom: 32,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        // Address Card Styles
        addressCard: {
            backgroundColor: theme.colors.background.primary,
            borderRadius: 12,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
        },
        cardContent: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: 16,
        },
        locationIconContainer: {
            marginRight: 12,
            marginTop: 2,
        },
        addressInfo: {
            flex: 1,
        },
        mainInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 8,
        },
        phoneText: {
            color: theme.colors.text.primary,
        },
        locationBadge: {
            alignSelf: 'flex-start',
            backgroundColor: '#FEE2E2',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 4,
        },
        locationBadgeText: {
            color: '#DC2626',
            fontWeight: '500',
        },
        deleteButton: {
            padding: 4,
            marginLeft: 8,
        },
        // Add New Button Styles
        addNewButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 12,
            backgroundColor: theme.colors.background.primary,
            paddingVertical: 16,
            paddingHorizontal: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.border.secondary,
            borderStyle: 'dashed',
        },
        addNewButtonText: {
            color: theme.colors.text.primary,
        },
    });

export default AddressesScreen;
