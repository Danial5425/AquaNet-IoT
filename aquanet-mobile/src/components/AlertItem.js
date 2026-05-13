import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors, radius } from '../theme';
import { formatTimestamp } from '../utils/formatters';

const LEVEL_COLORS = {
  critical: colors.critical,
  warning:  colors.warning,
  info:     colors.primary,
};
const LEVEL_ICONS = {
  critical: '🔴',
  warning:  '🟡',
  info:     '🔵',
};

export default function AlertItem({ alert, onDismiss }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start();
  }, []);

  const accentColor = LEVEL_COLORS[alert.level] ?? colors.textSub;

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0, duration: 200, useNativeDriver: true,
    }).start(() => onDismiss?.(alert.id));
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, borderLeftColor: accentColor },
      ]}
    >
      <View style={styles.row}>
        <Text style={styles.levelIcon}>{LEVEL_ICONS[alert.level] ?? '⚪'}</Text>
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.level, { color: accentColor }]}>
              {(alert.level ?? 'info').toUpperCase()}
            </Text>
            <Text style={styles.nodeId}>• {alert.nodeId}</Text>
            <Text style={styles.time}>{formatTimestamp(alert.timestamp)}</Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>{alert.message}</Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} style={styles.dismiss}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  levelIcon: { fontSize: 18 },
  content:   { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  level: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  nodeId: {
    color: colors.textSub,
    fontSize: 10,
    fontWeight: '600',
  },
  time: {
    color: colors.textMuted,
    fontSize: 10,
    marginLeft: 'auto',
  },
  message: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  dismiss: {
    padding: 4,
  },
  dismissText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
