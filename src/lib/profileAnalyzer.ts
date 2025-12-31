/**
 * Profile Analyzer Calculation Utilities
 * 
 * Implements tier-based benchmarks for Instagram account analysis.
 * All calculations are estimates based on industry benchmarks, not API data.
 */

export type Tier = "micro" | "mid" | "large" | "mega";

export interface TierBenchmarks {
  reachRateMin: number; // % of followers reached per post (min)
  reachRateMax: number; // % of followers reached per post (max)
  engagementRateMin: number; // % engagement by followers (min)
  engagementRateMax: number; // % engagement by followers (max)
  engagementOnReachMin: number; // % of reach that engages (min)
  engagementOnReachMax: number; // % of reach that engages (max)
}

export interface MetricRanges {
  estimatedReachMin: number;
  estimatedReachMax: number;
  estimatedReach: number; // median/representative
  avgEngagementMin: number;
  avgEngagementMax: number;
  avgEngagement: number; // median/representative
  engagementRate: number; // by followers
  engagementRateByReach: number; // by reach
}

export interface Anomaly {
  type: 'low_engagement' | 'high_engagement' | 'reach_mismatch';
  /**
   * i18n message key, e.g. 'profile.anomaly.lowEngagement.message'
   * UI layer is responsible for calling t(messageKey).
   */
  messageKey: string;
  severity: 'info' | 'warning';
}

export interface PerformanceStatus {
  status: 'healthy' | 'needs_attention' | 'not_performing';
  /**
   * i18n verdict key, e.g. 'profile.performance.verdict.notPerforming'
   */
  verdictKey: string;
  /**
   * i18n key for the primary next-step action, e.g.
   * 'profile.performance.topAction.notPerforming.increaseCadence'
   */
  topActionKey: string;
  workingStatus: 'yes' | 'almost' | 'no'; // For "Is it working?" language
}

/**
 * Determine account tier based on follower count
 */
export function getTier(followers: number): Tier {
  if (followers < 10_000) return "micro";
  if (followers < 100_000) return "mid";
  if (followers < 1_000_000) return "large";
  return "mega";
}

/**
 * Get benchmark ranges for a given tier
 */
export function getBenchmarksForTier(tier: Tier): TierBenchmarks {
  const benchmarks: Record<Tier, TierBenchmarks> = {
    micro: {
      reachRateMin: 0.12, // 12% of followers
      reachRateMax: 0.35, // 35% of followers
      engagementRateMin: 0.015, // 1.5%
      engagementRateMax: 0.06, // 6%
      engagementOnReachMin: 0.04, // 4%
      engagementOnReachMax: 0.14, // 14%
    },
    mid: {
      reachRateMin: 0.06, // 6%
      reachRateMax: 0.18, // 18%
      engagementRateMin: 0.008, // 0.8%
      engagementRateMax: 0.035, // 3.5%
      engagementOnReachMin: 0.03, // 3%
      engagementOnReachMax: 0.10, // 10%
    },
    large: {
      reachRateMin: 0.015, // 1.5%
      reachRateMax: 0.08, // 8%
      engagementRateMin: 0.004, // 0.4%
      engagementRateMax: 0.02, // 2.0%
      engagementOnReachMin: 0.02, // 2%
      engagementOnReachMax: 0.07, // 7%
    },
    mega: {
      reachRateMin: 0.008, // 0.8%
      reachRateMax: 0.05, // 5%
      engagementRateMin: 0.002, // 0.2%
      engagementRateMax: 0.012, // 1.2%
      engagementOnReachMin: 0.015, // 1.5%
      engagementOnReachMax: 0.05, // 5%
    },
  };

  return benchmarks[tier];
}

/**
 * Get cadence multiplier to adjust reach estimates
 */
