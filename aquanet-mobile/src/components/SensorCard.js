import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, radius, shadow } from '../theme';
import { SENSOR_META, sensorStatus, wqiColor } from '../utils/formatters';

export default function SensorCard({ type, value }) {
  const meta   = SENSOR_META[type] || {};
  const status = sensorStatus(type, value);
  const accentColor = status === 'good' ? colors.good
                    : status === 'warning' ? colors.warning
                    : status === 'critical' ? colors.critical
                    : colors.textMuted;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (status === 'critical') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [status]);

  const displayValue = value != null
    ? (Number.isInteger(value) ? value : parseFloat(value).toFixed(2))
    : '—';

  // Progress bar fraction
  const fraction = value != null && meta.max
    ? Math.min(1, Math.max(0, value / meta.max))
    : 0;

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: pulseAnim }] }]}>
      {/* Glow strip */}
      <View style={[styles.glowStrip, { backgroundColor: accentColor }]} />

      <View style={styles.header}>
        <Text style={styles.icon}>{meta.icon}</Text>
        <View style={styles.statusDot_wrap}>
          <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
        </View>
      </View>

      <Text style={[styles.value, { color: accentColor }]}>
        {displayValue}
        <Text style={styles.unit}> {meta.unit}</Text>
      </Text>

      <Text style={styles.label}>{meta.label}</Text>

      {/* Mini progress bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${fraction * 100}%`, backgroundColor: accentColor }]} />
      </View>

      <Text style={styles.ideal}>Ideal: {meta.ideal}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    overflow: 'hidden',
    ...shadow.card,
  },
  glowStrip: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 3,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 2,
  },
  icon: { fontSize: 22 },
  statusDot_wrap: {
    width: 10, height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 10, height: 10, borderRadius: 5,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSub,
  },
  label: {
    color: colors.textSub,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  barTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  ideal: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
});
