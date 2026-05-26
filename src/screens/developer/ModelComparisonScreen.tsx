import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { Text } from '../../components/Text';
import { Card } from '../../components/Card';
import { Badge, BoolBadge } from '../../components/Badge';
import { SortPicker } from '../../components/SortPicker';
import { ProviderChip } from '../../components/ProviderLogo';
import { ModelPricing, PricingData, SortKey } from '../../data/types';
import { fetchPricing } from '../../api/pricing';

function formatContext(tokens: number): string {
  if (tokens >= 1_000_000) return `${tokens / 1_000_000}M`;
  if (tokens >= 1_000) return `${tokens / 1_000}K`;
  return `${tokens}`;
}

function cpScore(model: ModelPricing): number {
  const avgPrice = (model.input_per_mtok + model.output_per_mtok) / 2;
  if (avgPrice === 0) return model.quality_score;
  return model.quality_score / avgPrice;
}

function sortModels(models: ModelPricing[], key: SortKey): ModelPricing[] {
  return [...models].sort((a, b) => {
    switch (key) {
      case 'quality':
        return b.quality_score - a.quality_score;
      case 'price': {
        const priceA = a.input_per_mtok + a.output_per_mtok;
        const priceB = b.input_per_mtok + b.output_per_mtok;
        return priceA - priceB;
      }
      case 'cp_value':
        return cpScore(b) - cpScore(a);
    }
  });
}

function QualityBar({ score }: { score: number }) {
  const color =
    score >= 90 ? Colors.brand :
    score >= 80 ? Colors.savingGreen :
    Colors.textMuted;

  return (
    <View style={styles.qualityBar}>
      <View style={[styles.qualityFill, { width: `${score}%`, backgroundColor: color }]} />
    </View>
  );
}

function ModelCard({ model, rank }: { model: ModelPricing; rank: number }) {
  const [expanded, setExpanded] = useState(false);

  const rankBadge = rank === 1 ? '顧問首推' : rank === 2 ? '次推' : undefined;

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.85}
    >
      <Card style={[styles.modelCard, rank === 1 ? styles.topCard : {}]}>
        {rank === 1 && (
          <View style={styles.topBadgeRow}>
            <Badge variant="brand" label="✦ 顧問首推" />
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.cardTitleBlock}>
            <ProviderChip provider={model.provider} />
            <Text variant="subheading" style={styles.modelName}>{model.name}</Text>
            <Text variant="caption" color={Colors.textMuted}>{model.notes}</Text>
          </View>
          <View style={styles.cardScores}>
            <Text variant="mono" color={Colors.brand} style={styles.scoreNum}>
              {model.quality_score}
            </Text>
            <Text variant="caption" color={Colors.textMuted}>品質分</Text>
          </View>
        </View>

        <View style={styles.qualityRow}>
          <QualityBar score={model.quality_score} />
        </View>

        <View style={styles.statsRow}>
          <StatCell label="Context" value={formatContext(model.context_window)} />
          <StatCell label="Input / MTok" value={model.input_per_mtok === 0 ? '待更新' : `$${model.input_per_mtok}`} isPrice />
          <StatCell label="Output / MTok" value={model.output_per_mtok === 0 ? '待更新' : `$${model.output_per_mtok}`} isPrice />
        </View>

        {expanded && (
          <View style={styles.expandedSection}>
            <View style={styles.divider} />
            <View style={styles.featuresGrid}>
              <FeatureRow label="Tool Calling" supported={model.tool_calling} />
              <FeatureRow label="JSON Mode" supported={model.json_mode} />
              <FeatureRow label="MCP 支援" supported={model.mcp} />
              <FeatureRow label="Prompt Cache" supported={model.supports_cache} />
            </View>
            {model.supports_cache && model.cache_discount != null && (
              <View style={styles.cacheNote}>
                <Text variant="caption" color={Colors.savingGreen}>
                  ✦ Cache 折扣 {Math.round(model.cache_discount * 100)}% off — 高重複 prompt 場景大省
                </Text>
              </View>
            )}
            <Text variant="caption" color={Colors.textMuted} style={styles.tapHint}>
              點擊收合
            </Text>
          </View>
        )}

        {!expanded && (
          <Text variant="caption" color={Colors.textMuted} style={styles.tapHint}>
            點擊展開詳細規格
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

function StatCell({ label, value, isPrice }: { label: string; value: string; isPrice?: boolean }) {
  return (
    <View style={styles.statCell}>
      <Text variant="mono" color={isPrice && value !== '待更新' ? Colors.text : Colors.textSecondary}>
        {value}
      </Text>
      <Text variant="caption">{label}</Text>
    </View>
  );
}

function FeatureRow({ label, supported }: { label: string; supported: boolean }) {
  return (
    <View style={styles.featureRow}>
      <Text variant="label" style={styles.featureLabel}>{label}</Text>
      <BoolBadge value={supported} />
    </View>
  );
}

export function ModelComparisonScreen() {
  const [sortKey, setSortKey] = useState<SortKey>('quality');
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchPricing();
      setPricingData(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const sorted = useMemo(
    () => pricingData ? sortModels(pricingData.models, sortKey) : [],
    [pricingData, sortKey]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ModelPricing; index: number }) => (
      <ModelCard model={item} rank={index + 1} />
    ),
    []
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <Text variant="heading" style={styles.headerTitle}>模型比較</Text>
        <Text variant="body" color={Colors.textSecondary} style={styles.headerSub}>
          以你的場景，我告訴你該用哪個
        </Text>
        {pricingData && (
          <Text variant="caption" color={Colors.textMuted}>
            價格資料更新：{String(pricingData.last_updated).slice(0, 10)} ·{' '}
            <Text variant="caption" color={Colors.expensiveOrange}>上線前請以官方頁面確認</Text>
          </Text>
        )}
      </View>

      <View style={styles.sortRow}>
        <Text variant="label">排序依據</Text>
        <SortPicker value={sortKey} onChange={setSortKey} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.brand} size="large" />
          <Text variant="caption" color={Colors.textMuted} style={{ marginTop: Spacing.md }}>
            載入價格資料中…
          </Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor={Colors.brand}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.sizes.xxxl,
  },
  headerSub: {
    fontFamily: Typography.headingFamily,
    fontSize: Typography.sizes.md,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  list: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  separator: {
    height: Spacing.md,
  },
  modelCard: {
    gap: Spacing.sm,
  },
  topCard: {
    borderColor: Colors.brand,
    borderWidth: 1.5,
  },
  topBadgeRow: {
    marginBottom: Spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleBlock: {
    flex: 1,
    gap: Spacing.xs,
  },
  modelName: {
    marginTop: Spacing.xs,
  },
  cardScores: {
    alignItems: 'flex-end',
    marginLeft: Spacing.md,
  },
  scoreNum: {
    fontSize: Typography.sizes.xxl,
    fontFamily: 'SpaceMono_400Regular',
    color: Colors.brand,
  },
  qualityRow: {
    marginVertical: Spacing.xs,
  },
  qualityBar: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  qualityFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statCell: {
    alignItems: 'center',
    gap: 2,
  },
  expandedSection: {
    gap: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.xs,
  },
  featuresGrid: {
    gap: Spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureLabel: {
    flex: 1,
  },
  cacheNote: {
    backgroundColor: Colors.savingGreenLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  tapHint: {
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
