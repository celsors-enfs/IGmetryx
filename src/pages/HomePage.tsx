import { NavigationHeader } from '../components/generated/NavigationHeader';
import { HeroSection } from '../components/generated/HeroSection';
import { FAQSection } from '../components/generated/FAQSection';
import { AboutCTASection } from '../components/generated/AboutCTASection';
import { FooterSection } from '../components/generated/FooterSection';
import { AdBanner468x60 } from '../components/AdBanner468x60';

export const HomePage = () => {
  return (
    <>
      <NavigationHeader />
      <HeroSection />
      <AdBanner468x60 />
      <FAQSection />
      <AdBanner468x60 />
      <AboutCTASection />
      <FooterSection />
    </>
  );
};






