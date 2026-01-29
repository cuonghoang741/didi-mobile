import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography, Button, AuthProtect } from '@/components';
import { useTheme, useLanguage, useAuth } from '@/contexts';

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
}

const Profile = () => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLanguage();
  const { user, logout, isLoggedIn, getDisplayName, getEmail, getAvatarUrl } = useAuth();
  const styles = createStyles(theme);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Get user initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  // Menu sections configuration
  const menuSections: MenuSection[] = [
    {
      title: t('profile.account'),
      items: [
        {
          icon: <Feather name='gift' size={20} color={theme.colors.text.secondary} />,
          label: t('profile.voucherWallet'),
          onPress: () => console.log('Voucher wallet'),
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
          onSwitchChange: setNotificationsEnabled,
        },
        {
          icon: <Feather name='globe' size={20} color={theme.colors.text.secondary} />,
          label: t('profile.language'),
          onPress: () => console.log('Language'),
        },
      ],
    },
    {
      title: t('profile.aboutApp'),
      items: [
        {
          icon: <Feather name='map-pin' size={20} color={theme.colors.text.secondary} />,
          label: t('profile.branchAddress'),
          onPress: () => console.log('Branch address'),
        },
        {
          icon: <Feather name='phone' size={20} color={theme.colors.text.secondary} />,
          label: t('profile.hotline'),
          rightText: '1900 3147',
          onPress: () => handleOpenLink('tel:19003147'),
        },
        {
          icon: <Feather name='message-circle' size={20} color='#00C300' />,
          label: t('profile.chatLine'),
          onPress: () => console.log('LINE'),
        },
        {
          icon: <Feather name='message-circle' size={20} color='#0084FF' />,
          label: t('profile.chatMessenger'),
          onPress: () => console.log('Messenger'),
        },
        {
          icon: <Feather name='facebook' size={20} color='#1877F2' />,
          label: t('profile.visitFacebook'),
          onPress: () => handleOpenLink('https://facebook.com'),
        },
      ],
    },
    {
      title: t('profile.other'),
      items: [
        {
          icon: <Feather name='edit-3' size={20} color={theme.colors.text.secondary} />,
          label: t('profile.feedback'),
          onPress: () => console.log('Feedback'),
        },
        {
          icon: <Feather name='file' size={20} color={theme.colors.text.secondary} />,
          label: t('profile.termsPolicy'),
          onPress: () => console.log('Terms'),
        },
        {
          icon: <Feather name='help-circle' size={20} color={theme.colors.text.secondary} />,
          label: t('profile.helpCenter'),
          onPress: () => console.log('Help'),
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

  return (
    <AuthProtect>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Info Section */}
          <Pressable style={styles.userSection} onPress={() => router.push('/edit-profile' as any)}>
            <View style={styles.avatar}>
              <Typography variant='display' size='sm' weight='bold' style={styles.avatarText}>
                {getInitials(getDisplayName())}
              </Typography>
            </View>
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

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <Pressable style={styles.statsCard}>
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
                    1.600.000
                  </Typography>
                </View>
              </View>
              <Feather name='chevron-right' size={18} color={theme.colors.text.tertiary} />
            </Pressable>

            <Pressable style={styles.statsCard}>
              <View style={styles.statsCardLeft}>
                <View style={[styles.statsIcon, { backgroundColor: '#E5F6FF' }]}>
                  <Feather name='award' size={18} color='#007AFF' />
                </View>
                <View>
                  <Typography variant='text' size='xs' style={styles.statsLabel}>
                    {t('profile.rank')}
                  </Typography>
                  <Typography variant='text' size='lg' weight='bold' style={styles.statsValue}>
                    {t('profile.silverRank')}
                  </Typography>
                </View>
              </View>
              <Feather name='chevron-right' size={18} color={theme.colors.text.tertiary} />
            </Pressable>
          </View>

          {/* Menu Sections */}
          {menuSections.map((section, sectionIndex) => (
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

          {/* Logout Button */}
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Feather name='log-out' size={20} color='#EF4444' />
            <Typography variant='text' size='md' weight='medium' style={styles.logoutText}>
              {t('profile.logout')}
            </Typography>
          </Pressable>

          <View style={{ height: 100 }} />
        </ScrollView>
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
    scrollContent: {
      padding: 16,
    },
    userSection: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.background.primary,
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
      backgroundColor: theme.colors.background.primary,
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
      backgroundColor: theme.colors.background.primary,
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
  });

export default Profile;
