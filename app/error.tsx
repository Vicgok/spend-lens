import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { writeLog } from '@/lib/database';

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  useEffect(() => {
    // Log the error globally
    console.error('[GLOBAL_ERROR]', error);
    writeLog('GLOBAL_ERROR', error?.message || String(error), {
      stack: error?.stack,
    }).catch((e) => console.warn('Failed to write global error to SQLite logs:', e));
  }, [error]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>⚠️</Text>
        <Text style={styles.title}>System Interrupted</Text>
        <Text style={styles.subtitle}>
          SpendLens encountered an unexpected error. The details have been saved to the logs.
        </Text>
        
        <ScrollView style={styles.errorContainer} contentContainerStyle={styles.errorContent}>
          <Text style={styles.errorTitle}>Error Trace</Text>
          <Text style={styles.errorText}>{error?.message || String(error)}</Text>
          {error?.stack && (
            <Text style={styles.stackText}>{error.stack}</Text>
          )}
        </ScrollView>

        <Pressable onPress={retry} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>Restart Session</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 8,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 16,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FDFCF8',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  errorContainer: {
    maxHeight: 180,
    width: '100%',
    backgroundColor: '#070707',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 4,
    padding: 12,
  },
  errorContent: {
    gap: 4,
  },
  errorTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#EA6060',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#EA6060',
    fontFamily: 'monospace',
  },
  stackText: {
    fontSize: 11,
    color: '#8B949E',
    fontFamily: 'monospace',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#A0C42C',
    borderRadius: 4,
    height: 48,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1B1B1B',
  },
});
