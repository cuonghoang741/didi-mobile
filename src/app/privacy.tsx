import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography } from '@/components';
import { useTheme, useLanguage } from '@/contexts';
import { useSettings } from '@/hooks';

const PrivacyScreen = () => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLanguage();
  const { branches, contactPhone } = useSettings();
  const styles = createStyles(theme);

  const handleBack = () => {
    router.back();
  };

  // Get contact info from settings
  const contactInfo = useMemo(() => {
    const email = 'pdmmobile2020@gmail.com'; // Contact email
    const hotline = contactPhone || '1900-xxxx';
    const address = branches[0]?.address || t('privacy.sections.contact.defaultAddress');
    return { email, hotline, address };
  }, [contactPhone, branches, t]);

  // Sections without contact (contact is rendered separately with dynamic data)
  const sections = [
    { key: 'introduction' },
    { key: 'informationCollection' },
    { key: 'useOfInformation' },
    { key: 'informationSharing' },
    { key: 'dataSecurity' },
    { key: 'userRights' },
    { key: 'cookies' },
    { key: 'children' },
    { key: 'changes' },
  ] as const;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Feather name='arrow-left' size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Typography variant='text' size='lg' weight='bold'>
          {t('privacy.title')}
        </Typography>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Last Updated */}
        <Typography variant='text' size='sm' style={styles.lastUpdated}>
          {t('privacy.lastUpdated')}
        </Typography>

        {/* Dynamic Sections (excluding contact) */}
        {sections.map((section) => (
          <View key={section.key} style={styles.section}>
            <Typography variant='text' size='lg' weight='bold' style={styles.sectionTitle}>
              {t(`privacy.sections.${section.key}.title`)}
            </Typography>
            <Typography variant='text' size='md' style={styles.paragraph}>
              {t(`privacy.sections.${section.key}.content`)}
            </Typography>
          </View>
        ))}

        {/* Contact Section with dynamic data from settings */}
        <View style={styles.section}>
          <Typography variant='text' size='lg' weight='bold' style={styles.sectionTitle}>
            {t('privacy.sections.contact.title')}
          </Typography>
          <Typography variant='text' size='md' style={styles.paragraph}>
            {t('privacy.sections.contact.intro')}
            {'\n\n'}
            📧 Email: {contactInfo.email}
            {'\n'}
            📞 Hotline: {contactInfo.hotline}
            {'\n'}
            🏢 {t('privacy.sections.contact.addressLabel')}: {contactInfo.address}
          </Typography>
        </View>

        <View style={styles.bottomSpacing} />
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
    },
    lastUpdated: {
      color: theme.colors.text.tertiary,
      marginBottom: 24,
      fontStyle: 'italic',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      color: theme.colors.text.primary,
      marginBottom: 12,
    },
    subTitle: {
      color: theme.colors.text.primary,
      marginTop: 12,
      marginBottom: 8,
    },
    paragraph: {
      color: theme.colors.text.secondary,
      lineHeight: 24,
    },
    bottomSpacing: {
      height: 40,
    },
  });

export default PrivacyScreen;
