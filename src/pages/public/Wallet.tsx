import PublicLayout from "@/components/layouts/PublicLayout";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { Wallet as WalletIcon, Shield, CreditCard, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Wallet() {
  const features = [
    { title: "Fiat & Crypto", desc: "Store multiple currencies natively.", icon: WalletIcon },
    { title: "Instant Conversions", desc: "Swap between assets instantly.", icon: RefreshCcw },
    { title: "Bank-Grade Security", desc: "98% cold storage with 2FA.", icon: Shield },
    { title: "Easy Funding", desc: "Wire transfer, ACH, SEPA, Cards.", icon: CreditCard },
  ];

  return (
    <PublicLayout title="Digital Wallet">
      <PublicPageHeader
        label="DIGITAL WALLET"
        title="Universal Wallet"
        description="One dashboard for your entire net worth. Seamlessly bridge fiat, crypto, and commodities."
        icon={WalletIcon}
        image="/images/hero-trading-bg.png"
      />
      <div className="container px-4 md:px-6 max-w-6xl mx-auto py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
           {features.map((f, i) => (
              <motion.div
                 key={f.title}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
                 className="p-8 rounded-3xl border border-border bg-white hover:border-primary/30 hover:shadow-gold transition-all duration-300 group"
              >
                 <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-gradient-gold group-hover:text-white transition-all duration-300 shadow-sm mb-6">
                    <f.icon className="w-7 h-7" />
                 </div>
                 <h3 className="text-xl font-bold font-playfair text-foreground mb-3">{f.title}</h3>
                 <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
           ))}
        </div>

        {/* Institutional Security Section */}
        <section className="py-24 bg-[hsl(40,20%,97%)] -mx-6 md:-mx-24 px-6 md:px-24 rounded-[3rem] shadow-sm mb-24 border border-border/50">
            <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:w-1/2 space-y-8">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest leading-none">
                      <Shield className="w-3.5 h-3.5" /> Institutional Custody
                   </div>
                   <h2 className="text-4xl lg:text-5xl font-playfair font-black text-foreground italic leading-tight uppercase">Your Assets, <span className="text-primary underline underline-offset-8 decoration-gold/30">Fortified</span></h2>
                   <p className="text-lg text-muted-foreground leading-relaxed">
                      We utilize a multi-layered security architecture including MPC (Multi-Party Computation) and isolated offline vaults to ensure the absolute safety of your digital and fiat holdings.
                   </p>
                   <div className="space-y-6 pt-4">
                      {[
                         { title: "Cold Storage Vaults", desc: "98% of all digital assets are kept in geo-distributed offline vaults." },
                         { title: "Real-Time Monitoring", desc: "24/7 AI-driven threat detection monitoring for suspicious withdrawal patterns." },
                         { title: "Insured Deposits", desc: "Fiat balances are held in segregated accounts at top-tier international banks." }
                      ].map((item) => (
                         <div key={item.title} className="p-6 rounded-2xl bg-white border border-border group hover:bg-secondary/20 transition-all">
                            <h4 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">{item.title}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                         </div>
                      ))}
                   </div>
                </motion.div>
                <div className="lg:w-1/2 relative group">
                    <div className="absolute -inset-4 bg-gradient-gold opacity-10 blur-[80px] rounded-full group-hover:opacity-20 transition-opacity" />
                    <img 
                        src="/images/security-shield.png" 
                        alt="Security Infrastructure" 
                        className="rounded-3xl shadow-huge border border-white/20 relative z-10 hover:skew-y-1 transition-transform duration-500"
                    />
                </div>
            </div>
        </section>

        {/* Funding Methods */}
        <div className="mb-24">
            <h2 className="text-3xl font-playfair font-black text-foreground text-center mb-16 uppercase italic tracking-tight">Global <span className="text-primary">Funding</span> Ecosystem</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                    { title: "Bank Wire", desc: "Traditional SWIFT and SEPA transfers accepted in over 15 major currencies.", time: "1-3 Business Days" },
                    { title: "Instant Card", desc: "Fund your wallet instantly using Visa, Mastercard, or American Express.", time: "Immediate" },
                    { title: "Crypto Bridge", desc: "Deposit BTC, ETH, USDT, and 50+ other networks with zero platform fees.", time: "Network Speed" }
                ].map((method) => (
                    <div key={method.title} className="p-8 rounded-3xl bg-secondary/10 border border-border hover:bg-white hover:shadow-gold transition-all group">
                        <div className="text-xs font-black text-primary uppercase tracking-widest mb-4">{method.time}</div>
                        <h3 className="text-xl font-bold text-foreground mb-3 uppercase italic tracking-tight">{method.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{method.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="text-center">
            <div className="inline-block p-1 rounded-2xl bg-gradient-gold shadow-gold mb-12">
               <div className="bg-white px-10 py-12 rounded-xl text-center max-w-2xl">
                  <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tight mb-4">Start Your <span className="text-primary">Digital Journey</span> Today</h3>
                  <p className="text-muted-foreground mb-8 font-medium">Create your secure wallet in less than 2 minutes and join over 12,000 global traders.</p>
                  <Button variant="hero" className="h-14 px-12 text-lg text-white shadow-gold rounded-xl uppercase font-black">
                     Create Secure Wallet
                  </Button>
               </div>
            </div>
        </div>
      </div>
    </PublicLayout>
  );
}
