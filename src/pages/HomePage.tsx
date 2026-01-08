import { NavigationHeader } from '../components/generated/NavigationHeader';
import { HeroSection } from '../components/generated/HeroSection';
import { FAQSection } from '../components/generated/FAQSection';
import { AboutCTASection } from '../components/generated/AboutCTASection';
import { FooterSection } from '../components/generated/FooterSection';
import { AdSlot } from '../ads/AdSlot';

export const HomePage = () => {
  return (
    <>
      <NavigationHeader />
      <HeroSection />
      <AdSlot type="banner-728x90" />
      <FAQSection />
      <AdSlot type="banner-468x60" />
      <AboutCTASection />
      <AdSlot type="banner-728x90" />
      <FooterSection />
    </>
  );
};






