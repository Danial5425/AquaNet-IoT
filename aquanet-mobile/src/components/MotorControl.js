import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors, radius, shadow } from '../theme';

const ACTIONS = [
  { key: 'ON',   label: 'ON',   icon: '▶',  color: colors.good },
  { key: 'AUTO', label: 'AUTO', icon: '⟳',  color: colors.primary },
  { key: 'OFF',  label: 'OFF',  icon: '■',  color: colors.critical },
];

export default function MotorControl({ motorStatus, motorMode, onCommand }) {
  const isRunning = motorStatus === 'ON';
  const spinAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
        ])
      ).start();
    } else {
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
    }
  }, [isRunning]);

  const glowColor = glowAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['#00E67610', '#00E67640'],
  });

  const statusColor  = isRunning ? colors.good : colors.critical;
  const statusLabel  = motorStatus ?? '—';
  const modeLabel    = motorMode   ?? '—';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Motor Control</Text>
        <Text style={styles.icon}>⚙️</Text>
      </View>

      {/* Status orb */}
      <Animated.View style={[styles.orbWrap, { backgroundColor: glowColor }]}>
        <View style={[styles.orb, { backgroundColor: statusColor }]}>
          <Text style={styles.orbIcon}>{isRunning ? '💧' : '💤'}</Text>
        </View>
      </Animated.View>

      <View style={styles.statusRow}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={[styles.statusValue, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Mode</Text>
          <Text style={[styles.statusValue, { color: colors.primary }]}>{modeLabel}</Text>
        </View>
      </View>

      {/* Control buttons */}
      <View style={styles.btnRow}>
        {ACTIONS.map((action) => {
          const isActive =
            (action.key === 'ON'   && motorStatus === 'ON'   && motorMode !== 'AUTO') ||
            (action.key === 'OFF'  && motorStatus === 'OFF'  && motorMode !== 'AUTO') ||
            (action.key === 'AUTO' && motorMode   === 'AUTO');
          return (
            <TouchableOpacity
              key={action.key}
              style={[
                styles.btn,
                { borderColor: action.color },
                isActive && { backgroundColor: action.color + '30' },
              ]}
              onPress={() => onCommand?.(action.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnIcon, { color: action.color }]}>{action.icon}</Text>
              <Text style={[styles.btnLabel, { color: isActive ? action.color : colors.textSub }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  title: {
    color: colors.textSub,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  icon: { fontSize: 18 },
  orbWrap: {
    width: 90, height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  orb: {
    width: 68, height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbIcon: { fontSize: 28 },
  statusRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
  },
  statusItem: { alignItems: 'center' },
  statusLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '500', marginBottom: 4 },
  statusValue: { fontSize: 16, fontWeight: '700' },
  divider: { width: 1, backgroundColor: colors.border },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  btn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  btnIcon:  { fontSize: 16, fontWeight: '700' },
  btnLabel: { fontSize: 12, fontWeight: '600' },
});
