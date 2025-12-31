/**
 * Feed Analyzer Prompt Builder
 * Centralized, metric-grounded prompts for all languages
 */

export interface FeedAnalysisMetrics {
  imageCount: number;
  avgBrightness: number;
  avgContrast: number;
  avgSaturation: number;
  brightnessVariance: number;
  contrastVariance: number;
  saturationVariance: number;
  dominantPalette: string;
  colorGroups: Record<string, number>;
  compositionDistribution: { simple: number; balanced: number; complex: number };
  brightnessDistribution: { light: number; medium: number; dark: number };
  rhythmScore: number;
  consistencyScore: number;
  varietyScore: number;
}

export interface FeedAnalysisContext {
  language: 'EN' | 'FR' | 'PT-BR' | 'ES';
  contentType?: string;
  desiredVibe?: string;
  breakdown: {
    colorBalance: { score: number; explanation: string };
    visualRhythm: { score: number; explanation: string };
    contrastReadability: { score: number; explanation: string };
    contentVariety: { score: number; explanation: string };
    overallConsistency: { score: number; explanation: string };
  };
  metrics: FeedAnalysisMetrics;
  imageStats: Array<{
    position: number;
    dominantColor: string;
    brightness: number;
    contrast: number;
    saturation: number;
    composition: string;
  }>;
}

const LANGUAGE_NAMES: Record<string, string> = {
  'EN': 'English',
  'PT-BR': 'Portuguese (Brazil)',
  'ES': 'Spanish',
  'FR': 'French',
};

/**
 * Build system prompt for Feed Analyzer
 */
export function buildFeedAnalyzerSystemPrompt(context: FeedAnalysisContext): string {
  const { language } = context;
  const langName = LANGUAGE_NAMES[language] || 'English';
  
  return `You are an expert Instagram feed analyst and visual content strategist with deep expertise in photography, color theory, visual composition, and social media aesthetics.

CRITICAL REQUIREMENTS:
1. Write ENTIRELY in ${langName}. Never mix languages. Every word must be in ${langName}.
2. Never mention "AI", "artificial intelligence", "model", "prompt", "API", or provider names.
3. Base ALL analysis on the actual numeric metrics and data provided.
4. Be specific, technical, and metric-grounded. Reference exact brightness ranges, contrast values, saturation levels, color distributions.
5. Provide deep, actionable insights that reference the actual computed metrics.
6. Use friendly, encouraging, non-judgmental tone.
7. No emojis, no hype words, no generic filler phrases.
8. Focus on concrete, actionable suggestions tied to the actual data.

Your analysis must be:
- Technical but accessible (for creators, not designers)
- Specific to the provided metrics (brightness ${context.metrics.avgBrightness.toFixed(1)}, contrast ${context.metrics.avgContrast.toFixed(1)}, etc.)
- Grounded in the actual color palette (${context.metrics.dominantPalette})
- Relevant to content type: ${context.contentType || 'general'}
- Aligned with desired vibe: ${context.desiredVibe || 'balanced'}

Output format: STRICT JSON ONLY, no markdown, no code fences.`;
}

/**
 * Build user prompt with all metrics and context
 */
