import { Feather } from '@expo/vector-icons';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';

import { Typography, Button } from '@/components';
import { useTheme, useLanguage } from '@/contexts';
import { cancelOrder } from '@/services/supabase/orderService';

interface CancelOrderModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  onCancelSubmitted?: () => void;
}

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  visible,
  onClose,
  orderId,
  onCancelSubmitted,
}) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setReason('');
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: Dimensions.get('window').height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert(
        t('common.error'),
        t('order.cancel.reasonRequired') || 'Vui lòng nhập lý do huỷ đơn',
      );
      return;
    }

    setSubmitting(true);

    try {
      const { success, error } = await cancelOrder(orderId, reason.trim());

      if (success) {
        Alert.alert(t('common.success'), t('order.action.cancel'));
        handleClose();
        onCancelSubmitted?.();
      } else {
        Alert.alert(t('common.error'), error || t('common.error'));
      }
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      Alert.alert(t('common.error'), error.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType='none' transparent onRequestClose={handleClose}>
      <View style={styles.overlayWrapper}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={styles.backdropPressable} onPress={handleClose} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: theme.colors.background.primary,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Typography variant='text' size='lg' weight='bold'>
                {t('order.action.cancel') || 'Huỷ đơn hàng'}
              </Typography>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Feather name='x' size={24} color={theme.colors.text.primary} />
              </Pressable>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Typography variant='text' size='md' style={{ marginBottom: 12 }}>
                {t('order.cancel.reasonPrompt') ||
                  'Vui lòng cho chúng tôi biết lý do bạn huỷ đơn hàng này:'}
              </Typography>

              <TextInput
                style={[
                  styles.reasonInput,
                  {
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                    backgroundColor: theme.colors.background.secondary,
                  },
                ]}
                placeholder={t('order.cancel.reasonPlaceholder') || 'Nhập lý do huỷ...'}
                placeholderTextColor={theme.colors.text.tertiary}
                multiline
                numberOfLines={4}
                value={reason}
                onChangeText={setReason}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Button
                variant='outline'
                colorScheme='gray'
                size='lg'
                onPress={handleClose}
                style={{ flex: 1, marginRight: 8 }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant='solid'
                colorScheme='error'
                size='lg'
                onPress={handleSubmit}
                disabled={submitting}
                style={{ flex: 1, marginLeft: 8 }}
              >
                {submitting ? <ActivityIndicator color='#FFFFFF' /> : t('common.confirm')}
              </Button>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropPressable: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});

export default CancelOrderModal;
