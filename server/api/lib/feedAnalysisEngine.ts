import sharp from 'sharp';
import { callDeepSeek } from './deepseek.js';
import { 
  buildFeedAnalyzerSystemPrompt, 
  buildFeedAnalyzerUserPrompt, 
  computeFeedMetrics,
  type FeedAnalysisContext 
} from './feedAnalyzerPrompts.js';

interface ImageData {
  buffer: Buffer;
  mimetype: string;
}

interface AnalyzeRequest {
  images: ImageData[];
  imageCount: number;
  contentType?: string;
  desiredVibe?: string;
  language: 'EN' | 'FR' | 'PT-BR' | 'ES';
}

interface FeedAnalysisResult {
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
}

interface ImageAnalysis {
  dominantColors: number[][]; // RGB values
  brightness: number; // 0-100
  contrast: number; // 0-100
  saturation: number; // 0-100
  composition: 'simple' | 'complex' | 'balanced';
}

async function analyzeImage(imageData: ImageData): Promise<ImageAnalysis> {
  try {
    console.log(`[Feed Analysis Engine] Processing image (mimetype: ${imageData.mimetype}, size: ${imageData.buffer.length} bytes)`);
    
    // Ensure image is in a format sharp can process
    let image = sharp(imageData.buffer);
    
    // Add timeout for metadata (reduced to 2 seconds)
    const metadataPromise = image.metadata();
    const metadataTimeout = new Promise<any>((_, reject) => {
      setTimeout(() => reject(new Error('Metadata timeout')), 2000);
    });
    const metadata = await Promise.race([metadataPromise, metadataTimeout]);
    console.log(`[Feed Analysis Engine] Image metadata: width=${metadata.width}, height=${metadata.height}, format=${metadata.format}, channels=${metadata.channels}`);
    
    // Convert to RGB if needed (handles CMYK, grayscale, etc.)
    // Only convert if not already RGB
    if (metadata.channels && metadata.channels !== 3 && metadata.channels !== 4) {
      image = image.rgb();
      console.log(`[Feed Analysis Engine] Converted to RGB (was ${metadata.channels} channels)`);
    }
    
    // Add timeout for image processing (reduced to 3 seconds, smaller resize for speed)
    const processPromise = image
      .resize(50, 50, { fit: 'inside' }) // Smaller resize for faster processing
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const processTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Image processing timeout')), 3000);
    });
    
    const processResult = await Promise.race([processPromise, processTimeout]) as { data: Buffer; info: any };
    const { data, info } = processResult;

    console.log(`[Feed Analysis Engine] Resized image: width=${info.width}, height=${info.height}, channels=${info.channels}`);

    // Calculate dominant colors (simplified - take average of pixels)
    const pixels = new Uint8Array(data);
    const channels = info.channels || 3;
    let rSum = 0, gSum = 0, bSum = 0;
    let brightnessSum = 0;
    let contrastSum = 0;

    for (let i = 0; i < pixels.length; i += channels) {
      const r = pixels[i];
      const g = pixels[i + 1] || pixels[i];
      const b = pixels[i + 2] || pixels[i];
      
      rSum += r;
      gSum += g;
      bSum += b;
      
      const brightness = (r + g + b) / 3;
      brightnessSum += brightness;
      
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);
      contrastSum += saturation;
    }

    const pixelCount = pixels.length / channels;
    const avgR = Math.round(rSum / pixelCount);
    const avgG = Math.round(gSum / pixelCount);
    const avgB = Math.round(bSum / pixelCount);
    const avgBrightness = brightnessSum / pixelCount;
    const avgContrast = contrastSum / pixelCount;
    
    // Calculate saturation
    const max = Math.max(avgR, avgG, avgB);
    const min = Math.min(avgR, avgG, avgB);
    const saturation = max === 0 ? 0 : ((max - min) / max) * 100;

    // Determine composition complexity (simplified)
    const brightnessVariance = Math.abs(avgBrightness - 128);
    let composition: 'simple' | 'complex' | 'balanced' = 'balanced';
    if (brightnessVariance < 30 && saturation < 20) {
      composition = 'simple';
    } else if (brightnessVariance > 60 || saturation > 60) {
      composition = 'complex';
    }

    const result = {
      dominantColors: [[avgR, avgG, avgB]],
      brightness: (avgBrightness / 255) * 100,
      contrast: (avgContrast / 255) * 100,
      saturation,
      composition,
    };
    
    console.log(`[Feed Analysis Engine] Image analysis result: RGB(${avgR},${avgG},${avgB}), brightness=${result.brightness.toFixed(1)}, contrast=${result.contrast.toFixed(1)}, saturation=${saturation.toFixed(1)}, composition=${composition}`);
    
    return result;
  } catch (error: any) {
    console.error('[Feed Analysis Engine] Error analyzing image:', error);
    console.error('[Feed Analysis Engine] Error stack:', error.stack);
    console.error('[Feed Analysis Engine] Image mimetype:', imageData.mimetype);
    console.error('[Feed Analysis Engine] Image buffer length:', imageData.buffer.length);
    // Return default values if image processing fails
    return {
      dominantColors: [[128, 128, 128]],
      brightness: 50,
      contrast: 30,
      saturation: 20,
      composition: 'balanced',
    };
  }
}

function calculateColorBalance(analyses: ImageAnalysis[]): number {
  // Calculate color distribution and balance
  const brightnesses = analyses.map(a => a.brightness);
  const avgBrightness = brightnesses.reduce((a, b) => a + b, 0) / brightnesses.length;
  const brightnessVariance = brightnesses.reduce((sum, b) => sum + Math.pow(b - avgBrightness, 2), 0) / brightnesses.length;
  
  // Lower variance = better balance (but we want some variety)
  // Score: 0-10, where balanced variety scores high
  const idealVariance = 400; // Some variance is good
  const varianceScore = Math.max(0, 10 - Math.abs(brightnessVariance - idealVariance) / 50);
  
  return Math.min(10, Math.max(0, varianceScore));
}

function calculateVisualRhythm(analyses: ImageAnalysis[]): number {
  // Check for patterns and flow
  const brightnesses = analyses.map(a => a.brightness);
  
  // Calculate transitions between images
  let smoothTransitions = 0;
  let abruptTransitions = 0;
  
  for (let i = 1; i < brightnesses.length; i++) {
    const diff = Math.abs(brightnesses[i] - brightnesses[i - 1]);
    if (diff < 20) {
      smoothTransitions++;
    } else if (diff > 40) {
      abruptTransitions++;
    }
  }
  
  const totalTransitions = brightnesses.length - 1;
  const smoothRatio = smoothTransitions / totalTransitions;
  const abruptRatio = abruptTransitions / totalTransitions;
  
  // Good rhythm: mostly smooth with some variety
  const rhythmScore = (smoothRatio * 7) + ((1 - abruptRatio) * 3);
  
  return Math.min(10, Math.max(0, rhythmScore));
}

function calculateContrastReadability(analyses: ImageAnalysis[]): number {
  // Average contrast across images
  const contrasts = analyses.map(a => a.contrast);
  const avgContrast = contrasts.reduce((a, b) => a + b, 0) / contrasts.length;
  
  // Good contrast is around 30-50
  const idealContrast = 40;
  const contrastScore = 10 - Math.abs(avgContrast - idealContrast) / 5;
  
  return Math.min(10, Math.max(0, contrastScore));
}

function calculateContentVariety(analyses: ImageAnalysis[]): number {
  // Check for variety in composition and colors
  const compositions = analyses.map(a => a.composition);
  const uniqueCompositions = new Set(compositions).size;
  
  // Check color variety
  const colorDistances: number[] = [];
  for (let i = 0; i < analyses.length; i++) {
    for (let j = i + 1; j < analyses.length; j++) {
      const color1 = analyses[i].dominantColors[0];
      const color2 = analyses[j].dominantColors[0];
      const distance = Math.sqrt(
        Math.pow(color1[0] - color2[0], 2) +
        Math.pow(color1[1] - color2[1], 2) +
        Math.pow(color1[2] - color2[2], 2)
      );
      colorDistances.push(distance);
    }
  }
  
  const avgColorDistance = colorDistances.reduce((a, b) => a + b, 0) / colorDistances.length;
  
  // Good variety: mix of compositions and colors
  const compositionScore = (uniqueCompositions / 3) * 5;
  const colorScore = Math.min(5, avgColorDistance / 50);
  
  return Math.min(10, compositionScore + colorScore);
}

