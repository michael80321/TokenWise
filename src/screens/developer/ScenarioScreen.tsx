import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { Text } from '../../components/Text';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { ProviderChip } from '../../components/ProviderLogo';
import {
  SCENARIO_QUESTIONS,
  ScenarioTag,
  recommend,
  Recommendation,
} from '../../engine/scenarioEngine';
import { fetchPricing } from '../../api/pricing';
import { ModelPricing } from '../../data/types';
import { useFocusEffect } from '@react-navigation/native';

type Answers = Record<string, string[]>;

export function ScenarioScreen() {
  const [answers, setAnswers] = useState<Answers>({});
  const [models, setModels] = useState<ModelPricing[]>([]);
  const [showResults, setShowResults] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchPricing().then((d) => setModels(d.models));
    }, [])
  );

  const allTags = useMemo<ScenarioTag[]>(() => {
    const tags: ScenarioTag[] = [];
    for (const q of SCENARIO_QUESTIONS) {
      const selected = answers[q.id] ?? [];
      for (const opt of q.options) {
        if (selected.includes(opt.value)) {
          tags.push(...opt.tags);
        }
      }
    }
    return [...new Set(tags)];
  }, [answers]);

  const recommendations = useMemo<Recommendation[]>(
    () => (showResults ? recommend(allTags) : []),
    [showResults, allTags]
  );

  const getModel = useCallback(
    (id: string) => models.find((m) => m.id === id),
    [models]
  );

  const isMultiSelect = (questionId: string) => questionId === 'features';

  function toggleOption(qId: string, value: string) {
    setShowResults(false);
    if (isMultiSelect(qId)) {
      const current = answers[qId] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setAnswers({ ...answers, [qId]: next });
    } else {
      setAnswers({ ...answers, [qId]: [value] });
    }
  }

  function isSelected(qId: string, value: string) {
    return (answers[qId] ?? []).includes(value);
  }

  const answeredCount = SCENARIO_QUESTIONS.filter((q) => (answers[q.id] ?? []).length > 0).length;
  const canSubmit = answeredCount >= 3;

  function reset() {
    setAnswers({});
    setShowResults(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text variant="heading" style={styles.title}>場景選型顧問</Text>
          <Text variant="body" color={Colors.textSecondary} style={styles.subtitle}>
            告訴我你的情境，我幫你挑最合適的模型
          </Text>
          <Text variant="caption" color={Colors.textMuted}>
            免費版：規則引擎即時推薦，零 token 成本
          </Text>
        </View>

        {SCENARIO_QUESTIONS.map((q) => (
          <Card key={q.id} style={styles.questionCard}>
            <Text variant="subheading" style={styles.questionText}>{q.question}</Text>
            {isMultiSelect(q.id) && (
              <Text variant="caption" color={Colors.textMuted}>可多選</Text>
            )}
            <View style={styles.optionsGrid}>
              {q.options.map((opt) => {
                const selected = isSelected(q.id, opt.value);
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionPill, selected && styles.optionPillSelected]}
                    onPress={() => toggleOption(q.id, opt.value)}
                    activeOpacity={0.75}
                  >
                    <Text
                      variant="label"
                      color={selected ? Colors.brandDark : Colors.textSecondary}
                      style={selected ? styles.optionLabelSelected : undefined}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        ))}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaButton, !canSubmit && styles.ctaDisabled]}
          onPress={() => canSubmit && setShowResults(true)}
          activeOpacity={0.8}
        >
          <Text
            variant="bodyBold"
            color={canSubmit ? '#FFFFFF' : Colors.textMuted}
          >
            {canSubmit ? '✦ 給我推薦' : `還需回答 ${3 - answeredCount} 題`}
          </Text>
        </TouchableOpacity>

        {/* Results */}
        {showResults && (
          <>
            <View style={styles.resultsHeader}>
              <Text variant="subheading">以你的場景，我建議…</Text>
              <Text variant="caption" color={Colors.textMuted}>
                依規則引擎綜合評分排序，點擊模型卡查看詳細
              </Text>
            </View>

            {recommendations.map((rec, idx) => {
              const model = getModel(rec.modelId);
              const rankLabel = idx === 0 ? '首推' : idx === 1 ? '次推' : '備選';
              const rankVariant = idx === 0 ? 'brand' : idx === 1 ? 'saving' : 'neutral';

              return (
                <Card key={rec.modelId} style={[styles.recCard, idx === 0 ? styles.topRecCard : {}]}>
                  <View style={styles.recHeader}>
                    <Badge variant={rankVariant} label={`✦ ${rankLabel}`} />
                    {model && <ProviderChip provider={model.provider} />}
                  </View>
                  <Text variant="subheading">
                    {model?.name ?? rec.modelId}
                  </Text>
                  <View style={styles.rationaleBox}>
                    <Text variant="body" color={Colors.textSecondary} style={styles.rationaleText}>
                      「{rec.rationale}。」
                    </Text>
                  </View>
                  {model?.notes ? (
                    <Text variant="caption" color={Colors.textMuted}>{model.notes}</Text>
                  ) : null}
                </Card>
              );
            })}

            {recommendations.length === 0 && (
              <Card>
                <Text variant="body" color={Colors.textSecondary}>
                  無法從你的選擇中比對出推薦。請多回答幾題再試試。
                </Text>
              </Card>
            )}

            <TouchableOpacity style={styles.resetButton} onPress={reset} activeOpacity={0.7}>
              <Text variant="label" color={Colors.textSecondary}>重新選擇</Text>
            </TouchableOpacity>
          </>
        )}
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
  questionCard: { gap: Spacing.md },
  questionText: { lineHeight: Typography.sizes.lg * 1.4 },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optionPillSelected: {
    backgroundColor: Colors.brandLight,
    borderColor: Colors.brand,
  },
  optionLabelSelected: {
    fontFamily: Typography.bodyMediumFamily,
    color: Colors.brandDark,
  },
  ctaButton: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  ctaDisabled: {
    backgroundColor: Colors.surfaceElevated,
  },
  resultsHeader: { gap: Spacing.xs, marginTop: Spacing.xs },
  recCard: { gap: Spacing.sm },
  topRecCard: { borderColor: Colors.brand, borderWidth: 1.5 },
  recHeader: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  rationaleBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: Colors.brand,
  },
  rationaleText: {
    fontFamily: Typography.headingFamily,
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * 1.8,
  },
  resetButton: {
    alignItems: 'center',
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
});
