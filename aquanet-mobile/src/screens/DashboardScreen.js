import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import WQIGauge    from '../components/WQIGauge';
import MotorControl from '../components/MotorControl';
import NodePicker  from '../components/NodePicker';
import SensorCard  from '../components/SensorCard';
import { colors, radius } from '../theme';
import { formatUptime } from '../utils/formatters';

export default function DashboardScreen({ nodes, connected, sensorHistory, sendMotorCommand }) {
  const [selectedNode, setSelectedNode]   = useState(null);
  const [refreshing,   setRefreshing]     = useState(false);

  const nodeIds      = Object.keys(nodes);
  const activeNodeId = selectedNode || nodeIds[0] || null;
  const activeNode   = activeNodeId ? nodes[activeNodeId] : null;
  const activeData   = activeNode?.lastData || {};
  const activeWQI    = activeNode?.wqi      || {};

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <LinearGradient
        colors={['#0D1426', colors.bg]}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>💧</Text>
          <View>
            <Text style={styles.appName}>AquaNet</Text>
            <Text style={styles.appSub}>Water Quality Monitor</Text>
          </View>
        </View>
        <View style={[styles.connBadge, { borderColor: connected ? colors.online : colors.offline }]}>
          <View style={[styles.connDot, { backgroundColor: connected ? colors.online : colors.offline }]} />
          <Text style={[styles.connText, { color: connected ? colors.online : colors.offline }]}>
            {connected ? 'Live' : 'Offline'}
          </Text>
        </View>
      </LinearGradient>

      {/* Node tabs */}
      <NodePicker
        nodes={nodes}
        activeNodeId={activeNodeId}
        onSelect={setSelectedNode}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Empty state */}
        {nodeIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📡</Text>
            <Text style={styles.emptyTitle}>
              {connected ? 'Waiting for Nodes' : 'Connecting…'}
            </Text>
            <Text style={styles.emptyDesc}>
              {connected
                ? 'Power on your ESP32 slave nodes to begin monitoring.'
                : 'Trying to reach AquaNet master server…'}
            </Text>
          </View>
        )}

        {/* Active node dashboard */}
        {activeNode && (
          <>
            {/* Node info bar */}
            <View style={styles.infoBar}>
              {activeNode.ip    && <InfoChip label="IP"     value={activeNode.ip} />}
              {activeNode.rssi  != null && <InfoChip label="WiFi"  value={`${activeNode.rssi} dBm`} />}
              {activeNode.uptime != null && <InfoChip label="Up"    value={formatUptime(activeNode.uptime)} />}
              <InfoChip
                label="Status"
                value={activeNode.status === 'online' ? '● Online' : '● Offline'}
                valueColor={activeNode.status === 'online' ? colors.online : colors.offline}
              />
            </View>

            {/* WQI Gauge */}
            <WQIGauge score={activeWQI.score} level={activeWQI.level} />

            <View style={styles.spacer} />

            {/* Motor Control */}
            <MotorControl
              motorStatus={activeNode.motorStatus}
              motorMode={activeNode.motorMode}
              onCommand={(action) => sendMotorCommand(activeNodeId, action)}
            />

            <View style={styles.spacer} />

            {/* Section heading */}
            <Text style={styles.sectionTitle}>Sensor Readings</Text>

            {/* 2-col grid of sensor cards */}
            <View style={styles.grid}>
              {['ph', 'ec', 'gas', 'waterTemp', 'airTemp', 'humidity'].map((key) => (
                <View key={key} style={styles.gridItem}>
                  <SensorCard type={key} value={activeData[key]} />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoChip({ label, value, valueColor }) {
  return (
    <View style={chipStyles.chip}>
      <Text style={chipStyles.label}>{label}</Text>
      <Text style={[chipStyles.value, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.textMuted, fontSize: 9, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  value: { color: colors.text, fontSize: 12, fontWeight: '600', marginTop: 2 },
});

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  header:  {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo:       { fontSize: 28 },
  appName:    { color: colors.text,    fontSize: 20, fontWeight: '700' },
  appSub:     { color: colors.textSub, fontSize: 11, fontWeight: '500' },
  connBadge:  {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  connDot:  { width: 7, height: 7, borderRadius: 4 },
  connText: { fontSize: 12, fontWeight: '600' },

  scroll:  { flex: 1 },
  content: { padding: 16, gap: 0 },

  infoBar: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 6, marginBottom: 14,
  },

  spacer:       { height: 14 },
  sectionTitle: {
    color: colors.textSub, fontSize: 12, fontWeight: '700',
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: 10, marginTop: 4,
  },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '47.5%' },

  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon:  { fontSize: 56, marginBottom: 16 },
  emptyTitle: { color: colors.text,    fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyDesc:  { color: colors.textSub, fontSize: 14, textAlign: 'center', paddingHorizontal: 32, lineHeight: 22 },
});
