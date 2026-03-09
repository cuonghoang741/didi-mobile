import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useOTAUpdate } from './useOTAUpdate';

interface OTAAutoUpdateProps {
  onDismiss?: () => void;
}

export const OTAAutoUpdate: React.FC<OTAAutoUpdateProps> = ({ onDismiss }) => {
  const { updateInfo, isChecking, downloadAndInstallUpdate } = useOTAUpdate();
  const [visible, setVisible] = useState(false);
  const shimmerTranslate = useState(new Animated.Value(-200))[0];
  const isUpdating = updateInfo.isDownloading || updateInfo.isInstalling;

  // Auto-start update when available
  useEffect(() => {
    if (updateInfo?.isAvailable && !isUpdating) {
      setVisible(true);
      downloadAndInstallUpdate();
    }
  }, [updateInfo?.isAvailable]);

  // Hide when update completes
  useEffect(() => {
    if (!updateInfo.isAvailable && !isUpdating && visible) {
      setVisible(false);
      onDismiss?.();
    }
  }, [updateInfo.isAvailable, isUpdating, visible]);

  useEffect(() => {
    if (isUpdating) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerTranslate, {
            toValue: 200,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(shimmerTranslate, {
            toValue: -200,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      shimmerTranslate.stopAnimation();
      shimmerTranslate.setValue(-200);
    }
  }, [isUpdating, shimmerTranslate]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.fixedContainer}>
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={['#0D004D', '#4200A5']}
        style={styles.gradientContainer}
      >
        <View style={styles.content}>
          <View style={styles.textRow}>
            <ActivityIndicator size='small' color='#fff' />
            <Text style={styles.updateText}>
              {updateInfo.isInstalling ? 'Installing update...' : 'Downloading update...'}
            </Text>
          </View>
          {updateInfo.downloadProgress > 0 && (
            <Text style={styles.progressPercent}>
              {Math.round(updateInfo.downloadProgress * 100)}%
            </Text>
          )}
        </View>
        {updateInfo.downloadProgress === 0 ? (
          <View style={styles.progressBarTrack}>
            <Animated.View
              style={[
                styles.progressBarShimmerWrapper,
                { transform: [{ translateX: shimmerTranslate }] },
              ]}
            >
              <LinearGradient
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                colors={['#ffffff30', '#ffffff', '#ffffff30']}
                style={styles.progressBarShimmer}
              />
            </Animated.View>
          </View>
        ) : (
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(updateInfo.downloadProgress, 1) * 100}%` },
              ]}
            />
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  fixedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  gradientContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  updateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    borderRadius: 999,
    backgroundColor: '#ffffff30',
    overflow: 'hidden',
  },
  progressBarShimmerWrapper: {
    width: '60%',
    height: '100%',
  },
  progressBarShimmer: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#fff',
  },
});
