import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Image,
    ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Typography, AuthProtect } from '@/components';
import { useTheme, useAuth, useLanguage } from '@/contexts';
import { supabase } from '@/services/supabase';

// Rank benefit icons
import CashbackIcon from '@/assets/rank/1.svg';
import OffersIcon from '@/assets/rank/2.svg';

// Rank card background images
const RANK_CARDS = {
    member: require('@/assets/rank/member.png'),
    silver: require('@/assets/rank/silver.png'),
    gold: require('@/assets/rank/gold.png'),
    diamond: require('@/assets/rank/diamond.png'),
};

// Type assertion helper for tables not yet in generated types
const db = supabase as any;

// Rank definitions
type RankType = 'member' | 'silver' | 'gold' | 'diamond';

interface RankConfig {
    key: RankType;
    threshold: number; // required to reach this rank
    nextThreshold: number; // required to reach next rank
    cashbackPercent: number;
    overlayColors: [string, string]; // gradient overlay for top of screen
    textColor: string; // text color on card
}

interface RankInfo extends RankConfig {
    name: string;
}

const RANK_CONFIGS: RankConfig[] = [
    {
        key: 'member',
        threshold: 0,
        nextThreshold: 5000000,
        cashbackPercent: 2,
        overlayColors: ['rgba(200, 230, 255, 0.3)', 'transparent'],
        textColor: '#1F4E79',
    },
    {
        key: 'silver',
        threshold: 5000000,
        nextThreshold: 15000000,
        cashbackPercent: 2,
        overlayColors: ['rgba(180, 195, 210, 0.3)', 'transparent'],
        textColor: '#4A5568',
    },
    {
        key: 'gold',
        threshold: 15000000,
        nextThreshold: 30000000,
        cashbackPercent: 4,
        overlayColors: ['rgba(255, 215, 100, 0.25)', 'transparent'],
        textColor: '#7C5C00',
    },
    {
        key: 'diamond',
        threshold: 30000000,
        nextThreshold: 50000000,
        cashbackPercent: 10,
        overlayColors: ['rgba(80, 80, 80, 0.3)', 'transparent'],
        textColor: '#FFFFFF',
    },
];

interface MembershipData {
    total_spent: number;
    current_rank: RankType;
    points: number;
}

