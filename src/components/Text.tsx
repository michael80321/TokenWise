import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { Colors, Typography } from '../theme';

type TextVariant = 'heading' | 'subheading' | 'body' | 'bodyMedium' | 'bodyBold' | 'caption' | 'mono' | 'label';

interface TextProps {
  variant?: TextVariant;
  color?: string;
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
  numberOfLines?: number;
}

export function Text({ variant = 'body', color, style, children, numberOfLines }: TextProps) {
  return (
    <RNText
      style={[styles[variant], color ? { color } : undefined, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: Typography.headingFamily,
    fontSize: Typography.sizes.xxl,
    color: Colors.text,
    lineHeight: Typography.sizes.xxl * Typography.lineHeights.tight,
  },
  subheading: {
    fontFamily: Typography.headingFamily,
    fontSize: Typography.sizes.lg,
    color: Colors.text,
    lineHeight: Typography.sizes.lg * Typography.lineHeights.normal,
  },
  body: {
    fontFamily: Typography.bodyFamily,
    fontSize: Typography.sizes.md,
    color: Colors.text,
    lineHeight: Typography.sizes.md * Typography.lineHeights.normal,
  },
  bodyMedium: {
    fontFamily: Typography.bodyMediumFamily,
    fontSize: Typography.sizes.md,
    color: Colors.text,
    lineHeight: Typography.sizes.md * Typography.lineHeights.normal,
  },
  bodyBold: {
    fontFamily: Typography.bodyBoldFamily,
    fontSize: Typography.sizes.md,
    color: Colors.text,
    lineHeight: Typography.sizes.md * Typography.lineHeights.normal,
  },
  label: {
    fontFamily: Typography.bodyMediumFamily,
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
  },
  caption: {
    fontFamily: Typography.bodyFamily,
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    lineHeight: Typography.sizes.xs * Typography.lineHeights.relaxed,
  },
  mono: {
    fontFamily: Typography.monoFamily,
    fontSize: Typography.sizes.sm,
    color: Colors.text,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
  },
});