function calculateOverallConsistency(analyses: ImageAnalysis[]): number {
  // Check for cohesive visual style
  const brightnesses = analyses.map(a => a.brightness);
  const saturations = analyses.map(a => a.saturation);
  
  const avgBrightness = brightnesses.reduce((a, b) => a + b, 0) / brightnesses.length;
  const avgSaturation = saturations.reduce((a, b) => a + b, 0) / saturations.length;
  
  // Calculate how close each image is to the average
  const brightnessDeviations = brightnesses.map(b => Math.abs(b - avgBrightness));
  const saturationDeviations = saturations.map(s => Math.abs(s - avgSaturation));
  
  const avgBrightnessDev = brightnessDeviations.reduce((a, b) => a + b, 0) / brightnessDeviations.length;
  const avgSaturationDev = saturationDeviations.reduce((a, b) => a + b, 0) / saturationDeviations.length;
  
  // Lower deviation = more consistent
  const consistencyScore = 10 - (avgBrightnessDev / 10) - (avgSaturationDev / 20);
  
  return Math.min(10, Math.max(0, consistencyScore));
}

// Intensity type and sanitizer
const INTENSITY_PROMPTS = { low: '', medium: '', high: '' } as const;
type Intensity = keyof typeof INTENSITY_PROMPTS;

/**
 * Sanitize intensity value from request input
 * Defaults to "medium" if invalid
 */
function sanitizeIntensity(raw: unknown): Intensity {
  if (raw === 'low' || raw === 'high') {
    return raw;
  }
  return 'medium';
}

/**
 * Get intensity level from score
 */
