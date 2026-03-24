import PublicLayout from "@/components/layouts/PublicLayout";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { motion } from "framer-motion";
import { Cookie, CheckCircle2 } from "lucide-react";

const sections = [
  { title: "1. What Are Cookies?", content: "Cookies are small text files that are stored on your device (computer, tablet, or smartphone) when you visit a website. They help the website recognize your device and remember information about your visit, such as your preferred language or login status.\n\nCookies do not contain personally identifiable information on their own, but personal data we store about you may be linked to cookies." },
  { title: "2. Types of Cookies We Use", content: "", subsections: [
    { name: "Strictly Necessary Cookies", desc: "Essential for the website to function. These enable core features like security, session management, and account access. You cannot opt out of these cookies.", examples: "Session cookies, CSRF tokens, authentication cookies" },
    { name: "Performance Cookies", desc: "Collect information about how you use our website (pages visited, errors encountered). This data is aggregated and anonymous, helping us improve site performance.", examples: "Google Analytics, performance monitoring" },
    { name: "Functionality Cookies", desc: "Remember your preferences and settings (language, timezone, display preferences) to provide a personalized experience.", examples: "Theme preferences, language settings, chart configurations" },
    { name: "Marketing Cookies", desc: "Track your activity across websites to deliver relevant advertisements. We only use these with your explicit consent.", examples: "Social media pixels, advertising cookies" },
  ]},
  { title: "3. How to Manage Cookies", content: "You can control and manage cookies in several ways:\n\n• Browser settings: Most browsers allow you to block or delete cookies through their settings menu\n• Our cookie preferences: Use the cookie banner that appears when you first visit our site\n• Third-party opt-outs: Visit the opt-out pages of advertising networks\n\nPlease note that blocking certain cookies may impact your experience on the Platform. Strictly necessary cookies cannot be disabled as they are required for the Platform to function." },
  { title: "4. Third-Party Cookies", content: "Some cookies on our Platform are placed by third-party services that appear on our pages. We use trusted partners including:\n\n• Google Analytics — for website performance analysis\n• Intercom — for live chat support\n• Stripe — for payment processing\n\nWe do not control these third-party cookies. Please refer to the respective privacy policies of these providers for more information about their cookie practices." },
  { title: "5. Cookie Retention", content: "Session cookies are deleted when you close your browser. Persistent cookies remain on your device for a set period:\n\n• Authentication cookies: up to 30 days\n• Preference cookies: up to 1 year\n• Analytics cookies: up to 2 years\n• Marketing cookies: up to 90 days" },
  { title: "6. Updates to This Policy", content: "We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our cookie practices. Any changes will be posted on this page with an updated revision date." },
  { title: "7. Contact Us", content: "If you have questions about our use of cookies, please contact us:\n\n• Email: privacy@claritytrade.com\n• Address: Clarity Trade Limited, One Canada Square, Canary Wharf, London E14 5AB" },
];

export default function CookiePolicy() {
  return (
    <PublicLayout title="Cookie Policy">
      <PublicPageHeader 
        label="LEGAL"
        title="Cookie Policy"
        description="Transparent information on how we use cookies and tracking technologies to enhance your trading experience. Last updated: March 1, 2026."
        icon={Cookie}
        image="/images/security-hero.png"
      />

      <section className="bg-white py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-12">
              {sections.map((section, i) => (
                <motion.div key={section.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <h2 className="text-2xl font-bold text-foreground mb-4 font-playfair">{section.title}</h2>
                  {section.content && <div className="text-muted-foreground leading-relaxed whitespace-pre-line mb-6">{section.content}</div>}
                  {section.subsections && (
                    <div className="space-y-6">
                      {section.subsections.map((sub) => (
                        <div key={sub.name} className="p-6 rounded-2xl bg-secondary/50 border border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                            <h3 className="font-bold text-foreground">{sub.name}</h3>
                          </div>
                          <p className="text-muted-foreground leading-relaxed mb-2">{sub.desc}</p>
                          <p className="text-xs text-muted-foreground"><span className="font-semibold">Examples:</span> {sub.examples}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