export function getCadenceMultiplier(postsPerWeek: number): number {
  if (postsPerWeek >= 7) {
    // Very active: slight reduction per post, but more posts overall
    return 0.95;
  } else if (postsPerWeek >= 4) {
    // Active: baseline
    return 1.0;
  } else if (postsPerWeek >= 2) {
    // Moderate: slight reduction
    return 0.92;
  } else if (postsPerWeek >= 1) {
    // Light: more reduction
    return 0.85;
  } else {
    // Irregular: significant reduction
    return 0.75;
  }
}

/**
 * Compute estimated reach range and representative value
 */
export function computeEstimatedReachRange(
  followers: number,
  tier: Tier,
  postsPerWeek: number
): { min: number; max: number; median: number } {
  const benchmarks = getBenchmarksForTier(tier);
  const cadenceMultiplier = getCadenceMultiplier(postsPerWeek);

  const min = Math.round(followers * benchmarks.reachRateMin * cadenceMultiplier);
  const max = Math.round(followers * benchmarks.reachRateMax * cadenceMultiplier);
  const median = Math.round((min + max) / 2);

  // Ensure reach never exceeds followers
  return {
    min: Math.min(min, followers),
    max: Math.min(max, followers),
    median: Math.min(median, followers),
  };
}

/**
 * Compute engagement range based on reach
 */
export function computeEngagementRange(
  estimatedReachMin: number,
  estimatedReachMax: number,
  tier: Tier
): { min: number; max: number; median: number } {
  const benchmarks = getBenchmarksForTier(tier);

  const min = Math.round(estimatedReachMin * benchmarks.engagementOnReachMin);
  const max = Math.round(estimatedReachMax * benchmarks.engagementOnReachMax);
  const median = Math.round((min + max) / 2);

  // Hard constraint: engagement <= reach * 0.35
  const maxAllowed = Math.round(estimatedReachMax * 0.35);
  return {
    min: Math.min(min, maxAllowed),
    max: Math.min(max, maxAllowed),
    median: Math.min(median, maxAllowed),
  };
}

/**
 * Compute engagement rate by followers
 */
export function computeEngagementRate(
  avgEngagement: number,
  followers: number
): number {
  if (followers === 0) return 0;
  return Math.round((avgEngagement / followers) * 10000) / 100; // 2 decimal places
}

/**
 * Detect anomalies in the metrics
 * Uses conservative thresholds to avoid false positives
 */
export function detectAnomalies(
  followers: number,
  engagementRate: number,
  avgEngagement: number,
  estimatedReach: number,
  tier: Tier
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const benchmarks = getBenchmarksForTier(tier);

  // Check for very low engagement rate (less than 15% of minimum expected for tier)
  // This is more conservative than before to avoid false alarms
  const threshold = benchmarks.engagementRateMin * 0.15;
  if (engagementRate < threshold && engagementRate > 0) {
    anomalies.push({
      type: 'low_engagement',
      messageKey: 'profile.anomaly.lowEngagement.message',
      severity: 'warning',
    });
  }

  // Check if engagement exceeds safe bounds (hard constraint)
  if (avgEngagement > estimatedReach * 0.35) {
    anomalies.push({
      type: 'reach_mismatch',
      messageKey: 'profile.anomaly.reachMismatch.message',
      severity: 'warning',
    });
  }

  // Check if reach exceeds followers (should never happen due to clamping, but double-check)
  if (estimatedReach > followers * 1.01) { // Allow 1% tolerance for rounding
    anomalies.push({
      type: 'reach_mismatch',
      messageKey: 'profile.anomaly.reachMismatch.message',
      severity: 'warning',
    });
  }

  return anomalies;
}

/**
 * Calculate performance status based on engagement rate vs tier baseline
 */
