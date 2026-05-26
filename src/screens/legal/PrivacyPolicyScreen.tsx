import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../../theme';
import { Text } from '../../components/Text';

const LAST_UPDATED = '2026-05-26';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="subheading" style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <Text variant="body" color={Colors.textSecondary} style={styles.para}>{children}</Text>;
}

export function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text variant="heading" style={styles.pageTitle}>隱私政策</Text>
        <Text variant="caption" color={Colors.textMuted} style={styles.updated}>
          最後更新：{LAST_UPDATED}
        </Text>

        <Section title="我們蒐集什麼">
          <P>
            我們只蒐集提供服務所需的最少資料：
            {'\n'}• Email 地址（用於登入驗證）
            {'\n'}• 裝置推播 Token（用於發送價格異動通知，可隨時取消）
            {'\n'}• 訂閱狀態（由 RevenueCat 管理，我們只保存 tier 狀態）
          </P>
        </Section>

        <Section title="我們不蒐集什麼">
          <P>
            {'\n'}✗ 我們不蒐集你的 API Key — 任何 API Key 只存於你的裝置本機
            {'\n'}✗ 我們不蒐集任何對話內容
            {'\n'}✗ 我們不追蹤跨 App 行為
            {'\n'}✗ 我們不出售任何個人資料給第三方
          </P>
        </Section>

        <Section title="資料如何使用">
          <P>
            你的 Email 僅用於：寄送一次性登入驗證碼、必要的服務通知。
            我們不會用你的 Email 進行行銷，除非你明確訂閱電子報。
          </P>
        </Section>

        <Section title="資料儲存與安全">
          <P>
            資料儲存於 Railway 的 PostgreSQL（位於美國）。
            傳輸過程全程加密（HTTPS / TLS）。
            JWT token 儲存於裝置的 SecureStore（iOS Keychain / Android Keystore），不儲存在 App 的一般儲存空間。
          </P>
        </Section>

        <Section title="第三方服務">
          <P>
            {'\n'}• Resend：Email 寄送服務，Email 地址會傳送至 Resend 以完成寄信作業
            {'\n'}• RevenueCat：訂閱管理，受其隱私政策約束
            {'\n'}• Expo / Apple / Google：推播通知基礎設施
          </P>
        </Section>

        <Section title="你的權利">
          <P>
            你可以隨時要求：
            {'\n'}• 刪除你的帳號與所有相關資料
            {'\n'}• 匯出你的資料
            {'\n'}• 取消訂閱推播通知
            {'\n\n'}請寄信至 privacy@tokenwise.app，我們會在 30 天內回應。
          </P>
        </Section>

        <Section title="Cookie 與追蹤">
          <P>
            App 版本不使用任何 Cookie 或第三方追蹤像素。
            我們使用匿名的崩潰報告（不含個人識別資訊）來改善 App 穩定性。
          </P>
        </Section>

        <Section title="未成年人">
          <P>
            本服務不面向 13 歲以下的兒童。若你是未成年人，請在監護人陪同下使用。
          </P>
        </Section>

        <Section title="政策變更">
          <P>
            如有重大變更，我們會在 App 內通知你並更新本頁面的「最後更新」日期。
            繼續使用服務即表示同意更新後的政策。
          </P>
        </Section>

        <Section title="聯絡我們">
          <P>privacy@tokenwise.app</P>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  pageTitle: { fontSize: Typography.sizes.xxl, marginBottom: Spacing.xs },
  updated: { marginBottom: Spacing.xl },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { marginBottom: Spacing.sm, color: Colors.brandDark },
  para: {
    lineHeight: Typography.sizes.md * Typography.lineHeights.relaxed,
  },
});
