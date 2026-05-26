import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { Text } from './Text';
import { SortKey } from '../data/types';

interface SortPickerProps {
  value: SortKey;
  onChange: (key: SortKey) => void;
}

const options: { key: SortKey; label: string }[] = [
  { key: 'quality', label: '品質' },
  { key: 'cp_value', label: 'CP 值' },
  { key: 'price', label: '價格' },
];

export function SortPicker({ value, onChange }: SortPickerProps) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.7}
          >
            <Text
              variant="label"
              color={active ? Colors.brandDark : Colors.textSecondary}
              style={active ? styles.labelActive : undefined}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillActive: {
    backgroundColor: Colors.brandLight,
    borderColor: Colors.brand,
  },
  labelActive: {
    fontFamily: Typography.bodyMediumFamily,
  },
});
