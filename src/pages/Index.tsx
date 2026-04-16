import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import StatisticsSection from "@/components/landing/StatisticsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import MarketPreviewSection from "@/components/landing/MarketPreviewSection";
import CopyTradingSection from "@/components/landing/CopyTradingSection";
import LeaderboardSection from "@/components/landing/LeaderboardSection";
import SubscriptionPlansSection from "@/components/landing/SubscriptionPlansSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import TrustSection from "@/components/landing/TrustSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import RiskDisclaimerSection from "@/components/landing/RiskDisclaimerSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <HeroSection />
      <StatisticsSection />
      <HowItWorksSection />
      <MarketPreviewSection />
      <CopyTradingSection />
      <LeaderboardSection />
      <SubscriptionPlansSection />
      <FeaturesSection />
      <TrustSection />
      <TestimonialsSection />
      <FAQSection />
      <RiskDisclaimerSection />
      <Footer />
    </div>
  );
};

export default Index;
