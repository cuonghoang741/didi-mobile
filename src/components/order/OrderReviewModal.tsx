import { Feather, FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    Pressable,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';

import { useEffect, useRef } from 'react';

import { Typography, Button } from '@/components';
import { useTheme, useLanguage, useAuth } from '@/contexts';
import { submitProductReview } from '@/services/supabase';
import type { OrderItem } from '@/services/supabase/orderService';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/services/imageUpload';

interface OrderReviewModalProps {
    visible: boolean;
    onClose: () => void;
    orderId: string;
    items: OrderItem[];
    onReviewSubmitted?: () => void;
}

interface ItemReview {
    productId: string;
    rating: number;
    comment: string;
    images: string[];
}

const StarRating = ({
    rating,
    onRatingChange,
    size = 28,
}: {
    rating: number;
    onRatingChange: (rating: number) => void;
    size?: number;
}) => {
    const theme = useTheme();
    return (
        <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => onRatingChange(star)} style={styles.starButton}>
                    <FontAwesome
                        name={star <= rating ? 'star' : 'star-o'}
                        size={size}
                        color={star <= rating ? '#FFC107' : theme.colors.border.primary}
                    />
                </Pressable>
            ))}
        </View>
    );
};

const OrderReviewModal: React.FC<OrderReviewModalProps> = ({
    visible,
    onClose,
    orderId,
    items,
    onReviewSubmitted,
}) => {
    const theme = useTheme();
    const { t } = useLanguage();
    const { getUserId } = useAuth();
    const userId = getUserId();

    const [reviews, setReviews] = useState<ItemReview[]>(
        items.map((item) => ({
            productId: item.product_id || '',
            rating: 5,
            comment: '',
            images: [],
        })),
    );
    const [submitting, setSubmitting] = useState(false);
    const [uploadingState, setUploadingState] = useState<{ [key: number]: boolean }>({});
    const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: Dimensions.get('window').height,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: Dimensions.get('window').height,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose();
        });
    };

    const handlePickImage = async (index: number) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('common.error'), t('order.review.permissionRequired'));
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: 5 - (reviews[index].images?.length || 0),
            quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
            setUploadingState((prev) => ({ ...prev, [index]: true }));
            try {
                const newImages: string[] = [];
                let failCount = 0;

                for (const asset of result.assets) {
                    const url = await uploadImage(asset.uri);
                    if (url) {
                        newImages.push(url);
                    } else {
                        failCount++;
                    }
                }

                if (failCount > 0) {
                    console.warn(`[OrderReviewModal] ${failCount} images failed to upload`);
                    if (newImages.length === 0) {
                        Alert.alert(t('common.error'), t('order.review.uploadError') || 'Không thể tải ảnh lên');
                    } else {
                        Alert.alert(t('common.warning'), `${failCount} ảnh tải lên thất bại`);
                    }
                }

                if (newImages.length > 0) {
                    setReviews((prev) => {
                        const updated = [...prev];
                        updated[index] = {
                            ...updated[index],
                            images: [...(updated[index].images || []), ...newImages],
                        };
                        return updated;
                    });
                }
            } catch (e) {
                console.error('[OrderReviewModal] Error picking/uploading images:', e);
                Alert.alert(t('common.error'), t('order.review.uploadError'));
            } finally {
                setUploadingState((prev) => ({ ...prev, [index]: false }));
            }
        }
    };

    const handleRemoveImage = (reviewIndex: number, imageIndex: number) => {
        setReviews((prev) => {
            const updated = [...prev];
            const newImages = [...updated[reviewIndex].images];
            newImages.splice(imageIndex, 1);
            updated[reviewIndex] = { ...updated[reviewIndex], images: newImages };
            return updated;
        });
    };

    const updateReview = (index: number, field: keyof ItemReview, value: any) => {
        setReviews((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleSubmit = async () => {
        if (!userId) {
            Alert.alert(t('common.error'), t('auth.required.title'));
            return;
        }

        // Check if at least one review has a rating
        const hasAnyReview = reviews.some((r) => r.rating > 0);
        if (!hasAnyReview) {
            Alert.alert(t('common.error'), t('order.review.pleaseRate'));
            return;
        }

        setSubmitting(true);

        try {
            // Submit reviews for each product
            const promises = reviews
                .filter((r) => r.rating > 0 && r.productId)
                .map((review) =>
                    submitProductReview({
                        productId: review.productId,
                        userId,
                        orderId,
                        rating: review.rating,
                        comment: review.comment || null,
                        images: review.images,
                    }),
                );

            await Promise.all(promises);

            Alert.alert(t('common.success'), t('order.review.success'), [
                {
                    text: 'OK',
                    onPress: () => {
                        handleClose();
                        onReviewSubmitted?.();
                    },
                },
            ]);
        } catch (error) {
            console.error('Error submitting reviews:', error);
            Alert.alert(t('common.error'), t('order.review.error'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType='none' transparent onRequestClose={handleClose}>
            <View style={styles.overlayWrapper}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                    <Pressable style={styles.backdropPressable} onPress={handleClose} />
                </Animated.View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.keyboardView}
                >
                    <Animated.View
                        style={[
                            styles.modalContainer,
                            {
                                backgroundColor: theme.colors.background.primary,
                                transform: [{ translateY: slideAnim }],
                            },
                        ]}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Typography variant='text' size='lg' weight='bold'>
                                {t('order.review.title')}
                            </Typography>
                            <Pressable onPress={handleClose} style={styles.closeButton}>
                                <Feather name='x' size={24} color={theme.colors.text.primary} />
                            </Pressable>
                        </View>

                        {/* Content */}
                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {items.map((item, index) => (
                                <View
                                    key={item.id}
                                    style={[styles.itemCard, { backgroundColor: theme.colors.background.secondary }]}
                                >
                                    {/* Product Info */}
                                    <View style={styles.productRow}>
                                        <Image
                                            source={{ uri: item.image_url || 'https://via.placeholder.com/60' }}
                                            style={styles.productImage}
                                            contentFit='cover'
                                        />
                                        <View style={styles.productInfo}>
                                            <Typography variant='text' size='md' weight='medium' numberOfLines={2}>
                                                {item.product_name}
                                            </Typography>
                                            {item.variant_name && (
                                                <Typography
                                                    variant='text'
                                                    size='sm'
                                                    style={{ color: theme.colors.text.tertiary }}
                                                >
                                                    {item.variant_name}
                                                </Typography>
                                            )}
                                        </View>
                                    </View>

                                    {/* Rating */}
                                    <View style={styles.ratingSection}>
                                        <Typography
                                            variant='text'
                                            size='sm'
                                            weight='medium'
                                            style={{ marginBottom: 8 }}
                                        >
                                            {t('order.review.rateProduct')}
                                        </Typography>
                                        <StarRating
                                            rating={reviews[index]?.rating || 0}
                                            onRatingChange={(rating) => updateReview(index, 'rating', rating)}
                                        />
                                    </View>

                                    {/* Comment */}
                                    <View style={styles.commentSection}>
                                        <Typography
                                            variant='text'
                                            size='sm'
                                            weight='medium'
                                            style={{ marginBottom: 8 }}
                                        >
                                            {t('order.review.comment')}
                                        </Typography>
                                        <TextInput
                                            style={[
                                                styles.commentInput,
                                                {
                                                    borderColor: theme.colors.border.primary,
                                                    color: theme.colors.text.primary,
                                                },
                                            ]}
                                            placeholder={t('order.review.commentPlaceholder')}
                                            placeholderTextColor={theme.colors.text.tertiary}
                                            multiline
                                            numberOfLines={3}
                                            value={reviews[index]?.comment || ''}
                                            onChangeText={(text) => updateReview(index, 'comment', text)}
                                        />
                                    </View>

                                    {/* Images */}
                                    <View style={styles.imageSection}>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            {reviews[index].images?.map((img, imgIndex) => (
                                                <View key={imgIndex} style={styles.imagePreview}>
                                                    <Image source={{ uri: img }} style={styles.reviewImage} contentFit="cover" />
                                                    <Pressable
                                                        onPress={() => handleRemoveImage(index, imgIndex)}
                                                        style={styles.removeImageButton}
                                                    >
                                                        <Feather name='x' size={12} color='#FFF' />
                                                    </Pressable>
                                                </View>
                                            ))}
                                            {(reviews[index].images?.length || 0) < 5 && (
                                                <Pressable
                                                    style={[styles.addImageButton, { borderColor: theme.colors.border.primary }]}
                                                    onPress={() => handlePickImage(index)}
                                                    disabled={uploadingState[index]}
                                                >
                                                    {uploadingState[index] ? (
                                                        <ActivityIndicator size='small' color={theme.colors.foreground.brand_primary} />
                                                    ) : (
                                                        <Feather name='camera' size={24} color={theme.colors.text.tertiary} />
                                                    )}
                                                </Pressable>
                                            )}
                                        </ScrollView>
                                    </View>
                                </View>
                            ))}

                            <View style={{ height: 20 }} />
                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Button
                                variant='outline'
                                colorScheme='brand'
                                size='lg'
                                onPress={handleClose}
                                style={{ flex: 1, marginRight: 8 }}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                variant='solid'
                                colorScheme='brand'
                                size='lg'
                                onPress={handleSubmit}
                                disabled={submitting}
                                style={{ flex: 1, marginLeft: 8 }}
                            >
                                {submitting ? <ActivityIndicator color='#FFFFFF' /> : t('order.review.submit')}
                            </Button>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlayWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    backdropPressable: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContainer: {
        maxHeight: '90%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 16,
    },
    itemCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    productRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    productInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    ratingSection: {
        marginBottom: 16,
    },
    starContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    starButton: {
        padding: 4,
    },
    commentSection: {},
    commentInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    imageSection: {
        marginTop: 12,
    },
    imagePreview: {
        width: 70,
        height: 70,
        borderRadius: 8,
        marginRight: 8,
        position: 'relative',
    },
    reviewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 10,
        padding: 4,
    },
    addImageButton: {
        width: 70,
        height: 70,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
});

export default OrderReviewModal;
