import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { HomePage } from './pages/HomePage';
import { InstagramHubPage } from './pages/InstagramHubPage';
import { ProfileAnalyzerPage } from './pages/ProfileAnalyzerPage';
import { CaptionHashtagGeneratorPage } from './pages/CaptionHashtagGeneratorPage';
import { BioGeneratorPage } from './pages/BioGeneratorPage';
import { ReelCoverGeneratorPage } from './pages/ReelCoverGeneratorPage';
import { FeedAnalyzerPage } from './pages/FeedAnalyzerPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { ScrollToTopOnNavigate } from './components/ScrollToTopOnNavigate';
import { AnchorScroll } from './components/AnchorScroll';
import { AdSidebar } from './components/AdSidebar';

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AdSidebar />
        <ScrollToTopOnNavigate />
        <AnchorScroll />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/instagram" element={<InstagramHubPage />} />
          <Route path="/instagram/profile-analyzer" element={<ProfileAnalyzerPage />} />
          <Route path="/instagram/caption-hashtag-generator" element={<CaptionHashtagGeneratorPage />} />
          <Route path="/instagram/bio-generator" element={<BioGeneratorPage />} />
          <Route path="/instagram/reel-cover-generator" element={<ReelCoverGeneratorPage />} />
          <Route path="/instagram/feed-analyzer" element={<FeedAnalyzerPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
