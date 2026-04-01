import PublicLayout from "@/components/layouts/PublicLayout";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { LineChart, BarChart3, Zap, Globe, Target, LayoutDashboard, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Trading() {
  const features = [
    { title: "Advanced Charting", desc: "Powered by deep liquidity. 100+ indicators and real-time order books.", icon: BarChart3 },
    { title: "Microsecond Execution", desc: "Ultra-low latency trading system capable of 1M+ TPS.", icon: Zap },
    { title: "Global Markets", desc: "Trade crypto, forex, and commodities from a single marginalized account.", icon: Globe },
    { title: "Algorithmic Orders", desc: "TWAP, VWAP, Iceberg, and conditional trigger orders built in.", icon: Target },
  ];

  return (
    <PublicLayout title="Trading Platform">
      <PublicPageHeader
        label="TRADING"
        title="Pro Trading Platform"
        description="The ultimate platform for active traders. Execute across crypto, forex, and commodities with surgical precision and depth."
        icon={LineChart}
        image="/images/trading-terminal.png"
      />
      <div className="container px-4 md:px-6 max-w-6xl mx-auto py-24 text-gray-900">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl font-display font-black text-gray-900 mb-6 uppercase tracking-tight">Built for the Pros</h2>
          <p className="text-lg text-gray-500 leading-relaxed font-semibold">
            Stop fighting your platform. Clarity Trade gives you the layout, speed, and analytical power previously reserved for high-frequency trading firms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
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
                 <h3 className="text-2xl font-bold font-display text-gray-900 mb-3 uppercase tracking-tight">{f.title}</h3>
                 <p className="text-gray-500 leading-relaxed font-medium">{f.desc}</p>
              </motion.div>
           ))}
        </div>

        {/* Trade Across Asset Classes */}
        <section className="py-24 bg-white mb-24 rounded-[3rem] border border-border shadow-sm overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="heading-gold">Multi-Asset Ecosystem</span>
                    <h2 className="title-hyip text-gray-900 leading-tight">A Single Account for <span className="text-[#D4AF37]">Global Markets</span></h2>
                </div>
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {[
                        { title: "Digital Assets", desc: "Access 150+ spot and perpetual pairs with deep liquidity and tight spreads.", icon: Globe, color: "blue" },
                        { title: "Forex Majors", desc: "Trade global currencies with 500:1 leverage and no hidden re-quotes.", icon: Zap, color: "green" },
                        { title: "Commodities", desc: "Gold, Silver, and Crude Oil trading with institutional-grade pricing.", icon: LineChart, color: "amber" }
                    ].map((asset) => (
                        <div key={asset.title} className="p-10 rounded-[2.5rem] bg-gray-50 border border-gray-100 group hover:bg-white hover:shadow-huge transition-all">
                            <div className={`w-14 h-14 rounded-2xl bg-${asset.color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <asset.icon className={`w-7 h-7 text-${asset.color}-600`} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">{asset.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed font-medium">{asset.desc}</p>
                            <Button variant="link" className="p-0 h-auto mt-6 text-[#D4AF37] font-bold uppercase tracking-widest text-xs flex items-center gap-2 group-hover:gap-3 transition-all">
                                Explore Market <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Infrastructure Section */}
        <div className="flex flex-col lg:flex-row gap-16 items-center mb-24">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:w-1/2 space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest leading-none">
                   <Zap className="w-3.5 h-3.5" /> High Frequency Infrastructure
                </div>
                <h2 className="text-4xl lg:text-5xl font-display font-black text-gray-900 leading-tight uppercase">Surgical Precision in <span className="text-primary underline underline-offset-8 decoration-gold/30">Every Order</span></h2>
                <div className="space-y-6">
                    {[
                        { title: "Sub-2ms Execution", desc: "Our data centers in London and NYC provide the fastest execution in retail trading." },
                        { title: "Zero Slippage Liquidity", desc: "Deep institutional pools ensure your orders are filled at the price you see." },
                        { title: "Level 2 Visual Depth", desc: "See exactly where the big money is moving with real-time order book transparency." }
                    ].map((item) => (
                        <div key={item.title} className="p-6 rounded-2xl bg-white border border-border group hover:border-primary/30 transition-all">
                            <h4 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-primary transition-colors">{item.title}</h4>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
            <div className="lg:w-1/2 relative">
                <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <img src="/images/trading-terminal.png" className="rounded-3xl shadow-lg border border-border" alt="Trading Interface" />
                        <div className="bg-primary p-8 rounded-3xl shadow-gold text-white">
                            <div className="text-4xl font-black mb-1">1M+</div>
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">TPS Latency</div>
                        </div>
                    </div>
                    <div className="space-y-4 pt-8">
                        <div className="bg-white p-8 rounded-3xl border border-border shadow-huge">
                            <div className="text-3xl font-black text-gray-900 mb-1">99.99%</div>
                            <div className="text-[10px] text-primary font-black uppercase tracking-widest">Uptime Record</div>
                        </div>
                        <img src="/images/dashboard-mock.png" className="rounded-3xl shadow-lg border border-border" alt="System 2" />
                    </div>
                </div>
            </div>
        </div>

        <div className="relative rounded-3xl overflow-hidden bg-[#1a1510] border border-primary/20 p-1 lg:p-4">
           <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-50 pointer-events-none" />
           <div className="rounded-[1.5rem] overflow-hidden bg-background aspect-video border border-white/10 shadow-huge relative flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('/images/hero-trading-bg.png')" }}>
              <div className="absolute inset-0 bg-black/60" />
              <div className="text-center relative z-10 px-4">
                 <h3 className="text-4xl font-display font-black text-white mb-8 uppercase italic tracking-wider">Ready to see the <span className="text-primary underline decoration-gold/40">difference?</span></h3>
                 <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <Button variant="hero" className="h-14 px-12 text-lg text-white shadow-gold rounded-xl uppercase font-bold tracking-widest" asChild>
                       <Link to="/auth/register">Open Free Account</Link>
                    </Button>
                    <Button variant="outline" className="h-14 px-12 text-lg bg-transparent text-white border-white/20 hover:bg-white/10 rounded-xl uppercase font-bold tracking-widest" asChild>
                       <Link to="/trading">Trading Demo</Link>
                    </Button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </PublicLayout>
  );
}
