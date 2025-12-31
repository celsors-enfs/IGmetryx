import React, { useState } from 'react';
import { NavigationHeader } from '../components/generated/NavigationHeader';
import { FooterSection } from '../components/generated/FooterSection';
import { ToolNavBar } from '../components/ToolNavBar';
import { ArrowUpRight, ChevronDown, Check, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { PROFILE_ANALYZER_EXAMPLES, ProfileAnalyzerExample, ProfileExampleId } from '../data/profileAnalyzerExamples';
import {
  calculateMetrics as calculateMetricsUtil,
  calculatePerformanceStatus,
  generateTopActions,
  formatNumber,
  formatRange,
  MetricRanges,
  Anomaly,
  Tier,
  PerformanceStatus,
  TopAction,
} from '../lib/profileAnalyzer';

interface AnalysisResult {
  ranges: MetricRanges;
  postingCadence: string;
  tier: Tier;
  anomalies: Anomaly[];
  avgLikes: number;
  avgComments: number;
  postsPerWeek: number;
  recommendations: string[];
  contentThemes: string[];
  timingSuggestions: string[];
  hashtagStrategy: string[];
  performanceStatus: PerformanceStatus;
  topActions: TopAction[];
}

const extractUsername = (input: string): string | null => {
  if (!input.trim()) return null;
  
  // Remove whitespace
  const cleaned = input.trim();
  
  // If it's already a username (starts with @)
  if (cleaned.startsWith('@')) {
    return cleaned.substring(1).replace(/[^a-zA-Z0-9._]/g, '');
  }
  
  // Try to extract from URL patterns
  const urlPatterns = [
    /instagram\.com\/([a-zA-Z0-9._]+)/,
    /instagram\.com\/p\/[^\/]+\/.*?@([a-zA-Z0-9._]+)/,
    /instagram\.com\/reel\/[^\/]+\/.*?@([a-zA-Z0-9._]+)/,
  ];
  
  for (const pattern of urlPatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // If it's just a username without @
  if (/^[a-zA-Z0-9._]+$/.test(cleaned)) {
    return cleaned;
  }
  
  return null;
};

export const ProfileAnalyzerPage = () => {
  const { t, tx } = useLanguage();
  const [mode, setMode] = useState<'link' | 'manual' | 'official'>('link');
  const [examplesMode, setExamplesMode] = useState<'myData' | 'examples'>('examples');
  const [flowStage, setFlowStage] = useState<'discover' | 'results' | 'apply'>('discover');
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(null);
  const [isExampleLoaded, setIsExampleLoaded] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profileInput, setProfileInput] = useState('');
  const [parsedUsername, setParsedUsername] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [manualData, setManualData] = useState({
    followers: '',
    avgLikes: '',
    avgComments: '',
    postsPerWeek: '',
    niche: ''
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);
  const [switchedFromExampleToMyProfile, setSwitchedFromExampleToMyProfile] = useState(false);
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false);
  
  // Utility function for smooth scrolling with header offset
  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 90; // header offset
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const scrollToResults = () => {
    scrollToId('analysis-results');
  };

  const scrollToAnalyzeSection = () => {
    scrollToId('profile-input');
  };

  const scrollToQuickExamples = () => {
    scrollToId('quick-examples');
  };

  const handleConnectOfficial = () => {
    // TODO: Implement OAuth flow with Meta/Instagram Graph API
    // For now, show instructions
    alert(t('profile.connectOfficial.instructions') || 'To connect your Instagram account:\n\n1. Click "Connect Instagram" below\n2. Authorize IGmetryx via Facebook Login\n3. Grant permissions for Instagram Insights\n4. Your account will be connected securely\n\nNote: This feature requires a Business or Creator account.');
  };

  const loadExampleScenario = (example: ProfileAnalyzerExample) => {
    setExamplesMode('examples');
    setSelectedExampleId(example.id);
    setIsExampleLoaded(true);
    setFlowStage('results');

    setManualData({
      followers: example.followers.toString(),
      avgLikes: example.avgLikes.toString(),
      avgComments: example.avgComments.toString(),
      postsPerWeek: example.postsPerWeek.toString(),
      niche: ''
    });
    setMode('manual');

    const analysis = calculateMetricsFromValues(
      example.followers,
      example.avgLikes,
      example.avgComments,
      example.postsPerWeek,
      example.id
    );
    setResult(analysis);
    setStep(3);
    // Scroll to results after a short delay to ensure DOM is updated
    setTimeout(() => scrollToResults(), 100);
  };

  const handleProfileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProfileInput(value);
    const username = extractUsername(value);
    setParsedUsername(username);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedUsername) {
      setStep(2);
      setFlowStage('apply');
    }
  };

  const calculateMetricsFromValues = (
    followers: number,
    avgLikes: number,
    avgComments: number,
    postsPerWeek: number,
    exampleId?: ProfileExampleId | null
  ): AnalysisResult => {
    const { ranges, postingCadence, tier, anomalies } = calculateMetricsUtil(
      followers,
      avgLikes,
      avgComments,
      postsPerWeek
    );

    const performanceStatus = calculatePerformanceStatus(
      ranges.engagementRate,
      tier,
      anomalies,
      postsPerWeek,
      avgLikes,
      avgComments
    );

    let recommendations: string[];
    let contentThemes: string[];
    let timingSuggestions: string[];
    let hashtagStrategy: string[];

    if (exampleId) {
      switch (exampleId) {
        case 'beginner':
          recommendations = [
            'profile.examples.recommendations.beginner.item1',
            'profile.examples.recommendations.beginner.item2',
            'profile.examples.recommendations.beginner.item3',
          ];
          contentThemes = [
            'profile.examples.contentThemes.beginner.item1',
            'profile.examples.contentThemes.beginner.item2',
            'profile.examples.contentThemes.beginner.item3',
          ];
          timingSuggestions = [
            'profile.examples.timing.beginner.item1',
            'profile.examples.timing.beginner.item2',
          ];
          hashtagStrategy = [
            'profile.examples.hashtags.beginner.item1',
            'profile.examples.hashtags.beginner.item2',
            'profile.examples.hashtags.beginner.item3',
          ];
          break;
        case 'growth':
          recommendations = [
            'profile.examples.recommendations.growth.item1',
            'profile.examples.recommendations.growth.item2',
            'profile.examples.recommendations.growth.item3',
          ];
          contentThemes = [
            'profile.examples.contentThemes.growth.item1',
            'profile.examples.contentThemes.growth.item2',
            'profile.examples.contentThemes.growth.item3',
          ];
          timingSuggestions = [
            'profile.examples.timing.growth.item1',
            'profile.examples.timing.growth.item2',
          ];
          hashtagStrategy = [
            'profile.examples.hashtags.growth.item1',
            'profile.examples.hashtags.growth.item2',
            'profile.examples.hashtags.growth.item3',
          ];
          break;
        case 'established':
          recommendations = [
            'profile.examples.recommendations.established.item1',
            'profile.examples.recommendations.established.item2',
            'profile.examples.recommendations.established.item3',
          ];
          contentThemes = [
            'profile.examples.contentThemes.established.item1',
            'profile.examples.contentThemes.established.item2',
            'profile.examples.contentThemes.established.item3',
          ];
          timingSuggestions = [
            'profile.examples.timing.established.item1',
            'profile.examples.timing.established.item2',
          ];
          hashtagStrategy = [
            'profile.examples.hashtags.established.item1',
            'profile.examples.hashtags.established.item2',
            'profile.examples.hashtags.established.item3',
          ];
          break;
        case 'large':
          recommendations = [
            'profile.examples.recommendations.large.item1',
            'profile.examples.recommendations.large.item2',
            'profile.examples.recommendations.large.item3',
          ];
          contentThemes = [
            'profile.examples.contentThemes.large.item1',
            'profile.examples.contentThemes.large.item2',
            'profile.examples.contentThemes.large.item3',
          ];
          timingSuggestions = [
            'profile.examples.timing.large.item1',
            'profile.examples.timing.large.item2',
          ];
          hashtagStrategy = [
            'profile.examples.hashtags.large.item1',
            'profile.examples.hashtags.large.item2',
            'profile.examples.hashtags.large.item3',
          ];
          break;
        case 'mega':
          recommendations = [
            'profile.examples.recommendations.mega.item1',
            'profile.examples.recommendations.mega.item2',
            'profile.examples.recommendations.mega.item3',
          ];
          contentThemes = [
            'profile.examples.contentThemes.mega.item1',
            'profile.examples.contentThemes.mega.item2',
            'profile.examples.contentThemes.mega.item3',
          ];
          timingSuggestions = [
            'profile.examples.timing.mega.item1',
            'profile.examples.timing.mega.item2',
          ];
          hashtagStrategy = [
            'profile.examples.hashtags.mega.item1',
            'profile.examples.hashtags.mega.item2',
            'profile.examples.hashtags.mega.item3',
          ];
          break;
        default:
          recommendations = [
            'profile.recommendations.consistency',
            'profile.recommendations.hooks',
            'profile.recommendations.hashtags',
          ];
          contentThemes = [
            'profile.contentThemes.behindScenes',
            'profile.contentThemes.educational',
            'profile.contentThemes.personalStories',
            'profile.contentThemes.communityHighlights',
          ];
          timingSuggestions = [
            'profile.timing.suggestion1',
            'profile.timing.suggestion2',
          ];
          hashtagStrategy = [
            'profile.hashtags.suggestion1',
            'profile.hashtags.suggestion2',
            'profile.hashtags.suggestion3',
            'profile.hashtags.suggestion4',
          ];
      }
    } else {
      recommendations = [
        'profile.recommendations.consistency',
        'profile.recommendations.hooks',
        'profile.recommendations.hashtags',
      ];
      contentThemes = [
        'profile.contentThemes.behindScenes',
        'profile.contentThemes.educational',
        'profile.contentThemes.personalStories',
        'profile.contentThemes.communityHighlights',
      ];
      timingSuggestions = [
        'profile.timing.suggestion1',
        'profile.timing.suggestion2',
      ];
      hashtagStrategy = [
        'profile.hashtags.suggestion1',
        'profile.hashtags.suggestion2',
        'profile.hashtags.suggestion3',
        'profile.hashtags.suggestion4',
      ];
    }

    let topActions = generateTopActions(
      ranges.engagementRate,
      tier,
      postsPerWeek,
      timingSuggestions,
      hashtagStrategy
    );

    if (exampleId) {
      const exampleActionsById: Record<ProfileExampleId, TopAction[]> = {
        beginner: [
          { id: 'consistency', difficulty: 'easy' },
          { id: 'hooks', difficulty: 'medium' },
          { id: 'hashtags', difficulty: 'easy' },
        ],
        growth: [
          { id: 'hooks', difficulty: 'medium' },
          { id: 'timing', difficulty: 'easy' },
          { id: 'hashtags', difficulty: 'easy' },
        ],
        established: [
          { id: 'timing', difficulty: 'easy' },
          { id: 'hooks', difficulty: 'medium' },
          { id: 'hashtags', difficulty: 'easy' },
        ],
        large: [
          { id: 'hooks', difficulty: 'medium' },
          { id: 'hashtags', difficulty: 'easy' },
          { id: 'timing', difficulty: 'easy' },
        ],
        mega: [
          { id: 'hashtags', difficulty: 'easy' },
          { id: 'timing', difficulty: 'medium' },
          { id: 'consistency', difficulty: 'medium' },
        ],
      };
      topActions = exampleActionsById[exampleId];
    }

    return {
      ranges,
      postingCadence,
      tier,
      anomalies,
      avgLikes,
      avgComments,
      postsPerWeek,
      recommendations,
      contentThemes,
      timingSuggestions,
      hashtagStrategy,
      performanceStatus,
      topActions
    };
  };

  const calculateMetrics = (): AnalysisResult => {
    const followers = parseInt(manualData.followers) || 0;
    const avgLikes = parseInt(manualData.avgLikes) || 0;
    const avgComments = parseInt(manualData.avgComments) || 0;
    const postsPerWeek = parseFloat(manualData.postsPerWeek) || 0;
    const exampleId: ProfileExampleId | undefined =
      isExampleLoaded && examplesMode === 'examples' && selectedExampleId
        ? (selectedExampleId as ProfileExampleId)
        : undefined;
    return calculateMetricsFromValues(followers, avgLikes, avgComments, postsPerWeek, exampleId);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const analysis = calculateMetrics();
    setResult(analysis);
    setStep(3);
    setFlowStage('results');
    setSwitchedFromExampleToMyProfile(false); // Real analysis, show header
    setTimeout(() => scrollToResults(), 100);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const analysis = calculateMetrics();
    setResult(analysis);
    setStep(3);
    setFlowStage('results');
    setSwitchedFromExampleToMyProfile(false); // Real analysis, show header
    setAdvancedOptionsOpen(false); // Close dropdown after submission
    setTimeout(() => scrollToResults(), 100);
  };

  const resetFlow = () => {
    setStep(1);
    setProfileInput('');
    setParsedUsername(null);
    setManualData({
      followers: '',
      avgLikes: '',
      avgComments: '',
      postsPerWeek: '',
      niche: ''
    });
    setResult(null);
    setIsExampleLoaded(false);
    setSelectedExampleId(null);
    setExamplesMode('examples');
    setFlowStage('discover');
    setSwitchedFromExampleToMyProfile(false);
    setAdvancedOptionsOpen(false);
    // Scroll will be handled by the caller if needed
  };

  const toggleFAQ = (index: number) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  const faqData = [
    {
      question: t('profile.faq.q1'),
      answer: t('profile.faq.a1'),
    },
    {
      question: t('profile.faq.q2'),
      answer: t('profile.faq.a2'),
    },
    {
      question: t('profile.faq.q3'),
      answer: t('profile.faq.a3'),
    },
    {
      question: t('profile.faq.q4'),
      answer: t('profile.faq.a4'),
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-white font-sans overflow-hidden pt-20">
      <NavigationHeader />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-gray-900 leading-[1.1] mb-6">
              {t('profile.title')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
              {t('profile.subtitle')}
            </p>
          </div>

          {/* Quick Examples / Account Simulator */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-7 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="text-left">
                  <h2 className="text-base font-semibold text-gray-900">
                    {t('profile.examples.title')}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {t('profile.examples.subtitle')}
                  </p>
                </div>
                <div className="inline-flex rounded-full bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      // Switch to "Use my data" flow: clear example state and show analyze section
                      setExamplesMode('myData');
                      setIsExampleLoaded(false);
                      setSelectedExampleId(null);
                      setResult(null);
                      setStep(1);
                      setFlowStage('apply');
                      setSwitchedFromExampleToMyProfile(false);
                      setProfileInput('');
                      setParsedUsername(null);
                      setManualData({
                        followers: '',
                        avgLikes: '',
                        avgComments: '',
                        postsPerWeek: '',
                        niche: '',
                      });
                      scrollToAnalyzeSection();
                    }}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                      examplesMode === 'myData'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t('profile.examples.toggle.myData')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Back to examples: reset full flow to default discover state
                      setExamplesMode('examples');
                      resetFlow();
                    }}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                      examplesMode === 'examples'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t('profile.examples.toggle.examples')}
                  </button>
                </div>
              </div>

              {examplesMode === 'examples' && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PROFILE_ANALYZER_EXAMPLES.map((example) => (
                    <button
                      key={example.id}
                      type="button"
                      onClick={() => loadExampleScenario(example)}
                      className={`text-left px-4 py-3 rounded-2xl border text-sm transition-colors ${
                        selectedExampleId === example.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-purple-600 mb-1">
                        {t('profile.examples.badge')}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {t(example.personaTitleKey)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('profile.examples.followersLabel',)}{' '}
                        <span className="font-medium text-gray-800">
                          {formatNumber(example.followers)}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {t(example.personaDescKey)}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {isExampleLoaded && examplesMode === 'examples' && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  <span aria-hidden="true">✅</span>
                  <p>{t('profile.examples.toastLoaded')}</p>
                </div>
              )}

              {examplesMode === 'myData' && flowStage !== 'apply' && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFlowStage('apply');
                      setIsExampleLoaded(false);
                      setSelectedExampleId(null);
                      scrollToAnalyzeSection();
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium bg-[#4338ca] text-white hover:bg-[#3730a3] transition-colors"
                  >
                    {t('profileAnalyzer.flow.wantAnalyzeMyProfileCta')}
                  </button>
                </div>
              )}

              <p className="mt-4 text-[11px] text-gray-400">
                {t('profile.examples.disclaimer')}
              </p>
            </div>
          </div>

          {flowStage === 'apply' && (
            <section id="profile-input" className="mb-16">
              <div className="max-w-2xl mx-auto mb-6">
                <div className="text-left">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {t('profileAnalyzer.flow.analyzeYourProfileTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {t('profileAnalyzer.flow.noPasswordMicrocopy')}
                  </p>
                </div>
              </div>

              {/* Step 1: Profile Link/Username (simple flow) */}
              {mode === 'link' && step === 1 && (
                <div className="max-w-2xl mx-auto mb-8" id="profile-analyzer-form">
                  <form onSubmit={handleStep1Submit} className="bg-white border border-gray-200 rounded-2xl p-8">
                    <div className="mb-6">
                      <label htmlFor="profileInput" className="block text-sm font-medium text-gray-900 mb-2">
                        {t('profileAnalyzer.flow.pasteYourLinkLabel')}
                      </label>
                      <input
                        type="text"
                        id="profileInput"
                        value={profileInput}
                        onChange={handleProfileInput}
                        placeholder={t('profileAnalyzer.flow.pasteYourLinkPlaceholder')}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                      {parsedUsername && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                          <Check className="w-4 h-4" />
                          <span>{tx('profile.input.detected')} @{parsedUsername}</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={!parsedUsername}
                      className="group bg-[#4338ca] text-white pl-6 pr-2 py-2 rounded-full text-base font-medium hover:bg-[#3730a3] transition-all duration-300 flex items-center gap-3 hover:scale-105 w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('profileAnalyzer.flow.continueCta')}
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
                        <ArrowUpRight className="w-5 h-5 text-black" />
                      </div>
                    </button>
                  </form>
                </div>
              )}

              {/* Step 2: Manual Metrics Input */}
              {((mode === 'link' && step === 2) || (mode === 'manual' && step === 1)) && (
                <div className="max-w-2xl mx-auto mb-8">
                  <form onSubmit={mode === 'link' ? handleStep2Submit : handleManualSubmit} className="bg-white border border-gray-200 rounded-2xl p-8">
                    {mode === 'link' && parsedUsername && (
                      <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-xl">
                        <p className="text-sm font-medium text-gray-900 mb-1">{tx('profile.step2.analyzing')}</p>
                        <p className="text-lg font-semibold text-purple-600">@{parsedUsername}</p>
                        <p className="text-xs text-gray-500 mt-2">{tx('profile.step2.helper')}</p>
                      </div>
                    )}
                    
                    <div className="mb-6">
                      <label htmlFor="followers" className="block text-sm font-medium text-gray-900 mb-2">
                        {t('profile.followers.label')}
                      </label>
                      <input
                        type="number"
                        id="followers"
                        value={manualData.followers}
                        onChange={(e) => setManualData({ ...manualData, followers: e.target.value })}
                        placeholder="10000"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">{t('profile.followers.helper')}</p>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="avgLikes" className="block text-sm font-medium text-gray-900 mb-2">
                        {t('profile.avgLikes.label')}
                      </label>
                      <input
                        type="number"
                        id="avgLikes"
                        value={manualData.avgLikes}
                        onChange={(e) => setManualData({ ...manualData, avgLikes: e.target.value })}
                        placeholder="500"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">{t('profile.avgLikes.helper')}</p>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="avgComments" className="block text-sm font-medium text-gray-900 mb-2">
                        {t('profile.avgComments.label')}
                      </label>
                      <input
                        type="number"
                        id="avgComments"
                        value={manualData.avgComments}
                        onChange={(e) => setManualData({ ...manualData, avgComments: e.target.value })}
                        placeholder="50"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">{t('profile.avgComments.helper')}</p>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="postsPerWeek" className="block text-sm font-medium text-gray-900 mb-2">
                        {t('profile.postsPerWeek.label')}
                      </label>
                      <input
                        type="number"
                        id="postsPerWeek"
                        value={manualData.postsPerWeek}
                        onChange={(e) => setManualData({ ...manualData, postsPerWeek: e.target.value })}
                        placeholder="5"
                        step="0.1"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">{t('profile.postsPerWeek.helper')}</p>
                    </div>

                    <div className="mb-6">
                      <label htmlFor="niche" className="block text-sm font-medium text-gray-900 mb-2">
                        {t('profile.niche.label')} (Optional)
                      </label>
                      <select
                        id="niche"
                        value={manualData.niche}
                        onChange={(e) => setManualData({ ...manualData, niche: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">{tx('profile.niche.select')}</option>
                        <option value="Fitness & Health">{tx('profile.niche.fitness')}</option>
                        <option value="Travel & Lifestyle">{tx('profile.niche.travel')}</option>
                        <option value="Food & Recipes">{tx('profile.niche.food')}</option>
                        <option value="Fashion & Style">{tx('profile.niche.fashion')}</option>
                        <option value="Business & Entrepreneurship">{tx('profile.niche.business')}</option>
                        <option value="Beauty & Skincare">{tx('profile.niche.beauty')}</option>
                        <option value="Photography">{tx('profile.niche.photography')}</option>
                        <option value="Education">{tx('profile.niche.education')}</option>
                        <option value="Other">{tx('profile.niche.other')}</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">{t('profile.niche.helper')}</p>
                    </div>
                    
                    <button
                      type="submit"
                      className="group bg-[#4338ca] text-white pl-6 pr-2 py-2 rounded-full text-base font-medium hover:bg-[#3730a3] transition-all duration-300 flex items-center gap-3 hover:scale-105 w-full justify-center"
                    >
                      {t('button.analyzeProfile')}
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
                        <ArrowUpRight className="w-5 h-5 text-black" />
                      </div>
                    </button>
                  </form>
                </div>
              )}

              {/* Advanced options: manual mode + official API (beta) */}
              <div className="max-w-2xl mx-auto mb-8">
                <details 
                  className="bg-white border border-gray-200 rounded-2xl p-5"
                  open={advancedOptionsOpen}
                  onToggle={(e) => setAdvancedOptionsOpen((e.target as HTMLDetailsElement).open)}
                >
                  <summary className="text-sm font-medium text-gray-900 cursor-pointer flex items-center justify-between">
                    <span>{t('profileAnalyzer.flow.advancedOptionsTitle')}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${advancedOptionsOpen ? 'rotate-180' : ''}`} />
                  </summary>
                  <div className="mt-4 space-y-4">
                    {/* Manual option */}
                    <div className="border border-gray-200 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {t('profileAnalyzer.flow.manualOptionTitle')}
                      </h3>
                      <p className="text-xs text-gray-600 mb-3">
                        {t('profileAnalyzer.flow.manualOptionDesc')}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('manual');
                          setStep(1);
                          setFlowStage('apply');
                          setAdvancedOptionsOpen(false); // Close dropdown
                          scrollToAnalyzeSection();
                        }}
                        className="px-4 py-2 rounded-full text-xs font-medium bg-gray-900 text-white hover:bg-black transition-colors"
                      >
                        {t('button.analyzeProfile')}
                      </button>
                    </div>

                    {/* API option (Beta) */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-purple-700 mb-1">
                            <span className="px-2 py-0.5 rounded-full bg-white border border-purple-200">
                              Beta
                            </span>
                          </p>
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            {t('profileAnalyzer.flow.apiOptionTitle')}
                          </h3>
                          <p className="text-xs text-gray-700">
                            {t('profileAnalyzer.flow.apiOptionDesc')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleConnectOfficial}
                          className="mt-1 px-4 py-2 bg-[#4338ca] text-white rounded-xl text-xs font-medium hover:bg-[#3730a3] transition-colors flex items-center gap-2"
                        >
                          <LinkIcon className="w-4 h-4" />
                          {t('profile.connectOfficial')}
                        </button>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </section>
          )}

          {/* Step 3: Results - Hide entire block when switching from example to myProfile */}
          {step === 3 && result && !(switchedFromExampleToMyProfile && examplesMode === 'myData') && (
            <div className="max-w-4xl mx-auto mb-20" id="analysis-results">
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-3xl font-semibold text-gray-900 mb-2">{tx('profile.results.title')}</h2>
                    <div className="flex items-center gap-3 flex-wrap">
                      {parsedUsername && (
                        <p className="text-sm text-gray-500">{tx('profile.results.profile')} @{parsedUsername}</p>
                      )}
                      <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                        {tx('profile.results.badge.estimates')}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {tx('profile.results.badge.noApi')}
                      </span>
                      {isExampleLoaded && (
                        <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full font-medium">
                          {tx('profileAnalyzer.flow.exampleBadge')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {tx(`profile.results.scaleNote.${result.tier}`) || tx('profile.results.scaleNote', { tier: result.tier })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {tx('profile.results.estimatesNote')}
                    </p>
                    {isExampleLoaded && (
                      <p className="text-xs text-amber-700 mt-1">
                        {tx('profileAnalyzer.flow.exampleDisclaimer')}
                      </p>
                    )}
                  </div>
                </div>

                {/* CTA Group - Centered, Side-by-Side */}
                <div className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  {isExampleLoaded ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setExamplesMode('myData');
                          setIsExampleLoaded(false);
                          setSelectedExampleId(null);
                          setFlowStage('apply');
                          setSwitchedFromExampleToMyProfile(true);
                          scrollToAnalyzeSection();
                        }}
                        className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-medium bg-[#4338ca] text-white hover:bg-[#3730a3] transition-colors w-full sm:w-auto"
                      >
                        {tx('profile.results.cta.useMyProfile')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          resetFlow();
                          scrollToQuickExamples();
                        }}
                        className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors w-full sm:w-auto"
                      >
                        {tx('profile.results.cta.tryAnotherExample')}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        resetFlow();
                        scrollToAnalyzeSection();
                      }}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-medium bg-[#4338ca] text-white hover:bg-[#3730a3] transition-colors w-full sm:w-auto"
                    >
                      {tx('profile.results.analyzeAnother')}
                    </button>
                  )}
                </div>

                {/* Performance Summary */}
                <div className="mb-8 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    {/* Status Pill */}
                    <div className="shrink-0">
                      {result.performanceStatus.status === 'healthy' && (
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                          ✅ {tx('profile.performance.healthy')}
                        </span>
                      )}
                      {result.performanceStatus.status === 'needs_attention' && (
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                          ⚠️ {tx('profile.performance.needsAttention')}
                        </span>
                      )}
                      {result.performanceStatus.status === 'not_performing' && (
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                          🚨 {tx('profile.performance.notPerforming')}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {/* "Is it working?" line */}
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {tx('profile.performance.isItWorking')} {' '}
                        {result.performanceStatus.workingStatus === 'yes' && (
                          <span className="text-green-700 font-semibold">{tx('profile.performance.yes')}</span>
                        )}
                        {result.performanceStatus.workingStatus === 'almost' && (
                          <span className="text-yellow-700 font-semibold">{tx('profile.performance.almost')}</span>
                        )}
                        {result.performanceStatus.workingStatus === 'no' && (
                          <span className="text-red-700 font-semibold">{tx('profile.performance.no')}</span>
                        )}
                      </p>
                      
                      {/* Verdict */}
                      <p className="text-base text-gray-900 mb-3 leading-relaxed">
                        {t(result.performanceStatus.verdictKey)}
                      </p>
                      
                      {/* Top Action */}
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          {tx('profile.performance.nextStep')}
                        </p>
                        <p className="text-sm text-gray-900 font-medium">
                          {t(result.performanceStatus.topActionKey)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Anomaly Warnings */}
                {result.anomalies.length > 0 && (
                  <div className="mb-6 space-y-3">
                    {result.anomalies.map((anomaly, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 p-4 rounded-xl border ${
                          anomaly.severity === 'warning'
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <AlertCircle className={`w-5 h-5 mt-0.5 shrink-0 ${
                          anomaly.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'
                        }`} />
                        <div>
                          <p className={`text-sm font-medium ${
                            anomaly.severity === 'warning' ? 'text-amber-900' : 'text-blue-900'
                          }`}>
                            {anomaly.type === 'low_engagement' 
                              ? tx('profile.anomaly.lowEngagement.title')
                              : tx('profile.anomaly.inconsistency.title')}
                          </p>
                          <p className={`text-sm mt-1 ${
                            anomaly.severity === 'warning' ? 'text-amber-700' : 'text-blue-700'
                          }`}>
                            {t(anomaly.messageKey)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Engagement Rate - Humanized */}
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
                    <p className="text-sm text-gray-600 mb-1">{tx('profile.results.engagementHumanized')}</p>
                    <p className="text-3xl font-bold text-gray-900">{result.ranges.engagementRate.toFixed(2)}%</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {result.ranges.engagementRate < 1.0 
                        ? tx('profile.results.engagementVerdict.low')
                        : result.ranges.engagementRate < 2.5
                        ? tx('profile.results.engagementVerdict.ok')
                        : tx('profile.results.engagementVerdict.great')}
                    </p>
                  </div>
                  
                  {/* Estimated Reach - Humanized */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                    <p className="text-sm text-gray-600 mb-1">{tx('profile.results.reachHumanized')}</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatRange(result.ranges.estimatedReachMin, result.ranges.estimatedReachMax, true)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{tx('profile.results.reachHelper')}</p>
                  </div>
                  
                  {/* Posting Cadence - Enhanced */}
                  <div className="bg-pink-50 border border-pink-100 rounded-xl p-6">
                    <p className="text-sm text-gray-600 mb-1">{tx('profile.results.postingCadence')}</p>
                    <p className="text-2xl font-semibold text-gray-900 mb-2">
                      {result.postingCadence === 'Very Active (Daily)' ? tx('profile.results.cadence.veryActive') :
                       result.postingCadence === 'Active (4-6x/week)' ? tx('profile.results.cadence.active') :
                       result.postingCadence === 'Moderate (2-3x/week)' ? tx('profile.results.cadence.moderate') :
                       result.postingCadence === 'Light (1x/week)' ? tx('profile.results.cadence.light') :
                       result.postingCadence === 'Irregular' ? tx('profile.results.cadence.irregular') :
                       result.postingCadence}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      {tx('profile.results.cadenceHelper')}
                    </p>
                    <p className="text-xs text-gray-600 border-t border-pink-200 pt-2 mt-2">
                      {tx('profile.results.yourCurrentAverage')} {' '}
                      <span className="font-semibold text-gray-900">
                        {formatNumber(result.avgLikes + result.avgComments)} {tx('profile.results.interactionsPerPost')}
                      </span>
                    </p>
                  </div>
                  
                  {/* Avg Engagement - Humanized */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6">
                    <p className="text-sm text-gray-600 mb-1">{tx('profile.results.avgEngagementHumanized')}</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatRange(result.ranges.avgEngagementMin, result.ranges.avgEngagementMax, true)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{tx('profile.results.engagementBreakdown')}</p>
                  </div>
                </div>

                <div className="space-y-6 border-t border-gray-200 pt-6">
                  {/* Top 3 Actions (Prioritized Checklist) */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{tx('profile.actions.top3')}</h3>
                  <div className="space-y-4">
                    {result.topActions.map((action, idx) => {
                      const titleKey = `profile.actions.${action.id}.title`;
                      const whyKey = `profile.actions.${action.id}.why`;
                      const howKey = `profile.actions.${action.id}.how`;
                      const difficultyKey = `profile.actions.difficulty.${action.difficulty}`;

                      return (
                        <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                                {idx + 1}
                              </span>
                              <h4 className="text-lg font-semibold text-gray-900">{t(titleKey)}</h4>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                action.difficulty === 'easy'
                                  ? 'bg-green-100 text-green-700'
                                  : action.difficulty === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {t(difficultyKey)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 ml-11">
                            <span className="font-medium">
                              {tx('profile.actions.whyLabel')}
                            </span>{' '}
                            {t(whyKey)}
                          </p>
                          <p className="text-sm text-gray-700 ml-11">
                            <span className="font-medium">
                              {tx('profile.actions.howLabel')}
                            </span>{' '}
                            {t(howKey)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  </div>
                  
                  {/* Keep old recommendations as secondary (hidden by default, can be expanded) */}
                  <details className="border-t border-gray-200 pt-6">
                    <summary className="text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-900">
                      {tx('profile.actions.showMore')}
                    </summary>
                    <ul className="space-y-3 mt-4">
                      {result.recommendations.map((recKey, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-purple-600 mt-1">•</span>
                          <span className="text-gray-700">{t(recKey)}</span>
                        </li>
                      ))}
                    </ul>
                  </details>

                  {result.contentThemes.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        {tx('profile.contentThemes.title')}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {result.contentThemes.map((themeKey, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {t(themeKey)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {tx('profile.timing.title')}
                    </h3>
                    <ul className="space-y-2">
                      {result.timingSuggestions.map((suggestionKey, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-gray-700">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{t(suggestionKey)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {tx('profile.hashtags.title')}
                    </h3>
                    <ul className="space-y-2">
                      {result.hashtagStrategy.map((strategyKey, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-gray-700">
                          <span className="text-emerald-600 mt-1">•</span>
                          <span>{t(strategyKey)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Why This Helps Section */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                {tx('profile.whyThisHelps.title')}
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {tx('profile.whyThisHelps.item1.title')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {tx('profile.whyThisHelps.item1.description')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {tx('profile.whyThisHelps.item2.title')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {tx('profile.whyThisHelps.item2.description')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {tx('profile.whyThisHelps.item3.title')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {tx('profile.whyThisHelps.item3.description')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {tx('profile.whyThisHelps.item4.title')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {tx('profile.whyThisHelps.item4.description')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {tx('profile.whyThisHelps.item5.title')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {tx('profile.whyThisHelps.item5.description')}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Limitations Notice */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {tx('profile.limitations.title')}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>{t('profile.limitations.item1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>{t('profile.limitations.item2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>{t('profile.limitations.item3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>{t('profile.limitations.item4')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>{t('profile.limitations.item5')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <ToolNavBar />

      {/* How it works */}
      <section className="relative px-4 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-gray-900 mb-4">
              {tx('profile.howItWorks.title')}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light">
              {t('profile.howItWorks.subtitle')}
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
                  {t('profile.howItWorks.step1.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('profile.howItWorks.step1.description')}
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
                  {t('profile.howItWorks.step2.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('profile.howItWorks.step2.description')}
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
                  {t('profile.howItWorks.step3.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('profile.howItWorks.step3.description')}
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
              <span className="font-serif italic font-light text-gray-600" style={{
                fontFamily: 'Noto Serif Display',
                fontWeight: '200'
              }}>
                {t('faq.title.highlight') || ''}
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              {tx('profile.faq.subtitle')}
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-300">
                <button onClick={() => toggleFAQ(index)} className="w-full px-6 md:px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors duration-200">
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
