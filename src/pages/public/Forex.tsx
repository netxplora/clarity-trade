import PublicLayout from "@/components/layouts/PublicLayout";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Globe, TrendingUp, Clock, ShieldCheck, BarChart3, ArrowRight, CheckCircle2, Zap,
  Activity, DollarSign, ArrowUpRight, Target, Lock
} from "lucide-react";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";

const forexPairs = [
  { pair: "EUR/USD", bid: "1.0842", ask: "1.0845", spread: "0.3", change: "+0.12%", up: true },
  { pair: "GBP/USD", bid: "1.2654", ask: "1.2658", spread: "0.4", change: "+0.08%", up: true },
  { pair: "USD/JPY", bid: "150.42", ask: "150.45", spread: "0.3", change: "-0.24%", up: false },
  { pair: "AUD/USD", bid: "0.6523", ask: "0.6527", spread: "0.4", change: "+0.15%", up: true },
];

const forexBenefits = [
  { icon: Clock, title: "24/5 Trading", desc: "Trade forex around the clock from Sunday evening to Friday night. Major market sessions covered." },
  { icon: Zap, title: "Ultra-Low Spreads", desc: "Spreads from 0.0 pips on major pairs with our ECN liquidity model. No markups, no hidden fees." },
  { icon: Target, title: "Leverage Up to 500:1", desc: "Flexible leverage options let you control larger positions with less capital." },
  { icon: Activity, title: "Advanced Charting", desc: "Professional-grade charts with 100+ technical indicators and drawing tools." },
];

