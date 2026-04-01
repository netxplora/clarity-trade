import PublicLayout from "@/components/layouts/PublicLayout";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Bitcoin, Zap, TrendingUp, BarChart3, Lock, Coins, ArrowRight, CheckCircle2,
  Globe, Clock, LineChart, Shield, ArrowUpRight
} from "lucide-react";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";

const cryptoAssets = [
  { name: "Bitcoin", symbol: "BTC", price: "$64,281", change: "+5.24%", up: true, marketCap: "$1.26T" },
  { name: "Ethereum", symbol: "ETH", price: "$3,421", change: "+3.12%", up: true, marketCap: "$411B" },
  { name: "Solana", symbol: "SOL", price: "$142.80", change: "+8.67%", up: true, marketCap: "$63B" },
  { name: "BNB", symbol: "BNB", price: "$584.20", change: "-1.34%", up: false, marketCap: "$87B" },
];

const benefits = [
  { icon: Zap, title: "Lightning Fast Execution", desc: "Execute trades in under 10ms with our institutional-grade trading system." },
  { icon: Lock, title: "Cold Storage Security", desc: "98% of assets stored in air-gapped cold wallets insured against breaches." },
  { icon: TrendingUp, title: "Leverage Up to 100x", desc: "Trade with up to 100x leverage on select pairs with advanced risk controls." },
  { icon: Coins, title: "150+ Trading Pairs", desc: "Access majors, altcoins, stablecoins, and emerging tokens easily." },
];

export default function Crypto() {
  return (
    <PublicLayout title="Crypto Trading">
      <PublicPageHeader 
        label="CRYPTO TRADING"
        title="Trade Crypto with Confidence"
        description="Access 150+ crypto trading pairs with institutional liquidity, tight spreads, and advanced charting tools. From Bitcoin to the latest altcoins — all in one platform."
        icon={Bitcoin}
        image="/images/crypto-hero.png"
      />

      {/* Live Market Preview */}
      <section className="section-bg-white" id="prices">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
            <span className="heading-gold">Live Market Data</span>
            <h2 className="title-hyip text-gray-900">Real-Time Crypto Prices</h2>
            <p className="p-hyip">Check the latest movements in the top cryptocurrency markets.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
             {cryptoAssets.map((asset, i) => (
                <motion.div key={asset.symbol} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="hyip-card group"
                >
                  <div className="flex items-center justify-between mb-4">
                     <div className="w-10 h-10 rounded bg-[#D4AF37]/10 flex items-center justify-center font-black text-xs text-[#D4AF37]">
                        {asset.symbol}
                     </div>
                     <div className={`text-xs font-bold ${asset.up ? 'text-green-500' : 'text-red-500'}`}>
                        {asset.change}
                     </div>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-1">{asset.name}</h3>
                  <div className="text-xl font-bold text-gray-800 tabular-nums mb-4">{asset.price}</div>
                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                     <span className="text-[10px] uppercase font-bold text-gray-400">Cap: {asset.marketCap}</span>
                     <Link to="/auth/register" className="text-[#D4AF37] hover:scale-110 transition-transform"><ArrowUpRight className="w-4 h-4" /></Link>
                  </div>
                </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-bg-light" id="benefits">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-3xl mx-auto mb-16">
            <span className="heading-gold">Why Choose Us?</span>
            <h2 className="title-hyip text-gray-900">Institutional-Grade Crypto Infrastructure</h2>
            <p className="p-hyip">
              We aggregate liquidity from the world's deepest crypto pools, giving you tighter spreads, 
              faster execution, and zero slippage on major pairs.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {benefits.map((item, i) => (
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

      {/* Educational Section - Half-Dark Split */}
      <section className="bg-white overflow-hidden py-0">
        <div className="flex flex-col lg:flex-row items-stretch">
          <div className="lg:w-1/2 p-20 lg:p-32 flex flex-col justify-center bg-[#F5F5F5]">
             <span className="heading-gold">Learn & Earn</span>
             <h2 className="title-hyip text-gray-900 !text-left">New to Crypto Trading?</h2>
             <p className="p-hyip mb-10 !text-left">We provide all the tools for beginners to start their journey safely.</p>
             <div className="space-y-6 mb-12">
                {[
                  "Interactive blockchain tutorials",
                  "Demo accounts with $100K virtual funds",
                  "Daily market analyst reports",
                  "24/7 priority crypto support",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-4">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <span className="text-gray-700 font-bold text-base">{item}</span>
                  </div>
                ))}
             </div>
             <div>
                <Link to="/auth/register" className="btn-gold !px-12">Open Demo Account</Link>
             </div>
          </div>
          <div className="lg:w-1/2 min-h-[400px] relative">
             <img 
               src="/images/crypto-coins.png" 
               alt="Crypto Education" 
               className="absolute inset-0 w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-[#0B0F14]/20" />
          </div>
        </div>
      </section>

      {/* Final CTA - Dark */}
      <section className="section-bg-dark text-center" id="cta">
        <div className="container mx-auto px-6">
           <div className="max-w-4xl mx-auto">
             <Shield className="w-16 h-16 text-[#D4AF37] mx-auto mb-10" />
             <h2 className="title-hyip text-white mb-8">Ready to Access Digital <br className="hidden md:block" /> <span className="text-[#D4AF37]">Wealth?</span></h2>
             <p className="p-hyip-dark mb-12 text-lg">
                Join thousands of traders choosing Clarity Trade for their digital asset management. 
                Secure, transparent, and built for your financial success.
             </p>
             <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link to="/auth/register" className="btn-gold !px-12 flex items-center justify-center gap-2">Start Trading Now <ArrowRight className="w-4 h-4" /></Link>
                <Link to="/contact" className="btn-gold-outline !px-12 flex items-center justify-center">Talk to Support</Link>
             </div>
           </div>
        </div>
      </section>
    </PublicLayout>
  );
}
