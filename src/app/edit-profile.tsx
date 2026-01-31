import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Alert, Image, ActionSheetIOS, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography, Button } from '@/components';
import { useTheme, useLanguage, useAuth } from '@/contexts';
import { supabase } from '@/services/supabase';

type EditMode = 'view' | 'edit';

interface ProfileField {
  key: string;
  label: string;
  value: string;
  editable?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}

const EditProfileScreen = () => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLanguage();
  const { user, getDisplayName, getEmail, getPhone, getAvatarUrl, logout } = useAuth();
  const styles = createStyles(theme);

  const [mode, setMode] = useState<EditMode>('view');
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    fullName: getDisplayName() || '',
    birthday: user?.user_metadata?.birthday || '',
    gender: user?.user_metadata?.gender || '',
    email: getEmail() || '',
    phone: getPhone() || '',
  });

  const profileFields: ProfileField[] = [
    {
      key: 'fullName',
      label: t('editProfile.fullName'),
      value: formData.fullName,
      editable: true,
    },
    {
      key: 'birthday',
      label: t('editProfile.birthday'),
      value: formData.birthday || '--/--/----',
      editable: true,
    },
    {
      key: 'gender',
      label: t('editProfile.gender'),
      value: formData.gender || '--',
      editable: true,
    },
    {
      key: 'email',
      label: t('editProfile.email'),
      value: formData.email,
      editable: false,
      keyboardType: 'email-address',
    },
    {
      key: 'phone',
      label: t('editProfile.phone'),
      value: formData.phone || '--',
      editable: true,
      keyboardType: 'phone-pad',
    },
  ];

  const handleBack = () => {
    if (mode === 'edit') {
      setMode('view');
    } else {
      router.back();
    }
  };

  const handleEditPress = () => {
    setMode('edit');
  };

  const handleSave = async () => {
    // TODO: Implement save logic with Supabase
    console.log('Saving profile data:', formData);
    setMode('view');
  };

  const handleDeleteAccount = () => {
    Alert.alert(t('editProfile.deleteAccountTitle'), t('editProfile.deleteAccountMessage'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('editProfile.deleteConfirm'),
        style: 'destructive',
        onPress: async () => {
          // TODO: Implement account deletion
          await logout();
          router.replace('/signin');
        },
      },
    ]);
  };

  // Pick image from gallery
  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Thông báo', 'Cần cấp quyền truy cập thư viện ảnh để thay đổi ảnh đại diện');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  // Take photo with camera
  const takePhotoWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Thông báo', 'Cần cấp quyền truy cập camera để chụp ảnh đại diện');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  // Upload avatar to Supabase Storage
  const uploadAvatar = async (imageUri: string) => {
    if (!user) return;

    setIsUploadingAvatar(true);
    try {
      // Create a unique filename
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Fetch the image and convert to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Convert blob to ArrayBuffer for Supabase
      const arrayBuffer = await new Response(blob).arrayBuffer();

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // Update user metadata with new avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) {
        throw updateError;
      }

      // Update local state to show new avatar immediately
      setLocalAvatarUrl(publicUrl);
      Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleChangePhoto = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Hủy', 'Chụp ảnh', 'Chọn từ thư viện'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhotoWithCamera();
          } else if (buttonIndex === 2) {
            pickImageFromGallery();
          }
        }
      );
    } else {
      // Android: Show Alert as ActionSheet
      Alert.alert(
        'Đổi ảnh đại diện',
        'Chọn nguồn ảnh',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Chụp ảnh', onPress: takePhotoWithCamera },
          { text: 'Chọn từ thư viện', onPress: pickImageFromGallery },
        ]
      );
    }
  };

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Use local avatar if available, otherwise fallback to user's avatar (always a string from DiceBear)
  const avatarUrl: string = localAvatarUrl || getAvatarUrl();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Feather name='arrow-left' size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Typography variant='text' size='lg' weight='bold'>
          {t('editProfile.title')}
        </Typography>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Pressable
            style={styles.avatarContainer}
            onPress={handleChangePhoto}
            disabled={isUploadingAvatar}
          >
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            {isUploadingAvatar ? (
              <View style={styles.avatarLoadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : (
              <View style={styles.cameraIcon}>
                <Feather name='camera' size={14} color='#FFFFFF' />
              </View>
            )}
          </Pressable>
          {isUploadingAvatar && (
            <Typography variant='text' size='sm' style={styles.uploadingText}>
              Đang tải ảnh lên...
            </Typography>
          )}
        </View>

        {/* Profile Fields */}
        <View style={styles.fieldsContainer}>
          {profileFields.map((field, index) => (
            <View
              key={field.key}
              style={[styles.fieldRow, index < profileFields.length - 1 && styles.fieldBorder]}
            >
              <Typography variant='text' size='md' style={styles.fieldLabel}>
                {field.label}
              </Typography>
              {mode === 'edit' && field.editable ? (
                <TextInput
                  style={styles.fieldInput}
                  value={formData[field.key as keyof typeof formData]}
                  onChangeText={(value) => updateField(field.key, value)}
                  keyboardType={field.keyboardType || 'default'}
                  placeholder={field.label}
                  placeholderTextColor={theme.colors.text.tertiary}
                />
              ) : (
                <Typography variant='text' size='md' weight='medium' style={styles.fieldValue}>
                  {field.value}
                </Typography>
              )}
            </View>
          ))}
        </View>

        {/* Delete Account Button */}
        <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Typography variant='text' size='md' weight='medium' style={styles.deleteText}>
            {t('editProfile.deleteAccount')}
          </Typography>
        </Pressable>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        {mode === 'view' ? (
          <Button
            colorScheme='gray'
            size='lg'
            variant='solid'
            onPress={handleEditPress}
            style={styles.editButton}
          >
            <View style={styles.buttonContent}>
              <Feather name='edit-2' size={18} color='#FFFFFF' />
              <Typography variant='text' size='md' weight='medium' style={styles.buttonText}>
                {t('editProfile.editInfo')}
              </Typography>
            </View>
          </Button>
        ) : (
          <Button
            colorScheme='brand'
            size='lg'
            variant='solid'
            onPress={handleSave}
            style={styles.editButton}
          >
            {t('editProfile.save')}
          </Button>
        )}
      </View>
    </SafeAreaView>
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
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.tertiary,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    headerRight: {
      width: 40,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100,
    },
    avatarSection: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#4A90D9',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#FFFFFF',
    },
    cameraIcon: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.colors.background.primary,
    },
    avatarLoadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadingText: {
      color: theme.colors.text.secondary,
      marginTop: 8,
    },
    fieldsContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    fieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
    },
    fieldBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.tertiary,
    },
    fieldLabel: {
      color: theme.colors.text.secondary,
      flex: 1,
    },
    fieldValue: {
      color: theme.colors.text.primary,
      textAlign: 'right',
      flex: 2,
    },
    fieldInput: {
      flex: 2,
      textAlign: 'right',
      fontSize: 16,
      color: theme.colors.text.primary,
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 8,
    },
    deleteButton: {
      alignItems: 'center',
      paddingVertical: 24,
      marginTop: 16,
    },
    deleteText: {
      color: '#EF4444',
    },
    bottomContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      paddingBottom: 32,
      backgroundColor: theme.colors.background.primary,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.tertiary,
    },
    editButton: {
      backgroundColor: '#1A1A1A',
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    buttonText: {
      color: '#FFFFFF',
    },
  });

export default EditProfileScreen;
