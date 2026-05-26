import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { Text } from '../../components/Text';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';

const quickGuide = [
  { need: '寫作 / 文案', tool: 'Claude', note: '語感最自然，繁中優秀', variant: 'brand' as const },
  { need: '搜尋 / 即時資訊', tool: 'Perplexity', note: '帶來源的即時搜尋', variant: 'saving' as const },
  { need: '圖像生成', tool: 'Midjourney', note: '商業品質，一鍵出圖', variant: 'neutral' as const },
  { need: '寫程式 / 除錯', tool: 'Claude / Cursor', note: '工程師最愛組合', variant: 'brand' as const },
  { need: '資料分析', tool: 'ChatGPT (GPT-4o)', note: '表格、Python 一把罩', variant: 'neutral' as const },
  { need: '影片製作', tool: 'Runway / Kling', note: '短片生成首選', variant: 'saving' as const },
];

export function DailyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="heading" style={styles.title}>AI 工具顧問</Text>
          <Text variant="body" color={Colors.textSecondary} style={styles.subtitle}>
            告訴我你的問題，我幫你找最適合的工具
          </Text>
        </View>

        <Card elevated style={styles.heroCard}>
          <Text variant="subheading" style={styles.heroTitle}>✦ 場景推薦</Text>
          <Text variant="body" color={Colors.textSecondary}>
            大眾版引導推薦即將上線，現有規則引擎已就緒。
          </Text>
          <Text variant="caption" color={Colors.textMuted} style={{ marginTop: Spacing.md }}>
            描述你的使用場景，顧問式推薦幫你一步到位
          </Text>
          <View style={[styles.comingBadge]}>
            <Badge variant="brand" label="里程碑 3 開發中" />
          </View>
        </Card>

        <Text variant="subheading" style={styles.sectionTitle}>AI 工具快速指南</Text>
        <Text variant="body" color={Colors.textSecondary} style={styles.sectionSub}>
          以你的需求，我建議這樣選
        </Text>

        {quickGuide.map((item) => (
          <Card key={item.need} style={styles.guideCard}>
            <View style={styles.guideRow}>
              <View style={styles.guideLeft}>
                <Text variant="bodyMedium">{item.need}</Text>
                <Text variant="caption" color={Colors.textMuted}>{item.note}</Text>
              </View>
              <Badge variant={item.variant} label={item.tool} />
            </View>
          </Card>
        ))}

        <Card style={styles.subscriptionCard}>
          <Text variant="subheading" style={styles.heroTitle}>你的 AI 訂閱值得嗎？</Text>
          <Text variant="body" color={Colors.textSecondary}>
            37% 的用戶付費在過度配置的方案上。告訴我你的使用習慣，我幫你算。
          </Text>
          <Badge variant="neutral" label="即將推出" style={{ marginTop: Spacing.md }} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  header: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.xxxl,
  },
  subtitle: {
    fontFamily: Typography.headingFamily,
  },
  heroCard: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brandDark,
    gap: Spacing.sm,
  },
  heroTitle: {
    color: '#FFFFFF',
  },
  comingBadge: {
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    marginTop: Spacing.sm,
  },
  sectionSub: {
    marginTop: -Spacing.xs,
    marginBottom: Spacing.xs,
    fontFamily: Typography.bodyFamily,
    fontSize: Typography.sizes.sm,
  },
  guideCard: {
    paddingVertical: Spacing.md,
  },
  guideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guideLeft: {
    flex: 1,
    gap: 2,
    marginRight: Spacing.md,
  },
  subscriptionCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.brand,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
