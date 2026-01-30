import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import Typography from '@/components/ui/Typography/Typography';
import { useTheme, useCart } from '@/contexts';

interface CartIconProps {
    size?: number;
    color?: string;
    showBadge?: boolean;
    onPress?: () => void;
}

export const CartIcon: React.FC<CartIconProps> = ({
    size = 24,
    color,
    showBadge = true,
    onPress,
}) => {
    const theme = useTheme();
    const router = useRouter();
    const { getItemCount } = useCart();

    const itemCount = getItemCount();
    const iconColor = color || theme.colors.text.primary;

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.push('/cart');
        }
    };

    return (
        <Pressable onPress={handlePress} style={styles.container}>
            <Feather name='shopping-cart' size={size} color={iconColor} />
            {showBadge && itemCount > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.colors.text.brand_primary }]}>
                    <Typography variant='text' size='xs' weight='bold' style={styles.badgeText}>
                        {itemCount > 99 ? '99+' : itemCount}
                    </Typography>
                </View>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        padding: 8,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        lineHeight: 12,
    },
});

export default CartIcon;
