import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { RootBackgroundGradient, Typography, Button, CardBubble } from '@/components';
import BrandText from '@/assets/icons/brand-text.svg';
import { useTheme } from '@/contexts';

const Home = () => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [creating, setCreating] = React.useState(false);
  const progress = React.useRef(new Animated.Value(0)).current;
  const [mascotSize, setMascotSize] = React.useState<{ width: number; height: number } | null>(null);
  const [mascotContainerLayout, setMascotContainerLayout] = React.useState<{ y: number; height: number } | null>(null);
  const categories = React.useMemo(() => ['Spice', 'Color', 'Costume', 'Equipment'] as const, []);
  const [activeCategory, setActiveCategory] = React.useState<typeof categories[number]>('Color');
  const [categoryColors, setCategoryColors] = React.useState<Record<string, string | null>>({ Spice: null, Color: null, Costume: null, Equipment: null });

  const openCreator = () => {
    setCreating(true);
    Animated.timing(progress, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeCreator = () => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setCreating(false);
    });
  };

  const panelTranslateY = progress.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });
  const mascotScale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.82] });
  const mascotTranslateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -90] });
  const ctaTranslateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });
  const ctaOpacity = progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.3, 0] });

  // Bubble animations
  const bubbleOpacity = progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.6, 1] });
  const slideLeft = progress.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] });
  const slideRight = progress.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const slideUp = progress.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] });
  const slideDown = progress.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return (
    <SafeAreaProvider>
      <View style={styles.pageGradient}>
        <RootBackgroundGradient opacity={0.8} />
        <SafeAreaView style={styles.safeAreaView}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {!creating ? (
                <>
                  <BrandText width={86} height={23} />
                  <View style={styles.freeBadge}>
                    <Typography variant='text' size='sm' weight='bold' style={styles.freeBadgeText}>
                      FREE
                    </Typography>
                  </View>
                </>
              ) : (
                <Pressable onPress={closeCreator} style={{ padding: theme.spacing(1) }}>
                  <Feather name='arrow-left' size={24} color={'#111827'} />
                </Pressable>
              )}
            </View>
            <View style={styles.headerRight}>
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

          <View
            style={styles.mascotContainer}
            onLayout={(e) => setMascotContainerLayout({ y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height })}
          >
            <Animated.View style={{ transform: [{ translateY: mascotTranslateY }, { scale: mascotScale }] }}>
              <Image
                source={require('@/assets/images/Mascot.png')}
                resizeMode='contain'
                style={styles.mascot}
                onLayout={(e) => setMascotSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
              />
            </Animated.View>
          </View>

          <View style={styles.footer}>
            <Typography variant='text' size='md' weight='medium' style={styles.taglineCenter}>
              Every great idea deserves a face.
            </Typography>
            <Typography variant='text' size='md' weight='medium' style={styles.taglineCenter}>
              Create your mascot today!
            </Typography>

            <View style={{ height: theme.spacing(4) }} />
            <Animated.View
              pointerEvents={creating ? 'none' : 'auto'}
              style={{ transform: [{ translateY: ctaTranslateY }], opacity: ctaOpacity }}
            >
              <Button
                variant='whiteShadow'
                size='xl'
                startIcon={(props) => <Feather name='plus' size={props?.size ?? 24} color={props?.color} />}
                colorScheme='brand'
                onPress={openCreator}
              >
                New Mascot
              </Button>
            </Animated.View>

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

          {/* Bubbles around mascot when in creating mode */}
          <Animated.View
            pointerEvents={creating ? 'auto' : 'none'}
            style={[StyleSheet.absoluteFill, { opacity: bubbleOpacity }]}
          >
            {(() => {
              const screen = Dimensions.get('window');
              const centerY = mascotContainerLayout ? mascotContainerLayout.y + mascotContainerLayout.height / 2 : screen.height * 0.45;
              const imgH = mascotSize?.height ?? screen.height * 0.38;

              const topY = Math.max(8, centerY - imgH / 2 - 48);
              const midY = centerY - 8;
              const leftBottomY = Math.min(screen.height - 120, centerY + imgH * 0.2);
              const rightBottomY = Math.min(screen.height - 100, centerY + imgH * 0.28);

              return (
                <>
                  {/* Top center name bubble */}
                  <Animated.View
                    style={[
                      styles.bubbleTop,
                      { top: topY, transform: [{ translateY: slideUp }] },
                    ]}
                  >
                    <CardBubble padding={theme.spacing(2)} radius={theme.radius['3xl']}>
                      <Typography variant='text' size='md' weight='bold' style={{ color: '#374151' }}>
                        Lion
                      </Typography>
                    </CardBubble>
                  </Animated.View>

                  {/* Left middle - Color */}
                  <Animated.View
                    style={[
                      styles.bubbleLeftMid,
                      { top: midY, transform: [{ translateX: slideLeft }] },
                    ]}
                  >
                    <CardBubble padding={theme.spacing(2)} radius={theme.radius['3xl']}>
                      <View style={styles.bubbleContentRow}>
                        {categoryColors['Color'] ? (
                          <View style={[styles.bubbleDot, { backgroundColor: categoryColors['Color'] as string }]} />
                        ) : (
                          <Typography variant='text' size='lg' weight='bold' style={{ color: '#111827' }}>+</Typography>
                        )}
                        <Typography variant='text' size='md' weight='bold' style={{ color: '#111827' }}>
                          Color
                        </Typography>
                      </View>
                    </CardBubble>
                  </Animated.View>

                  {/* Right middle - Costume */}
                  <Animated.View
                    style={[
                      styles.bubbleRightMid,
                      { top: midY + theme.spacing(1), transform: [{ translateX: slideRight }] },
                    ]}
                  >
                    <CardBubble padding={theme.spacing(2)} radius={theme.radius['3xl']}>
                      <View style={styles.bubbleContentRow}>
                        <Typography variant='text' size='md' weight='bold' style={{ color: '#6B7280' }}>
                          Costume
                        </Typography>
                        {categoryColors['Costume'] ? (
                          <View style={[styles.bubbleDot, { backgroundColor: categoryColors['Costume'] as string }]} />
                        ) : (
                          <Typography variant='text' size='lg' weight='bold' style={{ color: '#6B7280' }}>+</Typography>
                        )}
                      </View>
                    </CardBubble>
                  </Animated.View>

                  {/* Left bottom - Equipment */}
                  <Animated.View
                    style={[
                      styles.bubbleLeftBottom,
                      { top: leftBottomY, transform: [{ translateX: slideLeft }, { translateY: slideDown }] },
                    ]}
                  >
                    <CardBubble padding={theme.spacing(2)} radius={theme.radius['3xl']}>
                      <View style={styles.bubbleContentRow}>
                        {categoryColors['Equipment'] ? (
                          <View style={[styles.bubbleDot, { backgroundColor: categoryColors['Equipment'] as string }]} />
                        ) : (
                          <Typography variant='text' size='lg' weight='bold' style={{ color: '#6B7280' }}>+</Typography>
                        )}
                        <Typography variant='text' size='md' weight='bold' style={{ color: '#6B7280' }}>
                          Equipment
                        </Typography>
                      </View>
                    </CardBubble>
                  </Animated.View>

                  {/* Right bottom - Identifying */}
                  <Animated.View
                    style={[
                      styles.bubbleRightBottom,
                      { top: rightBottomY, transform: [{ translateX: slideRight }, { translateY: slideDown }] },
                    ]}
                  >
                    <CardBubble padding={theme.spacing(2)} radius={theme.radius['3xl']}>
                      <Typography variant='text' size='md' weight='bold' style={{ color: '#6B7280' }}>
                        Identifying  +
                      </Typography>
                    </CardBubble>
                  </Animated.View>
                </>
              );
            })()}
          </Animated.View>
          {/* Bottom color selector panel */}
          <Animated.View
            pointerEvents={creating ? 'auto' : 'none'}
            style={[
              styles.panel,
              {
                transform: [{ translateY: panelTranslateY }],
              },
            ]}
          >
            <View style={styles.panelHandle} />
            {/* Category Tabs */}
            <View style={styles.tabsRow}>
              {categories.map((cat) => {
                const selected = activeCategory === cat;
                return (
                  <Pressable key={cat} onPress={() => setActiveCategory(cat)} style={[styles.tabItem, selected && styles.tabItemSelected]}>
                    <Typography variant='text' size='lg' weight='bold' style={[styles.tabText, selected && styles.tabTextSelected]}>
                      {cat}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.colorGrid}>
              {['#F43F5E', '#F59E0B', '#FACC15', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#A855F7', '#EC4899', '#111827', '#E5E7EB', '#F9FAFB']
                .map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCategoryColors((prev) => ({ ...prev, [activeCategory]: c }))}
                    style={[styles.colorDot, { backgroundColor: c, borderColor: categoryColors[activeCategory] === c ? '#6366F1' : '#F3F4F6', borderWidth: categoryColors[activeCategory] === c ? 2 : 1 }]}
                  />
                ))}
              {/* Random color button */}
              <Pressable onPress={() => {
                const palette = ['#F43F5E', '#F59E0B', '#FACC15', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#A855F7', '#EC4899', '#111827', '#E5E7EB', '#F9FAFB'];
                const pick = palette[Math.floor(Math.random() * palette.length)];
                setCategoryColors((prev) => ({ ...prev, [activeCategory]: pick }));
              }} style={styles.randomDotWrapper}>
                <LinearGradient
                  colors={['#FDE1E6', '#DDEBFF', '#FFF4DB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.randomDot}
                >
                  <Typography variant='text' size='lg' weight='bold' style={{ color: '#FFFFFF' }}>?</Typography>
                </LinearGradient>
              </Pressable>
            </View>
            <View style={{ height: theme.spacing(3) }} />
            <Pressable style={{ borderRadius: theme.radius.full, overflow: 'hidden' }}>
              <LinearGradient
                colors={['#6D7CFF', '#3F42F4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.generateButton}
              >
                <Typography variant='text' size='lg' weight='bold' style={{ color: '#FFFFFF' }}>
                  Generate
                </Typography>
              </LinearGradient>
            </Pressable>
          </Animated.View>

        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    pageGradient: { flex: 1 },
    safeAreaView: {
      flex: 1,
    },
    header: {
      paddingHorizontal: theme.spacing(4),
      paddingTop: theme.spacing(4),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) },
    brandTitle: {
      letterSpacing: 2,
      color: '#000000',
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
    mascotContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mascot: {
      width: '70%',
      height: undefined,
      aspectRatio: 0.6,
      opacity: 0.96,
    },
    footer: {
      paddingHorizontal: theme.spacing(6),
      paddingBottom: theme.spacing(6),
    },
    taglineCenter: {
      textAlign: 'center',
      color: '#1F2937',
      marginTop: theme.spacing(2),
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
    randomText: { color: '#7C3AED' },

    // Creator panel
    panel: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: theme.radius['2xl'],
      borderTopRightRadius: theme.radius['2xl'],
      paddingHorizontal: theme.spacing(4),
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(6),
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -4 },
    },
    panelHandle: {
      alignSelf: 'center',
      width: 48,
      height: 5,
      borderRadius: 3,
      backgroundColor: '#E5E7EB',
      marginBottom: theme.spacing(3),
    },
    panelHeaderRow: {
      alignItems: 'center',
      gap: theme.spacing(1),
      marginBottom: theme.spacing(3),
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing(3),
      justifyContent: 'space-between',
    },
    colorDot: {
      width: 48,
      height: 48,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: '#F3F4F6',
    },
    generateButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing(3.5),
      borderRadius: theme.radius.full,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    // Bubble absolute positions
    bubbleTop: {
      position: 'absolute',
      top: 12,
      alignSelf: 'center',
      paddingHorizontal: theme.spacing(2),
    },
    bubbleLeftMid: {
      position: 'absolute',
      left: theme.spacing(2),
      top: '32%',
    },
    bubbleRightMid: {
      position: 'absolute',
      right: theme.spacing(2),
      top: '38%',
    },
    bubbleLeftBottom: {
      position: 'absolute',
      left: theme.spacing(2),
      bottom: theme.spacing(18),
    },
    bubbleRightBottom: {
      position: 'absolute',
      right: theme.spacing(2),
      bottom: theme.spacing(12),
    },
    // Tabs
    tabsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing(3),
      paddingHorizontal: theme.spacing(2),
    },
    tabItem: {
      paddingVertical: theme.spacing(1.5),
      paddingHorizontal: theme.spacing(3),
      borderRadius: theme.radius.full,
    },
    tabItemSelected: {
      backgroundColor: 'rgba(99,102,241,0.15)',
    },
    tabText: { color: '#6B7280' },
    tabTextSelected: { color: '#4F46E5' },
    randomDotWrapper: {
      width: 56,
      height: 56,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    randomDot: {
      width: 56,
      height: 56,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bubbleContentRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) },
    bubbleDot: { width: 18, height: 18, borderRadius: 999, borderWidth: 1, borderColor: '#FFFFFF' },
  });

export default Home;


