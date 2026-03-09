import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography } from '@/components';
import { useTheme, useLanguage } from '@/contexts';

interface TimeSlot {
  id: string;
  label: string;
  value: string;
}

const SelectTimeSlotScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ selected?: string }>();
  const theme = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  const [selectedSlot, setSelectedSlot] = useState<string>(params.selected || 'all');

  // Create time slots with translations
  const TIME_SLOTS: TimeSlot[] = useMemo(
    () => [
      { id: 'all', label: t('timeSlot.allSlots'), value: 'all' },
      { id: '9-12', label: `9:00 - 12:00 (${t('timeSlot.morning')})`, value: '9-12' },
      { id: '12-14', label: '12:00 - 14:00', value: '12-14' },
      { id: '14-16', label: '14:00 - 16:00', value: '14-16' },
      { id: '16-18', label: '16:00 - 18:00', value: '16-18' },
      { id: '18-20', label: '18:00 - 20:00', value: '18-20' },
      { id: '19-21', label: '19:00 - 21:00', value: '19-21' },
    ],
    [t],
  );

  useEffect(() => {
    // Load saved time slot
    const loadSavedSlot = async () => {
      try {
        const saved = await AsyncStorage.getItem('selected_time_slot');
        if (saved && !params.selected) {
          setSelectedSlot(saved);
        }
      } catch (error) {
        console.error('Error loading time slot:', error);
      }
    };
    loadSavedSlot();
  }, []);

  const handleSelectSlot = async (slot: TimeSlot) => {
    setSelectedSlot(slot.value);
    try {
      await AsyncStorage.setItem('selected_time_slot', slot.value);
      await AsyncStorage.setItem('selected_time_slot_label', slot.label);
    } catch (error) {
      console.error('Error saving time slot:', error);
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name='arrow-left' size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Typography variant='text' size='lg' weight='semiBold' style={styles.headerTitle}>
          {t('timeSlot.title')}
        </Typography>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.slotsContainer}>
          {TIME_SLOTS.map((slot) => {
            const isSelected = selectedSlot === slot.value;
            return (
              <Pressable
                key={slot.id}
                style={[styles.slotCard, isSelected && styles.slotCardActive]}
                onPress={() => handleSelectSlot(slot)}
              >
                <View style={styles.slotContent}>
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.slotInfo}>
                    <Typography
                      variant='text'
                      size='md'
                      weight={isSelected ? 'semiBold' : 'regular'}
                      style={[styles.slotLabel, isSelected && styles.slotLabelActive]}
                    >
                      {slot.label}
                    </Typography>
                    {slot.id === 'all' && (
                      <Typography variant='text' size='sm' style={styles.slotDescription}>
                        {t('timeSlot.allSlotsDesc')}
                      </Typography>
                    )}
                  </View>
                </View>
                {isSelected && <Feather name='check' size={20} color='#2E8FF9' />}
              </Pressable>
            );
          })}
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Feather name='info' size={16} color='#6B7280' />
          <Typography variant='text' size='sm' style={styles.infoText}>
            {t('timeSlot.note')}
          </Typography>
        </View>
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      padding: 8,
      marginLeft: -8,
    },
    headerTitle: {
      color: theme.colors.text.primary,
      flex: 1,
      textAlign: 'center',
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    slotsContainer: {
      padding: 16,
      gap: 12,
    },
    slotCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'white',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    slotCardActive: {
      borderColor: '#2E8FF9',
      backgroundColor: 'rgba(46, 143, 249, 0.05)',
    },
    slotContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: '#D1D5DB',
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioOuterActive: {
      borderColor: '#2E8FF9',
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#2E8FF9',
    },
    slotInfo: {
      flex: 1,
    },
    slotLabel: {
      color: theme.colors.text.primary,
    },
    slotLabelActive: {
      color: '#2E8FF9',
    },
    slotDescription: {
      color: theme.colors.text.tertiary,
      marginTop: 2,
    },
    infoNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 24,
      padding: 12,
      backgroundColor: '#F9FAFB',
      borderRadius: 8,
    },
    infoText: {
      flex: 1,
      color: '#6B7280',
      lineHeight: 20,
    },
  });

export default SelectTimeSlotScreen;
