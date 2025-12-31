import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NavigationHeader } from '../components/generated/NavigationHeader';
import { FooterSection } from '../components/generated/FooterSection';
import { Download, Camera, CheckCircle, X, ChevronDown } from 'lucide-react';
import {
  startCapture,
  stopCapture,
  captureFrame,
  isDuplicateFrame,
  removeFrame,
  clearAllFrames,
  type CaptureStatus,
  type CapturedFrame,
} from '../lib/feed-snapshot-capture/capture';
import {
  composeSnapshot,
  downloadBlob,
  type BackgroundType,
  type CompositionOptions,
} from '../lib/feed-snapshot-capture/compose';

const MAX_FRAMES = 200;

export const FeedSnapshotCapturePage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const stableFrameCountRef = useRef<number>(0);

  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [frames, setFrames] = useState<CapturedFrame[]>([]);
  const [snapshotBlob, setSnapshotBlob] = useState<Blob | null>(null);
  const [snapshotPreview, setSnapshotPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);

  const handleStopCapture = useCallback(() => {
    if (streamRef.current) {
      stopCapture(streamRef.current);
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('stopped');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        stopCapture(streamRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearAllFrames(frames);
      if (snapshotPreview) {
        URL.revokeObjectURL(snapshotPreview);
      }
    };
  }, []);

  // Aggressive auto-capture - GoFullPage style (captures every 500ms)
  useEffect(() => {
    if (status === 'capturing' && intervalRef.current === null) {
      // Capture first frame immediately
      setTimeout(() => {
        if (videoRef.current && status === 'capturing') {
          captureFrame(videoRef.current, frames)
            .then(async (newFrame) => {
              if (newFrame) {
                setFrames((prev) => {
                  const newFrames = [...prev, newFrame];
                  setCaptureProgress(newFrames.length);
                  lastFrameTimeRef.current = Date.now();
                  return newFrames;
                });
              }
            })
            .catch((err) => {
              console.error('Capture error:', err);
            });
        }
      }, 1000);

      // Then capture every 500ms (very aggressive, like GoFullPage)
      intervalRef.current = window.setInterval(() => {
        if (!videoRef.current || status !== 'capturing') {
          return;
        }

        setFrames((currentFrames) => {
          if (currentFrames.length >= MAX_FRAMES) {
            handleStopCapture();
            if (currentFrames.length > 0) {
              handleAutoGenerateSnapshot(currentFrames);
            }
            return currentFrames;
          }

          captureFrame(videoRef.current!, currentFrames)
            .then(async (newFrame) => {
              if (newFrame) {
                setFrames((prev) => {
                  const lastFrame = prev[prev.length - 1] || null;
                  isDuplicateFrame(newFrame, lastFrame).then((isDup) => {
                    if (!isDup) {
                      setFrames((p) => {
                        const newFrames = [...p, newFrame];
                        setCaptureProgress(newFrames.length);
                        lastFrameTimeRef.current = Date.now();
                        stableFrameCountRef.current = 0;
                        
                        // Auto-generate if we have enough frames and user seems to have stopped scrolling
                        // (no new unique frames in last 3 seconds = 6 captures)
                        if (newFrames.length >= 10) {
                          setTimeout(() => {
                            // Check if still capturing and no new frames
                            if (Date.now() - lastFrameTimeRef.current > 3000 && status === 'capturing') {
                              handleStopCapture();
                              handleAutoGenerateSnapshot(newFrames);
                            }
                          }, 3000);
                        }
                        return newFrames;
                      });
                    } else {
                      removeFrame(newFrame);
                      stableFrameCountRef.current++;
                      // If we get 5 duplicate frames in a row, user probably stopped scrolling
                      if (stableFrameCountRef.current >= 5 && prev.length >= 10) {
                        handleStopCapture();
                        handleAutoGenerateSnapshot(prev);
                      }
                    }
                  });
                  return prev;
                });
              }
            })
            .catch((err) => {
              console.error('Auto-capture error:', err);
            });

          return currentFrames;
        });
      }, 500); // Very fast capture - 500ms intervals
    } else if (status !== 'capturing' && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, handleStopCapture]);

  const handleStartCapture = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!videoRef.current) {
      setError('Video element not ready. Please refresh the page.');
      return;
    }

    setError(null);
    setFrames([]);
    setSnapshotBlob(null);
    setSnapshotPreview(null);
    setCaptureProgress(0);
    lastFrameTimeRef.current = 0;
    stableFrameCountRef.current = 0;
    if (snapshotPreview) {
      URL.revokeObjectURL(snapshotPreview);
    }

    try {
      const stream = await startCapture(videoRef.current);
      streamRef.current = stream;
      setStatus('capturing');
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Screen capture permission denied. Please allow screen sharing and try again.');
      } else if (err.message.includes('not supported')) {
        setError('Screen capture is not supported in this browser. Please use a desktop browser (Chrome, Firefox, Edge, or Safari).');
      } else {
        setError(err.message || 'Failed to start screen capture. Please try again.');
      }
      setStatus('idle');
    }
  };

  const handleAutoGenerateSnapshot = async (framesToUse: CapturedFrame[]) => {
    if (framesToUse.length < 1 || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      if (snapshotPreview) {
        URL.revokeObjectURL(snapshotPreview);
      }

      const options: CompositionOptions = {
        layout: 'vertical',
        columns: 1,
        tileSize: 'medium',
        spacing: 0,
        background: 'light' as BackgroundType,
        watermark: false,
        blur: false,
        headerLine: false,
      };

      const blob = await composeSnapshot(framesToUse.map(f => ({ bitmap: f.bitmap })), options);
      setSnapshotBlob(blob);
      const previewUrl = URL.createObjectURL(blob);
      setSnapshotPreview(previewUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to generate snapshot.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!snapshotBlob) return;
    downloadBlob(snapshotBlob, `full-page-screenshot-${Date.now()}.png`);
  };

  const handleStopAndGenerate = async () => {
    handleStopCapture();
    if (frames.length > 0) {
      await handleAutoGenerateSnapshot(frames);
    }
  };

  const toggleFAQ = (index: number) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  const faqData = [
    {
      question: 'How does it work?',
      answer: 'Click "Capture Screen" and select the tab you want to capture. The tool will automatically capture frames as you scroll through the page. Simply scroll slowly through the entire page, and the tool will generate a complete screenshot automatically.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes. All processing happens in your browser. No images are uploaded to any server. Everything is processed locally on your device.',
    },
    {
      question: 'Can I use this on mobile?',
      answer: 'Screen capture requires desktop browsers (Chrome, Firefox, Edge, or Safari). Mobile browsers do not support the required screen sharing API.',
    },
    {
      question: 'How many frames can I capture?',
      answer: `You can capture up to ${MAX_FRAMES} frames per session. The tool automatically generates a snapshot when it detects you've finished scrolling or when you click "Stop & Generate".`,
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-white font-sans overflow-hidden pt-20">
      <NavigationHeader />
      
      {/* Hidden video element - always rendered for ref to work */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ 
          display: 'none',
          position: 'absolute',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1
        }}
      />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section - Matching other tool pages */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-gray-900 leading-[1.1] mb-6">
              Feed Snapshot (Screen Capture)
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
              Capture complete page screenshots automatically. Select a tab and scroll through the page—we'll capture everything.
            </p>
          </div>

          {/* Main Tool Area */}
          <div className="max-w-2xl mx-auto mb-20">
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              {status === 'idle' && !snapshotPreview && (
                <div className="text-center">
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Camera className="w-10 h-10 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Ready to capture
                    </h2>
                    <p className="text-gray-600 mb-8">
                      Click the button below to start capturing your screen
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartCapture}
                    className="group bg-[#4338ca] text-white pl-6 pr-2 py-2 rounded-full text-base font-medium hover:bg-[#3730a3] transition-all duration-300 flex items-center gap-3 hover:scale-105 mx-auto"
                  >
                    <Camera className="w-5 h-5" />
                    Capture Screen
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
                      <Download className="w-5 h-5 text-black" />
                    </div>
                  </button>
                </div>
              )}

              {status === 'capturing' && (
                <div className="text-center">
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                      <div className="absolute inset-0 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Capturing...
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Scroll slowly through the page in the shared tab
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                      The tool will automatically capture frames as you scroll. Scroll to the bottom of the page to capture everything.
                    </p>
                    <div className="mb-6">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>Frames captured: {frames.length}</span>
                        <span>{captureProgress} / {MAX_FRAMES}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(captureProgress / MAX_FRAMES) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStopAndGenerate}
                    className="bg-gray-900 text-white px-6 py-3 rounded-full text-base font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-3 mx-auto"
                  >
                    <X className="w-5 h-5" />
                    Stop & Generate
                  </button>
                </div>
              )}

              {isGenerating && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Generating snapshot...
                  </h2>
                  <p className="text-gray-600">
                    Composing {frames.length} frames into a single image
                  </p>
                </div>
              )}

              {snapshotPreview && status !== 'capturing' && (
                <div className="text-center">
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Snapshot ready!
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Your full page screenshot has been generated
                    </p>
                  </div>
                  <div className="mb-8 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 max-h-96 overflow-y-auto">
                    <img
                      src={snapshotPreview}
                      alt="Full page snapshot"
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="group bg-[#4338ca] text-white pl-6 pr-2 py-2 rounded-full text-base font-medium hover:bg-[#3730a3] transition-all duration-300 flex items-center gap-3 hover:scale-105"
                    >
                      <Download className="w-5 h-5" />
                      Download PNG
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
                        <Download className="w-5 h-5 text-black" />
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSnapshotPreview(null);
                        setSnapshotBlob(null);
                        setFrames([]);
                        setCaptureProgress(0);
                        if (snapshotPreview) {
                          URL.revokeObjectURL(snapshotPreview);
                        }
                      }}
                      className="bg-gray-200 text-gray-900 px-6 py-2 rounded-full text-base font-medium hover:bg-gray-300 transition-colors"
                    >
                      Capture Again
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* How It Works Section - Matching other tool pages */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-gray-900 mb-4">
                How it works
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light">
                Capture complete page screenshots in three simple steps
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
                    Select Tab
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                    Click "Capture Screen" and select the browser tab you want to capture from the sharing dialog.
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
                    Scroll Page
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                    Scroll slowly through the entire page. The tool automatically captures frames every 500ms as you scroll.
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
                    Download
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                    The tool automatically generates a complete page screenshot when you finish scrolling. Download it as PNG.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section - Matching other tool pages */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
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
