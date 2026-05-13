import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AlertItem from '../components/AlertItem';
import { colors, radius } from '../theme';

export default function AlertsScreen({ alerts, dismissAlert }) {
  const criticalCount = alerts.filter((a) => a.level === 'critical').length;
  const warningCount  = alerts.filter((a) => a.level === 'warning').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <View style={styles.badgesRow}>
          {criticalCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.critical + '20', borderColor: colors.critical }]}>
              <Text style={[styles.badgeText, { color: colors.critical }]}>🔴 {criticalCount} Critical</Text>
            </View>
          )}
          {warningCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
              <Text style={[styles.badgeText, { color: colors.warning }]}>🟡 {warningCount} Warning</Text>
            </View>
          )}
          
        </View>
      </View>

      {alerts.length > 0 && (
        <View style={styles.toolbar}>
          <Text style={styles.count}>{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</Text>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => alerts.forEach((a) => dismissAlert?.(a.id))}
            activeOpacity={0.7}
          >
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>All Clear</Text>
          <Text style={styles.emptyDesc}>No alerts. Water quality is nominal.</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item, i) => String(item.id ?? i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <AlertItem alert={item} onDismiss={dismissAlert} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 8 },
  badgesRow: { flexDirection: 'row', gap: 8 },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  toolbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  count: { color: colors.textSub, fontSize: 13 },
  clearBtn: {
    backgroundColor: colors.bgCard, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  clearText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  list: { padding: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon:  { fontSize: 60, marginBottom: 16 },
  emptyTitle: { color: colors.text,    fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyDesc:  { color: colors.textSub, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
