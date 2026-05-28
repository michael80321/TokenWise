import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { Text } from '../../components/Text';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { ProviderChip } from '../../components/ProviderLogo';
import { ShareButton } from '../../components/ShareButton';
import { fetchPricing } from '../../api/pricing';
import { ModelPricing } from '../../data/types';
import { formatUSD } from '../../engine/costCalculator';
import { useSubscription } from '../../context/SubscriptionContext';

const FREE_MONTHLY_LIMIT = 3;
const STORAGE_KEY = 'alternative_uses_this_month';

function getThisMonthKey() {
  const d = new Date();
  return `${STORAGE_KEY}_${d.getFullYear()}_${d.getMonth()}`;
}

interface Alternative {
  model: ModelPricing;
  avgPrice: number;
  saving: number;
  savingPct: number;
  cpRatio: number;
}

function findAlternatives(current: ModelPricing, all: ModelPricing[]): Alternative[] {
  const currentAvg = (current.input_per_mtok + current.output_per_mtok) / 2;
  if (currentAvg === 0) return [];

  return all
    .filter((m) => m.id !== current.id)
    .map((m) => {
      const avg = (m.input_per_mtok + m.output_per_mtok) / 2;
      const saving = currentAvg - avg;
      const savingPct = (saving / currentAvg) * 100;
      const cpRatio = m.quality_score / Math.max(avg, 0.001);
      return { model: m, avgPrice: avg, saving, savingPct, cpRatio };
    })
    .filter((a) => a.saving > 0 && a.model.quality_score >= current.quality_score - 15)
    .sort((a, b) => b.saving - a.saving)
    .slice(0, 4);
}

