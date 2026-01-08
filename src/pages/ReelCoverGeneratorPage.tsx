import React, { useState, useRef, useEffect } from 'react';
import { NavigationHeader } from '../components/generated/NavigationHeader';
import { FooterSection } from '../components/generated/FooterSection';
import { AdBanner468x60 } from '../components/AdBanner468x60';
import { AdBanner728x90 } from '../components/AdBanner728x90';
import { ToolNavBar } from '../components/ToolNavBar';
import { ArrowUpRight, ChevronDown, Download, Upload } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const EMOJI_PRESETS = ['✨', '🔥', '💯', '🎯', '🚀', '💪', '⭐', '🎨', '📸', '💫', '❤️', '👍', '👏', '🎉', '🌟', '💎'];

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Clean)' },
  { value: 'Poppins', label: 'Poppins (Rounded)' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Bebas Neue', label: 'Bebas Neue (Bold)' },
  { value: 'Playfair Display', label: 'Playfair Display (Serif)' },
  { value: 'Oswald', label: 'Oswald (Condensed)' },
  { value: 'Roboto', label: 'Roboto' },
];

export const ReelCoverGeneratorPage = () => {
  const { t, tx } = useLanguage();
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textSize, setTextSize] = useState(48);
  const [fontFamily, setFontFamily] = useState<string>('Inter');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [hasPreview, setHasPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);
  const [isDragging, setIsDragging] = useState(false);

  // Load Google Fonts for cover text
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'reel-google-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Inter:wght@600;800&family=Poppins:wght@600;800&family=Montserrat:wght@600;800&family=Bebas+Neue&family=Playfair+Display:wght@600;700&family=Oswald:wght@500;600&family=Roboto:wght@500;700&display=swap';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (image) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        // Preload image for canvas
        const img = new Image();
        img.onload = () => {
          imageRef.current = img;
          generateCover();
        };
        img.src = result;
      };
      reader.readAsDataURL(image);
    } else {
      setImagePreview(null);
      imageRef.current = null;
      generateCover();
    }
  }, [image]);

  useEffect(() => {
    generateCover();
  }, [imagePreview, text, textColor, textSize, fontFamily, textPosition]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const generateCover = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsGenerating(true);

    // Set canvas size to Instagram Reel dimensions (9:16 aspect ratio)
    canvas.width = 1080;
    canvas.height = 1920;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawContent = () => {
      // Draw image if available
      if (imageRef.current) {
        const img = imageRef.current;
        const imgAspect = img.width / img.height;
        const canvasAspect = canvas.width / canvas.height;

        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;

        if (imgAspect > canvasAspect) {
          drawHeight = canvas.width / imgAspect;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          drawWidth = canvas.height * imgAspect;
          offsetX = (canvas.width - drawWidth) / 2;
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      } else {
        // No image, draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#4338ca');
        gradient.addColorStop(1, '#7c3aed');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw text if available
      if (text.trim()) {
        drawText(ctx);
      }

      setHasPreview(true);
      setIsGenerating(false);
    };

    // If image is already loaded, draw immediately
    if (imageRef.current) {
      drawContent();
    } else if (!imagePreview && text.trim()) {
      // No image, just text
      drawContent();
    } else if (!imagePreview && !text.trim()) {
      // Nothing to show
      setHasPreview(false);
      setIsGenerating(false);
    }
    // If image is loading, it will trigger drawContent via imageRef.current
  };

  const drawText = (ctx: CanvasRenderingContext2D) => {
    if (!text.trim()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    ctx.fillStyle = textColor;
    ctx.font = `bold ${textSize}px "${fontFamily}", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Handle line breaks
    const lines = text.split('\n').filter(line => line.trim());
    const lineHeight = textSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    const centerY = canvas.height * textPosition.y;
    const startY = centerY - totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
      // Word wrap if line is too long
      const maxWidth = canvas.width - 100;
      const words = line.split(' ');
      const wrappedLines: string[] = [];
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          wrappedLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) {
        wrappedLines.push(currentLine);
      }

      wrappedLines.forEach((wrappedLine, wrappedIndex) => {
        ctx.fillText(
          wrappedLine,
          canvas.width * textPosition.x,
          startY + index * lineHeight + wrappedIndex * lineHeight
        );
      });
    });

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  const downloadCover = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasPreview || isGenerating) return;

    // Ensure canvas is rendered
    generateCover();
    
    // Small delay to ensure rendering is complete
    setTimeout(() => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reel-cover-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
    }, 100);
  };

  const addEmoji = (emoji: string) => {
    setText(prev => prev + emoji);
  };

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!text.trim()) return;
    setIsDragging(true);
    // Prevent scrolling on touch devices while dragging
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  };

  const updateTextPositionFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const clampedX = Math.min(0.9, Math.max(0.1, x));
    const clampedY = Math.min(0.9, Math.max(0.1, y));
    setTextPosition({ x: clampedX, y: clampedY });
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    event.preventDefault();
    updateTextPositionFromEvent(event);
  };

  const handleCanvasPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
      (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
    }
  };

  const toggleFAQ = (index: number) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  const faqData = [
    {
      question: t('reel.faq.q1'),
      answer: t('reel.faq.a1'),
    },
    {
      question: t('reel.faq.q2'),
      answer: t('reel.faq.a2'),
    },
    {
      question: t('reel.faq.q3'),
      answer: t('reel.faq.a3'),
    },
    {
      question: t('reel.faq.q4'),
      answer: t('reel.faq.a4'),
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-white font-sans overflow-hidden pt-20">
      <NavigationHeader />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-gray-900 leading-[1.1] mb-6">
              {t('reel.title')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
              {t('reel.subtitle')}
            </p>
          </div>

          {/* 2-Column Layout */}
          <div className="max-w-6xl mx-auto mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Card: Upload & Customize */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('reel.uploadCustomize')}</h2>
                
                <div className="space-y-6">
                  {/* Image Upload */}
                  <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-900 mb-2">
                      {t('reel.upload.label')} (Optional)
                    </label>
                    <label
                      htmlFor="image"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-700 hover:border-[#4338ca] hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="text-sm font-medium">{t('reel.upload.label')}</span>
                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {image && (
                      <p className="mt-2 text-sm text-gray-500">{image.name}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      {t('reel.upload.helper')}
                    </p>
                  </div>

                  {/* Text Input */}
                  <div>
                    <label htmlFor="text" className="block text-sm font-medium text-gray-900 mb-2">
                      {t('reel.text.label')} (Optional)
                    </label>
                    <textarea
                      id="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={t('reel.text.placeholder')}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {t('reel.text.helper')}
                    </p>
                    
                    {/* Emoji Picker */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {t('reel.emoji.label')}
                      </label>
                      <div className="grid grid-cols-8 gap-2 p-3 border border-gray-200 rounded-xl bg-gray-50">
                        {EMOJI_PRESETS.map((emoji, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => addEmoji(emoji)}
                            className="text-2xl hover:scale-125 transition-transform cursor-pointer"
                            title={t('reel.emoji.helper')}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {t('reel.emoji.helper')}
                      </p>
                    </div>
                  </div>

                  {/* Text Color */}
                  <div>
                    <label htmlFor="textColor" className="block text-sm font-medium text-gray-900 mb-2">
                      {t('reel.color.label')}
                    </label>
                    <input
                      type="color"
                      id="textColor"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full h-12 border border-gray-200 rounded-xl cursor-pointer"
                    />
                  </div>

                  {/* Font Size */}
                  <div>
                    <label htmlFor="textSize" className="block text-sm font-medium text-gray-900 mb-2">
                      {t('reel.size.label')}: {textSize}px
                    </label>
                    <input
                      type="range"
                      id="textSize"
                      min="24"
                      max="96"
                      value={textSize}
                      onChange={(e) => setTextSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Font Family */}
                  <div>
                    <label htmlFor="fontFamily" className="block text-sm font-medium text-gray-900 mb-2">
                      {t('reel.font.label')}
                    </label>
                    <select
                      id="fontFamily"
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {t('reel.font.helper')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Card: Preview */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">{t('reel.preview')}</h2>
                  <button
                    onClick={downloadCover}
                    disabled={!hasPreview || isGenerating}
                    className="flex items-center gap-2 bg-[#4338ca] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#3730a3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!hasPreview ? t('reel.download.disabled') : ''}
                  >
                    <Download className="w-4 h-4" />
                    {t('reel.download.ready')}
                  </button>
                </div>
                
                <div className="bg-gray-100 rounded-xl p-4 flex justify-center items-center min-h-[400px] relative">
                  <div className="w-full flex justify-center">
                    <canvas
                      ref={canvasRef}
                      className="max-w-full h-auto rounded-lg"
                      style={{ aspectRatio: '9/16', maxHeight: '600px', touchAction: 'none' }}
                      onPointerDown={handleCanvasPointerDown}
                      onPointerMove={handleCanvasPointerMove}
                      onPointerUp={handleCanvasPointerUp}
                      onPointerLeave={handleCanvasPointerUp}
                    />
                  </div>
                  {!hasPreview && (
                    <div className="absolute inset-0 flex items-center justify-center text-center text-gray-400 pointer-events-none">
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 w-full max-w-[300px] mx-auto bg-white/40"
                        style={{ aspectRatio: '9/16' }}
                      >
                        <p className="text-sm mt-4">{t('reel.preview.empty')}</p>
                        <p className="text-xs mt-2 text-gray-400">{t('reel.preview.helper')}</p>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-4 text-center">
                  {t('reel.preview.sizeNote')}
                </p>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  {t('reel.drag.helper')}
                </p>
              </div>
            </div>
          </div>

          {/* Why This Helps Section */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                {tx('reel.whyThisHelps.title')}
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {t('reel.whyThisHelps.item1.title')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('reel.whyThisHelps.item1.description')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {t('reel.whyThisHelps.item2.title')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('reel.whyThisHelps.item2.description')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {t('reel.whyThisHelps.item3.title')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('reel.whyThisHelps.item3.description')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {t('reel.whyThisHelps.item4.title')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('reel.whyThisHelps.item4.description')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {t('reel.whyThisHelps.item5.title')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('reel.whyThisHelps.item5.description')}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <ToolNavBar />
      <AdBanner468x60 />

      <section className="relative px-4 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-gray-900 mb-4">
              {tx('reel.howItWorks.title')}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light">
              {t('reel.howItWorks.subtitle')}
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
                  {t('reel.howItWorks.step1.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('reel.howItWorks.step1.description')}
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
                  {t('reel.howItWorks.step2.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('reel.howItWorks.step2.description')}
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
                  {t('reel.howItWorks.step3.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('reel.howItWorks.step3.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
              {t('reel.faq.subtitle')}
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-300"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 md:px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors duration-200"
                >
                  <span className="text-lg md:text-xl font-semibold text-gray-900 pr-8">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 shrink-0 transition-transform duration-300 ${
                      openFAQIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFAQIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 md:px-8 pb-6 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Limitations Notice */}
      <div className="max-w-4xl mx-auto mb-20 px-4">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {tx('reel.limitations.title')}
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>{t('reel.limitations.item1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>{t('reel.limitations.item2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>{t('reel.limitations.item3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>{t('reel.limitations.item4')}</span>
            </li>
          </ul>
        </div>
      </div>

      <AdBanner728x90 />
      <AdBanner468x60 />
      <FooterSection />
    </div>
  );
};