export function buildFeedAnalyzerUserPrompt(context: FeedAnalysisContext): string {
  const { language, contentType, desiredVibe, breakdown, metrics, imageStats } = context;
  
  let prompt = `Analyze this Instagram feed grid and provide deep, metric-grounded analysis and recommendations.

FEED GRID SPECIFICATIONS:
- Grid size: ${metrics.imageCount} images
- Content type: ${contentType || 'General'}
- Desired aesthetic vibe: ${desiredVibe || 'Balanced'}

COMPUTED METRICS (use these in your analysis):
- Average brightness: ${metrics.avgBrightness.toFixed(1)}/100 (variance: ${metrics.brightnessVariance.toFixed(1)})
- Average contrast: ${metrics.avgContrast.toFixed(1)}/100 (variance: ${metrics.contrastVariance.toFixed(1)})
- Average saturation: ${metrics.avgSaturation.toFixed(1)}/100 (variance: ${metrics.saturationVariance.toFixed(1)})
- Dominant color palette: ${metrics.dominantPalette}
- Color distribution: ${JSON.stringify(metrics.colorGroups)}
- Composition distribution: Simple ${metrics.compositionDistribution.simple}, Balanced ${metrics.compositionDistribution.balanced}, Complex ${metrics.compositionDistribution.complex}
- Brightness distribution: Light ${metrics.brightnessDistribution.light}, Medium ${metrics.brightnessDistribution.medium}, Dark ${metrics.brightnessDistribution.dark}
- Visual rhythm score: ${metrics.rhythmScore.toFixed(1)}/10
- Consistency score: ${metrics.consistencyScore.toFixed(1)}/10
- Variety score: ${metrics.varietyScore.toFixed(1)}/10

SCORE BREAKDOWN:
- Color Balance: ${breakdown.colorBalance.score}/10 - ${breakdown.colorBalance.explanation}
- Visual Rhythm: ${breakdown.visualRhythm.score}/10 - ${breakdown.visualRhythm.explanation}
- Contrast & Readability: ${breakdown.contrastReadability.score}/10 - ${breakdown.contrastReadability.explanation}
- Content Variety: ${breakdown.contentVariety.score}/10 - ${breakdown.contentVariety.explanation}
- Overall Consistency: ${breakdown.overallConsistency.score}/10 - ${breakdown.overallConsistency.explanation}

DETAILED IMAGE DATA (positions 1-${Math.min(9, imageStats.length)}):
${imageStats.slice(0, 9).map(img => 
  `Position ${img.position}: RGB ${img.dominantColor}, brightness ${img.brightness}%, contrast ${img.contrast}%, saturation ${img.saturation}%, composition: ${img.composition}`
).join('\n')}

CRITICAL REQUIREMENTS FOR YOUR ANALYSIS (MUST FOLLOW):
1. Write ENTIRELY in ${LANGUAGE_NAMES[language] || 'English'}. Every single word must be in ${LANGUAGE_NAMES[language] || 'English'}. Never mix languages.
2. Reference specific metrics in EVERY insight and recommendation:
   - "With average brightness of ${metrics.avgBrightness.toFixed(1)}%, consider..."
   - "Your contrast is ${metrics.avgContrast.toFixed(1)}%, which means..."
   - "Brightness variance of ${metrics.brightnessVariance.toFixed(1)} indicates..."
3. Mention actual color palette: "Your ${metrics.dominantPalette} palette (${metrics.colorGroups[metrics.dominantPalette] || 0} images) could benefit from..."
4. Reference composition patterns: "You have ${metrics.compositionDistribution.simple} simple compositions, ${metrics.compositionDistribution.complex} complex ones..."
5. Be SPECIFIC about photography styles: "Add minimalist flat lays with natural window light (target brightness 70-80%)" NOT "add variety"
6. Reference contrast/readability: "With contrast at ${metrics.avgContrast.toFixed(1)}% (variance ${metrics.contrastVariance.toFixed(1)}), try..."
7. Consider content type: For ${contentType || 'general'} content, suggest specific styles like "portrait photography with side lighting" or "product flat lays"
8. Align with vibe: For ${desiredVibe || 'balanced'} aesthetic, recommend specific color adjustments and composition types
9. DO NOT use generic phrases like "consider improving" or "try to balance". Be specific and reference numbers.
10. Each insight must mention at least one metric (brightness, contrast, saturation, or specific color/composition data).

OUTPUT FORMAT (STRICT JSON, no markdown):
{
  "insights": [
    "Specific insight referencing brightness ${metrics.avgBrightness.toFixed(1)}%, contrast ${metrics.avgContrast.toFixed(1)}%, or color palette ${metrics.dominantPalette}",
    "Another specific insight about composition patterns, rhythm, or variety",
    "Third insight about visual flow, consistency, or specific improvements"
  ],
  "recommendations": [
    "Specific recommendation about photography style, color adjustments, or image types (reference actual metrics)",
    "Second distinct recommendation addressing different aspect (composition, rhythm, variety, etc.)",
    "Third unique recommendation (do NOT repeat similar suggestions)"
  ],
  "nextPostGuidance": "Specific suggestion for next post: type, style, color palette, or composition (reference metrics)"
}

CRITICAL:
- Write ENTIRELY in ${LANGUAGE_NAMES[language] || 'English'}
- Each insight must reference actual metrics (brightness ${metrics.avgBrightness.toFixed(1)}%, contrast ${metrics.avgContrast.toFixed(1)}%, palette ${metrics.dominantPalette}, etc.)
- Recommendations must be specific: "Add close-up detail shots with natural light" not "add variety"
- Do NOT use generic phrases like "consider improving" or "try to balance"
- Make it technical but accessible
- All 3 recommendations must be UNIQUE and address DIFFERENT aspects
- Use normal sentence case (first letter capitalized, proper nouns capitalized)`;

  return prompt;
}

