import React, { useState, useRef, useEffect } from 'react';
import { NavigationHeader } from '../components/generated/NavigationHeader';
import { FooterSection } from '../components/generated/FooterSection';
import { ToolNavBar } from '../components/ToolNavBar';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { startAnalysis, pollForResult } from '../lib/feedAnalyzerAsync';
import { compressImages } from '../lib/imageCompressor';

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

export const FeedAnalyzerPage = () => {
  const { t, tx, language } = useLanguage();
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [contentType, setContentType] = useState<string>('');
  const [desiredVibe, setDesiredVibe] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<FeedAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pollingAborted, setPollingAborted] = useState(false);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingAbortRef = useRef(false);

  const validImageCounts = [9, 12, 15];
  const targetCount = validImageCounts[0]; // Default to 9, user can change

  // Scroll to top when analysis results appear
  useEffect(() => {
    if (analysisResult) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
          // Also scroll document elements for compatibility
          if (document.documentElement) {
            document.documentElement.scrollTop = 0;
          }
          if (document.body) {
            document.body.scrollTop = 0;
          }
        });
      });
    }
  }, [analysisResult]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setError(t('feed.error.invalidFile') || 'Please select valid image files.');
      return;
    }

    const totalImages = images.length + imageFiles.length;
    if (totalImages > 15) {
      setError(t('feed.error.tooManyImages') || 'Maximum 15 images allowed.');
      return;
    }

    const newImages = [...images, ...imageFiles];
    setImages(newImages);

    // Create previews
    const newPreviews: string[] = [];
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          if (newPreviews.length === imageFiles.length) {
            setImagePreviews([...imagePreviews, ...newPreviews]);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    setError(null);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const newPreviews = [...imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setError(t('feed.error.invalidFile') || 'Please select valid image files.');
      return;
    }

    const totalImages = images.length + imageFiles.length;
    if (totalImages > 15) {
      setError(t('feed.error.tooManyImages') || 'Maximum 15 images allowed.');
      return;
    }

    const newImages = [...images, ...imageFiles];
    setImages(newImages);

    // Create previews
    const newPreviews: string[] = [];
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          if (newPreviews.length === imageFiles.length) {
            setImagePreviews([...imagePreviews, ...newPreviews]);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    setError(null);
  };

  const handleCancel = () => {
    pollingAbortRef.current = true;
    setPollingAborted(true);
    setIsAnalyzing(false);
    setAnalysisProgress(0);
    setAnalysisStatus('');
    setError(null);
  };

  const handleAnalyze = async () => {
    if (images.length < 9) {
      setError(t('feed.error.minImages') || 'Please upload at least 9 images.');
      return;
    }

    if (!validImageCounts.includes(images.length)) {
      setError(t('feed.error.invalidCount') || 'Please upload 9, 12, or 15 images.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setAnalysisProgress(0);
    setAnalysisStatus(t('feed.state.uploading') || 'Uploading images...');
    pollingAbortRef.current = false;
    setPollingAborted(false);

    try {
      // Step 1: Compress images client-side
      setAnalysisStatus(t('feed.state.uploading') || 'Uploading images...');
      setAnalysisProgress(5);
      
      const compressed = await compressImages(images);
      const compressedFiles = compressed.map(c => c.file);
      
      setAnalysisProgress(10);
      
      // Step 2: Start analysis job
      setAnalysisStatus(t('feed.state.processing') || 'Processing your feed...');
      
      const jobId = await startAnalysis({
        images: compressedFiles,
        imageCount: images.length,
        contentType: contentType || undefined,
        desiredVibe: desiredVibe || undefined,
        language: (language === 'pt-br' ? 'PT-BR' : language.toUpperCase()) as 'EN' | 'FR' | 'PT-BR' | 'ES',
      });
      
      // Step 3: Poll for results
      const result = await pollForResult(jobId, (progress, status) => {
        if (pollingAbortRef.current) {
          throw new Error('CANCELLED');
        }
        
        setAnalysisProgress(Math.max(10, progress));
        
        if (status === 'processing') {
          if (progress < 80) {
            setAnalysisStatus(t('feed.state.processing') || 'Processing your feed...');
          } else {
            setAnalysisStatus(t('feed.state.finalizing') || 'Finalizing analysis...');
          }
        }
      });
      
      if (pollingAbortRef.current) {
        return;
      }
      
      setAnalysisProgress(100);
      setAnalysisStatus(t('feed.state.done') || 'Analysis complete');
      setAnalysisResult(result);
      
      // Scroll to top when results appear
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
          if (document.documentElement) {
            document.documentElement.scrollTop = 0;
          }
          if (document.body) {
            document.body.scrollTop = 0;
          }
        });
      });
    } catch (err: any) {
      if (pollingAbortRef.current || err.message === 'CANCELLED') {
        return; // User cancelled, don't show error
      }
      
      console.error('[Feed Analyzer] Error:', err);
      
      let errorMessage = t('feed.error.generic') || 'Something went wrong. Please try again.';
      
      // Map error codes to localized messages
      if (err.code === 'TIMEOUT' || err.message === 'POLL_TIMEOUT') {
        errorMessage = t('feed.error.timeout') || 'This is taking longer than expected. Please try again.';
      } else if (err.code === 'TOO_LARGE' || err.message?.includes('too large')) {
        errorMessage = t('feed.error.tooLarge') || 'Some images are too large. Please upload smaller files.';
      } else if (err.code === 'RATE_LIMIT' || err.code === 'RATE_LIMITED' || err.status === 429) {
        // Use server message if available (already i18n), otherwise fallback
        if (err.message && err.message !== 'Failed to start analysis') {
          errorMessage = err.message;
        } else {
          errorMessage = t('feed.error.rateLimit') || 'High demand right now. Please try again in a moment.';
        }
      } else if (err.code === 'INSUFFICIENT_BALANCE' || err.code === 'UNAVAILABLE') {
        errorMessage = t('feed.error.unavailable') || 'Service temporarily unavailable. Please try again later.';
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('fetch') || err.message?.includes('Failed to fetch')) {
        errorMessage = t('feed.error.network') || 'Connection issue. Please check your internet and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      if (!pollingAbortRef.current) {
        setIsAnalyzing(false);
        setAnalysisProgress(0);
        setAnalysisStatus('');
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 55) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return t('feed.score.excellent') || 'Excellent';
    if (score >= 70) return t('feed.score.good') || 'Good';
    if (score >= 55) return t('feed.score.fair') || 'Fair';
    return t('feed.score.needsImprovement') || 'Needs Improvement';
  };

  return (
    <div className="relative min-h-screen w-full bg-white font-sans overflow-hidden pt-20">
      <NavigationHeader />

      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-gray-900 leading-[1.1] mb-6">
              {t('feed.title') || 'Feed Analyzer'}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
              {t('feed.subtitle') || 'Understand how your Instagram feed looks as a visual grid and how to improve it before posting.'}
            </p>
          </div>

          {/* Upload Section */}
          {!analysisResult && (
            <div className="max-w-2xl mx-auto mb-12">
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                {/* Image Upload Area */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {t('feed.upload.label') || 'Upload Images'}
                  </label>
                  <p className="text-sm text-gray-500 mb-4">
                    {t('feed.upload.helper') || 'Upload 9, 12, or 15 images to analyze your feed grid.'}
                  </p>

                  {/* Image Grid Preview */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ cursor: 'pointer' }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Area with Drag and Drop */}
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                      isDragging
                        ? 'border-purple-500 bg-purple-100/50'
                        : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-full flex flex-col items-center justify-center"
                      style={{ cursor: 'pointer' }}
                    >
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-purple-600' : 'text-gray-400'}`} />
                      <p className={`text-sm ${isDragging ? 'text-purple-700 font-medium' : 'text-gray-600'}`}>
                        {isDragging
                          ? (t('feed.upload.dropHere') || 'Drop images here')
                          : images.length > 0
                          ? `${t('feed.upload.addMore') || 'Add more images'} (${images.length}/15)`
                          : (t('feed.upload.clickToUpload') || 'Click to upload images or drag and drop')
                        }
                      </p>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Optional Context */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      {t('feed.context.contentType') || 'Content Type (Optional)'}
                    </label>
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">{t('feed.context.select') || 'Select...'}</option>
                      <option value="personal">{t('feed.context.personal') || 'Personal Brand'}</option>
                      <option value="business">{t('feed.context.business') || 'Business'}</option>
                      <option value="creator">{t('feed.context.creator') || 'Creator'}</option>
                      <option value="portfolio">{t('feed.context.portfolio') || 'Portfolio'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      {t('feed.context.vibe') || 'Desired Vibe (Optional)'}
                    </label>
                    <select
                      value={desiredVibe}
                      onChange={(e) => setDesiredVibe(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="">{t('feed.context.select') || 'Select...'}</option>
                      <option value="clean">{t('feed.context.clean') || 'Clean'}</option>
                      <option value="bold">{t('feed.context.bold') || 'Bold'}</option>
                      <option value="editorial">{t('feed.context.editorial') || 'Editorial'}</option>
                      <option value="minimal">{t('feed.context.minimal') || 'Minimal'}</option>
                    </select>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Analyze Button */}
                <div className="space-y-3">
                  {isAnalyzing && (
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#4338ca] h-full transition-all duration-300 ease-out"
                        style={{ width: `${analysisProgress}%` }}
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || images.length < 9}
                      className="flex-1 bg-[#4338ca] text-white pl-6 pr-2 py-2 rounded-full text-base font-medium hover:bg-[#3730a3] transition-all duration-300 flex items-center gap-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ cursor: (isAnalyzing || images.length < 9) ? 'not-allowed' : 'pointer' }}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{analysisStatus || (t('feed.analyzing') || 'Analyzing...')}</span>
                        </>
                      ) : (
                        <>
                          {t('feed.analyze') || 'Analyze Feed'}
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-black" />
                          </div>
                        </>
                      )}
                    </button>
                    
                    {isAnalyzing && (
                      <button
                        onClick={handleCancel}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full text-base font-medium hover:bg-gray-50 transition-all duration-300"
                        style={{ cursor: 'pointer' }}
                      >
                        {t('feed.cta.cancel') || 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {analysisResult && (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Feed Score */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {t('feed.results.score') || 'Feed Score'}
                </h2>
                <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-xl ${getScoreColor(analysisResult.score)}`}>
                  <span className="text-4xl font-bold">{analysisResult.score}</span>
                  <span className="text-lg">/ 100</span>
                  <span className="text-lg font-medium">— {analysisResult.scoreLabel}</span>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  {t('feed.results.breakdown') || 'Score Breakdown'}
                </h2>
                <div className="space-y-4">
                  {Object.entries(analysisResult.breakdown).map(([key, value]) => (
                    <div key={key} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {t(`feed.breakdown.${key}`) || key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">
                          {value.score} / 10
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{value.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  {t('feed.results.insights') || 'Insights'}
                </h2>
                <ul className="space-y-3">
                  {analysisResult.insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700">{insight}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  {t('feed.results.recommendations') || 'Priority Recommendations'}
                </h2>
                <ol className="space-y-3 list-decimal list-inside">
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index} className="text-gray-700">
                      {rec}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Next Post Guidance */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {t('feed.results.nextPost') || 'Next Post Guidance'}
                </h2>
                <p className="text-gray-700">{analysisResult.nextPostGuidance}</p>
              </div>

              {/* Disclaimer */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <p className="text-sm text-gray-600 text-center">
                  {t('feed.disclaimer') || 'Visual insights are provided to help you plan and improve your content. Results may vary. IGmetryx is not affiliated with Instagram or Meta.'}
                </p>
              </div>

              {/* Analyze Again Button */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setImages([]);
                    setImagePreviews([]);
                    setAnalysisResult(null);
                    setContentType('');
                    setDesiredVibe('');
                    setError(null);
                    
                    // Scroll to top when resetting
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                        if (document.documentElement) {
                          document.documentElement.scrollTop = 0;
                        }
                        if (document.body) {
                          document.body.scrollTop = 0;
                        }
                      });
                    });
                  }}
                  className="bg-white border border-gray-200 text-gray-900 px-6 py-3 rounded-full text-base font-medium hover:bg-gray-50 transition-colors"
                >
                  {t('feed.analyzeAgain') || 'Analyze Another Feed'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Why This Helps Section */}
      <section className="relative px-4 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              {tx('feed.whyThisHelps.title')}
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-purple-600 mt-1">•</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {t('feed.whyThisHelps.item1.title')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('feed.whyThisHelps.item1.description')}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 mt-1">•</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {t('feed.whyThisHelps.item2.title')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('feed.whyThisHelps.item2.description')}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 mt-1">•</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {t('feed.whyThisHelps.item3.title')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('feed.whyThisHelps.item3.description')}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 mt-1">•</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {t('feed.whyThisHelps.item4.title')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('feed.whyThisHelps.item4.description')}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 mt-1">•</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {t('feed.whyThisHelps.item5.title')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('feed.whyThisHelps.item5.description')}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-12 bg-white">
        <ToolNavBar />
      </section>

      {/* How It Works Section */}
      <section className="relative px-4 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-gray-900 mb-4">
              {tx('feed.howItWorks.title')}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light">
              {t('feed.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-3xl p-8 md:p-10 text-left hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group">
              <div className="absolute top-4 right-4 text-[180px] font-bold text-purple-100/40 leading-none select-none">
                1
              </div>
              <div className="relative z-10">
                <div className="text-7xl md:text-8xl font-bold text-purple-600 mb-6 leading-none" style={{ fontWeight: "400" }}>
                  01
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4 leading-tight" style={{
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
                  fontWeight: "400",
                  letterSpacing: "-0.05em",
                  fontSize: "34px"
                }}>
                  {t('feed.howItWorks.step1.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('feed.howItWorks.step1.description')}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-3xl p-8 md:p-10 text-left hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group">
              <div className="absolute top-4 right-4 text-[180px] font-bold text-blue-100/40 leading-none select-none">
                2
              </div>
              <div className="relative z-10">
                <div className="text-7xl md:text-8xl font-bold text-blue-600 mb-6 leading-none" style={{ fontWeight: "400" }}>
                  02
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4 leading-tight" style={{
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
                  fontWeight: "400",
                  letterSpacing: "-0.05em",
                  fontSize: "34px"
                }}>
                  {t('feed.howItWorks.step2.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('feed.howItWorks.step2.description')}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-8 md:p-10 text-left hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group">
              <div className="absolute top-4 right-4 text-[180px] font-bold text-emerald-100/40 leading-none select-none">
                3
              </div>
              <div className="relative z-10">
                <div className="text-7xl md:text-8xl font-bold text-emerald-600 mb-6 leading-none" style={{ fontWeight: "400" }}>
                  03
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4 leading-tight" style={{
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
                  fontWeight: "400",
                  letterSpacing: "-0.05em",
                  fontSize: "34px"
                }}>
                  {t('feed.howItWorks.step3.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('feed.howItWorks.step3.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
              {t('faq.badge') || 'FAQ'}
            </div>
            <h2 className="text-5xl md:text-6xl font-medium tracking-tight text-gray-900 mb-4">
              {t('faq.title.main') || t('faq.title')}{' '}
              <span
                className="font-serif italic font-light text-gray-600"
                style={{
                  fontFamily: 'Noto Serif Display',
                  fontWeight: '200',
                }}
              >
                {t('faq.title.highlight') || ''}
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              {t('feed.faq.subtitle')}
            </p>
          </div>

          <div className="space-y-4">
            {[
              { question: t('feed.faq.q1'), answer: t('feed.faq.a1') },
              { question: t('feed.faq.q2'), answer: t('feed.faq.a2') },
              { question: t('feed.faq.q3'), answer: t('feed.faq.a3') },
              { question: t('feed.faq.q4'), answer: t('feed.faq.a4') },
              { question: t('feed.faq.q5'), answer: t('feed.faq.a5') },
            ].map((faq, index) => (
              <div key={index} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-300">
                <button 
                  onClick={() => setOpenFAQIndex(openFAQIndex === index ? null : index)} 
                  className="w-full px-6 md:px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors duration-200"
                >
                  <span className="text-lg md:text-xl font-semibold text-gray-900 pr-8">
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-6 h-6 text-gray-500 shrink-0 transition-transform duration-300 ${openFAQIndex === index ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFAQIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-6 md:px-8 pb-6 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