const MembershipScreen = () => {
    const router = useRouter();
    const theme = useTheme();
    const { user, profile } = useAuth();
    const { t } = useLanguage();
    const styles = createStyles(theme);

    const ranks: RankInfo[] = useMemo(() => {
        return RANK_CONFIGS.map(config => ({
            ...config,
            name: t(`membership.ranks.${config.key}`),
        }));
    }, [t]);

    const [isLoading, setIsLoading] = useState(true);
    const [membershipData, setMembershipData] = useState<MembershipData>({
        total_spent: 22876564,
        current_rank: 'gold',
        points: 0,
    });
    const [selectedRank, setSelectedRank] = useState<RankType>('gold');

    const fetchMembershipData = useCallback(async () => {
        try {
            if (!profile) {
                setIsLoading(false);
                return;
            }

            const totalSpent = Number(profile.total_spent || 0);

            // Determine rank based on total spent
            let currentRank: RankType = 'member';
            for (let i = ranks.length - 1; i >= 0; i--) {
                if (totalSpent >= ranks[i].threshold) {
                    currentRank = ranks[i].key;
                    break;
                }
            }

            setMembershipData({
                total_spent: totalSpent,
                current_rank: currentRank,
                points: profile.loyalty_points || 0,
            });
            setSelectedRank(currentRank);
        } catch (error) {
            console.error('[MembershipScreen] Error processing data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [profile, ranks]);

    useEffect(() => {
        fetchMembershipData();
    }, [fetchMembershipData]);

    const formatCurrency = (value: number) => {
        return `¥${value.toLocaleString('ja-JP')}`;
    };

    const formatThreshold = (value: number) => {
        return formatCurrency(value);
    };

    const getCurrentRankInfo = () => {
        return ranks.find(r => r.key === membershipData.current_rank) || ranks[0];
    };

    const getSelectedRankInfo = () => {
        return ranks.find(r => r.key === selectedRank) || ranks[0];
    };

    const getProgress = () => {
        const rankInfo = getCurrentRankInfo();
        const spent = membershipData.total_spent;
        const progress = (spent - rankInfo.threshold) / (rankInfo.nextThreshold - rankInfo.threshold);
        return Math.min(Math.max(progress, 0), 1);
    };

    const getNextRankThreshold = () => {
        const rankInfo = getCurrentRankInfo();
        return rankInfo.nextThreshold;
    };

    const getRemainingToNextRank = () => {
        const rankInfo = getCurrentRankInfo();
        return Math.max(rankInfo.nextThreshold - membershipData.total_spent, 0);
    };

    const getNextRankName = () => {
        const currentIndex = ranks.findIndex(r => r.key === membershipData.current_rank);
        return ranks[currentIndex + 1]?.name || '';
    };

    const renderBenefitItem = (
        icon: React.ReactNode,
        title: string,
        description: string
    ) => (
        <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
                {icon}
            </View>
            <View style={styles.benefitContent}>
                <Typography variant="text" size="md" weight="semiBold">
                    {title}
                </Typography>
                <Typography variant="text" size="sm" style={styles.benefitDescription}>
                    {description}
                </Typography>
            </View>
        </View>
    );

    const selectedRankInfo = getSelectedRankInfo();
    const isCurrentRank = selectedRank === membershipData.current_rank;
    const isMaxRank = membershipData.current_rank === 'diamond';

    return (
        <AuthProtect>
            <View style={styles.container}>
                {/* Top overlay gradient based on selected rank */}
                <LinearGradient
                    colors={selectedRankInfo.overlayColors}
                    style={styles.topOverlay}
                    pointerEvents="none"
                />

                <SafeAreaView style={styles.safeArea} edges={['top']}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable style={styles.backButton} onPress={() => router.back()}>
                            <Feather name="arrow-left" size={24} color={theme.colors.text.primary} />
                        </Pressable>
                        <Typography variant="text" size="lg" weight="bold">
                            {t('membership.title')}
                        </Typography>
                        <Pressable style={styles.infoButton}>
                            <Feather name="info" size={20} color={theme.colors.text.tertiary} />
                        </Pressable>
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
                            {/* Rank Card - Using Absolute Image */}
                            <View style={styles.rankCard}>
                                <Image
                                    source={RANK_CARDS[selectedRank]}
                                    style={styles.rankCardBg}
                                    resizeMode="cover"
                                />
                                <View style={styles.rankCardContent}>
                                    {/* Rank Info - Left Side */}
                                    <View style={styles.rankInfo}>
                                        <Typography
                                            variant="text"
                                            size="xl"
                                            weight="bold"
                                            style={[styles.rankName, { color: selectedRankInfo.textColor }]}
                                        >
                                            {selectedRankInfo.name}
                                        </Typography>

                                        <Typography
                                            variant="text"
                                            size="sm"
                                            style={[styles.totalLabel, { color: selectedRankInfo.textColor, opacity: 0.7 }]}
                                        >
                                            {t('membership.totalAccumulated')}
                                        </Typography>

                                        <View style={styles.amountRow}>
                                            <Typography
                                                variant="text"
                                                size="xl"
                                                weight="bold"
                                                style={[styles.amountText, { color: selectedRankInfo.textColor }]}
                                            >
                                                {formatCurrency(membershipData.total_spent)}
                                            </Typography>
                                            {!isMaxRank && isCurrentRank && (
                                                <Typography
                                                    variant="text"
                                                    size="md"
                                                    style={[styles.thresholdText, { color: selectedRankInfo.textColor, opacity: 0.6 }]}
                                                >
                                                    /{formatThreshold(getNextRankThreshold())}
                                                </Typography>
                                            )}
                                        </View>
                                    </View>

                                    {/* Progress Bar */}
                                    {!isMaxRank && isCurrentRank && (
                                        <>
                                            <View style={styles.progressBarContainer}>
                                                <View style={[
                                                    styles.progressBar,
                                                    { backgroundColor: selectedRank === 'diamond' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }
                                                ]}>
                                                    <View
                                                        style={[
                                                            styles.progressFill,
                                                            {
                                                                width: `${getProgress() * 100}%`,
                                                                backgroundColor: selectedRank === 'diamond' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.15)'
                                                            },
                                                        ]}
                                                    />
                                                    <View
                                                        style={[
                                                            styles.progressThumb,
                                                            { left: `${getProgress() * 100}%` }
                                                        ]}
                                                    />
                                                </View>
                                            </View>
                                            <Typography
                                                variant="text"
                                                size="xs"
                                                style={[styles.remainingText, { color: selectedRankInfo.textColor, opacity: 0.7 }]}
                                            >
                                                {t('membership.accumulateMore')} {formatCurrency(getRemainingToNextRank())} {t('membership.toReach')} {getNextRankName()}
                                            </Typography>
                                        </>
                                    )}

                                    {isMaxRank && isCurrentRank && (
                                        <Typography
                                            variant="text"
                                            size="sm"
                                            style={[styles.maxRankText, { color: selectedRankInfo.textColor }]}
                                        >
                                            {t('membership.maxRankReached')}
                                        </Typography>
                                    )}
                                </View>
                            </View>

                            {/* Rank Tabs */}
                            <View style={styles.rankTabs}>
                                {ranks.map((rank) => (
                                    <Pressable
                                        key={rank.key}
                                        style={[
                                            styles.rankTab,
                                            selectedRank === rank.key && styles.rankTabActive,
                                        ]}
                                        onPress={() => setSelectedRank(rank.key)}
                                    >
                                        <Typography
                                            variant="text"
                                            size="sm"
                                            weight={selectedRank === rank.key ? 'bold' : 'regular'}
                                            style={[
                                                styles.rankTabText,
                                                selectedRank === rank.key && styles.rankTabTextActive,
                                            ]}
                                        >
                                            {rank.name}
                                        </Typography>
                                    </Pressable>
                                ))}
                            </View>

                            {/* Benefits Section */}
                            <View style={styles.benefitsSection}>
                                {/* Accumulation Threshold */}
                                <View style={styles.benefitRow}>
                                    <Typography variant="text" size="md" style={styles.benefitLabel}>
                                        {t('membership.accumulationThreshold')}
                                    </Typography>
                                    <Typography variant="text" size="md" weight="semiBold" style={styles.benefitValue}>
                                        {selectedRankInfo.threshold === 0
                                            ? formatThreshold(selectedRankInfo.nextThreshold)
                                            : formatThreshold(selectedRankInfo.threshold)}
                                    </Typography>
                                </View>

                                {/* Cashback Points */}
                                {renderBenefitItem(
                                    <CashbackIcon width={40} height={40} />,
                                    t('membership.cashbackPoints'),
                                    `${t('membership.earn')} ${selectedRankInfo.cashbackPercent}% ${t('membership.invoiceValueToPoints')}`
                                )}

                                {/* Monthly Special Offers */}
                                {renderBenefitItem(
                                    <OffersIcon width={40} height={40} />,
                                    t('membership.monthlyOffers'),
                                    t('membership.monthlyOffersDesc')
                                )}
                            </View>
                        </ScrollView>
                    )}
                </SafeAreaView>
            </View>
        </AuthProtect>
    );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background.secondary,
        },
        safeArea: {
            flex: 1,
        },
        topOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 250,
            zIndex: 0,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: 'transparent',
        },
        backButton: {
            padding: 4,
        },
        infoButton: {
            padding: 4,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        scrollContent: {
            padding: 16,
            paddingBottom: 32,
        },
        // Rank Card
        rankCard: {
            borderRadius: 20,
            overflow: 'hidden',
            marginBottom: 16,
            minHeight: 160,
            aspectRatio: 5 / 2,
            width: '100%',
        },
        rankCardBg: {
            ...StyleSheet.absoluteFillObject,
            width: '100%',
            height: '100%',
            zIndex: -1,
        },
        rankCardContent: {
            flex: 1,
            padding: 20,
            justifyContent: 'center',
        },
        rankInfo: {
            // flex: 1,
            paddingRight: 80, // Space for the badge on right side of image
        },
        rankName: {
            marginBottom: 12,
            fontSize: 22,
        },
        totalLabel: {
            marginBottom: 4,
        },
        amountRow: {
            flexDirection: 'row',
            alignItems: 'baseline',
            marginBottom: 12,
            flexWrap: 'wrap',
        },
        amountText: {
            fontSize: 20,
        },
        thresholdText: {
            marginLeft: 2,
            fontSize: 14,
        },
        progressBarContainer: {
            marginBottom: 8,
        },
        progressBar: {
            height: 8,
            borderRadius: 4,
            position: 'relative',
        },
        progressFill: {
            height: '100%',
            borderRadius: 4,
        },
        progressThumb: {
            position: 'absolute',
            top: -2,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#FFFFFF',
            marginLeft: -6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
        },
        remainingText: {
        },
        maxRankText: {
            fontStyle: 'italic',
        },
        // Rank Tabs
        rankTabs: {
            flexDirection: 'row',
            backgroundColor: theme.colors.background.primary,
            borderRadius: 12,
            padding: 4,
            marginBottom: 16,
        },
        rankTab: {
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderRadius: 8,
        },
        rankTabActive: {
            borderBottomWidth: 2,
            borderBottomColor: theme.colors.text.primary,
        },
        rankTabText: {
            color: theme.colors.text.tertiary,
        },
        rankTabTextActive: {
            color: theme.colors.text.primary,
        },
        // Benefits
        benefitsSection: {
            backgroundColor: theme.colors.background.primary,
            borderRadius: 16,
            padding: 16,
        },
        benefitRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border.tertiary,
        },
        benefitLabel: {
            color: theme.colors.text.secondary,
        },
        benefitValue: {
            color: '#3B82F6',
        },
        benefitItem: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border.tertiary,
        },
        benefitIcon: {
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        benefitContent: {
            flex: 1,
        },
        benefitDescription: {
            color: theme.colors.text.tertiary,
            marginTop: 4,
            lineHeight: 20,
        },
    });

export default MembershipScreen;
