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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography, Button, AuthProtect } from '@/components';
import { useTheme, useAuth, useLanguage } from '@/contexts';
import { supabase } from '@/services/supabase';

// Type assertion helper for tables not yet in generated types
const db = supabase as any;

interface AddressFormData {
    full_name: string;
    phone: string;
    postal_code: string;
    address_line1: string;
    ward: string;
    district: string;
    city: string;
    province: string;
    is_default: boolean;
    image_url: string;
}

const initialFormData: AddressFormData = {
    full_name: '',
    phone: '',
    postal_code: '',
    address_line1: '',
    ward: '',
    district: '',
    city: '',
    province: '',
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
                    full_name: data.full_name || '',
                    phone: data.phone || '',
                    postal_code: data.postal_code || '',
                    address_line1: data.address_line1 || '',
                    ward: data.ward || '',
                    district: data.district || '',
                    city: data.city || '',
                    province: data.province || '',
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
                    city: result.data.pref || '',
                    district: result.data.address || '',
                    province: result.data.pref || '',
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

        if (!formData.full_name.trim()) {
            newErrors.full_name = t('addresses.errors.fullNameRequired');
        }

        if (!formData.phone.trim()) {
            newErrors.phone = t('addresses.errors.phoneRequired');
        } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = t('addresses.errors.phoneInvalid');
        }

        if (!formData.address_line1.trim()) {
            newErrors.address_line1 = t('addresses.errors.addressRequired');
        }

        if (!formData.city.trim()) {
            newErrors.city = t('addresses.errors.cityRequired');
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

            const addressData = {
                customer_id: user.id,
                full_name: formData.full_name.trim(),
                phone: formData.phone.trim(),
                address_line1: formData.address_line1.trim(),
                ward: formData.ward.trim() || null,
                district: formData.district.trim() || null,
                city: formData.city.trim(),
                province: formData.province.trim() || null,
                postal_code: formData.postal_code.trim() || null,
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

    const renderInput = (
        label: string,
        field: keyof AddressFormData,
        placeholder: string,
        options?: {
            multiline?: boolean;
            keyboardType?: 'default' | 'phone-pad' | 'number-pad';
            required?: boolean;
        },
    ) => (
        <View style={styles.inputGroup}>
            <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                {label}
                {options?.required && <Typography style={styles.required}> *</Typography>}
            </Typography>
            <TextInput
                style={[
                    styles.input,
                    options?.multiline && styles.inputMultiline,
                    errors[field] && styles.inputError,
                ]}
                value={formData[field] as string}
                onChangeText={(text) => updateField(field, text)}
                placeholder={placeholder}
                placeholderTextColor={theme.colors.text.tertiary}
                keyboardType={options?.keyboardType || 'default'}
                multiline={options?.multiline}
                numberOfLines={options?.multiline ? 3 : 1}
                editable={!isLoading}
            />
            {errors[field] && (
                <Typography variant='text' size='xs' style={styles.errorText}>
                    {errors[field]}
                </Typography>
            )}
        </View>
    );

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
                        {/* Address Image Section */}
                        <View style={styles.section}>
                            <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
                                {t('addresses.form.addressPhoto')}
                            </Typography>

                            {formData.image_url ? (
                                <View style={styles.imageContainer}>
                                    <Image
                                        source={{ uri: formData.image_url }}
                                        style={styles.addressImage}
                                        contentFit='cover'
                                    />
                                    <View style={styles.imageActions}>
                                        <Pressable
                                            style={styles.imageActionButton}
                                            onPress={showImageOptions}
                                        >
                                            <Feather name='edit-2' size={16} color='#FFFFFF' />
                                        </Pressable>
                                        <Pressable
                                            style={[styles.imageActionButton, styles.deleteImageButton]}
                                            onPress={handleRemoveImage}
                                        >
                                            <Feather name='trash-2' size={16} color='#FFFFFF' />
                                        </Pressable>
                                    </View>
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

                        {/* Contact Info Section */}
                        <View style={styles.section}>
                            <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
                                {t('addresses.form.contactInfo')}
                            </Typography>
                            {renderInput(t('addresses.form.fullName'), 'full_name', t('addresses.form.fullNamePlaceholder'), { required: true })}
                            {renderInput(t('addresses.form.phone'), 'phone', t('addresses.form.phonePlaceholder'), {
                                keyboardType: 'phone-pad',
                                required: true,
                            })}
                        </View>

                        {/* Address Section */}
                        <View style={styles.section}>
                            <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
                                {t('addresses.form.addressInfo')}
                            </Typography>
                            {/* Postal code first for auto-fill */}
                            <View style={styles.postalCodeRow}>
                                {renderInput(t('addresses.form.postalCode'), 'postal_code', t('addresses.form.postalCodePlaceholder'), {
                                    keyboardType: 'number-pad',
                                })}
                                {isLookingUpAddress && (
                                    <View style={styles.lookupIndicator}>
                                        <ActivityIndicator size='small' color={theme.colors.foreground.brand_primary} />
                                    </View>
                                )}
                            </View>
                            {renderInput(t('addresses.form.city'), 'city', t('addresses.form.cityPlaceholder'), { required: true })}
                            {renderInput(t('addresses.form.district'), 'district', t('addresses.form.districtPlaceholder'))}
                            {renderInput(t('addresses.form.ward'), 'ward', t('addresses.form.wardPlaceholder'))}
                            {renderInput(t('addresses.form.addressLine1'), 'address_line1', t('addresses.form.addressLine1Placeholder'), {
                                required: true,
                            })}
                        </View>

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
        section: {
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
        },
        sectionTitle: {
            marginBottom: 16,
            color: theme.colors.text.primary,
        },
        inputGroup: {
            marginBottom: 16,
        },
        postalCodeRow: {
            position: 'relative',
        },
        lookupIndicator: {
            position: 'absolute',
            right: 12,
            top: 38,
        },
        label: {
            color: theme.colors.text.secondary,
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
        inputMultiline: {
            minHeight: 80,
            textAlignVertical: 'top',
        },
        inputError: {
            borderColor: '#EF4444',
        },
        errorText: {
            color: '#EF4444',
            marginTop: 4,
        },
        defaultToggle: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: '#FFFFFF',
            padding: 16,
            borderRadius: 12,
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
        // Image upload styles
        imageContainer: {
            position: 'relative',
            borderRadius: 12,
            overflow: 'hidden',
        },
        addressImage: {
            width: '100%',
            height: 200,
            borderRadius: 12,
        },
        imageActions: {
            position: 'absolute',
            top: 8,
            right: 8,
            flexDirection: 'row',
            gap: 8,
        },
        imageActionButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        deleteImageButton: {
            backgroundColor: '#EF4444',
        },
        addImageButton: {
            height: 150,
            borderRadius: 12,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: theme.colors.border.secondary,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background.primary,
        },
        addImageText: {
            color: theme.colors.text.tertiary,
            marginTop: 8,
        },
    });

export default AddressFormScreen;
