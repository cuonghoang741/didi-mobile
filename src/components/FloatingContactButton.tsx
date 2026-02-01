import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    Animated,
    Linking,
    Platform,
} from 'react-native';

import { Typography } from '@/components';
import { useTheme } from '@/contexts';
import { useSettings } from '@/hooks';

interface ContactItem {
    id: string;
    icon: React.ReactNode;
    label: string;
    color: string;
    action: () => void;
}

const FloatingContactButton: React.FC = () => {
    const theme = useTheme();
    const { branches, fanpageUrls, contactPhone, settings } = useSettings();

    // Get contact info from settings
    const contactInfo = useMemo(() => {
        // Get phone number from settings (remove spaces for tel: link)
        const phoneNumber = contactPhone?.replace(/\s/g, '') || '';

        // Get messenger URL from fanpage_urls
        const messengerPage = fanpageUrls.find(f => f.platform === 'messenger');
        let messengerUrl = messengerPage?.url || '';

        if (!messengerUrl) {
            // Derive from Facebook URL
            const facebookPage = fanpageUrls.find(f => f.platform === 'facebook');
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

        messengerUrl = messengerUrl || 'https://m.me/';

        // Get first branch address for map
        const branch = branches[0];
        const address = branch?.address || '';
        const mapUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : 'https://maps.google.com';

        return { phoneNumber, messengerUrl, address, mapUrl };
    }, [branches, fanpageUrls, contactPhone]);

    const [isOpen, setIsOpen] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;

    const toggleMenu = useCallback(() => {
        const toValue = isOpen ? 0 : 1;

        Animated.spring(animation, {
            toValue,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
        }).start();

        setIsOpen(!isOpen);
    }, [isOpen, animation]);

    const handleCall = useCallback(() => {
        const url = Platform.OS === 'ios' ? `telprompt:${contactInfo.phoneNumber}` : `tel:${contactInfo.phoneNumber}`;
        Linking.openURL(url).catch((err) => console.error('Error opening phone:', err));
        toggleMenu();
    }, [contactInfo.phoneNumber, toggleMenu]);

    const handleMessenger = useCallback(() => {
        Linking.openURL(contactInfo.messengerUrl).catch((err) => console.error('Error opening Messenger:', err));
        toggleMenu();
    }, [contactInfo.messengerUrl, toggleMenu]);

    const handleMap = useCallback(() => {
        Linking.openURL(contactInfo.mapUrl).catch((err) => console.error('Error opening map:', err));
        toggleMenu();
    }, [contactInfo.mapUrl, toggleMenu]);

    const contactItems: ContactItem[] = [
        {
            id: 'phone',
            icon: <Feather name="phone" size={20} color="#FFFFFF" />,
            label: 'Gọi điện',
            color: '#4CAF50',
            action: handleCall,
        },
        {
            id: 'messenger',
            icon: <FontAwesome5 name="facebook-messenger" size={20} color="#FFFFFF" />,
            label: 'Messenger',
            color: '#0084FF',
            action: handleMessenger,
        },
        {
            id: 'map',
            icon: <Ionicons name="location" size={22} color="#FFFFFF" />,
            label: 'Địa chỉ',
            color: '#FF5722',
            action: handleMap,
        },
    ];

    // Calculate positions for fan animation
    // FAB is at bottom-right corner, so items should fan out to upper-left
    // Angle reference: 0° = right, -90° = up, -180° = left, 90° = down
    // Start more towards upper-left to avoid overflow on the right edge
    const getItemStyle = (index: number, total: number) => {
        const startAngle = -90;  // Upper-left direction (not straight up to avoid overflow)
        const endAngle = -180;    // Straight left
        const angleStep = (endAngle - startAngle) / (total - 1);
        const angle = startAngle + angleStep * index;
        const angleRad = (angle * Math.PI) / 180;
        const radius = 90; // Increased distance from FAB center for more spacing

        const translateX = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, radius * Math.cos(angleRad)],
        });

        const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, radius * Math.sin(angleRad)],
        });

        const scale = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
        });

        const opacity = animation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1],
        });

        return {
            transform: [{ translateX }, { translateY }, { scale }],
            opacity,
        };
    };



    return (
        <View style={styles.container}>
            {/* Backdrop */}
            {isOpen && (
                <Pressable style={styles.backdrop} onPress={toggleMenu} />
            )}

            {/* Contact items with labels */}
            {contactItems.map((item, index) => (
                <Animated.View
                    key={item.id}
                    style={[
                        styles.itemContainer,
                        getItemStyle(index, contactItems.length),
                    ]}
                >
                    <View style={styles.itemWrapper}>
                        <Pressable
                            style={[styles.itemButton, { backgroundColor: item.color }]}
                            onPress={item.action}
                        >
                            {item.icon}
                        </Pressable>
                    </View>
                </Animated.View>
            ))}

            {/* Main FAB button */}
            <Pressable onPress={toggleMenu} style={styles.fabButton}>
                <View
                    style={[
                        styles.fabContent,
                        { backgroundColor: isOpen ? '#333' : theme.colors.text.brand_primary },
                    ]}
                >
                    <Feather name={isOpen ? "x" : "phone"} size={24} color="#FFFFFF" />
                </View>
            </Pressable>
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
    },
    backdrop: {
        position: 'absolute',
        top: -2000,
        left: -1000,
        right: -1000,
        bottom: -1000,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: -1,
    },
    fabButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    fabContent: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemContainer: {
        position: 'absolute',
        alignItems: 'flex-end',
    },
    itemWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