export function AlternativeScreen() {
  const [models, setModels] = useState<ModelPricing[]>([]);
  const [selected, setSelected] = useState<ModelPricing | null>(null);
  const [usesThisMonth, setUsesThisMonth] = useState(0);
  const { isPro } = useSubscription();

  useFocusEffect(
    useCallback(() => {
      fetchPricing().then((d) => setModels(d.models));
      AsyncStorage.getItem(getThisMonthKey()).then((val: string | null) => {
        setUsesThisMonth(parseInt(val ?? '0') || 0);
      });
    }, [])
  );

  const alternatives = useMemo(
    () => (selected ? findAlternatives(selected, models) : []),
    [selected, models]
  );

  const canUse = isPro || usesThisMonth < FREE_MONTHLY_LIMIT;
  const remainingFree = Math.max(0, FREE_MONTHLY_LIMIT - usesThisMonth);

  function selectModel(m: ModelPricing) {
    if (!canUse) return;
    setSelected(m);
    if (!isPro) {
      const next = usesThisMonth + 1;
      setUsesThisMonth(next);
      AsyncStorage.setItem(getThisMonthKey(), String(next));
    }
  }

  const pricedModels = models.filter((m) => m.input_per_mtok > 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text variant="heading" style={styles.title}>一鍵替代建議</Text>
          <Text variant="body" color={Colors.textSecondary} style={styles.subtitle}>
            告訴我你現在在用哪個模型，我找更便宜的替代
          </Text>
          {!isPro && (
            <Badge
              variant={remainingFree > 0 ? 'neutral' : 'expensive'}
              label={remainingFree > 0 ? `免費版本月剩 ${remainingFree} 次` : '本月免費次數已用完 — 升級 Pro 無限使用'}
            />
          )}
        </View>

        {/* Model Picker */}
        <Card style={styles.pickerCard}>
          <Text variant="subheading">你現在用哪個模型？</Text>
          <View style={styles.modelGrid}>
            {pricedModels.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.modelChip,
                  selected?.id === m.id && styles.modelChipSelected,
                  !canUse && selected?.id !== m.id && styles.modelChipDisabled,
                ]}
                onPress={() => selectModel(m)}
                activeOpacity={0.75}
                disabled={!canUse && selected?.id !== m.id}
              >
                <Text
                  variant="caption"
                  color={selected?.id === m.id ? Colors.brandDark : Colors.textSecondary}
                >
                  {m.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Results */}
        {selected && alternatives.length > 0 && (
          <>
            <View style={styles.resultsHeader}>
              <Text variant="subheading">
                比 <Text variant="bodyBold" color={Colors.brand}>{selected.name}</Text> 更划算的選擇
              </Text>
              <Text variant="caption" color={Colors.textMuted}>
                品質落差在 15 分以內的替代，依省錢幅度排序
              </Text>
            </View>

            {alternatives.map((alt, idx) => {
              const isTop = idx === 0;
              const savingText = alt.savingPct > 0
                ? `省 ${Math.round(alt.savingPct)}%`
                : '';

              return (
                <Card key={alt.model.id} style={[styles.altCard, isTop ? styles.altCardTop : {}]}>
                  {isTop && <Badge variant="saving" label="✦ 最省推薦" style={styles.topBadge} />}
                  <View style={styles.altHeader}>
                    <View style={styles.altTitleBlock}>
                      <ProviderChip provider={alt.model.provider} />
                      <Text variant="subheading" style={styles.altName}>{alt.model.name}</Text>
                      <Text variant="caption" color={Colors.textMuted}>{alt.model.notes}</Text>
                    </View>
                    <View style={styles.altSavingBlock}>
                      <Text variant="mono" color={Colors.savingGreen} style={styles.savingText}>
                        {savingText}
                      </Text>
                      <Text variant="caption" color={Colors.textMuted}>較便宜</Text>
                    </View>
                  </View>

                  <View style={styles.priceCompare}>
                    <View style={styles.priceCol}>
                      <Text variant="caption" color={Colors.textMuted}>現在（{selected.name}）</Text>
                      <Text variant="mono" color={Colors.expensiveOrange}>
                        ${((selected.input_per_mtok + selected.output_per_mtok) / 2).toFixed(3)}/MTok avg
                      </Text>
                    </View>
                    <Text variant="body" color={Colors.textMuted}>→</Text>
                    <View style={styles.priceCol}>
                      <Text variant="caption" color={Colors.textMuted}>替換後</Text>
                      <Text variant="mono" color={Colors.savingGreen}>
                        ${alt.avgPrice.toFixed(3)}/MTok avg
                      </Text>
                    </View>
                  </View>

                  <View style={styles.qualityRow}>
                    <Text variant="caption" color={Colors.textMuted}>品質分：</Text>
                    <Text variant="mono">
                      {selected.quality_score} → {alt.model.quality_score}
                      {alt.model.quality_score >= selected.quality_score
                        ? <Text variant="caption" color={Colors.savingGreen}> （持平或更好）</Text>
                        : <Text variant="caption" color={Colors.textMuted}> （微降）</Text>
                      }
                    </Text>
                  </View>

                  {isTop && (
                    <ShareButton
                      title="模型替換建議"
                      subtitle={`${selected.name} → ${alt.model.name}`}
                      stat={{
                        label: '平均單價省',
                        value: `${Math.round(alt.savingPct)}%`,
                      }}
                      body={`以你目前的使用量，換成 ${alt.model.name} 可省下約 ${Math.round(alt.savingPct)}% 的 token 費用，品質差距在可接受範圍內。`}
                      label="分享這個替換建議"
                    />
                  )}
                </Card>
              );
            })}
          </>
        )}

        {selected && alternatives.length === 0 && (
          <Card style={styles.noAltCard}>
            <Text variant="subheading">✦ 你已經在用最划算的了</Text>
            <Text variant="body" color={Colors.textSecondary}>
              在同等品質範圍內，找不到比 {selected.name} 更便宜的替代。
              繼續用就對了。
            </Text>
          </Card>
        )}

        {!canUse && !selected && (
          <Card style={styles.upgradeCard}>
            <Text variant="subheading">本月免費次數已用完</Text>
            <Text variant="body" color={Colors.textSecondary}>
              升級 Pro，無限次使用一鍵替代建議，還有分享卡片、價格通知等功能。
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.xxxl, gap: Spacing.md },
  header: { gap: Spacing.sm },
  title: { fontSize: Typography.sizes.xxxl },
  subtitle: { fontFamily: Typography.headingFamily },
  pickerCard: { gap: Spacing.md },
  modelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  modelChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modelChipSelected: {
    backgroundColor: Colors.brandLight,
    borderColor: Colors.brand,
  },
  modelChipDisabled: { opacity: 0.4 },
  resultsHeader: { gap: Spacing.xs },
  altCard: { gap: Spacing.md },
  altCardTop: { borderColor: Colors.savingGreen, borderWidth: 1.5 },
  topBadge: { alignSelf: 'flex-start' },
  altHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  altTitleBlock: { flex: 1, gap: Spacing.xs },
  altName: { marginTop: Spacing.xs },
  altSavingBlock: { alignItems: 'flex-end', marginLeft: Spacing.md },
  savingText: { fontSize: Typography.sizes.xl, color: Colors.savingGreen },
  priceCompare: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  priceCol: { gap: 2 },
  qualityRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  noAltCard: { gap: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.brand },
  upgradeCard: { gap: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.expensiveOrange },
});
