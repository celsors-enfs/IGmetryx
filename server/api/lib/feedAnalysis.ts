import { analyzeFeedGrid } from './feedAnalysisEngine.js';

interface AnalyzeFeedRequest {
  images: Express.Multer.File[];
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

export async function analyzeFeedImages(request: AnalyzeFeedRequest): Promise<FeedAnalysisResult> {
  // Add global timeout wrapper (60 seconds total)
  const analysisPromise = (async () => {
    try {
      console.log('[Feed Analysis] Converting images for analysis...');
      
      // Convert images to base64 for analysis
      const imageData = request.images.map(img => ({
        buffer: img.buffer,
        mimetype: img.mimetype,
      }));

      console.log(`[Feed Analysis] Analyzing ${imageData.length} images...`);

      // Analyze the feed grid
      const result = await analyzeFeedGrid({
        images: imageData,
        imageCount: request.imageCount,
        contentType: request.contentType,
        desiredVibe: request.desiredVibe,
        language: request.language,
      });

      console.log('[Feed Analysis] Analysis completed');
      return result;
    } catch (error: any) {
      console.error('[Feed Analysis] Error in analyzeFeedImages:', error);
      console.error('[Feed Analysis] Error stack:', error.stack);
      throw error;
    }
  })();

  // Global timeout of 40 seconds (reduced for faster response)
  const timeoutPromise = new Promise<FeedAnalysisResult>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Analysis timeout after 40 seconds'));
    }, 40000);
  });

  try {
    return await Promise.race([analysisPromise, timeoutPromise]);
  } catch (error: any) {
    console.error('[Feed Analysis] Analysis failed or timed out:', error.message);
    // Return a basic result instead of throwing
    return {
      score: 50,
      scoreLabel: request.language === 'EN' ? 'Fair' :
                  request.language === 'PT-BR' ? 'Regular' :
                  request.language === 'ES' ? 'Regular' : 'Moyen',
      breakdown: {
        colorBalance: { 
          score: 5, 
          explanation: request.language === 'EN' ? 'Analysis incomplete due to timeout.' :
                       request.language === 'PT-BR' ? 'Análise incompleta devido a timeout.' :
                       request.language === 'ES' ? 'Análisis incompleto debido a timeout.' :
                       'Analyse incomplète due à un timeout.'
        },
        visualRhythm: { 
          score: 5, 
          explanation: request.language === 'EN' ? 'Analysis incomplete due to timeout.' :
                       request.language === 'PT-BR' ? 'Análise incompleta devido a timeout.' :
                       request.language === 'ES' ? 'Análisis incompleto debido a timeout.' :
                       'Analyse incomplète due à un timeout.'
        },
        contrastReadability: { 
          score: 5, 
          explanation: request.language === 'EN' ? 'Analysis incomplete due to timeout.' :
                       request.language === 'PT-BR' ? 'Análise incompleta devido a timeout.' :
                       request.language === 'ES' ? 'Análisis incompleto debido a timeout.' :
                       'Analyse incomplète due à un timeout.'
        },
        contentVariety: { 
          score: 5, 
          explanation: request.language === 'EN' ? 'Analysis incomplete due to timeout.' :
                       request.language === 'PT-BR' ? 'Análise incompleta devido a timeout.' :
                       request.language === 'ES' ? 'Análisis incompleto debido a timeout.' :
                       'Analyse incomplète due à un timeout.'
        },
        overallConsistency: { 
          score: 5, 
          explanation: request.language === 'EN' ? 'Analysis incomplete due to timeout.' :
                       request.language === 'PT-BR' ? 'Análise incompleta devido a timeout.' :
                       request.language === 'ES' ? 'Análisis incompleto debido a timeout.' :
                       'Analyse incomplète due à un timeout.'
        },
      },
      insights: [
        request.language === 'EN' ? 'Analysis timed out. Please try again with fewer images.' :
        request.language === 'PT-BR' ? 'Análise expirou. Tente novamente com menos imagens.' :
        request.language === 'ES' ? 'Análisis expiró. Intente nuevamente con menos imágenes.' :
        'L\'analyse a expiré. Réessayez avec moins d\'images.'
      ],
      recommendations: [
        request.language === 'EN' ? 'Try uploading fewer images or check your internet connection.' :
        request.language === 'PT-BR' ? 'Tente enviar menos imagens ou verifique sua conexão com a internet.' :
        request.language === 'ES' ? 'Intente subir menos imágenes o verifique su conexión a internet.' :
        'Essayez de télécharger moins d\'images ou vérifiez votre connexion Internet.'
      ],
      nextPostGuidance: request.language === 'EN' ? 'Please try the analysis again.' :
                       request.language === 'PT-BR' ? 'Tente a análise novamente.' :
                       request.language === 'ES' ? 'Intente el análisis nuevamente.' :
                       'Réessayez l\'analyse.'
    };
  }
}

