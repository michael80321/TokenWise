import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { Text } from '../../components/Text';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import {
  DailyAnswers,
  UseCase,
  Budget,
  Priority,
  USE_CASE_OPTIONS,
  BUDGET_OPTIONS,
  PRIORITY_OPTIONS,
  ToolRecommendation,
  recommendTools,
} from '../../engine/dailyEngine';

type Step = 0 | 1 | 2 | 3; // 0=use case, 1=budget, 2=priority, 3=results

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i <= current && styles.dotActive]} />
      ))}
    </View>
  );
}

function OptionPill({
  label,
  sub,
  emoji,
  selected,
  onPress,
}: {
  label: string;
  sub?: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.pill, selected && styles.pillSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {emoji ? <Text style={styles.pillEmoji}>{emoji}</Text> : null}
      <View style={styles.pillText}>
        <Text
          variant="bodyMedium"
          color={selected ? Colors.brandDark : Colors.text}
        >
          {label}
        </Text>
        {sub ? (
          <Text variant="caption" color={selected ? Colors.brandDark : Colors.textMuted}>
            {sub}
          </Text>
        ) : null}
      </View>
      {selected && (
        <Text variant="caption" color={Colors.brand} style={styles.checkmark}>✦</Text>
      )}
    </TouchableOpacity>
  );
}

function ToolCard({ tool, rank }: { tool: ToolRecommendation; rank: number }) {
  const isTop = rank === 0;
  const tierLabel: Record<string, string> = { free: '免費', freemium: '免費 + 付費', paid: '付費' };
  const tierVariant: Record<string, 'saving' | 'brand' | 'neutral'> = {
    free: 'saving', freemium: 'brand', paid: 'neutral',
  };
  return (
    <Card style={[styles.toolCard, isTop ? styles.toolCardTop : {}]}>
      <View style={styles.toolHeader}>
        {tool.badge && <Badge variant="brand" label={`✦ ${tool.badge}`} />}
        <Badge variant={tierVariant[tool.tier]} label={tierLabel[tool.tier]} />
      </View>
      <Text variant="subheading">{tool.name}</Text>
      <Text variant="body" color={Colors.textSecondary} style={styles.toolTagline}>
        {tool.tagline}
      </Text>
      <View style={styles.prosList}>
        {tool.pros.map((pro) => (
          <View key={pro} style={styles.prosRow}>
            <Text variant="caption" color={Colors.savingGreen} style={styles.prosCheck}>✓</Text>
            <Text variant="caption" color={Colors.textSecondary}>{pro}</Text>
          </View>
        ))}
      </View>
      <View style={styles.urlRow}>
        <Text variant="caption" color={Colors.textMuted}>{tool.url_hint}</Text>
      </View>
    </Card>
  );
}

const AI_GUIDE = [
  { need: '寫長文 / 報告', tool: 'Claude', note: '語感細膩，繁中最穩' },
  { need: '即時搜尋 / 查資料', tool: 'Perplexity', note: '帶來源，即時索引' },
  { need: '寫程式 / 除錯', tool: 'Cursor', note: '理解整個 codebase' },
  { need: '生成圖片', tool: 'Midjourney', note: '商業品質，設計師御用' },
  { need: '分析文件 / PDF', tool: 'NotebookLM', note: '免費，可追來源' },
  { need: '拍片 / 剪輯 AI 工具', tool: 'Runway', note: '影片生成最成熟' },
  { need: '中文對話 + 省錢', tool: 'DeepSeek', note: '完全免費，繁中不錯' },
  { need: '學習 / 問功課', tool: 'ChatGPT', note: '解題邏輯清晰' },
];

