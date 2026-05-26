import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevated?: boolean;
}

export function Card({ children, style, elevated = false }: CardProps) {
  return (
    <View style={[styles.card, elevated && styles.elevated, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  elevated: {
    ...Shadows.md,
  },
});
