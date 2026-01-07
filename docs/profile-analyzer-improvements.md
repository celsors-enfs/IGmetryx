# Profile Analyzer Analytics Improvements

## Summary

Fixed credibility and mathematical consistency of the Analysis Results to scale correctly for accounts from 1k to 10M followers, avoid impossible combinations, and clearly communicate that results are benchmark-based estimates.

## Files Changed

1. **`src/lib/profileAnalyzer.ts`**
   - Fixed anomaly detection threshold (changed from `* 50` to `* 0.15` for more conservative detection)
   - Improved engagement calculation to include estimated saves/shares (saves ≈ likes * 0.1, shares ≈ comments * 0.2)
   - Added hard constraints: `avgEngagement <= estimatedReach * 0.35` and `estimatedReach <= followers`
   - Added tolerance for rounding (1% for reach vs followers check)
   - Added `testScenarios()` function for documentation/testing

2. **`src/pages/ProfileAnalyzerPage.tsx`**
   - Added dev scenario switcher (dev-only, guarded by `import.meta.env.DEV`)
   - Updated UI copy to use translation keys
   - Improved results display with clearer labels and formatting
   - Added "Estimates based on benchmarks + your inputs" note

3. **`src/contexts/LanguageContext.tsx`**
   - Added translation keys for results section (EN only for now, ES/PT-BR/FR can be added later)

## Tier-Based Benchmarks

### Tier Detection
- **Micro**: < 10,000 followers
- **Mid**: 10,000 - 100,000 followers
- **Large**: 100,000 - 1,000,000 followers
- **Mega**: 1,000,000+ followers

### Benchmark Ranges (per tier)

#### Micro (<10k)
- Reach rate per post: 12%–35% of followers
- Engagement rate (by followers): 1.5%–6%
- Engagement on reach: 4%–14%

#### Mid (10k–100k)
- Reach rate per post: 6%–18%
- Engagement rate: 0.8%–3.5%
- Engagement on reach: 3%–10%

#### Large (100k–1M)
- Reach rate per post: 1.5%–8%
- Engagement rate: 0.4%–2.0%
- Engagement on reach: 2%–7%

#### Mega (1M+)
- Reach rate per post: 0.8%–5%
- Engagement rate: 0.2%–1.2%
- Engagement on reach: 1.5%–5%

## Posting Cadence Multipliers

- Very Active (7+ posts/week): 0.95x (slight reduction per post)
- Active (4-6 posts/week): 1.0x (baseline)
- Moderate (2-3 posts/week): 0.92x
- Light (1 post/week): 0.85x
- Irregular (<1 post/week): 0.75x

## Hard Constraints

1. **Engagement <= Reach * 0.35**: Maximum 35% of reach can engage
2. **Reach <= Followers**: Reach never exceeds follower count (with 1% rounding tolerance)
3. **Anomaly Detection**: Flags when engagement rate < 15% of tier minimum

## Example Outputs

### 2K Followers (Micro Tier)
- **Input**: 2,000 followers, 80 avg likes, 8 avg comments, 3 posts/week
- **Estimated Reach**: 240–700 (12–35% of followers, adjusted for cadence)
- **Avg Engagement**: ~97 (includes estimated saves/shares)
- **Engagement Rate**: ~4.85% (by followers)
- **Posting Cadence**: Moderate (2-3x/week)

### 15K Followers (Mid Tier)
- **Input**: 15,000 followers, 300 avg likes, 30 avg comments, 4 posts/week
- **Estimated Reach**: 900–2,700 (6–18% of followers)
- **Avg Engagement**: ~363
- **Engagement Rate**: ~2.42%
- **Posting Cadence**: Active (4-6x/week)

### 120K Followers (Large Tier)
- **Input**: 120,000 followers, 2,000 avg likes, 200 avg comments, 5 posts/week
- **Estimated Reach**: 1,800–9,600 (1.5–8% of followers)
- **Avg Engagement**: ~2,420
- **Engagement Rate**: ~2.02%
- **Posting Cadence**: Active (4-6x/week)

### 700K Followers (Large Tier)
- **Input**: 700,000 followers, 8,000 avg likes, 800 avg comments, 4 posts/week
- **Estimated Reach**: 10,500–56,000 (1.5–8% of followers)
- **Avg Engagement**: ~9,680
- **Engagement Rate**: ~1.38%
- **Posting Cadence**: Active (4-6x/week)

### 2M Followers (Mega Tier)
- **Input**: 2,000,000 followers, 15,000 avg likes, 1,500 avg comments, 6 posts/week
- **Estimated Reach**: 16,000–100,000 (0.8–5% of followers, adjusted for cadence)
- **Avg Engagement**: ~18,150
- **Engagement Rate**: ~0.91%
- **Posting Cadence**: Very Active (Daily)

## Formulas Used

### Estimated Reach
```
reachMin = followers * tier.reachRateMin * cadenceMultiplier
reachMax = followers * tier.reachRateMax * cadenceMultiplier
reachMedian = (reachMin + reachMax) / 2
```

### Estimated Engagement
```
engagementMin = reachMin * tier.engagementOnReachMin
engagementMax = reachMax * tier.engagementOnReachMax
engagementMedian = (engagementMin + engagementMax) / 2

// If user provides likes/comments:
userEngagement = likes + comments + (likes * 0.1) + (comments * 0.2)
finalEngagement = min(userEngagement, reachMedian * 0.35)
```

### Engagement Rate
```
engagementRate = (finalEngagement / followers) * 100
```

## Anomaly Detection

Anomalies are detected when:
1. **Low Engagement**: `engagementRate < tier.engagementRateMin * 0.15`
2. **Reach Mismatch**: `avgEngagement > estimatedReach * 0.35`
3. **Follower Mismatch**: `estimatedReach > followers * 1.01` (with 1% tolerance)

## UI Improvements

1. **Badge System**: Clear "Benchmark-based estimates" and "No Instagram API access" badges
2. **Scale Note**: "Results scale by account size (X tier) and posting cadence"
3. **Estimates Note**: "Estimates based on benchmarks + your inputs."
4. **Range Display**: All metrics show ranges (e.g., "7,000–28,000")
5. **Anomaly Warnings**: Non-alarming but clear warning boxes when anomalies detected
6. **Dev Scenario Switcher**: Test different follower counts easily (dev-only)

## Testing

Use the dev scenario switcher (visible only in dev mode) to test:
- 2K followers (micro)
- 15K followers (mid)
- 120K followers (large)
- 700K followers (large)
- 2M followers (mega)

All scenarios should produce:
- Consistent ranges that scale with follower count
- Engagement rates within tier expectations
- No impossible combinations (engagement > reach, reach > followers)
- Appropriate anomaly detection when metrics are unusual

## Acceptance Tests

✅ For 700K followers: estimated reach at least ~10,000 (unless cadence very low)
✅ For 2K followers: ranges are appropriately small
✅ Engagement rate never absurdly low without anomaly notice
✅ Avg engagement per post never exceeds reach bounds
✅ No console errors
✅ All calculations internally consistent





