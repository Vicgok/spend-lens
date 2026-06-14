import React, { useEffect, useState, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert, LayoutAnimation } from 'react-native';
import { simulateSMSScan } from '@/features/sms-parser/sms-reader';
import Svg, { Circle, Path } from 'react-native-svg';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/theme-provider';
import { TabHeader } from '@/components/ui';
import { typography, spacing, borderRadius } from '@/theme';
import { useTransactionStore } from '@/stores/transaction-store';
import { generateAllInsights, InsightCardData } from '@/features/insights-engine/detector';
import { calculateSalarySurvivalScore, calculatePredictedMonthEndBalance } from '@/features/insights-engine/formulas';

const SCAN_STEPS = [
  { message: 'INITIALIZING SMS OBSERVATORY SERVICE...', progress: 0.1 },
  { message: 'SCANNING DEVICE INBOX FOR FINANCIAL SMS METADATA...', progress: 0.3 },
  { message: 'IDENTIFYING SENDER CHANNELS (SBIINB, HDFCBK, AXISBK)...', progress: 0.5 },
  { message: 'EXTRACTING TRANSACTION AMOUNTS, MERCHANTS, AND HASHES...', progress: 0.7 },
  { message: 'RUNNING BEHAVIORAL DETECTORS (IMPULSE, LEAKS, SUBSCRIPTIONS)...', progress: 0.9 },
  { message: 'INVESTIGATION COMPLETE. UPDATING BOARD IN REAL-TIME.', progress: 1.0 },
];

