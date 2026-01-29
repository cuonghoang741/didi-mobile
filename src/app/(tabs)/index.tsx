import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { Button, Typography } from '@/components';
import { useTheme } from '@/contexts';

const Home = () => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeAreaView}>
        <View style={styles.header}>
          <Typography variant='text' size='xl' weight='bold' style={styles.brandTitle}>
            MASHI
          </Typography>
          <View style={styles.headerRight}>
            <View style={styles.freeBadge}>
              <Typography variant='text' size='sm' weight='bold' style={styles.freeBadgeText}>
                FREE
              </Typography>
            </View>
            <Pressable style={styles.upgradeWrapper}>
              <LinearGradient
                colors={['#FFE789', '#FFD74D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.upgradeGradient}
              >
                <View style={styles.upgradeContent}>
                  <Feather name='award' size={20} color={'#1F2937'} />
                  <Typography variant='text' size='md' weight='bold' style={styles.upgradeText}>
                    Upgrade
                  </Typography>
                </View>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        <LinearGradient
          colors={['#FDE1E6', '#DDEBFF', '#FFF4DB']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.mascotContainer}>
            <Image
              source={require('@/assets/images/Mascot.png')}
              resizeMode='contain'
              style={styles.mascot}
            />
          </View>
        </LinearGradient>

        <View style={styles.footer}>
          <Typography variant='text' size='md' weight='medium' style={styles.taglineCenter}>
            Every great idea deserves a face.
          </Typography>
          <Typography variant='text' size='md' weight='medium' style={styles.taglineCenter}>
            Create your mascot today!
          </Typography>

          <View style={{ height: theme.spacing(4) }} />

          <Pressable style={{ borderRadius: theme.radius.full, overflow: 'hidden' }}>
            <LinearGradient
              colors={['#5B7CFF', '#3D4DF4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryCta}
            >
              <View style={styles.ctaContent}>
                <Feather name='plus' size={24} color={'#FFFFFF'} />
                <Typography variant='text' size='lg' weight='bold' style={styles.ctaText}>
                  New Mascot
                </Typography>
              </View>
            </LinearGradient>
          </Pressable>

          <View style={{ height: theme.spacing(3) }} />
          <View style={styles.randomRow}>
            <Typography variant='text' size='lg' weight='bold' style={styles.randomEmoji}>
              🎉
            </Typography>
            <Typography variant='text' size='md' weight='bold' style={styles.randomText}>
              Random
            </Typography>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    safeAreaView: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      paddingHorizontal: theme.spacing(4),
      paddingTop: theme.spacing(4),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    brandTitle: {
      letterSpacing: 2,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing(3),
    },
    freeBadge: {
      backgroundColor: '#EEF2FF',
      paddingHorizontal: theme.spacing(2),
      paddingVertical: theme.spacing(1),
      borderRadius: theme.radius.full,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    freeBadgeText: { color: '#3B82F6' },
    upgradeWrapper: { borderRadius: theme.radius.full },
    upgradeGradient: {
      paddingVertical: theme.spacing(2.5),
      paddingHorizontal: theme.spacing(4),
      borderRadius: theme.radius.full,
      shadowColor: '#F59E0B',
      shadowOpacity: 0.35,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
    },
    upgradeContent: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) },
    upgradeText: { color: '#1F2937' },
    gradient: {
      flex: 1,
      marginTop: theme.spacing(2),
      marginHorizontal: theme.spacing(2),
      borderRadius: theme.radius['3xl'],
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    mascotContainer: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    mascot: {
      width: '85%',
      height: undefined,
      aspectRatio: 0.6,
      opacity: 0.95,
    },
    footer: {
      paddingHorizontal: theme.spacing(6),
      paddingVertical: theme.spacing(6),
    },
    taglineCenter: {
      textAlign: 'center',
      color: theme.colors.text.secondary,
    },
    primaryCta: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing(3.5),
      borderRadius: theme.radius.full,
    },
    ctaContent: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) },
    ctaText: { color: '#FFFFFF' },
    randomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: theme.spacing(1) },
    randomEmoji: { textAlign: 'center' },
    randomText: { color: theme.colors.text.brand_secondary },
  });

export default Home;