export function calculatePerformanceStatus(
  engagementRate: number,
  tier: Tier,
  anomalies: Anomaly[],
  postsPerWeek: number,
  avgLikes: number,
  avgComments: number
): PerformanceStatus {
  const baselines = {
    micro: 0.015, // 1.5%
    mid: 0.008,   // 0.8%
    large: 0.004, // 0.4%
    mega: 0.002,  // 0.2%
  };
  
  const baseline = baselines[tier];
  const hasAnomaly = anomalies.length > 0;
  
  let status: 'healthy' | 'needs_attention' | 'not_performing';
  let workingStatus: 'yes' | 'almost' | 'no';
  let verdictKey: string;
  let topActionKey: string;
  
  if (hasAnomaly || engagementRate < baseline * 0.7) {
    status = 'not_performing';
    workingStatus = 'no';
    verdictKey = 'profile.performance.verdict.notPerforming';
    
    if (postsPerWeek < 3) {
      topActionKey = 'profile.performance.topAction.notPerforming.increaseCadence';
    } else if (engagementRate < baseline * 0.5) {
      topActionKey = 'profile.performance.topAction.notPerforming.improveHooks';
    } else {
      topActionKey = 'profile.performance.topAction.notPerforming.optimizeHashtags';
    }
  } else if (engagementRate >= baseline * 1.2) {
    status = 'healthy';
    workingStatus = 'yes';
    verdictKey = 'profile.performance.verdict.healthy';
    
    if (postsPerWeek < 4) {
      topActionKey = 'profile.performance.topAction.healthy.increaseCadence';
    } else {
      topActionKey = 'profile.performance.topAction.healthy.maintainAndExperiment';
    }
  } else {
    status = 'needs_attention';
    workingStatus = 'almost';
    verdictKey = 'profile.performance.verdict.needsAttention';
    
    if (postsPerWeek < 3) {
      topActionKey = 'profile.performance.topAction.needsAttention.increaseCadence';
    } else {
      topActionKey = 'profile.performance.topAction.needsAttention.improveHooksAndTiming';
    }
  }
  
  return { status, verdictKey, topActionKey, workingStatus };
}

/**
 * Generate prioritized top 3 actions
 */
export type TopActionId = 'consistency' | 'hooks' | 'timing' | 'hashtags';
export type TopActionDifficulty = 'easy' | 'medium' | 'hard';

export interface TopAction {
  id: TopActionId;
  difficulty: TopActionDifficulty;
}

export function generateTopActions(
  engagementRate: number,
  tier: Tier,
  postsPerWeek: number,
  timingSuggestions: string[],
  hashtagStrategy: string[]
): TopAction[] {
  const actions: TopAction[] = [];
  const baselines = {
    micro: 0.015,
    mid: 0.008,
    large: 0.004,
    mega: 0.002,
  };
  const baseline = baselines[tier];
  
  // Priority 1: Consistency (if low)
  if (postsPerWeek < 3) {
    actions.push({
      id: 'consistency',
      difficulty: 'easy',
    });
  }
  
  // Priority 2: Hooks (if ER is low)
  if (engagementRate < baseline * 1.2) {
    actions.push({
      id: 'hooks',
      difficulty: 'medium',
    });
  }
  
  // Priority 3: Timing or Hashtags
  if (engagementRate < baseline * 1.0) {
    if (timingSuggestions.length > 0) {
      actions.push({
        id: 'timing',
        difficulty: 'easy',
      });
    } else {
      actions.push({
        id: 'hashtags',
        difficulty: 'easy',
      });
    }
  }
  
  // If we don't have 3 actions yet, add generic ones
  if (actions.length < 3) {
    if (actions.length === 0 || !actions.some(a => a.id === 'hashtags')) {
      actions.push({
        id: 'hashtags',
        difficulty: 'easy',
      });
    }
  }
  
  return actions.slice(0, 3); // Return top 3
}

/**
 * Main calculation function
 */