function getIntensityFromScore(score: number): Intensity {
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

type LanguageCode = 'EN' | 'FR' | 'PT-BR' | 'ES';

interface ExplanationTexts {
  colorBalance: Record<Intensity, string>;
  visualRhythm: Record<Intensity, string>;
  contrastReadability: Record<Intensity, string>;
  contentVariety: Record<Intensity, string>;
  overallConsistency: Record<Intensity, string>;
}

function generateExplanations(
  breakdown: FeedAnalysisResult['breakdown'],
  language: 'EN' | 'FR' | 'PT-BR' | 'ES' | 'en' | 'fr' | 'pt-BR' | 'es'
): FeedAnalysisResult['breakdown'] {
  const explanations: Record<LanguageCode, ExplanationTexts> = {
    EN: {
      colorBalance: {
        high: 'Your feed has a well-balanced mix of light and dark images.',
        medium: 'Your feed could benefit from more balanced lighting across posts.',
        low: 'Your feed has uneven lighting that creates visual weight imbalances.',
      },
      visualRhythm: {
        high: 'Your feed flows smoothly with natural transitions between posts.',
        medium: 'Your feed has decent flow but some transitions feel abrupt.',
        low: 'Your feed lacks visual rhythm with jarring transitions between posts.',
      },
      contrastReadability: {
        high: 'Your images have strong contrast that makes content easy to read.',
        medium: 'Your images have moderate contrast that works but could be stronger.',
        low: 'Your images lack contrast, making some content hard to distinguish.',
      },
      contentVariety: {
        high: 'Your feed shows good variety in composition and visual style.',
        medium: 'Your feed has some variety but could benefit from more diversity.',
        low: 'Your feed feels repetitive with similar compositions and colors.',
      },
      overallConsistency: {
        high: 'Your feed maintains a cohesive visual style throughout.',
        medium: 'Your feed has a somewhat consistent style but could be more unified.',
        low: 'Your feed lacks visual consistency, making it feel disconnected.',
      },
    },
    'PT-BR': {
      colorBalance: {
        high: 'Seu feed tem uma mistura equilibrada de imagens claras e escuras.',
        medium: 'Seu feed se beneficiaria de uma iluminação mais equilibrada entre as postagens.',
        low: 'Seu feed tem iluminação desigual que cria desequilíbrios visuais.',
      },
      visualRhythm: {
        high: 'Seu feed flui suavemente com transições naturais entre as postagens.',
        medium: 'Seu feed tem um fluxo decente, mas algumas transições parecem abruptas.',
        low: 'Seu feed carece de ritmo visual com transições bruscas entre as postagens.',
      },
      contrastReadability: {
        high: 'Suas imagens têm forte contraste que torna o conteúdo fácil de ler.',
        medium: 'Suas imagens têm contraste moderado que funciona, mas poderia ser mais forte.',
        low: 'Suas imagens carecem de contraste, dificultando a distinção de alguns conteúdos.',
      },
      contentVariety: {
        high: 'Seu feed mostra boa variedade em composição e estilo visual.',
        medium: 'Seu feed tem alguma variedade, mas se beneficiaria de mais diversidade.',
        low: 'Seu feed parece repetitivo com composições e cores similares.',
      },
      overallConsistency: {
        high: 'Seu feed mantém um estilo visual coeso em toda a extensão.',
        medium: 'Seu feed tem um estilo um tanto consistente, mas poderia ser mais unificado.',
        low: 'Seu feed carece de consistência visual, fazendo-o parecer desconectado.',
      },
    },
    ES: {
      colorBalance: {
        high: 'Tu feed tiene una mezcla equilibrada de imágenes claras y oscuras.',
        medium: 'Tu feed se beneficiaría de una iluminación más equilibrada entre las publicaciones.',
        low: 'Tu feed tiene iluminación desigual que crea desequilibrios visuales.',
      },
      visualRhythm: {
        high: 'Tu feed fluye suavemente con transiciones naturales entre publicaciones.',
        medium: 'Tu feed tiene un flujo decente, pero algunas transiciones se sienten abruptas.',
        low: 'Tu feed carece de ritmo visual con transiciones bruscas entre publicaciones.',
      },
      contrastReadability: {
        high: 'Tus imágenes tienen fuerte contraste que hace el contenido fácil de leer.',
        medium: 'Tus imágenes tienen contraste moderado que funciona, pero podría ser más fuerte.',
        low: 'Tus imágenes carecen de contraste, dificultando distinguir algunos contenidos.',
      },
      contentVariety: {
        high: 'Tu feed muestra buena variedad en composición y estilo visual.',
        medium: 'Tu feed tiene cierta variedad, pero se beneficiaría de más diversidad.',
        low: 'Tu feed se siente repetitivo con composiciones y colores similares.',
      },
      overallConsistency: {
        high: 'Tu feed mantiene un estilo visual cohesivo en toda su extensión.',
        medium: 'Tu feed tiene un estilo algo consistente, pero podría ser más unificado.',
        low: 'Tu feed carece de consistencia visual, haciéndolo sentir desconectado.',
      },
    },
    FR: {
      colorBalance: {
        high: 'Votre feed a un mélange équilibré d\'images claires et sombres.',
        medium: 'Votre feed bénéficierait d\'un éclairage plus équilibré entre les publications.',
        low: 'Votre feed a un éclairage inégal qui crée des déséquilibres visuels.',
      },
      visualRhythm: {
        high: 'Votre feed coule en douceur avec des transitions naturelles entre les publications.',
        medium: 'Votre feed a un flux décent mais certaines transitions semblent abruptes.',
        low: 'Votre feed manque de rythme visuel avec des transitions brusques entre les publications.',
      },
      contrastReadability: {
        high: 'Vos images ont un fort contraste qui rend le contenu facile à lire.',
        medium: 'Vos images ont un contraste modéré qui fonctionne mais pourrait être plus fort.',
        low: 'Vos images manquent de contraste, rendant certains contenus difficiles à distinguer.',
      },
      contentVariety: {
        high: 'Votre feed montre une bonne variété en composition et style visuel.',
        medium: 'Votre feed a une certaine variété mais bénéficierait de plus de diversité.',
        low: 'Votre feed semble répétitif avec des compositions et couleurs similaires.',
      },
      overallConsistency: {
        high: 'Votre feed maintient un style visuel cohérent tout au long.',
        medium: 'Votre feed a un style quelque peu cohérent mais pourrait être plus unifié.',
        low: 'Votre feed manque de cohérence visuelle, le faisant paraître déconnecté.',
      },
    },
  };

  // Normalize language code - ensure correct mapping
  let normalizedLang: LanguageCode = 'EN';
  if (language === 'PT-BR' || language === 'pt-BR') {
    normalizedLang = 'PT-BR';
  } else if (language === 'FR' || language === 'fr') {
    normalizedLang = 'FR';
  } else if (language === 'ES' || language === 'es') {
    normalizedLang = 'ES';
  } else {
    normalizedLang = 'EN';
  }
  
  console.log(`[Feed Analysis Engine] Language mapping: ${language} -> ${normalizedLang}`);
  const lang: ExplanationTexts = explanations[normalizedLang] || explanations.EN;
  
  return {
    colorBalance: {
      score: breakdown.colorBalance.score,
      explanation: lang.colorBalance[getIntensityFromScore(breakdown.colorBalance.score)],
    },
    visualRhythm: {
      score: breakdown.visualRhythm.score,
      explanation: lang.visualRhythm[getIntensityFromScore(breakdown.visualRhythm.score)],
    },
    contrastReadability: {
      score: breakdown.contrastReadability.score,
      explanation: lang.contrastReadability[getIntensityFromScore(breakdown.contrastReadability.score)],
    },
    contentVariety: {
      score: breakdown.contentVariety.score,
      explanation: lang.contentVariety[getIntensityFromScore(breakdown.contentVariety.score)],
    },
    overallConsistency: {
      score: breakdown.overallConsistency.score,
      explanation: lang.overallConsistency[getIntensityFromScore(breakdown.overallConsistency.score)],
    },
  };
}

function generateInsights(
  breakdown: FeedAnalysisResult['breakdown'],
  language: 'EN' | 'FR' | 'PT-BR' | 'ES'
): string[] {
  const insights: string[] = [];
  const lang = language;

  if (breakdown.colorBalance.score < 6) {
    insights.push(
      lang === 'EN' ? 'Some areas of the grid feel visually heavier than others.' :
      lang === 'PT-BR' ? 'Algumas áreas do grid parecem visualmente mais pesadas que outras.' :
      lang === 'ES' ? 'Algunas áreas del grid se sienten visualmente más pesadas que otras.' :
      'Certaines zones de la grille semblent visuellement plus lourdes que d\'autres.'
    );
  }

  if (breakdown.visualRhythm.score < 6) {
    insights.push(
      lang === 'EN' ? 'Several posts look very similar side by side, reducing flow.' :
      lang === 'PT-BR' ? 'Várias postagens parecem muito similares lado a lado, reduzindo o fluxo.' :
      lang === 'ES' ? 'Varias publicaciones se ven muy similares lado a lado, reduciendo el flujo.' :
      'Plusieurs publications se ressemblent beaucoup côte à côte, réduisant le flux.'
    );
  }

  if (breakdown.overallConsistency.score >= 7) {
    insights.push(
      lang === 'EN' ? 'The feed feels cohesive overall, but could benefit from more variation.' :
      lang === 'PT-BR' ? 'O feed parece coeso no geral, mas se beneficiaria de mais variação.' :
      lang === 'ES' ? 'El feed se siente cohesivo en general, pero se beneficiaría de más variación.' :
      'Le feed semble cohérent dans l\'ensemble, mais bénéficierait de plus de variation.'
    );
  }

  if (breakdown.contentVariety.score < 5) {
    insights.push(
      lang === 'EN' ? 'The feed shows limited variety in composition and visual style.' :
      lang === 'PT-BR' ? 'O feed mostra variedade limitada em composição e estilo visual.' :
      lang === 'ES' ? 'El feed muestra variedad limitada en composición y estilo visual.' :
      'Le feed montre une variété limitée en composition et style visuel.'
    );
  }

  if (breakdown.contrastReadability.score < 6) {
    insights.push(
      lang === 'EN' ? 'Some images lack sufficient contrast for clear readability.' :
      lang === 'PT-BR' ? 'Algumas imagens carecem de contraste suficiente para clareza.' :
      lang === 'ES' ? 'Algunas imágenes carecen de contraste suficiente para claridad.' :
      'Certaines images manquent de contraste suffisant pour une lisibilité claire.'
    );
  }

  // Ensure at least 3 insights
  if (insights.length < 3) {
    insights.push(
      lang === 'EN' ? 'Consider alternating between lighter and darker images to create visual balance.' :
      lang === 'PT-BR' ? 'Considere alternar entre imagens mais claras e mais escuras para criar equilíbrio visual.' :
      lang === 'ES' ? 'Considera alternar entre imágenes más claras y más oscuras para crear equilibrio visual.' :
      'Envisagez d\'alterner entre des images plus claires et plus sombres pour créer un équilibre visuel.'
    );
  }

  return insights.slice(0, 5);
}

function generateRecommendations(
  breakdown: FeedAnalysisResult['breakdown'],
  language: 'EN' | 'FR' | 'PT-BR' | 'ES'
): string[] {
  const recommendations: string[] = [];
  const lang = language;

  if (breakdown.colorBalance.score < 7) {
    recommendations.push(
      lang === 'EN' ? 'Alternate lighter images after darker ones to improve balance.' :
      lang === 'PT-BR' ? 'Alterne imagens mais claras após as mais escuras para melhorar o equilíbrio.' :
      lang === 'ES' ? 'Alterna imágenes más claras después de las más oscuras para mejorar el equilibrio.' :
      'Alternez des images plus claires après les plus sombres pour améliorer l\'équilibre.'
    );
  }

  if (breakdown.visualRhythm.score < 7) {
    recommendations.push(
      lang === 'EN' ? 'Avoid repeating the same composition more than twice in a row.' :
      lang === 'PT-BR' ? 'Evite repetir a mesma composição mais de duas vezes seguidas.' :
      lang === 'ES' ? 'Evita repetir la misma composición más de dos veces seguidas.' :
      'Évitez de répéter la même composition plus de deux fois de suite.'
    );
  }

  if (breakdown.contentVariety.score < 6) {
    recommendations.push(
      lang === 'EN' ? 'Introduce a simpler post to create visual breathing room.' :
      lang === 'PT-BR' ? 'Introduza uma postagem mais simples para criar espaço visual.' :
      lang === 'ES' ? 'Introduce una publicación más simple para crear espacio visual.' :
      'Introduisez une publication plus simple pour créer un espace visuel.'
    );
  }

  // Ensure exactly 3 recommendations
  while (recommendations.length < 3) {
    recommendations.push(
      lang === 'EN' ? 'Consider the visual weight of each post when planning your grid.' :
      lang === 'PT-BR' ? 'Considere o peso visual de cada postagem ao planejar seu grid.' :
      lang === 'ES' ? 'Considera el peso visual de cada publicación al planificar tu grid.' :
      'Considérez le poids visuel de chaque publication lors de la planification de votre grille.'
    );
  }

  return recommendations.slice(0, 3);
}

function generateNextPostGuidance(
  breakdown: FeedAnalysisResult['breakdown'],
  language: 'EN' | 'FR' | 'PT-BR' | 'ES'
): string {
  const lang = language;

  if (breakdown.colorBalance.score < 6) {
    return lang === 'EN'
      ? 'A lighter, minimal post would help rebalance the grid.'
      : lang === 'PT-BR'
      ? 'Uma postagem mais clara e minimalista ajudaria a reequilibrar o grid.'
      : lang === 'ES'
      ? 'Una publicación más clara y minimalista ayudaría a reequilibrar el grid.'
      : 'Une publication plus claire et minimaliste aiderait à rééquilibrer la grille.';
  }

  if (breakdown.contentVariety.score < 6) {
    return lang === 'EN'
      ? 'A post with a different composition style would add visual variety.'
      : lang === 'PT-BR'
      ? 'Uma postagem com um estilo de composição diferente adicionaria variedade visual.'
      : lang === 'ES'
      ? 'Una publicación con un estilo de composición diferente agregaría variedad visual.'
      : 'Une publication avec un style de composition différent ajouterait de la variété visuelle.';
  }

  return lang === 'EN'
    ? 'A post that maintains your current visual style would strengthen consistency.'
    : lang === 'PT-BR'
    ? 'Uma postagem que mantenha seu estilo visual atual fortaleceria a consistência.'
    : lang === 'ES'
    ? 'Una publicación que mantenga tu estilo visual actual fortalecería la consistencia.'
    : 'Une publication qui maintient votre style visuel actuel renforcerait la cohérence.';
}

/**
 * Generate metric-grounded fallback insights using actual computed metrics
 */
function generateMetricGroundedInsights(context: FeedAnalysisContext): string[] {
  const { language, metrics, breakdown, contentType, desiredVibe } = context;
  const insights: string[] = [];
  const lang = language;
  
  // Brightness-based insights
  if (metrics.avgBrightness < 40) {
    insights.push(
      lang === 'EN' ? `Your feed has an average brightness of ${metrics.avgBrightness.toFixed(1)}%, creating a darker aesthetic. Consider adding lighter images (brightness 60-80%) to improve balance.` :
      lang === 'PT-BR' ? `Seu feed tem um brilho médio de ${metrics.avgBrightness.toFixed(1)}%, criando uma estética mais escura. Considere adicionar imagens mais claras (brilho 60-80%) para melhorar o equilíbrio.` :
      lang === 'ES' ? `Tu feed tiene un brillo promedio de ${metrics.avgBrightness.toFixed(1)}%, creando una estética más oscura. Considera agregar imágenes más claras (brillo 60-80%) para mejorar el equilibrio.` :
      `Votre feed a une luminosité moyenne de ${metrics.avgBrightness.toFixed(1)}%, créant une esthétique plus sombre. Envisagez d'ajouter des images plus claires (luminosité 60-80%) pour améliorer l'équilibre.`
    );
  } else if (metrics.avgBrightness > 70) {
    insights.push(
      lang === 'EN' ? `With average brightness at ${metrics.avgBrightness.toFixed(1)}%, your feed is quite light. Adding some darker images (brightness 30-50%) would create better visual contrast.` :
      lang === 'PT-BR' ? `Com brilho médio de ${metrics.avgBrightness.toFixed(1)}%, seu feed está bastante claro. Adicionar algumas imagens mais escuras (brilho 30-50%) criaria melhor contraste visual.` :
      lang === 'ES' ? `Con brillo promedio de ${metrics.avgBrightness.toFixed(1)}%, tu feed está bastante claro. Agregar algunas imágenes más oscuras (brillo 30-50%) crearía mejor contraste visual.` :
      `Avec une luminosité moyenne de ${metrics.avgBrightness.toFixed(1)}%, votre feed est assez clair. Ajouter quelques images plus sombres (luminosité 30-50%) créerait un meilleur contraste visuel.`
    );
  }
  
  // Contrast-based insights
  if (metrics.avgContrast < 30) {
    insights.push(
      lang === 'EN' ? `Your images have low contrast (average ${metrics.avgContrast.toFixed(1)}%), which can reduce readability. Try images with stronger light-dark differences, especially for ${contentType || 'your content type'}.` :
      lang === 'PT-BR' ? `Suas imagens têm baixo contraste (média de ${metrics.avgContrast.toFixed(1)}%), o que pode reduzir a legibilidade. Tente imagens com diferenças mais fortes entre claro e escuro, especialmente para ${contentType || 'seu tipo de conteúdo'}.` :
      lang === 'ES' ? `Tus imágenes tienen bajo contraste (promedio de ${metrics.avgContrast.toFixed(1)}%), lo que puede reducir la legibilidad. Prueba imágenes con diferencias más fuertes entre claro y oscuro, especialmente para ${contentType || 'tu tipo de contenido'}.` :
      `Vos images ont un faible contraste (moyenne de ${metrics.avgContrast.toFixed(1)}%), ce qui peut réduire la lisibilité. Essayez des images avec des différences plus fortes entre clair et sombre, surtout pour ${contentType || 'votre type de contenu'}.`
    );
  }
  
  // Color palette insights
  if (metrics.dominantPalette !== 'mixed') {
    const paletteName = metrics.dominantPalette === 'warm-reds' 
      ? (lang === 'EN' ? 'warm reds' : lang === 'PT-BR' ? 'vermelhos quentes' : lang === 'ES' ? 'rojos cálidos' : 'rouges chauds')
      : metrics.dominantPalette === 'greens'
      ? (lang === 'EN' ? 'greens' : lang === 'PT-BR' ? 'verdes' : lang === 'ES' ? 'verdes' : 'verts')
      : metrics.dominantPalette === 'blues'
      ? (lang === 'EN' ? 'blues' : lang === 'PT-BR' ? 'azuis' : lang === 'ES' ? 'azules' : 'bleus')
      : metrics.dominantPalette;
    
    insights.push(
      lang === 'EN' ? `Your feed is dominated by ${paletteName} (${metrics.colorGroups[metrics.dominantPalette] || 0} out of ${metrics.imageCount} images). For ${desiredVibe || 'better balance'}, consider adding complementary tones.` :
      lang === 'PT-BR' ? `Seu feed é dominado por ${paletteName} (${metrics.colorGroups[metrics.dominantPalette] || 0} de ${metrics.imageCount} imagens). Para ${desiredVibe || 'melhor equilíbrio'}, considere adicionar tons complementares.` :
      lang === 'ES' ? `Tu feed está dominado por ${paletteName} (${metrics.colorGroups[metrics.dominantPalette] || 0} de ${metrics.imageCount} imágenes). Para ${desiredVibe || 'mejor equilibrio'}, considera agregar tonos complementarios.` :
      `Votre feed est dominé par ${paletteName} (${metrics.colorGroups[metrics.dominantPalette] || 0} sur ${metrics.imageCount} images). Pour ${desiredVibe || 'un meilleur équilibre'}, envisagez d'ajouter des tons complémentaires.`
    );
  }
  
  // Composition variety insights
  if (metrics.compositionDistribution.simple > metrics.imageCount * 0.6) {
    insights.push(
      lang === 'EN' ? `You have ${metrics.compositionDistribution.simple} simple compositions out of ${metrics.imageCount}. For ${contentType || 'your content'}, try adding more complex compositions like detailed close-ups or layered scenes.` :
      lang === 'PT-BR' ? `Você tem ${metrics.compositionDistribution.simple} composições simples de ${metrics.imageCount}. Para ${contentType || 'seu conteúdo'}, tente adicionar composições mais complexas como close-ups detalhados ou cenas em camadas.` :
      lang === 'ES' ? `Tienes ${metrics.compositionDistribution.simple} composiciones simples de ${metrics.imageCount}. Para ${contentType || 'tu contenido'}, intenta agregar composiciones más complejas como primeros planos detallados o escenas en capas.` :
      `Vous avez ${metrics.compositionDistribution.simple} compositions simples sur ${metrics.imageCount}. Pour ${contentType || 'votre contenu'}, essayez d'ajouter des compositions plus complexes comme des gros plans détaillés ou des scènes en couches.`
    );
  }
  
  // Rhythm insights
  if (metrics.rhythmScore < 5) {
    insights.push(
      lang === 'EN' ? `Your visual rhythm score is ${metrics.rhythmScore.toFixed(1)}/10, indicating abrupt transitions. With brightness variance of ${metrics.brightnessVariance.toFixed(1)}, try creating smoother brightness gradients between adjacent posts.` :
      lang === 'PT-BR' ? `Seu ritmo visual é ${metrics.rhythmScore.toFixed(1)}/10, indicando transições abruptas. Com variância de brilho de ${metrics.brightnessVariance.toFixed(1)}, tente criar gradientes de brilho mais suaves entre postagens adjacentes.` :
      lang === 'ES' ? `Tu ritmo visual es ${metrics.rhythmScore.toFixed(1)}/10, indicando transiciones abruptas. Con varianza de brillo de ${metrics.brightnessVariance.toFixed(1)}, intenta crear gradientes de brillo más suaves entre publicaciones adyacentes.` :
      `Votre rythme visuel est de ${metrics.rhythmScore.toFixed(1)}/10, indiquant des transitions abruptes. Avec une variance de luminosité de ${metrics.brightnessVariance.toFixed(1)}, essayez de créer des dégradés de luminosité plus doux entre les publications adjacentes.`
    );
  }
  
  // Ensure at least 3 insights
  while (insights.length < 3) {
    insights.push(
      lang === 'EN' ? `With average saturation at ${metrics.avgSaturation.toFixed(1)}% and contrast at ${metrics.avgContrast.toFixed(1)}%, your feed has a ${metrics.avgSaturation > 50 ? 'vibrant' : 'muted'} color profile. Consider balancing with ${metrics.avgSaturation > 50 ? 'more neutral tones' : 'more saturated accents'}.` :
      lang === 'PT-BR' ? `Com saturação média de ${metrics.avgSaturation.toFixed(1)}% e contraste de ${metrics.avgContrast.toFixed(1)}%, seu feed tem um perfil de cor ${metrics.avgSaturation > 50 ? 'vibrante' : 'sutil'}. Considere equilibrar com ${metrics.avgSaturation > 50 ? 'tons mais neutros' : 'acentos mais saturados'}.` :
      lang === 'ES' ? `Con saturación promedio de ${metrics.avgSaturation.toFixed(1)}% y contraste de ${metrics.avgContrast.toFixed(1)}%, tu feed tiene un perfil de color ${metrics.avgSaturation > 50 ? 'vibrante' : 'sutil'}. Considera equilibrar con ${metrics.avgSaturation > 50 ? 'tonos más neutros' : 'acentos más saturados'}.` :
      `Avec une saturation moyenne de ${metrics.avgSaturation.toFixed(1)}% et un contraste de ${metrics.avgContrast.toFixed(1)}%, votre feed a un profil de couleur ${metrics.avgSaturation > 50 ? 'vibrant' : 'discret'}. Envisagez d'équilibrer avec ${metrics.avgSaturation > 50 ? 'des tons plus neutres' : 'des accents plus saturés'}.`
    );
  }
  
  return insights.slice(0, 5);
}

/**
 * Generate metric-grounded recommendations
 */
function generateMetricGroundedRecommendations(context: FeedAnalysisContext): string[] {
  const { language, metrics, breakdown, contentType, desiredVibe } = context;
  const recommendations: string[] = [];
  const lang = language;
  
  // Brightness-based recommendation
  if (metrics.avgBrightness < 45) {
    recommendations.push(
      lang === 'EN' ? `Add 2-3 images with brightness 65-80% to balance your current average of ${metrics.avgBrightness.toFixed(1)}%. Try minimalist flat lays or portraits with natural window light.` :
      lang === 'PT-BR' ? `Adicione 2-3 imagens com brilho de 65-80% para equilibrar sua média atual de ${metrics.avgBrightness.toFixed(1)}%. Tente flat lays minimalistas ou retratos com luz natural de janela.` :
      lang === 'ES' ? `Agrega 2-3 imágenes con brillo de 65-80% para equilibrar tu promedio actual de ${metrics.avgBrightness.toFixed(1)}%. Prueba flat lays minimalistas o retratos con luz natural de ventana.` :
      `Ajoutez 2-3 images avec une luminosité de 65-80% pour équilibrer votre moyenne actuelle de ${metrics.avgBrightness.toFixed(1)}%. Essayez des flat lays minimalistes ou des portraits avec une lumière naturelle de fenêtre.`
    );
  } else if (metrics.avgBrightness > 65) {
    recommendations.push(
      lang === 'EN' ? `Introduce 2-3 darker images (brightness 25-40%) to contrast with your bright feed (average ${metrics.avgBrightness.toFixed(1)}%). Consider moody portraits or detail shots with dramatic shadows.` :
      lang === 'PT-BR' ? `Introduza 2-3 imagens mais escuras (brilho 25-40%) para contrastar com seu feed claro (média ${metrics.avgBrightness.toFixed(1)}%). Considere retratos sombrios ou close-ups com sombras dramáticas.` :
      lang === 'ES' ? `Introduce 2-3 imágenes más oscuras (brillo 25-40%) para contrastar con tu feed claro (promedio ${metrics.avgBrightness.toFixed(1)}%). Considera retratos sombríos o primeros planos con sombras dramáticas.` :
      `Introduisez 2-3 images plus sombres (luminosité 25-40%) pour contraster avec votre feed clair (moyenne ${metrics.avgBrightness.toFixed(1)}%). Envisagez des portraits sombres ou des gros plans avec des ombres dramatiques.`
    );
  }
  
  // Contrast-based recommendation
  if (metrics.avgContrast < 35) {
    recommendations.push(
      lang === 'EN' ? `Increase contrast by adding images with strong light-dark separation (target contrast 45-60%). For ${contentType || 'your content'}, try close-up detail shots with side lighting or high-contrast graphic elements.` :
      lang === 'PT-BR' ? `Aumente o contraste adicionando imagens com forte separação claro-escuro (contraste alvo 45-60%). Para ${contentType || 'seu conteúdo'}, tente close-ups detalhados com iluminação lateral ou elementos gráficos de alto contraste.` :
      lang === 'ES' ? `Aumenta el contraste agregando imágenes con fuerte separación claro-oscuro (contraste objetivo 45-60%). Para ${contentType || 'tu contenido'}, prueba primeros planos detallados con iluminación lateral o elementos gráficos de alto contraste.` :
      `Augmentez le contraste en ajoutant des images avec une forte séparation clair-sombre (contraste cible 45-60%). Pour ${contentType || 'votre contenu'}, essayez des gros plans détaillés avec un éclairage latéral ou des éléments graphiques à fort contraste.`
    );
  }
  
  // Color palette recommendation
  if (metrics.dominantPalette !== 'mixed') {
    const complementary = metrics.dominantPalette === 'warm-reds' 
      ? (lang === 'EN' ? 'cool blues or soft greens' : lang === 'PT-BR' ? 'azuis frios ou verdes suaves' : lang === 'ES' ? 'azules fríos o verdes suaves' : 'bleus froids ou verts doux')
      : metrics.dominantPalette === 'blues'
      ? (lang === 'EN' ? 'warm oranges or earthy browns' : lang === 'PT-BR' ? 'laranjas quentes ou marrons terrosos' : lang === 'ES' ? 'naranjas cálidos o marrones terrosos' : 'oranges chauds ou bruns terreux')
      : (lang === 'EN' ? 'warm reds or soft pinks' : lang === 'PT-BR' ? 'vermelhos quentes ou rosas suaves' : lang === 'ES' ? 'rojos cálidos o rosas suaves' : 'rouges chauds ou roses doux');
    
    recommendations.push(
      lang === 'EN' ? `Your ${metrics.dominantPalette} palette (${metrics.colorGroups[metrics.dominantPalette] || 0} images) could benefit from ${complementary} accents. Add 1-2 images with these tones to create visual interest while maintaining your ${desiredVibe || 'aesthetic'}.` :
      lang === 'PT-BR' ? `Sua paleta ${metrics.dominantPalette} (${metrics.colorGroups[metrics.dominantPalette] || 0} imagens) se beneficiaria de acentos ${complementary}. Adicione 1-2 imagens com esses tons para criar interesse visual mantendo sua ${desiredVibe || 'estética'}.` :
      lang === 'ES' ? `Tu paleta ${metrics.dominantPalette} (${metrics.colorGroups[metrics.dominantPalette] || 0} imágenes) se beneficiaría de acentos ${complementary}. Agrega 1-2 imágenes con estos tonos para crear interés visual manteniendo tu ${desiredVibe || 'estética'}.` :
      `Votre palette ${metrics.dominantPalette} (${metrics.colorGroups[metrics.dominantPalette] || 0} images) bénéficierait d'accents ${complementary}. Ajoutez 1-2 images avec ces tons pour créer un intérêt visuel tout en maintenant votre ${desiredVibe || 'esthétique'}.`
    );
  }
  
  // Ensure exactly 3 recommendations
  while (recommendations.length < 3) {
    if (metrics.compositionDistribution.simple > metrics.imageCount * 0.5) {
      recommendations.push(
        lang === 'EN' ? `Diversify composition: you have ${metrics.compositionDistribution.simple} simple compositions. Add complex compositions like layered flat lays, multi-subject scenes, or textured close-ups for ${contentType || 'your content type'}.` :
        lang === 'PT-BR' ? `Diversifique a composição: você tem ${metrics.compositionDistribution.simple} composições simples. Adicione composições complexas como flat lays em camadas, cenas com múltiplos assuntos ou close-ups texturizados para ${contentType || 'seu tipo de conteúdo'}.` :
        lang === 'ES' ? `Diversifica la composición: tienes ${metrics.compositionDistribution.simple} composiciones simples. Agrega composiciones complejas como flat lays en capas, escenas con múltiples sujetos o primeros planos texturizados para ${contentType || 'tu tipo de contenido'}.` :
        `Diversifiez la composition : vous avez ${metrics.compositionDistribution.simple} compositions simples. Ajoutez des compositions complexes comme des flat lays en couches, des scènes multi-sujets ou des gros plans texturés pour ${contentType || 'votre type de contenu'}.`
      );
    } else {
      recommendations.push(
        lang === 'EN' ? `With saturation variance of ${metrics.saturationVariance.toFixed(1)}, consider creating a more cohesive color story. For ${desiredVibe || 'better consistency'}, maintain saturation levels within a 15-20% range across your grid.` :
        lang === 'PT-BR' ? `Com variância de saturação de ${metrics.saturationVariance.toFixed(1)}, considere criar uma narrativa de cor mais coesa. Para ${desiredVibe || 'melhor consistência'}, mantenha níveis de saturação dentro de uma faixa de 15-20% em todo o grid.` :
        lang === 'ES' ? `Con varianza de saturación de ${metrics.saturationVariance.toFixed(1)}, considera crear una narrativa de color más cohesiva. Para ${desiredVibe || 'mejor consistencia'}, mantén niveles de saturación dentro de un rango de 15-20% en todo el grid.` :
        `Avec une variance de saturation de ${metrics.saturationVariance.toFixed(1)}, envisagez de créer une histoire de couleur plus cohérente. Pour ${desiredVibe || 'une meilleure cohérence'}, maintenez les niveaux de saturation dans une plage de 15-20% sur toute votre grille.`
      );
    }
  }
  
  return recommendations.slice(0, 3);
}

/**
 * Generate metric-grounded next post guidance
 */
function generateMetricGroundedNextPostGuidance(context: FeedAnalysisContext): string {
  const { language, metrics, breakdown, contentType, desiredVibe } = context;
  const lang = language;
  
  if (breakdown.colorBalance.score < 6 && metrics.avgBrightness < 50) {
    return lang === 'EN'
      ? `A bright, minimal post (brightness 70-85%) with natural light would help balance your current average of ${metrics.avgBrightness.toFixed(1)}%. Try a clean flat lay or simple portrait.`
      : lang === 'PT-BR'
      ? `Uma postagem clara e minimalista (brilho 70-85%) com luz natural ajudaria a equilibrar sua média atual de ${metrics.avgBrightness.toFixed(1)}%. Tente um flat lay limpo ou retrato simples.`
      : lang === 'ES'
      ? `Una publicación clara y minimalista (brillo 70-85%) con luz natural ayudaría a equilibrar tu promedio actual de ${metrics.avgBrightness.toFixed(1)}%. Prueba un flat lay limpio o retrato simple.`
      : `Une publication claire et minimaliste (luminosité 70-85%) avec une lumière naturelle aiderait à équilibrer votre moyenne actuelle de ${metrics.avgBrightness.toFixed(1)}%. Essayez un flat lay propre ou un portrait simple.`;
  }
  
  if (metrics.avgContrast < 35) {
    return lang === 'EN'
      ? `A high-contrast image (contrast 50-65%) would improve readability. For ${contentType || 'your content'}, try a close-up detail shot with side lighting or a graphic element with strong light-dark separation.`
      : lang === 'PT-BR'
      ? `Uma imagem de alto contraste (contraste 50-65%) melhoraria a legibilidade. Para ${contentType || 'seu conteúdo'}, tente um close-up detalhado com iluminação lateral ou um elemento gráfico com forte separação claro-escuro.`
      : lang === 'ES'
      ? `Una imagen de alto contraste (contraste 50-65%) mejoraría la legibilidad. Para ${contentType || 'tu contenido'}, prueba un primer plano detallado con iluminación lateral o un elemento gráfico con fuerte separación claro-oscuro.`
      : `Une image à fort contraste (contraste 50-65%) améliorerait la lisibilité. Pour ${contentType || 'votre contenu'}, essayez un gros plan détaillé avec un éclairage latéral ou un élément graphique avec une forte séparation clair-sombre.`;
  }
  
  if (metrics.compositionDistribution.simple > metrics.imageCount * 0.6) {
    return lang === 'EN'
      ? `A complex composition would add variety. Try a layered flat lay, multi-subject scene, or detailed close-up with multiple focal points to contrast with your ${metrics.compositionDistribution.simple} simple compositions.`
      : lang === 'PT-BR'
      ? `Uma composição complexa adicionaria variedade. Tente um flat lay em camadas, cena com múltiplos assuntos ou close-up detalhado com múltiplos pontos focais para contrastar com suas ${metrics.compositionDistribution.simple} composições simples.`
      : lang === 'ES'
      ? `Una composición compleja agregaría variedad. Prueba un flat lay en capas, escena con múltiples sujetos o primer plano detallado con múltiples puntos focales para contrastar con tus ${metrics.compositionDistribution.simple} composiciones simples.`
      : `Une composition complexe ajouterait de la variété. Essayez un flat lay en couches, une scène multi-sujets ou un gros plan détaillé avec plusieurs points focaux pour contraster avec vos ${metrics.compositionDistribution.simple} compositions simples.`;
  }
  
  return lang === 'EN'
    ? `A post that maintains your current ${desiredVibe || 'aesthetic'} (brightness ${metrics.avgBrightness.toFixed(1)}%, contrast ${metrics.avgContrast.toFixed(1)}%) would strengthen consistency. Consider a similar composition style with your ${metrics.dominantPalette} color palette.`
    : lang === 'PT-BR'
    ? `Uma postagem que mantenha sua ${desiredVibe || 'estética'} atual (brilho ${metrics.avgBrightness.toFixed(1)}%, contraste ${metrics.avgContrast.toFixed(1)}%) fortaleceria a consistência. Considere um estilo de composição similar com sua paleta de cores ${metrics.dominantPalette}.`
    : lang === 'ES'
    ? `Una publicación que mantenga tu ${desiredVibe || 'estética'} actual (brillo ${metrics.avgBrightness.toFixed(1)}%, contraste ${metrics.avgContrast.toFixed(1)}%) fortalecería la consistencia. Considera un estilo de composición similar con tu paleta de colores ${metrics.dominantPalette}.`
    : `Une publication qui maintient votre ${desiredVibe || 'esthétique'} actuelle (luminosité ${metrics.avgBrightness.toFixed(1)}%, contraste ${metrics.avgContrast.toFixed(1)}%) renforcerait la cohérence. Envisagez un style de composition similaire avec votre palette de couleurs ${metrics.dominantPalette}.`;
}

/**
 * Generate complete metric-grounded fallback
 */
function generateMetricGroundedFallback(context: FeedAnalysisContext): {
  insights: string[];
  recommendations: string[];
  nextPostGuidance: string;
} {
  return {
    insights: generateMetricGroundedInsights(context),
    recommendations: generateMetricGroundedRecommendations(context),
    nextPostGuidance: generateMetricGroundedNextPostGuidance(context),
  };
}

export async function analyzeFeedGrid(request: AnalyzeRequest): Promise<FeedAnalysisResult> {
  try {
    console.log(`[Feed Analysis Engine] Starting grid analysis for ${request.images.length} images`);
    
    // Process images in smaller batches to avoid overwhelming the system
    // Process 3 images at a time instead of all at once
    const batchSize = 3;
    
    // Overall timeout for image processing (reduced to 20 seconds)
    const imagesTimeoutPromise = new Promise<ImageAnalysis[]>((_, reject) => {
      setTimeout(() => reject(new Error('Image processing timeout')), 20000);
    });
    
    const processImagesPromise = (async () => {
      const analyses: ImageAnalysis[] = [];
      
      for (let i = 0; i < request.images.length; i += batchSize) {
        const batch = request.images.slice(i, i + batchSize);
        console.log(`[Feed Analysis Engine] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(request.images.length / batchSize)} (${batch.length} images)`);
        
        const batchPromises = batch.map((img, batchIndex) => {
          const globalIndex = i + batchIndex;
          console.log(`[Feed Analysis Engine] Analyzing image ${globalIndex + 1}/${request.images.length}`);
          const analysisPromise = analyzeImage(img);
          const timeoutPromise = new Promise<ImageAnalysis>((_, reject) => {
            setTimeout(() => reject(new Error(`Image ${globalIndex + 1} analysis timeout`)), 3000); // Reduced to 3s per image
          });
          
          return Promise.race([analysisPromise, timeoutPromise]).catch((error) => {
            console.error(`[Feed Analysis Engine] Error analyzing image ${globalIndex + 1}:`, error.message);
            // Return default analysis if one image fails
            return {
              dominantColors: [[128, 128, 128]],
              brightness: 50,
              contrast: 30,
              saturation: 20,
              composition: 'balanced' as const,
            };
          });
        });
        
        const batchResults = await Promise.all(batchPromises);
        analyses.push(...batchResults);
      }
      return analyses;
    })();
    
    let analyses: ImageAnalysis[];
    try {
      const analysesResult = await Promise.race([
        processImagesPromise,
        imagesTimeoutPromise
      ]) as ImageAnalysis[];
      
      analyses = analysesResult || [];
    } catch (error: any) {
      console.error('[Feed Analysis Engine] Image processing failed or timed out:', error.message);
      // Return default analyses for all images if processing fails
      analyses = request.images.map(() => ({
        dominantColors: [[128, 128, 128]],
        brightness: 50,
        contrast: 30,
        saturation: 20,
        composition: 'balanced' as const,
      }));
    }
    
    // Ensure we have the correct number of analyses
    if (analyses.length !== request.images.length) {
      console.warn(`[Feed Analysis Engine] Expected ${request.images.length} analyses, got ${analyses.length}. Filling with defaults.`);
      while (analyses.length < request.images.length) {
        analyses.push({
          dominantColors: [[128, 128, 128]],
          brightness: 50,
          contrast: 30,
          saturation: 20,
          composition: 'balanced' as const,
        });
      }
    }
    
    console.log('[Feed Analysis Engine] All images analyzed, calculating scores...');
    console.log('[Feed Analysis Engine] Sample analysis data:', {
      firstImage: {
        brightness: analyses[0]?.brightness,
        contrast: analyses[0]?.contrast,
        saturation: analyses[0]?.saturation,
        rgb: analyses[0]?.dominantColors[0],
      },
      lastImage: {
        brightness: analyses[analyses.length - 1]?.brightness,
        contrast: analyses[analyses.length - 1]?.contrast,
        saturation: analyses[analyses.length - 1]?.saturation,
        rgb: analyses[analyses.length - 1]?.dominantColors[0],
      },
    });

    // Calculate scores
    const colorBalance = calculateColorBalance(analyses);
    const visualRhythm = calculateVisualRhythm(analyses);
    const contrastReadability = calculateContrastReadability(analyses);
    const contentVariety = calculateContentVariety(analyses);
    const overallConsistency = calculateOverallConsistency(analyses);
    
    console.log('[Feed Analysis Engine] Calculated scores:', {
      colorBalance: colorBalance.toFixed(2),
      visualRhythm: visualRhythm.toFixed(2),
      contrastReadability: contrastReadability.toFixed(2),
      contentVariety: contentVariety.toFixed(2),
      overallConsistency: overallConsistency.toFixed(2),
    });

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    (colorBalance * 0.2 +
     visualRhythm * 0.2 +
     contrastReadability * 0.15 +
     contentVariety * 0.2 +
     overallConsistency * 0.25) * 10
  );

  // Generate score label
  let scoreLabel: string;
  if (overallScore >= 85) {
    scoreLabel = request.language === 'EN' ? 'Excellent' :
                 request.language === 'PT-BR' ? 'Excelente' :
                 request.language === 'ES' ? 'Excelente' : 'Excellent';
  } else if (overallScore >= 70) {
    scoreLabel = request.language === 'EN' ? 'Good' :
                 request.language === 'PT-BR' ? 'Bom' :
                 request.language === 'ES' ? 'Bueno' : 'Bon';
  } else if (overallScore >= 55) {
    scoreLabel = request.language === 'EN' ? 'Fair' :
                 request.language === 'PT-BR' ? 'Regular' :
                 request.language === 'ES' ? 'Regular' : 'Moyen';
  } else {
    scoreLabel = request.language === 'EN' ? 'Needs Improvement' :
                 request.language === 'PT-BR' ? 'Precisa Melhorar' :
                 request.language === 'ES' ? 'Necesita Mejora' : 'À Améliorer';
  }

  const breakdown = {
    colorBalance: { score: Math.round(colorBalance * 10) / 10, explanation: '' },
    visualRhythm: { score: Math.round(visualRhythm * 10) / 10, explanation: '' },
    contrastReadability: { score: Math.round(contrastReadability * 10) / 10, explanation: '' },
    contentVariety: { score: Math.round(contentVariety * 10) / 10, explanation: '' },
    overallConsistency: { score: Math.round(overallConsistency * 10) / 10, explanation: '' },
  };

    const breakdownWithExplanations = generateExplanations(breakdown, request.language);
    
    // Generate AI-powered insights and recommendations with timeout protection
    let insights: string[];
    let recommendations: string[];
    let nextPostGuidance: string;
    
    // Compute metrics for fallback (always compute, even if AI succeeds)
    const metrics = computeFeedMetrics(analyses);
    const imageStats = analyses.map((analysis, index) => ({
      position: index + 1,
      dominantColor: `RGB(${analysis.dominantColors[0][0]}, ${analysis.dominantColors[0][1]}, ${analysis.dominantColors[0][2]})`,
      brightness: parseFloat(analysis.brightness.toFixed(1)),
      contrast: parseFloat(analysis.contrast.toFixed(1)),
      saturation: parseFloat(analysis.saturation.toFixed(1)),
      composition: analysis.composition,
    }));
    
    const fallbackContext: FeedAnalysisContext = {
      language: request.language,
      contentType: request.contentType,
      desiredVibe: request.desiredVibe,
      breakdown: breakdownWithExplanations,
      metrics,
      imageStats,
    };
    
    try {
      console.log(`[Feed Analysis Engine] Attempting AI generation for language: ${request.language}, contentType: ${request.contentType || 'none'}, vibe: ${request.desiredVibe || 'none'}`);
      
      const aiFeedbackPromise = generateAIPoweredFeedback({
        analyses,
        breakdown: breakdownWithExplanations,
        language: request.language,
        contentType: request.contentType,
        desiredVibe: request.desiredVibe,
      });
      
      // Increased timeout to 30 seconds to give AI more time
      const aiTimeoutPromise = new Promise<{ insights: string[]; recommendations: string[]; nextPostGuidance: string }>((_, reject) => {
        setTimeout(() => reject(new Error('AI feedback timeout after 30 seconds')), 30000);
      });
      
      const aiResult = await Promise.race([aiFeedbackPromise, aiTimeoutPromise]);
      insights = aiResult.insights;
      recommendations = aiResult.recommendations;
      nextPostGuidance = aiResult.nextPostGuidance;
      
      console.log(`[Feed Analysis Engine] ✅ AI generation successful for ${request.language}. Insights: ${insights.length}, Recommendations: ${recommendations.length}`);
    } catch (error: any) {
      console.error(`[Feed Analysis Engine] ❌ AI feedback failed or timed out for ${request.language}:`, error.message);
      console.log(`[Feed Analysis Engine] Using metric-grounded fallback for ${request.language}`);
      
      // Use metric-grounded fallback (NOT generic templates)
      const fallback = generateMetricGroundedFallback(fallbackContext);
      insights = fallback.insights;
      recommendations = fallback.recommendations;
      nextPostGuidance = fallback.nextPostGuidance;
    }

    console.log('[Feed Analysis Engine] Analysis complete');
    
    return {
      score: overallScore,
      scoreLabel,
      breakdown: breakdownWithExplanations,
      insights,
      recommendations,
      nextPostGuidance,
    };
  } catch (error: any) {
    console.error('[Feed Analysis Engine] Error in analyzeFeedGrid:', error);
    console.error('[Feed Analysis Engine] Error stack:', error.stack);
    throw error;
  }
}

