import PublicLayout from "@/components/layouts/PublicLayout";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const sections = [
  { title: "1. Information We Collect", content: "We collect information that you provide directly to us, including:\n\n• Personal identification information (name, email address, date of birth)\n• Government-issued ID documents for identity verification (KYC)\n• Financial information (bank account details, payment card information)\n• Trading activity and transaction history\n• Communications with our support team\n\nWe also automatically collect certain information when you use our Platform, including IP address, browser type, operating system, device identifiers, and usage analytics." },
  { title: "2. How We Use Your Information", content: "We use the information we collect for the following purposes:\n\n• To provide, maintain, and improve our trading services\n• To process transactions and send related notifications\n• To verify your identity and comply with KYC/AML regulations\n• To detect, prevent, and address fraud, security issues, and technical problems\n• To send you updates, marketing communications, and promotional offers (with your consent)\n• To provide customer support and respond to your inquiries\n• To generate anonymized analytics to improve our services" },
  { title: "3. Data Sharing & Disclosure", content: "We do not sell your personal information to third parties. We may share your information with:\n\n• Regulatory authorities when required by law\n• KYC/AML verification service providers\n• Payment processors for deposit and withdrawal transactions\n• Cloud infrastructure providers (data remains encrypted)\n• Professional advisors (lawyers, auditors) under strict confidentiality\n\nAll third-party providers are contractually bound to protect your data and use it only for the specified purpose." },
  { title: "4. Data Security", content: "We implement industry-standard security measures to protect your personal data, including:\n\n• 256-bit AES encryption for data in transit and at rest\n• Regular security audits and penetration testing\n• Access controls with least-privilege principles\n• Multi-factor authentication for internal systems\n• SOC 2 Type II certified data centers\n\nWhile we take all reasonable precautions, no method of electronic storage or transmission is 100% secure." },
  { title: "5. Data Retention", content: "We retain your personal data for as long as your account is active or as needed to provide services. After account closure, we retain certain data for:\n\n• 5 years for financial transaction records (regulatory requirement)\n• 7 years for KYC documentation (AML compliance)\n• 30 days for server logs and access records\n\nAnonymized analytics data may be retained indefinitely." },
  { title: "6. Your Rights", content: "Depending on your jurisdiction, you may have the following rights:\n\n• Right to access your personal data\n• Right to rectification of inaccurate information\n• Right to erasure (\"right to be forgotten\")\n• Right to restrict processing\n• Right to data portability\n• Right to object to processing\n• Right to withdraw consent\n\nTo exercise any of these rights, contact us at privacy@claritytrade.com. We will respond within 30 days." },
  { title: "7. International Data Transfers", content: "Your data may be transferred to and processed in countries other than your own. We ensure adequate data protection through:\n\n• Standard Contractual Clauses (SCCs) approved by the European Commission\n• Adequacy decisions where applicable\n• Binding Corporate Rules for internal transfers\n\nAll international transfers comply with GDPR and applicable data protection laws." },
  { title: "8. Children's Privacy", content: "Our Platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from minors. If we learn that we have collected data from a child, we will take steps to delete it promptly." },
  { title: "9. Changes to This Policy", content: "We may update this Privacy Policy periodically. We will notify you of material changes via email and through the Platform. The \"Last Updated\" date at the top of this page indicates when this policy was last revised." },
  { title: "10. Contact Us", content: "For questions about this Privacy Policy or your personal data, contact our Data Protection Officer:\n\n• Email: privacy@claritytrade.com\n• Address: Data Protection Officer, Clarity Trade Limited, One Canada Square, Canary Wharf, London E14 5AB\n• Phone: +44 20 7946 0958" },
];

export default function PrivacyPolicy() {
  return (
    <PublicLayout title="Privacy Policy">
      <PublicPageHeader 
        label="LEGAL"
        title="Privacy Policy"
        description="We are committed to protecting your personal information and your right to privacy. This policy explains what information we collect, how we use it, and what rights you have."
        icon={Shield}
        image="/images/security-hero.png"
      />

      <section className="bg-white py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
              <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                <p className="text-gray-900 leading-relaxed font-bold">
                  At Clarity Trade, we are committed to protecting your personal information and your right to privacy. 
                  This Privacy Policy explains what information we collect, how we use it, and what rights you have 
                  in relation to your data. We comply with the General Data Protection Regulation (GDPR) and all 
                  applicable data protection laws.
                </p>
                <p className="text-gray-400 mt-4 text-xs font-black uppercase tracking-widest">Last updated: March 1, 2026</p>
              </div>
            </motion.div>

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
