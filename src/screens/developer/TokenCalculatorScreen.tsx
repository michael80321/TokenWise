import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { Text } from '../../components/Text';
import { Card } from '../../components/Card';
import { fetchPricing } from '../../api/pricing';
import { calcMonthlyCost, formatUSD, formatTokens, CostInput } from '../../engine/costCalculator';
import { ModelPricing } from '../../data/types';
import { ProviderChip } from '../../components/ProviderLogo';
import { Badge } from '../../components/Badge';
import { useFocusEffect } from '@react-navigation/native';

interface InputRowProps {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (v: string) => void;
  unit?: string;
}

function InputRow({ label, hint, value, onChangeText, unit }: InputRowProps) {
  return (
    <View style={styles.inputRow}>
      <View style={styles.inputLabelBlock}>
        <Text variant="bodyMedium">{label}</Text>
        {hint ? <Text variant="caption">{hint}</Text> : null}
      </View>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          returnKeyType="done"
          selectTextOnFocus
          placeholderTextColor={Colors.textMuted}
        />
        {unit ? <Text variant="caption" color={Colors.textMuted} style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function ToggleRow({ label, hint, value, onToggle }: { label: string; hint?: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.inputRow}>
      <View style={styles.inputLabelBlock}>
        <Text variant="bodyMedium">{label}</Text>
        {hint ? <Text variant="caption">{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.border, true: Colors.brandLight }}
        thumbColor={value ? Colors.brand : Colors.textMuted}
      />
    </View>
  );
}

export function TokenCalculatorScreen() {
  const [models, setModels] = useState<ModelPricing[]>([]);
  const [inputTokens, setInputTokens] = useState('1000');
  const [outputTokens, setOutputTokens] = useState('500');
  const [requestsPerMonth, setRequestsPerMonth] = useState('10000');
  const [useCache, setUseCache] = useState(false);
  const [cacheHitRate, setCacheHitRate] = useState('70');
  const [useBatch, setUseBatch] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchPricing().then((d) => setModels(d.models));
    }, [])
  );

  const costInput: CostInput = useMemo(() => ({
    inputTokens: Math.max(0, parseInt(inputTokens) || 0),
    outputTokens: Math.max(0, parseInt(outputTokens) || 0),
    requestsPerMonth: Math.max(0, parseInt(requestsPerMonth) || 0),
    useCache,
    cacheHitRate: Math.min(1, Math.max(0, (parseInt(cacheHitRate) || 0) / 100)),
    useBatch,
  }), [inputTokens, outputTokens, requestsPerMonth, useCache, cacheHitRate, useBatch]);

  const results = useMemo(() => {
    const pricedModels = models.filter(
      (m) => m.input_per_mtok > 0 || m.output_per_mtok > 0
    );
    return pricedModels
      .map((m) => ({
        model: m,
        cost: calcMonthlyCost(m, costInput),
      }))
      .sort((a, b) => a.cost.monthlyCostUSD - b.cost.monthlyCostUSD);
  }, [models, costInput]);

  const totalMonthlyTokens =
    (parseInt(inputTokens) || 0) * (parseInt(requestsPerMonth) || 0) +
    (parseInt(outputTokens) || 0) * (parseInt(requestsPerMonth) || 0);

  const hasPricing = results.length > 0;
  const cheapest = results[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Text variant="heading" style={styles.title}>成本計算機</Text>
          <Text variant="body" color={Colors.textSecondary} style={styles.subtitle}>
            填入你的使用規模，我算出每月花費
          </Text>
        </View>

        {/* Input Section */}
        <Card elevated style={styles.section}>
          <Text variant="subheading" style={styles.sectionTitle}>使用量設定</Text>

          <InputRow
            label="每次請求 Input"
            hint="平均每次呼叫輸入的 token 數"
            value={inputTokens}
            onChangeText={setInputTokens}
            unit="tokens"
          />
          <View style={styles.divider} />
          <InputRow
            label="每次請求 Output"
            hint="平均每次呼叫輸出的 token 數"
            value={outputTokens}
            onChangeText={setOutputTokens}
            unit="tokens"
          />
          <View style={styles.divider} />
          <InputRow
            label="每月請求次數"
            hint="整個月的 API call 總量"
            value={requestsPerMonth}
            onChangeText={setRequestsPerMonth}
            unit="次"
          />

          {totalMonthlyTokens > 0 && (
            <View style={styles.summaryRow}>
              <Text variant="caption" color={Colors.textMuted}>每月總 token 量：</Text>
              <Text variant="mono" color={Colors.brand}>{formatTokens(totalMonthlyTokens)}</Text>
            </View>
          )}
        </Card>

        {/* Options Section */}
        <Card style={styles.section}>
          <Text variant="subheading" style={styles.sectionTitle}>進階選項</Text>

          <ToggleRow
            label="Prompt Caching"
            hint="適合 system prompt 重複率高的場景"
            value={useCache}
            onToggle={setUseCache}
          />
          {useCache && (
            <InputRow
              label="Cache 命中率"
              hint="預估有多少 % 的 input 會被 cache 命中"
              value={cacheHitRate}
              onChangeText={setCacheHitRate}
              unit="%"
            />
          )}
          <View style={styles.divider} />
          <ToggleRow
            label="Batch 模式"
            hint="非即時任務，Input 約五折（各家規則不同）"
            value={useBatch}
            onToggle={setUseBatch}
          />
        </Card>

        {/* Results */}
        <View style={styles.resultsHeader}>
          <Text variant="subheading">跨模型成本比較</Text>
          {!hasPricing && (
            <Text variant="caption" color={Colors.expensiveOrange} style={{ marginTop: Spacing.xs }}>
              價格資料尚未更新（欄位仍為 0）— 上線前請至各廠商官方頁面核對後填入 pricing.json
            </Text>
          )}
        </View>

        {hasPricing ? results.map(({ model, cost }, idx) => {
          const isCheapest = idx === 0;
          const totalSavings = (cost.savings?.cacheUSD ?? 0) + (cost.savings?.batchUSD ?? 0);

          return (
            <Card key={model.id} style={[styles.resultCard, isCheapest ? styles.cheapestCard : {}]}>
              {isCheapest && (
                <Badge variant="saving" label="✦ 最省選項" style={styles.cheapestBadge} />
              )}
              <View style={styles.resultHeader}>
                <View style={styles.resultTitleBlock}>
                  <ProviderChip provider={model.provider} />
                  <Text variant="bodyMedium" style={styles.resultModelName}>{model.name}</Text>
                </View>
                <View style={styles.resultCostBlock}>
                  <Text variant="mono" color={isCheapest ? Colors.savingGreen : Colors.text} style={styles.monthlyCost}>
                    {formatUSD(cost.monthlyCostUSD)}
                  </Text>
                  <Text variant="caption" color={Colors.textMuted}>/月</Text>
                </View>
              </View>

              <View style={styles.costBreakdown}>
                <CostRow label="Input 費用" value={formatUSD(cost.inputCostUSD)} />
                <CostRow label="Output 費用" value={formatUSD(cost.outputCostUSD)} />
                <CostRow label="年化估算" value={formatUSD(cost.yearlyCostUSD)} highlight />
              </View>

              {totalSavings > 0 && (
                <View style={styles.savingsRow}>
                  <Text variant="caption" color={Colors.savingGreen}>
                    ✦ 省下 {formatUSD(totalSavings)}/月（Cache + Batch 折扣後）
                  </Text>
                </View>
              )}
            </Card>
          );
        }) : (
          <Card style={styles.placeholderCard}>
            <Text variant="body" color={Colors.textSecondary} style={{ textAlign: 'center' }}>
              後端資料填入真實價格後，這裡會顯示各模型的月費比較表
            </Text>
          </Card>
        )}

        {/* Advisor note */}
        {cheapest && (
          <Card style={styles.advisorCard}>
            <Text variant="subheading" style={styles.advisorTitle}>✦ 顧問小結</Text>
            <Text variant="body" color={Colors.textSecondary} style={styles.advisorText}>
              以你這個規模（每月 {formatTokens(totalMonthlyTokens)} tokens），
              起步建議從 <Text variant="bodyBold">{cheapest.model.name}</Text> 開始。
              除非品質有明顯落差，先不需要用更貴的模型。
              等流量穩定後，再來評估混合路由的方案。
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CostRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.costRow}>
      <Text variant="caption" color={Colors.textSecondary}>{label}</Text>
      <Text variant="mono" color={highlight ? Colors.brand : Colors.text}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.xxxl, gap: Spacing.md },
  header: { gap: Spacing.xs, marginBottom: Spacing.xs },
  title: { fontSize: Typography.sizes.xxxl },
  subtitle: { fontFamily: Typography.headingFamily },
  section: { gap: Spacing.md },
  sectionTitle: { marginBottom: Spacing.xs },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  inputLabelBlock: { flex: 1, gap: 2 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    fontFamily: Typography.monoFamily,
    fontSize: Typography.sizes.md,
    color: Colors.text,
    width: 100,
    textAlign: 'right',
  },
  unit: { minWidth: 28 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  resultsHeader: { gap: Spacing.xs },
  resultCard: { gap: Spacing.sm },
  cheapestCard: { borderColor: Colors.savingGreen, borderWidth: 1.5 },
  cheapestBadge: { marginBottom: Spacing.xs },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resultTitleBlock: { gap: Spacing.xs },
  resultModelName: { marginTop: Spacing.xs },
  resultCostBlock: { alignItems: 'flex-end' },
  monthlyCost: { fontSize: Typography.sizes.xl },
  costBreakdown: {
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  costRow: { flexDirection: 'row', justifyContent: 'space-between' },
  savingsRow: {
    backgroundColor: Colors.savingGreenLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  placeholderCard: { alignItems: 'center', padding: Spacing.xl },
  advisorCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.brand,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  advisorTitle: { color: Colors.brandDark },
  advisorText: { lineHeight: Typography.sizes.md * Typography.lineHeights.relaxed },
});
