import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { Text } from '../../components/Text';
import { Card } from '../../components/Card';
import { useSubscription } from '../../context/SubscriptionContext';

// RevenueCat integration — requires EAS Build (not Expo Go)
// To enable: run `eas build` and set EXPO_PUBLIC_RC_API_KEY in env
// In Expo Go / dev: purchases are mocked
let Purchases: typeof import('react-native-purchases').default | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Purchases = require('react-native-purchases').default;
} catch {
  // Running in Expo Go — RevenueCat SDK not available
}

const RC_API_KEY = Platform.OS === 'ios'
  ? (process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '')
  : (process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '');

const FEATURES_FREE = [
  '模型比較表',
  'Token 成本計算機（基本）',
  '場景選型（規則引擎）',
  'AI 工具快速指南',
  '一鍵替代建議（每月 3 次）',
];

const FEATURES_PRO = [
  '以上全部免費功能',
  '✦ 價格變動即時通知',
  '✦ 混合路由月費試算',
  '✦ 一鍵替代建議（無限）',
  '✦ 分享卡片（無浮水印）',
  '✦ 團隊成本估算器',
  '✦ 場景選型 AI 潤色說明',
];

export function PaywallScreen({ onClose }: { onClose?: () => void }) {
  const { isPro, refresh } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<import('react-native-purchases').PurchasesPackage[]>([]);

  useEffect(() => {
    if (!Purchases || !RC_API_KEY) return;
    Purchases.configure({ apiKey: RC_API_KEY });
    Purchases.getOfferings()
      .then((offerings) => {
        const pkgs = offerings.current?.availablePackages ?? [];
        setPackages(pkgs);
      })
      .catch(console.warn);
  }, []);

  async function handlePurchase(pkg: import('react-native-purchases').PurchasesPackage) {
    if (!Purchases) {
      Alert.alert('開發模式', '需要使用 EAS Build 版本才能進行真實購買。');
      return;
    }
    setLoading(true);
    try {
      await Purchases.purchasePackage(pkg);
      refresh();
      Alert.alert('升級成功 ✦', '歡迎加入 TokenWise Pro！');
      onClose?.();
    } catch (e: unknown) {
      const err = e as { userCancelled?: boolean; message?: string };
      if (!err.userCancelled) {
        Alert.alert('購買失敗', err.message ?? '請稍後再試');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    if (!Purchases) {
      Alert.alert('開發模式', '需要使用 EAS Build 版本。');
      return;
    }
    setLoading(true);
    try {
      await Purchases.restorePurchases();
      refresh();
      Alert.alert('還原成功', '訂閱狀態已更新。');
    } catch {
      Alert.alert('還原失敗', '請確認使用相同的 Apple/Google 帳號。');
    } finally {
      setLoading(false);
    }
  }

  if (isPro) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.proContainer}>
          <Text variant="heading" style={styles.proEmoji}>✦</Text>
          <Text variant="heading" style={styles.proTitle}>你是 Pro 用戶</Text>
          <Text variant="body" color={Colors.textSecondary}>所有功能已解鎖，感謝支持 TokenWise。</Text>
          {onClose && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text variant="bodyMedium" color={Colors.brandDark}>關閉</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {onClose && (
          <TouchableOpacity style={styles.closeBtnTop} onPress={onClose}>
            <Text variant="label" color={Colors.textMuted}>✕ 關閉</Text>
          </TouchableOpacity>
        )}

        <View style={styles.heroBlock}>
          <Text variant="heading" style={styles.heroTitle}>TokenWise Pro</Text>
          <Text variant="body" color={Colors.textSecondary} style={styles.heroSub}>
            解鎖完整的 AI 選型顧問體驗
          </Text>
        </View>

        <View style={styles.compareGrid}>
          <Card style={styles.tierCard}>
            <Text variant="subheading" color={Colors.textSecondary}>免費版</Text>
            {FEATURES_FREE.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text variant="caption" color={Colors.textMuted} style={styles.featureCheck}>○</Text>
                <Text variant="caption" color={Colors.textSecondary}>{f}</Text>
              </View>
            ))}
          </Card>

          <Card style={[styles.tierCard, styles.proCard]}>
            <Text variant="subheading" color={Colors.brandDark}>Pro 版</Text>
            {FEATURES_PRO.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text variant="caption" color={Colors.savingGreen} style={styles.featureCheck}>✓</Text>
                <Text variant="caption">{f}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Package options */}
        {packages.length > 0 ? (
          <View style={styles.packages}>
            {packages.map((pkg) => (
              <TouchableOpacity
                key={pkg.identifier}
                style={styles.packageBtn}
                onPress={() => handlePurchase(pkg)}
                activeOpacity={0.85}
                disabled={loading}
              >
                <View>
                  <Text variant="bodyBold" color="#FFF">{pkg.product.title}</Text>
                  <Text variant="caption" color="rgba(255,255,255,0.8)">
                    {pkg.product.priceString}
                  </Text>
                </View>
                {loading ? <ActivityIndicator color="#FFF" /> : null}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          // Fallback pricing display when RC not loaded / Expo Go
          <View style={styles.packages}>
            <View style={styles.packageBtn}>
              <View>
                <Text variant="bodyBold" color="#FFF">月費 NT$149</Text>
                <Text variant="caption" color="rgba(255,255,255,0.8)">隨時取消</Text>
              </View>
            </View>
            <View style={[styles.packageBtn, styles.packageBtnYear]}>
              <View>
                <Text variant="bodyBold" color={Colors.brandDark}>年費 NT$990</Text>
                <Text variant="caption" color={Colors.textSecondary}>
                  省 44%，約 NT$83/月
                </Text>
              </View>
              <View style={styles.bestValueBadge}>
                <Text variant="caption" color={Colors.brandDark}>最划算</Text>
              </View>
            </View>
            <Text variant="caption" color={Colors.textMuted} style={styles.rcNote}>
              ※ 實際購買需要正式 App 版本（EAS Build）
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore}>
          <Text variant="caption" color={Colors.textMuted}>已訂閱？還原購買紀錄</Text>
        </TouchableOpacity>

        <Text variant="caption" color={Colors.textMuted} style={styles.legalNote}>
          訂閱將透過 Apple App Store / Google Play 收費。
          {'\n'}取消訂閱請至各平台設定頁操作。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.xxxl, gap: Spacing.lg },
  closeBtnTop: { alignSelf: 'flex-end' },
  heroBlock: { alignItems: 'center', gap: Spacing.xs },
  heroTitle: { fontSize: Typography.sizes.xxxl, color: Colors.brand },
  heroSub: { fontFamily: Typography.headingFamily, textAlign: 'center' },
  compareGrid: { gap: Spacing.md },
  tierCard: { gap: Spacing.sm },
  proCard: { borderColor: Colors.brand, borderWidth: 1.5 },
  featureRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  featureCheck: { width: 14, marginTop: 1 },
  packages: { gap: Spacing.md },
  packageBtn: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageBtnYear: {
    backgroundColor: Colors.brandLight,
    borderWidth: 1.5,
    borderColor: Colors.brand,
  },
  bestValueBadge: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  rcNote: { textAlign: 'center' },
  restoreBtn: { alignSelf: 'center' },
  legalNote: { textAlign: 'center', lineHeight: 18 },
  proContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.md,
  },
  proEmoji: { fontSize: 48, color: Colors.brand },
  proTitle: { color: Colors.brandDark },
  closeBtn: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.brand,
  },
});
