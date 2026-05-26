import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Colors, Spacing, Typography, Radius } from '../theme';
import { Text } from './Text';
import { useSubscription } from '../context/SubscriptionContext';

interface ShareCardProps {
  title: string;
  subtitle?: string;
  body: string;
  stat?: { label: string; value: string };
  children?: React.ReactNode;
}

function BrandCard({
  title,
  subtitle,
  body,
  stat,
  isPro,
}: ShareCardProps & { isPro: boolean }) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>✦ TokenWise</Text>
        <Text style={styles.tagline}>AI 選型顧問</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {stat ? (
          <View style={styles.statRow}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ) : null}
        <View style={styles.bodyBox}>
          <Text style={styles.body}>「{body}」</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>tokenwise.app</Text>
        {!isPro && (
          <View style={styles.watermark}>
            <Text style={styles.watermarkText}>免費版</Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface ShareButtonProps extends ShareCardProps {
  label?: string;
}

export function ShareButton({ label = '分享結果', ...cardProps }: ShareButtonProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);
  const { isPro } = useSubscription();

  const handleShare = useCallback(async () => {
    if (!ref.current) return;
    try {
      const uri = await captureRef(ref, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('此裝置不支援分享功能');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'TokenWise 選型結果',
      });
    } catch {
      Alert.alert('分享失敗', '截圖時發生問題，請再試一次');
    }
  }, []);

  return (
    <>
      {/* Off-screen render target */}
      <ViewShot ref={ref} options={{ format: 'png', quality: 1 }}>
        <BrandCard {...cardProps} isPro={isPro} />
      </ViewShot>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
        <Text style={styles.shareBtnText}>{label}</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 360,
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  header: {
    backgroundColor: Colors.brand,
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
  logo: {
    fontFamily: Typography.headingFamily,
    fontSize: Typography.sizes.xl,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: Typography.bodyFamily,
    fontSize: Typography.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  divider: {
    height: 3,
    backgroundColor: Colors.brandDark,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  title: {
    fontFamily: Typography.headingFamily,
    fontSize: Typography.sizes.xl,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Typography.bodyFamily,
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  statRow: {
    alignItems: 'flex-start',
    gap: 2,
  },
  statValue: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: Typography.sizes.xxxl,
    color: Colors.brand,
  },
  statLabel: {
    fontFamily: Typography.bodyFamily,
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  bodyBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.brand,
  },
  body: {
    fontFamily: Typography.headingFamily,
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.sm * 1.8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  footerText: {
    fontFamily: Typography.monoFamily,
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  watermark: {
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  watermarkText: {
    fontFamily: Typography.bodyFamily,
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareBtnText: {
    fontFamily: Typography.bodyMediumFamily,
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
});
