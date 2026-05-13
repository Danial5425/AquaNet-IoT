import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, TouchableOpacity, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, shadow } from '../theme';

const SERVER_KEY = 'aquanet_server_url';
const DEFAULT_URL = 'http://10.223.82.232:3001';

export default function SettingsScreen({ onServerChange, connected, nodes }) {
  const [serverUrl, setServerUrl] = useState(DEFAULT_URL);
  const [editing,   setEditing]   = useState(false);
  const [draft,     setDraft]     = useState('');

  useEffect(() => {
    AsyncStorage.getItem(SERVER_KEY).then((val) => {
      if (val) { setServerUrl(val); onServerChange?.(val); }
    });
  }, []);

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed.startsWith('http')) {
      Alert.alert('Invalid URL', 'URL must start with http:// or https://');
      return;
    }
    await AsyncStorage.setItem(SERVER_KEY, trimmed);
    setServerUrl(trimmed);
    onServerChange?.(trimmed);
    setEditing(false);
    Alert.alert('Saved', 'Reconnecting to new server…');
  };

  const nodeIds = Object.keys(nodes || {});

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Connection section */}
        <Text style={styles.sectionLabel}>Server Connection</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Status</Text>
            <View style={styles.rowRight}>
              <View style={[styles.statusDot, { backgroundColor: connected ? colors.online : colors.offline }]} />
              <Text style={[styles.rowValue, { color: connected ? colors.online : colors.offline }]}>
                {connected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
          <View style={styles.sep} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Nodes Online</Text>
            <Text style={styles.rowValue}>{nodeIds.filter((id) => nodes[id]?.status === 'online').length} / {nodeIds.length}</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.col}>
            <Text style={styles.rowLabel}>Server URL</Text>
            {editing ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.input}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={DEFAULT_URL}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <TouchableOpacity style={styles.saveBtn} onPress={save}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.urlRow}>
                <Text style={styles.urlText} numberOfLines={1}>{serverUrl}</Text>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => { setDraft(serverUrl); setEditing(true); }}
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Node list */}
        {nodeIds.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Detected Nodes</Text>
            <View style={styles.card}>
              {nodeIds.map((id, idx) => {
                const node = nodes[id];
                const isOnline = node?.status === 'online';
                return (
                  <View key={id}>
                    {idx > 0 && <View style={styles.sep} />}
                    <View style={styles.row}>
                      <View>
                        <Text style={styles.rowLabel}>{id}</Text>
                        {node?.ip && <Text style={styles.rowSub}>{node.ip}</Text>}
                      </View>
                      <View style={[styles.onlineBadge, { backgroundColor: (isOnline ? colors.online : colors.offline) + '20' }]}>
                        <Text style={[styles.onlineText, { color: isOnline ? colors.online : colors.offline }]}>
                          {isOnline ? 'Online' : 'Offline'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* About */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          {[
            ['App',      'AquaNet Mobile'],
            ['Version',  'v1.0.0'],
            ['Protocol', 'Socket.IO / WebSocket'],
            ['Hardware', 'ESP32 + ADS1115'],
            ['Built by', 'CSE @ ADBU — Sem 8'],
          ].map(([label, value], i, arr) => (
            <View key={label}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowValue}>{value}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.sep} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: colors.bg },
  content:  { padding: 16 },
  pageTitle: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 20 },
  sectionLabel: {
    color: colors.textMuted, fontSize: 11, fontWeight: '700',
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: 8, marginLeft: 4,
  },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 20, overflow: 'hidden', ...shadow.card,
  },
  sep: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
  },
  col:  { paddingHorizontal: 16, paddingVertical: 14 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowLabel: { color: colors.text,    fontSize: 14, fontWeight: '500' },
  rowSub:   { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  rowValue: { color: colors.textSub, fontSize: 14, fontWeight: '600' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  urlRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  urlText: { flex: 1, color: colors.primary, fontSize: 13, fontWeight: '500' },
  editBtn: {
    backgroundColor: colors.bgCardAlt, borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.border,
  },
  editBtnText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  editRow: { marginTop: 8, gap: 6 },
  input: {
    backgroundColor: colors.bgCardAlt, borderWidth: 1, borderColor: colors.borderLight,
    borderRadius: radius.sm, color: colors.text,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13,
  },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingVertical: 10, alignItems: 'center',
  },
  saveBtnText: { color: colors.bg, fontWeight: '700', fontSize: 14 },
  cancelBtn: { alignItems: 'center', paddingVertical: 6 },
  cancelBtnText: { color: colors.textMuted, fontSize: 13 },
  onlineBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  onlineText:  { fontSize: 12, fontWeight: '600' },
});
