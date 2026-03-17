import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import CopyTradingSection from "@/components/landing/CopyTradingSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import TrustSection from "@/components/landing/TrustSection";
import MarketPreviewSection from "@/components/landing/MarketPreviewSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <CopyTradingSection />
      <FeaturesSection />
      <TrustSection />
      <MarketPreviewSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