export function DailyScreen() {
  const [step, setStep] = useState<Step>(0);
  const [answers, setAnswers] = useState<DailyAnswers>({});
  const [results, setResults] = useState<ToolRecommendation[]>([]);

  function pickUseCase(v: UseCase) {
    setAnswers({ ...answers, useCase: v });
    setStep(1);
  }
  function pickBudget(v: Budget) {
    setAnswers({ ...answers, budget: v });
    setStep(2);
  }
  function pickPriority(v: Priority) {
    const next = { ...answers, priority: v };
    setAnswers(next);
    setResults(recommendTools(next));
    setStep(3);
  }
  function reset() {
    setAnswers({});
    setResults([]);
    setStep(0);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="heading" style={styles.title}>AI 工具顧問</Text>
          <Text variant="body" color={Colors.textSecondary} style={styles.subtitle}>
            告訴我你的需求，30 秒找到最適合的工具
          </Text>
        </View>

        {/* Step 0 — Use case */}
        {step === 0 && (
          <Card elevated style={styles.stepCard}>
            <Text variant="subheading">你想用 AI 做什麼？</Text>
            <StepDots current={0} total={3} />
            <View style={styles.optionsList}>
              {USE_CASE_OPTIONS.map((opt) => (
                <OptionPill
                  key={opt.value}
                  label={opt.label}
                  emoji={opt.emoji}
                  selected={answers.useCase === opt.value}
                  onPress={() => pickUseCase(opt.value)}
                />
              ))}
            </View>
          </Card>
        )}

        {/* Step 1 — Budget */}
        {step === 1 && (
          <Card elevated style={styles.stepCard}>
            <Text variant="subheading">你的預算方向？</Text>
            <StepDots current={1} total={3} />
            <View style={styles.optionsList}>
              {BUDGET_OPTIONS.map((opt) => (
                <OptionPill
                  key={opt.value}
                  label={opt.label}
                  sub={opt.desc}
                  selected={answers.budget === opt.value}
                  onPress={() => pickBudget(opt.value)}
                />
              ))}
            </View>
            <TouchableOpacity onPress={() => setStep(0)} style={styles.backBtn}>
              <Text variant="caption" color={Colors.textMuted}>← 重新選擇</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Step 2 — Priority */}
        {step === 2 && (
          <Card elevated style={styles.stepCard}>
            <Text variant="subheading">你最在乎哪個？</Text>
            <StepDots current={2} total={3} />
            <View style={styles.optionsList}>
              {PRIORITY_OPTIONS.map((opt) => (
                <OptionPill
                  key={opt.value}
                  label={opt.label}
                  sub={opt.desc}
                  selected={answers.priority === opt.value}
                  onPress={() => pickPriority(opt.value)}
                />
              ))}
            </View>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
              <Text variant="caption" color={Colors.textMuted}>← 上一步</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Step 3 — Results */}
        {step === 3 && (
          <>
            <Card style={styles.resultIntro}>
              <Text variant="subheading" style={styles.resultTitle}>✦ 以你的情況，我建議…</Text>
              <Text variant="body" color={Colors.textSecondary}>
                根據你的需求（{USE_CASE_OPTIONS.find(o => o.value === answers.useCase)?.label}、
                {BUDGET_OPTIONS.find(o => o.value === answers.budget)?.label}），
                這些工具最適合你：
              </Text>
            </Card>

            {results.map((tool, i) => (
              <ToolCard key={tool.name} tool={tool} rank={i} />
            ))}

            <TouchableOpacity style={styles.resetBtn} onPress={reset} activeOpacity={0.75}>
              <Text variant="bodyMedium" color={Colors.brandDark}>重新推薦</Text>
            </TouchableOpacity>
          </>
        )}

        {/* AI Tool Quick Guide — always visible */}
        <View style={styles.guideHeader}>
          <Text variant="subheading">AI 工具快速指南</Text>
          <Text variant="caption" color={Colors.textMuted}>
            常見需求 × 最佳工具一覽
          </Text>
        </View>

        {AI_GUIDE.map((row) => (
          <Card key={row.need} style={styles.guideCard}>
            <View style={styles.guideRow}>
              <View style={styles.guideLeft}>
                <Text variant="bodyMedium">{row.need}</Text>
                <Text variant="caption" color={Colors.textMuted}>{row.note}</Text>
              </View>
              <Badge variant="brand" label={row.tool} />
            </View>
          </Card>
        ))}

        {/* Subscription value teaser */}
        <Card style={styles.subscriptionCard}>
          <Text variant="subheading">你的 AI 訂閱值得嗎？</Text>
          <Text variant="body" color={Colors.textSecondary}>
            37% 的用戶付費在過度配置的方案上。開發者版「成本計算機」可以幫你算清楚。
          </Text>
          <Badge variant="neutral" label="切換到開發者 Tab 試試 →" style={styles.teaserBadge} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.xxxl, gap: Spacing.md },
  header: { gap: Spacing.xs, marginBottom: Spacing.xs },
  title: { fontSize: Typography.sizes.xxxl },
  subtitle: { fontFamily: Typography.headingFamily },

  stepCard: { gap: Spacing.md },
  optionsList: { gap: Spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillSelected: {
    backgroundColor: Colors.brandLight,
    borderColor: Colors.brand,
  },
  pillEmoji: { fontSize: 20 },
  pillText: { flex: 1, gap: 2 },
  checkmark: { fontSize: 16 },
  backBtn: { alignSelf: 'flex-start', marginTop: Spacing.xs },

  dots: { flexDirection: 'row', gap: Spacing.xs },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.borderLight,
  },
  dotActive: { backgroundColor: Colors.brand },

  resultIntro: { gap: Spacing.sm },
  resultTitle: { color: Colors.brandDark },
  toolCard: { gap: Spacing.sm },
  toolCardTop: { borderColor: Colors.brand, borderWidth: 1.5 },
  toolHeader: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  toolTagline: { fontFamily: Typography.headingFamily, fontSize: Typography.sizes.sm },
  prosList: { gap: Spacing.xs },
  prosRow: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'flex-start' },
  prosCheck: { fontWeight: '700', lineHeight: 18 },
  urlRow: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  resetBtn: {
    alignSelf: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.brand,
    backgroundColor: Colors.brandLight,
  },

  guideHeader: { gap: 2, marginTop: Spacing.sm },
  guideCard: { paddingVertical: Spacing.md },
  guideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guideLeft: { flex: 1, gap: 2, marginRight: Spacing.md },
  subscriptionCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.brand,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  teaserBadge: { marginTop: Spacing.xs },
});
