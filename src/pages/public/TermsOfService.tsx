import PublicLayout from "@/components/layouts/PublicLayout";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

const sections = [
  { title: "1. Acceptance of Terms", content: "By accessing or using the Clarity Trade platform (\"Platform\"), including our website, mobile applications, and APIs, you agree to be bound by these Terms of Service (\"Terms\"). If you do not agree to all of these Terms, you may not access or use the Platform.\n\nThese Terms constitute a legally binding agreement between you (\"User\", \"you\", or \"your\") and Clarity Trade Limited (\"Company\", \"we\", \"us\", or \"our\"), a company incorporated in the United Kingdom." },
  { title: "2. Eligibility", content: "To use the Platform, you must:\n\n• Be at least 18 years old (or the age of legal majority in your jurisdiction)\n• Have full legal capacity to enter into a binding agreement\n• Not be a resident of a restricted jurisdiction where trading services are prohibited\n• Complete our identity verification (KYC) process before engaging in trading activities\n\nBy creating an account, you represent and warrant that you meet all eligibility requirements." },
  { title: "3. Account Registration & Security", content: "When you create an account, you agree to provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.\n\nYou must immediately notify us of any unauthorized access or suspected security breach. We reserve the right to suspend accounts that show signs of suspicious activity." },
  { title: "4. Trading Services", content: "Clarity Trade provides access to cryptocurrency, forex, and commodity markets through our proprietary trading platform. Our services include:\n\n• Spot and margin trading\n• Copy trading functionality\n• Market data and analytics\n• Portfolio management tools\n\nAll trading involves significant risk of loss. Past performance is not indicative of future results." },
  { title: "5. Fees & Charges", content: "Our fee structure is transparent and disclosed before every transaction. Fees may include:\n\n• Trading commissions (varies by instrument)\n• Spread markups on certain pairs\n• Overnight financing charges for leveraged positions\n• Withdrawal processing fees\n• Inactivity fees (after 12 months of no activity)\n\nWe reserve the right to modify fees with 30 days' prior notice." },
  { title: "6. Deposits & Withdrawals", content: "Deposits are credited according to the payment method used. Bank transfers typically take 1-3 business days. Card and crypto deposits are usually processed within minutes.\n\nWithdrawals are processed to the original funding source. Same-day processing is available for verified accounts. We may require additional verification for large withdrawals as part of our anti-money laundering compliance." },
  { title: "7. Intellectual Property", content: "All content on the Platform, including text, graphics, logos, software, and data, is the property of Clarity Trade or its licensors and is protected by copyright, trademark, and other intellectual property laws.\n\nYou may not reproduce, distribute, or create derivative works from any content without our express written permission." },
  { title: "8. Limitation of Liability", content: "To the maximum extent permitted by law, Clarity Trade shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.\n\nOur total liability shall not exceed the amount of fees paid by you to us in the 12 months preceding the event giving rise to liability." },
  { title: "9. Governing Law", content: "These Terms shall be governed by and construed in accordance with the laws of England and Wales. Any disputes arising from these Terms shall be resolved through binding arbitration in London, UK, unless otherwise required by local consumer protection laws." },
  { title: "10. Changes to Terms", content: "We may update these Terms from time to time. Material changes will be communicated via email and through the Platform at least 30 days before they take effect. Your continued use of the Platform after changes take effect constitutes acceptance of the revised Terms." },
  { title: "11. Contact Information", content: "For questions about these Terms of Service, please contact us:\n\n• Email: legal@claritytrade.com\n• Address: One Canada Square, Canary Wharf, London E14 5AB, United Kingdom\n• Phone: +44 20 7946 0958" },
];

export default function TermsOfService() {
  return (
    <PublicLayout title="Terms of Service">
      <PublicPageHeader 
        label="LEGAL"
        title="Terms of Service"
        description="The legally binding agreement between you and Clarity Trade Limited regarding your use of our platform and services. Last updated: March 1, 2026."
        icon={FileText}
        image="/images/security-hero.png"
      />

      <section className="bg-white py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-12">
              {sections.map((section, i) => (
                <motion.div key={section.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <h2 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">{section.title}</h2>
                  <div className="text-gray-500 font-medium leading-relaxed whitespace-pre-line">{section.content}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
