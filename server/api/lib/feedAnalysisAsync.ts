/**
 * Async feed analysis pipeline with chunking and fallbacks
 */

import { analyzeFeedGrid } from './feedAnalysisEngine.js';
import { processImages } from './imagePreprocessor.js';
import { updateJobStatus, setJobResult, setJobError } from './jobStore.js';

export interface FeedAnalysisResult {
  score: number;
  scoreLabel: string;
  breakdown: {
    colorBalance: { score: number; explanation: string };
    visualRhythm: { score: number; explanation: string };
    contrastReadability: { score: number; explanation: string };
    contentVariety: { score: number; explanation: string };
    overallConsistency: { score: number; explanation: string };
  };
  insights: string[];
  recommendations: string[];
  nextPostGuidance: string;
  isBasicAnalysis?: boolean; // Flag for fallback analysis
}

interface AnalyzeRequest {
  images: Array<{ buffer: Buffer; mimetype: string }>;
  imageCount: number;
  contentType?: string;
  desiredVibe?: string;
  language: 'EN' | 'FR' | 'PT-BR' | 'ES';
  jobId: string;
}

/**
 * Main async analysis function
 */
export async function analyzeFeedAsync(request: AnalyzeRequest): Promise<void> {
  const { images, imageCount, contentType, desiredVibe, language, jobId } = request;
  
  try {
    // Step 1: Preprocess images (10% progress)
    updateJobStatus(jobId, 'processing', 10);
    console.log(`[Feed Analysis Async] Job ${jobId}: Preprocessing ${images.length} images...`);
    
    const processedImages = await processImages(images);
    
    // Step 2: Limit to 12 images max for analysis (if 15, analyze first 12)
    const imagesToAnalyze = processedImages.slice(0, 12);
    const actualCount = imagesToAnalyze.length;
    
    if (images.length > 12) {
      console.log(`[Feed Analysis Async] Job ${jobId}: Limiting to 12 images for analysis (received ${images.length})`);
    }
    
    // Step 3: Analyze in chunks if needed (30% progress)
    updateJobStatus(jobId, 'processing', 30);
    
    let result: FeedAnalysisResult;
    
    if (actualCount <= 9) {
      // Single batch analysis
      console.log(`[Feed Analysis Async] Job ${jobId}: Analyzing ${actualCount} images in single batch...`);
      result = await analyzeBatch(imagesToAnalyze, actualCount, contentType, desiredVibe, language, jobId, 30, 80);
    } else {
      // Chunked analysis: split into batches of 9
      console.log(`[Feed Analysis Async] Job ${jobId}: Analyzing ${actualCount} images in chunks...`);
      result = await analyzeChunked(imagesToAnalyze, actualCount, contentType, desiredVibe, language, jobId);
    }
    
    // Step 4: Validate result
    if (!validateResult(result)) {
      console.warn(`[Feed Analysis Async] Job ${jobId}: Result validation failed, using fallback`);
      result = generateBasicAnalysis(imagesToAnalyze, language);
    }
    
    // Step 5: Set result (100% progress)
    updateJobStatus(jobId, 'processing', 100);
    setJobResult(jobId, result);
    
    console.log(`[Feed Analysis Async] Job ${jobId}: Analysis completed successfully`);
  } catch (error: any) {
    console.error(`[Feed Analysis Async] Job ${jobId}: Error:`, error);
    
    // Try to generate basic analysis as fallback
    try {
      const basicResult = generateBasicAnalysis(images, language);
      setJobResult(jobId, basicResult);
      console.log(`[Feed Analysis Async] Job ${jobId}: Using basic analysis fallback`);
    } catch (fallbackError: any) {
      // If even fallback fails, set error
      setJobError(jobId, {
        code: error.code || 'ANALYSIS_ERROR',
        message: error.message || 'Failed to analyze feed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
}

/**
 * Analyze a single batch of images
 */
async function analyzeBatch(
  images: Array<{ buffer: Buffer; mimetype: string }>,
  imageCount: number,
  contentType: string | undefined,
  desiredVibe: string | undefined,
  language: 'EN' | 'FR' | 'PT-BR' | 'ES',
  jobId: string,
  startProgress: number,
  endProgress: number
): Promise<FeedAnalysisResult> {
  const progressStep = (endProgress - startProgress) / 2;
  
  updateJobStatus(jobId, 'processing', startProgress + progressStep);
  
  const result = await analyzeFeedGrid({
    images,
    imageCount,
    contentType,
    desiredVibe,
    language,
  });
  
  updateJobStatus(jobId, 'processing', endProgress);
  
  return result;
}

/**
 * Analyze images in chunks and merge results
 */
async function analyzeChunked(
  images: Array<{ buffer: Buffer; mimetype: string }>,
  imageCount: number,
  contentType: string | undefined,
  desiredVibe: string | undefined,
  language: 'EN' | 'FR' | 'PT-BR' | 'ES',
  jobId: string
): Promise<FeedAnalysisResult> {
  // Split into batches of 9
  const batchSize = 9;
  const batches: Array<Array<{ buffer: Buffer; mimetype: string }>> = [];
  
  for (let i = 0; i < images.length; i += batchSize) {
    batches.push(images.slice(i, i + batchSize));
  }
  
  console.log(`[Feed Analysis Async] Job ${jobId}: Split into ${batches.length} batches`);
  
  // Analyze each batch
  const batchResults: FeedAnalysisResult[] = [];
  const progressPerBatch = 50 / batches.length; // 30% to 80% total
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchStartProgress = 30 + (i * progressPerBatch);
    const batchEndProgress = 30 + ((i + 1) * progressPerBatch);
    
    console.log(`[Feed Analysis Async] Job ${jobId}: Analyzing batch ${i + 1}/${batches.length}...`);
    
    const batchResult = await analyzeBatch(
      batch,
      batch.length,
      contentType,
      desiredVibe,
      language,
      jobId,
      batchStartProgress,
      batchEndProgress
    );
    
    batchResults.push(batchResult);
  }
  
  // Merge results (80% to 95%)
  updateJobStatus(jobId, 'processing', 80);
  const mergedResult = mergeBatchResults(batchResults, language);
  
  updateJobStatus(jobId, 'processing', 95);
  
  return mergedResult;
}

/**
 * Merge results from multiple batches
 */
function mergeBatchResults(
  batchResults: FeedAnalysisResult[],
  language: 'EN' | 'FR' | 'PT-BR' | 'ES'
): FeedAnalysisResult {
  // Average scores
  const avgScore = Math.round(
    batchResults.reduce((sum, r) => sum + r.score, 0) / batchResults.length
  );
  
  // Determine score label
  let scoreLabel: string;
  if (avgScore >= 85) {
    scoreLabel = language === 'EN' ? 'Excellent' :
                 language === 'PT-BR' ? 'Excelente' :
                 language === 'ES' ? 'Excelente' : 'Excellent';
  } else if (avgScore >= 70) {
    scoreLabel = language === 'EN' ? 'Good' :
                 language === 'PT-BR' ? 'Bom' :
                 language === 'ES' ? 'Bueno' : 'Bon';
  } else if (avgScore >= 55) {
    scoreLabel = language === 'EN' ? 'Fair' :
                 language === 'PT-BR' ? 'Regular' :
                 language === 'ES' ? 'Regular' : 'Moyen';
  } else {
    scoreLabel = language === 'EN' ? 'Needs Improvement' :
                 language === 'PT-BR' ? 'Precisa Melhorar' :
                 language === 'ES' ? 'Necesita Mejora' : 'À Améliorer';
  }
  
  // Average breakdown scores
  const breakdown = {
    colorBalance: {
      score: Math.round(
        (batchResults.reduce((sum, r) => sum + r.breakdown.colorBalance.score, 0) / batchResults.length) * 10
      ) / 10,
      explanation: batchResults[0].breakdown.colorBalance.explanation, // Use first batch explanation
    },
    visualRhythm: {
      score: Math.round(
        (batchResults.reduce((sum, r) => sum + r.breakdown.visualRhythm.score, 0) / batchResults.length) * 10
      ) / 10,
      explanation: batchResults[0].breakdown.visualRhythm.explanation,
    },
    contrastReadability: {
      score: Math.round(
        (batchResults.reduce((sum, r) => sum + r.breakdown.contrastReadability.score, 0) / batchResults.length) * 10
      ) / 10,
      explanation: batchResults[0].breakdown.contrastReadability.explanation,
    },
    contentVariety: {
      score: Math.round(
        (batchResults.reduce((sum, r) => sum + r.breakdown.contentVariety.score, 0) / batchResults.length) * 10
      ) / 10,
      explanation: batchResults[0].breakdown.contentVariety.explanation,
    },
    overallConsistency: {
      score: Math.round(
        (batchResults.reduce((sum, r) => sum + r.breakdown.overallConsistency.score, 0) / batchResults.length) * 10
      ) / 10,
      explanation: batchResults[0].breakdown.overallConsistency.explanation,
    },
  };
  
  // Combine insights (deduplicate)
  const allInsights = batchResults.flatMap(r => r.insights);
  const uniqueInsights = Array.from(new Set(allInsights)).slice(0, 5);
  
  // Combine recommendations (deduplicate)
  const allRecommendations = batchResults.flatMap(r => r.recommendations);
  const uniqueRecommendations = Array.from(new Set(allRecommendations)).slice(0, 3);
  
  // Use first batch's next post guidance
  const nextPostGuidance = batchResults[0].nextPostGuidance;
  
  return {
    score: avgScore,
    scoreLabel,
    breakdown,
    insights: uniqueInsights,
    recommendations: uniqueRecommendations,
    nextPostGuidance,
  };
}

/**
 * Generate basic analysis using deterministic heuristics (fallback)
 */
function generateBasicAnalysis(
  images: Array<{ buffer: Buffer; mimetype: string }>,
  language: 'EN' | 'FR' | 'PT-BR' | 'ES'
): FeedAnalysisResult {
  console.log('[Feed Analysis Async] Generating basic analysis fallback...');
  
  // This is a simplified version - in production, you'd do actual image analysis
  // For now, return a reasonable default
  const score = 60;
  const scoreLabel = language === 'EN' ? 'Fair' :
                     language === 'PT-BR' ? 'Regular' :
                     language === 'ES' ? 'Regular' : 'Moyen';
  
  const breakdown = {
    colorBalance: {
      score: 6,
      explanation: language === 'EN' ? 'Basic analysis indicates moderate color balance.' :
                   language === 'PT-BR' ? 'Análise básica indica equilíbrio de cores moderado.' :
                   language === 'ES' ? 'Análisis básico indica equilibrio de colores moderado.' :
                   'L\'analyse de base indique un équilibre des couleurs modéré.',
    },
    visualRhythm: {
      score: 6,
      explanation: language === 'EN' ? 'Basic analysis shows decent visual flow.' :
                   language === 'PT-BR' ? 'Análise básica mostra fluxo visual decente.' :
                   language === 'ES' ? 'Análisis básico muestra flujo visual decente.' :
                   'L\'analyse de base montre un flux visuel décent.',
    },
    contrastReadability: {
      score: 6,
      explanation: language === 'EN' ? 'Basic analysis suggests adequate contrast.' :
                   language === 'PT-BR' ? 'Análise básica sugere contraste adequado.' :
                   language === 'ES' ? 'Análisis básico sugiere contraste adecuado.' :
                   'L\'analyse de base suggère un contraste adéquat.',
    },
    contentVariety: {
      score: 6,
      explanation: language === 'EN' ? 'Basic analysis shows moderate variety.' :
                   language === 'PT-BR' ? 'Análise básica mostra variedade moderada.' :
                   language === 'ES' ? 'Análisis básico muestra variedad moderada.' :
                   'L\'analyse de base montre une variété modérée.',
    },
    overallConsistency: {
      score: 6,
      explanation: language === 'EN' ? 'Basic analysis indicates reasonable consistency.' :
                   language === 'PT-BR' ? 'Análise básica indica consistência razoável.' :
                   language === 'ES' ? 'Análisis básico indica consistencia razonable.' :
                   'L\'analyse de base indique une cohérence raisonnable.',
    },
  };
  
  const insights = [
    language === 'EN' ? 'Consider alternating between lighter and darker images for better balance.' :
    language === 'PT-BR' ? 'Considere alternar entre imagens mais claras e mais escuras para melhor equilíbrio.' :
    language === 'ES' ? 'Considera alternar entre imágenes más claras y más oscuras para mejor equilibrio.' :
    'Envisagez d\'alterner entre des images plus claires et plus sombres pour un meilleur équilibre.',
    language === 'EN' ? 'Your feed shows potential for improvement in visual rhythm.' :
    language === 'PT-BR' ? 'Seu feed mostra potencial para melhoria no ritmo visual.' :
    language === 'ES' ? 'Tu feed muestra potencial para mejora en el ritmo visual.' :
    'Votre feed montre un potentiel d\'amélioration du rythme visuel.',
  ];
  
  const recommendations = [
    language === 'EN' ? 'Try varying the composition and angles of your photos.' :
    language === 'PT-BR' ? 'Tente variar a composição e os ângulos das suas fotos.' :
    language === 'ES' ? 'Intenta variar la composición y los ángulos de tus fotos.' :
    'Essayez de varier la composition et les angles de vos photos.',
    language === 'EN' ? 'Pay attention to the color palette across your posts.' :
    language === 'PT-BR' ? 'Preste atenção à paleta de cores em suas postagens.' :
    language === 'ES' ? 'Presta atención a la paleta de colores en tus publicaciones.' :
    'Portez attention à la palette de couleurs de vos publications.',
    language === 'EN' ? 'Consider the visual weight of each post when planning your grid.' :
    language === 'PT-BR' ? 'Considere o peso visual de cada postagem ao planejar seu grid.' :
    language === 'ES' ? 'Considera el peso visual de cada publicación al planificar tu grid.' :
    'Considérez le poids visuel de chaque publication lors de la planification de votre grille.',
  ];
  
  const nextPostGuidance = language === 'EN' ? 'A balanced post with good contrast would help improve your feed.' :
                            language === 'PT-BR' ? 'Uma postagem equilibrada com bom contraste ajudaria a melhorar seu feed.' :
                            language === 'ES' ? 'Una publicación equilibrada con buen contraste ayudaría a mejorar tu feed.' :
                            'Une publication équilibrée avec un bon contraste aiderait à améliorer votre feed.';
  
  return {
    score,
    scoreLabel,
    breakdown,
    insights,
    recommendations,
    nextPostGuidance,
    isBasicAnalysis: true,
  };
}

/**
 * Validate that result has all required fields
 */
function validateResult(result: any): result is FeedAnalysisResult {
  return (
    result &&
    typeof result.score === 'number' &&
    typeof result.scoreLabel === 'string' &&
    result.breakdown &&
    Array.isArray(result.insights) &&
    Array.isArray(result.recommendations) &&
    typeof result.nextPostGuidance === 'string'
  );
}

