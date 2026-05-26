import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { Text } from '../../components/Text';
import { requestOTP, verifyOTP } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);

  async function handleRequestOTP() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await requestOTP(email.trim());
      setStep('otp');
    } catch (e: unknown) {
      Alert.alert('發送失敗', e instanceof Error ? e.message : '請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP() {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const token = await verifyOTP(email.trim(), code.trim());
      await signIn(token);
    } catch (e: unknown) {
      Alert.alert('驗證失敗', e instanceof Error ? e.message : '驗證碼錯誤或已過期');
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoBlock}>
            <Text variant="heading" style={styles.logoTitle}>TokenWise</Text>
            <Text variant="body" color={Colors.textSecondary} style={styles.logoSub}>
              你的 AI 選型顧問
            </Text>
          </View>

          <View style={styles.card}>
            {step === 'email' ? (
              <>
                <Text variant="subheading">登入 / 註冊</Text>
                <Text variant="body" color={Colors.textSecondary}>
                  輸入你的 Email，我們會寄送一次性驗證碼
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="send"
                  onSubmitEditing={handleRequestOTP}
                />
                <TouchableOpacity
                  style={[styles.cta, (!email.trim() || loading) && styles.ctaDisabled]}
                  onPress={handleRequestOTP}
                  activeOpacity={0.8}
                  disabled={!email.trim() || loading}
                >
                  {loading
                    ? <ActivityIndicator color="#FFF" />
                    : <Text variant="bodyBold" color="#FFF">發送驗證碼</Text>
                  }
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text variant="subheading">輸入驗證碼</Text>
                <Text variant="body" color={Colors.textSecondary}>
                  已發送到 <Text variant="bodyMedium">{email}</Text>，10 分鐘內有效
                </Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="123456"
                  placeholderTextColor={Colors.textMuted}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOTP}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.cta, (!code.trim() || loading) && styles.ctaDisabled]}
                  onPress={handleVerifyOTP}
                  activeOpacity={0.8}
                  disabled={!code.trim() || loading}
                >
                  {loading
                    ? <ActivityIndicator color="#FFF" />
                    : <Text variant="bodyBold" color="#FFF">驗證並登入</Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.backLink}
                  onPress={() => { setStep('email'); setCode(''); }}
                >
                  <Text variant="caption" color={Colors.textMuted}>← 換 Email 重新發送</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text variant="caption" color={Colors.textMuted} style={styles.disclaimer}>
            登入即表示同意服務條款與隱私政策。
            {'\n'}我們不儲存任何 API Key，不推廣廣告。
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  logoBlock: { alignItems: 'center', gap: Spacing.xs },
  logoTitle: {
    fontSize: 40,
    color: Colors.brand,
  },
  logoSub: { fontFamily: Typography.headingFamily },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontFamily: Typography.bodyFamily,
    fontSize: Typography.sizes.md,
    color: Colors.text,
  },
  otpInput: {
    fontFamily: Typography.monoFamily,
    fontSize: Typography.sizes.xxxl,
    textAlign: 'center',
    letterSpacing: 8,
  },
  cta: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  ctaDisabled: { opacity: 0.5 },
  backLink: { alignSelf: 'center' },
  disclaimer: { textAlign: 'center', lineHeight: 18 },
});