interface AIPoweredFeedbackParams {
  analyses: ImageAnalysis[];
  breakdown: FeedAnalysisResult['breakdown'];
  language: 'EN' | 'FR' | 'PT-BR' | 'ES';
  contentType?: string;
  desiredVibe?: string;
}

/**
 * Repair malformed JSON (fixes common issues like unquoted hashtags)
 */
function repairJsonString(jsonString: string): string {
  let repaired = jsonString.trim();
  
  // Remove markdown code fences if present
  repaired = repaired.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  
  // Fix unquoted hashtags in arrays: #tag -> "#tag"
  repaired = repaired.replace(/(\[[^\]]*)(#\w+)([^\]]*\])/g, (match, before, hashtag, after) => {
    return before + `"${hashtag}"` + after;
  });
  
  // Fix trailing commas
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  return repaired.trim();
}

async function generateAIPoweredFeedback(params: AIPoweredFeedbackParams): Promise<{
  insights: string[];
  recommendations: string[];
  nextPostGuidance: string;
}> {
  const { analyses, breakdown, language, contentType, desiredVibe } = params;
  
  // Check if DeepSeek is configured
  const deepSeekKey = process.env.DEEPSEEK_API_KEY?.trim();
  const deepSeekBaseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const deepSeekModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  
  // Compute detailed metrics
  const metrics = computeFeedMetrics(analyses);
  
  // Prepare image stats
  const imageStats = analyses.map((analysis, index) => ({
    position: index + 1,
    dominantColor: `RGB(${analysis.dominantColors[0][0]}, ${analysis.dominantColors[0][1]}, ${analysis.dominantColors[0][2]})`,
    brightness: parseFloat(analysis.brightness.toFixed(1)),
    contrast: parseFloat(analysis.contrast.toFixed(1)),
    saturation: parseFloat(analysis.saturation.toFixed(1)),
    composition: analysis.composition,
  }));
  
  // Build context for prompts
  const context: FeedAnalysisContext = {
    language,
    contentType,
    desiredVibe,
    breakdown,
    metrics,
    imageStats,
  };
  
  if (!deepSeekKey) {
    console.log('[Feed Analysis Engine] DeepSeek not configured, using metric-grounded fallback');
    return generateMetricGroundedFallback(context);
  }
  
  try {
    // Build prompts using centralized system
    const systemPrompt = buildFeedAnalyzerSystemPrompt(context);
    const userPrompt = buildFeedAnalyzerUserPrompt(context);
    
    console.log(`[Feed Analysis Engine] 🔵 Calling DeepSeek API for ${language}...`);
    console.log(`[Feed Analysis Engine]    - Content Type: ${contentType || 'none'}`);
    console.log(`[Feed Analysis Engine]    - Desired Vibe: ${desiredVibe || 'none'}`);
    console.log(`[Feed Analysis Engine]    - Metrics: brightness ${metrics.avgBrightness.toFixed(1)}%, contrast ${metrics.avgContrast.toFixed(1)}%, saturation ${metrics.avgSaturation.toFixed(1)}%`);
    console.log(`[Feed Analysis Engine]    - System prompt length: ${systemPrompt.length} chars`);
    console.log(`[Feed Analysis Engine]    - User prompt length: ${userPrompt.length} chars`);
    
    // Call DeepSeek with timeout
    const aiResponsePromise = callDeepSeek({
      systemPrompt,
      userPrompt,
      baseUrl: deepSeekBaseUrl,
      apiKey: deepSeekKey,
      model: deepSeekModel,
    });
    
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('API timeout after 30 seconds')), 30000);
    });
    
    let aiResponse: string;
    try {
      aiResponse = await Promise.race([aiResponsePromise, timeoutPromise]);
      console.log(`[Feed Analysis Engine] ✅ DeepSeek response received for ${language}, length: ${aiResponse.length} chars`);
      console.log(`[Feed Analysis Engine]    First 200 chars: ${aiResponse.substring(0, 200)}...`);
    } catch (error: any) {
      // Check error code
      if (error.code === 'INSUFFICIENT_BALANCE' || error.code === 'UNAVAILABLE') {
        console.warn('[Feed Analysis Engine] Provider unavailable, using metric-grounded fallback');
        return generateMetricGroundedFallback(context);
      }
      
      console.error('[Feed Analysis Engine] DeepSeek call failed or timed out:', error.message);
      console.log('[Feed Analysis Engine] Falling back to metric-grounded analysis');
      return generateMetricGroundedFallback(context);
    }
    
    // Parse JSON with repair logic
    let parsed: any;
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      try {
        const jsonToParse = attempts === 0 ? aiResponse : repairJsonString(aiResponse);
        parsed = JSON.parse(jsonToParse);
        break; // Success
      } catch (parseError: any) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error('[Feed Analysis Engine] Failed to parse JSON after repairs, using fallback');
          return generateMetricGroundedFallback(context);
        }
        // Try repair and retry
        aiResponse = repairJsonString(aiResponse);
        console.log(`[Feed Analysis Engine] JSON parse failed, attempting repair (attempt ${attempts + 1}/${maxAttempts})...`);
      }
    }
    
    // Validate response structure
    if (!parsed || typeof parsed !== 'object') {
      console.error('[Feed Analysis Engine] Invalid response structure, using fallback');
      return generateMetricGroundedFallback(context);
    }
    
    // Extract and validate insights
    let insights: string[] = [];
    if (Array.isArray(parsed.insights) && parsed.insights.length >= 3) {
      insights = parsed.insights
        .filter((i: any) => typeof i === 'string' && i.trim().length > 0)
        .map((i: string) => i.trim())
        .slice(0, 5);
    }
    
    if (insights.length < 3) {
      console.warn('[Feed Analysis Engine] Insufficient insights from AI, supplementing with fallback');
      const fallbackInsights = generateMetricGroundedInsights(context);
      insights = [...insights, ...fallbackInsights].slice(0, 5);
    }
    
    // Extract and validate recommendations
    let recommendations: string[] = [];
    if (Array.isArray(parsed.recommendations) && parsed.recommendations.length >= 3) {
      recommendations = parsed.recommendations
        .filter((r: any) => typeof r === 'string' && r.trim().length > 0)
        .map((r: string) => r.trim());
    }
    
    // Remove duplicates (case-insensitive)
    const uniqueRecommendations: string[] = [];
    const seen = new Set<string>();
    for (const rec of recommendations) {
      const normalized = rec.trim().toLowerCase();
      if (!seen.has(normalized) && rec.trim().length > 0) {
        seen.add(normalized);
        uniqueRecommendations.push(rec.trim());
      }
    }
    
    // Ensure exactly 3 unique recommendations
    if (uniqueRecommendations.length < 3) {
      const fallbackRecs = generateMetricGroundedRecommendations(context);
      for (const rec of fallbackRecs) {
        const normalized = rec.trim().toLowerCase();
        if (!seen.has(normalized) && uniqueRecommendations.length < 3) {
          seen.add(normalized);
          uniqueRecommendations.push(rec.trim());
        }
      }
    }
    
    recommendations = uniqueRecommendations.slice(0, 3);
    
    // Extract next post guidance
    const nextPostGuidance = typeof parsed.nextPostGuidance === 'string' && parsed.nextPostGuidance.trim()
      ? parsed.nextPostGuidance.trim()
      : generateMetricGroundedNextPostGuidance(context);
    
    console.log(`[Feed Analysis Engine] AI-powered feedback generated successfully for ${language}`);
    
    return { insights, recommendations, nextPostGuidance };
  } catch (error: any) {
    console.error('[Feed Analysis Engine] Error generating AI feedback:', error);
    console.log('[Feed Analysis Engine] Falling back to metric-grounded analysis');
    return generateMetricGroundedFallback(context);
  }
}

