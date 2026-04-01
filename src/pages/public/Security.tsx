import PublicLayout from "@/components/layouts/PublicLayout";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Shield, Lock, Eye, Server, ShieldCheck, Key, AlertTriangle, CheckCircle2,
  Fingerprint, Globe, Clock, Smartphone, ArrowRight, Database, Wifi, FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

const securityLayers = [
  { icon: Lock, title: "256-Bit AES Encryption", desc: "All data in transit and at rest is encrypted with military-grade AES-256 encryption. Your information is unreadable to anyone but you." },
  { icon: Database, title: "Cold Storage Custody", desc: "98% of all digital assets are stored in air-gapped cold wallets, physically isolated from internet threats. Only 2% maintained in hot wallets for liquidity." },
  { icon: Fingerprint, title: "Biometric Authentication", desc: "Support for fingerprint, Face ID, and hardware security keys. Multi-factor authentication is enforced for all withdrawals and sensitive actions." },
  { icon: Eye, title: "24/7 Threat Monitoring", desc: "Our security operations center monitors for threats around the clock. AI-powered systems detect anomalies in real-time and auto-block suspicious activity." },
  { icon: Server, title: "DDoS Protection", desc: "Enterprise-grade DDoS mitigation ensures the platform stays online even under attack. Multiple failover systems guarantee 99.99% uptime." },
  { icon: FileCheck, title: "Regular Audits", desc: "Annual SOC 2 Type II audits by independent firms. Regular penetration testing by leading cybersecurity companies." },
];

const certifications = [
  { name: "SOC 2 Type II", desc: "Audited controls for security, availability, and confidentiality" },
  { name: "ISO 27001", desc: "International standard for information security management" },
  { name: "PCI DSS", desc: "Payment Card Industry Data Security Standard compliance" },
  { name: "GDPR", desc: "Full compliance with European data protection regulations" },
];

export default function Security() {
  return (
    <PublicLayout title="Security">
      <PublicPageHeader 
        label="SECURITY"
        title="Institutional-Grade Security"
        description="We protect your assets with the same technology used by the world's largest banks and financial institutions. Multiple layers of security ensure your funds and data are always safe."
        icon={Shield}
        image="/images/security-hero.png"
      />

      {/* Insurance Banner */}
      <section className="py-16 bg-white relative z-20 -mt-10">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-[#0B0F14] rounded-3xl border border-[#D4AF37]/20 p-10 flex flex-col lg:flex-row items-center gap-10 shadow-2xl"
          >
            <div className="w-20 h-20 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
              <ShieldCheck className="w-10 h-10 text-[#D4AF37]" />
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h3 className="text-2xl font-black text-white mb-2">$250 Million Insurance Coverage</h3>
              <p className="p-hyip-dark text-sm mb-0">
                All digital assets stored on our platform are insured against theft, hacking, and unauthorized access through 
                our global insurance partners. Your investment is protected.
              </p>
            </div>
            <div className="text-center shrink-0 lg:border-l border-white/10 lg:pl-10">
              <div className="text-4xl font-black text-[#D4AF37] mb-1">$250M</div>
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Insured Fund</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Security Layers */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-black text-gray-900 mb-6 uppercase tracking-tight">Multi-Layer Security</h2>
            <p className="text-lg text-gray-500 font-semibold leading-relaxed">
              We don't rely on a single line of defense. Our security architecture uses six independent 
              layers to protect your assets and personal data.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityLayers.map((layer, i) => (
              <motion.div key={layer.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-white border border-border shadow-sm hover:shadow-xl hover:border-green-200 transition-all duration-500 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-6 group-hover:bg-green-600 transition-all">
                  <layer.icon className="w-7 h-7 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 font-display uppercase tracking-tight">{layer.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{layer.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Protect Your Account */}
      <section className="py-24 bg-[hsl(40,20%,98%)]">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-4xl font-playfair font-bold text-foreground mb-6">How to Protect Your Account</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Security is a shared responsibility. Here are the steps we recommend every trader takes.
              </p>
              <div className="space-y-4">
                {[
                  "Enable two-factor authentication (2FA) using an authenticator app",
                  "Use a unique, strong password that you don't use elsewhere",
                  "Set up withdrawal address whitelisting for crypto",
                  "Review your login history regularly for unfamiliar sessions",
                  "Enable email and SMS notifications for all account activity",
                  "Never share your credentials or recovery codes with anyone",
                ].map((tip) => (
                  <div key={tip} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-foreground font-medium">{tip}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h3 className="text-2xl font-playfair font-bold text-foreground mb-8">Certifications & Compliance</h3>
              <div className="space-y-4">
                {certifications.map((cert) => (
                  <div key={cert.name} className="p-6 rounded-2xl bg-white border border-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{cert.name}</div>
                      <div className="text-sm text-muted-foreground">{cert.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gradient-to-br from-green-50 to-white rounded-3xl border border-green-200 p-16 text-center shadow-lg"
          >
            <h2 className="text-4xl font-playfair font-bold text-foreground mb-6">Trade with Confidence</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Your security is protected by the same technology used by the world's largest banks.
              Start trading knowing your assets are safe.
            </p>
            <Button variant="hero" className="h-14 px-10 rounded-xl text-sm font-bold shadow-gold text-white" asChild>
              <Link to="/auth/register">Open Secure Account <ArrowRight className="w-5 h-5 ml-2" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
