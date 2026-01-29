import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography } from '@/components';
import { useTheme, useLanguage } from '@/contexts';

const OrderSuccessScreen = () => {
  const { orderId, orderNumber } = useLocalSearchParams<{ orderId: string; orderNumber: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate success icon
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(checkAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Fade in content
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 400,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Animation */}
        <Animated.View
          style={[
            styles.successCircle,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient colors={['#10B981', '#059669']} style={styles.gradient}>
            <Animated.View style={{ opacity: checkAnim }}>
              <Feather name='check' size={60} color='#FFFFFF' />
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Content */}
        <Animated.View style={[styles.textContent, { opacity: opacityAnim }]}>
          <Typography variant='display' size='md' weight='bold' style={styles.title}>
            {t('order.success')}
          </Typography>

          <Typography variant='text' size='md' style={styles.description}>
            {t('order.successDesc')}
          </Typography>

          {/* Order Number */}
          <View style={styles.orderNumberCard}>
            <Typography variant='text' size='sm' style={styles.orderLabel}>
              {t('order.orderNumber')}
            </Typography>
            <Typography variant='text' size='xl' weight='bold' style={styles.orderNumber}>
              {orderNumber}
            </Typography>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Feather name='info' size={20} color={theme.colors.text.brand_primary} />
            <Typography variant='text' size='sm' style={styles.infoText}>
              Chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ để xác nhận đơn hàng.
            </Typography>
          </View>
        </Animated.View>
      </View>

      {/* Buttons */}
      <Animated.View style={[styles.buttonContainer, { opacity: opacityAnim }]}>
        <Pressable
          style={styles.viewOrderButton}
          onPress={() => router.replace(`/order/${orderId}`)}
        >
          <LinearGradient
            colors={['#5B7CFF', '#3D4DF4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.viewOrderGradient}
          >
            <Feather name='file-text' size={20} color='#FFFFFF' />
            <Typography variant='text' size='md' weight='bold' style={styles.viewOrderText}>
              {t('order.viewOrder')}
            </Typography>
          </LinearGradient>
        </Pressable>

        <Pressable style={styles.homeButton} onPress={() => router.replace('/')}>
          <Feather name='home' size={20} color={theme.colors.text.brand_primary} />
          <Typography variant='text' size='md' weight='semiBold' style={styles.homeButtonText}>
            {t('order.backToHome')}
          </Typography>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    successCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      overflow: 'hidden',
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 10,
    },
    gradient: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    textContent: {
      alignItems: 'center',
      marginTop: 32,
    },
    title: {
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    description: {
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginTop: 12,
      lineHeight: 22,
    },
    orderNumberCard: {
      marginTop: 32,
      backgroundColor: theme.colors.background.secondary,
      paddingHorizontal: 32,
      paddingVertical: 20,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderStyle: 'dashed',
    },
    orderLabel: {
      color: theme.colors.text.tertiary,
      marginBottom: 4,
    },
    orderNumber: {
      color: theme.colors.text.brand_primary,
      letterSpacing: 2,
    },
    infoBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#EEF2FF',
      padding: 16,
      borderRadius: 12,
      marginTop: 24,
      gap: 12,
    },
    infoText: {
      flex: 1,
      color: theme.colors.text.secondary,
      lineHeight: 20,
    },
    buttonContainer: {
      padding: 24,
      paddingBottom: 32,
      gap: 12,
    },
    viewOrderButton: {
      borderRadius: 14,
      overflow: 'hidden',
    },
    viewOrderGradient: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 16,
      gap: 10,
    },
    viewOrderText: {
      color: '#FFFFFF',
    },
    homeButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 16,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: theme.colors.text.brand_primary,
      gap: 10,
    },
    homeButtonText: {
      color: theme.colors.text.brand_primary,
    },
  });

export default OrderSuccessScreen;
