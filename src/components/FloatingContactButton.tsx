import { Feather } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, Linking, Platform } from 'react-native';

import { useSettings } from '@/hooks';
import MessengerLogo from '@/assets/logos/messenger.svg';
import ZaloLogo from '@/assets/logos/zalo.svg';

interface ContactItem {
  id: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

const FloatingContactButton: React.FC = () => {
  const { fanpageUrls, contactPhone } = useSettings();

  // Get contact info from settings
  const contactInfo = useMemo(() => {
    // Get phone number from settings (remove spaces for tel: link)
    const phoneNumber = contactPhone?.replace(/\s/g, '') || '';

    // Get Zalo URL
    const zaloPage = fanpageUrls.find((f) => f.platform === 'zalo');
    const zaloUrl = zaloPage?.url || '';

    // Get messenger URL from fanpage_urls
    const messengerPage = fanpageUrls.find((f) => f.platform === 'messenger');
    let messengerUrl = messengerPage?.url || '';

    // Auto convert web message link to mobile deep link
    if (messengerUrl && messengerUrl.includes('facebook.com/messages/t/')) {
      const id = messengerUrl.split('facebook.com/messages/t/')[1].replace(/[\/#?].*$/, '');
      messengerUrl = `https://m.me/${id}`;
    }

    if (!messengerUrl) {
      // Derive from Facebook URL
      const facebookPage = fanpageUrls.find((f) => f.platform === 'facebook');
      if (facebookPage?.url) {
        try {
          const fbUrl = facebookPage.url;
          // Handle profile.php?id=xxx format
          if (fbUrl.includes('profile.php')) {
            const urlObj = new URL(fbUrl);
            const id = urlObj.searchParams.get('id');
            if (id) {
              messengerUrl = `https://m.me/${id}`;
            }
          } else {
            // Handle facebook.com/xxx format
            const urlObj = new URL(fbUrl);
            const pageId = urlObj.pathname.replace(/^\//, '').split('/')[0];
            if (pageId) {
              messengerUrl = `https://m.me/${pageId}`;
            }
          }
        } catch (error) {
          console.warn('Error parsing Facebook URL:', error);
        }
      }
    }

    return { phoneNumber, messengerUrl, zaloUrl };
  }, [fanpageUrls, contactPhone]);

  const handleCall = () => {
    if (!contactInfo.phoneNumber) return;
    const url =
      Platform.OS === 'ios'
        ? `telprompt:${contactInfo.phoneNumber}`
        : `tel:${contactInfo.phoneNumber}`;
    Linking.openURL(url).catch((err) => console.error('Error opening phone:', err));
  };

  const handleMessenger = () => {
    if (!contactInfo.messengerUrl) return;
    Linking.openURL(contactInfo.messengerUrl).catch((err) =>
      console.error('Error opening Messenger:', err),
    );
  };

  const handleZalo = () => {
    if (!contactInfo.zaloUrl) return;
    Linking.openURL(contactInfo.zaloUrl).catch((err) => console.error('Error opening Zalo:', err));
  };

  // Calculate which items to show based on available info
  const contactItems = useMemo(() => {
    const items: ContactItem[] = [];

    if (contactInfo.phoneNumber) {
      items.push({
        id: 'phone',
        icon: <Feather name='phone' size={24} color='#FFFFFF' />,
        color: '#4CAF50',
        action: handleCall,
      });
    }

    if (contactInfo.messengerUrl) {
      items.push({
        id: 'messenger',
        icon: <MessengerLogo width={28} height={28} />,
        color: '#FFFFFF',
        action: handleMessenger,
      });
    }

    if (contactInfo.zaloUrl) {
      items.push({
        id: 'zalo',
        icon: <ZaloLogo width={28} height={28} />,
        color: '#FFFFFF',
        action: handleZalo,
      });
    }

    return items;
  }, [contactInfo]);

  if (contactItems.length === 0) return null;

  return (
    <View style={styles.container}>
      {contactItems.map((item) => (
        <Pressable
          key={item.id}
          style={[styles.itemButton, { backgroundColor: item.color }]}
          onPress={item.action}
        >
          {item.icon}
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    gap: 12,
  },
  itemButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default FloatingContactButton;
