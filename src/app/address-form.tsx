import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography, Button, AuthProtect } from '@/components';
import { useTheme, useAuth, useLanguage } from '@/contexts';
import { supabase } from '@/services/supabase';

// Type assertion helper for tables not yet in generated types
const db = supabase as any;

interface AddressFormData {
    nickname: string;
    phone: string;
    last_name: string;
    first_name: string;
    postal_code: string;
    province: string;
    city: string;
    banchi: string;
    building_name: string;
    is_detailed: boolean;
    is_default: boolean;
    image_url: string;
}

const initialFormData: AddressFormData = {
    nickname: '',
    phone: '',
    last_name: '',
    first_name: '',
    postal_code: '',
    province: '',
    city: '',
    banchi: '',
    building_name: '',
    is_detailed: true,
    is_default: false,
    image_url: '',
};

// Upload image to ColorMe API
const uploadImage = async (uri: string): Promise<string | null> => {
    try {
        // Create form data
        const formData = new FormData();

        // Get file info from URI
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
                'Accept': '*/*',
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

const AddressFormScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const theme = useTheme();
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const styles = createStyles(theme);

    const isEditing = !!id;

    const [formData, setFormData] = useState<AddressFormData>(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(isEditing);
    const [isLookingUpAddress, setIsLookingUpAddress] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof AddressFormData, string>>>({});
    const postalCodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isEditing && id) {
            fetchAddress(id);
        }
    }, [id, isEditing]);

    const fetchAddress = async (addressId: string) => {
        try {
            const { data, error } = await db
                .from('customer_addresses')
                .select('*')
                .eq('id', addressId)
                .single();

            if (error) throw error;

            if (data) {
                setFormData({
                    nickname: data.nickname || data.full_name || '',
                    phone: data.phone || '',
                    last_name: data.last_name || '',
                    first_name: data.first_name || '',
                    postal_code: data.postal_code || '',
                    province: data.province || '',
                    city: data.city || '',
                    banchi: data.banchi || data.ward || '',
                    building_name: data.building_name || data.address_line1 || '',
                    is_detailed: true,
                    is_default: data.is_default || false,
                    image_url: data.image_url || '',
                });
            }
        } catch (error) {
            console.error('[AddressFormScreen] Error fetching address:', error);
            Alert.alert(t('common.error'), t('addresses.errors.loadFailed'));
            router.back();
        } finally {
            setIsFetching(false);
        }
    };

    // Lookup address from postal code using zipaddress.net API
    const lookupAddressFromPostalCode = useCallback(async (postalCode: string) => {
        // Clean the postal code (remove dashes and spaces)
        const cleanPostalCode = postalCode.replace(/[-\s]/g, '');

        // Japanese postal codes are 7 digits
        if (cleanPostalCode.length !== 7 || !/^\d+$/.test(cleanPostalCode)) {
            return;
        }

        setIsLookingUpAddress(true);
        try {
            // Use 'ja' for Japanese, 'rome' for English/Vietnamese
            const lang = language === 'jp' ? 'ja' : 'rome';
            const response = await fetch(
                `https://api.zipaddress.net/?zipcode=${cleanPostalCode}&lang=${lang}`
            );
            const result = await response.json();

            if (result.code === 200 && result.data) {
                setFormData(prev => ({
                    ...prev,
                    province: result.data.pref || '',
                    city: result.data.city || result.data.address || '',
                }));
            }
        } catch (error) {
            console.error('[AddressFormScreen] Error looking up postal code:', error);
        } finally {
            setIsLookingUpAddress(false);
        }
    }, [language]);

    const updateField = (field: keyof AddressFormData, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }

        // Auto-lookup address when postal code changes
        if (field === 'postal_code' && typeof value === 'string') {
            // Clear any existing timeout
            if (postalCodeTimeoutRef.current) {
                clearTimeout(postalCodeTimeoutRef.current);
            }
            // Debounce the API call
            postalCodeTimeoutRef.current = setTimeout(() => {
                lookupAddressFromPostalCode(value);
            }, 500);
        }
    };

    const handlePickImage = async () => {
        try {
            // Request permission
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert(
                    t('common.error'),
                    t('addresses.errors.permissionDenied')
                );
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setIsUploadingImage(true);
                const uploadedUrl = await uploadImage(result.assets[0].uri);

                if (uploadedUrl) {
                    setFormData(prev => ({ ...prev, image_url: uploadedUrl }));
                } else {
                    Alert.alert(t('common.error'), t('addresses.errors.uploadFailed'));
                }
                setIsUploadingImage(false);
            }
        } catch (error) {
            console.error('[AddressFormScreen] Error picking image:', error);
            setIsUploadingImage(false);
            Alert.alert(t('common.error'), t('addresses.errors.uploadFailed'));
        }
    };

    const handleTakePhoto = async () => {
        try {
            // Request camera permission
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert(
                    t('common.error'),
                    t('addresses.errors.cameraPermissionDenied')
                );
                return;
            }

            // Launch camera
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setIsUploadingImage(true);
                const uploadedUrl = await uploadImage(result.assets[0].uri);

                if (uploadedUrl) {
                    setFormData(prev => ({ ...prev, image_url: uploadedUrl }));
                } else {
                    Alert.alert(t('common.error'), t('addresses.errors.uploadFailed'));
                }
                setIsUploadingImage(false);
            }
        } catch (error) {
            console.error('[AddressFormScreen] Error taking photo:', error);
            setIsUploadingImage(false);
            Alert.alert(t('common.error'), t('addresses.errors.uploadFailed'));
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, image_url: '' }));
    };

    const showImageOptions = () => {
        Alert.alert(
            t('addresses.form.addPhoto'),
            t('addresses.form.selectPhotoSource'),
            [
                {
                    text: t('addresses.form.takePhoto'),
                    onPress: handleTakePhoto,
                },
                {
                    text: t('addresses.form.chooseFromLibrary'),
                    onPress: handlePickImage,
                },
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
            ]
        );
    };

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof AddressFormData, string>> = {};

        if (!formData.nickname.trim()) {
            newErrors.nickname = t('addresses.errors.nicknameRequired');
        }

        if (!formData.phone.trim()) {
            newErrors.phone = t('addresses.errors.phoneRequired');
        }

        if (formData.is_detailed) {
            if (!formData.last_name.trim()) {
                newErrors.last_name = t('addresses.errors.lastNameRequired');
            }

            if (!formData.first_name.trim()) {
                newErrors.first_name = t('addresses.errors.firstNameRequired');
            }

            if (!formData.postal_code.trim()) {
                newErrors.postal_code = t('addresses.errors.postalCodeRequired');
            }

            if (!formData.province.trim()) {
                newErrors.province = t('addresses.errors.provinceRequired');
            }

            if (!formData.city.trim()) {
                newErrors.city = t('addresses.errors.cityRequired');
            }

            if (!formData.banchi.trim()) {
                newErrors.banchi = t('addresses.errors.banchiRequired');
            }

            if (!formData.building_name.trim()) {
                newErrors.building_name = t('addresses.errors.buildingNameRequired');
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        if (!user?.id) {
            Alert.alert(t('common.error'), t('auth.required.subtitle'));
            return;
        }

        setIsLoading(true);

        try {
            // If setting as default, unset all other defaults first
            if (formData.is_default) {
                await db
                    .from('customer_addresses')
                    .update({ is_default: false })
                    .eq('customer_id', user.id);
            }

            // Build full address from components
            const fullAddress = [
                formData.building_name,
                formData.banchi,
                formData.city,
                formData.province,
            ].filter(Boolean).join(', ');

            const addressData = {
                customer_id: user.id,
                full_name: `${formData.last_name} ${formData.first_name}`.trim() || formData.nickname,
                nickname: formData.nickname.trim(),
                phone: formData.phone.trim(),
                last_name: formData.last_name.trim() || null,
                first_name: formData.first_name.trim() || null,
                postal_code: formData.postal_code.trim() || null,
                province: formData.province.trim() || null,
                city: formData.city.trim() || null,
                district: formData.city.trim() || null, // For backward compatibility
                ward: formData.banchi.trim() || null, // For backward compatibility
                banchi: formData.banchi.trim() || null,
                building_name: formData.building_name.trim() || null,
                address_line1: fullAddress || null, // For backward compatibility
                is_default: formData.is_default,
                image_url: formData.image_url || null,
                type: 'shipping',
                updated_at: new Date().toISOString(),
            };

            if (isEditing && id) {
                const { error } = await db
                    .from('customer_addresses')
                    .update(addressData)
                    .eq('id', id);

                if (error) throw error;
            } else {
                const { error } = await db
                    .from('customer_addresses')
                    .insert(addressData);

                if (error) throw error;
            }

            router.back();
        } catch (error) {
            console.error('[AddressFormScreen] Error saving address:', error);
            Alert.alert(t('common.error'), t('addresses.errors.saveFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size='large' color={theme.colors.foreground.brand_primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <AuthProtect>
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Feather name='arrow-left' size={24} color={theme.colors.text.primary} />
                    </Pressable>
                    <Typography variant='text' size='lg' weight='bold'>
                        {isEditing ? t('addresses.form.editTitle') : t('addresses.form.title')}
                    </Typography>
                    <View style={{ width: 32 }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps='handled'
                    >
                        {/* Nickname Field */}
                        <View style={styles.inputGroup}>
                            <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                                {t('addresses.form.nickname')}<Typography style={styles.required}> *</Typography>
                            </Typography>
                            <TextInput
                                style={[styles.input, errors.nickname && styles.inputError]}
                                value={formData.nickname}
                                onChangeText={(text) => updateField('nickname', text)}
                                placeholder={t('addresses.form.nicknamePlaceholder')}
                                placeholderTextColor={theme.colors.text.tertiary}
                                editable={!isLoading}
                            />
                            {errors.nickname && (
                                <Typography variant='text' size='xs' style={styles.errorText}>
                                    {errors.nickname}
                                </Typography>
                            )}
                        </View>

                        {/* Phone Field */}
                        <View style={styles.inputGroup}>
                            <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                                {t('addresses.form.phone')}<Typography style={styles.required}> *</Typography>
                            </Typography>
                            <TextInput
                                style={[styles.input, errors.phone && styles.inputError]}
                                value={formData.phone}
                                onChangeText={(text) => updateField('phone', text)}
                                placeholder={t('addresses.form.phonePlaceholder')}
                                placeholderTextColor={theme.colors.text.tertiary}
                                keyboardType='phone-pad'
                                editable={!isLoading}
                            />
                            {errors.phone && (
                                <Typography variant='text' size='xs' style={styles.errorText}>
                                    {errors.phone}
                                </Typography>
                            )}
                        </View>

                        {/* Detailed Address Toggle */}
                        <View style={styles.toggleRow}>
                            <Typography variant='text' size='sm' weight='medium'>
                                {t('addresses.form.detailedAddress')}
                            </Typography>
                            <Switch
                                value={formData.is_detailed}
                                onValueChange={(value) => updateField('is_detailed', value)}
                                trackColor={{ false: '#E5E7EB', true: theme.colors.foreground.brand_primary }}
                                thumbColor='#FFFFFF'
                            />
                        </View>

                        {/* Detailed Address Fields */}
                        {formData.is_detailed && (
                            <>
                                {/* Name Row (2 columns) */}
                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, styles.halfWidth]}>
                                        <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                                            {t('addresses.form.lastName')}<Typography style={styles.required}> *</Typography>
                                        </Typography>
                                        <TextInput
                                            style={[styles.input, errors.last_name && styles.inputError]}
                                            value={formData.last_name}
                                            onChangeText={(text) => updateField('last_name', text)}
                                            placeholder={t('addresses.form.lastNamePlaceholder')}
                                            placeholderTextColor={theme.colors.text.tertiary}
                                            editable={!isLoading}
                                        />
                                        {errors.last_name && (
                                            <Typography variant='text' size='xs' style={styles.errorText}>
                                                {errors.last_name}
                                            </Typography>
                                        )}
                                    </View>
                                    <View style={[styles.inputGroup, styles.halfWidth]}>
                                        <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                                            {t('addresses.form.firstName')}<Typography style={styles.required}> *</Typography>
                                        </Typography>
                                        <TextInput
                                            style={[styles.input, errors.first_name && styles.inputError]}
                                            value={formData.first_name}
                                            onChangeText={(text) => updateField('first_name', text)}
                                            placeholder={t('addresses.form.firstNamePlaceholder')}
                                            placeholderTextColor={theme.colors.text.tertiary}
                                            editable={!isLoading}
                                        />
                                        {errors.first_name && (
                                            <Typography variant='text' size='xs' style={styles.errorText}>
                                                {errors.first_name}
                                            </Typography>
                                        )}
                                    </View>
                                </View>

                                {/* Postal Code & Province Row (2 columns) */}
                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, styles.halfWidth]}>
                                        <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                                            {t('addresses.form.postalCode')}<Typography style={styles.required}> *</Typography>
                                        </Typography>
                                        <View style={styles.postalCodeContainer}>
                                            <TextInput
                                                style={[styles.input, errors.postal_code && styles.inputError]}
                                                value={formData.postal_code}
                                                onChangeText={(text) => updateField('postal_code', text)}
                                                placeholder={t('addresses.form.postalCodePlaceholder')}
                                                placeholderTextColor={theme.colors.text.tertiary}
                                                keyboardType='number-pad'
                                                editable={!isLoading}
                                            />
                                            {isLookingUpAddress && (
                                                <View style={styles.lookupIndicator}>
                                                    <ActivityIndicator size='small' color={theme.colors.foreground.brand_primary} />
                                                </View>
                                            )}
                                        </View>
                                        {errors.postal_code && (
                                            <Typography variant='text' size='xs' style={styles.errorText}>
                                                {errors.postal_code}
                                            </Typography>
                                        )}
                                    </View>
                                    <View style={[styles.inputGroup, styles.halfWidth]}>
                                        <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                                            {t('addresses.form.province')}<Typography style={styles.required}> *</Typography>
                                        </Typography>
                                        <TextInput
                                            style={[styles.input, errors.province && styles.inputError]}
                                            value={formData.province}
                                            onChangeText={(text) => updateField('province', text)}
                                            placeholder={t('addresses.form.provincePlaceholder')}
                                            placeholderTextColor={theme.colors.text.tertiary}
                                            editable={!isLoading}
                                        />
                                        {errors.province && (
                                            <Typography variant='text' size='xs' style={styles.errorText}>
                                                {errors.province}
                                            </Typography>
                                        )}
                                    </View>
                                </View>

                                {/* City Field */}
                                <View style={styles.inputGroup}>
                                    <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                                        {t('addresses.form.city')}<Typography style={styles.required}> *</Typography>
                                    </Typography>
                                    <TextInput
                                        style={[styles.input, errors.city && styles.inputError]}
                                        value={formData.city}
                                        onChangeText={(text) => updateField('city', text)}
                                        placeholder={t('addresses.form.cityPlaceholder')}
                                        placeholderTextColor={theme.colors.text.tertiary}
                                        editable={!isLoading}
                                    />
                                    {errors.city && (
                                        <Typography variant='text' size='xs' style={styles.errorText}>
                                            {errors.city}
                                        </Typography>
                                    )}
                                </View>

                                {/* Banchi Field */}
                                <View style={styles.inputGroup}>
                                    <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                                        {t('addresses.form.banchi')}<Typography style={styles.required}> *</Typography>
                                    </Typography>
                                    <TextInput
                                        style={[styles.input, errors.banchi && styles.inputError]}
                                        value={formData.banchi}
                                        onChangeText={(text) => updateField('banchi', text)}
                                        placeholder={t('addresses.form.banchiPlaceholder')}
                                        placeholderTextColor={theme.colors.text.tertiary}
                                        editable={!isLoading}
                                    />
                                    {errors.banchi && (
                                        <Typography variant='text' size='xs' style={styles.errorText}>
                                            {errors.banchi}
                                        </Typography>
                                    )}
                                </View>

                                {/* Building Name Field */}
                                <View style={styles.inputGroup}>
                                    <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                                        {t('addresses.form.buildingName')}<Typography style={styles.required}> *</Typography>
                                    </Typography>
                                    <TextInput
                                        style={[styles.input, errors.building_name && styles.inputError]}
                                        value={formData.building_name}
                                        onChangeText={(text) => updateField('building_name', text)}
                                        placeholder={t('addresses.form.buildingNamePlaceholder')}
                                        placeholderTextColor={theme.colors.text.tertiary}
                                        editable={!isLoading}
                                    />
                                    {errors.building_name && (
                                        <Typography variant='text' size='xs' style={styles.errorText}>
                                            {errors.building_name}
                                        </Typography>
                                    )}
                                </View>
                            </>
                        )}

                        {/* Address Image Section */}
                        <View style={styles.imageSection}>
                            <Typography variant='text' size='sm' weight='bold' style={styles.imageSectionTitle}>
                                {t('addresses.form.addressPhotoKanji')}<Typography style={styles.required}> *</Typography>
                            </Typography>
                            <Typography variant='text' size='xs' style={styles.imageSectionDesc}>
                                {t('addresses.form.addressPhotoDesc')}
                            </Typography>

                            {formData.image_url ? (
                                <View style={styles.imageContainer}>
                                    <Image
                                        source={{ uri: formData.image_url }}
                                        style={styles.addressImage}
                                        contentFit='cover'
                                    />
                                    <Pressable
                                        style={styles.removeImageButton}
                                        onPress={handleRemoveImage}
                                    >
                                        <Feather name='x' size={16} color='#FFFFFF' />
                                    </Pressable>
                                    <Button
                                        variant='solid'
                                        colorScheme='brand'
                                        size='md'
                                        onPress={showImageOptions}
                                        style={styles.changeImageButton}
                                    >
                                        {t('addresses.form.changePhoto')}
                                    </Button>
                                </View>
                            ) : (
                                <Pressable
                                    style={styles.addImageButton}
                                    onPress={showImageOptions}
                                    disabled={isUploadingImage}
                                >
                                    {isUploadingImage ? (
                                        <ActivityIndicator size='small' color={theme.colors.foreground.brand_primary} />
                                    ) : (
                                        <>
                                            <Feather name='camera' size={32} color={theme.colors.text.tertiary} />
                                            <Typography variant='text' size='sm' style={styles.addImageText}>
                                                {t('addresses.form.addPhoto')}
                                            </Typography>
                                        </>
                                    )}
                                </Pressable>
                            )}
                        </View>

                        {/* Default Address Toggle */}
                        <Pressable
                            style={styles.defaultToggle}
                            onPress={() => updateField('is_default', !formData.is_default)}
                        >
                            <View
                                style={[
                                    styles.checkbox,
                                    formData.is_default && styles.checkboxChecked,
                                ]}
                            >
                                {formData.is_default && (
                                    <Feather name='check' size={14} color='#FFFFFF' />
                                )}
                            </View>
                            <Typography variant='text' size='md'>
                                {t('addresses.form.setAsDefault')}
                            </Typography>
                        </Pressable>
                    </ScrollView>
                </KeyboardAvoidingView>

                <View style={styles.footer}>
                    <Button
                        colorScheme='brand'
                        size='lg'
                        variant='solid'
                        onPress={handleSave}
                        loading={isLoading}
                        disabled={isLoading || isUploadingImage}
                        style={styles.saveButton}
                    >
                        {isEditing ? t('addresses.form.save') : t('addresses.form.add')}
                    </Button>
                </View>
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
        keyboardView: {
            flex: 1,
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
        inputGroup: {
            marginBottom: 16,
        },
        row: {
            flexDirection: 'row',
            gap: 12,
        },
        halfWidth: {
            flex: 1,
        },
        label: {
            color: theme.colors.text.primary,
            marginBottom: 8,
        },
        required: {
            color: '#EF4444',
        },
        input: {
            backgroundColor: theme.colors.background.primary,
            borderWidth: 1,
            borderColor: theme.colors.border.secondary,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 12,
            fontSize: 16,
            color: theme.colors.text.primary,
            letterSpacing: 0,
        },
        inputError: {
            borderColor: '#EF4444',
        },
        errorText: {
            color: '#EF4444',
            marginTop: 4,
        },
        toggleRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: theme.colors.background.primary,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            marginBottom: 16,
        },
        postalCodeContainer: {
            position: 'relative',
        },
        lookupIndicator: {
            position: 'absolute',
            right: 12,
            top: 12,
        },
        defaultToggle: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: theme.colors.background.primary,
            padding: 16,
            borderRadius: 12,
            marginTop: 8,
        },
        checkbox: {
            width: 22,
            height: 22,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: theme.colors.border.secondary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        checkboxChecked: {
            backgroundColor: theme.colors.foreground.brand_primary,
            borderColor: theme.colors.foreground.brand_primary,
        },
        footer: {
            paddingVertical: 16,
            paddingHorizontal: 32,
            backgroundColor: theme.colors.background.primary,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border.tertiary,
        },
        saveButton: {
            borderRadius: 24,
        },
        // Image section styles
        imageSection: {
            backgroundColor: theme.colors.background.primary,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
        },
        imageSectionTitle: {
            color: theme.colors.text.primary,
            marginBottom: 4,
        },
        imageSectionDesc: {
            color: theme.colors.text.tertiary,
            marginBottom: 16,
            lineHeight: 18,
        },
        imageContainer: {
            position: 'relative',
            borderRadius: 12,
            overflow: 'hidden',
        },
        addressImage: {
            width: '100%',
            height: 160,
            borderRadius: 12,
        },
        removeImageButton: {
            position: 'absolute',
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        changeImageButton: {
            marginTop: 12,
            borderRadius: 20,
        },
        addImageButton: {
            height: 120,
            borderRadius: 12,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: theme.colors.border.secondary,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background.secondary,
        },
        addImageText: {
            color: theme.colors.text.tertiary,
            marginTop: 8,
        },
    });

export default AddressFormScreen;