export function calculateMetrics(
  followers: number,
  avgLikes: number,
  avgComments: number,
  postsPerWeek: number
): {
  ranges: MetricRanges;
  postingCadence: string;
  tier: Tier;
  anomalies: Anomaly[];
} {
  const tier = getTier(followers);
  const benchmarks = getBenchmarksForTier(tier);

  // Determine posting cadence
  let postingCadence = 'Irregular';
  if (postsPerWeek >= 7) postingCadence = 'Very Active (Daily)';
  else if (postsPerWeek >= 4) postingCadence = 'Active (4-6x/week)';
  else if (postsPerWeek >= 2) postingCadence = 'Moderate (2-3x/week)';
  else if (postsPerWeek >= 1) postingCadence = 'Light (1x/week)';

  // Compute reach range
  const reachRange = computeEstimatedReachRange(followers, tier, postsPerWeek);

  // Compute engagement range based on reach (benchmarks / expectations)
  const engagementRange = computeEngagementRange(
    reachRange.min,
    reachRange.max,
    tier
  );

  /**
   * Engagement from user input (\"real\" metric)
   * We keep this as close as possible to the values provided:
   *   engagement = likes + comments
   * Benchmarks are only used to flag impossible combinations and to
   * provide expected ranges, not to override the user's data.
   */
  const userProvidedEngagement = Math.max(0, avgLikes + avgComments);

  // Apply a hard safety cap to avoid impossible values:
  // engagement should not exceed ~35% of median reach
  const maxAllowed = reachRange.median * 0.35;
  const finalEngagement = Math.min(userProvidedEngagement, maxAllowed);

  // Compute engagement rate (by followers) from clamped user input
  const engagementRate = computeEngagementRate(finalEngagement, followers);
  const engagementRateByReach = reachRange.median > 0
    ? Math.round((finalEngagement / reachRange.median) * 10000) / 100
    : 0;

  const ranges: MetricRanges = {
    estimatedReachMin: reachRange.min,
    estimatedReachMax: reachRange.max,
    estimatedReach: reachRange.median,
    // Expected engagement range (benchmarks)
    avgEngagementMin: engagementRange.min,
    avgEngagementMax: engagementRange.max,
    // Actual engagement from user input (clamped only for impossible values)
    avgEngagement: finalEngagement,
    engagementRate,
    engagementRateByReach,
  };

  // Detect anomalies using the original (unclamped) user engagement
  const anomalies = detectAnomalies(
    followers,
    engagementRate,
    userProvidedEngagement,
    reachRange.median,
    tier
  );

  return {
    ranges,
    postingCadence,
    tier,
    anomalies,
  };
}

/**
 * Format number with locale-aware commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format range as "min-max" or single number
 */
export function formatRange(min: number, max: number, showRange: boolean = true): string {
  if (!showRange || min === max) {
    return formatNumber(Math.round((min + max) / 2));
  }
  return `${formatNumber(Math.round(min))}–${formatNumber(Math.round(max))}`;
}

/**
 * Test function to demonstrate outputs for different follower counts
 * This is for documentation/testing purposes only
 */
export function testScenarios() {
  const testCases = [
    { followers: 2000, avgLikes: 80, avgComments: 8, postsPerWeek: 3 },
    { followers: 15000, avgLikes: 300, avgComments: 30, postsPerWeek: 4 },
    { followers: 120000, avgLikes: 2000, avgComments: 200, postsPerWeek: 5 },
    { followers: 700000, avgLikes: 8000, avgComments: 800, postsPerWeek: 4 },
    { followers: 2000000, avgLikes: 15000, avgComments: 1500, postsPerWeek: 6 },
  ];

  return testCases.map(test => {
    const result = calculateMetrics(
      test.followers,
      test.avgLikes,
      test.avgComments,
      test.postsPerWeek
    );
    return {
      input: test,
      output: {
        tier: result.tier,
        postingCadence: result.postingCadence,
        estimatedReach: `${formatRange(result.ranges.estimatedReachMin, result.ranges.estimatedReachMax)}`,
        avgEngagement: `${formatRange(result.ranges.avgEngagementMin, result.ranges.avgEngagementMax)}`,
        engagementRate: `${result.ranges.engagementRate.toFixed(2)}%`,
        anomalies: result.anomalies.length,
      }
    };
  });
}

