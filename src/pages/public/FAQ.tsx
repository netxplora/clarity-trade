import PublicLayout from "@/components/layouts/PublicLayout";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { HelpCircle, MessageCircle, ArrowRight, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      { q: "How do I open an account?", a: "To open an account, click the 'Register' button at the top right of the page. You'll need to provide your full name, email address, and create a secure password. Once registered, you can complete our seamless KYC process." },
      { q: "What is the minimum deposit?", a: "The minimum deposit to start trading is $100. This allows you to access all major markets including Crypto, Forex, and Commodities." },
      { q: "How long does verification take?", a: "Our automated KYC system typically verifies new accounts within 10-15 minutes. In some cases, manual review might be required, which can take up to 24 hours." },
    ]
  },
  {
    category: "Trading & Markets",
    questions: [
      { q: "Which markets can I trade?", a: "Clarity Trade provides access to 150+ Cryptocurrency pairs, 60+ Forex majors/minors, and 20+ Global Commodities including Gold, Silver, and Oil." },
      { q: "What are your trading fees?", a: "We offer institutional-grade spreads starting from 0.0 pips. Our transparent fee structure includes competitive commissions and zero hidden markups on execution." },
      { q: "Do you offer demo accounts?", a: "Yes, we provide fully functional demo accounts with $10,000 in virtual funds for you to practice strategies in real-time market conditions." },
    ]
  },
  {
    category: "Withdrawals & Security",
    questions: [
      { q: "How do I withdraw my funds?", a: "Withdrawals can be requested directly from your dashboard. Most crypto withdrawals are processed instantly, while bank transfers typically take 1-3 business days." },
      { q: "Is my capital safe?", a: "Your funds are protected by multi-layered institutional security. 98% of assets are kept in cold storage, and all accounts are covered by our $250 Million Insurance Fund." },
    ]
  }
];

export default function FAQ() {
  return (
    <PublicLayout title="Frequently Asked Questions">
      <PublicPageHeader 
        label="FAQ"
        title="Common Questions"
        description="Everything you need to know about our platform, security, and trading services. Can't find what you're looking for? Our team is available 24/5."
        icon={HelpCircle}
        image="/images/3d-hq.png"
      />

      <section className="py-24 bg-white" id="faq-content">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto space-y-20">
            {faqs.map((group, groupIdx) => (
              <div key={group.category} className="space-y-8">
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                  <h2 className="text-3xl font-black text-gray-900 border-l-4 border-[#D4AF37] pl-6">{group.category}</h2>
                </motion.div>
                
                <div className="space-y-4">
                  {group.questions.map((faq, i) => (
                    <motion.div key={faq.q} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                      className="hyip-card !p-8 group hover:!border-[#D4AF37] cursor-pointer"
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-start gap-4">
                        <span className="text-[#D4AF37] font-black">Q.</span>
                        {faq.q}
                      </h3>
                      <p className="text-gray-500 leading-relaxed pl-8">
                        {faq.a}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help CTA */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto bg-white rounded-3xl p-12 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-black text-gray-900 mb-4">Still have questions?</h3>
              <p className="text-gray-500 mb-0">Our dedicated support team is available via live chat and email 24/5.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
               <Button variant="hero" className="h-14 px-10 rounded-xl font-black shadow-gold text-white" asChild>
                  <Link to="/contact">Chat with Us <MessageCircle className="w-5 h-5 ml-2" /></Link>
               </Button>
               <Button variant="outline" className="h-14 px-10 rounded-xl font-black text-gray-900" asChild>
                  <Link to="/help">Visit Help Center <ArrowRight className="w-5 h-5 ml-2" /></Link>
               </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