export default function InsightsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleExpandCard = (id: string) => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (e) {
      console.warn('LayoutAnimation not supported:', e);
    }
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useTransactionStore((s) => s.categories);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const loadCategories = useTransactionStore((s) => s.loadCategories);
  const getTotalBalance = useTransactionStore((s) => s.getTotalBalance);

  const runSmsSimulation = async () => {
    setIsScanning(true);
    setScanStep(0);
    
    // Step-by-step progress simulation
    setTimeout(() => setScanStep(1), 800);
    setTimeout(() => setScanStep(2), 1600);
    setTimeout(async () => {
      setScanStep(3);
      try {
        await simulateSMSScan();
        // Reload transactions to trigger actual insights computation
        await loadTransactions();
        await loadCategories();
      } catch (err) {
        console.error('Scan error:', err);
      }
    }, 2400);
    setTimeout(() => setScanStep(4), 3200);
    setTimeout(() => setScanStep(5), 4000);
    setTimeout(() => {
      setIsScanning(false);
      Alert.alert('Analysis Complete', 'Observations and leak patterns populated on your board.');
    }, 4800);
  };

  useEffect(() => {
    loadTransactions();
    loadCategories();
  }, []);

  const currentBalance = getTotalBalance();
  const survivalScore = calculateSalarySurvivalScore(transactions);
  const projection = calculatePredictedMonthEndBalance(transactions, currentBalance);
  
  const detectedInsights = useMemo(() => {
    return generateAllInsights(transactions, categories, currentBalance);
  }, [transactions, categories, currentBalance]);

  // Fallback default insights if list is empty
  const defaultInsights: InsightCardData[] = [
    {
      id: 'default-tip',
      type: 'money_leak',
      title: 'Financial Observatory Active',
      subtitle: 'Tracking account activities',
      metric: 'Safe',
      whatHappened: 'SpendLens is scanning your SMS records and local entries for anomalies.',
      why: 'On-device parsing automatically catalogs transactions to detect anomalies like price creep or hidden subscriptions.',
      whatToDo: 'Add your accounts and transaction history to unlock full financial investigation cards.',
      priority: 'low',
    }
  ];

  const insights = detectedInsights.length > 0 ? detectedInsights : defaultInsights;

  // Survival score description
  const getSurvivalLabel = (score: number) => {
    if (score >= 80) return { label: 'Excellent Cushion', color: theme.income };
    if (score >= 50) return { label: 'Moderate Buffer', color: theme.warning };
    return { label: 'High Expenditure Risk', color: theme.expense };
  };

  const scoreMeta = getSurvivalLabel(survivalScore);

  const chartData = [
    { name: 'Impulse Spends', amount: 0, color: theme.expense, key: 'impulse_spending' },
    { name: 'Weekend Overspend', amount: 0, color: theme.warning || '#C28A24', key: 'weekend_overspend' },
    { name: 'Subscriptions', amount: 0, color: theme.info || '#1976D2', key: 'subscription' },
    { name: 'Money Leaks', amount: 0, color: theme.primary, key: 'money_leak' },
  ];

  // Populate from detected insights
  detectedInsights.forEach((insight) => {
    if (insight.type === 'impulse_spending') {
      chartData[0].amount += insight.impactAmount || 0;
    } else if (insight.type === 'weekend_overspend') {
      chartData[1].amount += insight.impactAmount || 0;
    } else if (insight.type === 'subscription') {
      chartData[2].amount += insight.impactAmount || 0;
    } else if (insight.type === 'money_leak') {
      chartData[3].amount += insight.impactAmount || 0;
    }
  });

  const totalAmount = chartData.reduce((sum, item) => sum + item.amount, 0);
  const hasData = totalAmount > 0;

  let cumulativeAngle = -90;
  const renderedSlices = chartData.map((item) => {
    const percentage = totalAmount > 0 ? item.amount / totalAmount : 0.25;
    const angle = cumulativeAngle;
    cumulativeAngle += percentage * 360;
    
    // Circumference = 2 * Math.PI * 36 = 226.19
    const strokeDashoffset = 226.19 * (1 - percentage);
    return {
      ...item,
      percentage,
      angle,
      strokeDashoffset,
    };
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + 16, paddingBottom: 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <TabHeader
        microHeader="SPENDING OBSERVATORY"
        title="Investigation Board"
        variant="dynamic"
        showDivider
        renderRight={() => (
          <Pressable
            onPress={runSmsSimulation}
            disabled={isScanning}
            style={({ pressed }) => [
              styles.headerScanBtn,
              {
                borderColor: theme.border,
                backgroundColor: pressed ? theme.borderLight : theme.card,
                opacity: isScanning ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[styles.headerScanText, { color: theme.primary, fontFamily: typography.fontFamily.bold }]}>
              {isScanning ? 'SCANNING...' : 'TRY DEMO'}
            </Text>
          </Pressable>
        )}
      />

      {/* Spending Anomaly Distribution Chart */}
      <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.chartTitle, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
          INVESTIGATED ANOMALY FLUX
        </Text>
        <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>
          Distribution of detected potential leaks
        </Text>
        
        <View style={styles.chartRow}>
          <View style={styles.chartContainerRelative}>
            <Svg width="130" height="130" viewBox="0 0 100 100">
              {!hasData ? (
                <Circle
                  cx="50"
                  cy="50"
                  r="36"
                  stroke={theme.borderLight}
                  strokeWidth="10"
                  fill="none"
                />
              ) : (
                renderedSlices.map((slice, idx) => {
                  if (slice.percentage === 0) return null;
                  return (
                    <Circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="36"
                      stroke={slice.color}
                      strokeWidth="9"
                      strokeDasharray="226.19"
                      strokeDashoffset={slice.strokeDashoffset}
                      fill="none"
                      transform={`rotate(${slice.angle} 50 50)`}
                    />
                  );
                })
              )}
            </Svg>
            <View style={styles.chartCenter}>
              <Text style={[styles.chartCenterNumber, { color: theme.text, fontFamily: typography.fontFamily.monoBold }]} numberOfLines={1}>
                {hasData ? `₹${Math.round(totalAmount)}` : '0'}
              </Text>
              <Text style={[styles.chartCenterLabel, { color: theme.textSecondary }]}>
                ANOMALIES
              </Text>
            </View>
          </View>
          
          <View style={styles.legendContainer}>
            {renderedSlices.map((slice, idx) => (
              <View key={idx} style={styles.legendRow}>
                <View style={[styles.legendIndicator, { backgroundColor: slice.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.legendName, { color: theme.text, fontFamily: typography.fontFamily.medium }]} numberOfLines={1}>
                    {slice.name}
                  </Text>
                </View>
                <Text style={[styles.legendValue, { color: theme.textSecondary, fontFamily: typography.fontFamily.mono }]}>
                  {hasData ? `₹${Math.round(slice.amount)}` : '0%'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Board Summary (Swiss Grid) */}
      <View style={[styles.summaryGrid, { borderColor: theme.border }]}>
        <View style={[styles.summaryItem, { borderRightWidth: 1, borderColor: theme.border }]}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>CASH CUSHION</Text>
          <Text style={[styles.summaryValue, { color: scoreMeta.color, fontFamily: typography.fontFamily.bold }]}>
            {survivalScore}%
          </Text>
          <Text style={[styles.summarySub, { color: theme.textSecondary }]}>{scoreMeta.label}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>PROJECTED BAL.</Text>
          <Text style={[styles.summaryValue, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
            ₹{projection.predictedBalance}
          </Text>
          <Text style={[styles.summarySub, { color: theme.textSecondary }]}>End of Month</Text>
        </View>
      </View>

      {isScanning ? (
        <View style={[styles.scannerContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.scannerHeader, { color: theme.primary, fontFamily: typography.fontFamily.bold }]}>
            SCANNING DEVICE TELEMETRY...
          </Text>
          <View style={styles.scannerConsole}>
            {SCAN_STEPS.slice(0, scanStep + 1).map((step, idx) => (
              <Text
                key={idx}
                style={[
                  styles.consoleLine,
                  {
                    color: idx === scanStep ? theme.primary : theme.textSecondary,
                    fontFamily: typography.fontFamily.mono,
                  },
                ]}
              >
                {idx < scanStep ? '✓ ' : '▶ '}
                {step.message}
              </Text>
            ))}
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: theme.borderLight }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: theme.primary,
                  width: `${SCAN_STEPS[scanStep].progress * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressPct, { color: theme.textSecondary, fontFamily: typography.fontFamily.mono }]}>
            STATUS: {Math.round(SCAN_STEPS[scanStep].progress * 100)}% COMPLETE
          </Text>
        </View>
      ) : (
        <>
          {detectedInsights.length === 0 && (
            <Pressable
              onPress={runSmsSimulation}
              style={[styles.emptyScanCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Text style={styles.emptyScanEmoji}>🔍</Text>
              <Text style={[styles.emptyScanTitle, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
                Activate Spending Observatory
              </Text>
              <Text style={[styles.emptyScanSub, { color: theme.textSecondary }]}>
                No transaction telemetry found. Tap to simulate a device inbox scan of mock bank SMS alerts.
              </Text>
              <View style={[styles.emptyScanBtn, { backgroundColor: theme.primary }]}>
                <Text style={[styles.emptyScanBtnText, { color: theme.textInverse, fontFamily: typography.fontFamily.bold }]}>
                  RUN SIMULATED SMS SCAN
                </Text>
              </View>
            </Pressable>
          )}

          {/* Dashboard Pathway */}
          <View style={styles.feedContainer}>
            {/* Dashed vertical path running down the feed */}
            <View style={[styles.dashedLine, { borderColor: theme.border }]} />

            {insights.map((insight, index) => {
              const isHighPriority = insight.priority === 'high';

              return (
                <View key={insight.id} style={styles.cardWrapper}>
                  {/* Connector dot */}
                  <View
                    style={[
                      styles.connectorDot,
                      {
                        backgroundColor: isHighPriority ? theme.expense : theme.primary,
                        borderColor: theme.border,
                      },
                    ]}
                  />

                  {/* Swiss Paper Card */}
                  <Pressable
                    onPress={() => toggleExpandCard(insight.id)}
                    style={({ pressed }) => [
                      styles.card,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        opacity: pressed ? 0.9 : 1,
                        transform: [{ scale: pressed ? 0.995 : 1 }]
                      },
                    ]}
                  >
                    {/* Accent Tag */}
                    <View style={styles.cardHeader}>
                      <View
                        style={[
                          styles.priorityBadge,
                          {
                            backgroundColor: isHighPriority
                              ? theme.expense + '20'
                              : theme.primary + '30',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.priorityText,
                            { color: isHighPriority ? theme.expense : theme.text, fontFamily: typography.fontFamily.bold },
                          ]}
                        >
                          {insight.type.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {insight.metric && (
                          <Text style={[styles.metricText, { color: theme.text, fontFamily: typography.fontFamily.monoBold }]}>
                            {insight.metric}
                          </Text>
                        )}
                        <View style={{ transform: [{ rotate: expandedCards[insight.id] ? '180deg' : '0deg' }] }}>
                          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth="2">
                            <Path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                          </Svg>
                        </View>
                      </View>
                    </View>

                    {/* Core Message */}
                    <Text style={[styles.cardTitle, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
                      {insight.title}
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                      {insight.subtitle}
                    </Text>

                    {expandedCards[insight.id] && (
                      <>
                        <View style={[styles.thinDivider, { backgroundColor: theme.borderLight }]} />

                        {/* Q&A Structure */}
                        <View style={styles.qaSection}>
                          <View style={styles.qaItem}>
                            <Text style={[styles.qaLabel, { color: theme.textSecondary }]}>WHAT HAPPENED</Text>
                            <Text style={[styles.qaContent, { color: theme.text }]}>{insight.whatHappened}</Text>
                          </View>

                          <View style={styles.qaItem}>
                            <Text style={[styles.qaLabel, { color: theme.textSecondary }]}>WHY</Text>
                            <Text style={[styles.qaContent, { color: theme.text }]}>{insight.why}</Text>
                          </View>

                          <View style={styles.qaItem}>
                            <Text style={[styles.qaLabel, { color: theme.textSecondary }]}>RECOMMENDED ACTION</Text>
                            <View
                              style={[
                                styles.actionHighlight,
                                {
                                  backgroundColor: theme.primary + '20',
                                  borderLeftWidth: 3,
                                  borderLeftColor: theme.primary,
                                },
                              ]}
                            >
                              <Text style={[styles.actionText, { color: theme.text }]}>{insight.whatToDo}</Text>
                            </View>
                          </View>
                        </View>
                      </>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.base,
  },
  header: {
    marginBottom: spacing.lg,
  },
  microHeader: {
    fontSize: typography.sizes.micro,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  mainHeader: {
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: spacing.md,
  },
  thickDivider: {
    height: 2,
    width: '100%',
  },
  summaryGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  summaryItem: {
    flex: 1,
    padding: spacing.base,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.sizes.micro,
    letterSpacing: 1,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: typography.sizes.heading,
    marginBottom: 2,
  },
  summarySub: {
    fontSize: typography.sizes.micro,
  },
  feedContainer: {
    position: 'relative',
    paddingLeft: spacing.lg,
  },
  dashedLine: {
    position: 'absolute',
    left: spacing.xs,
    top: 10,
    bottom: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    width: 0,
  },
  cardWrapper: {
    position: 'relative',
    marginBottom: spacing.lg,
    paddingLeft: spacing.md,
  },
  connectorDot: {
    position: 'absolute',
    left: -spacing.lg,
    top: 24,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    zIndex: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: borderRadius.xs,
    padding: spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.xs / 2,
  },
  priorityText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  metricText: {
    fontSize: 14,
  },
  cardTitle: {
    fontSize: typography.sizes.section,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.sizes.caption,
    marginBottom: spacing.md,
  },
  thinDivider: {
    height: 1,
    marginVertical: spacing.md,
  },
  qaSection: {
    gap: spacing.md,
  },
  qaItem: {},
  qaLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  qaContent: {
    fontSize: 14,
    lineHeight: 18,
  },
  actionHighlight: {
    padding: 10,
    borderRadius: borderRadius.xs / 2,
    marginTop: spacing.xs,
  },
  actionText: {
    fontSize: typography.sizes.caption,
    lineHeight: 18,
  },

  // New Styles for Scanner UI & Header scan button
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  headerScanBtn: {
    borderWidth: 1,
    borderRadius: borderRadius.xs,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-end',
  },
  headerScanText: {
    fontSize: typography.sizes.micro,
    letterSpacing: 0.5,
  },
  scannerContainer: {
    borderWidth: 1,
    borderRadius: borderRadius.xs,
    padding: spacing.base,
    marginBottom: spacing.xl,
  },
  scannerHeader: {
    fontSize: 14,
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  scannerConsole: {
    padding: spacing.md,
    borderRadius: borderRadius.xs,
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#333330',
    minHeight: 160,
    marginBottom: spacing.base,
    justifyContent: 'center',
  },
  consoleLine: {
    fontSize: typography.sizes.micro,
    lineHeight: 18,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
  },
  progressPct: {
    fontSize: typography.sizes.micro,
    letterSpacing: 0.5,
  },
  emptyScanCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xs,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyScanEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyScanTitle: {
    fontSize: 16,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyScanSub: {
    fontSize: typography.sizes.caption,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: spacing.md,
  },
  emptyScanBtn: {
    borderRadius: borderRadius.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  emptyScanBtnText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  chartCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xs,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  chartTitle: {
    fontSize: 14,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  chartSubtitle: {
    fontSize: typography.sizes.micro,
    marginBottom: spacing.base,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.base,
  },
  chartContainerRelative: {
    position: 'relative',
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: 90,
  },
  chartCenterNumber: {
    fontSize: 15,
    textAlign: 'center',
  },
  chartCenterLabel: {
    fontSize: 8,
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },
  legendContainer: {
    flex: 1,
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    fontSize: 12,
  },
  legendValue: {
    fontSize: typography.sizes.micro,
  },
});
