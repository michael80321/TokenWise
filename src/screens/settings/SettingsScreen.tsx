import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { Text } from '../../components/Text';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';

function SettingRow({
  label,
  desc,
  onPress,
  right,
  destructive,
}: {
  label: string;
  desc?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !right}
    >
      <View style={styles.rowLeft}>
        <Text variant="bodyMedium" color={destructive ? Colors.expensiveOrange : Colors.text}>
          {label}
        </Text>
        {desc ? <Text variant="caption" color={Colors.textMuted}>{desc}</Text> : null}
      </View>
      {right ?? (onPress ? <Text variant="caption" color={Colors.textMuted}>›</Text> : null)}
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { tier, isPro } = useSubscription();
  const [priceNotif, setPriceNotif] = useState(true);

  async function handleSignOut() {
    Alert.alert('登出', '確定要登出嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '登出', style: 'destructive',
        onPress: async () => { await signOut(); },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text variant="heading" style={styles.title}>設定</Text>

        {/* Account */}
        <Card style={styles.section}>
          <Text variant="label" style={styles.sectionLabel}>帳號</Text>
          <SettingRow
            label={user?.email ?? ''}
            desc="已登入的 Email"
          />
          <View style={styles.divider} />
          <SettingRow
            label="訂閱狀態"
            right={<Badge variant={isPro ? 'brand' : 'neutral'} label={isPro ? 'Pro ✦' : '免費版'} />}
          />
          {!isPro && (
            <>
              <View style={styles.divider} />
              <SettingRow
                label="升級 Pro"
                desc="解鎖分享卡片、通知、無限替代建議"
                onPress={() => {/* Navigate to paywall */}}
              />
            </>
          )}
        </Card>

        {/* Notifications */}
        <Card style={styles.section}>
          <Text variant="label" style={styles.sectionLabel}>通知</Text>
          <SettingRow
            label="價格異動通知"
            desc={isPro ? '模型價格變動時立即推播' : '升級 Pro 後可啟用'}
            right={
              <Switch
                value={priceNotif && isPro}
                onValueChange={(v) => {
                  if (!isPro) {
                    Alert.alert('Pro 功能', '升級 Pro 後可開啟價格通知');
                    return;
                  }
                  setPriceNotif(v);
                }}
                trackColor={{ false: Colors.border, true: Colors.brandLight }}
                thumbColor={priceNotif && isPro ? Colors.brand : Colors.textMuted}
              />
            }
          />
        </Card>

        {/* Legal */}
        <Card style={styles.section}>
          <Text variant="label" style={styles.sectionLabel}>法律</Text>
          <SettingRow label="隱私政策" onPress={() => {/* Navigate to privacy */}} />
          <View style={styles.divider} />
          <SettingRow label="服務條款" onPress={() => {/* Navigate to terms */}} />
          <View style={styles.divider} />
          <SettingRow
            label="還原購買記錄"
            onPress={() => Alert.alert('還原中', '請稍候...')}
          />
        </Card>

        {/* About */}
        <Card style={styles.section}>
          <Text variant="label" style={styles.sectionLabel}>關於</Text>
          <SettingRow label="版本" right={<Text variant="mono" color={Colors.textMuted}>1.0.0</Text>} />
          <View style={styles.divider} />
          <SettingRow
            label="意見回饋"
            desc="寄信給開發者"
            onPress={() => Alert.alert('感謝你的意見', 'feedback@tokenwise.app')}
          />
        </Card>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text variant="bodyMedium" color={Colors.expensiveOrange}>登出</Text>
        </TouchableOpacity>

        <Text variant="caption" color={Colors.textMuted} style={styles.disclaimer}>
          TokenWise · 不插廣告 · 不賣資料{'\n'}
          ⚠️ 價格資料僅供參考，上線前請至各廠商官方頁確認
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.xxxl, gap: Spacing.md },
  title: { fontSize: Typography.sizes.xxxl, marginBottom: Spacing.xs },
  section: { gap: 0, padding: 0, overflow: 'hidden' },
  sectionLabel: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  rowLeft: { flex: 1, gap: 2 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.lg },
  signOutBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.expensiveOrange,
    backgroundColor: Colors.expensiveOrangeLight,
  },
  disclaimer: { textAlign: 'center', lineHeight: 18 },
});
