import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card glass-glow p-12 md:p-16 text-center max-w-4xl mx-auto relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/20 rounded-full blur-[80px]" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
              Ready to Start <span className="text-gradient-primary">Trading</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-8">
              Join 12,000+ traders already growing their portfolios. Fund with crypto and start in minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="lg" className="text-base px-8 py-6">
                Create Free Account <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
              <Button variant="hero-outline" size="lg" className="text-base px-8 py-6">
                Explore Traders
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
