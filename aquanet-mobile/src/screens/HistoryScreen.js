import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Dimensions, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import NodePicker from '../components/NodePicker';
import { colors, radius } from '../theme';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W  = SCREEN_W - 32;

const METRICS = [
  { key: 'wqi',       label: 'WQI',        color: '#00D4FF', unit: '' },
  { key: 'ph',        label: 'pH',         color: '#7C5CFC', unit: '' },
  { key: 'ec',        label: 'EC',         color: '#00E676', unit: ' mS/cm' },
  { key: 'gas',       label: 'Gas',        color: '#FFB300', unit: ' ppm' },
  { key: 'waterTemp', label: 'Water Temp', color: '#FF6D00', unit: '°C' },
  { key: 'humidity',  label: 'Humidity',   color: '#00BCD4', unit: '%' },
];

export default function HistoryScreen({ nodes, sensorHistory }) {
  const nodeIds      = Object.keys(nodes);
  const [activeNode, setActiveNode] = useState(null);
  const [activeMetric, setActiveMetric] = useState('wqi');

  const nodeId  = activeNode || nodeIds[0] || null;
  const history = nodeId ? (sensorHistory[nodeId] || []) : [];
  const metric  = METRICS.find((m) => m.key === activeMetric) || METRICS[0];

  // Build chart data
  const MAX_LABELS = 8;
  const step  = history.length > MAX_LABELS ? Math.ceil(history.length / MAX_LABELS) : 1;
  const labels = history.filter((_, i) => i % step === 0).map((p) => p.time);
  const data   = history.map((p) => parseFloat(p[activeMetric]) || 0);

  const hasData = data.length >= 2;

  const chartConfig = {
    backgroundGradientFrom: colors.bgCard,
    backgroundGradientTo:   colors.bgCard,
    decimalPlaces: 1,
    color: (opacity = 1) => `${metric.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
    labelColor: () => colors.textMuted,
    propsForDots: { r: '4', strokeWidth: '2', stroke: metric.color },
    propsForBackgroundLines: { stroke: colors.border, strokeDasharray: '4' },
    style: { borderRadius: radius.lg },
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sensor History</Text>
        <Text style={styles.headerSub}>{history.length} data points</Text>
      </View>

      <NodePicker nodes={nodes} activeNodeId={nodeId} onSelect={setActiveNode} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Metric selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricRow}>
          {METRICS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.metricBtn, activeMetric === m.key && { backgroundColor: m.color + '25', borderColor: m.color }]}
              onPress={() => setActiveMetric(m.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.metricDot, { backgroundColor: m.color }]} />
              <Text style={[styles.metricLabel, activeMetric === m.key && { color: m.color }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: metric.color }]}>{metric.label}</Text>
            {history.length > 0 && (
              <View style={styles.currentBadge}>
                <Text style={[styles.currentValue, { color: metric.color }]}>
                  {parseFloat(data[data.length - 1] ?? 0).toFixed(1)}{metric.unit}
                </Text>
                <Text style={styles.currentLabel}>current</Text>
              </View>
            )}
          </View>

          {hasData ? (
            <LineChart
              data={{ labels, datasets: [{ data, color: (o) => `${metric.color}${Math.round(o*255).toString(16).padStart(2,'0')}` }] }}
              width={CHART_W - 32}
              height={200}
              chartConfig={chartConfig}
              bezier
              withShadow={false}
              withVerticalLines={false}
              style={styles.chart}
            />
          ) : (
            <View style={styles.noData}>
              <Text style={styles.noDataIcon}>📉</Text>
              <Text style={styles.noDataText}>
                {nodeId ? 'Collecting data…' : 'No node selected'}
              </Text>
            </View>
          )}
        </View>

        {/* Stats summary */}
        {data.length > 1 && (
          <View style={styles.statsRow}>
            {[
              { label: 'Min',  value: Math.min(...data).toFixed(1) },
              { label: 'Max',  value: Math.max(...data).toFixed(1) },
              { label: 'Avg',  value: (data.reduce((a,b)=>a+b,0)/data.length).toFixed(1) },
              { label: 'Pts',  value: data.length },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={[styles.statValue, { color: metric.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { color: colors.text,    fontSize: 22, fontWeight: '700' },
  headerSub:   { color: colors.textSub, fontSize: 12, marginTop: 2 },

  scroll:  { flex: 1 },
  content: { padding: 16, gap: 0 },

  metricRow: { gap: 8, paddingBottom: 14 },
  metricBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: colors.bgCard,
  },
  metricDot:   { width: 8, height: 8, borderRadius: 4 },
  metricLabel: { color: colors.textSub, fontSize: 12, fontWeight: '600' },

  chartCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: 16, marginBottom: 12,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chartTitle:  { fontSize: 16, fontWeight: '700' },
  currentBadge: { alignItems: 'flex-end' },
  currentValue: { fontSize: 20, fontWeight: '700' },
  currentLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '500' },
  chart: { borderRadius: radius.lg },

  noData: { height: 180, justifyContent: 'center', alignItems: 'center', gap: 8 },
  noDataIcon: { fontSize: 36 },
  noDataText: { color: colors.textSub, fontSize: 14 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statCard: {
    flex: 1, backgroundColor: colors.bgCard,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: 12, alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 2 },
});
