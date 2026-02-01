import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Typography, AuthProtect } from '@/components';
import { useTheme, useAuth, useLanguage } from '@/contexts';
import { supabase } from '@/services/supabase';

const db = supabase as any;

// Voucher Icon Component
const VoucherIcon = ({ color = '#FFFFFF', size = 20 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M9 9H9.01M15 15H15.01M16 8L8 16M17.9012 4.99851C18.1071 5.49653 18.5024 5.8924 19.0001 6.09907L20.7452 6.82198C21.2433 7.02828 21.639 7.42399 21.8453 7.92206C22.0516 8.42012 22.0516 8.97974 21.8453 9.47781L21.1229 11.2218C20.9165 11.7201 20.9162 12.2803 21.1236 12.7783L21.8447 14.5218C21.9469 14.7685 21.9996 15.0329 21.9996 15.2999C21.9997 15.567 21.9471 15.8314 21.8449 16.0781C21.7427 16.3249 21.5929 16.549 21.4041 16.7378C21.2152 16.9266 20.991 17.0764 20.7443 17.1785L19.0004 17.9009C18.5023 18.1068 18.1065 18.5021 17.8998 18.9998L17.1769 20.745C16.9706 21.2431 16.575 21.6388 16.0769 21.8451C15.5789 22.0514 15.0193 22.0514 14.5212 21.8451L12.7773 21.1227C12.2792 20.9169 11.7198 20.9173 11.2221 21.1239L9.47689 21.8458C8.97912 22.0516 8.42001 22.0514 7.92237 21.8453C7.42473 21.6391 7.02925 21.2439 6.82281 20.7464L6.09972 19.0006C5.8938 18.5026 5.49854 18.1067 5.00085 17.9L3.25566 17.1771C2.75783 16.9709 2.36226 16.5754 2.15588 16.0777C1.94951 15.5799 1.94923 15.0205 2.1551 14.5225L2.87746 12.7786C3.08325 12.2805 3.08283 11.7211 2.8763 11.2233L2.15497 9.47678C2.0527 9.2301 2.00004 8.96568 2 8.69863C1.99996 8.43159 2.05253 8.16715 2.15472 7.92043C2.25691 7.67372 2.40671 7.44955 2.59557 7.26075C2.78442 7.07195 3.00862 6.92222 3.25537 6.8201L4.9993 6.09772C5.49687 5.89197 5.89248 5.4972 6.0993 5.00006L6.82218 3.25481C7.02848 2.75674 7.42418 2.36103 7.92222 2.15473C8.42027 1.94842 8.97987 1.94842 9.47792 2.15473L11.2218 2.87712C11.7199 3.08291 12.2793 3.08249 12.7771 2.87595L14.523 2.15585C15.021 1.94966 15.5804 1.9497 16.0784 2.15597C16.5763 2.36223 16.972 2.75783 17.1783 3.25576L17.9014 5.00153L17.9012 4.99851ZM9.5 9C9.5 9.27614 9.27614 9.5 9 9.5C8.72386 9.5 8.5 9.27614 8.5 9C8.5 8.72386 8.72386 8.5 9 8.5C9.27614 8.5 9.5 8.72386 9.5 9ZM15.5 15C15.5 15.2761 15.2761 15.5 15 15.5C14.7239 15.5 14.5 15.2761 14.5 15C14.5 14.7239 14.7239 14.5 15 14.5C15.2761 14.5 15.5 14.7239 15.5 15Z"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export interface Voucher {
    id: string;
    code: string;
    title: string;
    description?: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_value?: number;
    max_discount?: number;
    valid_from: string;
    valid_until: string;
    usage_limit?: number;
    used_count: number;
    is_active: boolean;
    icon_type?: 'voucher' | 'cart' | 'gift' | 'percent';
    icon_bg_color?: string;
}

interface VoucherWithUsage extends Voucher {
    usage_logs?: Array<{
        id: string;
        customer_id: string;
        used_at: string;
        order_id?: string;
    }>;
}

const SelectVoucherScreen = () => {
    const router = useRouter();
    const { orderTotal } = useLocalSearchParams<{ orderTotal?: string }>();
    const theme = useTheme();
    const { user } = useAuth();
    const { t } = useLanguage();
    const styles = createStyles(theme);

    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const total = orderTotal ? parseFloat(orderTotal) : 0;

    const fetchVouchers = useCallback(async () => {
        if (!user?.id) return;

        try {
            const { data, error } = await db
                .from('vouchers')
                .select(`
                    *,
                    usage_logs:voucher_usage_logs!left(
                        id,
                        customer_id,
                        used_at,
                        order_id
                    )
                `)
                .eq('is_active', true)
                .eq('voucher_usage_logs.customer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Filter available vouchers (not used, not expired)
            const now = new Date();
            const availableVouchers = (data || [])
                .filter((v: VoucherWithUsage) => {
                    const validUntil = new Date(v.valid_until);
                    const validFrom = new Date(v.valid_from);
                    const isExpired = validUntil < now;
                    const isNotStarted = validFrom > now;
                    const isUsed = v.usage_logs?.some(log => log.customer_id === user.id);
                    return !isExpired && !isNotStarted && !isUsed && v.is_active;
                })
                .map((v: VoucherWithUsage): Voucher => ({
                    id: v.id,
                    code: v.code,
                    title: v.title,
                    description: v.description,
                    discount_type: v.discount_type,
                    discount_value: v.discount_value,
                    min_order_value: v.min_order_value,
                    max_discount: v.max_discount,
                    valid_from: v.valid_from,
                    valid_until: v.valid_until,
                    usage_limit: v.usage_limit,
                    used_count: v.used_count,
                    is_active: v.is_active,
                    icon_type: v.icon_type,
                    icon_bg_color: v.icon_bg_color,
                }));

            setVouchers(availableVouchers);
        } catch (error) {
            console.error('[SelectVoucherScreen] Error fetching vouchers:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchVouchers();
    }, [fetchVouchers]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const getTimeRemaining = (validUntil: string) => {
        const now = new Date();
        const end = new Date(validUntil);
        const diff = end.getTime() - now.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return t('voucher.daysLeft', { days });
        } else if (hours > 0) {
            return t('voucher.hoursLeft', { hours });
        } else {
            return t('voucher.expiringSoon');
        }
    };

    const getVoucherIcon = (voucher: Voucher) => {
        const iconType = voucher.icon_type || 'voucher';
        const bgColor = voucher.icon_bg_color || '#3B82F6';

        const iconStyle = [styles.voucherIconContainer, { backgroundColor: bgColor }];

        switch (iconType) {
            case 'cart':
                return (
                    <View style={iconStyle}>
                        <MaterialCommunityIcons name="cart" size={20} color="#FFFFFF" />
                    </View>
                );
            case 'gift':
                return (
                    <View style={iconStyle}>
                        <MaterialCommunityIcons name="gift" size={20} color="#FFFFFF" />
                    </View>
                );
            case 'percent':
                return (
                    <View style={iconStyle}>
                        <MaterialCommunityIcons name="percent" size={20} color="#FFFFFF" />
                    </View>
                );
            default:
                return (
                    <View style={iconStyle}>
                        <VoucherIcon color="#FFFFFF" size={20} />
                    </View>
                );
        }
    };

    const handleSelectVoucher = async (voucher: Voucher) => {
        // Save selected voucher to AsyncStorage
        try {
            await AsyncStorage.setItem('selectedVoucher', JSON.stringify({
                id: voucher.id,
                code: voucher.code,
                title: voucher.title,
                discount_type: voucher.discount_type,
                discount_value: voucher.discount_value,
                max_discount: voucher.max_discount,
            }));
            router.back();
        } catch (error) {
            console.error('Error saving voucher:', error);
        }
    };

    const isVoucherApplicable = (voucher: Voucher): boolean => {
        if (voucher.min_order_value && total < voucher.min_order_value) {
            return false;
        }
        return true;
    };

    const renderVoucherCard = (voucher: Voucher) => {
        const isApplicable = isVoucherApplicable(voucher);

        return (
            <Pressable
                key={voucher.id}
                style={styles.voucherCard}
                onPress={() => isApplicable && handleSelectVoucher(voucher)}
            >
                <View style={styles.voucherContent}>
                    {/* Voucher Icon */}
                    {getVoucherIcon(voucher)}

                    {/* Voucher Info */}
                    <View style={styles.voucherInfo}>
                        <Typography
                            variant="text"
                            size="md"
                            weight="semiBold"
                            style={styles.voucherTitle}
                            numberOfLines={2}
                        >
                            {voucher.title}
                        </Typography>
                        {voucher.description && (
                            <Typography
                                variant="text"
                                size="sm"
                                style={styles.voucherDescription}
                                numberOfLines={2}
                            >
                                {voucher.description}
                            </Typography>
                        )}
                    </View>
                </View>

                <View style={styles.voucherFooter}>
                    <View style={styles.dateContainer}>
                        <Feather
                            name="clock"
                            size={14}
                            color={theme.palette.greenLight[600]}
                        />
                        <Typography
                            variant="text"
                            size="sm"
                            style={[styles.dateText, { color: theme.palette.greenLight[600] }]}
                        >
                            {getTimeRemaining(voucher.valid_until)}
                        </Typography>
                    </View>

                    <Pressable
                        onPress={() => isApplicable && handleSelectVoucher(voucher)}
                        disabled={!isApplicable}
                    >
                        <Typography
                            variant="text"
                            size="sm"
                            weight="semiBold"
                            style={[
                                styles.actionText,
                                { color: isApplicable ? '#3B82F6' : theme.colors.text.tertiary },
                            ]}
                        >
                            {isApplicable ? t('voucher.useNow') : t('voucher.notApplicable')}
                        </Typography>
                    </Pressable>
                </View>
            </Pressable>
        );
    };

    return (
        <AuthProtect>
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Feather name="arrow-left" size={24} color={theme.colors.text.primary} />
                    </Pressable>
                    <Typography variant="text" size="lg" weight="bold">
                        {t('voucher.title')}
                    </Typography>
                    <View style={{ width: 32 }} />
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.foreground.brand_primary} />
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {vouchers.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <VoucherIcon color={theme.colors.text.tertiary} size={64} />
                                <Typography
                                    variant="text"
                                    size="md"
                                    style={styles.emptyText}
                                >
                                    {t('voucher.empty')}
                                </Typography>
                            </View>
                        ) : (
                            vouchers.map(renderVoucherCard)
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
        scrollContent: {
            padding: 16,
            paddingBottom: 32,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        // Voucher Card
        voucherCard: {
            backgroundColor: theme.colors.background.primary,
            borderRadius: 16,
            marginBottom: 12,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
        },
        voucherCardDisabled: {
            opacity: 0.6,
        },
        voucherContent: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 12,
        },
        voucherIconContainer: {
            width: 44,
            height: 44,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        voucherInfo: {
            flex: 1,
        },
        voucherTitle: {
            color: theme.colors.text.primary,
            marginBottom: 4,
            lineHeight: 20,
        },
        voucherDescription: {
            color: theme.colors.text.secondary,
            lineHeight: 18,
        },
        textDisabled: {
            color: theme.colors.text.tertiary,
        },
        // Footer
        voucherFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        dateContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.palette.greenLight[100],
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            gap: 4,
        },
        dateText: {
            fontWeight: '500',
            fontSize: 12,
        },
        actionText: {
            fontWeight: '600',
        },
        // Empty State
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 60,
        },
        emptyText: {
            color: theme.colors.text.tertiary,
            marginTop: 16,
            textAlign: 'center',
        },
    });

export default SelectVoucherScreen;
