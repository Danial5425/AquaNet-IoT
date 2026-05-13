import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { colors, radius, shadow } from '../theme';
import { wqiColor, wqiLabel } from '../utils/formatters';

const SIZE = 240;
const STROKE = 20;
const R = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CY = SIZE / 2 + 20;

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end   = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

// Arc spans -135° to +135° (270° total)
const START_ANGLE = -135;
const END_ANGLE   =  135;
const TOTAL_SWEEP = END_ANGLE - START_ANGLE;

export default function WQIGauge({ score, level }) {
  const animVal = useRef(new Animated.Value(0)).current;
  const displayScore = score != null ? Math.round(score * 10) / 10 : null;
  const fraction = score != null ? Math.min(1, Math.max(0, score / 100)) : 0;
  const fillAngle = START_ANGLE + TOTAL_SWEEP * fraction;

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: fraction,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [fraction]);

  const gaugeColor = wqiColor(level);
  const label = wqiLabel(level);

  // Track arc (background)
  const trackPath = arcPath(CX, CY, R, START_ANGLE, END_ANGLE);
  // Fill arc
  const fillPath = fraction > 0 ? arcPath(CX, CY, R, START_ANGLE, fillAngle) : null;

  // Needle tip
  const needleTip = polarToCartesian(CX, CY, R - STROKE / 2, fillAngle);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Water Quality Index</Text>

      <View style={styles.svgWrap}>
        <Svg width={SIZE} height={SIZE * 0.78}>
          <Defs>
            <LinearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%"   stopColor="#FF1744" />
              <Stop offset="40%"  stopColor="#FFB300" />
              <Stop offset="70%"  stopColor="#00D4FF" />
              <Stop offset="100%" stopColor="#00E676" />
            </LinearGradient>
          </Defs>

          {/* Track */}
          <Path
            d={trackPath}
            stroke="#1E2D50"
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
          />

          {/* Fill arc */}
          {fillPath && (
            <Path
              d={fillPath}
              stroke="url(#arcGrad)"
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Glowing dot at tip */}
          {fraction > 0 && (
            <>
              <Circle cx={needleTip.x} cy={needleTip.y} r={14} fill={gaugeColor} opacity={0.25} />
              <Circle cx={needleTip.x} cy={needleTip.y} r={8}  fill={gaugeColor} />
            </>
          )}

          {/* Center score */}
          <SvgText
            x={CX}
            y={CY - 4}
            textAnchor="middle"
            fontSize={46}
            fontWeight="bold"
            fill={gaugeColor}
          >
            {displayScore ?? '—'}
          </SvgText>
          <SvgText
            x={CX}
            y={CY + 20}
            textAnchor="middle"
            fontSize={13}
            fill="#8A9BC4"
          >
            out of 100
          </SvgText>

          {/* Min/Max labels */}
          <SvgText x={14}       y={CY + 36} fontSize={11} fill="#4A5A80">0</SvgText>
          <SvgText x={SIZE - 22} y={CY + 36} fontSize={11} fill="#4A5A80">100</SvgText>
        </Svg>
      </View>

      {/* Level badge */}
      <View style={[styles.badge, { backgroundColor: gaugeColor + '20', borderColor: gaugeColor + '50' }]}>
        <View style={[styles.dot, { backgroundColor: gaugeColor }]} />
        <Text style={[styles.badgeText, { color: gaugeColor }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    ...shadow.card,
  },
  title: {
    color: colors.textSub,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  svgWrap: {
    marginVertical: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
