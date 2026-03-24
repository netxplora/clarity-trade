import PublicLayout from "@/components/layouts/PublicLayout";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Gem, TrendingUp, ShieldCheck, BarChart3, ArrowRight, CheckCircle2, Zap,
  Globe, Fuel, Wheat, ArrowUpRight, Sun, Scale
} from "lucide-react";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";

const commodities = [
  { name: "Gold", symbol: "XAU/USD", price: "$2,342.80", change: "+1.24%", up: true, category: "Metals" },
  { name: "Silver", symbol: "XAG/USD", price: "$27.45", change: "+0.82%", up: true, category: "Metals" },
  { name: "Crude Oil (WTI)", symbol: "CL", price: "$78.42", change: "-0.56%", up: false, category: "Energy" },
  { name: "Natural Gas", symbol: "NG", price: "$2.18", change: "+2.31%", up: true, category: "Energy" },
];

const categories = [
  { 
    icon: Gem, title: "Precious Metals",
    items: ["Gold (XAU)", "Silver (XAG)", "Platinum (XPT)", "Palladium (XPD)"],
    desc: "Trade gold, silver, and other precious metals — the ultimate safe-haven assets for portfolio hedging."
  },
  { 
    icon: Fuel, title: "Energy",
    items: ["Crude Oil (WTI)", "Brent Crude", "Natural Gas", "Heating Oil"],
    desc: "Access the world's most traded energy markets. Benefit from geopolitical movements and cycles."
  },
  { 
    icon: Wheat, title: "Agriculture",
    items: ["Wheat", "Corn", "Soybeans", "Coffee", "Sugar"],
    desc: "Diversify into soft commodities. Trade the products that feed the world, driven by supply-demand."
  },
];

export default function Commodities() {
  return (
    <PublicLayout title="Commodities Trading">
      <PublicPageHeader 
        label="COMMODITIES TRADING"
        title="Trade Gold, Oil, and Beyond"
        description="Diversify your portfolio with the world's most essential raw materials. From precious metals to energy and agriculture — all with tight spreads and deep liquidity."
        icon={Gem}
        image="/images/commodities-hero.png"
      />

      {/* Live Commodity Prices */}
      <section className="section-bg-white" id="prices">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
            <span className="heading-gold">Real-Time Assets</span>
            <h2 className="title-hyip text-gray-900">Global Material Markets</h2>
            <p className="p-hyip">Check the latest movements in essential raw materials and energy resources.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
             {commodities.map((c, i) => (
                <motion.div key={c.symbol} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="hyip-card group"
                >
                  <div className="flex items-center justify-between mb-4">
                     <div className="w-10 h-10 rounded bg-[#D4AF37]/10 flex items-center justify-center font-black text-xs text-[#D4AF37]">
                        {c.symbol}
                     </div>
                     <div className={`text-xs font-bold ${c.up ? 'text-green-500' : 'text-red-500'}`}>
                        {c.change}
                     </div>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-1">{c.name}</h3>
                  <div className="text-xl font-bold text-gray-800 tabular-nums mb-4">{c.price}</div>
                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                     <span className="text-[10px] uppercase font-bold text-gray-400">{c.category}</span>
                     <Link to="/register" className="text-[#D4AF37] hover:scale-110 transition-transform"><ArrowUpRight className="w-4 h-4" /></Link>
                  </div>
                </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="section-bg-light" id="categories">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
            <span className="heading-gold">Market Sectors</span>
            <h2 className="title-hyip text-gray-900">Major Commodity Sectors</h2>
            <p className="p-hyip">Explore the different classes of commodities available for institutional-grade trading.</p>
          </motion.div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {categories.map((cat, i) => (
              <motion.div key={cat.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="hyip-card !p-10 group h-full flex flex-col"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#D4AF37] flex items-center justify-center mb-8 shadow-gold-sm">
                  <cat.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">{cat.title}</h3>
                <p className="p-hyip text-sm mb-8 flex-grow">{cat.desc}</p>
                <div className="space-y-3 pt-6 border-t border-gray-100">
                  {cat.items.map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                      <span className="text-sm text-gray-700 font-bold">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Commodities - Dark Background Section */}
      <section className="section-bg-dark" id="why">
        <div className="flex flex-col lg:flex-row items-stretch">
          <div className="lg:w-1/2 p-20 lg:p-32 flex flex-col justify-center bg-[#F5F5F5]">
             <span className="heading-gold !text-left">Market Hedge</span>
             <h2 className="title-hyip text-gray-900 !text-left">The Ultimate <span className="text-[#D4AF37]">Safe Haven</span></h2>
             <p className="p-hyip mb-10 !text-left">
                Commodities provide a natural hedge against inflation and currency devaluation. 
                Move your capital into hard assets during times of global economic uncertainty.
             </p>
             <div className="space-y-6">
                {[
                  "Spot Gold & Silver Trading",
                  "Energy Futures & Spot Crude",
                  "Cross-Asset Margining",
                  "Daily Commodity Insights",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-4">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <span className="text-gray-800 font-bold text-base">{item}</span>
                  </div>
                ))}
             </div>
             <div className="mt-12">
                <Link to="/register" className="btn-gold !px-12">Start Your Portfolio</Link>
             </div>
          </div>
          <div className="lg:w-1/2 min-h-[500px] relative">
             <img 
               src="/images/commodities-gold.png" 
               alt="Commodities Background" 
               className="absolute inset-0 w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-[#0B0F14]/20" />
          </div>
        </div>
      </section>

      {/* Safety - White Section */}
      <section className="section-bg-white py-24" id="safety">
        <div className="container mx-auto px-6 text-center max-w-4xl mx-auto">
           <ShieldCheck className="w-16 h-16 text-[#D4AF37] mx-auto mb-10" />
           <h2 className="title-hyip text-gray-900 mb-8">SECURE ASSET MANAGEMENT</h2>
           <p className="p-hyip mb-12 text-lg">
             We ensure that all commodity trades are executed with extreme precision, using segregated 
             custodial accounts to protect your capital and ensure liquidity at all times.
           </p>
           <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link to="/register" className="btn-gold !px-12 flex items-center justify-center gap-2">Create Account <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/contact" className="btn-gold-outline !px-12">Talk to Support</Link>
           </div>
        </div>
      </section>
    </PublicLayout>
  );
}