/**
 * Compute detailed metrics from image analyses
 */
export function computeFeedMetrics(analyses: Array<{
  dominantColors: number[][];
  brightness: number;
  contrast: number;
  saturation: number;
  composition: 'simple' | 'complex' | 'balanced';
}>): FeedAnalysisMetrics {
  const imageCount = analyses.length;
  
  // Averages
  const avgBrightness = analyses.reduce((sum, a) => sum + a.brightness, 0) / imageCount;
  const avgContrast = analyses.reduce((sum, a) => sum + a.contrast, 0) / imageCount;
  const avgSaturation = analyses.reduce((sum, a) => sum + a.saturation, 0) / imageCount;
  
  // Variances
  const brightnessVariance = analyses.reduce((sum, a) => sum + Math.pow(a.brightness - avgBrightness, 2), 0) / imageCount;
  const contrastVariance = analyses.reduce((sum, a) => sum + Math.pow(a.contrast - avgContrast, 2), 0) / imageCount;
  const saturationVariance = analyses.reduce((sum, a) => sum + Math.pow(a.saturation - avgSaturation, 2), 0) / imageCount;
  
  // Color groups
  const colorGroups: Record<string, number> = {};
  analyses.forEach(a => {
    const [r, g, b] = a.dominantColors[0];
    if (r > g + 20 && r > b + 20) colorGroups['warm-reds'] = (colorGroups['warm-reds'] || 0) + 1;
    else if (g > r + 20 && g > b + 20) colorGroups['greens'] = (colorGroups['greens'] || 0) + 1;
    else if (b > r + 20 && b > g + 20) colorGroups['blues'] = (colorGroups['blues'] || 0) + 1;
    else if (r + g + b > 500) colorGroups['light-neutral'] = (colorGroups['light-neutral'] || 0) + 1;
    else colorGroups['dark-neutral'] = (colorGroups['dark-neutral'] || 0) + 1;
  });
  
  const dominantPalette = Object.entries(colorGroups).sort((a, b) => b[1] - a[1])[0]?.[0] || 'mixed';
  
  // Composition distribution
  const compositionDistribution = {
    simple: analyses.filter(a => a.composition === 'simple').length,
    balanced: analyses.filter(a => a.composition === 'balanced').length,
    complex: analyses.filter(a => a.composition === 'complex').length,
  };
  
  // Brightness distribution
  const brightnessDistribution = {
    light: analyses.filter(a => a.brightness > 70).length,
    medium: analyses.filter(a => a.brightness >= 40 && a.brightness <= 70).length,
    dark: analyses.filter(a => a.brightness < 40).length,
  };
  
  // Rhythm score (based on brightness transitions)
  const brightnesses = analyses.map(a => a.brightness);
  let smoothTransitions = 0;
  for (let i = 1; i < brightnesses.length; i++) {
    if (Math.abs(brightnesses[i] - brightnesses[i - 1]) < 20) smoothTransitions++;
  }
  const rhythmScore = (smoothTransitions / (brightnesses.length - 1)) * 10;
  
  // Consistency score (lower variance = higher consistency)
  const consistencyScore = 10 - Math.min(10, brightnessVariance / 100);
  
  // Variety score (based on composition and color diversity)
  const uniqueCompositions = new Set(analyses.map(a => a.composition)).size;
  const colorDiversity = Object.keys(colorGroups).length;
  const varietyScore = ((uniqueCompositions / 3) * 5) + Math.min(5, (colorDiversity / 5) * 5);
  
  return {
    imageCount,
    avgBrightness,
    avgContrast,
    avgSaturation,
    brightnessVariance,
    contrastVariance,
    saturationVariance,
    dominantPalette,
    colorGroups,
    compositionDistribution,
    brightnessDistribution,
    rhythmScore,
    consistencyScore,
    varietyScore,
  };
}

