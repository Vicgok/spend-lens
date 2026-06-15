import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  _ScrollView,
  Pressable,
  Alert,
  Clipboard,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/theme-provider';
import { typography} from '@/theme';
import { getLogs, clearLogs, LogEntry } from '@/lib/database';
import Svg, { Path } from 'react-native-svg';

export default function DeveloperToolsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const dbLogs = await getLogs(150);
      setLogs(dbLogs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to delete all system logs? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearLogs();
              setLogs([]);
              Alert.alert('Logs Cleared', 'All system logs have been deleted.');
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]
    );
  };

  const handleExportLogs = () => {
    if (logs.length === 0) {
      Alert.alert('No Logs', 'There are no logs to export.');
      return;
    }
    const logString = logs
      .map((l) => `[${l.timestamp}] [${l.event}] ${l.message || ''} ${l.details || ''}`)
      .join('\n');
    Clipboard.setString(logString);
    Alert.alert('Exported', 'All logs have been copied to your clipboard!');
  };

  const getEventColor = (event: string) => {
    switch (event) {
      case 'SMS_RECEIVED':
        return '#0052CC'; // Blue
      case 'SMS_PARSED':
        return '#00875A'; // Green
      case 'SMS_FAILED':
        return '#DE350B'; // Red
      case 'ACCOUNT_MATCHED':
        return '#00875A';
      case 'ACCOUNT_NOT_FOUND':
        return '#FFAB00'; // Amber/Orange
      case 'TXN_CREATED':
        return '#00875A';
      case 'TXN_SKIPPED_DUPLICATE':
        return '#7A869A'; // Gray
      case 'NOTIFICATION_CREATED':
        return '#6554C0'; // Purple
      case 'ONBOARDING_STARTED':
        return '#0052CC';
      case 'ONBOARDING_FAILED':
        return '#DE350B';
      default:
        return theme.textSecondary;
    }
  };

  const renderLogItem = ({ item }: { item: LogEntry }) => {
    const eventColor = getEventColor(item.event);
    const date = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    return (
      <View style={[styles.logItem, { borderBottomColor: theme.borderLight }]}>
        <View style={styles.logHeader}>
          <Text style={[styles.logEvent, { color: eventColor, fontFamily: typography.fontFamily.bold }]}>
            {item.event}
          </Text>
          <Text style={[styles.logTime, { color: theme.textSecondary }]}>
            {date}
          </Text>
        </View>
        {item.message && (
          <Text style={[styles.logMsg, { color: theme.text }]}>{item.message}</Text>
        )}
        {item.details && (
          <Text style={[styles.logDetails, { color: theme.textMuted, backgroundColor: theme.surface }]}>
            {item.details}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 12H5" />
              <Path d="M12 19l-7-7 7-7" />
            </Svg>
          </Pressable>
          <View>
            <Text style={[styles.microHeader, { color: theme.textSecondary }]}>DIAGNOSTICS & SYSTEM</Text>
            <Text style={[styles.title, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>Developer Tools</Text>
          </View>
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <Pressable
          onPress={fetchLogs}
          style={({ pressed }) => [
            styles.actionBtn,
            { borderColor: theme.border, backgroundColor: pressed ? theme.borderLight : theme.card }
          ]}
        >
          <Text style={[styles.actionBtnText, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
            🔄 Refresh
          </Text>
        </Pressable>
        <Pressable
          onPress={handleExportLogs}
          style={({ pressed }) => [
            styles.actionBtn,
            { borderColor: theme.border, backgroundColor: pressed ? theme.borderLight : theme.card }
          ]}
        >
          <Text style={[styles.actionBtnText, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
            📋 Copy Logs
          </Text>
        </Pressable>
        <Pressable
          onPress={handleClearLogs}
          style={({ pressed }) => [
            styles.actionBtn,
            { borderColor: theme.border, backgroundColor: pressed ? theme.borderLight : theme.card }
          ]}
        >
          <Text style={[styles.actionBtnText, { color: theme.expense, fontFamily: typography.fontFamily.bold }]}>
            🗑️ Clear
          </Text>
        </Pressable>
      </View>

      {/* Log List */}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📜</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No system events logged yet.</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderLogItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microHeader: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 2,
  },
  title: { fontSize: 26, letterSpacing: -0.5 },

  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 14,
  },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyEmoji: { fontSize: 44 },
  emptyText: { fontSize: 14 },

  listContent: { paddingHorizontal: 16 },
  logItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logEvent: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  logTime: {
    fontSize: 13,
  },
  logMsg: {
    fontSize: 15,
    lineHeight: 18,
  },
  logDetails: {
    marginTop: 6,
    padding: 6,
    fontSize: 13,
    fontFamily: typography.fontFamily.mono,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
