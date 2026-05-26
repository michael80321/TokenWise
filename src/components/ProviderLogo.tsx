import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../theme';
import { Text } from './Text';

const providerColors: Record<string, { bg: string; text: string }> = {
  Anthropic: { bg: '#F0E8D8', text: '#8B6040' },
  OpenAI: { bg: '#E8F0E8', text: '#2D6A2D' },
  Google: { bg: '#E8ECF8', text: '#3050A0' },
  DeepSeek: { bg: '#E8E8F8', text: '#4040A0' },
  'Meta (via API)': { bg: '#E8F4FC', text: '#1C6FA0' },
};

export function ProviderChip({ provider }: { provider: string }) {
  const colors = providerColors[provider] ?? { bg: Colors.surfaceElevated, text: Colors.textSecondary };
  const short = provider.split(' ')[0];
  return (
    <View style={[styles.chip, { backgroundColor: colors.bg }]}>
      <Text variant="caption" color={colors.text} style={styles.label}>
        {short}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
