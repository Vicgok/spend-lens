import {
  InsightCoachSignal,
  InsightHabitIcon,
  InsightHabitSignal,
  InsightObservationSignal,
  InsightRiskSignal,
  InsightSpendingPatternRow,
  InsightsSnapshot,
} from './types';

export interface InsightHabitDisplay {
  key: InsightHabitSignal['key'];
  title: string;
  summary: string;
  detail: string;
  tone: InsightHabitSignal['tone'];
  icon: InsightHabitIcon;
}

export interface InsightRiskDisplay {
  level: InsightRiskSignal['level'];
  description: string;
  checklist: string[];
}

export interface InsightsScreenSectionsDisplay {
  spendingPatterns: InsightSpendingPatternRow[];
  habits: InsightHabitDisplay[];
  risk: InsightRiskDisplay;
  observations: string[];
  coachTip: string;
}

function formatHabitDisplay(habit: InsightHabitSignal): InsightHabitDisplay {
  if (habit.key === 'weekend-balance') {
    return habit.active
      ? {
          key: habit.key,
          title: 'Weekend Concentration',
          summary: 'Most spending occurs on weekends',
          detail: 'Your spending is clustered on weekends. A dedicated weekend allowance can reduce lifestyle creep.',
          tone: habit.tone,
          icon: habit.icon,
        }
      : {
          key: habit.key,
          title: 'Balanced Timeline',
          summary: 'Weekday spending patterns remain steady and balanced',
          detail: 'Your weekday and weekend spending are fairly balanced, which supports more predictable monthly cash flow.',
          tone: habit.tone,
          icon: habit.icon,
        };
  }

  if (habit.key === 'food-share') {
    return {
      key: habit.key,
      title: 'Dining & Food Ratio',
      summary: `Food accounts for ${Math.round(habit.value)}% of expenses`,
      detail: 'Food and dining are taking a visible share of your recent outgoings. Meal planning or batching orders can reduce drift.',
      tone: habit.tone,
      icon: habit.icon,
    };
  }

  return habit.active
    ? {
        key: habit.key,
        title: 'Evening Spend Peaks',
        summary: 'Transactions increase during evenings',
        detail: 'Your spending peaks later in the day, which can be a signal for convenience or fatigue-driven purchases.',
        tone: habit.tone,
        icon: habit.icon,
      }
    : {
        key: habit.key,
        title: 'Even Time Distribution',
        summary: 'Transactions are evenly distributed throughout the day',
        detail: 'No strong time-of-day spike is visible in your current-month transaction pattern.',
        tone: habit.tone,
        icon: habit.icon,
      };
}

function formatRiskDisplay(risk: InsightRiskSignal, snapshot: InsightsSnapshot): InsightRiskDisplay {
  const checklist = risk.flags.flatMap((flag) => {
    switch (flag) {
      case 'unusual-spend':
        return snapshot.unusualSpendCandidates[0]
          ? [`${snapshot.unusualSpendCandidates[0].categoryName} spending broke its normal baseline`]
          : [];
      case 'monthly-spike':
        return [`Monthly spending is up ${Math.round(snapshot.trends.monthly.deltaPercentage)}% versus last month`];
      case 'subscription-candidate':
        return snapshot.subscriptionCandidates[0]
          ? [`Recurring charge candidate detected at ${snapshot.subscriptionCandidates[0].merchant}`]
          : [];
      case 'rising-category': {
        const risingPattern = snapshot.sections.spendingPatterns.find((pattern) => pattern.direction === 'up');
        return risingPattern ? [`${risingPattern.categoryName} is one of your fastest-rising categories this month`] : [];
      }
      case 'no-risk':
        return [
          'I detected no abnormal spending',
          'I found no suspicious spikes',
          'I detected no spending anomalies',
        ];
      default:
        return [];
    }
  });

  while (checklist.length < 3) {
    checklist.push('I detected no additional risk signals');
  }

  return {
    level: risk.level,
    description:
      risk.level === 'Low'
        ? 'Your recent activity appears consistent with your normal behavior.'
        : 'I detected patterns that are moving above your typical spending baseline.',
    checklist: checklist.slice(0, 3),
  };
}

function formatObservationDisplay(observation: InsightObservationSignal): string[] {
  return [
    observation.moreSpendOn === 'weekends'
      ? `You spend ₹${observation.weekdayVsWeekendDelta} less on weekdays`
      : observation.moreSpendOn === 'weekdays'
      ? `You spend ₹${observation.weekdayVsWeekendDelta} less on weekends`
      : 'Your weekday and weekend spending are evenly balanced',
    observation.cashUsageDirection === 'lower'
      ? `Cash usage is ${observation.cashUsageDeltaPct}% lower than last month`
      : observation.cashUsageDirection === 'higher'
      ? `Cash usage is ${observation.cashUsageDeltaPct}% higher than last month`
      : 'Cash usage is steady compared to last month',
    `Average transaction value is ₹${observation.averageTransactionValue}`,
  ];
}

function formatCoachTipDisplay(coach: InsightCoachSignal): string {
  switch (coach.kind) {
    case 'unusual-spend':
      return `Bringing your ${coach.categoryName} spend back to its usual range would recover about ₹${(coach.amount ?? 0).toLocaleString('en-IN')} on similar purchases.`;
    case 'rising-category':
      return `Saving just 10% on ${coach.categoryName} this month translates to ₹${(coach.amount ?? 0).toLocaleString('en-IN')} extra saved.`;
    case 'monthly-trend':
      return `Matching last month's pace would keep about ₹${(coach.amount ?? 0).toLocaleString('en-IN')} in your cushion this month.`;
    default:
      return 'Saving ₹50 daily becomes ₹18,250 yearly. Keep logging transactions to get sharper coach guidance.';
  }
}

export function mapInsightsSnapshotToScreenSections(snapshot: InsightsSnapshot): InsightsScreenSectionsDisplay {
  return {
    spendingPatterns: snapshot.sections.spendingPatterns,
    habits: snapshot.sections.habits.map(formatHabitDisplay),
    risk: formatRiskDisplay(snapshot.sections.risk, snapshot),
    observations: formatObservationDisplay(snapshot.sections.observations),
    coachTip: formatCoachTipDisplay(snapshot.sections.coach),
  };
}
