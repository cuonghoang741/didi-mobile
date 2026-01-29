import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography, Button } from '@/components';
import { useTheme, useLanguage, useAuth } from '@/contexts';

type AuthStep = 'phone' | 'otp';

const OTP_TIMER_DURATION = 60; // seconds

const SignInScreen = () => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLanguage();
  const {
    signInWithPhone,
    verifyPhoneOtp,
    signInWithApple,
    signInWithGoogle,
    signInWithLINE,
    isLoading,
    errorMessage,
  } = useAuth();
  const styles = createStyles(theme);

  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Timer state
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const validatePhone = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    // Simple check: starts with 0 and has 10 digits
    const regex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    return regex.test(cleaned);
  };

  const formatPhoneNumberForApi = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return `+84${cleaned.substring(1)}`;
    }
    return `+84${cleaned}`;
  };

  const handleSendOtp = async () => {
    setLocalError(null);

    if (!phone.trim()) {
      setLocalError(t('auth.errors.phoneRequired') || 'Vui lòng nhập số điện thoại');
      return;
    }

    if (!validatePhone(phone)) {
      setLocalError('Bạn ơi, vui lòng nhập đúng số điện thoại');
      return;
    }

    const apiPhone = formatPhoneNumberForApi(phone);
    setFormattedPhone(apiPhone);

    const result = await signInWithPhone(apiPhone);

    if (result.success) {
      setStep('otp');
      setTimer(OTP_TIMER_DURATION);
    } else {
      setLocalError(result.message);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0 || isLoading) return;

    // Re-send using the already formatted phone
    const result = await signInWithPhone(formattedPhone);
    if (result.success) {
      setTimer(OTP_TIMER_DURATION);
    } else {
      setLocalError(result.message);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length < 6) {
      setLocalError(t('auth.errors.otpRequired') || 'Vui lòng nhập mã xác thực');
      return;
    }

    setLocalError(null);
    // Use the formatted phone
    const result = await verifyPhoneOtp(formattedPhone, otp);

    if (result) {
      router.replace('/');
    } else {
      setLocalError(t('auth.errors.invalidOtp') || 'Mã xác thực không đúng');
    }
  };

  const handleAppleLogin = async () => {
    setLocalError(null);
    await signInWithApple();
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    await signInWithGoogle();
  };

  const handleLINELogin = async () => {
    setLocalError(null);
    await signInWithLINE();
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone');
      setOtp('');
      setLocalError(null);
    } else {
      router.back();
    }
  };

  const handleChangePhone = () => {
    setStep('phone');
    setOtp('');
    setLocalError(null);
  };

  const displayError = localError || errorMessage;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={handleBack}>
              <Feather name='arrow-left' size={24} color={theme.colors.text.primary} />
            </Pressable>
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Typography variant='display' size='lg' weight='bold'>
              {step === 'phone' ? 'Didi Mobile - Uy tín tạo niềm tin' : 'Nhập mã xác thực'}
            </Typography>
            <Typography variant='text' size='md' style={styles.subtitle}>
              {step === 'phone' ? (
                'Đăng nhập / Đăng ký tài khoản ngay bây giờ'
              ) : (
                <>
                  Mã xác thực sẽ được gửi đến số{' '}
                  <Typography variant='text' weight='bold'>
                    {phone}
                  </Typography>
                  . Vui lòng kiểm tra tin nhắn và nhập mã xác thực vào đây
                </>
              )}
            </Typography>
            {step === 'otp' && (
              <Pressable onPress={handleChangePhone} style={styles.changePhoneButton}>
                <Typography variant='text' size='sm' style={styles.changePhoneText}>
                  Đổi số điện thoại <Feather name='edit-2' size={12} />
                </Typography>
              </Pressable>
            )}
          </View>

          {/* Phone Input */}
          {step === 'phone' && (
            <View style={styles.inputSection}>
              <View style={[styles.inputContainer, displayError && styles.inputErrorBorder]}>
                <View style={styles.iconContainer}>
                  <Feather name='phone' size={20} color={theme.colors.text.tertiary} />
                </View>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (displayError) setLocalError(null);
                  }}
                  placeholder={t('auth.signIn.phonePlaceholder') || 'Nhập số điện thoại'}
                  placeholderTextColor={theme.colors.text.tertiary}
                  keyboardType='phone-pad'
                  autoComplete='tel'
                  editable={!isLoading}
                />
                {phone.length > 0 && (
                  <Pressable onPress={() => setPhone('')} style={styles.clearButton}>
                    <Feather name='x' size={16} color={theme.colors.text.tertiary} />
                  </Pressable>
                )}
              </View>
              {displayError && (
                <Typography variant='text' size='sm' style={styles.errorText}>
                  {displayError}
                </Typography>
              )}
            </View>
          )}

          {/* OTP Input */}
          {step === 'otp' && (
            <View style={styles.inputSection}>
              {/* Note: Standard OTP input for now. A split input would require a custom component */}
              <View style={styles.otpContainer}>
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  // Visual representation of OTP boxes (simplified for now as one input covering them)
                  // In a real robust implementation, we'd use a dedicated CodeInput component.
                  // For this implementation, we will use a single TextInput styled to look spaced out or simple input first to ensure functionality.
                  // Or better: Use a standard text input but center aligned.
                  return null;
                })}
                <TextInput
                  style={[styles.input, styles.otpInput, displayError && styles.inputErrorBorder]}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder='- - - - - -'
                  placeholderTextColor={theme.colors.text.tertiary}
                  keyboardType='number-pad'
                  maxLength={6}
                  autoComplete='one-time-code'
                  editable={!isLoading}
                  autoFocus
                />
              </View>

              {displayError && (
                <Typography variant='text' size='sm' style={styles.errorText}>
                  {displayError}
                </Typography>
              )}

              <View style={styles.resendContainer}>
                {timer > 0 ? (
                  <Typography variant='text' size='sm' style={styles.timerText}>
                    Gửi lại mã xác thực ({formatTimer(timer)})
                  </Typography>
                ) : (
                  <Pressable onPress={handleResendOtp} disabled={isLoading}>
                    <Typography variant='text' size='sm' style={styles.resendText}>
                      Gửi lại mã xác thực
                    </Typography>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Primary Action Button */}
          <Button
            colorScheme='brand'
            size='lg'
            variant='solid'
            onPress={step === 'phone' ? handleSendOtp : handleVerifyOtp}
            disabled={isLoading || (step === 'phone' && !phone)}
            loading={isLoading}
            style={styles.primaryButton}
          >
            {step === 'phone' ? 'Tiếp tục' : 'Xác nhận'}
          </Button>

          {/* Divider */}
          {step === 'phone' && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Typography variant='text' size='sm' style={styles.dividerText}>
                  Hoặc
                </Typography>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialButtons}>
                <Pressable
                  style={[styles.socialButton, styles.lineButton]}
                  onPress={handleLINELogin}
                  disabled={isLoading}
                >
                  <Feather name='message-circle' size={24} color='#FFFFFF' />
                  {/* Make sure Icon is imported or use Image for LINE logo if strict */}
                  <Typography variant='text' size='md' weight='medium' style={styles.lineText}>
                    Đăng nhập với LINE
                  </Typography>
                </Pressable>

                <Pressable
                  style={[styles.socialButton, styles.googleButton]}
                  onPress={handleGoogleLogin}
                  disabled={isLoading}
                >
                  {/* Google Icon would typically be an Image */}
                  <Feather name='mail' size={24} color='#DB4437' />
                  <Typography variant='text' size='md' weight='medium'>
                    Đăng nhập với Google
                  </Typography>
                </Pressable>

                {Platform.OS === 'ios' && (
                  <Pressable
                    style={[styles.socialButton, styles.appleButton]}
                    onPress={handleAppleLogin}
                    disabled={isLoading}
                  >
                    <Feather name='command' size={24} color='#000000' />
                    <Typography variant='text' size='md' weight='medium' style={styles.appleText}>
                      Đăng nhập với Apple
                    </Typography>
                  </Pressable>
                )}
              </View>
              <Typography variant='text' size='xs' style={styles.termsText}>
                Bằng việc tiếp tục, Bạn đã đọc và đồng ý với{' '}
                <Typography variant='text' size='xs' weight='bold' style={styles.linkText}>
                  Điều khoản sử dụng
                </Typography>{' '}
                và{' '}
                <Typography variant='text' size='xs' weight='bold' style={styles.linkText}>
                  Chính sách bảo mật
                </Typography>{' '}
                của chúng tôi
              </Typography>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 24,
    },
    header: {
      marginBottom: 24,
      alignItems: 'flex-start',
    },
    backButton: {
      // No background in design usually, but keeping simple
      padding: 0,
    },
    titleSection: {
      marginBottom: 32,
    },
    subtitle: {
      color: theme.colors.text.secondary,
      marginTop: 8,
      lineHeight: 22,
    },
    changePhoneButton: {
      marginTop: 8,
    },
    changePhoneText: {
      color: theme.colors.text.brand_primary,
    },
    inputSection: {
      marginBottom: 24,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 52,
      backgroundColor: theme.colors.background.primary,
    },
    inputErrorBorder: {
      borderColor: '#EF4444',
    },
    iconContainer: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text.primary,
      height: '100%',
    },
    clearButton: {
      padding: 4,
    },
    otpContainer: {
      marginBottom: 16,
    },
    otpInput: {
      textAlign: 'center',
      fontSize: 24,
      letterSpacing: 20,
      height: 60,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
      borderRadius: 12,
    },
    errorText: {
      color: '#EF4444',
      marginTop: 8,
    },
    primaryButton: {
      marginBottom: 24,
      borderRadius: 30, // More rounded as per design
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border.tertiary,
    },
    dividerText: {
      color: theme.colors.text.tertiary,
      paddingHorizontal: 16,
    },
    socialButtons: {
      gap: 16,
      marginBottom: 32,
    },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center', // Center aligned
      height: 52,
      borderRadius: 30, // Pill shape
      gap: 12,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
      backgroundColor: theme.colors.background.primary,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    appleButton: {
      // Style adjustment if you want black bg
      backgroundColor: theme.colors.background.primary,
    },
    appleText: {
      color: theme.colors.text.primary,
    },
    googleButton: {
      // Default white/border
    },
    lineButton: {
      // Default white/border as per design, but LINE ususally green.
      // Design in screenshot shows white buttons with colored icons.
      // So I remove background colors.
    },
    lineText: {
      color: theme.colors.text.primary,
    },
    resendContainer: {
      alignItems: 'flex-start',
    },
    timerText: {
      color: theme.colors.text.tertiary,
    },
    resendText: {
      color: theme.colors.text.brand_primary,
    },
    termsText: {
      color: theme.colors.text.tertiary,
      textAlign: 'center',
      paddingHorizontal: 16,
      lineHeight: 18,
    },
    linkText: {
      color: theme.colors.text.brand_primary,
    },
  });

export default SignInScreen;
