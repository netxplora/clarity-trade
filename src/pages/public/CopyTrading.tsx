import PublicLayout from "@/components/layouts/PublicLayout";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { Users, Copy, ArrowRight, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function CopyTrading() {
  const steps = [
    { title: "Select a Pro", desc: "Filter by ROI, risk score, and asset class.", icon: Users },
    { title: "Allocate Funds", desc: "Set risk limits, stop losses, and take profit margins.", icon: Copy },
    { title: "Mirror Trades", desc: "Our engine executes their trades on your account in less than 5ms.", icon: ArrowRight },
    { title: "Earn & Grow", desc: "Pay them a performance fee only on profitable trades.", icon: Star },
  ];

  return (
    <PublicLayout title="Copy Trading">
      <PublicPageHeader
        label="COPY TRADING"
        title="Copy the Masters"
        description="Don't just watch the masters. Trade exactly like them, automatically. Our network of vetted professionals is ready to grow your portfolio."
        icon={Users}
        image="/images/copy-trading-hero.png"
      />
      
      <div className="container px-4 md:px-6 max-w-6xl mx-auto py-24 text-gray-900">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-display font-black text-gray-900 mb-6 uppercase tracking-tight">Automate Your Alpha</h2>
          <p className="text-lg text-gray-500 leading-relaxed font-semibold">
            Our Copy Trading infrastructure allows you to mirror the strategies of vetted, audited professional traders in real-time, completely passively.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-24">
           {steps.map((f, i) => (
              <motion.div
                 key={f.title}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
                 className="p-8 rounded-3xl border border-border bg-white text-center hover:shadow-gold transition-all duration-300 group relative"
              >
                 <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-gradient-gold group-hover:text-white transition-all duration-300 shadow-sm mx-auto mb-6">
                    <f.icon className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-bold font-display text-gray-900 mb-3 uppercase tracking-tight">{f.title}</h3>
                 <p className="text-sm text-gray-500 font-medium leading-relaxed">{f.desc}</p>
                 {i !== steps.length - 1 && <ArrowRight className="absolute -right-5 top-14 w-6 h-6 text-border hidden md:block" />}
              </motion.div>
           ))}
        </div>

        {/* Why Choose Copy Trading */}
        <section className="py-24 bg-[hsl(40,20%,97%)] -mx-6 md:-mx-24 px-6 md:px-24 rounded-[3rem] shadow-sm mb-24 border border-border/50">
            <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
                        <Star className="w-3.5 h-3.5" /> Premium Infrastructure
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-playfair font-black text-foreground italic leading-tight uppercase">Why Lead Traders <span className="text-primary">Choose Us?</span></h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        We don't just provide a platform; we provide the most advanced copy-engine in the financial industry. For lead traders, this means seamless scaling and fair attribution.
                    </p>
                    <div className="grid gap-6 pt-4">
                        {[
                            { title: "Ultra-Low Latency", desc: "Proprietary bridge technology mirroring trades in under 5ms globally." },
                            { title: "Fair Calculation Engine", desc: "Equity-based lot sizing ensures proportional profits for all copiers." },
                            { title: "Risk Safeguards", desc: "Pre-execution risk checks prevent mirroring invalid or high-leverage orders." }
                        ].map((item) => (
                            <div key={item.title} className="flex gap-4 group">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1 border border-primary/30 group-hover:bg-primary/40 transition-colors">
                                    <ArrowRight className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-lg text-foreground uppercase italic tracking-tight">{item.title}</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button variant="hero" className="h-14 px-10 text-lg rounded-xl shadow-gold text-white uppercase italic font-bold">
                        Start Copying Now
                    </Button>
                </motion.div>
                <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-gold opacity-10 blur-[80px] rounded-full group-hover:opacity-20 transition-opacity" />
                    <img 
                        src="/images/pro-traders.png" 
                        alt="Copy Trading Dashboard" 
                        className="rounded-3xl shadow-huge border border-white/20 relative z-10 hover:scale-[1.02] transition-transform duration-500"
                    />
                    <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-2xl shadow-xl border border-border z-20 max-w-[200px] hover:translate-x-2 transition-transform hidden md:block">
                        <div className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-2">Average ROI</div>
                        <div className="text-3xl font-black text-foreground">+24.8% <span className="text-xs text-green-500 uppercase tracking-tight">/mo</span></div>
                        <div className="text-[9px] text-muted-foreground mt-2 italic font-medium leading-tight text-center">Audited performance records since 2021.</div>
                    </div>
                </div>
            </div>
        </section>

        {/* Global Network Section */}
        <div className="mb-24 text-center">
            <h2 className="text-3xl font-playfair font-black text-foreground mb-12 uppercase italic tracking-tight"><span className="text-primary">Vetted</span> Global Performance</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { val: "1,240+", label: "Verified Masters" },
                    { val: "$420M+", label: "Allocated Equity" },
                    { val: "2M+", label: "Copied Trades" },
                    { val: "$88M+", label: "Paid Profits" }
                ].map((stat) => (
                    <div key={stat.label} className="p-8 rounded-3xl bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors">
                        <div className="text-4xl font-black text-foreground mb-2 flex items-center justify-center tracking-tighter italic">{stat.val}</div>
                        <div className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* FAQ Preview */}
        <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-3xl font-playfair font-black text-foreground text-center mb-12 uppercase italic tracking-tight">Copy Trading <span className="text-primary">Essentials</span></h2>
            <div className="grid gap-4">
                {[
                    { q: "Is there a minimum investment for copy trading?", a: "Each master trader sets their own minimum, typically ranging from $100 to $1,000 to ensure proper margin coverage." },
                    { q: "How are performance fees calculated?", a: "Fees are only charged on new profits made on your account, using a High-Water Mark (HWM) methodology." },
                    { q: "Can I stop copying at any time?", a: "Yes, you have full control. You can stop copying or change allocation limits instantly with one click." }
                ].map((faq) => (
                    <div key={faq.q} className="p-8 rounded-2xl bg-white border border-border hover:border-primary/30 transition-all group">
                        <h4 className="text-lg font-bold text-foreground mb-4 uppercase italic tracking-tight group-hover:text-primary transition-colors">{faq.q}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="text-center mt-24">
            <Button variant="hero" className="h-14 px-12 text-lg rounded-xl shadow-gold text-white font-black uppercase tracking-widest">
                Browse Masters Market <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
        </div>
      </div>
    </PublicLayout>
  );
}
