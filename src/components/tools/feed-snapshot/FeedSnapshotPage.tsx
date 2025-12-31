import React, { useState, useEffect } from 'react';
import { NavigationHeader } from '../../generated/NavigationHeader';
import { FooterSection } from '../../generated/FooterSection';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Download, Camera, CheckCircle, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import {
  checkExtensionInstalled,
  startCapture,
  stopCapture,
  setupProgressListener,
  type CaptureProgress,
  type CaptureStep,
} from './FeedSnapshotExtensionBridge';

export const FeedSnapshotPage = () => {
  const { t } = useLanguage();
  const [extensionInstalled, setExtensionInstalled] = useState<boolean | null>(null);
  const [step, setStep] = useState<CaptureStep>('ready');
  const [progress, setProgress] = useState<CaptureProgress | null>(null);
  const [snapshotDataUrl, setSnapshotDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);

  // Check extension on mount
  useEffect(() => {
    checkExtensionInstalled().then(installed => {
      setExtensionInstalled(installed);
      if (!installed) {
        setError(t('feedSnapshot.extension.notInstalled'));
      }
    });
  }, []);

  // Set up progress listener
  useEffect(() => {
    const cleanup = setupProgressListener((progressUpdate) => {
      setProgress(progressUpdate);
      setStep(progressUpdate.step);
      
      if (progressUpdate.error) {
        // Check if extension was reloaded
        if (progressUpdate.error.code === 'EXTENSION_RELOADED') {
          setError('Extension was reloaded. Please refresh this page and try again.');
          setExtensionInstalled(false);
        } else {
          setError(progressUpdate.error.message);
        }
      }
      
      if (progressUpdate.pngDataUrl) {
        setSnapshotDataUrl(progressUpdate.pngDataUrl);
      }
    });

    return cleanup;
  }, []);

  const handleStartCapture = async () => {
    setError(null);
    setStep('capturing');
    setSnapshotDataUrl(null);
    
    try {
      await startCapture({
        cropTop: 0,
        maxHeight: 50000,
      });
    } catch (err: any) {
      setError(err.message || t('feedSnapshot.error.startFailed'));
      setStep('error');
    }
  };

  const handleStopCapture = async () => {
    try {
      await stopCapture();
      setStep('stopped');
    } catch (err: any) {
      setError(err.message || t('feedSnapshot.error.stopFailed'));
    }
  };

  const handleDownload = () => {
    if (!snapshotDataUrl) return;

    const link = document.createElement('a');
    link.href = snapshotDataUrl;
    link.download = `igmetryx-feed-snapshot-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCaptureAgain = () => {
    setStep('ready');
    setProgress(null);
    setSnapshotDataUrl(null);
    setError(null);
  };

  const toggleFAQ = (index: number) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  const faqData = [
    {
      question: t('feedSnapshot.faq.q1'),
      answer: t('feedSnapshot.faq.a1'),
    },
    {
      question: t('feedSnapshot.faq.q2'),
      answer: t('feedSnapshot.faq.a2'),
    },
    {
      question: t('feedSnapshot.faq.q3'),
      answer: t('feedSnapshot.faq.a3'),
    },
    {
      question: t('feedSnapshot.faq.q4'),
      answer: t('feedSnapshot.faq.a4'),
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-white font-sans overflow-hidden pt-20">
      <NavigationHeader />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-gray-900 leading-[1.1] mb-6">
              {t('feedSnapshot.title')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
              {t('feedSnapshot.subtitle')}
            </p>
          </div>

          {/* Main Tool Area */}
          <div className="max-w-2xl mx-auto mb-20">
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              {/* Extension Not Installed */}
              {extensionInstalled === false && (
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    {t('feedSnapshot.extension.notInstalledTitle')}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {t('feedSnapshot.extension.notInstalledDescription')}
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left text-sm text-gray-700">
                    <p className="font-semibold mb-2">{t('feedSnapshot.extension.installSteps')}:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>{t('feedSnapshot.extension.step1')}</li>
                      <li>{t('feedSnapshot.extension.step2')}</li>
                      <li>{t('feedSnapshot.extension.step3')}</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Ready State */}
              {extensionInstalled && step === 'ready' && !snapshotDataUrl && (
                <div className="text-center">
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Camera className="w-10 h-10 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      {t('feedSnapshot.ready.title')}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {t('feedSnapshot.ready.description')}
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-left text-sm text-yellow-800">
                      <p className="font-semibold mb-2">⚠️ Important - Required Steps:</p>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>Open an Instagram profile page (https://www.instagram.com/username) in a new tab</li>
                        <li><strong>Click on the Instagram tab to make it active</strong></li>
                        <li><strong>Click the extension icon</strong> in the Chrome toolbar (this activates permissions)</li>
                        <li>Come back to this page and click "Capture Snapshot"</li>
                      </ol>
                      <p className="mt-2 text-xs text-yellow-700">Note: You must click the extension icon once to activate permissions for the active tab.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartCapture}
                    className="group bg-[#4338ca] text-white pl-6 pr-2 py-2 rounded-full text-base font-medium hover:bg-[#3730a3] transition-all duration-300 flex items-center gap-3 hover:scale-105 mx-auto"
                  >
                    <Camera className="w-5 h-5" />
                    {t('feedSnapshot.button.capture')}
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
                      <Download className="w-5 h-5 text-black" />
                    </div>
                  </button>
                </div>
              )}

              {/* Capturing State */}
              {step === 'capturing' && (
                <div className="text-center">
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                      <div className="absolute inset-0 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      {t('feedSnapshot.capturing.title')}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {progress?.statusText || t('feedSnapshot.capturing.description')}
                    </p>
                    {progress && progress.frames !== undefined && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>{t('feedSnapshot.capturing.frames')}: {progress.frames}</span>
                          {progress.percent !== undefined && (
                            <span>{progress.percent}%</span>
                          )}
                        </div>
                        {progress.percent !== undefined && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress.percent}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleStopCapture}
                    className="bg-gray-900 text-white px-6 py-3 rounded-full text-base font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-3 mx-auto"
                  >
                    {t('feedSnapshot.button.stop')}
                  </button>
                </div>
              )}

              {/* Processing State */}
              {step === 'processing' && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    {t('feedSnapshot.processing.title')}
                  </h2>
                  <p className="text-gray-600">
                    {progress?.statusText || t('feedSnapshot.processing.description')}
                  </p>
                </div>
              )}

              {/* Done State */}
              {step === 'done' && snapshotDataUrl && (
                <div className="text-center">
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      {t('feedSnapshot.done.title')}
                    </h2>
                    <p className="text-gray-600 mb-6">
                      {t('feedSnapshot.done.description')}
                    </p>
                  </div>
                  <div className="mb-8 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 max-h-96 overflow-y-auto">
                    <img
                      src={snapshotDataUrl}
                      alt={t('feedSnapshot.done.alt')}
                      className="w-full h-auto"
                    />
                  </div>
                  {progress?.meta && (
                    <div className="mb-6 text-sm text-gray-500">
                      {t('feedSnapshot.done.meta').replace('{width}', String(progress.meta.width)).replace('{height}', String(progress.meta.height)).replace('{frames}', String(progress.meta.frames))}
                    </div>
                  )}
                  <div className="flex gap-4 justify-center">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="group bg-[#4338ca] text-white pl-6 pr-2 py-2 rounded-full text-base font-medium hover:bg-[#3730a3] transition-all duration-300 flex items-center gap-3 hover:scale-105"
                    >
                      <Download className="w-5 h-5" />
                      {t('feedSnapshot.button.download')}
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
                        <Download className="w-5 h-5 text-black" />
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={handleCaptureAgain}
                      className="bg-gray-200 text-gray-900 px-6 py-2 rounded-full text-base font-medium hover:bg-gray-300 transition-colors"
                    >
                      {t('feedSnapshot.button.captureAgain')}
                    </button>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
              <p className="font-semibold text-gray-900 mb-2">{t('feedSnapshot.disclaimer.title')}</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('feedSnapshot.disclaimer.item1')}</li>
                <li>{t('feedSnapshot.disclaimer.item2')}</li>
                <li>{t('feedSnapshot.disclaimer.item3')}</li>
                <li>{t('feedSnapshot.disclaimer.item4')}</li>
              </ul>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-gray-900 mb-4">
                {t('feedSnapshot.howItWorks.title')}
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light">
                {t('feedSnapshot.howItWorks.subtitle')}
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
                    {t('feedSnapshot.howItWorks.step1.title')}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                    {t('feedSnapshot.howItWorks.step1.description')}
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
                    {t('feedSnapshot.howItWorks.step2.title')}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                    {t('feedSnapshot.howItWorks.step2.description')}
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
                    {t('feedSnapshot.howItWorks.step3.title')}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                    {t('feedSnapshot.howItWorks.step3.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('feedSnapshot.faq.title')}</h2>
              <div className="space-y-4">
                {faqData.map((faq, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full flex items-center justify-between text-left py-3 hover:text-purple-600 transition-colors"
                    >
                      <h3 className="font-medium text-gray-900 pr-4">{faq.question}</h3>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                          openFAQIndex === index ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openFAQIndex === index && (
                      <p className="text-gray-600 text-sm leading-relaxed pt-2 pb-2">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};

