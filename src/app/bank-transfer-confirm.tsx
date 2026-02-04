import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
    Modal,
    ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography } from '@/components';
import { useTheme, useLanguage } from '@/contexts';
import { useCurrency } from '@/hooks';
import { useSettings } from '@/hooks/useSettings';

interface BankAccount {
    id: string;
    bank_name: string;
    account_name: string;
    account_number: string;
    branch?: string;
}

const BankTransferConfirmScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams<{
        orderId: string;
        orderNumber: string;
        totalAmount: string;
    }>();
    const theme = useTheme();
    const { t } = useLanguage();
    const { formatJpy } = useCurrency();
    const { settings } = useSettings();
    const styles = createStyles(theme);

    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
    const [showProofModal, setShowProofModal] = useState(false);
    const [proofImage, setProofImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const orderId = params.orderId || '';
    const orderNumber = params.orderNumber || '';
    const totalAmount = params.totalAmount ? parseFloat(params.totalAmount) : 0;

    useEffect(() => {
        if (settings?.bank_accounts) {
            try {
                const accounts = typeof settings.bank_accounts === 'string'
                    ? JSON.parse(settings.bank_accounts)
                    : settings.bank_accounts;
                setBankAccounts(accounts);
                if (accounts.length > 0) {
                    setSelectedAccount(accounts[0]);
                }
            } catch (e) {
                console.error('Error parsing bank accounts:', e);
            }
        }
    }, [settings]);

    const handleCopy = async (text: string, label: string) => {
        await Clipboard.setStringAsync(text);
        Alert.alert(t('checkout.copied'), `${label} ${t('checkout.accountCopied')}`);
    };

    const transferContent = `O${orderNumber.slice(-6)}-${orderNumber}`;

    const handleConfirmTransfer = () => {
        setShowProofModal(true);
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const actions: any[] = [];
            if (asset.width > 1500 || asset.height > 2000) {
                if (asset.width / asset.height > 1500 / 2000) {
                    actions.push({ resize: { width: 1500 } });
                } else {
                    actions.push({ resize: { height: 2000 } });
                }
            }

            const manipulatedImage = await manipulateAsync(
                asset.uri,
                actions,
                { compress: 0.7, format: SaveFormat.JPEG }
            );
            setProofImage(manipulatedImage.uri);
        }
    };

    const uploadImage = async (uri: string): Promise<string | null> => {
        try {
            const formData = new FormData();
            const filename = uri.split('/').pop() || 'image.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('image', {
                uri,
                name: filename,
                type,
            } as any);

            const response = await fetch('https://colorme.vn/api/v1/upload-image-public', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Referer': 'https://colorme.vn/',
                },
            });

            const result = await response.json();

            if (result.status && result.link) {
                return result.link;
            }

            console.error('[uploadImage] Upload failed:', result);
            return null;
        } catch (error) {
            console.error('[uploadImage] Error:', error);
            return null;
        }
    };

    const handleSubmitProof = async () => {
        if (!proofImage) {
            Alert.alert(t('checkout.pleaseUploadProof'));
            return;
        }

        setIsUploading(true);

        try {
            const uploadedUrl = await uploadImage(proofImage);

            if (!uploadedUrl) {
                Alert.alert(t('common.error'), 'Không thể tải ảnh lên. Vui lòng thử lại.');
                return;
            }

            setShowProofModal(false);
            // Navigate to success screen
            router.replace({
                pathname: '/order-success',
                params: {
                    orderId,
                    orderNumber,
                    paymentPending: 'true',
                    paymentProofUrl: uploadedUrl
                }
            } as any);
        } catch (error) {
            console.error('Error uploading proof:', error);
            Alert.alert('Error', 'Failed to upload payment proof');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSkipProof = () => {
        setShowProofModal(false);
        router.replace({
            pathname: '/order-success',
            params: {
                orderId,
                orderNumber,
                paymentPending: 'true'
            }
        } as any);
    };

    const handleRemoveImage = () => {
        setProofImage(null);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#FFFFFF" />
                </Pressable>
                <Typography variant="text" size="lg" weight="semiBold" style={styles.headerTitle}>
                    {t('bankTransfer.title')}
                </Typography>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Bank Card Image */}
                {selectedAccount && (
                    <View style={styles.bankCardContainer}>
                        <View style={styles.bankCard}>
                            <LinearGradient
                                colors={['#4A6FA5', '#1E3A5F']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.bankCardGradient}
                            >
                                <View style={styles.bankCardHeader}>
                                    <Typography variant="text" size="sm" style={styles.bankCardLabel}>
                                        CASH CARD
                                    </Typography>
                                    <Typography variant="text" size="sm" style={styles.bankCardLogo}>
                                        {selectedAccount.bank_name}
                                    </Typography>
                                </View>

                                <View style={styles.bankCardBody}>
                                    <Typography variant="text" size="md" style={styles.bankCardNumber}>
                                        {selectedAccount.account_number}
                                    </Typography>
                                </View>

                                <View style={styles.bankCardFooter}>
                                    <View>
                                        <Typography variant="text" size="xs" style={styles.bankCardLabel}>
                                            {t('bankTransfer.accountHolder')}
                                        </Typography>
                                        <Typography variant="text" size="sm" style={styles.bankCardValue}>
                                            {selectedAccount.account_name}
                                        </Typography>
                                    </View>
                                </View>
                            </LinearGradient>
                        </View>

                        <Pressable style={styles.saveImageButton}>
                            <Feather name="download" size={18} color="#3B82F6" />
                            <Typography variant="text" size="sm" style={styles.saveImageText}>
                                {t('bankTransfer.saveImage')}
                            </Typography>
                        </Pressable>
                    </View>
                )}

                {/* Account Details */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <Typography variant="text" size="md" style={styles.detailLabel}>
                            {t('checkout.accountName')}
                        </Typography>
                        <Typography variant="text" size="md" weight="semiBold">
                            {selectedAccount?.account_name || '-'}
                        </Typography>
                    </View>

                    <View style={styles.detailRow}>
                        <Typography variant="text" size="md" style={styles.detailLabel}>
                            {t('bankTransfer.bankName')}
                        </Typography>
                        <Typography variant="text" size="md" weight="semiBold">
                            {selectedAccount?.bank_name || '-'}
                        </Typography>
                    </View>

                    <View style={styles.detailRow}>
                        <Typography variant="text" size="md" style={styles.detailLabel}>
                            {t('checkout.accountNumber')}
                        </Typography>
                        <View style={styles.copyRow}>
                            <Typography variant="text" size="md" weight="semiBold">
                                {selectedAccount?.account_number || '-'}
                            </Typography>
                            <Pressable
                                onPress={() => handleCopy(selectedAccount?.account_number || '', t('checkout.accountNumber'))}
                                hitSlop={8}
                            >
                                <Feather name="copy" size={16} color="#3B82F6" />
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Typography variant="text" size="md" style={styles.detailLabel}>
                            {t('bankTransfer.transferContent')}
                        </Typography>
                        <View style={styles.copyRow}>
                            <Typography variant="text" size="md" weight="semiBold">
                                {transferContent}
                            </Typography>
                            <Pressable
                                onPress={() => handleCopy(transferContent, t('bankTransfer.transferContent'))}
                                hitSlop={8}
                            >
                                <Feather name="copy" size={16} color="#3B82F6" />
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Order Info */}
                <View style={styles.orderCard}>
                    <Typography variant="text" size="md" weight="bold" style={styles.orderTitle}>
                        {t('bankTransfer.orderInfo')}
                    </Typography>

                    <View style={styles.orderRow}>
                        <Typography variant="text" size="md" style={styles.detailLabel}>
                            {t('bankTransfer.orderNumber')}
                        </Typography>
                        <Typography variant="text" size="md" weight="semiBold">
                            {orderNumber}
                        </Typography>
                    </View>

                    <View style={styles.orderRow}>
                        <Typography variant="text" size="md" style={styles.detailLabel}>
                            {t('bankTransfer.amount')}
                        </Typography>
                        <Typography variant="text" size="md" weight="bold" style={styles.amountText}>
                            {formatJpy(totalAmount)}
                        </Typography>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.bottomBar}>
                <Pressable style={styles.confirmButton} onPress={handleConfirmTransfer}>
                    <Typography variant="text" size="md" weight="semiBold" style={styles.confirmButtonText}>
                        {t('bankTransfer.confirmTransfer')}
                    </Typography>
                </Pressable>
            </View>

            {/* Payment Proof Modal */}
            <Modal
                visible={showProofModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowProofModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Typography variant="text" size="lg" weight="bold">
                                {t('bankTransfer.paymentProof')}
                            </Typography>
                            {proofImage && (
                                <Pressable onPress={handleRemoveImage}>
                                    <Typography variant="text" size="sm" style={styles.deleteText}>
                                        {t('common.delete')}
                                    </Typography>
                                </Pressable>
                            )}
                        </View>

                        <View style={styles.proofContainer}>
                            {proofImage ? (
                                <Image
                                    source={{ uri: proofImage }}
                                    style={styles.proofImage}
                                    contentFit="contain"
                                />
                            ) : (
                                <Pressable style={styles.uploadPlaceholder} onPress={pickImage}>
                                    <Feather name="camera" size={48} color={theme.colors.text.tertiary} />
                                    <Typography variant="text" size="sm" style={styles.uploadText}>
                                        {t('bankTransfer.tapToUpload')}
                                    </Typography>
                                </Pressable>
                            )}
                        </View>

                        <Pressable
                            style={[styles.submitButton, !proofImage && styles.submitButtonDisabled]}
                            onPress={handleSubmitProof}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Typography variant="text" size="md" weight="semiBold" style={styles.submitButtonText}>
                                    {t('bankTransfer.submit')}
                                </Typography>
                            )}
                        </Pressable>

                        <Pressable style={styles.skipButton} onPress={handleSkipProof}>
                            <Typography variant="text" size="md" style={styles.skipButtonText}>
                                {t('bankTransfer.notTransferredYet')}
                            </Typography>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#1E3A5F',
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        backButton: {
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
        },
        headerTitle: {
            color: '#FFFFFF',
        },
        content: {
            flex: 1,
            backgroundColor: theme.colors.background.primary,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
        },
        bankCardContainer: {
            alignItems: 'center',
            paddingTop: 24,
            paddingBottom: 16,
        },
        bankCard: {
            width: 320,
            height: 180,
            borderRadius: 16,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
        },
        bankCardGradient: {
            flex: 1,
            padding: 20,
            justifyContent: 'space-between',
        },
        bankCardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        bankCardLabel: {
            color: 'rgba(255,255,255,0.7)',
        },
        bankCardLogo: {
            color: '#FFFFFF',
            fontWeight: '600',
        },
        bankCardBody: {
            marginVertical: 20,
        },
        bankCardNumber: {
            color: '#FFFFFF',
            letterSpacing: 2,
            fontFamily: 'monospace',
        },
        bankCardFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        bankCardValue: {
            color: '#FFFFFF',
            marginTop: 2,
        },
        saveImageButton: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 16,
            gap: 6,
        },
        saveImageText: {
            color: '#3B82F6',
        },
        detailsCard: {
            backgroundColor: '#FFFFFF',
            marginHorizontal: 16,
            borderRadius: 12,
            padding: 16,
            marginTop: 8,
        },
        detailRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
        },
        detailLabel: {
            color: theme.colors.text.tertiary,
        },
        copyRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        orderCard: {
            backgroundColor: '#FFFFFF',
            marginHorizontal: 16,
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
            marginBottom: 24,
        },
        orderTitle: {
            marginBottom: 8,
        },
        orderRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 8,
        },
        amountText: {
            color: theme.colors.text.price,
        },
        bottomBar: {
            padding: 16,
            backgroundColor: theme.colors.background.primary,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
        },
        confirmButton: {
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
        },
        confirmButtonText: {
            color: theme.colors.text.primary,
        },
        // Modal
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        modalContent: {
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: 40,
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
        },
        deleteText: {
            color: '#EF4444',
        },
        proofContainer: {
            height: 200,
            backgroundColor: '#F9FAFB',
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 20,
        },
        proofImage: {
            width: '100%',
            height: '100%',
        },
        uploadPlaceholder: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
        },
        uploadText: {
            color: theme.colors.text.tertiary,
        },
        submitButton: {
            backgroundColor: '#1F2937',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 12,
        },
        submitButtonDisabled: {
            opacity: 0.5,
        },
        submitButtonText: {
            color: '#FFFFFF',
        },
        skipButton: {
            alignItems: 'center',
            paddingVertical: 12,
        },
        skipButtonText: {
            color: theme.colors.text.tertiary,
        },
    });

export default BankTransferConfirmScreen;
