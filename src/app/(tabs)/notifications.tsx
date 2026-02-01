import { Feather } from '@expo/vector-icons';
import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography } from '@/components';
import { useTheme, useLanguage } from '@/contexts';

const EmptyNotificationImage = require('@/assets/images/empty-noti.png');

const Notifications = () => {
  const theme = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  // TODO: Fetch notifications from API
  const notifications: any[] = [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Typography variant='display' size='sm' weight='bold'>
          {t('tabs.notifications')}
        </Typography>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image source={EmptyNotificationImage} style={styles.emptyImage} resizeMode='contain' />
            <Typography variant='text' size='lg' style={styles.emptyText}>
              {t('notifications.empty')}
            </Typography>
            <Typography variant='text' size='sm' style={styles.emptySubtext}>
              {t('notifications.emptyDescription')}
            </Typography>
          </View>
        ) : (
          notifications.map((notification, index) => (
            <View key={index} style={styles.notificationItem}>
              <View style={styles.notificationIcon}>
                <Feather name='bell' size={20} color={theme.colors.text.brand_primary} />
              </View>
              <View style={styles.notificationContent}>
                <Typography variant='text' size='sm' weight='medium'>
                  {notification.title}
                </Typography>
                <Typography variant='text' size='xs' style={styles.notificationTime}>
                  {notification.time}
                </Typography>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.tertiary,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 100,
    },
    emptyImage: {
      width: 160,
      height: 160,
    },
    emptyText: {
      marginTop: 22,
      fontWeight: 'bold',
    },
    emptySubtext: {
      color: theme.colors.text.tertiary,
      marginTop: 8,
      textAlign: 'center',
    },
    notificationItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 12,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      marginBottom: 8,
      gap: 12,
    },
    notificationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background.brand_primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationContent: {
      flex: 1,
      gap: 4,
    },
    notificationTime: {
      color: theme.colors.text.tertiary,
    },
  });

export default Notifications;
