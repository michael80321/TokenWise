import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { Text } from './Text';

type BadgeVariant = 'brand' | 'saving' | 'expensive' | 'neutral' | 'check' | 'cross';

interface BadgeProps {
  variant?: BadgeVariant;
  label?: string;
  style?: ViewStyle;
}

const variantConfig: Record<BadgeVariant, { bg: string; text: string; prefix?: string }> = {
  brand: { bg: Colors.brandLight, text: Colors.brandDark },
  saving: { bg: Colors.savingGreenLight, text: Colors.savingGreen },
  expensive: { bg: Colors.expensiveOrangeLight, text: Colors.expensiveOrange },
  neutral: { bg: Colors.surfaceElevated, text: Colors.textSecondary },
  check: { bg: Colors.savingGreenLight, text: Colors.savingGreen, prefix: '✓' },
  cross: { bg: Colors.expensiveOrangeLight, text: Colors.expensiveOrange, prefix: '✕' },
};

export function Badge({ variant = 'neutral', label, style }: BadgeProps) {
  const config = variantConfig[variant];
  const displayLabel = config.prefix ? `${config.prefix} ${label ?? ''}`.trim() : label;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <Text
        variant="caption"
        color={config.text}
        style={styles.text}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

export function BoolBadge({ value }: { value: boolean }) {
  return <Badge variant={value ? 'check' : 'cross'} label={value ? '支援' : '不支援'} />;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: Typography.bodyMediumFamily,
  },
});
