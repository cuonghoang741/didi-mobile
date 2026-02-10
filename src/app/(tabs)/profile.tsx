import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Switch, Linking, Alert, Modal, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography, Button } from '@/components';
import { useTheme, useLanguage, useAuth } from '@/contexts';
import { useSettings } from '@/hooks';
import { Language, LANGUAGE } from '@/constants';
import { oneSignalService } from '@/services/onesignal/OneSignalService';

// Social Logos - import as components with react-native-svg-transformer
import LineLogo from '@/assets/logos/line.svg';
import FacebookLogo from '@/assets/logos/facebook.svg';
import MessengerLogo from '@/assets/logos/messenger.svg';
import VoucherIcon from '@/assets/icons/voucher.svg';
import LanguageIcon from '@/assets/icons/language.svg';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  rightText?: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
  requiresAuth?: boolean;
}

const Profile = () => {
  const router = useRouter();
  const theme = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { user, profile, refreshProfile, logout, isLoggedIn, getDisplayName, getEmail, getAvatarUrl } = useAuth();
  const { branches, fanpageUrls, contactPhone, isLoading: isLoadingSettings } = useSettings();
  const styles = createStyles(theme);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // Get initial notification subscription status
  useEffect(() => {
    const checkNotificationStatus = async () => {
      try {
        const status = await oneSignalService.getSubscriptionStatus();
        setNotificationsEnabled(status.isSubscribed);
      } catch (error) {
        console.error('Error checking notification status:', error);
      }
    };
    checkNotificationStatus();
  }, []);

  // Handle notification toggle
  const handleNotificationToggle = useCallback(async (value: boolean) => {
    setIsTogglingNotifications(true);
    try {
      const success = await oneSignalService.toggleSubscription(value);
      if (success) {
        setNotificationsEnabled(value);
      } else {
        // If toggle failed, show alert
        Alert.alert(
          t('common.error'),
          value
            ? t('profile.notificationEnableFailed') || 'Không thể bật thông báo. Vui lòng kiểm tra quyền thông báo trong cài đặt.'
            : t('profile.notificationDisableFailed') || 'Không thể tắt thông báo.'
        );
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert(t('common.error'), t('common.somethingWentWrong') || 'Đã xảy ra lỗi');
    } finally {
      setIsTogglingNotifications(false);
    }
  }, [t]);

  // Language options
  const languageOptions = [
    { code: LANGUAGE.VI as Language, label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: LANGUAGE.EN as Language, label: 'English', flag: '🇬🇧' },
    { code: LANGUAGE.JP as Language, label: '日本語', flag: '🇯🇵' },
  ];

  // Get current language label
  const getCurrentLanguageLabel = () => {
    const option = languageOptions.find(opt => opt.code === language);
    return option ? `${option.flag} ${option.label}` : language;
  };

  // Handle language change
  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setLanguageModalVisible(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      // Also refresh settings if needed
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile]);

  // Get user initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutTitle') || 'Đăng xuất',
      t('profile.logoutMessage') || 'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: t('common.cancel') || 'Hủy', style: 'cancel' },
        {
          text: t('profile.logout') || 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/signin');
          },
        },
      ]
    );
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  // Get branch address for display
  const getBranchAddress = () => {
    if (branches.length === 0) return t('profile.noBranch');
    return branches[0].name;
  };

  // Handle branch press
  const handleBranchPress = () => {
    if (branches.length === 0) return;
    const branch = branches[0];
    // Open Google Maps with the address
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`;
    Linking.openURL(mapUrl);
  };

  // Get Facebook fanpage URL
  const getFacebookUrl = () => {
    const facebookPage = fanpageUrls.find(f => f.platform === 'facebook');
    return facebookPage?.url || 'https://facebook.com';
  };

  // Get Messenger URL from Facebook URL
  const getMessengerUrl = () => {
    // First check if there's a direct messenger URL in settings
    const messengerPage = fanpageUrls.find(f => f.platform === 'messenger');
    if (messengerPage?.url) {
      return messengerPage.url;
    }

    // Otherwise, derive from Facebook URL
    const facebookUrl = getFacebookUrl();

    try {
      // Handle profile.php?id=xxx format
      if (facebookUrl.includes('profile.php')) {
        const urlObj = new URL(facebookUrl);
        const id = urlObj.searchParams.get('id');
        if (id) {
          return `https://m.me/${id}`;
        }
      }

      // Handle facebook.com/xxx or facebook.com/pagename format
      const urlObj = new URL(facebookUrl);
      const pathname = urlObj.pathname;
      // Remove leading slash and get the page id/name
      const pageId = pathname.replace(/^\//, '').split('/')[0];
      if (pageId) {
        return `https://m.me/${pageId}`;
      }
    } catch (error) {
      console.warn('Error parsing Facebook URL:', error);
    }

    return 'https://m.me/';
  };

  // Get social platform menu items dynamically
  const getSocialMenuItems = (): MenuItem[] => {
    const items: MenuItem[] = [];

    // Check each platform and add if URL exists
    fanpageUrls.forEach(({ platform, url }) => {
      if (!url) return;

      switch (platform) {
        case 'facebook':
          items.push({
            icon: <FacebookLogo width={20} height={20} />,
            label: t('profile.visitFacebook'),
            onPress: () => handleOpenLink(url),
          });
          // Also add Messenger if Facebook exists
          items.push({
            icon: <MessengerLogo width={20} height={20} />,
            label: t('profile.chatMessenger'),
            onPress: () => handleOpenLink(getMessengerUrl()),
          });
          break;
        case 'messenger':
          // Already added via Facebook, skip if separate
          break;
        case 'line':
          items.push({
            icon: <LineLogo width={20} height={20} />,
            label: t('profile.chatLine'),
            onPress: () => handleOpenLink(url),
          });
          break;
        case 'tiktok':
          items.push({
            icon: <Feather name='video' size={20} color={theme.colors.text.secondary} />,
            label: 'TikTok',
            onPress: () => handleOpenLink(url),
          });
          break;
        case 'instagram':
          items.push({
            icon: <Feather name='instagram' size={20} color={theme.colors.text.secondary} />,
            label: 'Instagram',
            onPress: () => handleOpenLink(url),
          });
          break;
        case 'zalo':
          items.push({
            icon: <Feather name='message-circle' size={20} color={theme.colors.text.secondary} />,
            label: 'Zalo OA',
            onPress: () => handleOpenLink(url),
          });
          break;
        case 'youtube':
          items.push({
            icon: <Feather name='youtube' size={20} color={theme.colors.text.secondary} />,
            label: 'YouTube',
            onPress: () => handleOpenLink(url),
          });
          break;
        default:
          // For other platforms
          items.push({
            icon: <Feather name='link' size={20} color={theme.colors.text.secondary} />,
            label: platform.charAt(0).toUpperCase() + platform.slice(1),
            onPress: () => handleOpenLink(url),
          });
          break;
      }
    });

    return items;
  };

  // Menu sections configuration
  const menuSections: MenuSection[] = [
    {
      title: t('profile.account'),
      requiresAuth: true,
      items: [
        {
          icon: <Feather name='map-pin' size={20} color={theme.colors.text.secondary} />,
          label: t('addresses.title'),
          onPress: () => router.push('/addresses' as any),
        },
        {
          icon: <VoucherIcon width={20} height={20} color={theme.colors.text.secondary} />,
          label: t('profile.voucherWallet'),
          onPress: () => router.push('/vouchers' as any),
        },
        {
          icon: <Feather name='file-text' size={20} color={theme.colors.text.secondary} />,
          label: t('profile.orderHistory'),
          onPress: () => router.push('/orders' as any),
        },
      ],
    },
    {
      title: t('profile.settingsSection'),
      items: [
        {
          icon: <Feather name='bell' size={20} color={theme.colors.text.secondary} />,
          label: t('profile.notificationSettings'),
          hasSwitch: true,
          switchValue: notificationsEnabled,
          onSwitchChange: handleNotificationToggle,
        },
        {
          icon: <LanguageIcon width={20} height={20} color={theme.colors.text.secondary} />,
          label: t('profile.language'),
          rightText: getCurrentLanguageLabel(),
          onPress: () => setLanguageModalVisible(true),
        },
      ],
    },
    {
      title: t('profile.aboutApp'),
      items: [
        {
          icon: <Feather name='map-pin' size={20} color={theme.colors.text.secondary} />,
          label: t('profile.branchAddress'),
          rightText: getBranchAddress(),
          onPress: handleBranchPress,
        },
        // Only show hotline if phone exists
        ...(contactPhone ? [{
          icon: <Feather name='phone' size={20} color={theme.colors.text.secondary} />,
          label: t('profile.hotline'),
          rightText: contactPhone,
          onPress: () => handleOpenLink(`tel:${contactPhone.replace(/\s/g, '')}`),
        }] : []),
        // Dynamic social platform items
        ...getSocialMenuItems(),
      ],
    },
    {
      title: t('profile.other'),
      items: [
        {
          icon: <Feather name='edit-3' size={20} color={theme.colors.text.secondary} />,
          label: t('profile.feedback'),
          onPress: () => Linking.openURL('mailto:pdmmobile2020@gmail.com?subject=Góp ý từ ứng dụng DiDi'),
        },
        {
          icon: <Feather name='file' size={20} color={theme.colors.text.secondary} />,
          label: t('profile.termsPolicy'),
          onPress: () => router.push('/terms'),
        },
        {
          icon: <Feather name='help-circle' size={20} color={theme.colors.text.secondary} />,
          label: t('profile.helpCenter'),
          onPress: () => contactPhone
            ? Linking.openURL(`tel:${contactPhone.replace(/\s/g, '')}`)
            : Alert.alert('Thông báo', 'Hotline chưa được cập nhật'),
        },
      ],
    },
  ];

  const renderMenuItem = (item: MenuItem, index: number, isLast: boolean) => (
    <Pressable
      key={index}
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      onPress={item.onPress}
      disabled={item.hasSwitch}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuItemIcon}>{item.icon}</View>
        <View style={styles.menuItemContent}>
          <Typography variant='text' size='md'>
            {item.label}
          </Typography>
          {item.rightText && (
            <Typography variant='text' size='sm' style={styles.menuItemRightText}>
              {item.rightText}
            </Typography>
          )}
        </View>
      </View>
      {item.hasSwitch ? (
        <Switch
          value={item.switchValue}
          onValueChange={item.onSwitchChange}
          trackColor={{
            false: theme.colors.background.tertiary,
            true: theme.colors.foreground.brand_primary,
          }}
          thumbColor='#FFFFFF'
        />
      ) : (
        <Feather name='chevron-right' size={20} color={theme.colors.text.tertiary} />
      )}
    </Pressable>
  );

  // Render login card when not logged in
  const renderLoginCard = () => (
    <Pressable style={styles.userSection} onPress={() => router.push('/signin' as any)}>
      <View style={[styles.avatar, { backgroundColor: theme.colors.background.tertiary }]}>
        <Feather name='user' size={28} color={theme.colors.text.tertiary} />
      </View>
      <View style={styles.userInfo}>
        <Typography variant='text' size='lg' weight='bold'>
          {t('profile.loginNow')}
        </Typography>
        <Typography variant='text' size='sm' style={styles.email}>
          {t('profile.loginDescription')}
        </Typography>
      </View>
      <Feather name='chevron-right' size={20} color={theme.colors.text.tertiary} />
    </Pressable>
  );

  // Render user card when logged in
  const renderUserCard = () => (
    <Pressable style={styles.userSection} onPress={() => router.push('/edit-profile' as any)}>
      <Image source={{ uri: getAvatarUrl() }} style={styles.avatarImage} />
      <View style={styles.userInfo}>
        <Typography variant='text' size='lg' weight='bold'>
          {getDisplayName()}
        </Typography>
        <Typography variant='text' size='sm' style={styles.email}>
          {getEmail() || getDisplayName()}
        </Typography>
      </View>
      <Feather name='edit-2' size={20} color={theme.colors.text.tertiary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Info Section */}
        {isLoggedIn ? renderUserCard() : renderLoginCard()}

        {/* Stats Cards - Only show when logged in */}
        {isLoggedIn && (
          <View style={styles.statsContainer}>
            <Pressable style={styles.statsCard} onPress={() => router.push('/membership' as any)}>
              <View style={styles.statsCardLeft}>
                <View style={[styles.statsIcon, { backgroundColor: '#FFF4E5' }]}>
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Typography
                      variant='display'
                      size='xs'
                      weight='bold'
                      style={{ color: '#FF9500' }}
                    >
                      D
                    </Typography>
                  </View>
                </View>
                <View>
                  <Typography variant='text' size='xs' style={styles.statsLabel}>
                    {t('profile.accumulatedPoints')}
                  </Typography>
                  <Typography variant='text' size='lg' weight='bold' style={styles.statsValue}>
                    {profile?.loyalty_points?.toLocaleString() || '0'}
                  </Typography>
                </View>
              </View>
              <Feather name='chevron-right' size={18} color={theme.colors.text.tertiary} />
            </Pressable>

            <Pressable style={styles.statsCard} onPress={() => router.push('/membership' as any)}>
              <View style={styles.statsCardLeft}>
                <View style={[styles.statsIcon, { backgroundColor: '#E5F6FF' }]}>
                  <Feather name='award' size={18} color='#007AFF' />
                </View>
                <View>
                  <Typography variant='text' size='xs' style={styles.statsLabel}>
                    {t('profile.rank')}
                  </Typography>
                  <Typography variant='text' size='lg' weight='bold' style={styles.statsValue}>
                    {profile?.loyalty_points && profile.loyalty_points > 5000 ? 'Hạng Vàng' : profile?.loyalty_points && profile.loyalty_points > 1000 ? 'Hạng Bạc' : 'Hạng Đồng'}
                  </Typography>
                </View>
              </View>
              <Feather name='chevron-right' size={18} color={theme.colors.text.tertiary} />
            </Pressable>
          </View>
        )}

        {/* Menu Sections */}
        {menuSections
          .filter((section) => !section.requiresAuth || isLoggedIn)
          .map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSection}>
              <Typography variant='text' size='sm' style={styles.sectionTitle}>
                {section.title}
              </Typography>
              <View style={styles.menuCard}>
                {section.items.map((item, itemIndex) =>
                  renderMenuItem(item, itemIndex, itemIndex === section.items.length - 1),
                )}
              </View>
            </View>
          ))}

        {/* Logout Button - Only show when logged in */}
        {isLoggedIn && (
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Feather name='log-out' size={20} color='#EF4444' />
            <Typography variant='text' size='md' weight='medium' style={styles.logoutText}>
              {t('profile.logout')}
            </Typography>
          </Pressable>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLanguageModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Typography variant='text' size='lg' weight='bold'>
                {t('profile.language')}
              </Typography>
              <Pressable onPress={() => setLanguageModalVisible(false)}>
                <Feather name='x' size={24} color={theme.colors.text.primary} />
              </Pressable>
            </View>

            <View style={styles.languageOptions}>
              {languageOptions.map((option) => (
                <Pressable
                  key={option.code}
                  style={[
                    styles.languageOption,
                    language === option.code && styles.languageOptionSelected,
                  ]}
                  onPress={() => handleLanguageChange(option.code)}
                >
                  <View style={styles.languageOptionLeft}>
                    <Typography variant='text' size='xl' style={styles.languageFlag}>
                      {option.flag}
                    </Typography>
                    <Typography
                      variant='text'
                      size='md'
                      weight={language === option.code ? 'bold' : 'regular'}
                    >
                      {option.label}
                    </Typography>
                  </View>
                  {language === option.code && (
                    <Feather name='check' size={20} color={theme.colors.text.brand_primary} />
                  )}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scrollContent: {
      padding: 16,
    },
    userSection: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      gap: 12,
      marginBottom: 12,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#4A90D9',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarImage: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    avatarText: {
      color: '#FFFFFF',
    },
    userInfo: {
      flex: 1,
      gap: 2,
    },
    email: {
      color: theme.colors.text.tertiary,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    statsCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
    },
    statsCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    statsIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statsLabel: {
      color: theme.colors.text.tertiary,
    },
    statsValue: {
      color: theme.colors.text.primary,
    },
    loginButton: {
      marginBottom: 16,
    },
    menuSection: {
      marginBottom: 16,
    },
    sectionTitle: {
      color: theme.colors.text.tertiary,
      marginBottom: 8,
      marginLeft: 4,
    },
    menuCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    menuItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.tertiary,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuItemIcon: {
      width: 32,
      marginRight: 12,
    },
    menuItemContent: {
      flex: 1,
    },
    menuItemRightText: {
      color: theme.colors.text.tertiary,
      marginTop: 2,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      marginTop: 8,
    },
    logoutText: {
      color: '#EF4444',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      width: '100%',
      maxWidth: 340,
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.tertiary,
    },
    languageOptions: {
      paddingVertical: 8,
    },
    languageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    languageOptionSelected: {
      backgroundColor: theme.colors.background.secondary,
    },
    languageOptionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    languageFlag: {
      fontSize: 24,
    },
  });

export default Profile;
