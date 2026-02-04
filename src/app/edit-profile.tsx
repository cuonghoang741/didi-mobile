import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Alert, Image, ActionSheetIOS, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography, Button } from '@/components';
import { useTheme, useLanguage, useAuth } from '@/contexts';
import { supabase } from '@/services/supabase';

// Gender images
const MaleIcon = require('@/assets/images/male.png');
const FemaleIcon = require('@/assets/images/felmale.png');

const EditProfileScreen = () => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLanguage();
  const { user, getDisplayName, getEmail, getPhone, getAvatarUrl, logout } = useAuth();
  const styles = createStyles(theme);

  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: getDisplayName() || '',
    birthday: user?.user_metadata?.birthday || '',
    gender: user?.user_metadata?.gender || '',
    email: getEmail() || '',
    phone: getPhone() || '',
  });

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          birthday: formData.birthday,
          gender: formData.gender,
          phone: formData.phone,
        },
      });

      if (error) throw error;

      Alert.alert('Thành công', 'Đã cập nhật thông tin');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật thông tin');
    } finally {
      setIsSaving(false);
    }
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
      await uploadAvatar(manipulatedImage.uri);
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
      await uploadAvatar(manipulatedImage.uri);
    }
  };

  // Upload avatar to Supabase Storage
  // Helper function to upload image (same as in other files)
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

  // Upload avatar using ColorMe API
  const uploadAvatar = async (imageUri: string) => {
    if (!user) return;

    setIsUploadingAvatar(true);
    try {
      const publicUrl = await uploadImage(imageUri);

      if (!publicUrl) {
        throw new Error('Upload failed');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) throw updateError;

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
        </View>

        {/* Full Name Field */}
        <View style={styles.fieldSection}>
          <Typography variant='text' size='sm' style={styles.fieldLabel}>
            {t('editProfile.fullName')}
          </Typography>
          <View style={styles.inputContainer}>
            <Feather name='user' size={20} color={theme.colors.text.tertiary} />
            <TextInput
              style={styles.textInput}
              value={formData.fullName}
              onChangeText={(value) => updateField('fullName', value)}
              placeholder={t('editProfile.fullName')}
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>
        </View>

        {/* Birthday Field */}
        <View style={styles.fieldSection}>
          <Typography variant='text' size='sm' style={styles.fieldLabel}>
            {t('editProfile.birthday')}
          </Typography>
          <View style={styles.inputContainer}>
            <Feather name='calendar' size={20} color={theme.colors.text.tertiary} />
            <TextInput
              style={styles.textInput}
              value={formData.birthday}
              onChangeText={(value) => updateField('birthday', value)}
              placeholder='DD/MM/YYYY'
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>
        </View>

        {/* Gender Selection */}
        <View style={styles.fieldSection}>
          <Typography variant='text' size='sm' style={styles.fieldLabel}>
            {t('editProfile.gender')}
          </Typography>
          <View style={styles.genderContainer}>
            <Pressable
              style={[
                styles.genderButton,
                formData.gender === 'male' && styles.genderButtonSelected,
              ]}
              onPress={() => updateField('gender', 'male')}
            >
              <Image source={MaleIcon} style={styles.genderIcon} />
              <Typography
                variant='text'
                size='md'
                weight={formData.gender === 'male' ? 'bold' : 'regular'}
                style={formData.gender === 'male' ? styles.genderTextSelected : styles.genderText}
              >
                Nam
              </Typography>
            </Pressable>

            <Pressable
              style={[
                styles.genderButton,
                formData.gender === 'female' && styles.genderButtonSelected,
              ]}
              onPress={() => updateField('gender', 'female')}
            >
              <Image source={FemaleIcon} style={styles.genderIcon} />
              <Typography
                variant='text'
                size='md'
                weight={formData.gender === 'female' ? 'bold' : 'regular'}
                style={formData.gender === 'female' ? styles.genderTextSelected : styles.genderText}
              >
                Nữ
              </Typography>
            </Pressable>
          </View>
        </View>

        {/* Phone Field */}
        <View style={styles.fieldSection}>
          <Typography variant='text' size='sm' style={styles.fieldLabel}>
            {t('editProfile.phone')}
          </Typography>
          <View style={styles.inputContainer}>
            <Feather name='phone' size={20} color={theme.colors.text.tertiary} />
            <TextInput
              style={styles.textInput}
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              placeholder={t('editProfile.phone')}
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType='phone-pad'
            />
          </View>
        </View>

        {/* Email Field (Read-only) */}
        <View style={styles.fieldSection}>
          <Typography variant='text' size='sm' style={styles.fieldLabel}>
            {t('editProfile.email')}
          </Typography>
          <View style={[styles.inputContainer, styles.inputDisabled]}>
            <Feather name='mail' size={20} color={theme.colors.text.tertiary} />
            <Typography variant='text' size='md' style={styles.emailText}>
              {formData.email}
            </Typography>
          </View>
        </View>

        {/* Delete Account Button */}
        <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Typography variant='text' size='md' weight='medium' style={styles.deleteText}>
            {t('editProfile.deleteAccount')}
          </Typography>
        </Pressable>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomContainer}>
        <Button
          colorScheme='brand'
          size='lg'
          variant='solid'
          onPress={handleSave}
          loading={isSaving}
          fullWidth
        >
          {t('editProfile.save')}
        </Button>
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
      paddingBottom: 120,
    },
    avatarSection: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
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
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fieldSection: {
      marginBottom: 20,
    },
    fieldLabel: {
      color: theme.colors.text.primary,
      marginBottom: 8,
      fontWeight: '500',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    inputDisabled: {
      backgroundColor: '#F9FAFB',
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text.primary,
    },
    emailText: {
      flex: 1,
      color: theme.colors.text.primary,
    },
    genderContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    genderButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.border.secondary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 8,
    },
    genderButtonSelected: {
      borderColor: '#007AFF',
      backgroundColor: '#F0F8FF',
    },
    genderIcon: {
      width: 24,
      height: 24,
    },
    genderText: {
      color: theme.colors.text.secondary,
    },
    genderTextSelected: {
      color: '#007AFF',
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
  });

export default EditProfileScreen;
