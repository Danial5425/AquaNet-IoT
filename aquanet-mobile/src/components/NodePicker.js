import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';
import { wqiColor } from '../utils/formatters';

export default function NodePicker({ nodes, activeNodeId, onSelect }) {
  const nodeIds = Object.keys(nodes);
  if (nodeIds.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={styles.container}
    >
      {nodeIds.map((id) => {
        const node = nodes[id];
        const isActive = id === activeNodeId;
        const isOnline = node?.status === 'online';
        const wqiScore = node?.wqi?.score;
        const wqiLevel = node?.wqi?.level;
        const dotColor = isOnline ? colors.online : colors.offline;
        const scoreColor = wqiColor(wqiLevel);

        return (
          <TouchableOpacity
            key={id}
            style={[
              styles.tab,
              isActive && styles.tabActive,
              isActive && { borderColor: colors.primary },
            ]}
            onPress={() => onSelect(id)}
            activeOpacity={0.7}
          >
            {/* Online dot */}
            <View style={[styles.dot, { backgroundColor: dotColor }]} />

            <Text style={[styles.nodeId, isActive && styles.nodeIdActive]}>{id}</Text>

            {wqiScore != null && (
              <View style={[styles.wqiBadge, { backgroundColor: scoreColor + '20' }]}>
                <Text style={[styles.wqiText, { color: scoreColor }]}>
                  {Math.round(wqiScore)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,  // Reduced from 8
    gap: 8,
    flexDirection: 'row',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 10, // Reduced from 12
    paddingVertical: 4,    // Reduced from 8
  },
  tabActive: {
    backgroundColor: colors.primary + '15',
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
  },
  nodeId: {
    color: colors.textSub,
    fontSize: 13,
    fontWeight: '600',
  },
  nodeIdActive: {
    color: colors.primary,
  },
  wqiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 2,
  },
  wqiText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