export default function Forex() {
  return (
    <PublicLayout title="Forex Trading">
      <PublicPageHeader 
        label="FOREX TRADING"
        title="Trade the World's Largest Market"
        description="The forex market moves daily with institutional spreads, lightning-fast execution, and the tools used by professional currency traders. Access deep liquidity with zero markup on major pairs."
        icon={DollarSign}
        image="/images/forex-hero.png"
      />

      {/* Forex Live Spreads */}
      <section className="section-bg-white" id="prices">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
            <span className="heading-gold">Real-Time Spreads</span>
            <h2 className="title-hyip text-gray-900">Global Currency Markets</h2>
            <p className="p-hyip">Explore deep liquidity and tight spreads on the world's most traded forex pairs.</p>
          </div>

          <div className="max-w-5xl mx-auto overflow-x-auto no-scrollbar">
             <div className="min-w-[800px] hyip-card !p-0 overflow-hidden shadow-lg border border-gray-100">
                <table className="w-full text-left">
                   <thead className="bg-gray-50 border-b border-gray-100 uppercase text-[10px] font-black tracking-widest text-[#D4AF37]">
                      <tr>
                        <th className="px-8 py-5">Pair</th>
                        <th className="px-8 py-5">Bid Price</th>
                        <th className="px-8 py-5">Ask Price</th>
                        <th className="px-8 py-5">Spread (Pips)</th>
                        <th className="px-8 py-5">24H Change</th>
                        <th className="px-8 py-5 text-center">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {forexPairs.map((p, i) => (
                        <tr key={p.pair} className="hover:bg-gray-50/50 transition-colors group">
                           <td className="px-8 py-6 font-black text-gray-900 group-hover:text-[#D4AF37] transition-colors">{p.pair}</td>
                           <td className="px-8 py-6 tabular-nums font-bold text-gray-800">{p.bid}</td>
                           <td className="px-8 py-6 tabular-nums font-bold text-gray-800">{p.ask}</td>
                           <td className="px-8 py-6 tabular-nums font-black text-[#D4AF37]">{p.spread}</td>
                           <td className={`px-8 py-6 font-bold flex items-center gap-2 ${p.up ? 'text-green-500' : 'text-red-500'}`}>
                              {p.up ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />} {p.change}
                           </td>
                           <td className="px-8 py-6 text-center">
                              <Link to="/register" className="btn-gold !py-2 !px-4 text-[10px] uppercase font-bold tracking-widest whitespace-nowrap">Trade Now</Link>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      </section>

      {/* Benefits Content */}
      <section className="section-bg-light" id="benefits">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
            <span className="heading-gold">Why Choose Forex?</span>
            <h2 className="title-hyip text-gray-900">Unmatched Trading Conditions</h2>
            <p className="p-hyip">Experience low-latency execution and the depth of liquidity built for professional scalpers and swing traders.</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {forexBenefits.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="hyip-card group h-full"
              >
                <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-6 border border-[#D4AF37]/20 group-hover:bg-[#D4AF37] transition-all">
                  <item.icon className="w-6 h-6 text-[#D4AF37] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-[#D4AF37] transition-colors">{item.title}</h3>
                <p className="p-hyip text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Liquidity Node - Split Section */}
      <section className="bg-[#0B0F14] overflow-hidden">
        <div className="flex flex-col lg:flex-row items-stretch">
          <div className="lg:w-1/2 min-h-[500px] relative">
             <img 
               src="/images/forex-globe.png" 
               alt="Forex Markets" 
               className="absolute inset-0 w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0B0F14]" />
          </div>
          <div className="lg:w-1/2 p-20 lg:p-32 flex flex-col justify-center">
             <span className="heading-gold !text-left">Liquidity Node</span>
             <h2 className="title-hyip text-white !text-left leading-tight">Global Interbank <span className="text-[#D4AF37]">Access</span></h2>
             <p className="p-hyip-dark mb-10 !text-left">
                We bridge the gap between retail traders and institutional liquidity providers, 
                offering direct access to the interbank market with no hidden re-quotes.
             </p>
             <div className="grid grid-cols-2 gap-8 mb-12">
                {[
                  { label: "Execution", value: "Sub 10ms" },
                  { label: "Deeper Pool", value: "15+ LPs" },
                  { label: "Margin", value: "0.01 Lot" },
                  { label: "Support", value: "24/5 Live" },
                ].map((stat) => (
                  <div key={stat.label} className="border-l-2 border-[#D4AF37] pl-6 py-2">
                     <div className="text-2xl font-black text-white">{stat.value}</div>
                     <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
             </div>
             <div>
                <Link to="/register" className="btn-gold !px-12">Join The Market</Link>
             </div>
          </div>
        </div>
      </section>

      {/* Sessions - Grid Section */}
      <section className="section-bg-dark" id="sessions">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center max-w-6xl mx-auto">
             <div>
                <span className="heading-gold !text-left">Market Timings</span>
                <h2 className="title-hyip text-white !text-left italic">Access Global <span className="text-primary">Sessions</span> 24 Hours a Day</h2>
                <p className="p-hyip-dark mb-10 text-lg !text-left">
                   The forex market is effectively a 24/5 market. Trade the London opening, the New York volatility, 
                   and the Asian market trends across all trading sessions.
                </p>
                <div className="space-y-4">
                   {[
                     "London Opening: High Volatility Session",
                     "New York Session: Major USD Volume",
                     "Tokyo-Sydney: Asian Market Trends",
                     "Overlapping Sessions for Maximum Liquidity",
                   ].map((item) => (
                      <div key={item} className="flex items-center gap-4">
                         <CheckCircle2 className="w-5 h-5 text-green-400" />
                         <span className="text-white font-bold opacity-80">{item}</span>
                      </div>
                   ))}
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "Sydney", time: "10 PM - 7 AM GMT" },
                  { name: "Tokyo", time: "12 AM - 9 AM GMT" },
                  { name: "London", time: "8 AM - 5 PM GMT" },
                  { name: "New York", time: "1 PM - 10 PM GMT" },
                ].map((s, i) => (
                   <motion.div key={s.name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                     className="hyip-card-dark flex flex-col items-center justify-center p-8 text-center"
                   >
                     <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] mb-4 border border-[#D4AF37]/20">
                        <Globe className="w-6 h-6" />
                     </div>
                     <h4 className="font-black text-white text-lg mb-1">{s.name}</h4>
                     <p className="text-[#D4AF37] text-xs font-bold">{s.time}</p>
                   </motion.div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* Safety & Compliance - Gray to Dark Gradient CTA */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-24 lg:py-32" id="safety">
        <div className="container mx-auto px-6 text-center max-w-4xl mx-auto">
           <Lock className="w-16 h-16 text-[#D4AF37] mx-auto mb-10" />
           <h2 className="title-hyip text-gray-900 mb-8">Your Safety is Our <span className="text-[#D4AF37]">Top Priority</span></h2>
           <p className="p-hyip mb-12 text-lg">
              We employ segregated bank accounts and advanced financial monitoring 
              to ensure your capital is protected and always available within regulatory guidelines.
           </p>
           <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link to="/register" className="btn-gold !px-12 flex items-center justify-center gap-2 shadow-2xl">Create Trading Account <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/contact" className="border-2 border-gray-200 text-gray-600 font-bold uppercase tracking-widest text-xs py-4 px-12 rounded hover:bg-gray-900 hover:text-white transition-all">Contact Expert</Link>
           </div>
        </div>
      </section>
    </PublicLayout>
  );
}
