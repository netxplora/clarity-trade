import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does copy trading work on ClarityTrade?",
    answer: "Copy trading allows you to automatically mirror the trades of professional, vetted traders on our platform. When they open or close a trade, the exact same action is replicated in your account proportionally to your allocated balance. You maintain full control and can stop copying at any time."
  },
  {
    question: "Is my money safe with ClarityTrade?",
    answer: "Yes, security is our top priority. Client funds are kept in segregated institutional bank accounts separately from company funds. We also employ advanced bank-grade encryption, cold storage for digital assets, and strictly adhere to financial regulations to ensure maximum security for your capital."
  },
  {
    question: "What is the minimum amount required to start investing?",
    answer: "The minimum investment requirement varies depending on the specific portfolio or copy trader you choose, starting from as little as $100 for basic copy trading. However, we recommend starting with an amount that comfortably aligns with your risk tolerance and financial goals."
  },
  {
    question: "How are profits calculated and distributed?",
    answer: "Profits are calculated in real-time based on the performance of your active investments or copy trading allocations. Returns reflect directly in your account dashboard. You can choose to reinvest your profits to utilize compounding growth or withdraw them at any time subject to our standard processing guidelines."
  },
  {
    question: "Can I manage multiple investment strategies simultaneously?",
    answer: "Absolutely. ClarityTrade encourages portfolio diversification. You can allocate your capital across multiple expert traders and automated investment portfolios simultaneously right from your dashboard to spread risk and optimize potential returns."
  }
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-[#0a0a0a] border-t border-[#333]/50" id="faq">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#D4AF37] font-semibold tracking-wider text-sm uppercase">Got Questions?</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
            Frequently Asked Questions
          </h2>
          <p className="text-gray-400">
            Find answers to common questions about our platform, investment plans, and security measures.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#1A1A1A] border border-[#333] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <span className="font-semibold text-white/90 text-lg pr-8">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-[#D4AF37] transition-transform duration-300 flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`} 
                  />
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="p-6 pt-0 border-t border-[#333]/50 text-gray-400 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
